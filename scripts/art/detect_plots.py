"""Tìm các ô đất trống (xám nhạt phẳng) trong ảnh nền .small.png. python detect_plots.py <png> -> in danh sách hình chữ nhật (x0,y0,x1,y1)."""
import sys, json
from collections import deque
from PIL import Image
im = Image.open(sys.argv[1]).convert('RGB'); W, H = im.size; px = im.load()
def plot(c):
    r, g, b = c
    return 150 <= r <= 215 and abs(r-g) < 14 and abs(g-b) < 16 and r >= g-2 and max(r,g,b)-min(r,g,b) < 26
m = [[plot(px[x, y]) for x in range(W)] for y in range(H)]
seen = [[0]*W for _ in range(H)]; out = []
for y in range(H):
    for x in range(W):
        if m[y][x] and not seen[y][x]:
            q = deque([(x, y)]); seen[y][x] = 1; xs = [x, x]; ys = [y, y]; n = 0
            while q:
                cx, cy = q.popleft(); n += 1
                xs[0] = min(xs[0], cx); xs[1] = max(xs[1], cx); ys[0] = min(ys[0], cy); ys[1] = max(ys[1], cy)
                for dx, dy in ((1,0),(-1,0),(0,1),(0,-1)):
                    nx, ny = cx+dx, cy+dy
                    if 0 <= nx < W and 0 <= ny < H and m[ny][nx] and not seen[ny][nx]:
                        seen[ny][nx] = 1; q.append((nx, ny))
            w = xs[1]-xs[0]+1; h = ys[1]-ys[0]+1
            if n > 350 and n/(w*h) > 0.55 and 14 < w < 150 and 14 < h < 90:
                out.append([xs[0], ys[0], xs[1], ys[1]])
out.sort(key=lambda r: (r[1]//40, r[0]))
print(json.dumps(out))
