"""Gộp kết quả run_gen_batches.py vào dữ liệu.
  def → src/data/english-definitions.json  (khoá "<từ thường>|<nghĩa Việt>" → định nghĩa Anh)
  ex  → câu ví dụ (ex, exVi, exEn, exReading) vào các dòng của src/data/east-asian-open-vocab.json chưa có câu
Chạy: python -X utf8 -I merge_gen.py [--write]
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "src/data"
HERE = Path(__file__).resolve().parent
dump = lambda o: json.dumps(o, ensure_ascii=False, separators=(",", ":"))


def load(task):
    todo = {x["id"]: x for x in json.loads((HERE / f"work-{task}/todo.json").read_text(encoding="utf8"))}
    res = {}
    out = HERE / f"work-{task}/out"
    for p in sorted(out.glob("batch-*.json")):
        for x in json.loads(p.read_text(encoding="utf8")):
            res[x["id"]] = x
    for p in sorted(out.glob("partial-*.json")):
        res.update(json.loads(p.read_text(encoding="utf8"))["good"])
    return todo, res


todo, res = load("def")
defs = {todo[i]["key"]: r["def"] for i, r in res.items()}
print(f"định nghĩa Anh: {len(defs)}/{len(todo)}")
if "--write" in sys.argv:
    (DATA / "english-definitions.json").write_text(dump(dict(sorted(defs.items()))) + "\n", encoding="utf8")

todo, res = load("ex")
by_key = {(todo[i]["lang"], todo[i]["w"], todo[i]["r"] or todo[i]["p"]): r for i, r in res.items()}
books = json.loads((DATA / "east-asian-open-vocab.json").read_text(encoding="utf8"))
n = 0
for b in books:
    lang = b["language"]
    for t in b["topics"]:
        for l in t["lessons"]:
            for r in l["rows"]:
                if r.get("ex"):
                    continue
                g = by_key.get((lang, r["w"], r.get("r") or r.get("p") or ""))
                if g:
                    r.update({"ex": g["ex"], "exVi": g["exVi"], "exEn": g["exEn"], "exReading": g["exReading"]})
                    n += 1
print(f"câu ví dụ: {len(res)}/{len(todo)} mục → gắn vào {n} dòng")
if "--write" in sys.argv:
    (DATA / "east-asian-open-vocab.json").write_text(dump(books) + "\n", encoding="utf8")
    print("đã ghi")
