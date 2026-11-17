"""OCR the six scanned Hanyu Jiaocheng PDFs stored in .local-private/hanyu-source."""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pymupdf
from rapidocr_onnxruntime import RapidOCR


ROOT = Path(__file__).resolve().parent.parent
SOURCE_DIR = ROOT / ".local-private" / "hanyu-source"
OUTPUT_DIR = SOURCE_DIR / "ocr"
VOLUMES = [f"han-ngu-{number}" for number in range(1, 7)]
SCALE = 1.5
PROGRESS_INTERVAL = 25


def read_existing_page_count(records_path: Path) -> int:
    if not records_path.exists():
        return 0
    with records_path.open("r", encoding="utf-8") as handle:
        return sum(1 for line in handle if line.strip())


def write_plain_text(records_path: Path, text_path: Path, volume: str) -> None:
    with records_path.open("r", encoding="utf-8") as records, text_path.open("w", encoding="utf-8") as output:
        for line in records:
            record = json.loads(line)
            output.write(f"\n\n--- {volume}, page {record['page']:03d} ---\n")
            output.write("\n".join(record.get("lines", [])))


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    print("Loading OCR model…", flush=True)
    engine = RapidOCR()
    print("OCR model ready.", flush=True)

    for volume in VOLUMES:
        pdf_path = SOURCE_DIR / f"{volume}.pdf"
        if not pdf_path.exists():
            raise FileNotFoundError(f"Missing source PDF: {pdf_path}")

        records_path = OUTPUT_DIR / f"{volume}.jsonl"
        text_path = OUTPUT_DIR / f"{volume}.txt"
        document = pymupdf.open(pdf_path)
        start_page = read_existing_page_count(records_path)
        if start_page > len(document):
            raise ValueError(f"OCR record count exceeds page count for {volume}: {start_page}/{len(document)}")

        with records_path.open("a", encoding="utf-8") as records:
            for page_index in range(start_page, len(document)):
                page = document[page_index]
                pixmap = page.get_pixmap(matrix=pymupdf.Matrix(SCALE, SCALE), alpha=False)
                image = np.frombuffer(pixmap.samples, dtype=np.uint8).reshape(pixmap.height, pixmap.width, pixmap.n)
                try:
                    result, _ = engine(image)
                    rows = result or []
                    lines = [str(row[1]).strip() for row in rows if len(row) > 1 and str(row[1]).strip()]
                    scores = [float(row[2]) for row in rows if len(row) > 2]
                    record = {
                        "page": page_index + 1,
                        "lines": lines,
                        "mean_confidence": round(sum(scores) / len(scores), 4) if scores else None,
                    }
                except Exception as error:  # Keep page-level failures resumable and visible.
                    record = {"page": page_index + 1, "lines": [], "error": str(error)}

                records.write(json.dumps(record, ensure_ascii=False) + "\n")
                records.flush()
                completed = page_index + 1
                if completed % PROGRESS_INTERVAL == 0 or completed == len(document):
                    print(f"{volume}: {completed}/{len(document)} pages", flush=True)

        write_plain_text(records_path, text_path, volume)
        print(f"Wrote {text_path}", flush=True)
        document.close()


if __name__ == "__main__":
    main()
