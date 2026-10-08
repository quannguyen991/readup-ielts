"""Compile locally extracted Cambridge 17–20 files into the private practice store.

Source PDFs, audio and OCR stay under .local-private/ielts-ocr and are excluded
from Git and deploy bundles. Run after extract_pdfs.mjs and OCR have completed.
"""
from pathlib import Path
import json
import re
from zipfile import ZipFile
from xml.etree import ElementTree as ET
import openpyxl

ROOT = Path(__file__).resolve().parents[2]
PRIVATE = ROOT / ".local-private" / "ielts-ocr"
OUT = PRIVATE / "source-tests.json"
NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}


def read_answer_key(file_name):
    with ZipFile(PRIVATE / file_name) as archive:
        document = ET.fromstring(archive.read("word/document.xml"))
    paragraphs = [
        "".join(node.text or "" for node in p.findall(".//w:t", NS)).strip()
        for p in document.findall(".//w:p", NS)
    ]
    keys = {}
    current_test = None
    for paragraph in paragraphs:
        heading = re.fullmatch(r"test\s*(\d+)", paragraph, re.I)
        if heading:
            current_test = int(heading.group(1))
            keys[current_test] = {}
            continue
        if current_test is None:
            continue
        match = re.match(r"^\s*(\d{1,2})(?:\s*[-–]\s*(\d{1,2}))?[.)]\s*(.+?)\s*$", paragraph)
        if not match:
            continue
        number = int(match.group(1))
        end_number = int(match.group(2) or match.group(1))
        if not 1 <= number <= end_number <= 40:
            continue
        answer = match.group(3).strip()
        answers = [answer]
        if end_number > number:
            endpoints = re.fullmatch(r"([A-H])\s*[-–]\s*([A-H])", answer, re.I)
            if end_number - number == 1 and endpoints:
                answers = [endpoints.group(1), endpoints.group(2)]
            else:
                answers = [part.strip() for part in re.split(r"\s*[;,/]\s*", answer) if part.strip()]
        for offset, item in enumerate(answers[:end_number - number + 1]):
            variants = [item]
            for left, right in re.findall(r"([^()]+)\(([^()]+)\)", item):
                if left.strip():
                    variants.append(left.strip())
                if right.strip():
                    variants.append(right.strip())
            if " / " in item:
                variants.extend(part.strip() for part in item.split(" / ") if part.strip())
            if re.search(r"\s+or\s+", item, re.I):
                variants.extend(part.strip() for part in re.split(r"\s+or\s+", item, flags=re.I) if part.strip())
            keys[current_test][str(number + offset)] = list(dict.fromkeys(variants))
    return keys


def load_pages(file_name):
    data = json.loads((PRIVATE / file_name).read_text(encoding="utf-8"))
    return [{"page": p["page"], "text": p.get("text", ""), "reviewLines": []} for p in data["pages"]]


