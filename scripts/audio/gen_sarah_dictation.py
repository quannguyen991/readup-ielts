"""Tạo clip giọng Sarah (Kokoro af_sarah, chạy local) cho các câu của bộ chép chính tả.

Đầu vào: scripts/audio/dictation-texts.json (danh sách câu tiếng Anh, lấy từ src/data/dictation-sets*.ts).
Đầu ra:  public/audio/lines/sarah/<tên tệp>.mp3, và index.json (khoá = câu viết thường → tên tệp).

Chạy lại được: câu đã có trong index thì bỏ qua. LIMIT=N để thử.
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
VOICE = "af_sarah"
OUT = ROOT / "public/audio/lines/sarah"
LIMIT = int(os.environ.get("LIMIT", "0") or 0)


def file_name(text: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")[:30].strip("-") or "line"
    return f"{slug}-{hashlib.md5(text.encode('utf-8')).hexdigest()[:6]}.mp3"


def main() -> None:
    texts = json.loads((ROOT / "scripts/audio/dictation-texts.json").read_text(encoding="utf-8"))
    OUT.mkdir(parents=True, exist_ok=True)
    index_path = OUT / "index.json"
    index = json.loads(index_path.read_text(encoding="utf-8")) if index_path.exists() else {}
    todo = []
    for text in texts:
        key = text.lower()
        name = file_name(text)
        if index.get(key) != name or not (OUT / name).exists():
            todo.append((key, name, text))
    if LIMIT:
        todo = todo[:LIMIT]
    print(f"sarah câu chép: {len(todo)} clip cần tạo", flush=True)
    if not todo:
        return
    kokoro = Kokoro(str(MODELS / "kokoro-v1.0.onnx"), str(MODELS / "voices-v1.0.bin"))
    for n, (key, name, text) in enumerate(todo, 1):
        samples, rate = kokoro.create(text, voice=VOICE, speed=1.0, lang="en-us")
        wav = OUT / (Path(name).stem + ".wav")
        sf.write(wav, samples, rate)
        subprocess.run(
            [FFMPEG, "-y", "-loglevel", "error", "-i", str(wav), "-codec:a", "libmp3lame", "-b:a", "64k", str(OUT / name)],
            check=True,
        )
        wav.unlink()
        index[key] = name
        if n % 50 == 0:
            index_path.write_text(json.dumps(index, ensure_ascii=False, indent=0), encoding="utf-8")
            print(f"  sarah câu chép: {n}/{len(todo)}", flush=True)
    index_path.write_text(json.dumps(index, ensure_ascii=False, indent=0), encoding="utf-8")
    print(f"sarah câu chép: xong, index {len(index)} khoá", flush=True)


if __name__ == "__main__":
    main()
