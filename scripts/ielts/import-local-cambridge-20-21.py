"""Import user-provided Cambridge IELTS 20/21 files into the local-only store.

The original PDFs/audio and extracted book text stay under .local-private/ielts-ocr,
which is ignored by Git and is not part of public deployments.
"""
from __future__ import annotations

import json
import re
import shutil
import zipfile
from pathlib import Path

import numpy as np
import pymupdf
from rapidocr_onnxruntime import RapidOCR


ROOT = Path(__file__).resolve().parents[2]
PRIVATE = ROOT / ".local-private" / "ielts-ocr"
MANIFEST = PRIVATE / "source-tests.json"

CAM21_PDF = Path(r"D:\Cambridge IELTS 21.pdf")
CAM21_AUDIO_ZIP = Path(r"D:\OneDrive_2026-10-11.zip")
CAM20_SCAN_PDF = Path(r"D:\Cambridge IELTS 20 Academic.pdf")
CAM20_CLEAR_PDF = Path(r"D:\CAM 20 Reading - Listening (đẹp).pdf")

CAM21_AUDIO_MEMBERS = {
    number: f"Cambridge IELTS 21 Audio/Cambridge 21 - Test {number}.mp3"
    for number in range(1, 5)
}
CAM21_LISTENING_STARTS = [11, 33, 55, 76]
CAM21_READING_STARTS = [17, 39, 61, 82]
CAM21_LISTENING_KEYS = [118, 120, 122, 124]
CAM21_READING_KEYS = [119, 121, 123, 125]
CAM21_WRITING_STARTS = [30, 52, 73, 95]
CAM21_SPEAKING_STARTS = [32, 54, 75, 97]


def copy_cam21_assets() -> dict[int, str]:
    if not CAM21_PDF.is_file() or not CAM21_AUDIO_ZIP.is_file():
        raise FileNotFoundError("Cambridge 21 PDF or audio ZIP is missing from D:\\")

    book_name = "cambridge21-book.pdf"
    book_target = PRIVATE / book_name
    if not book_target.exists() or book_target.stat().st_size != CAM21_PDF.stat().st_size:
        shutil.copy2(CAM21_PDF, book_target)
    audio_names: dict[int, str] = {}
    with zipfile.ZipFile(CAM21_AUDIO_ZIP) as archive:
        available = set(archive.namelist())
        for number, member in CAM21_AUDIO_MEMBERS.items():
            if member not in available:
                raise FileNotFoundError(f"Missing Cambridge 21 audio track {number}")
            target_name = f"cambridge21-listening-test{number}.mp3"
            target = PRIVATE / target_name
            if not target.exists() or target.stat().st_size != archive.getinfo(member).file_size:
                with archive.open(member) as source, target.open("wb") as out:
                    shutil.copyfileobj(source, out, length=1024 * 1024)
            audio_names[number] = target_name
    return audio_names


def copy_cam20_clear_pdf() -> str:
    if not CAM20_CLEAR_PDF.is_file():
        raise FileNotFoundError("Cambridge 20 readable PDF is missing from D:\\")
    asset_name = "cambridge20-reading-listening-source.pdf"
    asset_path = PRIVATE / asset_name
    if not asset_path.exists() or asset_path.stat().st_size != CAM20_CLEAR_PDF.stat().st_size:
        shutil.copy2(CAM20_CLEAR_PDF, asset_path)
    return asset_name