def build_scanned_tests():
    records = []
    book_ids = {
        17: "16P99zqJdQQ7QR2zs2mxBZ1XzYE1KIvmi",
        18: "1SutoVNDy2yiA53tUBnWlKZ0XFwrhrZig",
        19: "1EZIL-iFddsLXSmGfSoSuJ3EIurfSwa58",
    }
    for volume, drive_id in book_ids.items():
        source_file = PRIVATE / f"cambridge{volume}-book.ocr.json"
        if not source_file.exists():
            continue
        all_pages = json.loads(source_file.read_text(encoding="utf-8"))["pages"]
        pages_by_number = {int(page["page"]): page for page in all_pages}
        compact = {number: re.sub(r"\s+", "", page.get("text", "")).lower() for number, page in pages_by_number.items()}
        answer_section_pages = [number for number, text in compact.items() if "answerkeywithextraexplanations" in text]
        content_end = min(answer_section_pages) if answer_section_pages else max(pages_by_number)
        listening_starts = [
            number for number, text in compact.items()
            if number < content_end and "listening" in text and re.search(r"questions1[-–]?10", text)
        ]
        reading_starts = [
            number for number, text in compact.items()
            if number < content_end and "readingpassage1" in text and re.search(r"questions1[-–]?13", text)
        ]
        key_pages_by_section = {
            "Listening": [
                number for number, text in compact.items()
                if number > 80 and "answerkeywithextraexplanations" in text and "part1" in text
            ],
            "Reading": [
                number for number, text in compact.items()
                if number > 80 and "answerkeywithextraexplanations" in text and "readingpassage1" in text
            ],
        }
        markers = sorted([(page, "Listening") for page in listening_starts] + [(page, "Reading") for page in reading_starts])
        for section_index, (start, section) in enumerate(markers):
            following = markers[section_index + 1][0] if section_index + 1 < len(markers) else content_end
            following = min(following, content_end)
            candidates = []
            for number in range(start, following):
                text = compact.get(number, "")
                if section == "Listening" and re.search(r"questions(?:31[-–]40|36[-–]40)", text):
                    candidates.append(number)
                if section == "Reading" and re.search(r"questions(?:2[7-9]|3[0-9])[-–]?40", text):
                    candidates.append(number)
            if not candidates:
                continue
            end = max(candidates)
            if section == "Listening":
                test_match = re.search(r"test([1-4])", compact.get(start, ""))
                test_number = int(test_match.group(1)) if test_match else sum(1 for page, kind in markers[:section_index + 1] if kind == section)
            else:
                test_number = sum(1 for page, kind in markers[:section_index + 1] if kind == section)
            if not 1 <= test_number <= 4 or end < start:
                continue
            asset = f"cambridge{volume}-book.pdf"
            audio = [f"cambridge{volume}-listening-test{test_number}.mp3"] if section == "Listening" else []
            section_keys = key_pages_by_section[section]
            selected_key = section_keys[test_number - 1] if len(section_keys) >= test_number else None
            key_pages = ([{"page": selected_key, "text": pages_by_number[selected_key].get("text", ""), "reviewLines": []}] if selected_key else [])
            records.append({
                "id": f"cambridge-{volume}-{section.lower()}-{test_number}",
                "title": f"Cambridge IELTS {volume} · {section} Test {test_number}",
                "source": f"Cambridge IELTS {volume}",
                "section": section,
                "questionCount": 40,
                "pages": [
                    {"page": pages_by_number[number]["page"], "text": pages_by_number[number].get("text", ""), "reviewLines": []}
                    for number in range(start, end + 1) if number in pages_by_number
                ],
                "supportPages": key_pages,
                "answerKeyVerified": False,
                "pdfAsset": asset,
                "sourceStartPage": start,
                "sourceUrl": f"https://drive.google.com/file/d/{drive_id}/view",
                "audioFiles": audio,
            })
    return records


def test_record(test_id, title, section, page_file, pdf_asset, drive_id, answer_key=None, audio_files=None, verified=False):
    return {
        "id": test_id,
        "title": title,
        "source": "Cambridge IELTS 20",
        "section": section,
        "questionCount": 40,
        "pages": load_pages(page_file),
        "supportPages": [],
        "answerKey": answer_key,
        "answerKeyVerified": verified,
        "pdfAsset": pdf_asset,
        "sourceStartPage": 1,
        "sourceUrl": f"https://drive.google.com/file/d/{drive_id}/view",
        "audioFiles": audio_files or [],
    }


def build_external_link_tests():
    workbook_path = PRIVATE / "cambridge-reference.xlsx"
    if not workbook_path.exists():
        return []
    sheet = openpyxl.load_workbook(workbook_path, data_only=False).active
    tests = []
    pattern = re.compile(r"Cambridge IELTS\s*(\d+).*?Test\s*(\d+).*?(Listening|Reading)", re.I)
    for row in range(2, sheet.max_row + 1):
        title = str(sheet.cell(row, 2).value or "")
        match = pattern.search(title)
        if not match:
            continue
        volume, test_number = int(match.group(1)), int(match.group(2))
        if volume not in {*range(10, 17), 21} or not 1 <= test_number <= 4:
            continue
        section = match.group(3).title()
        cell = sheet.cell(row, 3)
        url = cell.hyperlink.target if cell.hyperlink else str(cell.value or "")
        if url.startswith("="):
            found = re.search(r"https?://[^\"']+", url)
            url = found.group(0) if found else ""
        if not url.startswith("https://"):
            continue
        tests.append({
            "id": f"cambridge-{volume}-{section.lower()}-{test_number}",
            "title": f"Cambridge IELTS {volume} · {section} Test {test_number}",
            "source": f"Cambridge IELTS {volume}",
            "section": section,
            "questionCount": 40,
            "pages": [],
            "supportPages": [],
            "answerKeyVerified": False,
            "sourceUrl": url,
            "audioFiles": [],
            "externalOnly": True,
        })
    return tests


