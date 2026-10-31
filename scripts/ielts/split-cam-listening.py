"""Split one full-test Cambridge listening MP3 into Part 1-4 using spoken section markers.

Each Cambridge recording says "Part one/two/three/four" aloud at the start of a section and
"That is the end of part N" at its end. Whisper segments from transcribe-cam-audio.py give
those timestamps, and ffmpeg cuts the MP3 without re-encoding.

Usage:
    python scripts/ielts/split-cam-listening.py cambridge21-listening-test1
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PRIVATE = ROOT / ".local-private" / "ielts-ocr"
ASR_DIR = PRIVATE / "audio-asr"

START_PATTERNS = {
    1: r"turn to part (1|one)\b|(^|\. )part (1|one)\b",
    2: r"turn to part (2|two)\b|(^|\. )part (2|two)\b|you will hear",
    3: r"turn to part (3|three)\b|(^|\. )part (3|three)\b|you will hear",
    4: r"you will hear part of|turn to part (4|four)\b|(^|\. )part (4|four)\b",
}
END_PATTERNS = {
    1: r"end of part (1|one)\b",
    2: r"end of part (2|two)\b",
    3: r"end of part (3|three)\b",
    4: r"end of the listening test",
}
TAIL_SECONDS = 1.0


def find_bounds(segments: list[dict]) -> list[tuple[float, float]]:
    # Each part's intro comes after the previous part's "end of part" line. This keeps the
    # "You will hear part of a ..." sentence of Part 3 from being read as the start of Part 4.
    starts, ends = [], []
    cursor = 0
    for part in range(1, 5):
        start_index = next((i for i in range(cursor, len(segments)) if re.search(START_PATTERNS[part], segments[i]["text"], re.I)), None)
        end_index = next((i for i in range((start_index or cursor), len(segments)) if re.search(END_PATTERNS[part], segments[i]["text"], re.I)), None)
        if start_index is None or end_index is None:
            raise SystemExit(f"Part {part}: start={start_index} end={end_index} - marker not found")
        starts.append(segments[start_index]["start"])
        ends.append(segments[end_index]["end"])
        cursor = end_index + 1
    bounds = []
    for part, (start, end) in enumerate(zip(starts, ends)):
        next_start = starts[part + 1] if part + 1 < len(starts) else None
        stop = end + TAIL_SECONDS
        if next_start is not None:
            stop = min(stop, next_start)
        bounds.append((start, stop))
    return bounds


def main(stem: str) -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    data = json.loads((ASR_DIR / f"{stem}.json").read_text(encoding="utf-8"))
    bounds = find_bounds(data["segments"])
    source = PRIVATE / f"{stem}.mp3"
    for part, (start, end) in enumerate(bounds, start=1):
        target = PRIVATE / f"{stem}-part{part}.mp3"
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-ss", f"{start:.2f}", "-to", f"{end:.2f}",
             "-i", str(source), "-c", "copy", str(target)],
            check=True,
        )
        print(f"{target.name}: {start:.1f}s -> {end:.1f}s ({end - start:.0f}s)", flush=True)


if __name__ == "__main__":
    for stem in sys.argv[1:]:
        main(stem)
