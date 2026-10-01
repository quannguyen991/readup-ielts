"""Biến ảnh AI (dạng tranh) thành pixel art thật: thu nhỏ theo ô, hạ bão hoà, ép bảng màu, phóng nguyên số.
python pixelate.py in.png out_prefix [block=4] [colors=64] [sat=0.82] [bright=0.94]
Ghi out_prefix.small.png (độ phân giải gốc của pixel) và out_prefix.png (phóng lại đúng kích thước đầu vào)."""
import sys
from PIL import Image, ImageEnhance

src, out = sys.argv[1], sys.argv[2]
block = int(sys.argv[3]) if len(sys.argv) > 3 else 4
colors = int(sys.argv[4]) if len(sys.argv) > 4 else 64
sat = float(sys.argv[5]) if len(sys.argv) > 5 else 0.82
bright = float(sys.argv[6]) if len(sys.argv) > 6 else 0.94

im = Image.open(src).convert('RGB')
if im.size != (1672, 941) and abs(im.size[0] / im.size[1] - 16 / 9) < 0.02:
    im = im.resize((1672, 940), Image.LANCZOS)
w, h = im.size
sw, sh = w // block, h // block
small = im.resize((sw, sh), Image.BOX)
small = ImageEnhance.Color(small).enhance(sat)
small = ImageEnhance.Brightness(small).enhance(bright)
small = ImageEnhance.Contrast(small).enhance(1.08)
q = small.quantize(colors=colors, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert('RGB')
q.save(out + '.small.png', optimize=True)
q.resize((sw * block, sh * block), Image.NEAREST).save(out + '.png', optimize=True)
print(out, q.size, '->', (sw * block, sh * block))
