"""Cắt một tấm lưới nhãn dán (sticker) do ChatGPT vẽ trên nền trắng thành từng PNG nền trong suốt.

python scripts/art/cut-stickers.py sheet.png out_dir prefix [min_area=1500] [join_px=10] [cols=0] [rows=0]

- cols, rows > 0: cắt theo lưới đều (mỗi ô lấy một nhãn lớn nhất). Dùng cho tấm vẽ theo lưới, ổn định hơn.
- cols = rows = 0: tự tìm vùng liên thông trên cả ảnh, gộp các mảnh cách nhau không quá join_px.
- Bỏ nền trắng nối với mép ảnh (nền bên trong viền đen của nhãn được giữ lại).
- Bỏ vùng nhỏ hơn min_area pixel (bụi, chữ ký của ChatGPT ở góc).
- Ghi out_dir/prefix-01.png ... theo thứ tự đọc (trên xuống, trái sang), và manifest.json.
"""
import json
import os
import sys
from collections import deque

from PIL import Image, ImageFilter

src, out_dir, prefix = sys.argv[1], sys.argv[2], sys.argv[3]
min_area = int(sys.argv[4]) if len(sys.argv) > 4 else 1500
join_px = int(sys.argv[5]) if len(sys.argv) > 5 else 10
cols = int(sys.argv[6]) if len(sys.argv) > 6 else 0
rows = int(sys.argv[7]) if len(sys.argv) > 7 else 0
os.makedirs(out_dir, exist_ok=True)


def is_white(px, x, y):
    r, g, b = px[x, y]
    return min(r, g, b) >= 236 and max(r, g, b) - min(r, g, b) <= 22


def components(im, join):
    """Trả về (W, H, fg, label, comps) cho một ảnh RGB: nền ngoài bị bỏ, các mảnh gần nhau được gộp."""
    W, H = im.size
    px = im.load()
    exterior = bytearray(W * H)
    q = deque()
    for x in range(W):
        for y in (0, H - 1):
            if is_white(px, x, y) and not exterior[y * W + x]:
                exterior[y * W + x] = 1
                q.append((x, y))
    for y in range(H):
        for x in (0, W - 1):
            if is_white(px, x, y) and not exterior[y * W + x]:
                exterior[y * W + x] = 1
                q.append((x, y))
    while q:
        x, y = q.popleft()
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < W and 0 <= ny < H:
                i = ny * W + nx
                if not exterior[i] and is_white(px, nx, ny):
                    exterior[i] = 1
                    q.append((nx, ny))
    fg = bytearray(0 if exterior[i] else 1 for i in range(W * H))

    size = max(3, 2 * join // 2 * 2 + 1)
    grow = Image.frombytes('L', (W, H), bytes(255 if v else 0 for v in fg)).filter(ImageFilter.MaxFilter(size=size))
    g = grow.load()
    label = [0] * (W * H)
    comps = []
    cur = 0
    for y in range(H):
        for x in range(W):
            i = y * W + x
            if label[i] or not g[x, y]:
                continue
            cur += 1
            label[i] = cur
            dq = deque([(x, y)])
            minx = maxx = x
            miny = maxy = y
            area = 0
            while dq:
                cx, cy = dq.popleft()
                area += 1
                minx = min(minx, cx)
                maxx = max(maxx, cx)
                miny = min(miny, cy)
                maxy = max(maxy, cy)
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if 0 <= nx < W and 0 <= ny < H:
                        j = ny * W + nx
                        if not label[j] and g[nx, ny]:
                            label[j] = cur
                            dq.append((nx, ny))
            comps.append({'id': cur, 'bbox': (minx, miny, maxx + 1, maxy + 1), 'area': area})
    return W, H, fg, label, comps


def export(im, region, parts, tag, manifest, cell=None):
    """Xuất các nhãn trong một vùng (region = (x0,y0,x1,y1) trên ảnh gốc).

    cell: ô lưới gốc (không kể lề). Khi có, chỉ giữ nhãn lớn nhất có TÂM nằm trong ô đó,
    nên nhãn tràn sang lề (cây, đèn cao) vẫn được giữ đủ mà không lẫn nhãn ô bên cạnh."""
    rx0, ry0, rx1, ry1 = region
    sub = im.crop(region)
    W, H, fg, label, comps = parts
    keep = [c for c in comps if c['area'] >= min_area]
    if cell is not None and keep:
        cx0, cy0, cx1, cy1 = cell
        inside = []
        for c in keep:
            bx0, by0, bx1, by1 = c['bbox']
            mx, my = (bx0 + bx1) / 2 + rx0, (by0 + by1) / 2 + ry0
            if cx0 <= mx < cx1 and cy0 <= my < cy1:
                inside.append(c)
        keep = [max(inside, key=lambda c: c['area'])] if inside else []
    for c in keep:
        x0, y0, x1, y1 = c['bbox']
        x0, y0 = max(0, x0 - 4), max(0, y0 - 4)
        x1, y1 = min(W, x1 + 4), min(H, y1 + 4)
        crop = sub.crop((x0, y0, x1, y1)).convert('RGBA')
        alpha = Image.new('L', (x1 - x0, y1 - y0), 0)
        ap = alpha.load()
        for y in range(y0, y1):
            for x in range(x0, x1):
                i = y * W + x
                if fg[i] and label[i] == c['id']:
                    # Trong chế độ lưới: bỏ phần tràn sang ô bên cạnh theo chiều ngang (chiều dọc giữ lề).
                    if cell is not None and not (cell[0] <= rx0 + x < cell[2]):
                        continue
                    ap[x - x0, y - y0] = 255
        crop.putalpha(alpha)
        manifest.append({'tag': tag, 'region': [rx0, ry0, rx1, ry1], 'bbox': [rx0 + x0, ry0 + y0, rx0 + x1, ry0 + y1], 'area': c['area'], 'crop': crop})


im_full = Image.open(src).convert('RGB')
FW, FH = im_full.size
manifest = []
MARGIN = 60  # lề thêm quanh mỗi ô để nhãn tràn ra ngoài đường kẻ ô vẫn được cắt đủ
if cols and rows:
    cw, ch = FW // cols, FH // rows
    for r in range(rows):
        for cidx in range(cols):
            cell = (cidx * cw, r * ch, (cidx + 1) * cw, (r + 1) * ch)
            region = (max(0, cell[0] - MARGIN), max(0, cell[1] - MARGIN), min(FW, cell[2] + MARGIN), min(FH, cell[3] + MARGIN))
            sub = im_full.crop(region)
            export(im_full, region, components(sub, join_px), f'r{r}c{cidx}', manifest, cell=cell)
else:
    export(im_full, (0, 0, FW, FH), components(im_full, join_px), 'all', manifest)

# Thứ tự đọc: theo dải hàng, rồi trái sang phải.
band = max(1, FH // (rows or 4))
manifest.sort(key=lambda m: ((m['bbox'][1] + m['bbox'][3]) // 2 // band, m['bbox'][0]))
out = []
for n, m in enumerate(manifest, 1):
    name = f'{prefix}-{n:02d}.png'
    m['crop'].save(os.path.join(out_dir, name), optimize=True)
    out.append({'file': name, 'bbox': m['bbox'], 'area': m['area'], 'cell': m['tag']})

with open(os.path.join(out_dir, 'manifest.json'), 'w', encoding='utf-8') as f:
    json.dump(out, f, ensure_ascii=False, indent=2)
print(f'{len(out)} nhãn -> {out_dir}')
for m in out:
    print(m['file'], m['bbox'], m['area'], m['cell'])
