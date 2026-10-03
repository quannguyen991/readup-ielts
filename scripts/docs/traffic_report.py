"""Báo cáo lượt xem theo phần của Band 9 (đọc bảng page_views ẩn danh, chỉ số tổng hợp), BỎ trang chủ/giới thiệu khỏi xếp hạng.
python scripts/docs/traffic_report.py   ->  docs/Band9-Luot-xem-theo-phan.pdf + .csv
Khoá lấy từ .env.local (SUPABASE_SERVICE_KEY), không in ra."""
import csv, collections, datetime, html, json, os, pathlib, re, subprocess, sys, urllib.request

sys.stdout.reconfigure(encoding="utf-8")
ROOT = pathlib.Path(__file__).resolve().parents[2]
env = {}
for line in (ROOT / ".env.local").read_text(encoding="utf-8").splitlines():
    if "=" in line and not line.startswith("#"):
        k, v = line.split("=", 1)
        env[k.strip()] = v.strip().strip('"').strip("'")
U, K = env["EXPO_PUBLIC_SUPABASE_URL"], env["SUPABASE_SERVICE_KEY"]

rows, off = [], 0
while True:
    rq = urllib.request.Request(f"{U}/rest/v1/page_views?select=at,visitor,path,device,signed_in&order=at.asc&offset={off}&limit=1000", headers={"apikey": K, "Authorization": "Bearer " + K})
    d = json.load(urllib.request.urlopen(rq, timeout=60))
    rows += d
    if len(d) < 1000:
        break
    off += 1000

AREAS = [
    ("Hôm nay, lộ trình, tiến độ", r"/(dashboard|plan|progress|errors|mastery|lo-trinh-hoc)"),
    ("IELTS Reading", r"/(practice|read|library|mock-tests|review|paste)"),
    ("Từ vựng", r"/vocabulary"),
    ("SAT (Math và Verbal)", r"/(math|sat|sat-rw)"),
    ("Luyện câu và đọc theo VOA", r"/(sentence|shadow)"),
    ("Tài khoản, hồ sơ, cài đặt", r"/(auth|profile|settings|notes|bookmarks)"),
    ("Writing", r"/write"),
    ("Quest, Du ngoạn, Thành phố", r"/quest"),
    ("Xếp hạng, đề tuần, đấu, đổi quà", r"/(leaderboard|weekly|duel|shop)"),
    ("Speaking", r"/speaking"),
    ("Đọc báo song ngữ", r"/bilingual"),
    ("Gói học, mời bạn, thanh toán", r"/(upgrade|checkout|invite|group-buy)"),
    ("Listening", r"/listening"),
    ("Lớp học", r"/(teacher|class|join)"),
    ("Lịch sử Việt Nam", r"/history"),
]


def clean(p):
    return p.split("?")[0].rstrip("/") or "/"


def is_home(p):
    return p in ("/", "/intro")


def area(p):
    for name, pat in AREAS:
        if re.match("^(" + pat + ")(/|$)", p):
            return name
    return "Khác"


body = [r for r in rows if not is_home(clean(r["path"]))]
home = len(rows) - len(body)
cnt = collections.Counter(area(clean(r["path"])) for r in body)
vis = collections.defaultdict(set)
for r in body:
    vis[area(clean(r["path"]))].add(r["visitor"])
total = len(body)
order = [(a, n) for a, n in cnt.most_common()]


def sub(prefix_re, label_map):
    c = collections.Counter()
    for r in body:
        p = clean(r["path"])
        if re.match(prefix_re, p):
            c[label_map(p)] += 1
    return c.most_common()


def vocab_label(p):
    m = re.match(r"^/vocabulary/topic/[^/]+/(\w+)", p)
    names = {"learn": "Học (xen kẽ)", "quiz": "Quiz ôn tập", "cloze": "Điền vào câu", "dictation": "Nghe chép", "speak": "Phát âm", "test": "Kiểm tra", "game": "Bóng bay"}
    if m:
        return names.get(m.group(1), "Màn luyện khác")
    if p == "/vocabulary/topic" or re.match(r"^/vocabulary/topic/[^/]+$", p):
        return "Trang một bộ từ"
    return {"/vocabulary/quiz": "Thư viện bộ từ", "/vocabulary": "Sổ từ", "/vocabulary/topics": "Chủ đề IELTS (danh sách)", "/vocabulary/spaced-repetition": "Ôn tập theo lịch", "/vocabulary/garden": "Vườn từ", "/vocabulary/import": "Học từ bài bạn thích", "/vocabulary/sat-quiz": "Ôn từ vựng SAT"}.get(p, "Khác")


def reading_label(p):
    return {"/practice": "Luyện tập (chọn bài)", "/library": "Kho bài đọc", "/mock-tests": "Thi thử Reading", "/paste": "Dán văn bản"}.get(p, "Phòng làm bài" if p.startswith("/read") else ("Xem lại bài" if p.startswith("/review") else "Khác"))


def sat_label(p):
    if p.startswith("/sat-rw"):
        return "SAT Verbal"
    if p.startswith("/math"):
        return "SAT Math"
    return {"/sat": "Tổng quan SAT", "/sat/full-test": "Thi thử SAT đầy đủ", "/sat/kien-thuc": "Kiến thức SAT"}.get(p, "Lộ trình 27 chương" if p.startswith("/sat/lo-trinh") else "Khác")


def quest_label(p):
    parts = p.split("/")
    k = parts[2] if len(parts) > 2 else ""
    return {"du-ngoan": "Du ngoạn thế giới", "city": "Thành phố Tri thức", "rail": "Chuyến bay từ vựng", "world": "Bản đồ Band 9", "hero": "Nhân vật và nhiệm vụ", "pick": "Chọn mảng / trận nhanh"}.get(k, "Trang Quest")


