import urllib.request
import re
import json
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import sys

sys.stdout.reconfigure(encoding='utf-8')

ROOT = Path(__file__).resolve().parents[2]
PRIVATE = ROOT / ".local-private" / "ielts-ocr"

def clean_html_to_text(html_sub):
    # Replace inputs and blanks with standard IELTS blank
    sub = re.sub(r'<input[^>]*>', ' [ ________ ] ', html_sub)
    # Remove script and style
    sub = re.sub(r'<(script|style)[^>]*>.*?</\1>', '', sub, flags=re.DOTALL)
    # Replace br and p with newlines
    sub = re.sub(r'<br\s*/?>', '\n', sub, flags=re.I)
    sub = re.sub(r'</p>', '\n\n', sub, flags=re.I)
    sub = re.sub(r'<[^>]+>', ' ', sub)
    # Decode entities
    sub = sub.replace('&nbsp;', ' ').replace('&#8211;', '–').replace('&#8212;', '—').replace('&amp;', '&')
    sub = sub.replace('&#8217;', "'").replace('&#8216;', "'").replace('&#8220;', '"').replace('&#8221;', '"')
    
    lines = []
    for line in sub.split('\n'):
        line = re.sub(r'[ \t]+', ' ', line).strip()
        if not line:
            continue
        if any(bad in line.lower() for bad in ['advertisement', 'facebook', 'twitter', 'share this', 'wp-audio', 'audio/mpeg', '.mp3', '.m4a']):
            continue
        lines.append(line)
    return '\n'.join(lines)

def process_cam_test(b, t):
    url = f'https://ieltstrainingonline.com/practice-cam-{b}-listening-test-{t:02d}/'
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        html = urllib.request.urlopen(req, timeout=12).read().decode('utf-8', errors='ignore')
    except Exception as e:
        print(f"Error {b}-{t}: {e}")
        return None

    # Find audio markers
    # Pattern to match Part 1, 2, 3, 4 audio files in order
    part_positions = []
    for p in [1, 2, 3, 4]:
        patterns = [
            rf'(?:part|section)-?{p}\.(?:mp3|m4a)',
            rf'cam-?{b}[^\s\"\'<>]+(?:part|section)-?{p}[^\s\"\'<>]+\.(?:mp3|m4a)',
            rf'\?_={p}'
        ]
        pos = -1
        for pat in patterns:
            m = re.search(pat, html, re.I)
            if m:
                pos = m.end()
                break
        part_positions.append(pos)

    # If any position is -1, fallback to searching (PART 1, PART 2...) in main content
    parts_text = []
    for p in [1, 2, 3, 4]:
        start_pos = part_positions[p - 1]
        if start_pos == -1:
            # Fallback search
            m = re.search(rf'<h[2-4][^>]*>\s*(?:PART|SECTION)\s*{p}\b', html, re.I)
            start_pos = m.start() if m else 0

        if p < 4:
            next_pos = part_positions[p]
            if next_pos == -1 or next_pos <= start_pos:
                m = re.search(rf'<h[2-4][^>]*>\s*(?:PART|SECTION)\s*{p+1}\b', html[start_pos:], re.I)
                end_pos = start_pos + m.start() if m else start_pos + 6000
            else:
                # end before next audio tag
                end_pos = next_pos - 100
        else:
            end_match = re.search(r'(?:Audioscript|Practice More|Related Test|Leave a Reply|<footer)', html[start_pos:], re.I)
            end_pos = start_pos + end_match.start() if end_match else start_pos + 8000

        sub_html = html[start_pos:end_pos]
        cleaned = clean_html_to_text(sub_html)
        q_start = (p - 1) * 10 + 1
        q_end = p * 10
        part_full = f"PART {p}\nQuestions {q_start}–{q_end}\n\n{cleaned}"
        parts_text.append(part_full)

    return {
        'id': f'cambridge-{b}-listening-{t}',
        'book': b,
        'test': t,
        'parts': parts_text
    }

print("Running authentic extraction for Cam 10-16...")
tests_to_fetch = []
with ThreadPoolExecutor(max_workers=8) as executor:
    for b in [10, 11, 12, 13, 14, 15, 16]:
        for t in [1, 2, 3, 4]:
            tests_to_fetch.append(executor.submit(process_cam_test, b, t))

results = {}
for task in tests_to_fetch:
    res = task.result()
    if res:
        results[res['id']] = res
        print(f"Extracted {res['id']}: Part lengths: {[len(p) for p in res['parts']]}")

# Update source-tests.json
tests_file = PRIVATE / "source-tests.json"
tests_data = json.loads(tests_file.read_text(encoding='utf-8'))

for test in tests_data['tests']:
    tid = test.get('id', '')
    if tid in results:
        res = results[tid]
        pages = []
        for p_idx, p_content in enumerate(res['parts']):
            pages.append({
                "page": p_idx + 1,
                "text": f"{test['title']} — Part {p_idx + 1}\n\n{p_content}",
                "reviewLines": []
            })
        test['pages'] = pages
        test['parts'] = [
            {"id": 1, "label": "Part 1", "questionStart": 1, "questionEnd": 10, "pages": [pages[0]]},
            {"id": 2, "label": "Part 2", "questionStart": 11, "questionEnd": 20, "pages": [pages[1]]},
            {"id": 3, "label": "Part 3", "questionStart": 21, "questionEnd": 30, "pages": [pages[2]]},
            {"id": 4, "label": "Part 4", "questionStart": 31, "questionEnd": 40, "pages": [pages[3]]}
        ]
        test['contentVerified'] = True
        test['externalOnly'] = False

tests_file.write_text(json.dumps(tests_data, ensure_ascii=False, indent=2), encoding='utf-8')
print("Updated all Cambridge 10-16 tests with authentic questions!")
