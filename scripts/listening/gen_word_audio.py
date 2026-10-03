"""Sinh âm đọc từ/cụm từ cho cả app bằng Gemini TTS — MỖI LƯỢT GỌI đọc cả một lô (mặc định 100 mục) rồi cắt theo khoảng lặng.
Gói miễn phí ~10 lượt/ngày/mô hình → chạy mỗi ngày một ít; trạng thái lưu ở public/audio/words/<giọng>/index.json.
python gen_word_audio.py [--voice Aoede] [--batch 80] [--max-requests 10] [--list]
Kiểm lời nói mặc định bằng faster-whisper small.en (CPU); có thể đổi bằng --asr-model.
- Đọc danh sách mục từ file words-todo.json (mảng chuỗi, đã xếp theo độ ưu tiên) do build_word_list.py sinh ra.
- Mỗi mục -> public/audio/words/<giọng>/<slug>.mp3 (mono 24k ~40kbps), index.json: {"<mục>": "<slug>.mp3"}.
- Khoá đọc từ D:/Claude/.secrets/google-api.key."""
import sys, json, base64, time, pathlib, subprocess, urllib.request, urllib.error, re, io, wave, hashlib, tempfile
import shutil
from word_audio import align_words, split_words, render_word, validate_word

sys.stdout.reconfigure(encoding="utf-8")
ROOT = pathlib.Path(__file__).resolve().parents[2]
def _load_keys():
    """Nhiều khoá (mỗi khoá một hạn mức riêng): hết lượt khoá này thì chuyển khoá kế. Thứ tự: khoá mới trước."""
    sec = pathlib.Path("D:/Claude/.secrets")
    out = []
    f = sec / "google-api-keys.txt"
    if f.exists():
        out += [x.strip() for x in f.read_text().splitlines() if x.strip()]
    for name in ("google-api-2.key", "google-api.key"):
        p = sec / name
        if p.exists():
            out.append(p.read_text().strip())
    seen, uniq = set(), []
    for k in out:
        if k not in seen:
            seen.add(k); uniq.append(k)
    return uniq


KEYS = _load_keys()
KEY_I = 0
args = sys.argv[1:]
opt = lambda n, d=None: args[args.index(n) + 1] if n in args else d
default_voice = json.loads((ROOT / "src/data/pronunciation-voice.json").read_text(encoding="utf-8"))
VOICE = opt("--voice", default_voice["name"])
BATCH = int(opt("--batch", "100"))
MAXREQ = int(opt("--max-requests", "10"))
MODEL = opt("--model", default_voice["model"])
RECOVER_RAW = opt("--recover-raw")
TEXT_FILE = opt('--text-file')
OUT = pathlib.Path(opt('--output-dir', str(ROOT / 'public' / 'audio' / 'words' / VOICE.lower())))
OUT.mkdir(parents=True, exist_ok=True)
IDX = OUT / "index.json"
index = {word.strip().lower(): file for word, file in
         (json.loads(IDX.read_text(encoding="utf-8")) if IDX.exists() else {}).items()}
todo_all = json.loads(pathlib.Path(opt("--words-file", str(pathlib.Path(__file__).parent / "words-todo.json"))).read_text(encoding="utf-8"))
if RECOVER_RAW:
    # The WAV's saved labels are authoritative. Never relabel it with a new list.
    labels = pathlib.Path(RECOVER_RAW).with_suffix('.json')
    todo = json.loads(labels.read_text(encoding='utf-8'))
    BATCH = len(todo)
    MAXREQ = 1
else:
    todo = [w for w in todo_all if w not in index]
if TEXT_FILE and not RECOVER_RAW and len(todo) > BATCH:
    raise SystemExit('--text-file requires all pending entries to fit in one batch')
print(f"{len(index)} đã có, {len(todo)} còn lại, giọng {VOICE}, mô hình {MODEL}")
if "--list" in args:
    raise SystemExit


def slug(s):
    base = re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")[:40] or "x"
    return f"{base}-{hashlib.md5(s.encode()).hexdigest()[:6]}"


