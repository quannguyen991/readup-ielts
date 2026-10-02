"""
Sinh lưới thô (walk/water) cho bản đồ chế độ ảnh từ ảnh nhỏ <city>.small.png.

  python walkmask.py <city> [out_ts] [preview_png]

1. Phân loại điểm ảnh theo màu (đường đất / đá lát / lối đi → đi được; xanh lam → nước).
2. Gộp theo ô CELL×CELL (đa số), đóng lỗ nhỏ (người, bàn ghế), bỏ đảo nhỏ.
3. Áp tay: EXCLUDE (toà nhà, tượng… dù màu giống đường) và INCLUDE (cầu, sân…).
Kết quả là dữ liệu ĐÃ CHỈNH TAY: soát bằng lớp gỡ lỗi `?debug=1` của trang thử.
"""
import sys, colorsys, json
import numpy as np
from PIL import Image

CELL = 2
city = sys.argv[1]
out_ts = sys.argv[2] if len(sys.argv) > 2 else None
prev = sys.argv[3] if len(sys.argv) > 3 and not sys.argv[3].startswith('--') else None

CFG = json.load(open(__file__.replace('walkmask.py', 'walkmask.cfg.json'), encoding='utf-8'))[city]
SRC_DIR = CFG.get('dir', 'maps')
SRC_CITY = CFG.get('city', city)

im = np.array(Image.open(f'public/travel/{SRC_DIR}/{SRC_CITY}.small.png').convert('RGB'))
H, W, _ = im.shape
hsv = np.zeros((H, W, 3))
for y in range(H):
    for x in range(W):
        hsv[y, x] = colorsys.rgb_to_hsv(*(im[y, x] / 255.0))
h = hsv[..., 0] * 360
s = hsv[..., 1]
v = hsv[..., 2]
rule = CFG['walk']
walk = np.zeros((H, W), bool)
for r in rule:
    m = (h >= r['h'][0]) & (h <= r['h'][1]) & (s >= r['s'][0]) & (s <= r['s'][1]) & (v >= r['v'][0]) & (v <= r['v'][1])
    walk |= m
wr = CFG.get('water', {'h': [165, 215], 's': [0.55, 1], 'v': [0.12, 0.5]})
water = (h >= wr['h'][0]) & (h <= wr['h'][1]) & (s >= wr['s'][0]) & (s <= wr['s'][1]) & (v >= wr['v'][0]) & (v <= wr['v'][1])

MW = (W + CELL - 1) // CELL
MH = (H + CELL - 1) // CELL
def cells(mask):
    out = np.zeros((MH, MW), bool)
    for j in range(MH):
        for i in range(MW):
            blk = mask[j*CELL:(j+1)*CELL, i*CELL:(i+1)*CELL]
            out[j, i] = blk.mean() >= 0.5
    return out
cw = cells(walk)
cwat = cells(water)

