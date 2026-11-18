"""Tach the tranh cua tung bai tu rieng le tu mot tam luoi 3x3 (hoac it hon), theo ke hoach word_sets_plan.json.

Cach dung: python zh_v5_ja_sets.py <ten_tam_A..F> <duong_dan_png>
Ket qua: assets/chinese/v4/ja/ja-set-NN.png (NN = so thu tu bai theo ke hoach) va cap nhat set_index.json.
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, r"D:\ClaudeTemp\claude\b70d0e96dfc39538\39e92a07-3761-43c0-a9bc-d9f46b87deaa\scratchpad")
import zh_v4_process as p  # noqa: E402

SCRATCH = Path(r"D:\ClaudeTemp\claude\b70d0e96dfc39538\39e92a07-3761-43c0-a9bc-d9f46b87deaa\scratchpad")
PLAN = json.loads((SCRATCH / "word_sets_plan.json").read_text(encoding="utf-8"))
OUT = Path("D:/Claude/readup-ielts/assets/chinese/v4/ja")
INDEX_FILE = SCRATCH / "set_index.json"

letter, raw = sys.argv[1], Path(sys.argv[2])
sheet = next(s for s in PLAN["sheets"] if s["name"] == letter)
offset = 0
for s in PLAN["sheets"]:
    if s["name"] == letter:
        break
    offset += len(s["items"])

index = json.loads(INDEX_FILE.read_text(encoding="utf-8")) if INDEX_FILE.exists() else {}
items, (W, H) = p.extract(raw)
print("components", len(items), "expected", len(sheet["items"]))
rows = 3
cols = 3
cells = {}
for it in items:
    r = min(rows - 1, int(it["yc"] // (H / rows)))
    c = min(cols - 1, int(it["xc"] // (W / cols)))
    cells.setdefault(r * cols + c, it)
for k, (slug, _) in enumerate(sheet["items"]):
    if k not in cells:
        print("MISSING", slug)
        continue
    n = offset + k + 1
    name = f"ja-set-{n:02d}.png"
    p.save(cells[k]["img"], OUT / name)
    index[slug] = name
INDEX_FILE.write_text(json.dumps(index, ensure_ascii=False, indent=1), encoding="utf-8")
print("registered", len(index), "total")
