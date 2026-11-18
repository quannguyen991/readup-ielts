"""Resumable page-level OCR for scanned Cambridge IELTS books.

OCR text is kept in .local-private because it contains source passages. The
published vocabulary artifact stores only short lexical items and source refs.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import pymupdf
from rapidocr_onnxruntime import RapidOCR


ROOT = Path(__file__).resolve().parents[2]
SOURCE_DIR = ROOT / ".local-private" / "ielts-ocr"
OUTPUT_DIR = SOURCE_DIR / "cambridge-ocr"
PDFS = {
    11: "cambridge11-book.pdf",
    12: "cambridge12-book.pdf",
    13: "cambridge13-book.pdf",
    14: "cambridge14-book.pdf",
    17: "cambridge17-book.pdf",
    18: "cambridge18-book.pdf",
    19: "cambridge19-book.pdf",
    20: "cambridge20-academic-source.pdf",
    21: "cambridge21-book.pdf",
}
SCALE = 1.5
PROGRESS_INTERVAL = 20


def existing_pages(path: Path) -> set[int]:
    if not path.exists():
        return set()
    seen: set[int] = set()
    with path.open("r", encoding="utf-8") as records:
        for line in records:
            if not line.strip():
                continue
            try:
                seen.add(int(json.loads(line)["page"]))
            except (KeyError, ValueError, json.JSONDecodeError):
                continue
    return seen


def ocr_page(engine: RapidOCR, page: pymupdf.Page, page_number: int, scale: float) -> dict[str, object]:
    text_layer = page.get_text("text").strip()
    if len(text_layer) >= 100:
        return {
            "page": page_number,
            "text": text_layer,
            "lines": [line.strip() for line in text_layer.splitlines() if line.strip()],
            "mean_confidence": 1.0,
            "method": "pdf-text-layer",
        }

    pixmap = page.get_pixmap(matrix=pymupdf.Matrix(scale, scale), alpha=False)
    image = np.frombuffer(pixmap.samples, dtype=np.uint8).reshape(pixmap.height, pixmap.width, pixmap.n)
    result, _ = engine(image)
    rows = result or []
    lines = [str(row[1]).strip() for row in rows if len(row) > 1 and str(row[1]).strip()]
    scores = [float(row[2]) for row in rows if len(row) > 2]
    return {
        "page": page_number,
        "text": "\n".join(lines),
        "lines": lines,
        "mean_confidence": round(sum(scores) / len(scores), 4) if scores else None,
        "method": "rapidocr-onnxruntime",
    }


def main() -> None:
    global SCALE
    parser = argparse.ArgumentParser()
    parser.add_argument("--books", nargs="+", type=int, choices=sorted(PDFS), default=sorted(PDFS))
    parser.add_argument("--scale", type=float, default=SCALE)
    args = parser.parse_args()
    SCALE = args.scale

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    print("Loading RapidOCR model…", flush=True)
    engine = RapidOCR()
    print("OCR model ready.", flush=True)

    for book in args.books:
        pdf_path = SOURCE_DIR / PDFS[book]
        if not pdf_path.exists():
            raise FileNotFoundError(f"Missing source PDF for Cambridge {book}: {pdf_path}")

        records_path = OUTPUT_DIR / f"cambridge-{book}.jsonl"
        document = pymupdf.open(pdf_path)
        done = existing_pages(records_path)
        if any(page < 1 or page > len(document) for page in done):
            raise ValueError(f"Out-of-range page in {records_path}; inspect it before resuming")

        print(f"Cambridge {book}: {len(done)}/{len(document)} pages already processed", flush=True)
        with records_path.open("a", encoding="utf-8") as records:
            for page_index in range(len(document)):
                page_number = page_index + 1
                if page_number in done:
                    continue
                try:
                    record = ocr_page(engine, document[page_index], page_number, SCALE)
                except Exception as error:  # Keep failures visible and page-level resumable.
                    record = {"page": page_number, "text": "", "lines": [], "mean_confidence": None, "method": "error", "error": str(error)}
                records.write(json.dumps(record, ensure_ascii=False) + "\n")
                records.flush()
                done.add(page_number)
                if len(done) % PROGRESS_INTERVAL == 0 or len(done) == len(document):
                    print(f"Cambridge {book}: {len(done)}/{len(document)} pages", flush=True)
        document.close()
        print(f"Saved {records_path}", flush=True)


if __name__ == "__main__":
    main()
