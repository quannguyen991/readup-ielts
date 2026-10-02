"""Tìm điểm sáng (sao) trên tranh nền pixel để gắn chấm nhấp nháy.
Dùng:  python scripts/art/star-points.py starry [rhone cafe ...]
In ra mảng [x, y] theo lưới 418x235, dán vào `stars` của mục tương ứng trong src/data/backdrops.ts.
"""
import sys
import numpy as np
from PIL import Image
from scipy.ndimage import maximum_filter, uniform_filter

def find(id_, limit=16, top=0.55, gap=20):
    im = np.asarray(Image.open(f"public/backdrops/{id_}.small.png").convert("RGB")).astype(float)
    lum = im @ np.array([0.299, 0.587, 0.114])
    H, W = lum.shape
    local = uniform_filter(lum, 15)
    peak = (lum == maximum_filter(lum, 7)) & (lum - local > 38)
    ys, xs = np.nonzero(peak)
    cand = [(lum[y, x] - local[y, x], x, y) for x, y in zip(xs, ys) if y < H * top and 4 < x < W - 4 and y > 4]
    cand.sort(reverse=True)
    out = []
    for _, x, y in cand:
        if all((x - a) ** 2 + (y - b) ** 2 >= gap * gap for a, b in out):
            out.append((int(x), int(y)))
        if len(out) >= limit:
            break
    return out

for i in sys.argv[1:]:
    print(i, find(i))
