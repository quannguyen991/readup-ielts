"""Lọc các mục cần DỊCH SANG TIẾNG ANH để học Nhật/Trung ↔ Anh:
  (A) nghĩa tiếng Anh `g` cho từ HSK 3.0 chưa có (dùng lại `g` của HSK 2.0 cho từ trùng);
  (B) bản dịch tiếng Anh `ex.en` cho mọi câu ví dụ trong bảng bổ sung east-asian-extra-{zh,ja}.json.
Ra: work-en/todo.json  — {id, kind, lang, w, p, vi, ex, needGloss}
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "src/data"
WORK = Path(__file__).resolve().parent / "work-en"
WORK.mkdir(exist_ok=True)

extra = {
    "zh": json.loads((DATA / "east-asian-extra-zh.json").read_text(encoding="utf8")),
    "ja": json.loads((DATA / "east-asian-extra-ja.json").read_text(encoding="utf8")),
}
opens = json.loads((DATA / "east-asian-open-vocab.json").read_text(encoding="utf8"))
books = json.loads((DATA / "east-asian-vocab.json").read_text(encoding="utf8"))

# nghĩa Anh sẵn có theo từ (HSK 2.0 + JLPT)
gloss_of = {"zh": {}, "ja": {}}
pinyin_of = {"zh": {}, "ja": {}}
for b in opens:
    for t in b["topics"]:
        for l in t["lessons"]:
            for r in l["rows"]:
                if r.get("g"):
                    gloss_of[b["language"]].setdefault(r["w"], r["g"])
for b in books:
    lang = b["language"]
    for t in b["topics"]:
        for l in t["lessons"]:
            for r in l["rows"]:
                pinyin_of[lang].setdefault(r["w"], r.get("p") or r.get("r") or "")
                if r.get("g"):
                    gloss_of[lang].setdefault(r["w"], r["g"])

# từ HSK 3.0 chưa có `g`
need_gloss = set()
for b in books:
    if b["slug"] != "book-hsk-3-0":
        continue
    for t in b["topics"]:
        for l in t["lessons"]:
            for r in l["rows"]:
                if not r.get("g") and r["w"] not in gloss_of["zh"]:
                    need_gloss.add(r["w"])

todo = []
for lang in ("zh", "ja"):
    for w, e in extra[lang].items():
        ex = (e.get("ex") or {}).get("t") or ""
        has_en = bool((e.get("ex") or {}).get("en"))
        gloss_needed = lang == "zh" and w in need_gloss
        if (ex and not has_en) or gloss_needed:
            todo.append({
                "id": f"{lang}-{len(todo):05d}",
                "lang": lang,
                "w": w,
                "p": pinyin_of[lang].get(w, ""),
                "vi": e.get("vi", ""),
                "ex": ex if (ex and not has_en) else "",
                "needGloss": gloss_needed,
            })
# từ HSK 3.0 cần nghĩa Anh nhưng không có trong bảng bổ sung
in_todo = {(x["lang"], x["w"]) for x in todo}
missing = [w for w in need_gloss if ("zh", w) not in in_todo]
for w in missing:
    todo.append({"id": f"zh-{len(todo):05d}", "lang": "zh", "w": w, "p": pinyin_of["zh"].get(w, ""), "vi": "", "ex": "", "needGloss": True})

(WORK / "todo.json").write_text(json.dumps(todo, ensure_ascii=False), encoding="utf8")
print("tổng mục:", len(todo))
print("  cần nghĩa Anh (HSK 3.0):", sum(1 for x in todo if x["needGloss"]), "· trong đó chưa có nghĩa Việt để dựa vào:", sum(1 for x in todo if x["needGloss"] and not x["vi"]))
print("  cần dịch ví dụ sang Anh:", sum(1 for x in todo if x["ex"]), "(ja", sum(1 for x in todo if x["ex"] and x["lang"] == "ja"), "· zh", sum(1 for x in todo if x["ex"] and x["lang"] == "zh"), ")")
