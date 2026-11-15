"""Tach asset Nhat Ban: banner, nen trang va 6 hoa tiet tu tam magenta (2 hang x 3 cot, doc trai -> phai)."""
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, r"D:\ClaudeTemp\claude\b70d0e96dfc39538\39e92a07-3761-43c0-a9bc-d9f46b87deaa\scratchpad")
import zh_v4_process as p  # noqa: E402

RAW = Path(r"D:/Claude/readup-ielts/docs/design/chinese-vocab/raw/v4/ja")
OUT = Path(r"D:/Claude/readup-ielts/assets/chinese/v4/ja")
OUT.mkdir(parents=True, exist_ok=True)

for src, name, size in [("banner-ja.png", "banner-ja.jpg", 1600), ("bg-ja.png", "page-bg-ja.jpg", 1600)]:
    im = Image.open(RAW / src).convert("RGB")
    im.thumbnail((size, size))
    im.save(OUT / name, quality=86, optimize=True)
    print("saved", name, im.size)

items, (W, H) = p.extract(RAW / "stickers-ja-6.png")
print("components:", len(items))
for it in items:
    it["row"] = min(1, int(it["yc"] // (H / 2)))
    it["col"] = min(2, int(it["xc"] // (W / 3)))
names = ["torii", "fan", "lantern", "koi", "fuji", "sakura"]
cells = {}
for it in items:
    cells.setdefault(it["row"] * 3 + it["col"], it)
for idx, nm in enumerate(names):
    if idx in cells:
        p.save(cells[idx]["img"], OUT / f"ja-{nm}.png")
    else:
        print("MISSING", nm)
