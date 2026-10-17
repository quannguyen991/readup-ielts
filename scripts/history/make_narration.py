"""Thuyết minh tiếng Anh cho một nhóm cảnh lịch sử bằng Gemini TTS (MỘT lượt gọi cho cả nhóm), rồi:
  - cắt thành từng cảnh (căn bằng Whisper có mốc từng chữ, cắt ở khoảng lặng gần nhất trước câu đầu của cảnh kế);
  - ghi mốc câu THẬT (đo từ âm thanh bằng Whisper, không ước lượng theo tốc độ đọc) khi khớp đủ chữ.
python make_narration.py <topic> <scene ids cách nhau dấu phẩy> [--voice Kore] [--model gemini-3.1-flash-tts-preview] [--reuse]
Đọc ĐÚNG văn bản đã chốt: nối các đoạn EN của cảnh trong scripts/history/content/scenes_*.py (một đoạn văn mỗi cảnh).
Ra: public/history/<topic>/audio/en/<sceneId>.mp3 + <sceneId>.sentences.json + _narration-log.json (voice, model, ngày, hash văn bản).
Khoá đọc từ D:/Claude/.secrets/google-api.key. Chạy bằng D:/khkt-venv-lap/Scripts/python.exe (cần transformers)."""
import sys, json, base64, time, pathlib, subprocess, urllib.request, urllib.error, re, io, wave, hashlib, difflib, importlib.util, datetime

sys.stdout.reconfigure(encoding="utf-8")
HERE = pathlib.Path(__file__).parent
ROOT = HERE.parents[1]
args = sys.argv[1:]
topic, ids = args[0], args[1].split(",")
opt = lambda n, d=None: args[args.index(n) + 1] if n in args else d
VOICE = opt("--voice", "Aoede")
MODEL = opt("--model", "gemini-3.1-flash-tts-preview")
KEY = pathlib.Path(opt("--key-file", "D:/Claude/.secrets/google-api.key")).read_text().strip()
OUT = ROOT / "public" / "history" / topic / "audio" / "en"
OUT.mkdir(parents=True, exist_ok=True)


def load_scenes():
    scenes = {}
    for f in sorted((HERE / "content").glob("scenes_*.py")):
        spec = importlib.util.spec_from_file_location(f.stem, f)
        m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
        for s in m.SCENES:
            scenes[s["id"]] = s
    return scenes


scenes = load_scenes()
clean = lambda s: re.sub(r"\s+", " ", s.replace("\u2019", "'").replace("\u2018", "'")).strip()
texts = {i: clean(" ".join(p["en"] for p in scenes[i]["paragraphs"])) for i in ids}
script = "\n\n".join(texts[i] for i in ids)
digest = hashlib.sha1(script.encode()).hexdigest()[:12]
wav = OUT / f"_group-{ids[0]}-{ids[-1]}.wav"


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


if "--reuse" not in args or not wav.exists():
    wav.write_bytes(tts(script))
dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(wav)], capture_output=True, text=True).stdout)
print(f"nhóm {ids[0]}–{ids[-1]}: {dur:.1f}s, {len(script.split())} chữ")

# --- Whisper có mốc từng chữ
from transformers import pipeline
asr = pipeline("automatic-speech-recognition", model="openai/whisper-small.en", device=-1, chunk_length_s=30)
w16 = OUT / "_tmp16.wav"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(wav), "-ar", "16000", "-ac", "1", str(w16)], check=True)
res = asr(str(w16), return_timestamps="word")
heard = [(re.sub(r"[^a-z0-9']", "", c["text"].lower()), c["timestamp"]) for c in res["chunks"]]
heard = [(t, ts) for t, ts in heard if t and ts and ts[0] is not None]

# --- kịch bản theo từng chữ, nhớ cảnh/câu
tok = lambda s: [re.sub(r"[^a-z0-9']", "", x.lower()) for x in s.split()]
script_words = []   # (word, scene, sentence_index)
sent_list = []      # {scene, text, first_idx, last_idx}
for sid in ids:
    sents = [x for x in re.split(r"(?<=[.!?])\s+", texts[sid]) if x]
    for si, st in enumerate(sents):
        first = len(script_words)
        for w in tok(st):
            if w:
                script_words.append((w, sid, len(sent_list)))
        sent_list.append(dict(scene=sid, text=st, first=first, last=len(script_words) - 1))

