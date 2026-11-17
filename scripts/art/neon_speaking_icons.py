"""Icon pixel neon cho chủ đề Speaking (assets/neon3), vẽ bằng code cùng phong cách neon_extra_icons.py.

Chạy:  python scripts/art/neon_speaking_icons.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from neon_extra_icons import (BLUE, CREAM, CYAN, GOLD, GREEN, NAVY, ORANGE, PINK, VIOLET, WHITE,  # noqa: E402
                              ell, finish, new, poly, rect)

OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'assets', 'neon3')
SKIN = '#FFC9A0'
GREY = '#9A93C9'
NAVY_RGB = (26, 21, 102)
VIOLET_RGB = (138, 92, 255)
BLUE_RGB = (61, 123, 255)


def phone():
    im, d = new()
    rect(d, 8, 2, 24, 29, VIOLET)
    rect(d, 10, 5, 22, 24, CYAN)
    rect(d, 12, 8, 20, 10, WHITE)
    rect(d, 12, 13, 18, 15, '#CFFBFF')
    ell(d, 14, 25, 18, 28, CREAM)
    return finish(im, VIOLET)


def paw():
    im, d = new()
    ell(d, 9, 15, 23, 29, ORANGE)
    for x0, y0 in ((2, 10), (8, 3), (17, 3), (23, 10)):
        ell(d, x0, y0, x0 + 6, y0 + 8, ORANGE)
    return finish(im, ORANGE)


def sun():
    im, d = new()
    ell(d, 8, 8, 24, 24, GOLD)
    for x, y, w, h in ((15, 1, 2, 5), (15, 26, 2, 5), (1, 15, 5, 2), (26, 15, 5, 2), (5, 5, 3, 3), (24, 5, 3, 3), (5, 24, 3, 3), (24, 24, 3, 3)):
        rect(d, x, y, x + w - 1, y + h - 1, ORANGE)
    return finish(im, GOLD)


def tree():
    im, d = new()
    rect(d, 14, 20, 18, 30, '#B0702C')
    ell(d, 4, 3, 28, 17, GREEN)
    ell(d, 2, 10, 20, 24, '#3FD06A')
    ell(d, 12, 10, 30, 24, '#3FD06A')
    return finish(im, GREEN)


def clapper():
    im, d = new()
    rect(d, 3, 13, 29, 28, '#4B3FD6')
    poly(d, [(3, 5), (29, 2), (30, 9), (4, 12)], GOLD)
    for x in (8, 15, 22):
        poly(d, [(x, 4), (x + 3, 4), (x + 1, 11), (x - 2, 11)], NAVY)
    poly(d, [(13, 17), (21, 21), (13, 25)], WHITE)
    return finish(im, VIOLET)


def mic():
    im, d = new()
    ell(d, 10, 2, 22, 18, PINK)
    rect(d, 14, 6, 15, 8, '#FFB0DA')
    d.arc([6, 8, 26, 24], 0, 180, fill=VIOLET_RGB, width=2)
    rect(d, 15, 24, 17, 27, VIOLET)
    rect(d, 10, 27, 22, 29, VIOLET)
    return finish(im, PINK)


def watch():
    im, d = new()
    rect(d, 11, 1, 21, 9, VIOLET)
    rect(d, 11, 23, 21, 31, VIOLET)
    ell(d, 5, 7, 27, 25, GOLD)
    ell(d, 8, 10, 24, 22, CREAM)
    rect(d, 15, 12, 16, 17, NAVY)
    rect(d, 16, 16, 20, 17, NAVY)
    return finish(im, GOLD)


def mirror():
    im, d = new()
    ell(d, 5, 2, 27, 24, GOLD)
    ell(d, 8, 5, 24, 21, '#CFFBFF')
    rect(d, 10, 8, 12, 14, WHITE)
    rect(d, 14, 24, 18, 30, ORANGE)
    return finish(im, CYAN)


def car():
    im, d = new()
    rect(d, 2, 15, 30, 24, PINK)
    poly(d, [(8, 15), (11, 7), (22, 7), (26, 15)], PINK)
    poly(d, [(12, 9), (15, 9), (15, 15), (10, 15)], '#CFFBFF')
    poly(d, [(17, 9), (21, 9), (23, 15), (17, 15)], '#CFFBFF')
    ell(d, 6, 20, 13, 28, NAVY)
    ell(d, 19, 20, 26, 28, NAVY)
    ell(d, 8, 22, 11, 26, GREY)
    ell(d, 21, 22, 24, 26, GREY)
    return finish(im, PINK)


def plane():
    im, d = new()
    poly(d, [(2, 16), (30, 4), (21, 28), (16, 18)], CYAN)
    poly(d, [(16, 18), (30, 4), (14, 21)], BLUE)
    poly(d, [(14, 21), (16, 18), (14, 29)], VIOLET)
    return finish(im, CYAN)


def ball():
    im, d = new()
    ell(d, 3, 3, 29, 29, ORANGE)
    rect(d, 15, 3, 16, 29, NAVY)
    rect(d, 3, 15, 29, 16, NAVY)
    rect(d, 8, 8, 9, 9, NAVY)
    rect(d, 6, 11, 7, 12, NAVY)
    rect(d, 22, 8, 23, 9, NAVY)
    rect(d, 24, 11, 25, 12, NAVY)
    return finish(im, ORANGE)


def cake():
    im, d = new()
    rect(d, 4, 16, 28, 28, PINK)
    rect(d, 4, 16, 28, 19, CREAM)
    rect(d, 8, 10, 24, 16, CREAM)
    for x in (10, 15, 20):
        rect(d, x, 5, x + 1, 10, GOLD)
        rect(d, x, 3, x + 1, 4, ORANGE)
    return finish(im, PINK)


def shirt():
    im, d = new()
    poly(d, [(11, 3), (21, 3), (30, 10), (26, 15), (23, 13), (23, 29), (9, 29), (9, 13), (6, 15), (2, 10)], CYAN)
    poly(d, [(12, 3), (20, 3), (16, 9)], WHITE)
    return finish(im, CYAN)


def cart():
    im, d = new()
    rect(d, 1, 3, 6, 5, VIOLET)
    poly(d, [(5, 6), (30, 6), (26, 19), (9, 19)], GOLD)
    rect(d, 9, 19, 26, 21, VIOLET)
    ell(d, 10, 24, 15, 29, PINK)
    ell(d, 21, 24, 26, 29, PINK)
    rect(d, 12, 9, 13, 15, ORANGE)
    rect(d, 18, 9, 19, 15, ORANGE)
    return finish(im, GOLD)


def bulb():
    im, d = new()
    ell(d, 6, 2, 26, 21, GOLD)
    poly(d, [(10, 18), (22, 18), (20, 25), (12, 25)], GOLD)
    rect(d, 12, 25, 20, 27, GREY)
    rect(d, 13, 28, 19, 30, GREY)
    rect(d, 10, 6, 12, 11, WHITE)
    return finish(im, GOLD)


def palette():
    im, d = new()
    ell(d, 2, 4, 30, 28, CREAM)
    ell(d, 17, 17, 24, 24, '#4B3FD6')
    for x, y, c in ((7, 10, PINK), (13, 6, GOLD), (20, 8, CYAN), (6, 17, GREEN)):
        ell(d, x, y, x + 4, y + 4, c)
    return finish(im, ORANGE)


def chat():
    im, d = new()
    rect(d, 2, 4, 22, 18, CYAN)
    poly(d, [(6, 18), (12, 18), (6, 24)], CYAN)
    rect(d, 12, 12, 30, 24, PINK)
    poly(d, [(26, 24), (22, 24), (26, 30)], PINK)
    for x in (6, 10, 14):
        rect(d, x, 9, x + 1, 10, WHITE)
    return finish(im, VIOLET)


def tower():
    im, d = new()
    rect(d, 4, 12, 13, 29, VIOLET)
    rect(d, 13, 2, 26, 29, BLUE)
    for y in range(5, 28, 4):
        rect(d, 16, y, 18, y + 1, GOLD)
        rect(d, 21, y, 23, y + 1, GOLD)
    for y in (15, 20, 25):
        rect(d, 7, y, 9, y + 1, CYAN)
    return finish(im, BLUE)


def cross():
    im, d = new()
    rect(d, 11, 2, 21, 30, PINK)
    rect(d, 2, 11, 30, 21, PINK)
    rect(d, 13, 4, 14, 28, '#FFB0DA')
    return finish(im, PINK)


def leaf():
    im, d = new()
    poly(d, [(3, 29), (4, 12), (14, 3), (29, 3), (29, 16), (20, 27), (8, 29)], GREEN)
    poly(d, [(3, 29), (4, 27), (24, 7), (26, 8)], '#2E9E52')
    return finish(im, GREEN)


def bed():
    im, d = new()
    rect(d, 2, 8, 5, 28, ORANGE)
    rect(d, 2, 17, 30, 25, VIOLET)
    rect(d, 5, 12, 14, 17, CREAM)
    rect(d, 14, 14, 30, 17, PINK)
    rect(d, 27, 25, 30, 28, ORANGE)
    return finish(im, VIOLET)


def megaphone():
    im, d = new()
    poly(d, [(3, 12), (11, 12), (27, 3), (27, 29), (11, 20), (3, 20)], PINK)
    rect(d, 6, 20, 10, 28, VIOLET)
    rect(d, 28, 12, 30, 20, GOLD)
    return finish(im, PINK)


def wifi():
    im, d = new()
    for i, r in enumerate((15, 10, 5)):
        d.arc([16 - r, 26 - r, 16 + r, 26 + r], 225, 315, fill=(25, 211, 197) if i == 0 else BLUE_RGB, width=3)
    ell(d, 13, 23, 19, 29, GOLD)
    return finish(im, BLUE)


def hammer():
    im, d = new()
    poly(d, [(15, 4), (26, 2), (30, 10), (19, 12)], VIOLET)
    poly(d, [(18, 10), (21, 9), (8, 29), (4, 27)], ORANGE)
    rect(d, 2, 28, 14, 30, GOLD)
    return finish(im, VIOLET)


def people():
    im, d = new()
    ell(d, 3, 4, 13, 14, SKIN)
    ell(d, 19, 4, 29, 14, SKIN)
    rect(d, 1, 16, 15, 29, PINK)
    rect(d, 17, 16, 31, 29, CYAN)
    return finish(im, PINK)


def smiley():
    im, d = new()
    ell(d, 2, 2, 30, 30, GOLD)
    rect(d, 9, 9, 11, 14, NAVY)
    rect(d, 21, 9, 23, 14, NAVY)
    d.arc([8, 11, 24, 25], 20, 160, fill=NAVY_RGB, width=2)
    return finish(im, GOLD)


def plug():
    im, d = new()
    rect(d, 9, 2, 11, 9, GREY)
    rect(d, 21, 2, 23, 9, GREY)
    rect(d, 6, 9, 26, 20, GOLD)
    poly(d, [(8, 20), (24, 20), (19, 27), (13, 27)], ORANGE)
    rect(d, 15, 27, 17, 31, VIOLET)
    return finish(im, GOLD)


def lantern():
    im, d = new()
    rect(d, 14, 1, 17, 5, GOLD)
    ell(d, 5, 5, 27, 27, PINK)
    rect(d, 5, 15, 27, 16, '#C23FC9')
    rect(d, 15, 5, 16, 27, '#C23FC9')
    rect(d, 11, 27, 21, 29, GOLD)
    rect(d, 15, 29, 16, 31, GOLD)
    return finish(im, PINK)


def board():
    im, d = new()
    rect(d, 2, 4, 30, 24, '#B0702C')
    rect(d, 4, 6, 28, 22, '#1F8F5B')
    rect(d, 8, 10, 20, 11, WHITE)
    rect(d, 8, 14, 15, 15, WHITE)
    rect(d, 6, 24, 26, 26, GOLD)
    rect(d, 20, 18, 24, 19, PINK)
    return finish(im, GREEN)


ICONS = dict(phone=phone, paw=paw, sun=sun, tree=tree, clapper=clapper, mic=mic, watch=watch, mirror=mirror, car=car,
             plane=plane, ball=ball, cake=cake, shirt=shirt, cart=cart, bulb=bulb, palette=palette, chat=chat,
             tower=tower, cross=cross, leaf=leaf, bed=bed, megaphone=megaphone, wifi=wifi, hammer=hammer,
             people=people, smiley=smiley, plug=plug, lantern=lantern, board=board)


def main():
    from PIL import Image
    os.makedirs(OUT, exist_ok=True)
    for name, fn in ICONS.items():
        fn().save(os.path.join(OUT, f'{name}.png'))
    print(len(ICONS), 'icon ->', os.path.normpath(OUT))
    if len(sys.argv) > 1:  # tấm xem nhanh: python neon_speaking_icons.py <out.png>
        names = list(ICONS)
        sheet = Image.new('RGBA', (10 * 150, ((len(names) + 9) // 10) * 150), (31, 26, 110, 255))
        for i, n in enumerate(names):
            im = Image.open(os.path.join(OUT, f'{n}.png')).resize((140, 140))
            sheet.paste(im, ((i % 10) * 150 + 5, (i // 10) * 150 + 5), im)
        sheet.save(sys.argv[1])


if __name__ == '__main__':
    main()
