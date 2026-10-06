"""Gom sprite đã cắt (cutsheet.py) vào public/travel/sprites/<thành phố>/ với tên có nghĩa, xoá viền hồng magenta còn sót.
python scripts/art/finalize_sprites.py <thành phố> <thư mục cắt> id=tệp[:x0,y0,x1,y1][@tỉ_lệ] ...
Ví dụ: python scripts/art/finalize_sprites.py tokyo tmp-art/tk_cut sensoji=tk_1.png ramen=tk_2.png
In ra kích thước (w,h) để khai báo trong SPRITES."""
import colorsys
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]


def defringe(im: Image.Image) -> Image.Image:
    a = np.array(im.convert('RGBA'))
    h, w, _ = a.shape
    alpha = a[:, :, 3] > 0
    pad = np.pad(alpha, 1, constant_values=False)
    for _ in range(2):  # hai vòng: viền dày 1–2 điểm
        edge = alpha & ~(pad[:-2, 1:-1] & pad[2:, 1:-1] & pad[1:-1, :-2] & pad[1:-1, 2:])
        for y, x in zip(*np.nonzero(edge)):
            r, g, b = a[y, x, :3] / 255.0
            hh, s, v = colorsys.rgb_to_hsv(r, g, b)
            if 0.78 <= hh <= 0.91 and s > 0.28 and v > 0.28:
                a[y, x, 3] = 0
        alpha = a[:, :, 3] > 0
        pad = np.pad(alpha, 1, constant_values=False)
    out = Image.fromarray(a, 'RGBA')
    bbox = out.getchannel('A').getbbox()
    return out.crop(bbox) if bbox else out


def main():
    city = sys.argv[1]
    src = Path(sys.argv[2])
    dest = ROOT / 'public' / 'travel' / 'sprites' / city
    dest.mkdir(parents=True, exist_ok=True)
    info = {}
    for spec in sys.argv[3:]:
        ident, rest = spec.split('=', 1)
        crop = None
        scale = 1.0
        if '@' in rest:
            rest, sc = rest.rsplit('@', 1)
            scale = float(sc)
        if ':' in rest:
            rest, box = rest.split(':', 1)
            crop = tuple(int(v) for v in box.split(','))
        im = Image.open(src / rest).convert('RGBA')
        if crop:
            im = im.crop(crop)
        im = defringe(im)
        if scale != 1.0:
            im = im.resize((max(1, round(im.size[0] * scale)), max(1, round(im.size[1] * scale))), Image.LANCZOS)
        im.save(dest / f'{ident}.png', optimize=True)
        info[ident] = {'w': im.size[0], 'h': im.size[1]}
    (dest / 'manifest.json').write_text(json.dumps([{'id': k, 'file': f'{k}.png', **v} for k, v in info.items()], indent=1), encoding='utf-8')
    for k, v in info.items():
        print(f"  {k}: {{ w: {v['w']}, h: {v['h']} }},")


if __name__ == '__main__':
    main()
