import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]
PRIVATE = ROOT / ".local-private" / "ielts-ocr"

book = json.loads((PRIVATE / "cambridge20-academic.ocr.json").read_text(encoding='utf-8'))
print(f"Total pages in Cam 20: {len(book['pages'])}")

# Find all reading passages
for p in book['pages']:
    txt = p['text']
    compact = re.sub(r'\s+', '', txt).lower()
    if 'readingpassage' in compact:
        tmatch = re.search(r'test\s*(\d)', txt, re.I)
        tnum = tmatch.group(1) if tmatch else '?'
        pmatch = re.search(r'reading\s*passage\s*(\d)', txt, re.I)
        pnum = pmatch.group(1) if pmatch else '?'
        print(f"Page {p['page']} -> Test {tnum} Passage {pnum}: {txt[:100].replace(chr(10), ' ')}")
