"""Dựng gen.html của bìa các bộ sách từ gen.html của bìa Cambridge (cùng khuôn chòm sao).
Chạy: PYTHONUTF8=1 python scripts/vocab/book-covers/build-gen.py
"""
import json
from pathlib import Path

here = Path(__file__).parent
src = (here.parent / 'cam-vocab-covers' / 'gen.html').read_text(encoding='utf-8')
books = json.loads((here / 'books.json').read_text(encoding='utf-8'))


def sub(old, new, count=1):
    global src
    assert src.count(old) == count, (old, src.count(old))
    src = src.replace(old, new)


# 1. Dữ liệu: bỏ bảng WORDS/BASE/palette theo số sách, thay bằng danh sách bộ sách + màu theo góc vàng.
start = src.index('const WORDS = ')
end = src.index('function hex2hsl')
src = src[:start] + 'const BOOKS = ' + json.dumps(books, ensure_ascii=False) + ';\n' + src[end:]

p_start = src.index('function palette(n)')
p_end = src.index('const W = 250')
palette = '''function palette(spec, idx) {
  // Mỗi bộ một màu: góc vàng giữ các bộ cạnh nhau cách xa nhau trên vòng màu.
  const h = (idx * 137.508 + 252) % 360, s = .84;
  const c = hsl2hex(h, s, .66);
  return { ...spec, n: idx + 1, c, light: hsl2hex(h, .92, .78), mid: hsl2hex(h, s * .6, .38), dark: hsl2hex(h, s * .58, .19), deep: hsl2hex(h, s * .6, .095) };
}
'''
src = src[:p_start] + palette + src[p_end:]

# 2. Số lớn: vẽ đúng chữ của bộ sách, tự co cỡ chữ cho vừa bề ngang và mịn điểm theo cỡ chữ.
sub('''  cx.font = "800 150px 'Be Vietnam Pro', 'Segoe UI', sans-serif";''',
    '''  cx.font = "800 150px 'Be Vietnam Pro', 'Segoe UI', sans-serif";
  const m150 = cx.measureText(d.mark).width;
  const msize = Math.min(150, Math.floor(150 * 196 / m150));
  cx.font = `800 ${msize}px 'Be Vietnam Pro', 'Segoe UI', sans-serif`;
  const k = Math.max(.74, Math.min(1, msize / 150));''')
sub('cx.fillText(String(d.n), CX, CY);', 'cx.fillText(d.mark, CX, CY);')
sub('const step = 6.5, img', 'const step = +(6.5 * k).toFixed(2), img')
sub('r="${f(1.9 + R() * 0.9)}"/>`;', 'r="${f((1.9 + R() * 0.9) * k)}"/>`;')
sub('star4(x, y, 6 + R() * 3)', 'star4(x, y, (6 + R() * 3) * k)')
sub('r="${f(0.9 + R() * 0.9)}"/>`', 'r="${f((0.9 + R() * 0.9) * k)}"/>`')

# 3. Chữ trên bìa.
sub('translate(5 120) rotate(90)" font-size="6.5" font-weight="700" letter-spacing="2" fill="${tone}" opacity=".85">IELTS ${d.n} · READING</text>',
    'translate(5 24) rotate(90)" font-size="${d.spine.length > 24 ? 5.2 : 6.5}" font-weight="700" letter-spacing="${d.spine.length > 24 ? 1.4 : 2}" fill="${tone}" opacity=".85">${d.spine}</text>')
sub('<text x="36" y="38" font-size="11" font-weight="800" letter-spacing="2.4" fill="#fff">CAMBRIDGE IELTS</text>',
    '<text x="36" y="38" font-size="${d.kicker.length > 14 ? 9.6 : 11}" font-weight="800" letter-spacing="${d.kicker.length > 14 ? 1.8 : 2.4}" fill="#fff">${d.kicker}</text>')
sub('fill="${d.light}">READING</text>', 'fill="${d.light}">${d.sub}</text>')
sub('>${d.words}</text>', '>${d.value}</text>')
sub('String(d.words).length > 3 ? 13.2 : 16', 'String(d.value).length > 3 ? 13.2 : 16')
sub('<text x="36" y="326" font-size="16.5" font-weight="800" letter-spacing=".8" fill="#fff">VOCABULARY</text>',
    '<text x="36" y="326" font-size="${f(Math.min(16.5, 16.5 * 11 / d.title.length))}" font-weight="800" letter-spacing=".8" fill="#fff">${d.title}</text>')

# 4. Nhãn đơn vị của huy hiệu (mặc định TỪ).
sub('>TỪ</text>', '>${d.unit || "TỪ"}</text>')
sub('font-size="7.4" font-weight="700" letter-spacing="2.6"',
    'font-size="${(d.unit || "TỪ").length > 2 ? 5.6 : 7.4}" font-weight="700" letter-spacing="${(d.unit || "TỪ").length > 2 ? .8 : 2.6}"')

# 5. Điểm vào: nhận id thay cho số sách.
sub('''  const n = +new URLSearchParams(location.search).get('n') || 10;''',
    '''  const id = new URLSearchParams(location.search).get('id') || BOOKS[0].id;
  const idx = Math.max(0, BOOKS.findIndex((b) => b.id === id));''')
sub('coverB(palette(n))', 'coverB(palette(BOOKS[idx], idx))')
sub('/* Sinh bìa bộ từ Cambridge 10–21. Chạy: node scripts/vocab/cam-vocab-covers/render.mjs */',
    '/* Sinh bìa các bộ sách. Chạy: node scripts/vocab/book-covers/render.mjs */')
(here / 'gen.html').write_text(src, encoding='utf-8')
print('ok', len(src))
