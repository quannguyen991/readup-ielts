"""Tạo clip giọng Adam (Kokoro, chạy local) cho đúng các khoá đã có ở giọng Aoede.

Đầu vào: public/audio/{words,lines}/aoede/index.json (chuỗi → tên tệp mp3).
Đầu ra:  public/audio/{words,lines}/adam/<tên tệp>.mp3 và index.json cùng cấu trúc.

Chạy lại được: clip đã có trong index thì bỏ qua. Biến môi trường:
  LIMIT=3        chỉ làm N clip mỗi bộ (để thử)
  FFMPEG=...     đường dẫn ffmpeg nếu không có trong PATH
"""

import hashlib
import json
import os
import re
import shutil
import subprocess
from pathlib import Path

import soundfile as sf
from kokoro_onnx import Kokoro

ROOT = Path(__file__).resolve().parents[2]
MODELS = Path(r"D:\Claude\stickman-pipeline\models")
FFMPEG = os.environ.get("FFMPEG") or shutil.which("ffmpeg") or r"C:\Users\admin\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1.2-full_build\bin\ffmpeg.exe"
VOICE = "am_adam"
SETS = [ROOT / "public/audio/words", ROOT / "public/audio/lines"]
LIMIT = int(os.environ.get("LIMIT", "0") or 0)


def load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}


def extra_words() -> dict:
    """Từ chưa có clip Aoede (liệt kê ở .missing-words.json): tên tệp = slug + md5 ngắn, cùng kiểu với Aoede."""
    path = ROOT / ".missing-words.json"
    if not path.exists():
        return {}
    out = {}
    for text in json.loads(path.read_text(encoding="utf-8"))["missing"]:
        slug = re.sub(r"[^a-z0-9]+", "-", text).strip("-")[:30].strip("-") or "word"
        out[text] = f"{slug}-{hashlib.md5(text.encode('utf-8')).hexdigest()[:6]}.mp3"
    return out


def save(path: Path, data: dict) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=0), encoding="utf-8")


def main() -> None:
    kokoro = Kokoro(str(MODELS / "kokoro-v1.0.onnx"), str(MODELS / "voices-v1.0.bin"))
    for base in SETS:
        src = load(base / "aoede" / "index.json")
        if base.name == "words":
            src = {**src, **extra_words()}
        out_dir = base / "adam"
        out_dir.mkdir(parents=True, exist_ok=True)
        index_path = out_dir / "index.json"
        index = load(index_path)
        todo = [(text, name) for text, name in src.items() if index.get(text) != name or not (out_dir / name).exists()]
        if LIMIT:
            todo = todo[:LIMIT]
        print(f"{base.name}: {len(todo)} clip cần tạo", flush=True)
        for n, (text, name) in enumerate(todo, 1):
            samples, rate = kokoro.create(text, voice=VOICE, speed=1.0, lang="en-us")
            wav = out_dir / (Path(name).stem + ".wav")
            sf.write(wav, samples, rate)
            subprocess.run(
                [FFMPEG, "-y", "-loglevel", "error", "-i", str(wav), "-codec:a", "libmp3lame", "-b:a", "64k", str(out_dir / name)],
                check=True,
            )
            wav.unlink()
            index[text] = name
            if n % 50 == 0:
                save(index_path, index)
                print(f"  {base.name}: {n}/{len(todo)}", flush=True)
        save(index_path, index)
        print(f"{base.name}: xong, index {len(index)} khoá", flush=True)


if __name__ == "__main__":
    main()
