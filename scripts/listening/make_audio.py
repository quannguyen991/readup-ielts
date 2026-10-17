"""Sinh âm thanh cho một section Listening bằng Gemini TTS (một lần gọi cho cả section), đổi sang mp3 và ước mốc thời gian từng lượt nói.
python make_audio.py <section.json> <out.mp3> [--voices "Tên1=Kore,Tên2=Charon"] [--model gemini-2.5-flash-preview-tts] [--reuse]
- Khoá đọc từ D:/Claude/.secrets/google-api.key (không nằm trong mã).
- Gói miễn phí ~10 lượt/ngày mỗi mô hình → mỗi section đúng MỘT lượt.
- Ghi <out>.timings.json: [[start,end], ...] theo từng lượt trong transcript (căn theo khoảng lặng gần nhất)."""
import sys, json, base64, time, pathlib, subprocess, urllib.request, urllib.error, re, io, wave

sys.stdout.reconfigure(encoding="utf-8")
KEY = pathlib.Path("D:/Claude/.secrets/google-api.key").read_text().strip()
args = sys.argv[1:]
src, out = pathlib.Path(args[0]), pathlib.Path(args[1])
opt = lambda name, default=None: args[args.index(name) + 1] if name in args else default
MODEL = opt("--model", "gemini-2.5-flash-preview-tts")
VOICES = dict(p.split("=") for p in opt("--voices", "").split(",") if p)
sec = json.loads(src.read_text(encoding="utf-8"))
turns = sec["transcript"]
speakers = []
for t in turns:
    sp = t.get("speaker") or "Speaker"
    if sp not in speakers:
        speakers.append(sp)
DEFAULT = ["Aoede", "Charon", "Puck", "Zephyr"]
for i, sp in enumerate(speakers):
    VOICES.setdefault(sp, DEFAULT[i % len(DEFAULT)])
clean = lambda s: re.sub(r"\s+", " ", s.replace("\u2019", "'")).strip()


def tts(text, multi):
    cfg = {"responseModalities": ["AUDIO"]}
    if multi:
        cfg["speechConfig"] = {"multiSpeakerVoiceConfig": {"speakerVoiceConfigs": [
            {"speaker": sp, "voiceConfig": {"prebuiltVoiceConfig": {"voiceName": VOICES[sp]}}} for sp in speakers]}}
    else:
        cfg["speechConfig"] = {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": VOICES[speakers[0]]}}}
    body = {"contents": [{"parts": [{"text": text}]}], "generationConfig": cfg}
    for lan in range(6):
        try:
            rq = urllib.request.Request(f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={KEY}",
                                        json.dumps(body).encode(), {"Content-Type": "application/json"})
            d = json.load(urllib.request.urlopen(rq, timeout=900))
            print("  usage:", d.get("usageMetadata"))
            p = d["candidates"][0]["content"]["parts"][0]["inlineData"]
            b = base64.b64decode(p["data"])
            if b[:4] != b"RIFF":
                o = io.BytesIO(); w = wave.open(o, "wb"); w.setnchannels(1); w.setsampwidth(2); w.setframerate(24000); w.writeframes(b); w.close(); b = o.getvalue()
            return b
        except urllib.error.HTTPError as e:
            msg = e.read().decode("utf-8", "ignore")
            if e.code == 429 and "PerDay" in msg:
                raise SystemExit("Hết lượt trong ngày của " + MODEL)
            if e.code in (429, 500, 503):
                wait = 20 + lan * 20; print(f"  {e.code}, chờ {wait}s"); time.sleep(wait); continue
            raise SystemExit(msg[:600])
    raise SystemExit("Gemini TTS không trả tiếng")


out.parent.mkdir(parents=True, exist_ok=True)
wav = out.with_suffix(".wav")
if "--reuse" not in args or not wav.exists():
    if len(speakers) == 1:
        text = "\n\n".join(clean(t["text"]) for t in turns)
        wav.write_bytes(tts(text, False))
    else:
        text = "\n".join(f"{t.get('speaker') or speakers[0]}: {clean(t['text'])}" for t in turns)
        wav.write_bytes(tts(text, True))
dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(wav)], capture_output=True, text=True).stdout)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(wav), "-ac", "1", "-ar", "24000", "-b:a", "56k", str(out)], check=True)
# ước mốc từng lượt: tỉ lệ số chữ, rồi dán vào khoảng lặng dài gần nhất
log = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(wav), "-af", "silencedetect=noise=-38dB:d=0.25", "-f", "null", "-"], capture_output=True, text=True).stderr
starts = [float(x) for x in re.findall(r"silence_start: ([0-9.]+)", log)]
ends = [float(x) for x in re.findall(r"silence_end: ([0-9.]+)", log)]
sil = [((a + b) / 2, b - a) for a, b in zip(starts, ends)]
words = [len(clean(t["text"]).split()) for t in turns]
tot = sum(words)
bounds, acc = [0.0], 0
for w in words[:-1]:
    acc += w
    est = dur * acc / tot
    near = [(abs(m - est), -d, m) for m, d in sil if abs(m - est) < dur * 0.06]
    bounds.append(min(near)[2] if near else est)
bounds.append(dur)
timings = [[round(bounds[i], 2), round(bounds[i + 1], 2)] for i in range(len(turns))]
out.with_suffix(".timings.json").write_text(json.dumps({"durationSec": round(dur, 1), "timings": timings}), encoding="utf-8")
print(f"{out.name}: {dur:.1f}s, {out.stat().st_size // 1024} KB, voices {VOICES}")