def tts(text):
    body = {"contents": [{"parts": [{"text": text}]}],
            "generationConfig": {"maxOutputTokens": 32768, "responseModalities": ["AUDIO"], "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": VOICE}}}}}
    global KEY_I
    for lan in range(8):
        try:
            if KEY_I >= len(KEYS):
                raise SystemExit("Hết lượt trong ngày của " + MODEL + " (đã thử hết " + str(len(KEYS)) + " khoá)")
            rq = urllib.request.Request(f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent",
                                        json.dumps(body).encode(), {"Content-Type": "application/json", "x-goog-api-key": KEYS[KEY_I]})
            d = json.load(urllib.request.urlopen(rq, timeout=900))
            if d.get('candidates'):
                print('  TTS finish:', d['candidates'][0].get('finishReason'), 'tokens:', d.get('usageMetadata', {}).get('candidatesTokenCount'), flush=True)
            if "candidates" not in d:
                print("  ! không có candidates:", json.dumps(d)[:200]); time.sleep(10); continue
            b = base64.b64decode(d["candidates"][0]["content"]["parts"][0]["inlineData"]["data"])
            if b[:4] != b"RIFF":
                o = io.BytesIO(); w = wave.open(o, "wb"); w.setnchannels(1); w.setsampwidth(2); w.setframerate(24000); w.writeframes(b); w.close(); b = o.getvalue()
            return b
        except urllib.error.HTTPError as e:
            msg = e.read().decode("utf-8", "ignore")
            if e.code == 429 and ("PerDay" in msg or "quota" in msg.lower()):
                print(f"  khoá #{KEY_I + 1} hết lượt hôm nay, chuyển khoá kế"); KEY_I += 1; continue
            if e.code in (400, 403) and "API key" in msg:
                print(f"  khoá #{KEY_I + 1} không dùng được ({e.code}), chuyển khoá kế"); KEY_I += 1; continue
            if e.code in (429, 500, 503):
                time.sleep(20 + lan * 20); continue
            if e.code == 400:
                print('  ! 400 INVALID_ARGUMENT cho lô này — chia nhỏ rồi thử lại'); return None
            raise SystemExit(msg[:500])
    raise SystemExit("Gemini TTS không trả tiếng")


CHECK = "--no-check" not in args
ASR_BACKEND = opt('--asr', 'faster-batch')
ASR_MODEL = opt('--asr-model', 'small.en')
rejected = []
if CHECK:
    if ASR_BACKEND in ("faster", "faster-batch"):
        from faster_whisper import WhisperModel
        ASR = WhisperModel(ASR_MODEL, device="cpu", compute_type="int8", cpu_threads=4,
                           download_root="D:/dev-cache/whisper")
        def transcribe(path):
            segments, _ = ASR.transcribe(path, language="en", beam_size=5,
                                         condition_on_previous_text=False)
            return " ".join(segment.text for segment in segments)
    else:
        from transformers import pipeline
        ASR = pipeline("automatic-speech-recognition", model="openai/whisper-base.en", device=-1)
        def transcribe(path):
            return ASR(path, return_timestamps=True)["text"]
