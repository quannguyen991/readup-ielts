"""Gộp bản dịch tiếng Anh (work-en/out) vào dữ liệu:
  `g`   → src/data/east-asian-vocab.json (từ HSK 3.0 chưa có nghĩa Anh);
  `exEn` → ex.en trong src/data/east-asian-extra-{zh,ja}.json.
Chạy: python -X utf8 -I merge_en.py [--write]   (không có --write thì chỉ báo cáo)
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "src/data"
WORK = Path(__file__).resolve().parent / "work-en"

todo = {x["id"]: x for x in json.loads((WORK / "todo.json").read_text(encoding="utf8"))}
res = {}
for p in sorted((WORK / "out").glob("batch-*.json")):
    for x in json.loads(p.read_text(encoding="utf8")):
        res[x["id"]] = x
for p in sorted((WORK / "out").glob("partial-*.json")):
    res.update(json.loads(p.read_text(encoding="utf8"))["good"])

gloss = {}  # từ zh -> g
ex_en = {"zh": {}, "ja": {}}
for i, r in res.items():
    it = todo[i]
    if r.get("g"):
        gloss[it["w"]] = r["g"]
    if r.get("exEn"):
        ex_en[it["lang"]][it["w"]] = r["exEn"]

extra = {
    "zh": json.loads((DATA / "east-asian-extra-zh.json").read_text(encoding="utf8")),
    "ja": json.loads((DATA / "east-asian-extra-ja.json").read_text(encoding="utf8")),
}
n_ex = 0
for lang in ("zh", "ja"):
    for w, en in ex_en[lang].items():
        e = extra[lang].get(w)
        if e and e.get("ex") and not e["ex"].get("en"):
            e["ex"]["en"] = en
            n_ex += 1

books = json.loads((DATA / "east-asian-vocab.json").read_text(encoding="utf8"))
n_g = 0
for b in books:
    if b["slug"] != "book-hsk-3-0":
        continue
    for t in b["topics"]:
        for l in t["lessons"]:
            for r in l["rows"]:
                if not r.get("g") and r["w"] in gloss:
                    r["g"] = gloss[r["w"]]
                    n_g += 1

need_g = sum(1 for x in todo.values() if x["needGloss"])
need_ex = sum(1 for x in todo.values() if x["ex"])
print(f"đã dịch {len(res)}/{len(todo)} mục · gắn nghĩa Anh cho {n_g} dòng HSK 3.0 (cần {need_g} từ) · gắn dịch Anh cho {n_ex} câu ví dụ (cần {need_ex})")
if "--write" in sys.argv:
    dump = lambda o: json.dumps(o, ensure_ascii=False, separators=(",", ":"))
    (DATA / "east-asian-extra-zh.json").write_text(dump(extra["zh"]) + "\n", encoding="utf8")
    (DATA / "east-asian-extra-ja.json").write_text(dump(extra["ja"]) + "\n", encoding="utf8")
    (DATA / "east-asian-vocab.json").write_text(dump(books) + "\n", encoding="utf8")
    print("đã ghi 3 tệp dữ liệu")
