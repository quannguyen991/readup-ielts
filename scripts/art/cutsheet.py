"""Cắt bảng sprite AI (nền hồng magenta phẳng) thành từng sprite pixel có alpha.
python cutsheet.py sheet.png out_dir prefix [block=4] [colors=48] [minarea=2500]
- Tách nền bằng khoảng cách màu tới magenta (và viền ngả hồng), tìm vùng liên thông.
- Thu về lưới pixel bằng BOX (block), hạ bão hoà nhẹ, ép bảng màu chung của cả bảng, alpha ngưỡng 0.5.
- Ghi out_dir/prefix_<n>.png (độ phân giải pixel gốc) + manifest.json (bbox gốc, kích thước pixel)."""
import json, os, sys
from collections import deque
from PIL import Image, ImageEnhance

src, out_dir, prefix = sys.argv[1], sys.argv[2], sys.argv[3]
block = int(sys.argv[4]) if len(sys.argv) > 4 else 4
colors = int(sys.argv[5]) if len(sys.argv) > 5 else 48
min_area = int(sys.argv[6]) if len(sys.argv) > 6 else 2500
os.makedirs(out_dir, exist_ok=True)

im = Image.open(src).convert('RGB')
W, H = im.size
px = im.load()


import colorsys


def is_key(r, g, b):
    # nền magenta phẳng + bóng tím sẫm quanh vật: sắc tím-hồng (285°–325°), bão hoà cao
    h, sat, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    return 0.79 <= h <= 0.91 and sat > 0.55 and v > 0.40


mask = bytearray(W * H)  # 1 = vật thể
for y in range(H):
    for x in range(W):
        r, g, b = px[x, y]
        if not is_key(r, g, b):
            mask[y * W + x] = 1

# giãn nhẹ để nối các mảng của cùng một vật (khoảng hở nhỏ trong vật), rồi tìm vùng liên thông ở độ phân giải thấp
step = 4
w2, h2 = W // step, H // step
low = bytearray(w2 * h2)
for y in range(h2):
    for x in range(w2):
        cnt = 0
        for dy in range(step):
            row = (y * step + dy) * W + x * step
            cnt += sum(mask[row:row + step])
        low[y * w2 + x] = 1 if cnt >= 3 else 0
# giãn 2 ô
dil = bytearray(low)
for _ in range(int(os.environ.get("DIL", "1"))):
    nd = bytearray(dil)
    for y in range(1, h2 - 1):
        for x in range(1, w2 - 1):
            if dil[y * w2 + x]:
                for dy in (-1, 0, 1):
                    for dx in (-1, 0, 1):
                        nd[(y + dy) * w2 + x + dx] = 1
    dil = nd

seen = bytearray(w2 * h2)
comps = []
for y in range(h2):
    for x in range(w2):
        i = y * w2 + x
        if dil[i] and not seen[i]:
            q = deque([(x, y)]); seen[i] = 1
            x0 = x1 = x; y0 = y1 = y; n = 0
            while q:
                cx, cy = q.popleft(); n += 1
                x0 = min(x0, cx); x1 = max(x1, cx); y0 = min(y0, cy); y1 = max(y1, cy)
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = cx + dx, cy + dy
                    if 0 <= nx < w2 and 0 <= ny < h2:
                        j = ny * w2 + nx
                        if dil[j] and not seen[j]:
                            seen[j] = 1; q.append((nx, ny))
            comps.append((x0 * step, y0 * step, (x1 + 1) * step, (y1 + 1) * step, n * step * step))

comps = [c for c in comps if c[4] >= min_area]
comps.sort(key=lambda c: (round(c[1] / 220), c[0]))  # theo hàng rồi cột

# bảng màu chung (chỉ các điểm ảnh vật thể)
small = im.resize((W // block, H // block), Image.BOX)
small = ImageEnhance.Color(small).enhance(0.9)
sm_mask = Image.new('L', (W // block, H // block))
sm_mask.putdata([255 if sum(mask[(y * block + dy) * W + x * block + dx] for dy in range(block) for dx in range(block)) >= block * block // 2 else 0
                 for y in range(H // block) for x in range(W // block)])
pal_src = Image.composite(small, Image.new('RGB', small.size, (96, 120, 72)), sm_mask)
q = pal_src.quantize(colors=colors, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert('RGB')

manifest = []
for n, (x0, y0, x1, y1, area) in enumerate(comps, 1):
    bx0, by0 = x0 // block, y0 // block
    bx1, by1 = (x1 + block - 1) // block, (y1 + block - 1) // block
    crop = q.crop((bx0, by0, bx1, by1)).convert('RGBA')
    a = sm_mask.crop((bx0, by0, bx1, by1))
    crop.putalpha(a)
    # cắt sát khung nội dung
    bbox = crop.getbbox()
    if not bbox:
        continue
    crop = crop.crop(bbox)
    name = f'{prefix}_{n}.png'
    crop.save(os.path.join(out_dir, name), optimize=True)
    manifest.append({'file': name, 'w': crop.size[0], 'h': crop.size[1], 'src_bbox': [x0, y0, x1, y1]})
json.dump(manifest, open(os.path.join(out_dir, prefix + '_manifest.json'), 'w'), indent=1)
print(len(manifest), 'sprites ->', out_dir)
for m in manifest:
    print(m['file'], m['w'], 'x', m['h'])
