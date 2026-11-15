"""Tach khung Nhat v2 (4 goc + thanh ngang + thanh doc) tu tam magenta; phan loai theo hinh dang."""
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, r"D:\ClaudeTemp\claude\b70d0e96dfc39538\39e92a07-3761-43c0-a9bc-d9f46b87deaa\scratchpad")
import zh_v4_process as p  # noqa: E402

RAW = Path(r"D:/Claude/readup-ielts/docs/design/chinese-vocab/raw/v5/ja/frames-sheet-v2.png")
OUT = Path(r"D:/Claude/readup-ielts/assets/chinese/v4/ja")

items, (W, H) = p.extract(RAW)
print("components:", len(items))
corners, hbars, vbars = [], [], []
for it in items:
    img = it["img"]
    alpha = img.getchannel("A") if img.mode == "RGBA" else None
    bbox = alpha.getbbox() if alpha is not None else img.getbbox()
    w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    print("bbox", w, h, "xc", int(it["xc"]), "yc", int(it["yc"]))
    if w > h * 4:
        hbars.append((w * h, img))
    elif h > w * 4:
        vbars.append((w * h, img))
    else:
        corners.append((w * h, img))

corners.sort(key=lambda t: -t[0])
print("corners", len(corners), "hbars", len(hbars), "vbars", len(vbars))
if corners:
    p.save(corners[0][1], OUT / "ja-frame-corner-v2.png")
if hbars:
    p.save(max(hbars, key=lambda t: t[0])[1], OUT / "ja-frame-hbar-v2.png")
if vbars:
    p.save(max(vbars, key=lambda t: t[0])[1], OUT / "ja-frame-vbar-v2.png")
print("done")
