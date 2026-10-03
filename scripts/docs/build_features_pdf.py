"""Dựng PDF "Band 9 — Tất cả tính năng" từ docs/tinh-nang.md (đã kiểm kê từ code) bằng Chrome headless.
python scripts/docs/build_features_pdf.py   ->  docs/Band9-Tinh-nang.pdf
Định dạng docs/tinh-nang.md: `## Tiêu đề mảng`, gạch đầu dòng `- ` (có thể thụt hai cấp bằng 2 dấu cách), đoạn văn thường,
**đậm** trong dòng. Dòng đầu tiên bắt đầu bằng `# ` là tiêu đề tài liệu; khối `> ` ngay sau đó là lời mở."""
import html, io, os, pathlib, re, subprocess, sys, datetime
sys.stdout.reconfigure(encoding="utf-8")

ROOT = pathlib.Path(__file__).resolve().parents[2]
SRC = ROOT / "docs" / "tinh-nang.md"
OUT_PDF = ROOT / "docs" / "Band9-Tinh-nang.pdf"
TMP = ROOT / "tmp-art" / "_tinh-nang.html"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"


def inline(s: str) -> str:
    s = html.escape(s, quote=False)
    s = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", s)
    s = re.sub(r"`(.+?)`", r"<code>\1</code>", s)
    return s


def parse(md: str):
    title, lead, sections, cur = "", [], [], None
    for raw in md.splitlines():
        line = raw.rstrip()
        if line.startswith("# "):
            title = line[2:].strip()
        elif line.startswith("> "):
            lead.append(line[2:])
        elif line.startswith("## "):
            cur = {"h": line[3:].strip(), "items": []}
            sections.append(cur)
        elif cur is not None and line.strip():
            m = re.match(r"^(\s*)[-*] (.*)$", line)
            if m:
                cur["items"].append(("li2" if len(m.group(1)) >= 2 else "li", m.group(2)))
            elif line.startswith("### "):
                cur["items"].append(("h3", line[4:].strip()))
            else:
                cur["items"].append(("p", line.strip()))
    return title, lead, sections


def build_html(title, lead, sections):
    toc = "".join(f'<li><a href="#s{i}">{html.escape(s["h"])}</a></li>' for i, s in enumerate(sections))
    body = []
    for i, s in enumerate(sections):
        parts, ul = [], 0
        for kind, text in s["items"]:
            if kind in ("li", "li2"):
                if not ul:
                    parts.append("<ul>")
                    ul = 1
                parts.append(f'<li class="{kind}">{inline(text)}</li>')
            else:
                if ul:
                    parts.append("</ul>")
                    ul = 0
                parts.append(f"<h3>{inline(text)}</h3>" if kind == "h3" else f"<p>{inline(text)}</p>")
        if ul:
            parts.append("</ul>")
        body.append(f'<section id="s{i}"><div class="no">{i + 1:02d}</div><h2>{html.escape(s["h"])}</h2>{"".join(parts)}</section>')
    today = datetime.date.today().strftime("%d/%m/%Y")
    leadh = "".join(f"<p>{inline(x)}</p>" for x in lead if x.strip())
    return f"""<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>{html.escape(title)}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;800&family=IBM+Plex+Mono:wght@500&display=swap">
<style>
@page{{size:A4;margin:18mm 16mm 20mm;@bottom-center{{content:counter(page);font:500 8pt 'IBM Plex Mono',monospace;color:#8F6E36}}}}
@page :first{{margin:0}}
*{{box-sizing:border-box}}
body{{margin:0;font:400 10.6pt/1.55 "Be Vietnam Pro","Segoe UI",Arial,sans-serif;color:#1B1A17}}
.cover{{height:297mm;padding:30mm 22mm;background:#14213D;color:#F2EFE6;page-break-after:always;display:flex;flex-direction:column;justify-content:space-between}}
.cover .tag{{font:500 9pt "IBM Plex Mono",monospace;letter-spacing:.16em;text-transform:uppercase;color:#D4B16A}}
.cover h1{{font-weight:800;font-size:40pt;line-height:1.1;margin:10mm 0 6mm;letter-spacing:-.01em;max-width:150mm}}
.cover .sub{{font-size:14pt;line-height:1.5;max-width:140mm;color:#D8D4C6}}
.cover .meta{{font-size:10pt;color:#B4AF9F}}
.cover .gold{{width:30mm;height:2mm;background:#D4B16A;margin-top:8mm}}
.intro{{page-break-after:always}}
.intro h2{{font-size:18pt;margin:0 0 5mm}}
.intro .lead p{{font-size:11.5pt;margin:0 0 3mm}}
.toc{{columns:2;column-gap:10mm;padding:0;list-style:none;counter-reset:t;margin:6mm 0 0}}
.toc li{{counter-increment:t;margin:0 0 2.2mm;break-inside:avoid}}
.toc li::before{{content:counter(t,decimal-leading-zero) "  ";font:500 8.5pt "IBM Plex Mono",monospace;color:#8F6E36}}
.toc a{{color:#1B1A17;text-decoration:none}}
section{{margin:0 0 9mm}}
section h2{{font-size:16pt;font-weight:800;margin:0 0 3mm;padding-top:2mm;border-top:1.2pt solid #8F6E36;break-after:avoid}}
section .no{{break-after:avoid;font:500 8.5pt "IBM Plex Mono",monospace;color:#8F6E36;letter-spacing:.1em;margin-top:2mm}}
section h3{{font-size:11.5pt;margin:4mm 0 1.5mm;break-after:avoid}}
ul{{margin:0 0 2mm;padding-left:5mm}}
li{{margin:0 0 1.6mm;break-inside:avoid}}
li.li2{{margin-left:5mm;list-style:circle;color:#3B382F}}
p{{margin:0 0 2.5mm}}
b{{font-weight:600}}
code{{font:500 9pt "IBM Plex Mono",monospace;background:#F3EBD8;padding:0 1.2mm;border-radius:1mm}}
</style></head><body>
<div class="cover"><div><div class="tag">Band 9 · Tài liệu tính năng</div><h1>{html.escape(title)}</h1><div class="sub">Danh sách đầy đủ những gì ứng dụng làm được, kiểm kê từ chính ứng dụng ở thời điểm {today}.</div><div class="gold"></div></div><div class="meta">Luyện IELTS và SAT bằng tiếng Việt · band9-ielts.vercel.app</div></div>
<div class="intro"><h2>Cách đọc tài liệu này</h2><div class="lead">{leadh}</div><ol class="toc">{toc}</ol></div>
{"".join(body)}
</body></html>"""


def main():
    md = SRC.read_text(encoding="utf-8")
    title, lead, sections = parse(md)
    TMP.parent.mkdir(exist_ok=True)
    TMP.write_text(build_html(title, lead, sections), encoding="utf-8")
    if OUT_PDF.exists():
        OUT_PDF.unlink()
    cmd = [CHROME, "--headless=new", "--disable-gpu", "--no-sandbox", "--no-pdf-header-footer", "--run-all-compositor-stages-before-draw",
           "--virtual-time-budget=20000", "--print-to-pdf=" + str(OUT_PDF), TMP.resolve().as_uri()]
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
    if not OUT_PDF.exists():
        print(r.stdout[-2000:], r.stderr[-2000:])
        sys.exit("Chrome không tạo được PDF")
    print(f"{OUT_PDF} ({OUT_PDF.stat().st_size // 1024} KB), {len(sections)} mảng")


if __name__ == "__main__":
    main()
