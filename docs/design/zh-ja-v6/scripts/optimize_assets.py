"""Nén ảnh giao diện Trung/Nhật sang WebP (giữ alpha), tạo ảnh nhỏ cho thẻ skin, xoá bản PNG/JPG gốc trong assets.
Nguồn gốc (PNG lớn) vẫn nằm ở docs/design/zh-ja-v6/raw nên có thể cắt lại bất cứ lúc nào.

Chạy: python -X utf8 -I optimize_assets.py      (gen_motifs_ts.py và gen_ui_ts.py cũng tự gọi)
"""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[4]
V6 = ROOT / "assets/east-asian/v6"
# Tranh nền lớn: giới hạn cạnh dài; họa tiết/huy hiệu: giữ nguyên kích thước đã cắt.
MAX_SIDE = {"hero": 1280, "ui": 1280}


def to_webp(src: Path, quality: int, max_side: int | None) -> Path:
    dst = src.with_suffix(".webp")
    im = Image.open(src)
    im.load()
    if max_side and max(im.size) > max_side:
        k = max_side / max(im.size)
        im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    has_alpha = im.mode in ("RGBA", "LA") or "transparency" in im.info
    im = im.convert("RGBA" if has_alpha else "RGB")
    im.save(dst, "WEBP", quality=quality, method=6, alpha_quality=92)
    return dst


def main():
    saved = 0
    for src in sorted(list(V6.rglob("*.png")) + list(V6.rglob("*.jpg"))):
        rel = src.relative_to(V6).parts
        kind = rel[0]  # ja | zh | hero | ui
        is_photo = src.suffix == ".jpg" or kind == "hero" or src.stem.startswith(("sidebar", "footer", "ja-hero", "zh-hero"))
        before = src.stat().st_size
        dst = to_webp(src, 80 if is_photo else 82, MAX_SIDE.get(kind) if is_photo else None)
        saved += before - dst.stat().st_size
        src.unlink()
    # ảnh nhỏ cho thẻ chọn skin / thẻ lối vào (640px, ~30KB)
    thumbs = V6 / "hero" / "thumbs"
    thumbs.mkdir(exist_ok=True)
    for hero in sorted((V6 / "hero").glob("*.webp")):
        t = thumbs / hero.name
        if t.exists():
            continue
        im = Image.open(hero).convert("RGB")
        im.thumbnail((640, 640), Image.LANCZOS)
        im.save(t, "WEBP", quality=72, method=6)
    # hero của bộ giao diện mới cũng có ảnh nhỏ
    for name in ("ja-hero2", "zh-hero2"):
        src = V6 / "ui" / f"{name}.webp"
        t = thumbs / f"{name}.webp"
        if src.exists() and not t.exists():
            im = Image.open(src).convert("RGB")
            im.thumbnail((640, 640), Image.LANCZOS)
            im.save(t, "WEBP", quality=72, method=6)
    print(f"đã nén, tiết kiệm {saved // 1024} KB")


if __name__ == "__main__":
    main()
