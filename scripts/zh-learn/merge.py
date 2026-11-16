"""Gộp lô Codex thành src/data/zh-learn/{grammar,dialogues}.json, kiểm cấu trúc + pinyin (pypinyin).

  python -X utf8 merge.py grammar|dialogue [--write]
Không --write: chỉ in báo cáo. Bài lỗi cấu trúc bị loại; pinyin lệch âm (không tính thanh) bị loại.
"""
import json
import re
import sys
import unicodedata
from pathlib import Path

from pypinyin import Style, lazy_pinyin, pinyin

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
RAW = HERE / "raw"
OUT = {"grammar": ROOT / "src/data/zh-learn/grammar.json", "dialogue": ROOT / "src/data/zh-learn/dialogues.json"}

# pypinyin bỏ sót cách đọc nhẹ / phụ của vài chữ rất thường gặp
EXTRA_READ = {"的": ["de", "di"], "地": ["de", "di"], "得": ["de", "dei"], "了": ["le", "liao"], "着": ["zhe", "zhao", "zhuo"], "还": ["hai", "huan"], "乐": ["le", "yue"], "好": ["hao"], "长": ["chang", "zhang"], "为": ["wei"], "都": ["dou", "du"], "行": ["xing", "hang"], "和": ["he", "huo", "hu"], "没": ["mei"], "觉": ["jue", "jiao"], "给": ["gei", "ji"], "们": ["men"], "呢": ["ne"], "吗": ["ma"], "吧": ["ba"], "啊": ["a", "ya", "wa", "na"]}

HAN = re.compile(r"[㐀-鿿]")


def base(s):
    s = unicodedata.normalize("NFD", s.lower())
    s = "".join(c for c in s if not unicodedata.combining(c) or c == "̈")  # giữ ü
    s = unicodedata.normalize("NFC", s).replace("ü", "v")
    return re.sub(r"[^a-z]", "", s)


def tones(s):
    out = []
    for syl in re.findall(r"[^\s\d,.!?;:，。！？；：、…\"'“”（）()—-]+", s):
        d = unicodedata.normalize("NFD", syl)
        m = re.search(r"[̄́̌̀]", d)
        out.append({"̄": 1, "́": 2, "̌": 3, "̀": 4}.get(m.group(0), 5) if m else 5)
    return out


def check_line(zh, py):
    """None nếu ổn, ngược lại thông báo lỗi (chỉ lệch âm mới là lỗi cứng)."""
    if not HAN.search(zh):
        return "không có chữ Hán"
    got = base(py)
    # Mỗi chữ Hán nhận mọi cách đọc có thể (đa âm); 儿 hoá âm ('r') là tuỳ chọn; chữ không phải Hán bỏ qua.
    chars = [c for c in zh if HAN.match(c)]
    cands = pinyin("".join(chars), style=Style.NORMAL, heteronym=True, errors="ignore")
    parts = []
    for i, (c, opts) in enumerate(zip(chars, cands)):
        o = sorted({base(x) for x in opts if x} | set(EXTRA_READ.get(c, [])), key=len, reverse=True)
        if c == "儿" and i > 0 and chars[i - 1] not in "女男孩幼婴宝" and (i + 1 >= len(chars) or chars[i + 1] not in "子童女"):
            o = ["r", "er"]
        if c == "不":  # bu/bú
            o = ["bu"]
        parts.append("(?:" + "|".join(re.escape(x) for x in o) + ")")
    if len(parts) != len(cands) or not re.fullmatch("".join(parts), got):
        return f"pinyin lệch âm: {zh} | {py} | pypinyin={' '.join(lazy_pinyin(zh, style=Style.TONE, errors='ignore'))}"
    return None


def lines_of(item, kind):
    if kind == "dialogue":
        yield from item["lines"]
        return
    for st in item["steps"]:
        yield from st.get("examples", [])
        for m in st.get("mistakes", []):
            pass


def validate(item, kind):
    errs = []
    need = ["id", "level", "order", "title", "titleZh", "minutes", "quiz"] + (["summary", "steps"] if kind == "grammar" else ["topic", "scene", "lines", "keyWords"])
    for k in need:
        if k not in item or item[k] in (None, "", []):
            errs.append(f"thiếu {k}")
    if errs:
        return errs
    if len(item["quiz"]) != 5:
        errs.append("quiz không đủ 5 câu")
    for q in item["quiz"]:
        if not (3 <= len(q["options"]) <= 4) or not (0 <= q["answer"] < len(q["options"])) or not q.get("explain"):
            errs.append("quiz hỏng")
            break
    if kind == "grammar":
        labels = [s["label"] for s in item["steps"]]
        if not (4 <= len(item["steps"]) <= 6):
            errs.append("số bước ngoài 4-6")
        if "Định nghĩa" not in labels or "Lỗi hay mắc" not in labels:
            errs.append("thiếu bước bắt buộc")
        if sum(len(s.get("examples", [])) for s in item["steps"]) < 6:
            errs.append("ít ví dụ")
    else:
        if not (6 <= len(item["lines"]) <= 14):
            errs.append("số câu hội thoại ngoài 6-14")
        for l in item["lines"]:
            if not l.get("who"):
                errs.append("thiếu who")
                break
    for l in lines_of(item, kind):
        e = check_line(l["zh"], l["py"])
        if e:
            errs.append(e)
        if l.get("mark") and l["mark"] not in l["zh"]:
            l.pop("mark")
    for st in item.get("steps", []):
        for m in st.get("mistakes", []):
            if not (m.get("wrong") and m.get("right") and m.get("why")):
                errs.append("mistakes hỏng")
                break
    for w in item.get("keyWords", []):
        e = check_line(w["zh"], w["py"])
        if e:
            errs.append("từ khoá: " + e)
    return errs


def main():
    kind = sys.argv[1]
    write = "--write" in sys.argv
    items = []
    for f in sorted(RAW.glob(f"{kind}-[0-9][0-9].json")):
        r = f.with_suffix(".r.json")
        items += json.loads((r if r.exists() else f).read_text(encoding="utf8"))
    ok, bad = [], []
    for it in items:
        e = validate(it, kind)
        (bad if e else ok).append((it, e))
    print(f"{kind}: {len(items)} bài, hợp lệ {len(ok)}, loại {len(bad)}")
    for it, e in bad[:40]:
        print(" ✗", it.get("id"), "|", "; ".join(e)[:300])
    if write:
        path = OUT[kind]
        cur = {x["id"]: x for x in json.loads(path.read_text(encoding="utf8"))}
        for it, _ in ok:
            cur[it["id"]] = it
        allv = sorted(cur.values(), key=lambda x: (x["level"], x["order"]))
        for lv in sorted({x["level"] for x in allv}):
            for i, x in enumerate([y for y in allv if y["level"] == lv], 1):
                x["order"] = i
        path.write_text(json.dumps(allv, ensure_ascii=False, indent=1) + "\n", encoding="utf8", newline="")
        print("đã ghi", path, len(allv))


if __name__ == "__main__":
    main()
