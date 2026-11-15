"""Sinh src/components/vocab/eastasia/motifs.ts từ các PNG đã bóc tách (assets/east-asian/v6/<ja|zh>/).
Chạy lại sau mỗi lần bóc tách tấm mới:  python -X utf8 -I gen_motifs_ts.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import optimize_assets

ROOT = Path(__file__).resolve().parents[4]
ASSETS = ROOT / "assets/east-asian/v6"
OUT = ROOT / "src/components/vocab/eastasia/motifs.ts"

NAMES = {
    "ja-creatures": ["craneFly", "koi", "fox", "neko", "craneStand", "daruma", "rabbit", "turtle", "sparrow"],
    "ja-flora": ["sakuraL", "sakuraR", "petals", "wisteria", "maple", "pine", "plum", "chrysanthemum", "cloud"],
    "ja-objects": ["torii", "pagoda", "lantern", "fan", "umbrella", "teahouse", "kanzashi", "origami", "bridge"],
    "ja-patterns": ["seigaiha", "asanoha", "wave", "cloudBand", "corner", "kikko", "moon", "sun", "fuji"],
    "zh-creatures": ["craneFly", "phoenix", "dragon", "koi", "panda", "magpie", "lion", "turtle", "butterflies"],
    "zh-flora": ["plum", "peony", "lotus", "orchid", "bamboo", "chrysanthemum", "osmanthus", "peach", "ruyiCloud"],
    "zh-objects": ["pavilion", "pagoda", "moonGate", "palace", "lantern", "fan", "umbrella", "scroll", "knot"],
    "zh-patterns": ["xiangyun", "wave", "corner", "medallion", "moon", "sun", "mountains", "mist", "cloudScroll"],
}


def main():
    optimize_assets.main()
    lines = [
        "/**",
        " * Họa tiết đã bóc tách nền (PNG trong suốt) cho màn Tiếng Trung / Tiếng Nhật.",
        " * FILE SINH TỰ ĐỘNG bởi docs/design/zh-ja-v6/scripts/gen_motifs_ts.py — đừng sửa tay.",
        " * Thứ tự tên theo thứ tự ô trong tấm gốc (trái→phải, trên→dưới).",
        " */",
        "",
    ]
    for lang in ("ja", "zh"):
        const = f"{lang.upper()}_MOTIF"
        lines.append(f"export const {const} = {{")
        for sheet, names in NAMES.items():
            if not sheet.startswith(lang):
                continue
            for i, nm in enumerate(names, 1):
                f = ASSETS / lang / f"{sheet}-{i:02d}.webp"
                if not f.exists():
                    continue
                # Trùng tên giữa các tấm (vd. cloud/moon): thêm tiền tố tấm.
                key = nm
                lines.append(f"  {key}: require('../../../../assets/east-asian/v6/{lang}/{f.name}') as number,")
        lines.append("} as const;")
        lines.append("")
        lines.append(f"export type {lang.capitalize()}MotifName = keyof typeof {const};")
        lines.append("")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text("\n".join(lines), encoding="utf-8")
    print("wrote", OUT.relative_to(ROOT))


if __name__ == "__main__":
    main()