def extract_cam21_tests(audio_names: dict[int, str]) -> list[dict]:
    document = pymupdf.open(CAM21_PDF)

    def page_record(page_number: int) -> dict:
        text = document[page_number - 1].get_text("text").strip()
        return {"page": page_number, "text": text, "reviewLines": []}

    records = []
    for number in range(1, 5):
        listening_start = CAM21_LISTENING_STARTS[number - 1]
        reading_start = CAM21_READING_STARTS[number - 1]
        listening_end = reading_start - 1
        # The Reading section ends immediately before that test's Writing pages.
        # Using the next Listening section as the boundary also pulled Writing,
        # Speaking and (for Test 4) answer-key pages into the Reading record.
        reading_end = CAM21_WRITING_STARTS[number - 1] - 1

        records.append({
            "id": f"cambridge-21-listening-{number}",
            "title": f"Cambridge IELTS 21 · Listening Test {number}",
            "source": "Cambridge IELTS 21",
            "section": "Listening",
            "questionCount": 40,
            "pages": [page_record(page) for page in range(listening_start, listening_end + 1)],
            "supportPages": [page_record(CAM21_LISTENING_KEYS[number - 1])],
            "answerKeyVerified": False,
            "pdfAsset": "cambridge21-book.pdf",
            "sourceStartPage": listening_start,
            "audioFiles": [audio_names[number]],
        })
        records.append({
            "id": f"cambridge-21-reading-{number}",
            "title": f"Cambridge IELTS 21 · Reading Test {number}",
            "source": "Cambridge IELTS 21",
            "section": "Reading",
            "questionCount": 40,
            "pages": [page_record(page) for page in range(reading_start, reading_end + 1)],
            "supportPages": [page_record(CAM21_READING_KEYS[number - 1])],
            "answerKeyVerified": False,
            "pdfAsset": "cambridge21-book.pdf",
            "sourceStartPage": reading_start,
            "audioFiles": [],
        })
        writing_start = CAM21_WRITING_STARTS[number - 1]
        records.append({
            "id": f"cambridge-21-writing-{number}",
            "title": f"Cambridge IELTS 21 · Writing Test {number}",
            "source": "Cambridge IELTS 21",
            "section": "Writing",
            "questionCount": 2,
            "answerMode": "long",
            "responseLabels": ["Task 1", "Task 2"],
            "pages": [page_record(page) for page in range(writing_start, writing_start + 2)],
            "supportPages": [],
            "answerKeyVerified": False,
            "pdfAsset": "cambridge21-book.pdf",
            "sourceStartPage": writing_start,
            "audioFiles": [],
        })
        speaking_start = CAM21_SPEAKING_STARTS[number - 1]
        records.append({
            "id": f"cambridge-21-speaking-{number}",
            "title": f"Cambridge IELTS 21 · Speaking Test {number}",
            "source": "Cambridge IELTS 21",
            "section": "Speaking",
            "questionCount": 3,
            "answerMode": "long",
            "responseLabels": ["Part 1", "Part 2", "Part 3"],
            "pages": [page_record(speaking_start)],
            "supportPages": [],
            "answerKeyVerified": False,
            "pdfAsset": "cambridge21-book.pdf",
            "sourceStartPage": speaking_start,
            "audioFiles": [],
        })
    return records


def ocr_lines(engine: RapidOCR, page: pymupdf.Page) -> str:
    pixmap = page.get_pixmap(matrix=pymupdf.Matrix(1.05, 1.05), alpha=False)
    image = np.frombuffer(pixmap.samples, dtype=np.uint8).reshape(pixmap.height, pixmap.width, pixmap.n)
    detected, _ = engine(image)
    if not detected:
        return ""

    entries = []
    for box, text, confidence in detected:
        if not text or confidence < 0.25:
            continue
        xs = [point[0] for point in box]
        ys = [point[1] for point in box]
        entries.append((sum(ys) / len(ys), min(xs), text.strip()))
    entries.sort(key=lambda item: (item[0], item[1]))

    rows: list[list[tuple[float, float, str]]] = []
    row_centers: list[float] = []
    for entry in entries:
        y, _, _ = entry
        if rows and abs(y - row_centers[-1]) <= 11:
            rows[-1].append(entry)
            row_centers[-1] = sum(item[0] for item in rows[-1]) / len(rows[-1])
        else:
            rows.append([entry])
            row_centers.append(y)
    return "\n".join(" ".join(item[2] for item in sorted(row, key=lambda item: item[1])) for row in rows)


def extract_cam20_scan() -> tuple[int, int, int]:
    if not CAM20_SCAN_PDF.is_file():
        raise FileNotFoundError("Cambridge IELTS 20 Academic scan is missing from D:\\")

    document = pymupdf.open(CAM20_SCAN_PDF)
    engine = RapidOCR(
        use_cls=False,
        rec_batch_num=1,
        cls_batch_num=1,
        intra_op_num_threads=2,
        inter_op_num_threads=1,
        max_side_len=1600,
        det_limit_side_len=736,
        det_max_candidates=300,
        det_thresh=0.4,
    )
    output = PRIVATE / "cambridge20-academic.ocr.json"
    pages = []
    if output.exists():
        try:
            previous = json.loads(output.read_text(encoding="utf-8"))
            pages = previous.get("pages", [])
        except (json.JSONDecodeError, OSError):
            pages = []
    start_index = len(pages)
    ocr_page_count = sum(1 for item in pages if len(item.get("text", "")) >= 60)
    text_char_count = sum(len(item.get("text", "")) for item in pages)
    failures = []
    for index in range(start_index, len(document)):
        page = document[index]
        text = page.get_text("text").strip()
        if len(text) < 60:
            try:
                text = ocr_lines(engine, page)
            except Exception:
                try:
                    pixmap = page.get_pixmap(matrix=pymupdf.Matrix(0.72, 0.72), alpha=False)
                    image = np.frombuffer(pixmap.samples, dtype=np.uint8).reshape(pixmap.height, pixmap.width, pixmap.n)
                    detected, _ = engine(image)
                    text = "\n".join(item[1].strip() for item in (detected or []) if item[1] and item[2] >= 0.25)
                except Exception:
                    failures.append(index + 1)
                    text = ""
            if text:
                ocr_page_count += 1
        text_char_count += len(text)
        pages.append({"page": index + 1, "text": text, "reviewLines": []})
        if (index + 1) % 10 == 0 or index + 1 == len(document):
            output.write_text(
                json.dumps({"source": "Cambridge IELTS 20 Academic.pdf", "pages": pages, "ocrFailures": failures}, ensure_ascii=False),
                encoding="utf-8",
            )
            print(f"Cambridge 20 OCR progress: {index + 1}/{len(document)} pages", flush=True)
    return len(document), ocr_page_count, text_char_count


