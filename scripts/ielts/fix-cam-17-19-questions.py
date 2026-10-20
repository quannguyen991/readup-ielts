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
    text = re.sub(r'Listening test audio', '', text, flags=re.I)
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    return '\n'.join(lines)

ranges_by_vol = {
    17: {
        1: (3, 8),
        2: (24, 30),
        3: (46, 52),
        4: (68, 74),
    },
    18: {
        1: (12, 18),
        2: (34, 40),
        3: (57, 63),
        4: (80, 86),
    },
    19: {
        1: (9, 15),
        2: (32, 38),
        3: (54, 60),
        4: (77, 83),
    }
}

for vol, t_ranges in ranges_by_vol.items():
    book_file = PRIVATE / f"cambridge{vol}-book.ocr.json"
    if not book_file.exists():
        continue
    book = json.loads(book_file.read_text(encoding='utf-8'))
    pages_by_num = {p['page']: p['text'] for p in book['pages']}
    
    for tnum, (p_start, p_end) in t_ranges.items():
        tid = f"cambridge-{vol}-listening-{tnum}"
        test = next((t for t in tests_data['tests'] if t.get('id') == tid), None)
        if not test:
            continue
        
        # Collect question pages
        test_pages = []
        for pnum in range(p_start, p_end + 1):
            if pnum in pages_by_num:
                raw_txt = pages_by_num[pnum]
                cleaned = clean_ocr(raw_txt)
                test_pages.append({
                    "page": len(test_pages) + 1,
                    "text": cleaned,
                    "reviewLines": []
                })
        
        if len(test_pages) >= 4:
            # Map into 4 parts
            # Distribute pages across parts 1, 2, 3, 4
            part1_pages = [test_pages[0]]
            part2_pages = [test_pages[1]] if len(test_pages) > 1 else []
            part3_pages = [test_pages[2]] if len(test_pages) > 2 else []
            part4_pages = test_pages[3:] if len(test_pages) > 3 else []
            
            test['pages'] = test_pages
            test['parts'] = [
                {"id": 1, "label": "Part 1", "questionStart": 1, "questionEnd": 10, "pages": part1_pages},
                {"id": 2, "label": "Part 2", "questionStart": 11, "questionEnd": 20, "pages": part2_pages},
                {"id": 3, "label": "Part 3", "questionStart": 21, "questionEnd": 30, "pages": part3_pages},
                {"id": 4, "label": "Part 4", "questionStart": 31, "questionEnd": 40, "pages": part4_pages}
            ]
            test['missingComponents'] = [m for m in test.get('missingComponents', []) if m != 'audio']
            print(f"Fixed authentic questions for {tid} ({len(test_pages)} pages)")

tests_file.write_text(json.dumps(tests_data, ensure_ascii=False, indent=2), encoding='utf-8')
print("Saved updated Cam 17-19 questions!")
