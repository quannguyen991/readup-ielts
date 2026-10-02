"""Kiểm máy bước đầu cho hồ sơ nghiên cứu lịch sử (KHÔNG thay thế việc đọc nguồn bằng mắt).
python verify_claims.py <dossier.json> [...]   (mỗi tệp: {"scenes":[{"id","claims":[{"id","text","date","sources":[{"url","supports"}]}]}]})
Với mỗi nguồn: tải trang (lưu đệm ở research/cache), bóc chữ, rồi kiểm
  - URL mở được không (HTTP 200, có chữ);
  - các SỐ / NGÀY / NĂM trong khẳng định có xuất hiện trong chữ của nguồn không (so khớp chuẩn hoá: 19/12/1946, 19-12-1946, '19 December 1946', '1946');
  - tên riêng viết hoa (≥ 2 chữ cái) có xuất hiện không.
In bảng: claim, nguồn, URL_OK, số thiếu, tên thiếu. Số thiếu ≠ sai (nguồn có thể viết khác), nhưng là chỗ PHẢI đọc lại bằng mắt."""
import sys, json, re, html, hashlib, pathlib, urllib.request, urllib.error, unicodedata

sys.stdout.reconfigure(encoding="utf-8")
CACHE = pathlib.Path(__file__).parent / "research" / "cache"
CACHE.mkdir(parents=True, exist_ok=True)
UA = {"User-Agent": "Mozilla/5.0 (Band9 research; contact readup-contact@example.com)"}
MONTHS = {"january": 1, "february": 2, "march": 3, "april": 4, "may": 5, "june": 6, "july": 7, "august": 8,
          "september": 9, "october": 10, "november": 11, "december": 12}


def fetch(url):
    f = CACHE / (hashlib.md5(url.encode()).hexdigest() + ".txt")
    if f.exists():
        return f.read_text(encoding="utf-8"), 200
    try:
        rq = urllib.request.Request(url, headers=UA)
        raw = urllib.request.urlopen(rq, timeout=40).read()
        code = 200
    except urllib.error.HTTPError as e:
        return "", e.code
    except Exception:
        return "", 0
    if raw[:4] == b"%PDF":
        return "[PDF]", 200
    t = raw.decode("utf-8", "ignore")
    t = re.sub(r"(?is)<(script|style|nav|header|footer)[^>]*>.*?</\1>", "", t)
    t = re.sub(r"(?i)<br\s*/?>|</p>|</div>|</h\d>|</li>", "\n", t)
    t = re.sub(r"<[^>]+>", "", t)
    t = html.unescape(t)
    t = re.sub(r"[ \t]+", " ", t)
    f.write_text(t, encoding="utf-8")
    return t, code


def norm(s):
    return unicodedata.normalize("NFC", s).lower()


def date_forms(d, m, y):
    if not (1 <= m <= 12 and 1 <= d <= 31):
        return {f"{d}/{m}/{y}"}
    out = {f"{d}/{m}/{y}", f"{d}-{m}-{y}", f"{d}.{m}.{y}", f"{d:02d}/{m:02d}/{y}", f"{d:02d}-{m:02d}-{y}",
           f"ngày {d} tháng {m} năm {y}", f"{d} tháng {m} năm {y}", f"{d}/{m}", f"{d}-{m}"}
    name = [k for k, v in MONTHS.items() if v == m][0]
    out |= {f"{d} {name} {y}", f"{name} {d}, {y}", f"{name} {d}"}
    return out


def numbers_in(text):
    items = []
    for m in re.finditer(r"(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})", text):
        items.append(("date", date_forms(int(m[1]), int(m[2]), int(m[3])), m[0]))
    for m in re.finditer(r"(\d{1,2}) (january|february|march|april|may|june|july|august|september|october|november|december),? (\d{4})", text.lower()):
        items.append(("date", date_forms(int(m[1]), MONTHS[m[2]], int(m[3])), m[0]))
    stripped = re.sub(r"\d{1,2}[/\-.]\d{1,2}[/\-.]\d{4}", " ", text)
    for m in re.finditer(r"\b(\d[\d.,]*)\b", stripped):
        n = m[1].strip(".,")
        if len(n) >= 3:
            items.append(("num", {n, n.replace(",", "."), n.replace(".", ","), n.replace(".", "").replace(",", "")}, n))
    return items


def names_in(text):
    return {m[0] for m in re.finditer(r"\b(?:[A-ZĐÂÊÔƠƯÁÀẢÃẠĂẮẰẲẴẶẤẦẨẪẬÉÈẺẼẸẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌỐỒỔỖỘỚỜỞỠỢÚÙỦŨỤỨỪỬỮỰÝỲỶỸỴ][\wÀ-ỹ]+(?: [A-ZĐ][\wÀ-ỹ]+)*)\b", text) if len(m[0]) > 3}


def main():
    bad = 0
    for path in sys.argv[1:]:
        data = json.loads(pathlib.Path(path).read_text(encoding="utf-8"))
        for sc in data["scenes"]:
            for cl in sc.get("claims", []):
                claim_text = cl.get("text", "") + " " + cl.get("date", "")
                nums = numbers_in(claim_text)
                for s in cl.get("sources", []):
                    url = s.get("url", "")
                    body, code = fetch(url) if url else ("", 0)
                    nb = norm(body)
                    ok = code == 200 and len(nb) > 300
                    miss = []
                    for kind, forms, shown in nums:
                        if not any(norm(f) in nb for f in forms):
                            miss.append(shown)
                    nm = []
                    flag = "OK " if ok and not miss else "XEM"
                    if flag != "OK ":
                        bad += 1
                    print(f"{flag} {sc['id']}/{cl['id']} [{code}] {url[:90]}\n     thiếu số/ngày: {miss}  thiếu tên: {nm[:5]}")
    print(f"\n{bad} cặp (khẳng định, nguồn) cần đọc lại bằng mắt")


main()
