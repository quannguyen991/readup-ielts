"""Transcribe full-test Cambridge listening MP3s locally to find Part boundaries.

Output stays under .local-private/ielts-ocr (git-ignored). Usage:
    python scripts/ielts/transcribe-cam-audio.py cambridge21-listening-test1.mp3
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

from faster_whisper import WhisperModel

ROOT = Path(__file__).resolve().parents[2]
PRIVATE = ROOT / ".local-private" / "ielts-ocr"
OUT_DIR = PRIVATE / "audio-asr"


def main(names: list[str]) -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    model = WhisperModel("small.en", device="cpu", compute_type="int8")
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for name in names:
        source = PRIVATE / name
        segments, info = model.transcribe(str(source), language="en", beam_size=1, vad_filter=True, word_timestamps=True)
        rows = []
        for seg in segments:
            words = [{"start": round(w.start, 2), "end": round(w.end, 2), "word": w.word.strip()} for w in (seg.words or [])]
            rows.append({"start": round(seg.start, 2), "end": round(seg.end, 2), "text": seg.text.strip(), "words": words})
        target = OUT_DIR / (Path(name).stem + ".json")
        target.write_text(json.dumps({"duration": info.duration, "segments": rows}, ensure_ascii=False, indent=1), encoding="utf-8")
        print(f"{name}: {len(rows)} segments, {info.duration:.0f}s -> {target}", flush=True)


if __name__ == "__main__":
    main(sys.argv[1:])
