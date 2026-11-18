"""Cat bo phan trong suot quanh cac asset khung/goc theo cap, de mep hinh khop dung mep o chua no."""
from pathlib import Path

from PIL import Image

ROOT = Path(r"D:/Claude/readup-ielts/assets/chinese/v4")
targets = list((ROOT / "levels").glob("*.png")) + [ROOT / "frames" / "cloud.png", ROOT / "frames" / "seal.png"]

for p in targets:
    im = Image.open(p).convert("RGBA")
    alpha = im.getchannel("A").point(lambda v: 255 if v > 12 else 0)
    box = alpha.getbbox()
    if not box:
        print("skip", p.name)
        continue
    cropped = im.crop(box)
    cropped.save(p, optimize=True)
    print("trimmed", p.name, im.size, "->", cropped.size)
