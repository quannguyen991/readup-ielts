"""Cut one full-test Cambridge listening MP3 into its four parts.

Reads the word-level transcript written by transcribe-cam-audio.py, finds the
spoken part announcements ("Part two.") and the "end of part N" lines, then
cuts the MP3 with ffmpeg (stream copy, so no quality loss).

Where ASR drops a spoken announcement, the start is taken from, in order:
  1. a "You will hear" that follows a long pause (the check time before the part);
  2. a long pause with no transcribed speech inside it.
Anything else stops the run so the boundary can be checked by hand.

Usage:
    python scripts/ielts/cut-listening-parts.py cambridge17-listening-test1 [more stems ...]

Writes <stem>-part1.mp3 … <stem>-part4.mp3 next to the source file and
<stem>.parts.json with the chosen boundaries and how each start was found.
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PRIVATE = ROOT / ".local-private" / "ielts-ocr"
ASR = PRIVATE / "audio-asr"

# Cambridge books say "Part"; the Actual Test volumes say "Section".
PART_WORDS = {"part", "section"}
NUMBER_WORDS = {1: {"1", "one"}, 2: {"2", "two"}, 3: {"3", "three"}, 4: {"4", "four"}}
MIN_PART_SECONDS = 240
MAX_PART_SECONDS = 720
PRE_PAD = 0.3
POST_PAD = 0.5
FALLBACK_LEAD = 2.0
PAUSE_MIN_SECONDS = 15
PAUSE_BEFORE_HEAR_SECONDS = 30
SILENT_GAP_MIN_SECONDS = 20


def norm(word: str) -> str:
    return re.sub(r"[^a-z0-9]", "", word.lower())


def flatten(segments: list[dict]) -> list[dict]:
    words: list[dict] = []
    for seg in segments:
        for w in seg.get("words") or []:
            token = norm(w["word"])
            if token:
                words.append({"t": token, "start": w["start"], "end": w["end"]})
    return words


def find_start(words: list[dict], part: int, after: float) -> int | None:
    """Index of the 'part' token that announces this part, not a reference to it."""
    for i in range(len(words) - 1):
        if words[i]["t"] not in PART_WORDS or words[i + 1]["t"] not in NUMBER_WORDS[part]:
            continue
        if words[i]["start"] <= after:
            continue
        before = [w["t"] for w in words[max(0, i - 4):i]]
        # "Now turn to part two", "check your answers to part two", "end of part two"
        if "turn" in before[-2:]:
            continue
        if "to" in before[-1:] and "answers" in before:
            continue
        if "of" in before[-1:] and "end" in before:
            continue
        return i
    return None


def find_end(words: list[dict], part: int) -> int | None:
    for i in range(len(words) - 3):
        if words[i]["t"] == "end" and words[i + 1]["t"] == "of" and words[i + 2]["t"] in PART_WORDS:
            if words[i + 3]["t"] in NUMBER_WORDS[part]:
                return i + 3
    return None


def pauses(source: Path) -> list[tuple[float, float]]:
    """Silences of at least PAUSE_MIN_SECONDS as (start, end) pairs."""
    result = subprocess.run(
        ["ffmpeg", "-hide_banner", "-nostats", "-i", str(source),
         "-af", f"silencedetect=noise=-35dB:d={PAUSE_MIN_SECONDS}", "-f", "null", "-"],
        capture_output=True, text=True, encoding="utf-8", errors="replace",
    )
    starts = [float(m) for m in re.findall(r"silence_start: ([\d.]+)", result.stderr)]
    ends = [float(m) for m in re.findall(r"silence_end: ([\d.]+)", result.stderr)]
    return list(zip(starts, ends))


def hear_after_pause(words: list[dict], silence: list[tuple[float, float]], cursor: float) -> int | None:
    """'You will hear' in the allowed window that a long pause ends just before."""
    for i in range(len(words) - 2):
        hear = words[i]["start"]
        if hear < cursor + MIN_PART_SECONDS or hear > cursor + MAX_PART_SECONDS:
            continue
        if words[i]["t"] != "you" or words[i + 1]["t"] != "will" or words[i + 2]["t"] != "hear":
            continue
        if any(hear - PAUSE_BEFORE_HEAR_SECONDS <= end <= hear + 1 for _, end in silence):
            return i
    return None


def silent_gap(words: list[dict], silence: list[tuple[float, float]], cursor: float) -> tuple[float, float] | None:
    """First long pause, in the allowed window, with no transcribed speech inside it."""
    for start, end in silence:
        if start < cursor + MIN_PART_SECONDS or end > cursor + MAX_PART_SECONDS:
            continue
        if end - start < SILENT_GAP_MIN_SECONDS:
            continue
        if any(start < w["start"] < end for w in words):
            continue
        return start, end
    return None


def cut(stem: str) -> None:
    transcript_path = ASR / f"{stem}.json"
    if not transcript_path.exists():
        raise SystemExit(f"{stem}: no transcript at {transcript_path}")
    data = json.loads(transcript_path.read_text(encoding="utf-8"))
    words = flatten(data["segments"])
    duration = float(data["duration"])
    source = PRIVATE / f"{stem}.mp3"
    silence = pauses(source)

    starts: list[float] = []
    pause_before: list[float | None] = []  # start of the check pause before each part
    how: list[str] = []
    cursor = 0.0
    for part in range(1, 5):
        start_index = find_start(words, part, cursor)
        pause_start: float | None = None
        if start_index is not None:
            start = max(0.0, words[start_index]["start"] - PRE_PAD)
            how.append("announcement")
        else:
            hear = hear_after_pause(words, silence, cursor)
            if hear is not None:
                start = max(0.0, words[hear]["start"] - FALLBACK_LEAD)
                how.append("pause+hear")
            else:
                gap = silent_gap(words, silence, cursor)
                if gap is None:
                    raise SystemExit(f"{stem}: no announcement, pause or 'You will hear' found for part {part}; check by hand")
                pause_start, pause_end = gap
                start = max(0.0, pause_end - PRE_PAD)
                how.append("silent pause")
            print(f"{stem}: part {part} announcement missing, start from {how[-1]} at {start:.1f}s", flush=True)
        if starts and start - starts[-1] < MIN_PART_SECONDS:
            raise SystemExit(f"{stem}: part {part} starts too soon after part {part - 1}")
        starts.append(start)
        pause_before.append(pause_start)
        cursor = start

    spoken_ends: list[float | None] = []
    for part in range(1, 5):
        idx = find_end(words, part)
        spoken_ends.append(words[idx]["end"] + POST_PAD if idx is not None else None)

    ends: list[float] = []
    for part in range(3):
        upper = starts[part + 1] - PRE_PAD
        next_pause = pause_before[part + 1]
        # Without a spoken "end of part N", stop where the check pause begins.
        fallback = min(upper, next_pause + POST_PAD) if next_pause is not None else upper
        spoken = spoken_ends[part]
        if spoken is not None and starts[part] < spoken <= upper + 60:
            ends.append(min(spoken, upper))
        else:
            ends.append(fallback)
    spoken = spoken_ends[3]
    ends.append(min(spoken, duration) if spoken is not None else duration)

    plan = []
    for part in range(4):
        length = ends[part] - starts[part]
        plan.append({
            "part": part + 1, "start": round(starts[part], 2), "end": round(ends[part], 2),
            "seconds": round(length, 1), "start_from": how[part],
        })
        if not (MIN_PART_SECONDS <= length <= MAX_PART_SECONDS):
            raise SystemExit(f"{stem}: part {part + 1} length {length:.0f}s is outside the expected range; check by hand")

    for row in plan:
        out = PRIVATE / f"{stem}-part{row['part']}.mp3"
        subprocess.run(
            ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
             "-i", str(source), "-ss", str(row["start"]), "-to", str(row["end"]), "-c", "copy", str(out)],
            check=True,
        )
        print(f"{out.name}: {row['start']}s -> {row['end']}s ({row['seconds']}s, {row['start_from']})", flush=True)

    (ASR / f"{stem}.parts.json").write_text(json.dumps({"stem": stem, "parts": plan}, indent=1), encoding="utf-8")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    for name in sys.argv[1:]:
        cut(name)
