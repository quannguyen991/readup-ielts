"""Sinh âm đọc từ/cụm từ cho cả app bằng Gemini TTS — MỖI LƯỢT GỌI đọc cả một lô (mặc định 100 mục) rồi cắt theo khoảng lặng.
Gói miễn phí ~10 lượt/ngày/mô hình → chạy mỗi ngày một ít; trạng thái lưu ở public/audio/words/<giọng>/index.json.
python gen_word_audio.py --voice Kore [--batch 100] [--max-requests 10] [--model gemini-3.1-flash-tts-preview] [--list]
- Đọc danh sách mục từ file words-todo.json (mảng chuỗi, đã xếp theo độ ưu tiên) do build_word_list.py sinh ra.
- Mỗi mục -> public/audio/words/<giọng>/<slug>.mp3 (mono 24k ~40kbps), index.json: {"<mục>": "<slug>.mp3"}.
- Khoá đọc từ D:/Claude/.secrets/google-api.key."""
import sys, json, base64, time, pathlib, subprocess, urllib.request, urllib.error, re, io, wave, hashlib, tempfile

sys.stdout.reconfigure(encoding="utf-8")
ROOT = pathlib.Path(__file__).resolve().parents[2]
KEY = pathlib.Path("D:/Claude/.secrets/google-api.key").read_text().strip()
args = sys.argv[1:]
opt = lambda n, d=None: args[args.index(n) + 1] if n in args else d
VOICE = opt("--voice", "Kore")
BATCH = int(opt("--batch", "100"))
MAXREQ = int(opt("--max-requests", "10"))
MODEL = opt("--model", "gemini-3.1-flash-tts-preview")
OUT = ROOT / "public" / "audio" / "words" / VOICE.lower()
OUT.mkdir(parents=True, exist_ok=True)
IDX = OUT / "index.json"
index = json.loads(IDX.read_text(encoding="utf-8")) if IDX.exists() else {}
todo_all = json.loads((pathlib.Path(__file__).parent / "words-todo.json").read_text(encoding="utf-8"))
todo = [w for w in todo_all if w not in index]
print(f"{len(index)} đã có, {len(todo)} còn lại, giọng {VOICE}, mô hình {MODEL}")
if "--list" in args:
    raise SystemExit


def slug(s):
    base = re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")[:40] or "x"
    return f"{base}-{hashlib.md5(s.encode()).hexdigest()[:6]}"


def tts(text):
    body = {"contents": [{"parts": [{"text": text}]}],
            "generationConfig": {"responseModalities": ["AUDIO"], "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": VOICE}}}}}
    for lan in range(5):
        try:
            rq = urllib.request.Request(f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={KEY}",
                                        json.dumps(body).encode(), {"Content-Type": "application/json"})
            d = json.load(urllib.request.urlopen(rq, timeout=900))
            b = base64.b64decode(d["candidates"][0]["content"]["parts"][0]["inlineData"]["data"])
            if b[:4] != b"RIFF":
                o = io.BytesIO(); w = wave.open(o, "wb"); w.setnchannels(1); w.setsampwidth(2); w.setframerate(24000); w.writeframes(b); w.close(); b = o.getvalue()
            return b
        except urllib.error.HTTPError as e:
            msg = e.read().decode("utf-8", "ignore")
            if e.code == 429 and "PerDay" in msg:
                raise SystemExit("Hết lượt trong ngày của " + MODEL)
            if e.code in (429, 500, 503):
                time.sleep(20 + lan * 20); continue
            raise SystemExit(msg[:500])
    raise SystemExit("Gemini TTS không trả tiếng")


