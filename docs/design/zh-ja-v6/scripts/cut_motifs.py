"""Bóc tách tấm họa tiết nền magenta (lưới 3x3) thành từng PNG có alpha.

Dùng:  python -I cut_motifs.py ja-creatures [zh-flora ...]   (không tham số = mọi tấm có trong raw/motifs)
Vào:   docs/design/zh-ja-v6/raw/motifs/<tấm>.png
Ra:    assets/east-asian/v6/<ja|zh>/<tấm>-NN.png   (NN theo thứ tự đọc trái→phải, trên→dưới)
       docs/design/zh-ja-v6/preview/<tấm>.png      (ảnh xem trước trên nền caro)
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[4]
RAW = ROOT / "docs/design/zh-ja-v6/raw/motifs"
PREVIEW = ROOT / "docs/design/zh-ja-v6/preview"
OUT = ROOT / "assets/east-asian/v6"
MAG = np.array([255.0, 0.0, 255.0], dtype=np.float32)
MAX_SIDE = 760
import os
GROUP_DILATE = int(os.environ.get("GROUP_DILATE", "16"))
MIN_AREA = 1800


def alpha_of(rgb):
    d = np.sqrt(((rgb - MAG) ** 2).sum(axis=2))
    return np.clip((d - 55.0) / 90.0, 0.0, 1.0)


def despill(rgb, a):
    """Bỏ viền hồng-tím còn sót ở mép bán trong suốt."""
    out = rgb.copy()
    edge = (a > 0.02) & (a < 0.98)
    aa = np.maximum(a[edge], 0.05)[:, None]
    out[edge] = np.clip((rgb[edge] - (1.0 - aa) * MAG) / aa, 0, 255)
    return out


def cut(sheet: str):
    ui = sheet.startswith("ui/")
    sheet = sheet[3:] if ui else sheet
    lang = "ui" if ui else sheet.split("-")[0]
    src = (RAW.parent / "ui" if ui else RAW) / f"{sheet}.png"
    img = Image.open(src).convert("RGB")
    rgb = np.asarray(img).astype(np.float32)
    H, W = rgb.shape[:2]
    a = alpha_of(rgb)
    solid = ndimage.binary_opening(a > 0.5, iterations=1)
    near = ndimage.binary_dilation(solid, iterations=GROUP_DILATE)
    lab, n = ndimage.label(near)
    groups = []
    for i in range(1, n + 1):
        m = (lab == i) & solid
        area = int(m.sum())
        if area < MIN_AREA:
            continue
        ys, xs = np.where(m)
        groups.append({"lab": i, "area": area, "cx": xs.mean(), "cy": ys.mean()})
    cells = {}
    for g in groups:
        col = min(2, int(g["cx"] // (W / 3)))
        row = min(2, int(g["cy"] // (H / 3)))
        cells.setdefault(row * 3 + col, []).append(g)
    missing = [k + 1 for k in range(9) if k not in cells]
    print(f"{sheet}: {len(groups)} nhóm, ô trống: {missing or 'không'}")
    outdir = OUT / lang
    outdir.mkdir(parents=True, exist_ok=True)
    PREVIEW.mkdir(parents=True, exist_ok=True)
    pieces = []
    for k in range(9):
        if k not in cells:
            continue
        union = np.isin(lab, [g["lab"] for g in cells[k]])
        mask = ndimage.binary_dilation(union & solid, iterations=2)
        ys, xs = np.where(mask)
        x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
        pad = 6
        x0, y0, x1, y1 = max(0, x0 - pad), max(0, y0 - pad), min(W, x1 + pad), min(H, y1 + pad)
        aa = (a * mask)[y0:y1, x0:x1]
        col = despill(rgb, a)[y0:y1, x0:x1]
        tile = Image.fromarray(np.dstack([col.astype(np.uint8), (aa * 255).astype(np.uint8)]), "RGBA")
        s = MAX_SIDE / max(tile.size)
        if s < 1:
            tile = tile.resize((max(1, round(tile.width * s)), max(1, round(tile.height * s))), Image.LANCZOS)
        path = outdir / f"{sheet}-{k + 1:02d}.png"
        tile.save(path, optimize=True)
        pieces.append((k + 1, tile))
        print("  ", path.relative_to(ROOT), tile.size)
    # xem trước: lưới 3x3 trên nền caro
    cell = 300
    board = Image.new("RGB", (cell * 3, cell * 3), (60, 60, 70))
    px = board.load()
    for y in range(board.height):
        for x in range(board.width):
            if ((x // 20) + (y // 20)) % 2:
                px[x, y] = (84, 84, 96)
    for idx, tile in pieces:
        t = tile.copy()
        t.thumbnail((cell - 20, cell - 20))
        r, c = divmod(idx - 1, 3)
        board.paste(t, (c * cell + (cell - t.width) // 2, r * cell + (cell - t.height) // 2), t)
    board.save(PREVIEW / f"{sheet}.png")


if __name__ == "__main__":
    names = sys.argv[1:] or sorted(p.stem for p in RAW.glob("*.png"))
    for nm in names:
        cut(nm)
