"""Run local OCR for the scanned Cambridge IELTS 17–19 source PDFs.

Requires the local Python packages pymupdf, numpy and rapidocr-onnxruntime.
Extracted text and intermediate checkpoints remain in the ignored private store.
"""
from pathlib import Path
import json
import pymupdf
import numpy as np
from rapidocr_onnxruntime import RapidOCR

ROOT = Path(__file__).resolve().parents[2]
PRIVATE = ROOT / ".local-private" / "ielts-ocr"
engine = RapidOCR(use_cls=False)

for book in (17, 18, 19):
    source = PRIVATE / f"cambridge{book}-book.pdf"
    document = pymupdf.open(source)
    partial = PRIVATE / f"cambridge{book}-book.ocr.partial.json"
    pages = json.loads(partial.read_text(encoding="utf-8"))["pages"] if partial.exists() else []
    completed = len(pages)
    for index, page in enumerate(document):
        if index < completed:
            continue
        pixmap = page.get_pixmap(matrix=pymupdf.Matrix(1.15, 1.15), alpha=False)
        image = np.frombuffer(pixmap.samples, dtype=np.uint8).reshape(pixmap.height, pixmap.width, pixmap.n)
        result, _ = engine(image)
        lines = [str(item[1]).strip() for item in (result or []) if len(item) > 1 and str(item[1]).strip()]
        pages.append({"page": index + 1, "text": "\n".join(lines)})
        if (index + 1) % 25 == 0:
            partial.write_text(json.dumps({"source": source.name, "pages": pages}, ensure_ascii=False), encoding="utf-8")
            print(f"Cambridge {book}: OCR {index + 1}/{len(document)} pages", flush=True)
    output = PRIVATE / f"cambridge{book}-book.ocr.json"
    output.write_text(json.dumps({"source": source.name, "pages": pages}, ensure_ascii=False), encoding="utf-8")
    partial.unlink(missing_ok=True)
    print(f"Cambridge {book}: saved {len(pages)} OCR pages; {sum(bool(page['text']) for page in pages)} non-empty", flush=True)