def rect_cells(r):
    x, y, w, hh = r
    return slice(max(0, y // CELL), min(MH, (y + hh + CELL - 1) // CELL)), slice(max(0, x // CELL), min(MW, (x + w + CELL - 1) // CELL))

# đóng lỗ: ô chặn nằm giữa nhiều ô đi được thì thành đi được (người, bàn)
def dilate(a):
    o = a.copy()
    o[1:, :] |= a[:-1, :]; o[:-1, :] |= a[1:, :]; o[:, 1:] |= a[:, :-1]; o[:, :-1] |= a[:, 1:]
    return o
def erode(a):
    return ~dilate(~a)
for _ in range(CFG.get('close', 1)):
    cw = erode(dilate(cw))

if CFG.get('limit'):
    lim = np.zeros_like(cw)
    for r in CFG['limit']:
        a, b = rect_cells(r); lim[a, b] = True
    cw &= lim
exmask = np.zeros((MH, MW), bool)
for r in CFG.get('exclude', []):
    a, b = rect_cells(r); cw[a, b] = False; exmask[a, b] = True
for r in CFG.get('include', []):
    a, b = rect_cells(r); cw[a, b] = True
for (x0, y0, x1, y1, wd) in CFG.get('include_lines', []):
    n = max(abs(x1 - x0), abs(y1 - y0), 1)
    for t in range(n + 1):
        cx = x0 + (x1 - x0) * t / n; cy = y0 + (y1 - y0) * t / n
        a, b = rect_cells((int(cx - wd / 2), int(cy - wd / 2), wd, wd)); cw[a, b] = True
for (x0, y0, x1, y1, wd) in CFG.get('exclude_lines', []):
    n = max(abs(x1 - x0), abs(y1 - y0), 1)
    for t in range(n + 1):
        cx = x0 + (x1 - x0) * t / n; cy = y0 + (y1 - y0) * t / n
        a, b = rect_cells((int(cx - wd / 2), int(cy - wd / 2), wd, wd)); cw[a, b] = False
for r in CFG.get('exclude_late', []):
    a, b = rect_cells(r); cw[a, b] = False
cw &= ~cwat

# giữ thành phần liên thông chứa các điểm hạt giống (spawn + cửa); bỏ đảo nhỏ khác
seeds = [tuple(p) for p in CFG['seeds']]
lab = np.zeros((MH, MW), int); n = 0
keep = np.zeros((MH, MW), bool)
stack = []
def snap(sx, sy, R=8):
    i0, j0 = sx // CELL, sy // CELL
    best = None
    for r in range(R + 1):
        for j in range(j0 - r, j0 + r + 1):
            for i in range(i0 - r, i0 + r + 1):
                if max(abs(i - i0), abs(j - j0)) != r or not (0 <= i < MW and 0 <= j < MH) or not cw[j, i]: continue
                d = (i - i0) ** 2 + (j - j0) ** 2
                if best is None or d < best[0]: best = (d, i, j)
        if best: return best[1], best[2]
    return None
first = None
snapped = []
for (sx, sy) in seeds:
    i, j = sx // CELL, sy // CELL
    if not cw[j, i]:
        sn = snap(sx, sy)
        print('SEED NOT WALKABLE', sx, sy, '-> nearest walkable', None if not sn else (sn[0] * CELL + 1, sn[1] * CELL + 1))
        if not sn: continue
        i, j = sn
    snapped.append((sx, sy, i, j))
if snapped:
    stack.append((snapped[0][2], snapped[0][3]))

# Nối tự động các hạt giống bị tách rời: BFS qua ô không phải nước / không bị loại, đào hành lang rộng 3 ô.
from collections import deque
def comp_of(i, j, grid):
    st = [(i, j)]; seen_c = {(i, j)}
    while st:
        a, b = st.pop()
        for da, db in ((1,0),(-1,0),(0,1),(0,-1)):
            x, y = a + da, b + db
            if 0 <= x < MW and 0 <= y < MH and grid[y, x] and (x, y) not in seen_c:
                seen_c.add((x, y)); st.append((x, y))
    return seen_c
if '--nobridge' not in sys.argv and snapped:
    main = comp_of(snapped[0][2], snapped[0][3], cw)
    for (sx, sy, i, j) in snapped[1:]:
        if (i, j) in main: continue
        # BFS từ thành phần chính tới (i, j)? ngược lại: từ hạt giống tới thành phần chính
        back = {(i, j): None}
        dq = deque([(i, j)])
        hit = None
        while dq and hit is None:
            a, b = dq.popleft()
            for da, db in ((1,0),(-1,0),(0,1),(0,-1)):
                x, y = a + da, b + db
                if not (0 <= x < MW and 0 <= y < MH) or (x, y) in back: continue
                if cwat[y, x] or exmask[y, x]: continue
                back[(x, y)] = (a, b)
                if (x, y) in main: hit = (x, y); break
                dq.append((x, y))
        if hit is None:
            print('CANNOT BRIDGE', sx, sy); continue
        node = hit
        while node is not None:
            a, b = node
            for da in (-1, 0, 1):
                for db in (-1, 0, 1):
                    x, y = a + da, b + db
                    if 0 <= x < MW and 0 <= y < MH and not cwat[y, x] and not exmask[y, x]: cw[y, x] = True
            node = back[node]
        main = comp_of(snapped[0][2], snapped[0][3], cw)
        print('bridged', sx, sy)
seen = np.zeros((MH, MW), bool)
while stack:
    i, j = stack.pop()
    if seen[j, i] or not cw[j, i]: continue
    seen[j, i] = True
    for di, dj in ((1,0),(-1,0),(0,1),(0,-1)):
        a, b = i+di, j+dj
        if 0 <= a < MW and 0 <= b < MH and cw[b, a] and not seen[b, a]: stack.append((a, b))
for (sx, sy, i, j) in snapped:
    if not seen[j, i]: print('NOT CONNECTED TO FIRST SEED:', sx, sy)
cw = cw if '--all' in sys.argv else seen
# ô đi được nằm cạnh nước nhưng bị bỏ: giữ ô nước
rows = []
for j in range(MH):
    rows.append(''.join('#' if cw[j, i] else ('~' if cwat[j, i] else '.') for i in range(MW)))
print('walk cells', int(cw.sum()), 'water', int((cwat & ~cw).sum()), 'size', MW, MH)
if out_ts:
    name = ''.join(w.capitalize() for w in city.split('-'))
    with open(out_ts, 'w', encoding='utf-8') as f:
        f.write(f"/**\n * Lưới thô mặt đất của bản đồ ảnh `{city}` (ô {CELL}×{CELL} điểm nguồn): '#' đi được, '~' nước, '.' chặn.\n * SINH BỞI `tools/walkmask.py` rồi chỉnh tay theo cấu hình `tools/walkmask.cfg.json`; đừng sửa tay từng dòng.\n */\n")
        f.write(f"export const {city.upper().replace('-', '_')}_MASK_CELL = {CELL};\n")
        f.write(f"export const {city.upper().replace('-', '_')}_MASK: string[] = [\n")
        for r in rows: f.write(f"  '{r}',\n")
        f.write('];\n')
if prev:
    base = Image.fromarray(im).convert('RGB')
    pv = np.array(base).astype(float)
    for j in range(MH):
        for i in range(MW):
            y0, y1, x0, x1 = j*CELL, min(H,(j+1)*CELL), i*CELL, min(W,(i+1)*CELL)
            if cw[j, i]: pv[y0:y1, x0:x1] = pv[y0:y1, x0:x1]*0.45 + np.array([255,0,255])*0.55
            elif cwat[j, i]: pv[y0:y1, x0:x1] = pv[y0:y1, x0:x1]*0.8 + np.array([0,120,255])*0.2
    out = Image.fromarray(pv.astype(np.uint8)).resize((W*3, H*3), Image.NEAREST)
    from PIL import ImageDraw
    d = ImageDraw.Draw(out)
    for p in CFG.get('pois', []):
        x, y, w, hh = p['hot']
        d.rectangle([x*3, y*3, (x+w)*3, (y+hh)*3], outline=(255,40,40))
        dx, dy = p['door']
        d.line([(dx*3-5, dy*3), (dx*3+5, dy*3)], fill=(255,230,60)); d.line([(dx*3, dy*3-5), (dx*3, dy*3+5)], fill=(255,230,60))
        d.text((x*3+2, y*3+2), p['id'], fill=(255,255,255))
    out.save(prev)