def merge_local_tests(records: list[dict], cam20_pdf_asset: str) -> None:
    bundle = json.loads(MANIFEST.read_text(encoding="utf-8")) if MANIFEST.exists() else {"tests": [], "reviewPages": [], "sources": []}
    old_tests = [
        test for test in bundle.get("tests", [])
        if not test.get("id", "").startswith(("cambridge-21-", "cambridge-20-writing-", "cambridge-20-speaking-"))
    ]
    cam20_source_pages = {
        "cambridge-20-listening-1": 1,
        "cambridge-20-reading-1": 7,
        "cambridge-20-reading-2": 30,
        "cambridge-20-reading-3": 50,
        "cambridge-20-reading-4": 68,
    }
    for test in old_tests:
        if test.get("id") in cam20_source_pages:
            test["pdfAsset"] = cam20_pdf_asset
            test["sourceStartPage"] = cam20_source_pages[test["id"]]
    bundle["tests"] = old_tests + records
    bundle["generatedAt"] = __import__("datetime").datetime.now().astimezone().isoformat()
    bundle["distribution"] = "local-only; original test content stays outside Git and deploy bundles"
    source_map = {source.get("name"): source for source in bundle.get("sources", [])}
    c20_written_spoken = build_cam20_written_spoken()
    bundle["tests"].extend(c20_written_spoken)
    source_map["Cambridge IELTS 20"] = {"name": "Cambridge IELTS 20", "origin": "user-provided local PDFs; OCR text and fillable four-skill test sections", "sets": 16}
    source_map["Cambridge IELTS 21"] = {"name": "Cambridge IELTS 21", "origin": "user-provided local PDF and audio ZIP; fillable four-skill test sections", "sets": len(records)}
    bundle["sources"] = list(source_map.values())
    MANIFEST.write_text(json.dumps(bundle, ensure_ascii=False), encoding="utf-8")


def build_cam20_written_spoken() -> list[dict]:
    ocr_path = PRIVATE / "cambridge20-academic.ocr.json"
    if not ocr_path.exists():
        return []
    pages = json.loads(ocr_path.read_text(encoding="utf-8")).get("pages", [])
    by_number = {int(page["page"]): page for page in pages}
    writing_ranges = [(30, 34), (66, 72), (105, 109), (140, 144)]
    speaking_ranges = [(35, 36), (73, 77), (110, 113), (145, 150)]
    records = []
    for number, (start, end) in enumerate(writing_ranges, 1):
        records.append({
            "id": f"cambridge-20-writing-{number}",
            "title": f"Cambridge IELTS 20 · Writing Test {number}",
            "source": "Cambridge IELTS 20",
            "section": "Writing",
            "questionCount": 2,
            "answerMode": "long",
            "responseLabels": ["Task 1", "Task 2"],
            "pages": [
                {"page": page, "text": by_number[page].get("text", ""), "reviewLines": []}
                for page in range(start, end + 1) if page in by_number
            ],
            "supportPages": [],
            "answerKeyVerified": False,
            "sourceStartPage": start,
            "audioFiles": [],
        })
    for number, (start, end) in enumerate(speaking_ranges, 1):
        records.append({
            "id": f"cambridge-20-speaking-{number}",
            "title": f"Cambridge IELTS 20 · Speaking Test {number}",
            "source": "Cambridge IELTS 20",
            "section": "Speaking",
            "questionCount": 3,
            "answerMode": "long",
            "responseLabels": ["Part 1", "Part 2", "Part 3"],
            "pages": [
                {"page": page, "text": by_number[page].get("text", ""), "reviewLines": []}
                for page in range(start, end + 1) if page in by_number
            ],
            "supportPages": [],
            "answerKeyVerified": False,
            "sourceStartPage": start,
            "audioFiles": [],
        })
    return records


def main() -> None:
    PRIVATE.mkdir(parents=True, exist_ok=True)
    audio_names = copy_cam21_assets()
    cam20_pdf_asset = copy_cam20_clear_pdf()
    cam21_records = extract_cam21_tests(audio_names)
    page_count, ocr_page_count, char_count = extract_cam20_scan()
    merge_local_tests(cam21_records, cam20_pdf_asset)

    print(f"Imported Cambridge 21: {len(cam21_records)} fillable tests; each has 40 answer fields and source answer-key page.")
    print(f"Imported Cambridge 21 audio tracks: {len(audio_names)}")
    print(f"Converted Cambridge 20 scan: {page_count} pages; OCR applied to {ocr_page_count}; extracted {char_count} text characters.")


if __name__ == "__main__":
    main()