def split(wav_path, n):
    """Cắt n mục: chọn n-1 khoảng lặng dài nhất làm ranh giới."""
    dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(wav_path)], capture_output=True, text=True).stdout)
    log = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(wav_path), "-af", "silencedetect=noise=-38dB:d=0.16", "-f", "null", "-"], capture_output=True, text=True).stderr
    st = [float(x) for x in re.findall(r"silence_start: ([0-9.]+)", log)]
    en = [float(x) for x in re.findall(r"silence_end: ([0-9.]+)", log)]
    sil = [(e - s, s, e) for s, e in zip(st, en) if s > 0.15 and e < dur - 0.05]
    if len(sil) < n - 1:
        return None, dur, len(sil)
    cuts = sorted(sorted(sil, reverse=True)[: n - 1], key=lambda x: x[1])
    segs, prev = [], 0.0
    for _, s, e in cuts:
        segs.append((prev, s + 0.12)); prev = e - 0.1
    segs.append((prev, dur))
    return segs, dur, len(sil)


CHECK = "--no-check" not in args
rejected = []
if CHECK:
    from transformers import pipeline
    ASR = pipeline("automatic-speech-recognition", model="openai/whisper-base.en", device=-1)
done_req = 0
while todo and done_req < MAXREQ:
    chunk, todo = todo[:BATCH], todo[BATCH:]
    text = "\n\n".join(f"{w}." if " " not in w or len(w.split()) > 3 else f"{w}." for w in chunk)
    print(f"yêu cầu {done_req + 1}: {len(chunk)} mục ({chunk[0]} … {chunk[-1]})")
    wav_bytes = tts(text); done_req += 1
    with tempfile.TemporaryDirectory() as td:
        raw = pathlib.Path(td) / "raw.wav"; raw.write_bytes(wav_bytes)
        RAWDIR = ROOT / "tmp-art" / "raw-words"; RAWDIR.mkdir(parents=True, exist_ok=True)
        (RAWDIR / f"{VOICE}-{int(time.time())}.wav").write_bytes(wav_bytes)
        wp = pathlib.Path(td) / "c.wav"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(raw), "-af", "loudnorm=I=-18:TP=-2:LRA=7", "-ar", "24000", "-ac", "1", str(wp)], check=True)
        segs, dur, nsil = split(wp, len(chunk))
        if segs is None:
            print(f"  ! chỉ thấy {nsil} khoảng lặng cho {len(chunk)} mục ({dur:.0f}s) — bỏ lô, để mục lại vào hàng chờ")
            continue
        for w, (a, b) in zip(chunk, segs):
            name = slug(w) + ".mp3"
            if CHECK:
                tmpwav = pathlib.Path(td) / "t.wav"
                subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{a:.3f}", "-to", f"{b:.3f}", "-i", str(wp), "-af", "adelay=700|700,apad=pad_dur=0.8", "-ar", "16000", "-ac", "1", str(tmpwav)], check=True)
                heard = re.sub(r"[^a-z ]", "", ASR(str(tmpwav), return_timestamps=True)["text"].lower()).strip()
                want = re.sub(r"[^a-z ]", "", w.lower()).strip()
                import difflib
                a_, b_ = want.replace(" ", ""), heard.replace(" ", "")
                if a_ not in b_ and difflib.SequenceMatcher(None, a_, b_).ratio() < 0.8:
                    print(f"  x {w!r} nghe ra {heard!r} - bo, de mai"); rejected.append(w); continue
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{a:.3f}", "-to", f"{b:.3f}", "-i", str(wp), "-af", "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,afade=t=in:d=0.01,afade=t=out:d=0.04",
                            "-ac", "1", "-ar", "24000", "-b:a", "40k", str(OUT / name)], check=True)
            index[w] = name
        # lưu nhật ký lô để kiểm tra về sau
        (OUT / "_batches.log").open("a", encoding="utf-8").write(json.dumps({"n": len(chunk), "dur": round(dur, 1), "first": chunk[0], "last": chunk[-1]}, ensure_ascii=False) + "\n")
    IDX.write_text(json.dumps(index, ensure_ascii=False, indent=0), encoding="utf-8")
    print(f"  xong, {len(index)} mục")
print("bi loai:", len(rejected))
print("kết thúc: còn", len([w for w in todo_all if w not in index]), "mục")
