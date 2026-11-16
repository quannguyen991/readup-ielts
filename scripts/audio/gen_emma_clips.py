"""Tạo clip giọng Emma (Kokoro bf_emma, Anh–Anh nữ, chạy local) cho đúng các khoá đã có ở giọng Sarah.

Đầu vào: public/audio/<kind>/sarah/index.json (chuỗi → tên tệp mp3). Dùng cùng tên tệp với Sarah.
Đầu ra:  public/audio/<kind>/emma/<tên tệp>.mp3 và index.json cùng cấu trúc.

  python scripts/audio/gen_emma_clips.py --kind words [--shard 0/4]
  python scripts/audio/gen_emma_clips.py --kind lines [--shard 0/4]
  python scripts/audio/gen_emma_clips.py --kind words --merge     # gộp index.shardN.json → index.json

Chạy lại được: clip đã có thì bỏ qua. Mỗi shard ghi index.shard<N>.json riêng nên chạy song song được.
Biến môi trường: LIMIT=n để thử n mục; FFMPEG=... nếu ffmpeg không có trong PATH.
"""
import argparse
import json
import os
import shutil
import subprocess
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MODELS = Path(os.environ.get("KOKORO_MODELS") or r"D:\Claude\stickman-pipeline\models")
FFMPEG = os.environ.get("FFMPEG") or shutil.which("ffmpeg") or r"C:\Users\admin\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1.2-full_build\bin\ffmpeg.exe"
VOICE = "bf_emma"
LIMIT = int(os.environ.get("LIMIT", "0") or 0)


def load(p: Path) -> dict:
    return json.loads(p.read_text(encoding="utf-8")) if p.exists() else {}


def save(p: Path, data: dict) -> None:
    tmp = p.with_name(p.name + ".tmp")
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=0), encoding="utf-8")
    tmp.replace(p)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--kind", choices=["words", "lines"], required=True)
    ap.add_argument("--shard", default="0/1")
    ap.add_argument("--merge", action="store_true")
    ap.add_argument("--reverse", action="store_true", help="làm từ cuối danh sách ngược lên (hai máy chia nhau một shard); ghi index.shard<N>r.json")
    args = ap.parse_args()
    src_dir = ROOT / "public/audio" / args.kind / "sarah"
    out = ROOT / "public/audio" / args.kind / "emma"
    out.mkdir(parents=True, exist_ok=True)

    if args.merge:
        merged = load(out / "index.json")
        for f in sorted(out.glob("index.shard*.json")):
            merged.update(load(f))
        # chỉ giữ khoá có tệp thật
        merged = {t: n for t, n in merged.items() if (out / n).exists()}
        save(out / "index.json", merged)
        print(f"{args.kind}/emma: gộp xong, {len(merged)} khoá", flush=True)
        return

    i, n = (int(x) for x in args.shard.split("/"))
    src = load(src_dir / "index.json")
    mine = [(t, name) for k, (t, name) in enumerate(src.items()) if k % n == i]
    shard_path = out / (f"index.shard{i}r.json" if args.reverse else f"index.shard{i}.json")
    if args.reverse:
        mine.reverse()
    index = load(shard_path)
    done = {t for t, name in index.items() if (out / name).exists()}
    done |= {t for t, name in load(out / "index.json").items() if (out / name).exists()}
    todo = [(t, name) for t, name in mine if t not in done]
    if LIMIT:
        todo = todo[:LIMIT]
    print(f"emma {args.kind} shard {i}/{n}: {len(todo)} clip cần tạo (đã có {len(mine) - len(todo)})", flush=True)
    if not todo:
        return

    import soundfile as sf
    from kokoro_onnx import Kokoro

    model_path, voices_path = str(MODELS / "kokoro-v1.0.onnx"), str(MODELS / "voices-v1.0.bin")
    threads = int(os.environ.get("EMMA_THREADS", "0") or 0)
    if threads:
        # Nhiều tiến trình song song mà mỗi cái dùng hết nhân CPU thì tranh nhau và chậm hơn chạy một cái;
        # giới hạn số luồng mỗi tiến trình (EMMA_THREADS=3) để tổng luồng ≈ số nhân.
        import onnxruntime as rt

        opts = rt.SessionOptions()
        opts.intra_op_num_threads = threads
        opts.inter_op_num_threads = 1
        sess = rt.InferenceSession(model_path, sess_options=opts, providers=["CPUExecutionProvider"])
        kokoro = Kokoro.from_session(sess, voices_path)
    else:
        kokoro = Kokoro(model_path, voices_path)
    tmp_dir = Path(os.environ.get("EMMA_TMP") or (Path(os.environ.get("TEMP", ".")) / "emma-wav" / f"s{i}"))
    tmp_dir.mkdir(parents=True, exist_ok=True)
    t0 = time.time()
    for c, (text, name) in enumerate(todo, 1):
        samples, rate = kokoro.create(text, voice=VOICE, speed=1.0, lang="en-gb")
        # wav tạm ngoài thư mục public: trình giám sát tệp (Metro, antivirus) khoá tệp làm unlink lỗi.
        wav = tmp_dir / (Path(name).stem + f".s{i}.wav")
        sf.write(wav, samples, rate)
        ok = False
        for _try in range(3):  # ffmpeg thỉnh thoảng chết lẻ tẻ: thử lại, hỏng hẳn thì bỏ mục này, không chết cả lượt
            r = subprocess.run(
                [FFMPEG, "-nostdin", "-y", "-loglevel", "error", "-i", str(wav), "-af", "silenceremove=start_periods=1:start_threshold=-50dB",
                 "-codec:a", "libmp3lame", "-b:a", "64k", str(out / name)],
                stdin=subprocess.DEVNULL,
            )
            if r.returncode == 0:
                ok = True
                break
            time.sleep(2)
        if not ok:
            print(f"  BỎ QUA (ffmpeg lỗi): {text[:60]}", flush=True)
            continue
        try:
            wav.unlink()
        except OSError:
            pass  # dọn sau, không để một tệp tạm làm chết cả lượt chạy
        index[text] = name
        if c % 100 == 0:
            save(shard_path, index)
            rate_s = (time.time() - t0) / c
            print(f"  shard {i}: {c}/{len(todo)}  {rate_s:.2f} s/clip", flush=True)
    save(shard_path, index)
    print(f"shard {i}: xong {len(todo)} clip trong {time.time() - t0:.0f} s", flush=True)


if __name__ == "__main__":
    main()