sm = difflib.SequenceMatcher(None, [w for w, _, _ in script_words], [t for t, _ in heard], autojunk=False)
tmap = {}
for a, b, n in sm.get_matching_blocks():
    for k in range(n):
        tmap[a + k] = heard[b + k][1]
cover = len(tmap) / max(1, len(script_words))
print(f"khớp {len(tmap)}/{len(script_words)} chữ ({cover:.0%})")

# --- ranh giới cảnh: khoảng lặng gần mốc bắt đầu của cảnh kế
log = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(wav), "-af", "silencedetect=noise=-38dB:d=0.2", "-f", "null", "-"], capture_output=True, text=True).stderr
st = [float(x) for x in re.findall(r"silence_start: ([0-9.]+)", log)]
en = [float(x) for x in re.findall(r"silence_end: ([0-9.]+)", log)]
sils = list(zip(st, en))


def first_time(sidx):
    i = sent_list[sidx]["first"]
    for k in range(i, sent_list[sidx]["last"] + 1):
        if k in tmap:
            return tmap[k][0]
    return None


scene_start = {}
for sid in ids:
    sidx = next(i for i, s in enumerate(sent_list) if s["scene"] == sid)
    scene_start[sid] = first_time(sidx)
bounds = [0.0]
for sid in ids[1:]:
    t0 = scene_start[sid]
    if t0 is None:
        raise SystemExit(f"Không tìm được mốc đầu cảnh {sid} — kiểm tra lại bản thu")
    near = [(abs((a + b) / 2 - t0), (a + b) / 2) for a, b in sils if b <= t0 + 0.4 and a >= t0 - 3.0]
    bounds.append(min(near)[1] if near else t0 - 0.15)
bounds.append(dur)

log_info = dict(voice=VOICE, model=MODEL, date=datetime.date.today().isoformat(), scriptHash=digest, scenes=ids, coverage=round(cover, 3), duration=round(dur, 1))
for k, sid in enumerate(ids):
    a, b = bounds[k], bounds[k + 1]
    mp3 = OUT / f"{sid}.mp3"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{a:.3f}", "-to", f"{b:.3f}", "-i", str(wav), "-af", "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse",
                    "-ac", "1", "-ar", "24000", "-b:a", "56k", str(mp3)], check=True)
    # nơi bắt đầu thật của file đã cắt = mốc cảnh trừ phần lặng đã cắt đầu → đo lại bằng Whisper nhanh: dùng lệch = scene_start - a - lặng_đầu (ước từ file)
    d2 = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(mp3)], capture_output=True, text=True).stdout)
    lead = subprocess.run(["ffmpeg", "-hide_banner", "-ss", f"{a:.3f}", "-to", f"{b:.3f}", "-i", str(wav), "-af", "silencedetect=noise=-45dB:d=0.05", "-f", "null", "-"], capture_output=True, text=True).stderr
    m = re.search(r"silence_start: ([0-9.]+)\s*\n.*?silence_end: ([0-9.]+)", lead.replace("\r", ""), re.S)
    trim = float(m[2]) if m and float(m[1]) <= 0.01 else 0.0
    offset = a + trim
    sents = []
    ok = cover >= 0.85
    for i, s in enumerate(sent_list):
        if s["scene"] != sid:
            continue
        idxs = [x for x in range(s["first"], s["last"] + 1) if x in tmap]
        if len(idxs) < 0.7 * (s["last"] - s["first"] + 1):
            ok = False; break
        start = max(0.0, tmap[idxs[0]][0] - offset)
        end = min(d2, tmap[idxs[-1]][1] - offset)
        sents.append(dict(start=round(start, 2), end=round(end, 2), text=s["text"]))
    if ok:
        last_end = 0.0
        for sentence in sents:
            if sentence["start"] < last_end - 0.001 or sentence["end"] <= sentence["start"]:
                ok = False
                break
            last_end = sentence["end"]
    (OUT / f"{sid}.sentences.json").write_text(json.dumps(dict(durationSec=round(d2, 1), sentences=sents if ok else []), ensure_ascii=False), encoding="utf-8")
    print(f"  {sid}: {d2:.1f}s, câu có mốc: {len(sents) if ok else 0}")
(OUT / "_narration-log.json").write_text(json.dumps(log_info, ensure_ascii=False, indent=1), encoding="utf-8")
w16.unlink(missing_ok=True)
