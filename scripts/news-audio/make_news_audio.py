"""Báo nói: đọc một bài báo VOA Learning English bằng Gemini TTS, đoạn nào một lượt gọi.

    python scripts/news-audio/make_news_audio.py <id> [<id> ...] [--voice Aoede] [--force]

VÌ SAO ĐỌC TỪNG ĐOẠN, KHÔNG ĐỌC CẢ BÀI MỘT LƯỢT
- Biết chính xác đoạn nào bắt đầu và kết thúc ở giây thứ mấy, vì độ dài PCM đo được
  từ số mẫu. Không cần căn chữ bằng Whisper như video (xem giong-google-gemini-tts).
- Gói miễn phí giới hạn 3 lượt/phút mỗi mô hình, nên mỗi đoạn một lượt và nghỉ giữa các lượt.

CHI PHÍ
- Mỗi đoạn được cache ở tmp/news-audio/<id>/<số>.pcm. Chạy lại không tốn lượt nào cho
  đoạn đã có. Dùng --force để làm lại từ đầu.
- Lời đọc chỉ gồm chữ của bài. Không gửi kèm chỉ dẫn phong cách, vì mô hình sẽ đọc luôn
  câu chỉ dẫn đó.

ĐẦU RA
- public/audio/news/<id>.mp3          âm thanh cả bài, 64 kbps mono
- public/audio/news/<id>.json         tiêu đề, chuyên mục, trình độ và mốc từng đoạn
- public/audio/news/index.json        danh sách các bài đã có âm thanh
"""
import sys, json, glob, base64, pathlib, subprocess, time, urllib.request, urllib.error, re

sys.stdout.reconfigure(encoding="utf-8")

ROOT = pathlib.Path(__file__).resolve().parents[2]
KEY = pathlib.Path("D:/Claude/.secrets/google-api.key").read_text(encoding="utf-8").strip()
MODEL = "gemini-3.1-flash-tts-preview"
RATE = 24000          # Gemini trả PCM 16-bit mono 24 kHz
GAP_SEC = 0.35        # khoảng lặng giữa hai đoạn
GAP_CALL = 21         # giây nghỉ giữa các lượt gọi (3 lượt/phút)

args = sys.argv[1:]
FORCE = "--force" in args
VOICE = args[args.index("--voice") + 1] if "--voice" in args else "Aoede"
ids = [a for i, a in enumerate(args) if not a.startswith("--") and (i == 0 or args[i - 1] not in ("--voice",))]

LIB = ROOT / "src/data/seed/audio-library"
OUT = ROOT / "public/audio/news"
CACHE = ROOT / "tmp/news-audio"

index = {x["id"]: x for x in json.loads((LIB / "index.json").read_text(encoding="utf-8"))}
transcripts = {}
for f in sorted(glob.glob(str(LIB / "transcripts/chunk-*.json"))):
    transcripts.update(json.loads(pathlib.Path(f).read_text(encoding="utf-8")))


def sach(s):
    """Dọn chữ của bài: bỏ ngoặc vuông chú thích, gom khoảng trắng."""
    s = s.replace("[", "").replace("]", "")
    return re.sub(r"\s+", " ", s).strip()


def ten_bai(s):
    # Dữ liệu seed có ký tự thay thế (U+FFFD) thay cho dấu nháy trong tiêu đề.
    s = s.replace(" \ufffd ", " \u2013 ")
    s = s.replace("\ufffd" + "s", "\u2019s")
    out, mo = [], True
    for ch in s:
        if ch == "\ufffd":
            out.append("\u201c" if mo else "\u201d")
            mo = not mo
        else:
            out.append(ch)
    return "".join(out)


def goi_tts(text):
    body = {
        "contents": [{"parts": [{"text": text}]}],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": VOICE}}},
        },
    }
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={KEY}"
    for lan in range(6):
        try:
            rq = urllib.request.Request(url, json.dumps(body).encode(), {"Content-Type": "application/json"})
            d = json.load(urllib.request.urlopen(rq, timeout=300))
            part = d["candidates"][0]["content"]["parts"][0]["inlineData"]
            return base64.b64decode(part["data"])
        except urllib.error.HTTPError as e:
            msg = e.read().decode("utf-8", "ignore")
            if e.code == 429 and "PerDay" in msg:
                raise SystemExit("Hết lượt trong ngày của " + MODEL)
            if e.code in (429, 500, 503):
                wait = 30 + lan * 20
                print(f"  {e.code}, chờ {wait}s", flush=True)
                time.sleep(wait)
                continue
            raise SystemExit(msg[:600])
    raise SystemExit("Gemini TTS không trả tiếng sau nhiều lần thử")


def lam_bai(bai_id):
    meta = index[bai_id]
    doan = [sach(p) for p in transcripts[bai_id]["paragraphs"]]
    doan = [p for p in doan if p]
    cache = CACHE / bai_id
    cache.mkdir(parents=True, exist_ok=True)
    pcm_parts, moc, t = [], [], 0.0
    gap = b"\x00\x00" * int(RATE * GAP_SEC)
    last_call = 0.0

    for i, text in enumerate(doan):
        f = cache / f"{i:03d}.pcm"
        if FORCE or not f.exists():
            wait = GAP_CALL - (time.time() - last_call)
            if last_call and wait > 0:
                time.sleep(wait)
            print(f"  [{bai_id}] đoạn {i + 1}/{len(doan)} ({len(text)} ký tự)", flush=True)
            f.write_bytes(goi_tts(text))
            last_call = time.time()
        pcm = f.read_bytes()
        sec = len(pcm) / 2 / RATE
        moc.append({"text": text, "start": round(t, 2), "end": round(t + sec, 2)})
        pcm_parts.append(pcm)
        t += sec
        if i < len(doan) - 1:
            pcm_parts.append(gap)
            t += GAP_SEC

    raw = cache / "all.pcm"
    raw.write_bytes(b"".join(pcm_parts))
    OUT.mkdir(parents=True, exist_ok=True)
    mp3 = OUT / f"{bai_id}.mp3"
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-f", "s16le", "-ar", str(RATE), "-ac", "1", "-i", str(raw),
         "-codec:a", "libmp3lame", "-b:a", "64k", str(mp3)],
        check=True,
    )
    manifest = {
        "id": bai_id,
        "title": ten_bai(meta["title"]),
        "program": meta["program"],
        "level": meta["level"],
        "topic": meta["topic"],
        "voice": VOICE,
        "model": MODEL,
        "duration": round(t, 2),
        "audio": f"/audio/news/{bai_id}.mp3",
        "paragraphs": moc,
    }
    (OUT / f"{bai_id}.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"  xong {bai_id}: {t:.1f}s, {len(doan)} đoạn", flush=True)
    return manifest


def cap_nhat_index():
    """Gom mọi bài đã có âm thanh vào một danh sách để app khỏi quét thư mục."""
    rows = []
    for f in sorted(OUT.glob("voa-*.json")):
        m = json.loads(f.read_text(encoding="utf-8"))
        rows.append({k: m[k] for k in ("id", "title", "program", "level", "topic", "duration", "voice")})
    (OUT / "index.json").write_text(json.dumps(rows, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"index.json: {len(rows)} bài")


if __name__ == "__main__":
    if not ids:
        raise SystemExit(__doc__)
    for bai in ids:
        if bai not in index or bai not in transcripts:
            raise SystemExit(f"Không có bài {bai} trong thư viện nghe")
        lam_bai(bai)
    cap_nhat_index()
