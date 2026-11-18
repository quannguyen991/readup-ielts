"""Gộp bản dịch (work/out/*.json) vào src/data/east-asian-open-vocab.json: thêm `vi` và `exVi` cho từng dòng.

Chạy: python -X utf8 -I merge.py [--write]
Không có --write thì chỉ báo cáo. `exVi` chỉ gắn khi câu ví dụ của dòng trùng đúng câu đã dịch.
Định dạng tệp giữ nguyên (JSON một dòng, không escape Unicode).
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WORK = Path(__file__).resolve().parent / "work"
DATA = ROOT / "src/data/east-asian-open-vocab.json"

todo = {x["id"]: x for x in json.loads((WORK / "todo.json").read_text(encoding="utf8"))}
res = {}
for p in sorted((WORK / "out").glob("batch-*.json")):
    for x in json.loads(p.read_text(encoding="utf8")):
        res[x["id"]] = x
for p in sorted((WORK / "out").glob("partial-*.json")):
    res.update(json.loads(p.read_text(encoding="utf8"))["good"])

by_key = {}
for i, it in todo.items():
    if i in res:
        by_key[(it["lang"], it["w"], it["r"] or it["p"])] = (it, res[i])

books = json.loads(DATA.read_text(encoding="utf8"))
extra = {
    "zh": json.loads((ROOT / "src/data/east-asian-extra-zh.json").read_text(encoding="utf8")),
    "ja": json.loads((ROOT / "src/data/east-asian-extra-ja.json").read_text(encoding="utf8")),
}
n_vi = n_ex = n_left = 0
left = {}
for b in books:
    lang = b["language"]
    for t in b["topics"]:
        for l in t["lessons"]:
            for r in l["rows"]:
                if r.get("vi") or extra[lang].get(r["w"], {}).get("vi"):
                    continue
                hit = by_key.get((lang, r["w"], r.get("r") or r.get("p") or ""))
                if not hit:
                    n_left += 1
                    left[(lang, r.get("l"))] = left.get((lang, r.get("l")), 0) + 1
                    continue
                it, rec = hit
                r["vi"] = rec["vi"]
                n_vi += 1
                if rec.get("exVi") and r.get("ex") == it["ex"]:
                    r["exVi"] = rec["exVi"]
                    n_ex += 1
print(f"dịch đã có: {len(res)}/{len(todo)} mục · gắn nghĩa Việt cho {n_vi} dòng · gắn dịch ví dụ cho {n_ex} dòng · còn thiếu {n_left} dòng")
if left:
    print("còn thiếu theo cấp:", {f"{k[0]}-{k[1]}": v for k, v in sorted(left.items())})
if "--write" in sys.argv:
    DATA.write_text(json.dumps(books, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf8")
    print("đã ghi", DATA.relative_to(ROOT))