subs = [
    ("Từ vựng", sub(r"^/vocabulary", vocab_label)),
    ("IELTS Reading", sub(r"^/(practice|read|library|mock-tests|review|paste)", reading_label)),
    ("SAT", sub(r"^/(math|sat|sat-rw)", sat_label)),
    ("Quest", sub(r"^/quest", quest_label)),
]

today = datetime.date.today().strftime("%d/%m/%Y")
first, last = rows[0]["at"][:10], rows[-1]["at"][:10]
mx = order[0][1]


def f(n):
    return f"{n:,}".replace(",", ".")


def bars():
    out = []
    for a, n in order:
        out.append(f'<tr><td class="n">{html.escape(a)}</td><td class="b"><i style="width:{n / mx * 100:.1f}%"></i></td><td class="v">{f(n)}</td><td class="p">{n / total * 100:.1f}%</td><td class="u">{len(vis[a])}</td></tr>')
    return "".join(out)


def subtbl(title, data):
    s = sum(n for _, n in data)
    rws = "".join(f"<tr><td>{html.escape(l)}</td><td class='v'>{f(n)}</td><td class='p'>{n / s * 100:.0f}%</td></tr>" for l, n in data)
    return f"<div class='sub'><h3>{html.escape(title)} <small>({f(s)} lượt)</small></h3><table>{rws}</table></div>"


page = f"""<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Lượt xem theo phần</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;800&display=swap">
<style>@page{{size:A4;margin:16mm}}body{{font:10pt/1.5 "Be Vietnam Pro","Segoe UI",Arial,sans-serif;color:#1B1A17;margin:0}}
h1{{font-size:20pt;margin:0 0 2mm}}h2{{font-size:13pt;margin:7mm 0 2mm}}h3{{font-size:10.5pt;margin:0 0 1.5mm}}small{{font-weight:400;color:#6b675b}}
.lead{{color:#4a463c;margin:0 0 3mm}}.note{{background:#F3EBD8;border-radius:2mm;padding:3mm 4mm;margin:3mm 0;font-size:9.4pt}}
table{{width:100%;border-collapse:collapse}}td{{padding:1.2mm 1.5mm;border-bottom:.3pt solid #E4E0D4;vertical-align:middle}}
.n{{width:42%}}.b{{width:26%}}.b i{{display:block;height:3.2mm;background:#8F6E36;border-radius:1mm}}.v,.p,.u{{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}}
th{{text-align:right;font-size:8pt;color:#6b675b;font-weight:500;padding:0 1.5mm 1mm}}th:first-child{{text-align:left}}
.grid{{display:grid;grid-template-columns:1fr 1fr;gap:5mm 8mm}}.sub{{break-inside:avoid}}.sub td{{padding:.9mm 1mm}}</style></head><body>
<h1>Lượt xem theo từng phần của Band 9</h1>
<p class="lead">Từ {first[8:]}/{first[5:7]} đến {last[8:]}/{last[5:7]}/{last[:4]} · báo cáo ngày {today} · bộ đếm ẩn danh (không IP, không email)</p>
<div class="note"><b>{f(len(rows))} lượt xem trang</b> tổng cộng, trong đó <b>{f(home)}</b> là trang chủ/giới thiệu ({home / len(rows) * 100:.0f}%), đã được bỏ ra khỏi bảng xếp hạng. Phần còn lại <b>{f(total)} lượt</b> được chia theo từng phần như dưới đây, tỉ lệ tính trên {f(total)} lượt này.</div>
<h2>Phân bổ theo phần (không tính trang chủ)</h2>
<table><tr><th>Phần</th><th></th><th>Lượt xem</th><th>Tỉ lệ</th><th>Người</th></tr>{bars()}</table>
<h2 style="break-before:page">Bên trong các phần lớn</h2>
<div class="grid">{"".join(subtbl(t, d) for t, d in subs)}</div>
<div class="note"><b>Cách đọc.</b> Đây là lượt xem trang, chưa phải mức dùng sâu: chưa cho biết ai làm bao nhiêu câu hay ở lại bao lâu. "Người" là số trình duyệt khác nhau, không phải tài khoản. Dữ liệu mới có một tuần và gồm hai ngày tăng đột biến (27/9 và 1/10, trùng đợt ưu đãi), nên chưa phải xu hướng ổn định.</div>
</body></html>"""

OUT = ROOT / "docs"
tmp = ROOT / "tmp-art" / "_luot-xem.html"
tmp.write_text(page, encoding="utf-8")
pdf = OUT / "Band9-Luot-xem-theo-phan.pdf"
if pdf.exists():
    pdf.unlink()
subprocess.run([r"C:\Program Files\Google\Chrome\Application\chrome.exe", "--headless=new", "--disable-gpu", "--no-sandbox", "--no-pdf-header-footer", "--virtual-time-budget=15000", "--print-to-pdf=" + str(pdf), tmp.resolve().as_uri()], capture_output=True, timeout=300)
with open(OUT / "Band9-Luot-xem-theo-phan.csv", "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh)
    w.writerow(["Phần", "Lượt xem (không tính trang chủ)", "Tỉ lệ", "Số người"])
    for a, n in order:
        w.writerow([a, n, f"{n / total * 100:.1f}%", len(vis[a])])
print(f"tổng {len(rows)}, trang chủ {home}, còn {total}; PDF: {pdf.exists()}")
for a, n in order:
    print(f"  {a:34s} {n:5d} {n / total * 100:5.1f}%  {len(vis[a])} người")
for t, d in subs:
    print(t, d)
