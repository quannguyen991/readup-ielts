"""Đọc nguồn bằng mắt nhanh: tải trang (có đệm), bóc chữ, in các đoạn quanh từ khoá.
python grep_src.py <url> "<regex>" [ngữ cảnh ký tự=260] [số kết quả tối đa=8]"""
import sys, re, html, hashlib, pathlib, urllib.request, urllib.error

sys.stdout.reconfigure(encoding="utf-8")
CACHE = pathlib.Path(__file__).parent / "research" / "cache"
CACHE.mkdir(parents=True, exist_ok=True)
UA = {"User-Agent": "Mozilla/5.0 (Band9 research; contact quannxm.sags@gmail.com)"}


def fetch(url):
    f = CACHE / (hashlib.md5(url.encode()).hexdigest() + ".txt")
    if f.exists():
        return f.read_text(encoding="utf-8"), 200
    try:
        raw = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40).read()
    except urllib.error.HTTPError as e:
        return "", e.code
    except Exception as e:
        return "", 0
    if raw[:4] == b"%PDF":
        return "[PDF — dùng công cụ khác]", 200
    t = raw.decode("utf-8", "ignore")
    t = re.sub(r"(?is)<(script|style|nav|header|footer)[^>]*>.*?</\1>", "", t)
    t = re.sub(r"(?i)<br\s*/?>|</p>|</div>|</h\d>|</li>", "\n", t)
    t = re.sub(r"<[^>]+>", "", t)
    t = html.unescape(t)
    t = re.sub(r"[ \t]+", " ", t)
    t = re.sub(r"\n\s*\n+", "\n", t)
    f.write_text(t, encoding="utf-8")
    return t, 200


if __name__ == "__main__":
    url, rx = sys.argv[1], sys.argv[2]
    ctx = int(sys.argv[3]) if len(sys.argv) > 3 else 260
    mx = int(sys.argv[4]) if len(sys.argv) > 4 else 8
    t, code = fetch(url)
    print(f"[{code}] {len(t)} ký tự  {url}")
    n = 0
    for m in re.finditer(rx, t, re.I):
        a, b = max(0, m.start() - ctx), min(len(t), m.end() + ctx)
        print("…" + t[a:b].replace("\n", " ") + "…\n")
        n += 1
        if n >= mx:
            break
    if n == 0:
        print("(không thấy)")
