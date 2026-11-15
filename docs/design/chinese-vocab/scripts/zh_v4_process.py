"""Tach nen magenta cua cac tam ChatGPT (cach luyen v4) thanh tung asset PNG co alpha.

Dau vao: docs/design/chinese-vocab/raw/v4/*.png (nen #FF00FF).
Dau ra:  assets/chinese/v4/{mode-icons,frames,stickers,backgrounds}/...
"""
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

RAW = Path(r"D:/Claude/readup-ielts/docs/design/chinese-vocab/raw/v4")
OUT = Path(r"D:/Claude/readup-ielts/assets/chinese/v4")
MAG = np.array([255.0, 0.0, 255.0], dtype=np.float32)
PAD = 6
MIN_AREA = 900  # bo qua hat nhieu nho


def alpha_from_magenta(rgb: np.ndarray) -> np.ndarray:
    """Khoang cach toi magenta -> alpha: <=60 la trong suot, >=140 la dac."""
    d = np.sqrt(((rgb - MAG) ** 2).sum(axis=2))
    return np.clip((d - 60.0) / 80.0, 0.0, 1.0)


def extract(path: Path):
    img = Image.open(path).convert("RGB")
    rgb = np.asarray(img).astype(np.float32)
    a = alpha_from_magenta(rgb)
    mask = ndimage.binary_opening(a > 0.5, iterations=2)
    lab, n = ndimage.label(mask)
    objs = ndimage.find_objects(lab)
    items = []
    for i, sl in enumerate(objs, 1):
        if sl is None:
            continue
        comp = lab == i
        area = int(comp.sum())
        if area < MIN_AREA:
            continue
        y0, y1 = sl[0].start, sl[0].stop
        x0, x1 = sl[1].start, sl[1].stop
        # mo rong mask 1px de giu vien trang, roi nhan voi alpha mem
        comp_d = ndimage.binary_dilation(comp, iterations=2)
        alpha = (a * comp_d * 255.0).astype(np.uint8)
        H, W = a.shape
        cx0, cy0 = max(0, x0 - PAD), max(0, y0 - PAD)
        cx1, cy1 = min(W, x1 + PAD), min(H, y1 + PAD)
        crop = np.dstack([rgb[cy0:cy1, cx0:cx1].astype(np.uint8), alpha[cy0:cy1, cx0:cx1]])
        items.append(
            {
                "img": Image.fromarray(crop, "RGBA"),
                "box": (x0, y0, x1, y1),
                "area": area,
                "w": x1 - x0,
                "h": y1 - y0,
                "xc": (x0 + x1) / 2,
                "yc": (y0 + y1) / 2,
            }
        )
    return items, (W, H)


def save(img: Image.Image, path: Path):
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, optimize=True)
    print("saved", path.relative_to(OUT.parent.parent), img.size)


def main():
    # 1) Bo 9 icon cach luyen: luoi 3x3, doc theo hang tu trai sang phai
    modes = ["learn", "abcd", "listen", "speak", "dictation", "cloze", "pairs", "test", "game"]
    items, (W, H) = extract(RAW / "icons-grid-9.png")
    print("icons components:", len(items))
    if len(items) != 9:
        print("WARN: expected 9 icons, got", len(items))
    for it in items:
        it["row"] = min(2, int(it["yc"] // (H / 3)))
        it["col"] = min(2, int(it["xc"] // (W / 3)))
    cells = {}
    for it in items:
        key = it["row"] * 3 + it["col"]
        cells.setdefault(key, it)
    for idx, mode in enumerate(modes):
        if idx in cells:
            save(cells[idx]["img"], OUT / "mode-icons" / f"{mode}.png")
        else:
            print("MISSING icon cell", idx, mode)

    # 2) Bo khung: the the (card), medallion may (cloud), con dau tron (seal),
    #    thanh ngang (divider), nut pill. Phan loai theo ti le w/h va dien tich.
    items, _ = extract(RAW / "ui-frames-sheet.png")
    print("frame components:", len(items))
    for it in items:
        r = it["w"] / max(1, it["h"])
        it["ratio"] = r
    by_area = sorted(items, key=lambda t: -t["area"])
    card = by_area[0] if by_area else None
    rest = by_area[1:]
    divider = next((t for t in rest if t["ratio"] > 6), None)
    pill = next((t for t in rest if 3 < t["ratio"] <= 6), None)
    square = [t for t in rest if 0.8 <= t["ratio"] <= 1.4]
    square.sort(key=lambda t: -t["area"])
    cloud = square[0] if len(square) > 0 else None
    seal = square[1] if len(square) > 1 else None
    named = {"card": card, "cloud": cloud, "seal": seal, "divider": divider, "pill": pill}
    for name, it in named.items():
        if it is None:
            print("MISSING frame", name)
            continue
        save(it["img"], OUT / "frames" / f"{name}.png")

    # 3) Tam nhan dan A va B: giu nguyen, dat so thu tu de ghep sau
    for tag, src in [("a", "stickers-a-magenta.png"), ("b", "stickers-b-details.png")]:
        items, _ = extract(RAW / src)
        items.sort(key=lambda t: (round(t["yc"] / 200), t["xc"]))
        print("stickers", tag, "components:", len(items))
        for i, it in enumerate(items, 1):
            save(it["img"], OUT / "stickers" / f"{tag}-{i:02d}.png")

    # 4) Nen trang: ha kich thuoc, giu la JPEG de nhe
    bg = Image.open(RAW / "page-bg-street.png").convert("RGB")
    bg.thumbnail((1600, 1600))
    OUT_BG = OUT / "backgrounds"
    OUT_BG.mkdir(parents=True, exist_ok=True)
    bg.save(OUT_BG / "page-bg-street.jpg", quality=86, optimize=True)
    print("saved backgrounds/page-bg-street.jpg", bg.size)

    # 5) Nen banner dau bai (khong chu)
    ban = Image.open(RAW / "banner-hero.png").convert("RGB")
    ban.thumbnail((1600, 1600))
    ban.save(OUT_BG / "banner-hero.jpg", quality=86, optimize=True)
    print("saved backgrounds/banner-hero.jpg", ban.size)


if __name__ == "__main__":
    main()
