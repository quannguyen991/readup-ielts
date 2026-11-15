"""Doi goc cap 1 (b-10, ve o goc duoi-phai) thanh goc tren-trai de dong bo voi cac cap 2..7."""
from pathlib import Path

from PIL import Image

SRC = Path(r"D:/Claude/readup-ielts/assets/chinese/v4/stickers/b-10.png")
DST = Path(r"D:/Claude/readup-ielts/assets/chinese/v4/levels/corner-level1.png")

im = Image.open(SRC).convert("RGBA")
im.transpose(Image.Transpose.ROTATE_180).save(DST, optimize=True)
print("saved", DST.name, im.size)