reading_keys = read_answer_key("cambridge20-key-reading.docx")
listening_keys = read_answer_key("cambridge20-key-listening.docx")
tests = []
for number in range(1, 5):
    reading_key = reading_keys.get(number, {})
    reading_id = ["1xEI1yZ-nH8B6jFgxFs43igGFxlnTBd_i", "1B7-djPBMG37KQ5Tq4UakdBSiPg_s8fe9", "1gJFeHkNcPZFnu5cq1yGmM8qr10TBhfzu", "1QisHR_DpemVEqbXGA8fesU5OFgVAk0si"][number - 1]
    tests.append(test_record(
        f"cambridge-20-reading-{number}", f"Cambridge IELTS 20 · Reading Test {number}", "Reading",
        f"cambridge20-reading-test{number}.pages.json", f"cambridge20-reading-test{number}.pdf", reading_id,
        reading_key or None, verified=set(reading_key) == {str(n) for n in range(1, 41)},
    ))

    listening_key = listening_keys.get(number, {})
    listening_id = ["1k0rpqt1lwiUILhxLORlgpcmsdlqu8BSO", "1nvsmpswO-iM79B07qWZmqtPWsdI0Xxcm", "1fqtE8LEFI-HB2LxOLakc2Q4wOYuuiUSr", "1ZjRVNKTPnVfhTQzOtNRSpL8QLJR2ASZd"][number - 1]
    audio_files = [f"cambridge20-listening-test{number}-part{part}.mp3" for part in range(1, 5)] if number <= 2 else []
    tests.append(test_record(
        f"cambridge-20-listening-{number}", f"Cambridge IELTS 20 · Listening Test {number}", "Listening",
        f"cambridge20-listening-test{number}.pages.json", f"cambridge20-listening-test{number}.pdf", listening_id,
        listening_key or None, audio_files,
        verified=set(listening_key) == {str(n) for n in range(1, 41)},
    ))

scanned_tests = build_scanned_tests()
tests.extend(scanned_tests)
external_link_tests = build_external_link_tests()
tests.extend(external_link_tests)

bundle = json.loads(OUT.read_text(encoding="utf-8")) if OUT.exists() else {"tests": [], "reviewPages": [], "sources": []}
keep = [test for test in bundle.get("tests", []) if not test.get("externalOnly") and not re.match(r"^cambridge-(17|18|19|20)-", test.get("id", ""))]
bundle["generatedAt"] = __import__("datetime").datetime.now().astimezone().isoformat()
bundle["distribution"] = "local-only; original test content stays outside Git and deploy bundles"
bundle["tests"] = keep + tests
for volume in range(10, 22):
    count = sum(1 for test in tests if test["source"] == f"Cambridge IELTS {volume}")
    if count:
        origin = "external practice links from user-provided spreadsheet" if volume not in (17, 18, 19, 20) else "user-shared Google Drive"
        bundle.setdefault("sources", []).append({"name": f"Cambridge IELTS {volume}", "origin": origin, "sets": count})
bundle["sources"] = list({source.get("name"): source for source in bundle["sources"]}.values())
OUT.write_text(json.dumps(bundle, ensure_ascii=False), encoding="utf-8")
for test in tests:
    key_count = len(test.get("answerKey") or {})
    suffix = ", answer-key support only" if not key_count and test.get("supportPages") else ""
    suffix = ", no structured key yet" if not key_count and not test.get("supportPages") else suffix
    external = ", external source link only" if test.get("externalOnly") else ""
    print(f"{test['title']}: {len(test['pages'])} pages, {key_count}/40 answers{suffix}, {len(test['audioFiles'])} audio files{external}")
