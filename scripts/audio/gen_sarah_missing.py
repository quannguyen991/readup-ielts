"""Lấp các mục từ vựng chưa có clip nào (không Aoede, không Sarah) bằng Kokoro af_sarah, chạy local.

Đầu vào mặc định: tmp-art/vocab-missing-audio.json (có thể đổi bằng `MISSING_AUDIO_INPUT`).
Đầu ra:  public/audio/words/sarah/<slug>-<md5[:6]>.mp3 và cập nhật index.json (cùng quy ước tên tệp với các clip cũ).
Chạy lại được; LIMIT=3 để thử.
"""
import hashlib, json, os, re, shutil, subprocess
from pathlib import Path
import soundfile as sf
from kokoro_onnx import Kokoro

ROOT = Path(__file__).resolve().parents[2]
MODELS = Path(r"D:\Claude\stickman-pipeline\models")
FFMPEG = os.environ.get("FFMPEG") or shutil.which("ffmpeg") or r"C:\Users\admin\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1.2-full_build\bin\ffmpeg.exe"
OUT = ROOT / "public/audio/words/sarah"
MISSING_INPUT = Path(os.environ.get("MISSING_AUDIO_INPUT", str(ROOT / "tmp-art/vocab-missing-audio.json")))
LIMIT = int(os.environ.get("LIMIT", "0") or 0)
key = lambda s: re.sub(r"\s+", " ", s.strip().replace("’", "'").replace("‘", "'")).lower()

def load(p): return json.loads(p.read_text(encoding="utf-8")) if p.exists() else {}
def clip_name(text):
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")[:30].strip("-") or "clip"
    return f"{slug}-{hashlib.md5(text.encode()).hexdigest()[:6]}.mp3"

def main():
    missing = json.loads(MISSING_INPUT.read_text(encoding="utf-8"))
    idx_path = OUT / "index.json"; index = load(idx_path)
    have = {key(k) for k in index} | {key(k) for k in load(ROOT / "public/audio/lines/sarah/index.json")}
    todo = []
    recovered = 0
    for text in missing:
        if key(text) in have:
            continue
        name = clip_name(text)
        if (OUT / name).is_file():
            index[text] = name
            have.add(key(text))
            recovered += 1
        else:
            todo.append((text, name))
    if recovered:
        idx_path.write_text(json.dumps(index, ensure_ascii=False, indent=0), encoding="utf-8")
        print(f"đã khôi phục {recovered} clip có sẵn vào index", flush=True)
    if LIMIT: todo = todo[:LIMIT]
    print(f"cần tạo {len(todo)} clip", flush=True)
    if not todo: return
    k = Kokoro(str(MODELS / "kokoro-v1.0.onnx"), str(MODELS / "voices-v1.0.bin"))
    for n, (text, name) in enumerate(todo, 1):
        samples, rate = k.create(text, voice="af_sarah", speed=1.0, lang="en-us")
        wav = OUT / (Path(name).stem + ".wav"); sf.write(wav, samples, rate)
        subprocess.run([FFMPEG, "-y", "-loglevel", "error", "-i", str(wav), "-af", "silenceremove=start_periods=1:start_threshold=-50dB", "-codec:a", "libmp3lame", "-b:a", "64k", str(OUT / name)], check=True)
        wav.unlink(); index[text] = name
        if n % 25 == 0:
            idx_path.write_text(json.dumps(index, ensure_ascii=False, indent=0), encoding="utf-8"); print(f"  {n}/{len(todo)}", flush=True)
    idx_path.write_text(json.dumps(index, ensure_ascii=False, indent=0), encoding="utf-8"); print("xong", len(index), flush=True)

if __name__ == "__main__": main()
