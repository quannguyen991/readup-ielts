"""Vẽ thêm icon pixel neon (cùng phong cách bộ assets/neon của trang Hôm nay) bằng code, không cần ChatGPT.

Mỗi icon vẽ trên lưới 32x32 bằng hình đơn giản, tự thêm viền tối, tô bóng cạnh dưới-phải, điểm sáng góc trên-trái,
phóng gấp 8 lần theo láng giềng gần nhất (giữ ô vuông pixel) và thêm vầng sáng. Ra: assets/neon2/<tên>.png (nền trong suốt).

Chạy:  python scripts/art/neon_extra_icons.py
"""
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

S = 32
SCALE = 8
OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'assets', 'neon2')

PINK, GOLD, CYAN, BLUE, VIOLET, ORANGE, CREAM, GREEN, WHITE, NAVY = (
    '#FF5DB1', '#FFD84A', '#19D3C5', '#3D7BFF', '#8A5CFF', '#FF9A3D', '#FFF0C2', '#5CF08A', '#FFFFFF', '#1A1566',
)


def rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def new():
    im = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    return im, ImageDraw.Draw(im)


def finish(im: Image.Image, glow: str):
    a = np.array(im)
    alpha = a[..., 3] > 0
    # bóng: ô có láng giềng phải hoặc dưới trống thì tối đi
    shade = np.zeros_like(alpha)
    shade[:-1, :] |= alpha[:-1, :] & ~alpha[1:, :]
    shade[:, :-1] |= alpha[:, :-1] & ~alpha[:, 1:]
    rgbv = a[..., :3].astype(np.float32)
    rgbv[shade] *= 0.68
    # điểm sáng: ô có láng giềng trái hoặc trên trống thì sáng lên
    light = np.zeros_like(alpha)
    light[1:, :] |= alpha[1:, :] & ~alpha[:-1, :]
    light[:, 1:] |= alpha[:, 1:] & ~alpha[:, :-1]
    rgbv[light & ~shade] = np.minimum(rgbv[light & ~shade] * 1.25 + 28, 255)
    a[..., :3] = rgbv.astype(np.uint8)
    base = Image.fromarray(a, 'RGBA')
    # viền tối 1 ô
    pad = 3
    canvas = Image.new('RGBA', (S + pad * 2, S + pad * 2), (0, 0, 0, 0))
    canvas.paste(base, (pad, pad), base)
    ca = np.array(canvas)
    solid = ca[..., 3] > 0
    ring = np.zeros_like(solid)
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (-1, -1), (1, -1), (-1, 1)):
        ring |= np.roll(np.roll(solid, dy, 0), dx, 1)
    ring &= ~solid
    ca[ring] = (*rgb(NAVY), 255)
    canvas = Image.fromarray(ca, 'RGBA')
    big = canvas.resize((canvas.width * SCALE, canvas.height * SCALE), Image.NEAREST)
    # vầng sáng
    g = Image.new('RGBA', big.size, (*rgb(glow), 0))
    alpha_img = big.split()[3].filter(ImageFilter.GaussianBlur(14)).point(lambda v: int(v * 0.75))
    g.putalpha(alpha_img)
    out = Image.alpha_composite(g, big)
    return out


def poly(d, pts, fill):
    d.polygon(pts, fill=rgb(fill))


def rect(d, x0, y0, x1, y1, fill):
    d.rectangle([x0, y0, x1, y1], fill=rgb(fill))


def ell(d, x0, y0, x1, y1, fill):
    d.ellipse([x0, y0, x1, y1], fill=rgb(fill))


def cap():
    im, d = new()
    poly(d, [(8, 17), (8, 24), (16, 28), (24, 24), (24, 17), (16, 21)], BLUE)
    poly(d, [(16, 5), (30, 12), (16, 19), (2, 12)], CYAN)
    rect(d, 28, 13, 29, 22, GOLD)
    ell(d, 27, 22, 30, 26, GOLD)
    return finish(im, CYAN)


def house():
    im, d = new()
    rect(d, 6, 14, 26, 28, CREAM)
    poly(d, [(2, 15), (16, 3), (30, 15)], PINK)
    rect(d, 13, 19, 19, 28, VIOLET)
    rect(d, 8, 18, 11, 21, CYAN)
    rect(d, 21, 18, 24, 21, CYAN)
    rect(d, 22, 5, 25, 11, ORANGE)
    return finish(im, PINK)


