import json
from pathlib import Path
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

ROOT = Path(__file__).resolve().parents[2]
PRIVATE = ROOT / ".local-private" / "ielts-ocr"

tests_file = PRIVATE / "source-tests.json"
tests_data = json.loads(tests_file.read_text(encoding='utf-8'))

def clean_ocr(text):
    text = re.sub(r'[\u4e00-\u9fff\uff00-\uffef]+[^\n]*', '', text)
    text = re.sub(r'微信\s*\d+', '', text)
    text = re.sub(r'话\s*\d+', '', text)
    text = re.sub(r'1718867188', '', text)
    text = text.replace('&nbsp;', ' ')
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    return '\n'.join(lines)

# Page ranges for Reading Passages in Cambridge 17, 18, 19
# Cam 17:
# Test 1 Reading: Pages 9 to 23
# Test 2 Reading: Pages 31 to 45
# Test 3 Reading: Pages 53 to 67
# Test 4 Reading: Pages 75 to 89
cam17_ranges = {
    1: [(9, 13, 1, 13, "Passage 1"), (14, 18, 14, 26, "Passage 2"), (19, 23, 27, 40, "Passage 3")],
    2: [(31, 35, 1, 13, "Passage 1"), (36, 40, 14, 26, "Passage 2"), (41, 45, 27, 40, "Passage 3")],
    3: [(53, 57, 1, 13, "Passage 1"), (58, 62, 14, 26, "Passage 2"), (63, 67, 27, 40, "Passage 3")],
    4: [(75, 79, 1, 13, "Passage 1"), (80, 84, 14, 26, "Passage 2"), (85, 89, 27, 40, "Passage 3")],
}

# Cam 18:
# Test 1 Reading: Pages 19 to 33
# Test 2 Reading: Pages 41 to 56
# Test 3 Reading: Pages 64 to 79
# Test 4 Reading: Pages 87 to 101
cam18_ranges = {
    1: [(19, 23, 1, 13, "Passage 1"), (24, 28, 14, 26, "Passage 2"), (29, 33, 27, 40, "Passage 3")],
    2: [(41, 45, 1, 13, "Passage 1"), (46, 50, 14, 26, "Passage 2"), (51, 56, 27, 40, "Passage 3")],
    3: [(64, 68, 1, 13, "Passage 1"), (69, 73, 14, 26, "Passage 2"), (74, 79, 27, 40, "Passage 3")],
    4: [(87, 91, 1, 13, "Passage 1"), (92, 96, 14, 26, "Passage 2"), (97, 101, 27, 40, "Passage 3")],
}

# Cam 19:
# Test 1 Reading: Pages 16 to 31
# Test 2 Reading: Pages 39 to 53
# Test 3 Reading: Pages 61 to 76
# Test 4 Reading: Pages 84 to 98
cam19_ranges = {
    1: [(16, 20, 1, 13, "Passage 1"), (21, 25, 14, 26, "Passage 2"), (26, 31, 27, 40, "Passage 3")],
    2: [(39, 43, 1, 13, "Passage 1"), (44, 48, 14, 26, "Passage 2"), (49, 53, 27, 40, "Passage 3")],
    3: [(61, 65, 1, 13, "Passage 1"), (66, 70, 14, 26, "Passage 2"), (71, 76, 27, 40, "Passage 3")],
    4: [(84, 88, 1, 13, "Passage 1"), (89, 93, 14, 26, "Passage 2"), (94, 98, 27, 40, "Passage 3")],
}

all_cam_ranges = {17: cam17_ranges, 18: cam18_ranges, 19: cam19_ranges}

for vol, t_ranges in all_cam_ranges.items():
    book_file = PRIVATE / f"cambridge{vol}-book.ocr.json"
    if not book_file.exists():
        continue
    book = json.loads(book_file.read_text(encoding='utf-8'))
    pages_map = {p['page']: p['text'] for p in book['pages']}
    
    for tnum, p_specs in t_ranges.items():
        tid = f"cambridge-{vol}-reading-{tnum}"
        test = next((t for t in tests_data['tests'] if t.get('id') == tid), None)
        if not test:
            continue
        
        parts = []
        all_pages = []
        for spec_idx, (p_start, p_end, q_start, q_end, label) in enumerate(p_specs):
            part_pages = []
            for pnum in range(p_start, p_end + 1):
                if pnum in pages_map:
                    txt = clean_ocr(pages_map[pnum])
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

tests_file.write_text(json.dumps(tests_data, ensure_ascii=False, indent=2), encoding='utf-8')
print("Saved clean Cambridge 17, 18, 19 Reading tests!")
