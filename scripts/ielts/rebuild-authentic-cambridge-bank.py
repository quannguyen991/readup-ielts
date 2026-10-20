import json
from pathlib import Path
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

ROOT = Path(__file__).resolve().parents[2]
PRIVATE = ROOT / ".local-private" / "ielts-ocr"

tests_file = PRIVATE / "source-tests.json"
tests_data = json.loads(tests_file.read_text(encoding='utf-8'))
crawled_file = PRIVATE / "cambridge-10-16-crawled.json"
crawled_data = json.loads(crawled_file.read_text(encoding='utf-8'))

def clean_watermark(text):
    # Strip Chinese exam assistance watermarks from scanned PDFs
    text = re.sub(r'[\u4e00-\u9fff\uff00-\uffef]+[^\n]*', '', text)
    text = re.sub(r'微信\s*\d+', '', text)
    text = re.sub(r'话\s*\d+', '', text)
    text = re.sub(r'1718867188', '', text)
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    return '\n'.join(lines)

# Rebuild Cam 10-16
for test in tests_data['tests']:
    tid = test.get('id', '')
    if tid in crawled_data:
        cdata = crawled_data[tid]
        b = cdata['book']
        t = cdata['test']
        
        audio_files = []
        for p in [1, 2, 3, 4]:
            ext = '.m4a' if b == 15 else '.mp3'
            fname = f'cambridge{b}-listening-test{t}-part{p}{ext}'
            if (PRIVATE / fname).exists():
                audio_files.append(fname)
        
        test['audioFiles'] = audio_files
        test['missingComponents'] = [m for m in test.get('missingComponents', []) if m != 'audio']
        
        pages = []
        for p in [1, 2, 3, 4]:
            p_text = cdata['parts'].get(f'part_{p}', '')
            clean_lines = []
            for l in p_text.split('\n'):
                l = l.strip()
                if not l:
                    continue
                if any(x in l.lower() for x in ['speaking', 'writing practice', 'advertisement', 'facebook', 'twitter', 'mock test']):
                    continue
                clean_lines.append(l)
            
            q_start = (p - 1) * 10 + 1
            q_end = p * 10
            page_content = f"{test['title']} — Part {p}\n\nPART {p}\nQuestions {q_start}–{q_end}\n\n" + '\n'.join(clean_lines)
            pages.append({"page": p, "text": page_content, "reviewLines": []})
            
        test['pages'] = pages
        test['parts'] = [
            {"id": 1, "label": "Part 1", "questionStart": 1, "questionEnd": 10, "pages": [pages[0]]},
            {"id": 2, "label": "Part 2", "questionStart": 11, "questionEnd": 20, "pages": [pages[1]]},
            {"id": 3, "label": "Part 3", "questionStart": 21, "questionEnd": 30, "pages": [pages[2]]},
            {"id": 4, "label": "Part 4", "questionStart": 31, "questionEnd": 40, "pages": [pages[3]]}
        ]
        test['externalOnly'] = False
        test['contentVerified'] = True
        print(f"Updated Cam {b} T{t} (audio: {len(audio_files)} files)")

# Rebuild Cam 20 Test 3 and Test 4 audio
for test in tests_data['tests']:
    tid = test.get('id', '')
    if tid == 'cambridge-20-listening-3':
        test['audioFiles'] = [f'cambridge20-listening-test3-part{p}.mp3' for p in [1, 2, 3, 4]]
        test['missingComponents'] = [m for m in test.get('missingComponents', []) if m != 'audio']
        print("Updated Cam 20 Listening 3 audio")
    elif tid == 'cambridge-20-listening-4':
        test['audioFiles'] = [f'cambridge20-listening-test4-part{p}.mp3' for p in [1, 2, 3, 4]]
        test['missingComponents'] = [m for m in test.get('missingComponents', []) if m != 'audio']
        print("Updated Cam 20 Listening 4 audio")

# Save updated source-tests.json
tests_file.write_text(json.dumps(tests_data, ensure_ascii=False, indent=2), encoding='utf-8')
print("Successfully saved updated source-tests.json")
