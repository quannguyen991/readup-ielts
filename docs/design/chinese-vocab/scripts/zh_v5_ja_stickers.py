"""Tach 6 sticker Nhat v2 (luoi 3x2, doc trai -> phai, tren -> duoi) tu tam magenta."""
import sys
from pathlib import Path

sys.path.insert(0, r"D:\ClaudeTemp\claude\b70d0e96dfc39538\39e92a07-3761-43c0-a9bc-d9f46b87deaa\scratchpad")
import zh_v4_process as p  # noqa: E402

RAW = Path(r"D:/Claude/readup-ielts/docs/design/chinese-vocab/raw/v5/ja/stickers-v2.png")
OUT = Path(r"D:/Claude/readup-ielts/assets/chinese/v4/ja")
names = ["daruma", "maneki", "crane", "ema", "sakura", "hanko"]

items, (W, H) = p.extract(RAW)
print("components:", len(items))
cells = {}
for it in items:
    row = min(1, int(it["yc"] // (H / 2)))
    col = min(2, int(it["xc"] // (W / 3)))
    cells.setdefault(row * 3 + col, it)
for idx, nm in enumerate(names):
    if idx in cells:
        p.save(cells[idx]["img"], OUT / f"ja-st-{nm}.png")
    else:
        print("MISSING", nm)
print("done")
