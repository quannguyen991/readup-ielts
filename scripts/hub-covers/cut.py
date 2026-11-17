"""Cắt các tấm 3x3 thành từng bìa vuông WebP 384x384.

Tìm ba đoạn không trắng theo cột và theo hàng (các rãnh trắng giữa ô), rồi cắt từng ô,
bỏ viền 3 px để không dính mép trắng. Nếu không tách được thì chia đều ba phần.
Chạy: python cut.py   →   public/hub/covers/<id>.webp
"""
import os
import sys

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', '..', 'public', 'hub', 'covers')
os.makedirs(OUT, exist_ok=True)

# Thứ tự ô trong từng tấm (trái→phải, trên→dưới) — khớp gen.sh
SHEETS = {
    'sheet-1': ['ielts-examiner', 'ielts-part1', 'ielts-part2', 'ielts-part3', 'band-upgrade', 'grammar', 'speech-analysis', 'vocab', 'pronounce'],
    'sheet-2': ['idioms', 'fluency', 'diary', 'daily-english', 'small-talk', 'phone', 'travel', 'dating', 'storytelling'],
    'sheet-3': ['meeting', 'interview', 'profile', 'public-speaking', 'presentation', 'sales', 'negotiation', 'conflict', 'leader-comms'],
    'sheet-4': ['leadership', 'tool-analyze', 'tool-pitch', 'tool-short', 'tool-shadow', 'tool-scenarios', 'tool-topics', 'tool-meeting', 'talk'],
}


def runs(is_content):
    """Các đoạn liên tiếp có nội dung, bỏ đoạn quá ngắn (nhiễu)."""
    out, start = [], None
    for i, v in enumerate(is_content):
        if v and start is None:
            start = i
        if not v and start is not None:
            out.append((start, i))
            start = None
    if start is not None:
        out.append((start, len(is_content)))
    return [r for r in out if r[1] - r[0] > 40]


def split3(profile, size):
    r = runs(profile)
    if len(r) == 3:
        return r
    if len(r) > 3:  # giữ ba đoạn dài nhất theo thứ tự
        r = sorted(sorted(r, key=lambda x: x[0] - x[1])[:3])
        return r
    step = size // 3
    return [(i * step, (i + 1) * step) for i in range(3)]


def main():
    only = sys.argv[1:]
    for sheet, ids in SHEETS.items():
        if only and sheet not in only:
            continue
        src = os.path.join(HERE, 'raw', sheet + '.png')
        if not os.path.exists(src):
            print('thiếu', src)
            continue
        im = Image.open(src).convert('RGB')
        a = np.asarray(im).astype(np.int16)
        nonwhite = (a.min(axis=2) < 238)
        cols = split3(nonwhite.mean(axis=0) > 0.25, im.width)
        rows = split3(nonwhite.mean(axis=1) > 0.25, im.height)
        k = 0
        for (y0, y1) in rows:
            for (x0, x1) in cols:
                m = 3
                tile = im.crop((x0 + m, y0 + m, x1 - m, y1 - m))
                s = min(tile.width, tile.height)
                tile = tile.crop(((tile.width - s) // 2, (tile.height - s) // 2, (tile.width - s) // 2 + s, (tile.height - s) // 2 + s)).resize((384, 384), Image.LANCZOS)
                tile.save(os.path.join(OUT, ids[k] + '.webp'), 'WEBP', quality=88, method=6)
                k += 1
        print(sheet, 'cols', cols, 'rows', rows)


def write_registry():
    ids = sorted(f[:-5] for f in os.listdir(OUT) if f.endswith('.webp'))
    path = os.path.join(HERE, '..', '..', 'src', 'data', 'hub-covers.ts')
    body = "/** Bìa vuông của gia sư và công cụ Speaking (public/hub/covers). Sinh bởi scripts/hub-covers/cut.py. */\n"
    body += 'const COVERS = new Set<string>(' + repr(ids).replace("'", '"') + ');\n\n'
    body += "export function hubCover(id: string): string | null {\n  return COVERS.has(id) ? `/hub/covers/${id}.webp` : null;\n}\n"
    open(path, 'w', encoding='utf8').write(body)
    print('registry', len(ids))


if __name__ == '__main__':
    main()
    write_registry()