done_req = 0
cur_batch = BATCH
while todo and done_req < MAXREQ:
    chunk, todo = todo[:cur_batch], todo[cur_batch:]
    text = pathlib.Path(TEXT_FILE).read_text(encoding='utf-8') if TEXT_FILE else ("Read each vocabulary entry exactly as written in clear, natural English. "
            "Leave one second of silence between entries. "
            "Do not add introductions, numbering, explanations, or plural endings.\n\n"
            + "\n\n".join(f"{w}." for w in chunk))
    print(f"yêu cầu {done_req + 1}: {len(chunk)} mục ({chunk[0]} … {chunk[-1]})")
    wav_bytes = pathlib.Path(RECOVER_RAW).read_bytes() if RECOVER_RAW else tts(text)
    done_req += 1
    if wav_bytes is None:
        if len(chunk) == 1:
            print(f'  ! bỏ mục {chunk[0]!r} (API từ chối)'); continue
        cur_batch = max(1, len(chunk) // 2)   # API từ chối cả lô: trả mục về hàng chờ, thử lô nhỏ hơn
        todo = chunk + todo
        continue
    with tempfile.TemporaryDirectory() as td:
        raw = pathlib.Path(td) / "raw.wav"; raw.write_bytes(wav_bytes)
        RAWDIR = ROOT / "tmp-art" / "raw-words"; RAWDIR.mkdir(parents=True, exist_ok=True)
        raw_saved = RAWDIR / f"{VOICE}-{int(time.time())}.wav"
        raw_saved.write_bytes(wav_bytes)
        raw_saved.with_suffix('.json').write_text(json.dumps(chunk, ensure_ascii=False), encoding='utf-8')
        raw_saved.with_suffix('.txt').write_text(text, encoding='utf-8')
        wp = pathlib.Path(td) / "c.wav"
        subprocess.run(["ffmpeg", "-v", "error", "-threads", "1", "-filter_threads", "1", "-y", "-i", str(raw), "-af", "loudnorm=I=-18:TP=-2:LRA=7", "-ar", "24000", "-ac", "1", str(wp)], check=True)
        segs, dur, nsil = split_words(wp, len(chunk))
        if CHECK and ASR_BACKEND == "faster-batch":
            asr_cache = pathlib.Path(RECOVER_RAW).with_suffix('.asr.json') if RECOVER_RAW else None
            cached_asr = json.loads(asr_cache.read_text(encoding='utf-8')) if asr_cache and asr_cache.exists() else None
            if isinstance(cached_asr, dict) and cached_asr.get('model') == ASR_MODEL:
                recognized_words = cached_asr['words']
            elif isinstance(cached_asr, list) and ASR_MODEL == 'base.en':
                recognized_words = cached_asr
            else:
                recognized, _ = ASR.transcribe(str(wp), language='en', beam_size=5,
                                               word_timestamps=True, condition_on_previous_text=False,
                                               no_speech_threshold=None, log_prob_threshold=None)
                recognized_words = [dict(word=w.word, start=w.start, end=w.end)
                                    for segment in recognized for w in segment.words or []]
            raw_saved.with_suffix('.asr.json').write_text(json.dumps(dict(model=ASR_MODEL, words=recognized_words)), encoding='utf-8')
            segs = align_words(chunk, recognized_words, dur)
        elif segs is None:
            # Some voices leave shorter gaps; ASR still checks every segment.
            segs, dur, nsil = split_words(wp, len(chunk), silence_duration=0.08)
        if segs is None:
            print(f"  ! chỉ thấy {nsil} khoảng lặng cho {len(chunk)} mục ({dur:.0f}s) — bỏ lô, để mục lại vào hàng chờ")
            if RECOVER_RAW:
                raise SystemExit('Không xác định được ranh giới lô WAV đã lưu')
            todo = chunk + todo
            cur_batch = max(1, len(chunk) // 2)
            continue
        for i, (w, segment) in enumerate(zip(chunk, segs)):
            if segment is None:
                if RECOVER_RAW and '--overwrite' in args:
                    index.pop(w, None)
                print(f'  x {w!r}: không có mốc lời nói khớp chính xác'); rejected.append(w); continue
            a, b = segment
            if RECOVER_RAW and w in index and '--overwrite' not in args:
                continue
            name = slug(w) + ".mp3"
            if CHECK and ASR_BACKEND != 'faster-batch':
                tmpwav = pathlib.Path(td) / "t.wav"
                subprocess.run(["ffmpeg", "-v", "error", "-threads", "1", "-filter_threads", "1", "-y", "-ss", f"{a:.3f}", "-to", f"{b:.3f}", "-i", str(wp), "-af", "adelay=700|700,apad=pad_dur=0.8", "-ar", "16000", "-ac", "1", str(tmpwav)], check=True)
                heard = re.sub(r"[^a-z ]", "", transcribe(str(tmpwav)).lower()).strip()
                want = re.sub(r"[^a-z ]", "", w.lower()).strip()
                a_, b_ = want.replace(" ", ""), heard.replace(" ", "")
                if a_ != b_:
                    print(f"  x {w!r} nghe ra {heard!r} - bo, de mai"); rejected.append(w); continue
            # Validate the FINAL MP3, not only the WAV before encoding.
            candidate = pathlib.Path(td) / name
            try:
                render_word(wp, a, b, candidate)
                validate_word(candidate, max_duration=1 + 1.75 * len(w.split()),
                              min_duration=max(.15, min(1.2, len(re.sub(r'[^a-z]', '', w.lower())) * .035)))
            except (ValueError, subprocess.CalledProcessError) as e:
                print(f"  x {w!r}: {e}"); rejected.append(w); continue
            staged = OUT / (name + '.pending')
            shutil.copyfile(candidate, staged)
            staged.replace(OUT / name)
            index[w] = name
            if (i + 1) % 10 == 0:
                staged_index = OUT / 'index.json.pending'
                staged_index.write_text(json.dumps(index, ensure_ascii=False, indent=0), encoding='utf-8')
                staged_index.replace(IDX)
                print(f'  kiểm {i + 1}/{len(chunk)}, {len(index)} clip đã lưu', flush=True)
        # lưu nhật ký lô để kiểm tra về sau
        (OUT / "_batches.log").open("a", encoding="utf-8").write(json.dumps({"n": len(chunk), "dur": round(dur, 1), "first": chunk[0], "last": chunk[-1]}, ensure_ascii=False) + "\n")
    IDX.write_text(json.dumps(index, ensure_ascii=False, indent=0), encoding="utf-8")
    print(f"  xong, {len(index)} mục")
print("bi loai:", len(rejected))
print("kết thúc: còn", len([w for w in todo_all if w not in index]), "mục")
