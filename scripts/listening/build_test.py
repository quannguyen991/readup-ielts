"""Ghép 4 section JSON (từ ChatGPT) + âm thanh thành một đề Listening của app.
python build_test.py <id> "<Tiêu đề>" <topic> <level> s1.json s2.json s3.json s4.json
- Chia lượt nói dài (độc thoại) thành các đoạn 2–3 câu để tô sáng theo mốc.
- Nếu có public/listening/<id>/sN.timings.json thì gắn start/end cho từng đoạn (tỉ lệ theo số chữ trong mỗi lượt).
- Ghi src/data/listening-tests/<id>.json. Nhớ thêm import vào src/data/listening-tests/index.ts."""
import sys, json, re, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
tid, title, topic, level, *files = sys.argv[1:]
sections = []
for n, f in enumerate(files, 1):
    sec = json.loads(pathlib.Path(f).read_text(encoding="utf-8"))
    audio_dir = ROOT / "public" / "listening" / tid
    tj = audio_dir / f"s{n}.timings.json"
    # chia lượt dài thành đoạn ≤ ~45 chữ
    turns = []
    for t in sec["transcript"]:
        text = re.sub(r"\s+", " ", t["text"]).strip()
        sents = re.split(r"(?<=[.!?])\s+", text)
        cur = []
        for s in sents:
            cur.append(s)
            if len(" ".join(cur).split()) >= 38:
                turns.append({"speaker": t.get("speaker"), "text": " ".join(cur)}); cur = []
        if cur:
            turns.append({"speaker": t.get("speaker"), "text": " ".join(cur)})
    out = {"n": n, "title": sec["title"], "context": sec.get("context", ""), "audio": f"/listening/{tid}/s{n}.mp3",
           "transcript": turns, "groups": sec["groups"]}
    if tj.exists():
        info = json.loads(tj.read_text(encoding="utf-8"))
        dur = info["durationSec"]
        out["durationSec"] = dur
        # mốc theo tỉ lệ chữ (lượt gốc có mốc thật nên gộp lại cho từng lượt gốc)
        words = [len(t["text"].split()) for t in turns]
        tot = sum(words); acc = 0.0
        for t, w in zip(turns, words):
            t["start"] = round(dur * acc / tot, 2); acc += w; t["end"] = round(dur * acc / tot, 2)
    sections.append(out)
test = {"id": tid, "title": title, "source": "Band 9 Original", "level": level, "cover": {"topic": topic}, "sections": sections}
dst = ROOT / "src" / "data" / "listening-tests" / f"{tid}.json"
dst.write_text(json.dumps(test, ensure_ascii=False, indent=1), encoding="utf-8")
print("ghi", dst, "-", sum(len(s["transcript"]) for s in sections), "đoạn")
