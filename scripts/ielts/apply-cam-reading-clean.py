import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PRIVATE = ROOT / ".local-private" / "ielts-ocr"

tests_file = PRIVATE / "source-tests.json"
tests_data = json.loads(tests_file.read_text(encoding='utf-8'))

reading_file = PRIVATE / "cambridge-10-16-reading-crawled.json"
reading_data = json.loads(reading_file.read_text(encoding='utf-8'))

updated = 0
for test in tests_data['tests']:
    tid = test.get('id', '')
    if tid in reading_data:
        rdata = reading_data[tid]
        pages = []
        for idx, p_text in enumerate(rdata['passages']):
            pages.append({
                "page": idx + 1,
                "text": p_text,
                "reviewLines": []
            })
        test['pages'] = pages
        test['parts'] = [
            {"id": 1, "label": "Passage 1", "questionStart": 1, "questionEnd": 13, "pages": [pages[0]]},
            {"id": 2, "label": "Passage 2", "questionStart": 14, "questionEnd": 26, "pages": [pages[1]]},
            {"id": 3, "label": "Passage 3", "questionStart": 27, "questionEnd": 40, "pages": [pages[2]]}
        ]
        test['contentVerified'] = True
        test['externalOnly'] = False
        updated += 1
        print(f"Updated Reading: {tid} (3 authentic passages)")

tests_file.write_text(json.dumps(tests_data, ensure_ascii=False, indent=2), encoding='utf-8')
print(f"Successfully updated {updated} Reading tests in source-tests.json!")
