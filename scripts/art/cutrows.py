"""Cắt bảng sprite 3 hàng: tự tìm 2 khoảng trống ngang rộng nhất (nền magenta) rồi gọi cutsheet cho từng hàng.
python cutrows.py sheet.png out_dir prefix  -> out_dir/prefix_r{1..3}_{1..3}.png"""
import sys, subprocess, os, colorsys
from PIL import Image
src, out, prefix = sys.argv[1:4]
im = Image.open(src).convert('RGB'); W, H = im.size; px = im.load()
def key(c):
    h, s, v = colorsys.rgb_to_hsv(c[0]/255, c[1]/255, c[2]/255)
    return 0.79 <= h <= 0.91 and s > 0.55 and v > 0.40
cnt = []
for y in range(H):
    cnt.append(sum(1 for x in range(0, W, 2) if not key(px[x, y])))
gaps = []; y = 0
while y < H:
    if cnt[y] <= 2:
        y0 = y
        while y < H and cnt[y] <= 2: y += 1
        if y0 > 40 and y < H - 40: gaps.append((y - y0, (y0 + y) // 2))
    else: y += 1
gaps.sort(reverse=True); cuts = sorted(g[1] for g in gaps[:2])
print('cuts', cuts, 'gaps', gaps[:4])
bounds = list(zip([0] + cuts, cuts + [H]))
os.makedirs(out, exist_ok=True)
for n, (a, b) in enumerate(bounds, 1):
    r = Image.new('RGB', (W, H), (255, 0, 255)); r.paste(im.crop((0, a, W, b)), (0, a))
    tmp = f'{out}/_row{n}.png'; r.save(tmp)
    subprocess.run([sys.executable, os.path.join(os.path.dirname(__file__), 'cutsheet.py'), tmp, out, f'{prefix}_r{n}', '4', '56', '2500'])
    os.remove(tmp)
