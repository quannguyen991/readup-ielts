"""
Ép mọi mảnh đất của một thành phố về MỘT bảng màu chung để cỏ/nước/đường của các mảnh khớp tông (giảm vết nối).

  python match-palette.py <city> [soMau=64]

Đọc public/travel/terrain/<city>{,-e,-s,-se}.small.png (+ bản x4 nếu có), lưu bản gốc vào terrain/_orig/ (chỉ lần đầu),
rồi ghi đè bản đã ép. Chạy lại an toàn: luôn đọc từ _orig nếu có.
"""
import os, sys, shutil
from PIL import Image

city = sys.argv[1]
ncol = int(sys.argv[2]) if len(sys.argv) > 2 else 64
D = 'public/travel/terrain'
O = os.path.join(D, '_orig')
os.makedirs(O, exist_ok=True)
names = [f'{city}{s}' for s in ('', '-e', '-s', '-se', '-n', '-w', '-ne', '-nw', '-sw')]
names = [n for n in names if os.path.exists(os.path.join(D, n + '.small.png')) or os.path.exists(os.path.join(O, n + '.small.png'))]
for n in names:
    for ext in ('.small.png', '.png'):
        src, bak = os.path.join(D, n + ext), os.path.join(O, n + ext)
        if os.path.exists(src) and not os.path.exists(bak):
            shutil.copy(src, bak)
ims = {n: Image.open(os.path.join(O, n + '.small.png')).convert('RGB') for n in names}
W = sum(i.width for i in ims.values())
H = max(i.height for i in ims.values())
mosaic = Image.new('RGB', (W, H))
x = 0
for i in ims.values():
    mosaic.paste(i, (x, 0)); x += i.width
pal_im = mosaic.quantize(ncol, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
for n, im in ims.items():
    out = im.quantize(palette=pal_im, dither=Image.Dither.NONE).convert('RGB')
    out.save(os.path.join(D, n + '.small.png'))
    big_o = os.path.join(O, n + '.png')
    if os.path.exists(big_o):
        big = Image.open(big_o).convert('RGB')
        big.quantize(palette=pal_im, dither=Image.Dither.NONE).convert('RGB').save(os.path.join(D, n + '.png'))
    print(n, 'ok', len(set(out.getdata())), 'màu')
