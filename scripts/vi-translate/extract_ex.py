"""Lọc các từ HSK 2.0 / JLPT chưa có CÂU VÍ DỤ (không có `ex` ở dòng và cũng không có ở bảng bổ sung) để sinh câu mới.
Ra: work-ex/todo.json — {id, lang, w, r, p, vi, g, o}
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "src/data"
WORK = Path(__file__).resolve().parent / "work-ex"
WORK.mkdir(exist_ok=True)

extra = {
    "zh": json.loads((DATA / "east-asian-extra-zh.json").read_text(encoding="utf8")),
    "ja": json.loads((DATA / "east-asian-extra-ja.json").read_text(encoding="utf8")),
}
books = json.loads((DATA / "east-asian-open-vocab.json").read_text(encoding="utf8"))
todo, seen = [], set()
for b in books:
    lang = b["language"]
    for t in b["topics"]:
        for l in t["lessons"]:
            for r in l["rows"]:
                if r.get("ex") or (extra[lang].get(r["w"], {}).get("ex") or {}).get("t"):
                    continue
                key = (lang, r["w"], r.get("r") or r.get("p") or "")
                if key in seen:
                    continue
                seen.add(key)
                todo.append({
                    "id": f"{lang}-{len(todo):05d}", "lang": lang, "w": r["w"], "r": r.get("r") or "", "p": r.get("p") or "",
                    "vi": r.get("vi") or extra[lang].get(r["w"], {}).get("vi") or "", "g": r.get("g") or "", "o": r.get("o") or "",
                })
(WORK / "todo.json").write_text(json.dumps(todo, ensure_ascii=False), encoding="utf8")
print("từ chưa có câu ví dụ:", len(todo), "(zh", sum(1 for x in todo if x["lang"] == "zh"), "· ja", sum(1 for x in todo if x["lang"] == "ja"), ")")
