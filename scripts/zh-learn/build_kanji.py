"""Gộp kanji JLPT (OpenJLPT, từ KANJIDIC2, CC BY-SA 4.0) + âm Hán Việt (Unicode Unihan kVietnamese) thành
src/data/ja-learn/kanji.json.

Cần: kanjidic2.xml.gz (cùng thư mục Unihan), .local-private/open-vocab/kanji/n1..n5.json  và  Unihan_Readings.txt + Unihan_Variants.txt
(đường dẫn Unihan: biến môi trường UNIHAN_DIR, mặc định D:/ClaudeTemp/unihan).

  python -X utf8 scripts/zh-learn/build_kanji.py
"""
import json
import os
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / ".local-private/open-vocab/kanji"
UNI = Path(os.environ.get("UNIHAN_DIR", "D:/ClaudeTemp/unihan"))
OUT = ROOT / "src/data/ja-learn/kanji.json"


def unihan(field, fname):
    out = {}
    for line in (UNI / fname).read_text(encoding="utf8").splitlines():
        if line.startswith("#") or not line.strip():
            continue
        cp, key, val = line.split("\t", 2)
        if key == field:
            out[chr(int(cp[2:], 16))] = val
    return out


viet = {k: v.split() for k, v in unihan("kVietnamese", "Unihan_Readings.txt").items()}
trad = unihan("kTraditionalVariant", "Unihan_Variants.txt")
semantic = unihan("kSemanticVariant", "Unihan_Variants.txt")
zvar = unihan("kZVariant", "Unihan_Variants.txt")


def kanjidic_vietnam():
    """KANJIDIC2 (EDRDG, CC BY-SA 3.0) có sẵn âm Hán Việt ở <reading r_type="vietnam">."""
    import gzip
    import xml.etree.ElementTree as ET

    path = UNI / "kanjidic2.xml.gz"
    out = {}
    if not path.exists():
        return out
    with gzip.open(path, "rb") as fh:
        for _, el in ET.iterparse(fh):
            if el.tag == "character":
                lit = el.findtext("literal")
                rd = [r.text for r in el.iter("reading") if r.get("r_type") == "vietnam" and r.text]
                if lit and rd:
                    out[lit] = rd
                el.clear()
    return out


KD = kanjidic_vietnam()


def han_viet(ch):
    if ch in KD:
        return KD[ch]
    if ch in viet:
        return viet[ch]
    for table in (trad, zvar, semantic):
        for token in table.get(ch, "").split():
            cand = chr(int(token.split("<")[0][2:], 16))
            if cand in viet:
                return viet[cand]
    return []


rows, seen = [], set()
for lv in (5, 4, 3, 2, 1):
    for k in json.loads((SRC / f"n{lv}.json").read_text(encoding="utf8")):
        c = k["character"]
        if c in seen:
            continue
        seen.add(c)
        hv = [h.lower() for h in han_viet(c)]
        rows.append({
            "c": c,
            "lv": lv,
            "st": k.get("strokes"),
            "on": k.get("onyomi", [])[:4],
            "kun": [x for x in k.get("kunyomi", []) if not x.startswith("-")][:4] or k.get("kunyomi", [])[:4],
            "en": k.get("meanings", [])[:4],
            "hv": hv[:2],
            "w": k.get("words", [])[:4],
        })
OUT.write_text(json.dumps(rows, ensure_ascii=False, separators=(",", ":")), encoding="utf8")
cnt = Counter(r["lv"] for r in rows)
miss = [r["c"] for r in rows if not r["hv"]]
print(len(rows), "kanji ->", OUT.name, dict(sorted(cnt.items(), reverse=True)))
print("thiếu âm Hán Việt:", len(miss), "".join(miss[:60]))
