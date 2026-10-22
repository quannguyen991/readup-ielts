"""Tách một tấm lưới nền magenta (#FF00FF) thành các ảnh PNG trong suốt.

Cách dùng:
  python scripts/art/chroma_sheet.py <sheet.png> <outdir> <prefix> <cols> <rows> <name1,name2,...> [--drop-edge-specks]

- --drop-edge-specks: xoá mảnh nhỏ chạm mép ô (mảnh lọt từ ô bên cạnh). Dùng cho icon; không dùng cho mascot.

- Chỉ xoá magenta NỐI VỚI MÉP ảnh (flood fill), nên màu magenta bên trong nhân vật không bị mất.
- Mỗi ô được cắt theo khung chứa phần không trong suốt, có đệm nhỏ, rồi thu về cạnh dài 512px.
- Tên file: <outdir>/<prefix>-<name>.png, theo thứ tự đọc từ trái sang phải, trên xuống dưới.
"""

import sys
from collections import deque
from pathlib import Path

from PIL import Image

KEY = (255, 0, 255)
TOL = 70  # khoảng cách màu tối đa để coi là magenta nền (nối với mép)
INNER_TOL = 45  # ngưỡng cho magenta kín bên trong
PAD = 8
LONG = 512


def dist(a, b):
    return ((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2) ** 0.5


def key_out(img: Image.Image) -> Image.Image:
    rgba = img.convert("RGBA")
    w, h = rgba.size
    px = rgba.load()
    seen = bytearray(w * h)
    q = deque()
    for x in range(w):
        q.append((x, 0))
        q.append((x, h - 1))
    for y in range(h):
        q.append((0, y))
        q.append((w - 1, y))
    while q:
        x, y = q.popleft()
        if x < 0 or y < 0 or x >= w or y >= h:
            continue
        i = y * w + x
        if seen[i]:
            continue
        seen[i] = 1
        r, g, b, a = px[x, y]
        if dist((r, g, b), KEY) > TOL:
            continue
        px[x, y] = (r, g, b, 0)
        q.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))
    # Mảng magenta kín (không nối với mép) vẫn còn: xoá các pixel rất gần magenta thuần.
    # Ngưỡng hẹp để không đụng màu nhạt của chi tiết như chữ Z.
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a and dist((r, g, b), KEY) <= INNER_TOL:
                px[x, y] = (r, g, b, 0)
    # Viền magenta còn sót ở mép (pha tím) sát vùng trong suốt: xoá.
    fringe = [(x, y) for y in range(h) for x in range(w) if px[x, y][3] and _magenta_ish(px[x, y]) and _touches_clear(px, x, y, w, h)]
    for x, y in fringe:
        px[x, y] = (0, 0, 0, 0)
    return rgba


def _magenta_ish(p):
    r, g, b, a = p
    return r > 140 and b > 140 and g < 120 and r + b > g * 3


def _touches_clear(px, x, y, w, h):
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        nx, ny = x + dx, y + dy
        if 0 <= nx < w and 0 <= ny < h and px[nx, ny][3] == 0:
            return True
    return False


def drop_edge_specks(cell: Image.Image) -> Image.Image:
    """Xoá các mảnh nhỏ chạm mép ô (thường là mảnh của ô bên cạnh lọt vào). Mảnh lớn được giữ."""
    w, h = cell.size
    a = cell.getchannel("A")
    px = a.load()
    seen = bytearray(w * h)
    limit = 0.08 * w * h
    out = cell.copy()
    op = out.load()
    for sy in range(h):
        for sx in range(w):
            if px[sx, sy] == 0 or seen[sy * w + sx]:
                continue
            comp = [(sx, sy)]
            seen[sy * w + sx] = 1
            q = deque([(sx, sy)])
            touches = False
            while q:
                x, y = q.popleft()
                if x in (0, w - 1) or y in (0, h - 1):
                    touches = True
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if 0 <= nx < w and 0 <= ny < h and px[nx, ny] and not seen[ny * w + nx]:
                        seen[ny * w + nx] = 1
                        comp.append((nx, ny))
                        q.append((nx, ny))
            if touches and len(comp) < limit:
                for x, y in comp:
                    op[x, y] = (0, 0, 0, 0)
    return out


def main() -> None:
    sheet, outdir, prefix, cols, rows, names = sys.argv[1:7]
    specks = "--drop-edge-specks" in sys.argv
    cols, rows = int(cols), int(rows)
    names = names.split(",")
    if len(names) != cols * rows:
        raise SystemExit(f"Cần đúng {cols * rows} tên, nhận {len(names)}")
    out = Path(outdir)
    out.mkdir(parents=True, exist_ok=True)
    img = key_out(Image.open(sheet))
    w, h = img.size
    cw, ch = w // cols, h // rows
    for idx, name in enumerate(names):
        r, c = divmod(idx, cols)
        cell = img.crop((c * cw, r * ch, (c + 1) * cw, (r + 1) * ch))
        if specks:
            cell = drop_edge_specks(cell)
        bbox = cell.getchannel("A").getbbox()
        if bbox:
            x0, y0, x1, y1 = bbox
            cell = cell.crop((max(0, x0 - PAD), max(0, y0 - PAD), min(cw, x1 + PAD), min(ch, y1 + PAD)))
        scale = LONG / max(cell.size)
        if scale < 1:
            cell = cell.resize((round(cell.size[0] * scale), round(cell.size[1] * scale)), Image.LANCZOS)
        dest = out / f"{prefix}-{name.strip()}.png"
        cell.save(dest)
        print(dest, cell.size)


if __name__ == "__main__":
    main()
