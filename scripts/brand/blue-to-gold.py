"""
Đổi mọi màu XANH DƯƠNG / CHÀM / TÍM còn sót sang họ VÀNG KIM của Band 9
(người dùng 01/10/2026: "đổi hết mấy chỗ còn màu xanh sang màu vàng").

Đổi theo SẮC ĐỘ chứ không theo danh sách mã: màu có hue 190°–290° và đủ đậm
(độ bão hoà > 0,25) được chuyển sang hue vàng kim 38°, GIỮ độ sáng — nên nền
nhạt vẫn nhạt, nút đậm vẫn đậm. Xanh đậm gần đen (độ sáng < 0,22, như xanh
navy của logo) được giữ nguyên.

Không đụng: cảnh pixel Toa Tàu, Thành phố 3D, cảnh three.js, sprite game,
dữ liệu bài học / biểu đồ trong src/services và src/data.

    python scripts/brand/blue-to-gold.py          # chạy thật
    python scripts/brand/blue-to-gold.py --dry    # chỉ đếm
"""
import colorsys, io, os, re, sys

DRY = '--dry' in sys.argv
ROOTS = ['app', 'src/components', 'src/theme', 'src/navigation', 'src/data/sat-roadmap', 'tailwind.config.js', 'global.css']
# Vật phẩm đã mua bằng sao (nền học, giao diện thanh bên, bìa hồ sơ, hiệu ứng)
# và tranh bản đồ đảo giữ nguyên màu — đổi là đổi món đồ người dùng đã chọn.
SKIP = ('src/components/city', 'src/components/three', 'src/components/rail/', 'src/components/game/sprites', 'src/components/game/PixelSprite',
        'src/components/layout/study-backgrounds.ts', 'src/components/layout/SidebarAtmosphere.tsx', 'src/components/profile/', 'src/components/effects/',
        'src/components/world/', 'app/shop.tsx')
GOLD_H = 38 / 360

def conv(r, g, b):
    h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
    if not (190 / 360 <= h <= 290 / 360) or s <= 0.25 or l < 0.22:
        return None
    s2 = min(s, 0.62) * (0.85 if l < 0.75 else 1.0)
    r2, g2, b2 = colorsys.hls_to_rgb(GOLD_H, l, s2)
    return round(r2 * 255), round(g2 * 255), round(b2 * 255)

HEX = re.compile(r'#([0-9A-Fa-f]{6})(?![0-9A-Fa-f])')
RGBA = re.compile(r'rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*([,)])')

def fix(text):
    n = 0
    def hx(m):
        nonlocal n
        v = m.group(1)
        c = conv(int(v[0:2], 16), int(v[2:4], 16), int(v[4:6], 16))
        if not c:
            return m.group(0)
        n += 1
        out = '#%02X%02X%02X' % c
        return out if v.isupper() or v[0].isdigit() else out.lower()
    def rg(m):
        nonlocal n
        c = conv(int(m.group(1)), int(m.group(2)), int(m.group(3)))
        if not c:
            return m.group(0)
        n += 1
        head = m.group(0)[: m.group(0).index('(') + 1]
        return f'{head}{c[0]}, {c[1]}, {c[2]}{m.group(4)}'
    return RGBA.sub(rg, HEX.sub(hx, text)), n

def files():
    for root in ROOTS:
        if os.path.isfile(root):
            yield root
            continue
        for dp, _, fn in os.walk(root):
            dp = dp.replace('\\', '/')
            for f in fn:
                p = f'{dp}/{f}'
                if p.endswith(('.ts', '.tsx', '.css')) and '.test.' not in f and not p.startswith(SKIP):
                    yield p

total = changed = 0
for p in files():
    s = io.open(p, encoding='utf-8').read()
    t, n = fix(s)
    if n:
        total += n
        changed += 1
        if DRY:
            print(f'{n:4d}  {p}')
        else:
            io.open(p, 'w', encoding='utf-8', newline='').write(t)
print(f'{"[dry] " if DRY else ""}{total} màu trong {changed} tệp')
