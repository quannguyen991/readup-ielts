"""Chạy mỗi ngày (Task Scheduler): dùng hết hạn mức Gemini TTS miễn phí trong ngày (10 lượt/ngày/mô hình, tính theo giờ Thái Bình Dương).
Thứ tự ưu tiên: (1) âm thanh các section Listening còn thiếu (scripts/listening/pending.json, mỗi section 1 lượt),
(2) âm đọc từ giọng Kore, (3) âm đọc từ giọng Fenrir (khi Kore đã đủ). Ghi nhật ký vào scripts/listening/daily.log.
python daily_audio.py   (dùng D:/khkt-venv-lap/Scripts/python.exe vì cần transformers để kiểm bằng Whisper)"""
import sys, json, subprocess, pathlib, datetime, re, os
sys.stdout.reconfigure(encoding="utf-8")
os.environ["PYTHONIOENCODING"] = "utf-8"

HERE = pathlib.Path(__file__).parent
ROOT = HERE.parents[1]
PY = sys.executable
LOG = HERE / "daily.log"
STATE = HERE / "quota-state.json"
BUDGET = 10
MODEL = "gemini-3.1-flash-tts-preview"


def log(msg):
    line = f"{datetime.datetime.now():%Y-%m-%d %H:%M:%S} {msg}"
    print(line, flush=True)
    LOG.open("a", encoding="utf-8").write(line + "\n")


def pt_day():
    try:
        from zoneinfo import ZoneInfo
        return datetime.datetime.now(ZoneInfo("America/Los_Angeles")).strftime("%Y-%m-%d")
    except Exception:
        return (datetime.datetime.utcnow() - datetime.timedelta(hours=7)).strftime("%Y-%m-%d")


state = json.loads(STATE.read_text()) if STATE.exists() else {}
day = pt_day()
used = state.get(day, 0)
log(f"ngày PT {day}, đã dùng {used}/{BUDGET}")


def save():
    state[day] = used
    STATE.write_text(json.dumps(state))


# (1) section Listening còn thiếu
pend_f = HERE / "pending.json"
pend = json.loads(pend_f.read_text(encoding="utf-8")) if pend_f.exists() else []
left = []
for p in pend:
    out = ROOT / p["out"]
    if out.exists():
        continue
    if used >= BUDGET:
        left.append(p); continue
    r = subprocess.run([PY, str(HERE / "make_audio.py"), str(ROOT / p["json"]), str(out), "--voices", p["voices"], "--model", MODEL], capture_output=True, text=True, encoding="utf-8")
    if r.returncode == 0:
        used += 1; save(); log(f"OK {p['out']}")
    else:
        log(f"LỖI {p['out']}: {(r.stdout + r.stderr)[-300:]}")
        if "Hết lượt" in (r.stdout + r.stderr):
            used = BUDGET; save()
        left.append(p)
pend_f.write_text(json.dumps(left, ensure_ascii=False, indent=1), encoding="utf-8")


# (2)(3) âm đọc từ
for voice in ("Kore", "Fenrir"):
    if used >= BUDGET:
        break
    r = subprocess.run([PY, str(HERE / "gen_word_audio.py"), "--voice", voice, "--batch", "80", "--max-requests", str(BUDGET - used), "--model", MODEL], capture_output=True, text=True, encoding="utf-8")
    out = r.stdout + r.stderr
    n = len(re.findall(r"^yêu cầu \d+", out, re.M))
    used += n; save()
    log(f"từ {voice}: {n} lượt; {out.strip().splitlines()[-1] if out.strip() else ''}")
    if "Hết lượt" in out:
        used = BUDGET; save(); break
    if re.search(r"kết thúc: còn [1-9]", out):
        break   # Kore chưa xong thì chưa sang Fenrir
log(f"xong, đã dùng {used}/{BUDGET}")
