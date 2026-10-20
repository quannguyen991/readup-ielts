import json
from pathlib import Path
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

ROOT = Path(__file__).resolve().parents[2]
PRIVATE = ROOT / ".local-private" / "ielts-ocr"

tests_file = PRIVATE / "source-tests.json"
tests_data = json.loads(tests_file.read_text(encoding='utf-8'))

book = json.loads((PRIVATE / "cambridge20-academic.ocr.json").read_text(encoding='utf-8'))
pages_map = {p['page']: p['text'] for p in book['pages']}

def clean_text(t):
    # Strip watermarks and OCR artifacts
    t = re.sub(r'[\u4e00-\u9fff\uff00-\uffef]+[^\n]*', '', t)
    t = re.sub(r'微信\s*\d+', '', t)
    t = re.sub(r'话\s*\d+', '', t)
    t = re.sub(r'1718867188', '', t)
    t = re.sub(r'Listening test audio', '', t, flags=re.I)
    t = t.replace('&nbsp;', ' ')
    lines = [l.strip() for l in t.split('\n') if l.strip()]
    return '\n'.join(lines)

# Cam 20 Reading Page Ranges
reading_ranges = {
    1: [
        (13, 17, 1, 13, "Passage 1"),
        (18, 22, 14, 26, "Passage 2"),
        (23, 28, 27, 40, "Passage 3"),
    ],
    2: [
        (49, 53, 1, 13, "Passage 1"),
        (54, 58, 14, 26, "Passage 2"),
        (59, 64, 27, 40, "Passage 3"),
    ],
    3: [
        (85, 89, 1, 13, "Passage 1"),
        (90, 95, 14, 26, "Passage 2"),
        (96, 101, 27, 40, "Passage 3"),
    ],
    4: [
        (123, 127, 1, 13, "Passage 1"),
        (128, 132, 14, 26, "Passage 2"),
        (133, 138, 27, 40, "Passage 3"),
    ]
}

# Cam 20 Listening Page Ranges
listening_ranges = {
    1: [(5, 6, 1, 10, "Part 1"), (7, 8, 11, 20, "Part 2"), (9, 10, 21, 30, "Part 3"), (11, 12, 31, 40, "Part 4")],
    2: [(41, 42, 1, 10, "Part 1"), (43, 44, 11, 20, "Part 2"), (45, 46, 21, 30, "Part 3"), (47, 48, 31, 40, "Part 4")],
    3: [(77, 78, 1, 10, "Part 1"), (79, 80, 11, 20, "Part 2"), (81, 82, 21, 30, "Part 3"), (83, 84, 31, 40, "Part 4")],
    4: [(116, 117, 1, 10, "Part 1"), (118, 119, 11, 20, "Part 2"), (120, 121, 21, 30, "Part 3"), (122, 123, 31, 40, "Part 4")],
}

for tnum, p_specs in reading_ranges.items():
    tid = f"cambridge-20-reading-{tnum}"
    test = next((t for t in tests_data['tests'] if t.get('id') == tid), None)
    if not test:
        continue
    
    parts = []
    all_pages = []
    for spec_idx, (p_start, p_end, q_start, q_end, label) in enumerate(p_specs):
        part_pages = []
        for pnum in range(p_start, p_end + 1):
            if pnum in pages_map:
                txt = clean_text(pages_map[pnum])
                page_obj = {"page": len(all_pages) + 1, "text": txt, "reviewLines": []}
                part_pages.append(page_obj)
                all_pages.append(page_obj)
        parts.append({
            "id": spec_idx + 1,
            "label": label,
            "questionStart": q_start,
            "questionEnd": q_end,
            "pages": part_pages
        })
    test['pages'] = all_pages
    test['parts'] = parts
    test['contentVerified'] = True
    test['externalOnly'] = False
    print(f"Restored clean Reading: {tid} ({len(all_pages)} pages, 3 passages)")

for tnum, p_specs in listening_ranges.items():
    tid = f"cambridge-20-listening-{tnum}"
    test = next((t for t in tests_data['tests'] if t.get('id') == tid), None)
    if not test:
        continue
    
    parts = []
    all_pages = []
    for spec_idx, (p_start, p_end, q_start, q_end, label) in enumerate(p_specs):
        part_pages = []
        for pnum in range(p_start, p_end + 1):
            if pnum in pages_map:
                txt = clean_text(pages_map[pnum])
                page_obj = {"page": len(all_pages) + 1, "text": txt, "reviewLines": []}
                part_pages.append(page_obj)
                all_pages.append(page_obj)
        parts.append({
            "id": spec_idx + 1,
            "label": label,
            "questionStart": q_start,
            "questionEnd": q_end,
            "pages": part_pages
        })
    test['pages'] = all_pages
    test['parts'] = parts
    test['audioFiles'] = [f"cambridge20-listening-test{tnum}-part{p}.mp3" for p in [1, 2, 3, 4]]
    test['missingComponents'] = [m for m in test.get('missingComponents', []) if m != 'audio']
    test['contentVerified'] = True
    test['externalOnly'] = False
    print(f"Restored clean Listening: {tid} ({len(all_pages)} pages, 4 parts)")

tests_file.write_text(json.dumps(tests_data, ensure_ascii=False, indent=2), encoding='utf-8')
print("Successfully updated Cambridge 20 in source-tests.json!")