def briefcase():
    im, d = new()
    rect(d, 11, 5, 21, 7, VIOLET)
    rect(d, 11, 5, 13, 12, VIOLET)
    rect(d, 19, 5, 21, 12, VIOLET)
    rect(d, 3, 11, 29, 27, ORANGE)
    rect(d, 3, 18, 29, 19, '#C26A1A')
    rect(d, 14, 16, 18, 21, GOLD)
    return finish(im, ORANGE)


def magnifier():
    im, d = new()
    poly(d, [(19, 21), (22, 18), (30, 26), (27, 29)], ORANGE)
    ell(d, 2, 2, 24, 24, CYAN)
    ell(d, 5, 5, 21, 21, '#CFFBFF')
    rect(d, 8, 8, 10, 10, WHITE)
    return finish(im, CYAN)


def globe():
    im, d = new()
    ell(d, 3, 3, 29, 29, BLUE)
    poly(d, [(8, 9), (14, 7), (16, 12), (11, 16), (7, 14)], GREEN)
    poly(d, [(17, 16), (24, 15), (25, 21), (20, 25), (16, 21)], GREEN)
    rect(d, 15, 4, 16, 28, '#7FA8FF')
    rect(d, 4, 15, 28, 16, '#7FA8FF')
    return finish(im, BLUE)


def newspaper():
    im, d = new()
    rect(d, 4, 5, 28, 27, CREAM)
    rect(d, 6, 7, 26, 11, VIOLET)
    rect(d, 6, 13, 14, 21, PINK)
    for y in (13, 16, 19):
        rect(d, 16, y, 26, y + 1, '#9A93C9')
    rect(d, 6, 23, 26, 24, '#9A93C9')
    return finish(im, VIOLET)


def headphones():
    im, d = new()
    d.arc([5, 4, 27, 26], 180, 360, fill=rgb(VIOLET), width=3)
    rect(d, 5, 15, 7, 18, VIOLET)
    rect(d, 25, 15, 27, 18, VIOLET)
    rect(d, 3, 16, 9, 27, PINK)
    rect(d, 23, 16, 29, 27, PINK)
    rect(d, 4, 18, 5, 25, '#FFB0DA')
    rect(d, 24, 18, 25, 25, '#FFB0DA')
    return finish(im, PINK)


def keyboard():
    im, d = new()
    rect(d, 2, 9, 30, 25, '#4B3FD6')
    for row, y in enumerate((11, 15, 19)):
        x = 4
        while x < 28:
            rect(d, x, y, x + 2, y + 2, '#E4E0FF' if row < 2 else CYAN)
            x += 4
    rect(d, 8, 21, 24, 23, '#E4E0FF')
    return finish(im, VIOLET)


def pencil():
    im, d = new()
    poly(d, [(21, 3), (29, 11), (25, 15), (17, 7)], PINK)
    poly(d, [(17, 7), (25, 15), (10, 30), (3, 30), (2, 23)], GOLD)
    poly(d, [(2, 23), (10, 30), (2, 30)], CREAM)
    rect(d, 2, 28, 4, 30, NAVY)
    return finish(im, GOLD)


def podium():
    im, d = new()
    rect(d, 2, 17, 11, 29, CYAN)
    rect(d, 11, 11, 21, 29, GOLD)
    rect(d, 21, 20, 30, 29, PINK)
    poly(d, [(16, 1), (17, 5), (21, 5), (18, 8), (19, 10), (16, 8), (13, 10), (14, 8), (11, 5), (15, 5)], WHITE)
    return finish(im, GOLD)


def target():
    im, d = new()
    ell(d, 2, 2, 29, 29, PINK)
    ell(d, 7, 7, 24, 24, WHITE)
    ell(d, 11, 11, 20, 20, PINK)
    ell(d, 14, 14, 17, 17, GOLD)
    return finish(im, PINK)


def stairs():
    im, d = new()
    rect(d, 2, 22, 11, 29, CYAN)
    rect(d, 11, 15, 20, 29, BLUE)
    rect(d, 20, 8, 29, 29, VIOLET)
    poly(d, [(22, 1), (23, 4), (26, 4), (24, 6), (25, 8), (22, 6), (19, 8), (20, 6), (18, 4), (21, 4)], GOLD)
    return finish(im, BLUE)


ICONS = dict(cap=cap, house=house, briefcase=briefcase, magnifier=magnifier, globe=globe, newspaper=newspaper,
             headphones=headphones, keyboard=keyboard, pencil=pencil, podium=podium, target=target, stairs=stairs)


def main():
    os.makedirs(OUT, exist_ok=True)
    for name, fn in ICONS.items():
        img = fn()
        img.save(os.path.join(OUT, f'{name}.png'))
        print(name, img.size)


if __name__ == '__main__':
    main()
