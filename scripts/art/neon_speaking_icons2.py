"""Đợt 2 icon pixel neon cho chủ đề Speaking (assets/neon3), nối tiếp neon_speaking_icons.py.

Chạy:  python scripts/art/neon_speaking_icons2.py [tấm_xem_nhanh.png]
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from neon_extra_icons import (BLUE, CREAM, CYAN, GOLD, GREEN, NAVY, ORANGE, PINK, VIOLET, WHITE,  # noqa: E402
                              ell, finish, new, poly, rect)

OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'assets', 'neon3')
SKIN = '#FFC9A0'
GREY = '#9A93C9'
BROWN = '#B0702C'
NAVY_RGB = (26, 21, 102)


def laptop():
    im, d = new()
    rect(d, 5, 5, 27, 20, VIOLET)
    rect(d, 7, 7, 25, 18, CYAN)
    rect(d, 9, 9, 18, 10, WHITE)
    rect(d, 9, 13, 22, 14, '#CFFBFF')
    poly(d, [(1, 22), (31, 22), (28, 27), (4, 27)], GREY)
    rect(d, 13, 23, 19, 24, WHITE)
    return finish(im, CYAN)


def browser():
    im, d = new()
    rect(d, 2, 4, 30, 28, CREAM)
    rect(d, 2, 4, 30, 9, BLUE)
    for i, c in enumerate((PINK, GOLD, GREEN)):
        rect(d, 5 + i * 4, 6, 6 + i * 4, 7, c)
    rect(d, 5, 12, 27, 14, GREY)
    rect(d, 5, 17, 15, 25, PINK)
    rect(d, 18, 17, 27, 19, GREY)
    rect(d, 18, 22, 27, 24, GREY)
    return finish(im, BLUE)


def gift():
    im, d = new()
    rect(d, 4, 12, 28, 28, PINK)
    rect(d, 2, 8, 30, 14, '#FF8CC8')
    rect(d, 14, 8, 18, 28, GOLD)
    poly(d, [(16, 8), (8, 2), (6, 6), (14, 8)], GOLD)
    poly(d, [(16, 8), (24, 2), (26, 6), (18, 8)], GOLD)
    return finish(im, PINK)


def footprints():
    im, d = new()
    for x, y in ((4, 14), (17, 3)):
        ell(d, x, y, x + 8, y + 10, CYAN)
        ell(d, x + 1, y + 11, x + 7, y + 15, CYAN)
    for x, y in ((14, 18), (3, 4)):
        ell(d, x, y, x + 8, y + 10, BLUE)
        ell(d, x + 1, y + 11, x + 7, y + 13, BLUE)
    return finish(im, CYAN)


def flower():
    im, d = new()
    rect(d, 15, 16, 17, 30, GREEN)
    poly(d, [(17, 24), (26, 18), (26, 24)], '#3FD06A')
    for x, y in ((11, 2), (11, 14), (4, 8), (18, 8)):
        ell(d, x, y, x + 9, y + 9, PINK)
    ell(d, 12, 9, 20, 17, GOLD)
    return finish(im, PINK)


def earth():
    im, d = new()
    ell(d, 3, 3, 29, 29, BLUE)
    poly(d, [(7, 9), (14, 6), (17, 12), (10, 17), (6, 14)], GREEN)
    poly(d, [(17, 18), (25, 16), (26, 23), (20, 27), (15, 23)], GREEN)
    poly(d, [(20, 1), (30, 1), (24, 8)], GREEN)
    ell(d, 21, 7, 24, 10, WHITE)
    return finish(im, GREEN)


def briefcase2():
    im, d = new()
    rect(d, 11, 4, 21, 6, VIOLET)
    rect(d, 11, 4, 13, 11, VIOLET)
    rect(d, 19, 4, 21, 11, VIOLET)
    rect(d, 3, 10, 29, 28, ORANGE)
    rect(d, 3, 17, 29, 18, '#C26A1A')
    rect(d, 14, 15, 18, 20, GOLD)
    return finish(im, ORANGE)


def calendar():
    im, d = new()
    rect(d, 3, 6, 29, 29, CREAM)
    rect(d, 3, 6, 29, 12, PINK)
    rect(d, 9, 2, 11, 8, VIOLET)
    rect(d, 21, 2, 23, 8, VIOLET)
    for r in range(3):
        for c in range(4):
            rect(d, 6 + c * 6, 15 + r * 5, 8 + c * 6, 17 + r * 5, CYAN if (r, c) != (1, 2) else GOLD)
    return finish(im, PINK)


def signpost():
    im, d = new()
    rect(d, 14, 3, 17, 30, BROWN)
    poly(d, [(4, 6), (22, 6), (28, 10), (22, 14), (4, 14)], CYAN)
    poly(d, [(28, 17), (10, 17), (4, 21), (10, 25), (28, 25)], PINK)
    return finish(im, CYAN)


def cycle():
    im, d = new()
    d.arc([4, 4, 28, 28], 200, 340, fill=(25, 211, 197), width=4)
    d.arc([4, 4, 28, 28], 20, 160, fill=(255, 93, 177), width=4)
    poly(d, [(22, 3), (30, 11), (20, 12)], CYAN)
    poly(d, [(10, 29), (2, 21), (12, 20)], PINK)
    return finish(im, CYAN)


def trophy2():
    im, d = new()
    rect(d, 8, 3, 24, 16, GOLD)
    ell(d, 10, 8, 22, 22, GOLD)
    d.arc([1, 4, 11, 14], 90, 270, fill=(255, 216, 74), width=2)
    d.arc([21, 4, 31, 14], 270, 90, fill=(255, 216, 74), width=2)
    rect(d, 14, 21, 18, 25, ORANGE)
    rect(d, 9, 25, 23, 29, ORANGE)
    rect(d, 11, 5, 12, 11, WHITE)
    return finish(im, GOLD)


def family():
    im, d = new()
    ell(d, 2, 5, 10, 13, SKIN)
    ell(d, 22, 5, 30, 13, SKIN)
    ell(d, 11, 12, 21, 22, SKIN)
    rect(d, 1, 15, 11, 29, PINK)
    rect(d, 21, 15, 31, 29, CYAN)
    rect(d, 10, 23, 22, 29, GOLD)
    return finish(im, PINK)


def heart():
    im, d = new()
    ell(d, 2, 4, 17, 19, PINK)
    ell(d, 15, 4, 30, 19, PINK)
    poly(d, [(3, 14), (29, 14), (16, 29)], PINK)
    rect(d, 7, 8, 9, 11, WHITE)
    return finish(im, PINK)


def suitcase():
    im, d = new()
    rect(d, 12, 2, 20, 4, VIOLET)
    rect(d, 12, 2, 14, 9, VIOLET)
    rect(d, 18, 2, 20, 9, VIOLET)
    rect(d, 3, 8, 29, 27, CYAN)
    rect(d, 8, 8, 10, 27, BLUE)
    rect(d, 22, 8, 24, 27, BLUE)
    rect(d, 6, 27, 9, 30, NAVY)
    rect(d, 23, 27, 26, 30, NAVY)
    return finish(im, CYAN)


def rocket():
    im, d = new()
    poly(d, [(16, 1), (24, 10), (24, 22), (8, 22), (8, 10)], WHITE)
    poly(d, [(16, 1), (22, 8), (10, 8)], PINK)
    ell(d, 12, 11, 20, 18, CYAN)
    poly(d, [(8, 15), (2, 24), (8, 22)], PINK)
    poly(d, [(24, 15), (30, 24), (24, 22)], PINK)
    poly(d, [(11, 22), (21, 22), (16, 31)], GOLD)
    return finish(im, ORANGE)


def books():
    im, d = new()
    rect(d, 3, 19, 29, 28, VIOLET)
    rect(d, 5, 11, 27, 19, PINK)
    rect(d, 7, 3, 25, 11, CYAN)
    for y, c in ((22, GOLD), (14, WHITE), (6, WHITE)):
        rect(d, 8, y, 24, y + 1, c)
    return finish(im, VIOLET)


def abc():
    im, d = new()
    rect(d, 2, 5, 30, 27, CREAM)
    rect(d, 2, 5, 30, 8, VIOLET)
    for x in (6, 14, 22):
        rect(d, x, 13, x + 1, 22, PINK)
        rect(d, x + 4, 13, x + 5, 22, PINK)
        rect(d, x, 13, x + 5, 14, PINK)
        rect(d, x, 17, x + 5, 18, PINK)
    return finish(im, VIOLET)


def coins():
    im, d = new()
    ell(d, 2, 14, 20, 28, ORANGE)
    ell(d, 2, 10, 20, 24, GOLD)
    ell(d, 12, 4, 30, 18, GOLD)
    ell(d, 15, 7, 27, 15, ORANGE)
    rect(d, 20, 8, 22, 14, GOLD)
    rect(d, 7, 14, 9, 20, ORANGE)
    return finish(im, GOLD)


def bag():
    im, d = new()
    d.arc([9, 1, 23, 16], 180, 360, fill=(138, 92, 255), width=2)
    rect(d, 4, 10, 28, 29, PINK)
    rect(d, 4, 10, 28, 12, '#FF8CC8')
    rect(d, 11, 14, 12, 17, WHITE)
    rect(d, 20, 14, 21, 17, WHITE)
    return finish(im, PINK)


def shop():
    im, d = new()
    for i in range(4):
        rect(d, 2 + i * 7, 4, 8 + i * 7, 12, PINK if i % 2 == 0 else WHITE)
    rect(d, 4, 12, 28, 29, CREAM)
    rect(d, 12, 18, 20, 29, VIOLET)
    rect(d, 6, 15, 10, 21, CYAN)
    rect(d, 22, 15, 26, 21, CYAN)
    return finish(im, PINK)


def burger():
    im, d = new()
    ell(d, 3, 3, 29, 15, ORANGE)
    rect(d, 3, 10, 29, 14, ORANGE)
    rect(d, 2, 14, 30, 17, GREEN)
    rect(d, 3, 17, 29, 21, '#7A3E1D')
    rect(d, 2, 21, 30, 23, GOLD)
    ell(d, 3, 22, 29, 29, ORANGE)
    for x in (9, 15, 21):
        rect(d, x, 7, x + 1, 8, CREAM)
    return finish(im, ORANGE)


def headphones2():
    im, d = new()
    d.arc([5, 4, 27, 26], 180, 360, fill=(138, 92, 255), width=3)
    rect(d, 5, 15, 7, 18, VIOLET)
    rect(d, 25, 15, 27, 18, VIOLET)
    rect(d, 3, 16, 9, 27, CYAN)
    rect(d, 23, 16, 29, 27, CYAN)
    return finish(im, CYAN)


def note():
    im, d = new()
    rect(d, 11, 4, 13, 22, WHITE)
    rect(d, 24, 2, 26, 18, WHITE)
    poly(d, [(11, 4), (26, 2), (26, 8), (11, 10)], GOLD)
    ell(d, 5, 20, 14, 28, PINK)
    ell(d, 18, 16, 27, 24, PINK)
    return finish(im, PINK)


def camera():
    im, d = new()
    rect(d, 3, 9, 29, 27, VIOLET)
    rect(d, 10, 5, 20, 9, VIOLET)
    ell(d, 9, 11, 23, 25, CREAM)
    ell(d, 12, 14, 20, 22, BLUE)
    ell(d, 14, 16, 17, 19, WHITE)
    rect(d, 24, 12, 26, 13, GOLD)
    return finish(im, VIOLET)


def star():
    im, d = new()
    poly(d, [(16, 1), (20, 11), (31, 12), (22, 19), (25, 30), (16, 24), (7, 30), (10, 19), (1, 12), (12, 11)], GOLD)
    rect(d, 14, 8, 15, 12, WHITE)
    return finish(im, GOLD)


def popcorn():
    im, d = new()
    for x, y in ((4, 3), (11, 1), (18, 3), (22, 8), (2, 9)):
        ell(d, x, y, x + 8, y + 8, CREAM)
    poly(d, [(4, 12), (28, 12), (25, 30), (7, 30)], PINK)
    for x in (10, 16, 22):
        rect(d, x - 2, 12, x, 29, WHITE)
    return finish(im, PINK)


def hourglass():
    im, d = new()
    rect(d, 4, 2, 28, 5, ORANGE)
    rect(d, 4, 27, 28, 30, ORANGE)
    poly(d, [(7, 5), (25, 5), (17, 16), (25, 27), (7, 27), (15, 16)], '#CFFBFF')
    poly(d, [(10, 6), (22, 6), (16, 13)], GOLD)
    poly(d, [(9, 26), (23, 26), (16, 20)], GOLD)
    return finish(im, GOLD)


def puzzle():
    im, d = new()
    rect(d, 3, 8, 24, 29, GREEN)
    ell(d, 10, 2, 18, 10, GREEN)
    ell(d, 20, 14, 30, 24, GREEN)
    rect(d, 7, 12, 9, 22, '#2E9E52')
    return finish(im, GREEN)


def microscope():
    im, d = new()
    rect(d, 12, 2, 18, 18, VIOLET)
    poly(d, [(18, 8), (22, 8), (22, 20), (14, 24)], PINK)
    d.arc([6, 12, 28, 30], 270, 90, fill=(61, 123, 255), width=3)
    rect(d, 4, 28, 28, 30, BLUE)
    rect(d, 9, 18, 21, 20, GOLD)
    return finish(im, VIOLET)


def alarm():
    im, d = new()
    ell(d, 4, 6, 28, 30, PINK)
    ell(d, 7, 9, 25, 27, CREAM)
    rect(d, 15, 12, 16, 19, NAVY)
    rect(d, 16, 18, 21, 19, NAVY)
    ell(d, 1, 3, 10, 11, GOLD)
    ell(d, 22, 3, 31, 11, GOLD)
    return finish(im, PINK)


def envelope():
    im, d = new()
    rect(d, 2, 7, 30, 26, CREAM)
    poly(d, [(2, 7), (30, 7), (16, 19)], '#FFB0DA')
    poly(d, [(2, 26), (13, 16), (14, 18)], GREY)
    poly(d, [(30, 26), (19, 16), (18, 18)], GREY)
    ell(d, 20, 15, 28, 23, PINK)
    return finish(im, PINK)


def pill():
    im, d = new()
    poly(d, [(4, 22), (22, 4), (28, 10), (10, 28)], PINK)
    poly(d, [(15, 11), (22, 4), (28, 10), (21, 17)], WHITE)
    rect(d, 9, 15, 11, 17, '#FFB0DA')
    return finish(im, PINK)


def tent():
    im, d = new()
    poly(d, [(16, 3), (30, 28), (2, 28)], ORANGE)
    poly(d, [(16, 12), (22, 28), (10, 28)], NAVY)
    rect(d, 15, 2, 17, 5, GOLD)
    return finish(im, ORANGE)


def frame():
    im, d = new()
    rect(d, 2, 3, 30, 29, GOLD)
    rect(d, 5, 6, 27, 26, '#CFFBFF')
    poly(d, [(5, 26), (13, 15), (19, 22), (23, 17), (27, 26)], GREEN)
    ell(d, 20, 9, 25, 14, ORANGE)
    return finish(im, GOLD)


def pagoda():
    im, d = new()
    for i, (x0, x1) in enumerate(((6, 26), (8, 24), (10, 22))):
        y = 4 + i * 8
        poly(d, [(x0 - 4, y + 5), (16, y - 2), (x1 + 4, y + 5)], PINK)
        rect(d, x0 + 2, y + 5, x1 - 2, y + 9, CREAM)
    rect(d, 4, 28, 28, 30, VIOLET)
    return finish(im, PINK)


def skyline():
    im, d = new()
    rect(d, 2, 15, 9, 29, VIOLET)
    rect(d, 9, 5, 18, 29, BLUE)
    rect(d, 18, 11, 24, 29, CYAN)
    rect(d, 24, 18, 30, 29, VIOLET)
    for y in (8, 13, 18, 23):
        rect(d, 11, y, 12, y + 1, GOLD)
        rect(d, 15, y, 16, y + 1, GOLD)
    rect(d, 13, 2, 14, 5, GOLD)
    return finish(im, BLUE)


def wrench():
    im, d = new()
    d.arc([14, 0, 32, 18], 120, 420, fill=(138, 92, 255), width=5)
    poly(d, [(17, 12), (21, 16), (8, 29), (3, 24)], GREY)
    ell(d, 3, 24, 8, 29, VIOLET)
    return finish(im, VIOLET)


def cat():
    im, d = new()
    poly(d, [(4, 3), (13, 9), (5, 14)], ORANGE)
    poly(d, [(28, 3), (19, 9), (27, 14)], ORANGE)
    ell(d, 3, 7, 29, 29, ORANGE)
    rect(d, 9, 15, 11, 19, NAVY)
    rect(d, 21, 15, 23, 19, NAVY)
    poly(d, [(14, 21), (18, 21), (16, 24)], PINK)
    rect(d, 2, 22, 7, 22, WHITE)
    rect(d, 25, 22, 30, 22, WHITE)
    return finish(im, ORANGE)


def bird():
    im, d = new()
    ell(d, 5, 10, 25, 26, CYAN)
    ell(d, 17, 4, 29, 16, CYAN)
    poly(d, [(28, 8), (31, 10), (28, 12)], GOLD)
    rect(d, 24, 8, 25, 9, NAVY)
    poly(d, [(3, 14), (-1, 8), (10, 14)], BLUE)
    poly(d, [(10, 16), (20, 16), (14, 24)], BLUE)
    rect(d, 13, 26, 14, 30, ORANGE)
    rect(d, 18, 26, 19, 30, ORANGE)
    return finish(im, CYAN)


def bike():
    im, d = new()
    for cx in (8, 24):
        ell(d, cx - 6, 17, cx + 6, 29, NAVY)
        ell(d, cx - 4, 19, cx + 4, 27, CREAM)
    poly(d, [(8, 23), (14, 12), (22, 12), (24, 23), (22, 23), (17, 15), (11, 23)], PINK)
    rect(d, 12, 9, 17, 10, VIOLET)
    rect(d, 21, 8, 25, 10, VIOLET)
    return finish(im, PINK)


def flag():
    im, d = new()
    rect(d, 5, 2, 7, 30, BROWN)
    poly(d, [(7, 3), (28, 5), (24, 11), (28, 17), (7, 15)], PINK)
    ell(d, 12, 6, 18, 12, GOLD)
    return finish(im, PINK)


ICONS2 = dict(laptop=laptop, browser=browser, gift=gift, footprints=footprints, flower=flower, earth=earth,
              briefcase2=briefcase2, calendar=calendar, signpost=signpost, cycle=cycle, trophy2=trophy2, family=family,
              heart=heart, suitcase=suitcase, rocket=rocket, books=books, abc=abc, coins=coins, bag=bag, shop=shop,
              burger=burger, headphones2=headphones2, note=note, camera=camera, star=star, popcorn=popcorn,
              hourglass=hourglass, puzzle=puzzle, microscope=microscope, alarm=alarm, envelope=envelope, pill=pill,
              tent=tent, frame=frame, pagoda=pagoda, skyline=skyline, wrench=wrench, cat=cat, bird=bird, bike=bike,
              flag=flag)


def main():
    from PIL import Image
    os.makedirs(OUT, exist_ok=True)
    for name, fn in ICONS2.items():
        fn().save(os.path.join(OUT, f'{name}.png'))
    print(len(ICONS2), 'icon ->', os.path.normpath(OUT))
    if len(sys.argv) > 1:
        names = list(ICONS2)
        sheet = Image.new('RGBA', (10 * 150, ((len(names) + 9) // 10) * 150), (31, 26, 110, 255))
        for i, n in enumerate(names):
            im = Image.open(os.path.join(OUT, f'{n}.png')).resize((140, 140))
            sheet.paste(im, ((i % 10) * 150 + 5, (i // 10) * 150 + 5), im)
        sheet.save(sys.argv[1])


if __name__ == '__main__':
    main()
