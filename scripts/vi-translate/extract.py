"""Lọc các mục từ vựng Trung/Nhật còn thiếu nghĩa tiếng Việt để dịch hàng loạt.

Nguồn: src/data/east-asian-open-vocab.json (HSK 2.0 cộng đồng + JLPT). Một mục cần dịch khi chưa có nghĩa Việt ở
chính dòng đó (`vi`) cũng như ở bảng bổ sung (east-asian-extra-*.json, khoá theo từ).
Ra: scripts/vi-translate/work/todo.json  — danh sách {id, lang, w, r, o, g, ex, exEn} đã khử trùng theo (ngôn ngữ, từ, phiên âm).
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "src/data"
WORK = Path(__file__).resolve().parent / "work"
WORK.mkdir(exist_ok=True)

books = json.loads((DATA / "east-asian-open-vocab.json").read_text(encoding="utf8"))
extra = {
    "zh": json.loads((DATA / "east-asian-extra-zh.json").read_text(encoding="utf8")),
    "ja": json.loads((DATA / "east-asian-extra-ja.json").read_text(encoding="utf8")),
}

todo, seen = [], set()
stats = {}
for b in books:
    lang = b["language"]
    for t in b["topics"]:
        for l in t["lessons"]:
            for r in l["rows"]:
                w = r["w"]
                has_vi = bool(r.get("vi")) or bool(extra[lang].get(w, {}).get("vi"))
                if has_vi:
                    continue
                key = (lang, w, r.get("r") or r.get("p") or "")
                if key in seen:
                    continue
                seen.add(key)
                item = {
                    "id": f"{lang}-{len(todo):05d}",
                    "lang": lang,
                    "w": w,
                    "r": r.get("r") or "",
                    "p": r.get("p") or "",
                    "o": r.get("o") or "",
                    "g": r.get("g") or "",
                    "ex": r.get("ex") or "",
                    "exEn": r.get("exEn") or "",
                }
                todo.append(item)
                lv = r.get("l") or "?"
                stats[(lang, lv)] = stats.get((lang, lv), 0) + 1

(WORK / "todo.json").write_text(json.dumps(todo, ensure_ascii=False, indent=0), encoding="utf8")
print("tổng", len(todo))
for k, v in sorted(stats.items()):
    print(" ", k, v)
print("có ví dụ:", sum(1 for x in todo if x["ex"]), "· có dịch Anh của ví dụ:", sum(1 for x in todo if x["exEn"]))
print("mẫu:", json.dumps(todo[5], ensure_ascii=False))
print("mẫu zh:", json.dumps(next(x for x in todo if x["lang"] == "zh"), ensure_ascii=False))
