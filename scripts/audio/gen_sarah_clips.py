"""Tạo clip giọng Sarah (Kokoro af_sarah, chạy local) cho đúng các khoá từ đã có ở giọng Adam.

Đầu vào: public/audio/words/adam/index.json (chuỗi → tên tệp mp3). Dùng cùng tên tệp với Adam.
Đầu ra:  public/audio/words/sarah/<tên tệp>.mp3 và index.json cùng cấu trúc.

Chạy lại được: clip đã có trong index thì bỏ qua. Biến môi trường:
  LIMIT=3        chỉ làm N clip (để thử)
  FFMPEG=...     đường dẫn ffmpeg nếu không có trong PATH
"""

import json
import os
import shutil
import subprocess
from pathlib import Path

import soundfile as sf
from kokoro_onnx import Kokoro

ROOT = Path(__file__).resolve().parents[2]
MODELS = Path(r"D:\Claude\stickman-pipeline\models")
FFMPEG = os.environ.get("FFMPEG") or shutil.which("ffmpeg") or r"C:\Users\admin\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1.2-full_build\bin\ffmpeg.exe"
VOICE = "af_sarah"
SRC = ROOT / "public/audio/words/adam"
OUT = ROOT / "public/audio/words/sarah"
LIMIT = int(os.environ.get("LIMIT", "0") or 0)


def load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}


def save(path: Path, data: dict) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=0), encoding="utf-8")


def main() -> None:
    src = load(SRC / "index.json")
    OUT.mkdir(parents=True, exist_ok=True)
    index_path = OUT / "index.json"
    index = load(index_path)
    todo = [(text, name) for text, name in src.items() if index.get(text) != name or not (OUT / name).exists()]
    if LIMIT:
        todo = todo[:LIMIT]
    print(f"sarah words: {len(todo)} clip cần tạo", flush=True)
    if not todo:
        return
    kokoro = Kokoro(str(MODELS / "kokoro-v1.0.onnx"), str(MODELS / "voices-v1.0.bin"))
    for n, (text, name) in enumerate(todo, 1):
        samples, rate = kokoro.create(text, voice=VOICE, speed=1.0, lang="en-us")
        wav = OUT / (Path(name).stem + ".wav")
        sf.write(wav, samples, rate)
        subprocess.run(
            [FFMPEG, "-y", "-loglevel", "error", "-i", str(wav), "-codec:a", "libmp3lame", "-b:a", "64k", str(OUT / name)],
            check=True,
        )
        wav.unlink()
        index[text] = name
        if n % 50 == 0:
            save(index_path, index)
            print(f"  sarah words: {n}/{len(todo)}", flush=True)
    save(index_path, index)
    print(f"sarah words: xong, index {len(index)} khoá", flush=True)


if __name__ == "__main__":
    main()
