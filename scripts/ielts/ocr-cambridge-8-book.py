"""OCR the scanned Cambridge IELTS 8 book so its Reading passages can be rebuilt.

Writes .local-private/ielts-ocr/cambridge8-book.ocr.json with one entry per PDF page.
Checkpoints every 25 pages, so an interrupted run resumes where it stopped.
"""
from pathlib import Path
import json

import numpy as np
import pymupdf
from rapidocr_onnxruntime import RapidOCR

ROOT = Path(__file__).resolve().parents[2]
PRIVATE = ROOT / ".local-private" / "ielts-ocr"
source = PRIVATE / "cambridge8-book.pdf"
partial = PRIVATE / "cambridge8-book.ocr.partial.json"
output = PRIVATE / "cambridge8-book.ocr.json"

engine = RapidOCR(use_cls=False)
document = pymupdf.open(source)
pages = json.loads(partial.read_text(encoding="utf-8"))["pages"] if partial.exists() else []
for index, page in enumerate(document):
    if index < len(pages):
        continue
    pixmap = page.get_pixmap(matrix=pymupdf.Matrix(1.6, 1.6), alpha=False)
    image = np.frombuffer(pixmap.samples, dtype=np.uint8).reshape(pixmap.height, pixmap.width, pixmap.n)
    result, _ = engine(image)
    lines = [str(item[1]).strip() for item in (result or []) if len(item) > 1 and str(item[1]).strip()]
    pages.append({"page": index + 1, "text": "\n".join(lines)})
    if (index + 1) % 25 == 0:
        partial.write_text(json.dumps({"source": source.name, "pages": pages}, ensure_ascii=False), encoding="utf-8")
        print(f"OCR {index + 1}/{len(document)} pages", flush=True)
output.write_text(json.dumps({"source": source.name, "pages": pages}, ensure_ascii=False), encoding="utf-8")
partial.unlink(missing_ok=True)
print(f"saved {len(pages)} pages", flush=True)
