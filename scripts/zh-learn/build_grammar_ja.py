"""Gộp grammar-ja-*.txt thành src/data/ja-learn/grammar.json.  python -X utf8 build_grammar_ja.py"""
import json
import re
from collections import Counter
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE.parents[1] / "src/data/ja-learn/grammar.json"
LEVELS = {"JLPT N5": 5, "JLPT N4": 4, "JLPT N3": 3, "JLPT N2": 2, "JLPT N1": 1}
rows, errors, cur, level = [], [], None, None
order = Counter()
for f in sorted(HERE.glob("grammar-ja-*.txt")):
    for n, raw in enumerate(f.read_text(encoding="utf8").splitlines(), 1):
        line = raw.strip()
        if not line or (line.startswith("#") and not line.startswith("##")):
            continue
        where = f"{f.name}:{n}"
        if line.startswith("##"):
            level = LEVELS.get(line[2:].strip())
            if level is None:
                errors.append(f"{where} cấp lạ: {line}")
        elif line.startswith("@"):
            pat, _, meaning = line[1:].partition("|")
            order[level] += 1
            cur = {"id": f"ja-g-n{level}-{order[level]:02d}", "level": level, "order": order[level],
                   "pattern": pat.strip(), "meaning": meaning.strip(), "form": "", "tip": "", "examples": []}
            rows.append(cur)
        elif line.startswith("form:"):
            cur["form"] = line[5:].strip()
        elif line.startswith("tip:"):
            cur["tip"] = line[4:].strip()
        elif line.startswith(">"):
            parts = [x.strip() for x in line[1:].split("|")]
            if len(parts) != 3:
                errors.append(f"{where} cần 3 phần: {line}")
                continue
            ja, vi, mark = parts
            if mark not in ja:
                errors.append(f"{where} mark không nằm trong câu: {mark} / {ja}")
            cur["examples"].append({"ja": ja, "vi": vi, "mark": mark})
        else:
            errors.append(f"{where} dòng lạ: {line}")
for r in rows:
    if not r["pattern"] or not r["meaning"] or not r["form"] or not r["tip"]:
        errors.append(f"{r['id']} thiếu trường")
    if len(r["examples"]) < 2:
        errors.append(f"{r['id']} {r['pattern']}: ít hơn 2 ví dụ")
allj = [e["ja"] for r in rows for e in r["examples"]]
if len(set(allj)) != len(allj):
    errors.append("có câu ví dụ trùng")
if errors:
    print("\n".join(errors))
    raise SystemExit(1)
OUT.write_text(json.dumps(rows, ensure_ascii=False, indent=1), encoding="utf8")
print(len(rows), "điểm ->", OUT.name, dict(sorted(Counter(r["level"] for r in rows).items(), reverse=True)))
