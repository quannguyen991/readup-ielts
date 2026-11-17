"""Gộp câu soạn tay (sentences-zh.txt, sentences-ja.txt) thành src/data/east-asian-sentences-extra.json.
Tiếng Trung được sinh pinyin bằng pypinyin; in ra các chữ đa âm để rà soát.

  python -X utf8 build_sentences.py
"""
import json
import re
from collections import Counter
from pathlib import Path

from pypinyin import Style, lazy_pinyin, pinyin

HERE = Path(__file__).resolve().parent
OUT = HERE.parents[1] / "src/data/east-asian-sentences-extra.json"
PER_LEVEL = 30


def parse(path, lang):
    level, rows, errors = None, [], []
    for n, raw in enumerate(path.read_text(encoding="utf8").splitlines(), 1):
        line = raw.strip()
        if not line:
            continue
        if line.startswith("#"):
            level = line[1:].strip()
            continue
        if "|" not in line or level is None:
            errors.append(f"{path.name}:{n} sai định dạng")
            continue
        t, vi = [x.strip() for x in line.split("|", 1)]
        rows.append({"l": level, "t": t, "vi": vi})
    return rows, errors


def py_of(text):
    parts = []
    for tok in re.findall(r"[一-鿿]+|[A-Za-z0-9]+", text):
        if re.match(r"[一-鿿]", tok):
            parts.extend(lazy_pinyin(tok, style=Style.TONE))
        else:
            parts.append(tok)
    return " ".join(parts)


zh, e1 = parse(HERE / "sentences-zh.txt", "zh")
ja, e2 = parse(HERE / "sentences-ja.txt", "ja")
errors = e1 + e2
for name, rows, levels in (("zh", zh, [f"HSK {i}" for i in range(1, 7)]), ("ja", ja, [f"JLPT N{i}" for i in (5, 4, 3, 2, 1)])):
    c = Counter(r["l"] for r in rows)
    for lv in levels:
        if c[lv] != PER_LEVEL:
            errors.append(f"{name} {lv}: {c[lv]} câu (cần {PER_LEVEL})")
    texts = [r["t"] for r in rows]
    if len(set(texts)) != len(texts):
        errors.append(f"{name}: có câu trùng")
    for r in rows:
        if not r["vi"]:
            errors.append(f"{name}: thiếu nghĩa Việt: {r['t']}")
if errors:
    print("\n".join(errors))
    raise SystemExit(1)

multi = Counter()
for r in zh:
    r["py"] = py_of(r["t"])
    for ch, readings in zip([c for c in r["t"] if "一" <= c <= "鿿"], pinyin([c for c in r["t"] if "一" <= c <= "鿿"], heteronym=True)):
        if len(readings) > 1:
            multi[ch] += 1
# pypinyin đọc sai một số chữ đa âm trong câu này; sửa tay theo (từ gốc, đọc sai, đọc đúng).
PYFIX = [
    ("她唱歌唱得很好。", "chàng dé", "chàng de"), ("他跑得比我快。", "pǎo dé", "pǎo de"),
    ("他的汉语说得越来越流利。", "shuō dé", "shuō de"), ("这家饭馆的菜比那家好吃得多。", "chī dé", "chī de"),
    ("他的房间总是收拾得很干净。", "shōu shí dé", "shōu shí de"), ("他把这件事处理得很合适。", "lǐ dé", "lǐ de"),
    ("面对突如其来的变故，他表现得异常镇定。", "xiàn dé", "xiàn de"),
    ("旅游业的发展带动了当地经济的增长。", "liǎo dàng dì", "le dāng dì"),
    ("他们为了这次比赛准备了很长时间。", "zhǎng shí jiān", "cháng shí jiān"),
    ("数字技术正在深刻地重塑传统行业的运作模式。", "zhòng sù", "chóng sù"),
    ("文学作品往往折射出作者所处时代的精神面貌。", "suǒ chù", "suǒ chǔ"),
]
for r in zh:
    for t, old, new in PYFIX:
        if r["t"] == t:
            assert old in r["py"], (t, old, r["py"])
            r["py"] = r["py"].replace(old, new)
OUT.write_text(json.dumps({"zh": zh, "ja": ja}, ensure_ascii=False, indent=0), encoding="utf8")
print(f"zh {len(zh)} câu, ja {len(ja)} câu -> {OUT.name}")
print("chữ đa âm cần rà:", " ".join(f"{k}×{v}" for k, v in multi.most_common(40)))
