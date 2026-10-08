"""Dựng ảnh bìa + bản đọc thử cho Tủ sách từ tủ sách gốc.

    python scripts/books/prepare-books.py [thư-mục-sách]

Thư mục sách mặc định: D:/Claude/tong-hop-sach (bản sao các cuốn đã build, xem README trong đó).
Chỉ đọc đúng các file có tên trong src/services/books/catalog.ts — thư mục gốc còn lộ trình cá nhân,
lịch tuần và script, KHÔNG được quét cả thư mục.

Ra:
  public/books/covers/<id>.jpg     trang 1, rộng 480px (ảnh bìa trên kệ)
  public/books/samples/<id>.pdf    SAMPLE_PAGES trang đầu (đọc thử, công khai)
Số trang của từng file phải khớp `pages` trong catalog, lệch là dừng.
"""
import os
import re
import sys

import pymupdf as fitz
from pypdf import PdfReader, PdfWriter

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = sys.argv[1] if len(sys.argv) > 1 else 'D:/Claude/tong-hop-sach'
SAMPLE_PAGES = 15
COVER_W = 480


def catalog():
    """Đọc (id, file, pages) thẳng từ catalog.ts để không có hai danh sách lệch nhau."""
    text = open(os.path.join(ROOT, 'src/services/books/catalog.ts'), encoding='utf-8').read()
    out = []
    for block in re.findall(r'\{\s*id: \'[^\']+\'.*?\n  \}', text, flags=re.S):
        bid = re.search(r"id: '([^']+)'", block).group(1)
        file = re.search(r"file: '([^']+)'", block).group(1)
        pages = int(re.search(r'pages: (\d+)', block).group(1))
        out.append((bid, file, pages))
    return out


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    books = catalog()
    assert len(books) == 11, f'catalog có {len(books)} cuốn, cần 11'
    covers = os.path.join(ROOT, 'public/books/covers')
    samples = os.path.join(ROOT, 'public/books/samples')
    os.makedirs(covers, exist_ok=True)
    os.makedirs(samples, exist_ok=True)
    for bid, file, pages in books:
        path = os.path.join(SRC, file)
        reader = PdfReader(path)
        n = len(reader.pages)
        if n != pages:
            sys.exit(f'{file}: {n} trang, catalog ghi {pages} — sửa catalog.ts trước')

        doc = fitz.open(path)
        page = doc[0]
        zoom = COVER_W / page.rect.width
        pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom), alpha=False)
        cover = os.path.join(covers, f'{bid}.jpg')
        pix.save(cover, jpg_quality=82)
        doc.close()

        writer = PdfWriter()
        for i in range(min(SAMPLE_PAGES, n)):
            writer.add_page(reader.pages[i])
        writer.add_metadata({'/Title': f'{file[3:-4]} — đọc thử {SAMPLE_PAGES} trang (Band 9)'})
        writer.compress_identical_objects(remove_duplicates=True, remove_unreferenced=True)
        sample = os.path.join(samples, f'{bid}.pdf')
        with open(sample, 'wb') as f:
            writer.write(f)
        print(f'{bid:16} {n:4} trang  bìa {os.path.getsize(cover)//1024:4} KB  thử {os.path.getsize(sample)//1024:5} KB')


if __name__ == '__main__':
    main()
