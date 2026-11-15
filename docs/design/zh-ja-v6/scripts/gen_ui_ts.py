"""Xử lý ảnh nguyên khối (hero, thanh bên, chân trang) và sinh src/components/vocab/eastasia/ui.ts.
Chạy lại sau khi có thêm tấm mới:  python -X utf8 -I gen_ui_ts.py
Tấm 3x3 phải được cắt trước bằng: python -X utf8 -I cut_motifs.py ui/<tên>
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import optimize_assets

from PIL import Image

ROOT = Path(__file__).resolve().parents[4]
RAW = ROOT / "docs/design/zh-ja-v6/raw/ui"
OUT = ROOT / "assets/east-asian/v6/ui"
TS = ROOT / "src/components/vocab/eastasia/ui.ts"
OUT.mkdir(parents=True, exist_ok=True)


def jpg(src: str, dest: str, max_w: int, crop=None, q=84):
    f = RAW / f"{src}.png"
    if not f.exists():
        return False
    im = Image.open(f).convert("RGB")
    if crop:  # (x0,y0,x1,y1) theo tỉ lệ 0..1
        w, h = im.size
        im = im.crop((int(crop[0] * w), int(crop[1] * h), int(crop[2] * w), int(crop[3] * h)))
    if im.width > max_w:
        im = im.resize((max_w, round(im.height * max_w / im.width)), Image.LANCZOS)
    im.save(OUT / f"{dest}.jpg", quality=q, optimize=True)
    return True


def main():
    jpg("ja-hero2", "ja-hero2", 1500)
    jpg("zh-hero2", "zh-hero2", 1500)
    jpg("sidebar-ja", "sidebar-ja", 640)
    jpg("sidebar-zh", "sidebar-zh", 640)
    # chân trang: nửa dưới của ảnh 16:9
    jpg("footer-ja", "footer-ja", 1500, crop=(0, 0.42, 1, 1))
    jpg("footer-zh", "footer-zh", 1500, crop=(0, 0.42, 1, 1))

    optimize_assets.main()

    def req(name):
        return f"require('../../../../assets/east-asian/v6/ui/{name}') as number"

    def has(name):
        return (OUT / name).exists()

    L = [
        "/**",
        " * Tài nguyên giao diện Trung/Nhật (huy hiệu cấp, bìa sách, tranh nền, khung hoa văn).",
        " * FILE SINH TỰ ĐỘNG bởi docs/design/zh-ja-v6/scripts/gen_ui_ts.py — đừng sửa tay.",
        " */",
        "",
    ]
    ja = {
        "sealTorii": "ja/../ja-seals-01.png", "sealFan": "ja-seals-02.webp", "sealWave": "ja-seals-03.webp",
        "sealSakura": "ja-seals-04.webp", "sealFuji": "ja-seals-05.webp", "badge": "ja-seals-06.webp",
        "flowerIcon": "ja-seals-07.webp", "cloud": "ja-seals-08.webp", "ribbon": "ja-seals-09.webp",
        "bookStarter": "books-01.webp", "bookWave": "books-02.webp", "bookGreen": "books-03.webp",
        "bookWisteria": "books-04.webp", "bookTorii": "books-05.webp",
        "hero": "ja-hero2.webp", "sidebar": "sidebar-ja.webp", "footer": "footer-ja.webp",
    }
    zh = {
        "sealCoin": "zh-seals-01.webp", "sealIngot": "zh-seals-02.webp", "sealKnot": "zh-seals-03.webp",
        "sealFan": "zh-seals-04.webp", "sealPagoda": "zh-seals-05.webp", "sealPeony": "zh-seals-06.webp",
        "latticeTL": "zh-seals-07.webp", "latticeBL": "zh-seals-08.webp", "cloud": "zh-seals-09.webp",
        "bookHsk": "books-06.webp", "bookDragon": "books-07.webp", "bookLotus": "books-08.webp", "bookMoon": "books-09.webp",
        "hero": "zh-hero2.webp", "sidebar": "sidebar-zh.webp", "footer": "footer-zh.webp",
    }
    ja["sealTorii"] = "ja-seals-01.webp"
    for const, table in (("JA_UI", ja), ("ZH_UI", zh)):
        L.append(f"export const {const} = {{")
        for key, fn in table.items():
            sub = ""
            f = OUT / fn
            # các tấm cắt nằm trong assets/east-asian/v6/ui/ (cut_motifs với tiền tố ui/)
            if f.exists():
                L.append(f"  {key}: {req(fn)},")
        L.append("} as const;")
        L.append("")
    TS.write_text("\n".join(L), encoding="utf-8")
    print("wrote", TS.relative_to(ROOT))


if __name__ == "__main__":
    main()
