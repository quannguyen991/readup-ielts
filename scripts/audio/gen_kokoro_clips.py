"""Tạo clip giọng Kokoro (chạy local) cho app ReadUp.

Cách dùng (chạy từ thư mục repo):
  python scripts/audio/gen_kokoro_clips.py --voice adam --kind words
  python scripts/audio/gen_kokoro_clips.py --voice sarah --kind lines
  python scripts/audio/gen_kokoro_clips.py --voice adam --kind examples
  python scripts/audio/gen_kokoro_clips.py --voice sarah --kind listening

kind:
  words     từ đơn: khoá của aoede + danh sách .missing-words.json  → public/audio/words/<voice>/
  lines     câu: khoá của aoede lines                               → public/audio/lines/<voice>/
  examples  câu ví dụ của mọi từ (.example-sentences.json)          → public/audio/lines/<voice>/
  listening transcript các phần luyện Listening (.listening-manifest.json)
            → public/listening/<test>/<voice>/s<n>.mp3 + s<n>.timings.json

Chạy lại được: khoá/tệp đã có thì bỏ qua. Biến môi trường: LIMIT=n để thử n mục.
"""

import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import time
from pathlib import Path

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

ROOT = Path(__file__).resolve().parents[2]
MODELS = Path(os.environ.get("KOKORO_MODELS") or r"D:\Claude\stickman-pipeline\models")
FFMPEG = os.environ.get("FFMPEG") or shutil.which("ffmpeg") or r"C:\Users\admin\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1.2-full_build\bin\ffmpeg.exe"
VOICES = {"adam": "am_adam", "sarah": "af_sarah"}
LIMIT = int(os.environ.get("LIMIT", "0") or 0)
GAP_SEC = 0.35


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}


def save(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    staged = path.with_name(path.name + ".pending")
    staged.write_text(json.dumps(data, ensure_ascii=False, indent=0), encoding="utf-8")
    for attempt in range(20):
        try:
            staged.replace(path)
            return
        except OSError:
            if attempt == 19:
                raise
            time.sleep(0.25)


def to_mp3(samples: np.ndarray, rate: int, out: Path, bitrate: str) -> None:
    wav = out.with_suffix(".wav")
    sf.write(wav, samples, rate)
    subprocess.run(
        [FFMPEG, "-y", "-loglevel", "error", "-i", str(wav), "-codec:a", "libmp3lame", "-b:a", bitrate, str(out)],
        check=True,
    )
    wav.unlink()


def hashed_name(text: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")[:30].strip("-") or "clip"
    return f"{slug}-{hashlib.md5(text.encode('utf-8')).hexdigest()[:6]}.mp3"


def clip_set(kokoro: Kokoro, voice: str, base: Path, pairs: dict) -> None:
    """pairs: chuỗi → tên tệp. Làm các khoá chưa có trong index."""
    out_dir = base / voice_dir_name
    out_dir.mkdir(parents=True, exist_ok=True)
    index_path = out_dir / "index.json"
    index = load(index_path)
    indexed = {
        re.sub(r"\s+", " ", t.strip().replace("’", "'").lower()): name
        for t, name in index.items()
    }
    todo = [
        (t, n)
        for t, n in pairs.items()
        if not indexed.get(re.sub(r"\s+", " ", t.strip().replace("’", "'").lower()))
        or not (out_dir / indexed[re.sub(r"\s+", " ", t.strip().replace("’", "'").lower())]).exists()
    ]
    if LIMIT:
        todo = todo[:LIMIT]
    print(f"{base.name}/{voice_dir_name}: {len(todo)} clip cần tạo", flush=True)
    for i, (text, name) in enumerate(todo, 1):
        samples, rate = kokoro.create(text, voice=voice, speed=1.0, lang="en-us")
        to_mp3(samples, rate, out_dir / name, "64k")
        index[text] = name
        if i % 50 == 0:
            save(index_path, index)
            print(f"  {base.name}/{voice_dir_name}: {i}/{len(todo)}", flush=True)
    save(index_path, index)
    print(f"{base.name}/{voice_dir_name}: xong, {len(index)} khoá", flush=True)


voice_dir_name = ""


def run_words(kokoro: Kokoro, voice: str) -> None:
    global voice_dir_name
    voice_dir_name = args.voice
    if args.words_file:
        src = {t: hashed_name(t) for t in json.loads(Path(args.words_file).read_text(encoding="utf-8"))}
    else:
        src = dict(load(ROOT / "scripts/audio/keys/aoede-words-index.json"))
        for t in load(ROOT / ".missing-words.json").get("missing", []):
            src.setdefault(t, hashed_name(t))
    clip_set(kokoro, voice, ROOT / "public/audio/words", src)


def run_lines(kokoro: Kokoro, voice: str) -> None:
    global voice_dir_name
    voice_dir_name = args.voice
    clip_set(kokoro, voice, ROOT / "public/audio/lines", load(ROOT / "scripts/audio/keys/aoede-lines-index.json"))


def run_examples(kokoro: Kokoro, voice: str) -> None:
    global voice_dir_name
    voice_dir_name = args.voice
    sentences = load(ROOT / ".example-sentences.json")
    pairs = {t: hashed_name(t) for t in sentences}
    clip_set(kokoro, voice, ROOT / "public/audio/lines", pairs)


def run_listening(kokoro: Kokoro, voice: str) -> None:
    manifest = load(ROOT / ".listening-manifest.json")
    items = manifest.get("sections", [])
    if LIMIT:
        items = items[:LIMIT]
    for item in items:
        out_dir = ROOT / "public/listening" / item["test"] / args.voice
        out_dir.mkdir(parents=True, exist_ok=True)
        mp3 = out_dir / f"s{item['n']}.mp3"
        timings_path = out_dir / f"s{item['n']}.timings.json"
        if mp3.exists() and timings_path.exists():
            continue
        parts, timings, t = [], [], 0.0
        gap = np.zeros(int(GAP_SEC * 24000), dtype=np.float32)
        rate = 24000
        for line in item["lines"]:
            samples, rate = kokoro.create(line, voice=voice, speed=1.0, lang="en-us")
            samples = np.asarray(samples, dtype=np.float32)
            dur = len(samples) / rate
            timings.append([round(t, 2), round(t + dur, 2)])
            parts.append(samples)
            parts.append(np.zeros(int(GAP_SEC * rate), dtype=np.float32))
            t += dur + GAP_SEC
        audio = np.concatenate(parts) if parts else gap
        to_mp3(audio, rate, mp3, "96k")
        save(timings_path, {"durationSec": round(len(audio) / rate, 2), "voice": args.voice, "timings": timings})
        print(f"{item['test']} s{item['n']}: {len(item['lines'])} câu, {round(len(audio) / rate, 1)} s", flush=True)


def main() -> None:
    global args
    parser = argparse.ArgumentParser()
    parser.add_argument("--voice", choices=sorted(VOICES), required=True)
    parser.add_argument("--kind", choices=["words", "lines", "examples", "listening"], required=True)
    parser.add_argument("--words-file", help="JSON array of explicit word/phrase keys for --kind words")
    args = parser.parse_args()
    kokoro = Kokoro(str(MODELS / "kokoro-v1.0.onnx"), str(MODELS / "voices-v1.0.bin"))
    kv = VOICES[args.voice]
    {"words": run_words, "lines": run_lines, "examples": run_examples, "listening": run_listening}[args.kind](kokoro, kv)


if __name__ == "__main__":
    main()
