import urllib.request
import re
import json
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import sys

sys.stdout.reconfigure(encoding='utf-8')

ROOT = Path(__file__).resolve().parents[2]
PRIVATE = ROOT / ".local-private" / "ielts-ocr"

def clean_html(chunk):
    # decode entities
    sub = chunk.replace('&nbsp;', ' ').replace('&#8211;', '–').replace('&#8212;', '—').replace('&amp;', '&')
    sub = sub.replace('&#8217;', "'").replace('&#8216;', "'").replace('&#8220;', '"').replace('&#8221;', '"')
    sub = re.sub(r'<input[^>]*>', ' [ ________ ] ', sub)
    sub = re.sub(r'<br\s*/?>', '\n', sub, flags=re.I)
    sub = re.sub(r'</p>', '\n\n', sub, flags=re.I)
    sub = re.sub(r'<(script|style)[^>]*>.*?</\1>', '', sub, flags=re.DOTALL)
    sub = re.sub(r'<[^>]+>', ' ', sub)
    
    lines = []
    for line in sub.split('\n'):
        line = re.sub(r'[ \t]+', ' ', line).strip()
        if not line:
            continue
        if any(bad in line.lower() for bad in ['advertisement', 'facebook', 'twitter', 'share this', 'leave a reply', 'practice more']):
            continue
        lines.append(line)
    return '\n'.join(lines)

def process_reading_test(b, t):
    url = f'https://ieltstrainingonline.com/practice-cam-{b}-reading-test-{t:02d}/'
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        html = urllib.request.urlopen(req, timeout=15).read().decode('utf-8', errors='ignore')
    except Exception as e:
        print(f"Error {b}-{t}: {e}")
        return None

    passages = []
    # Find markers for READING PASSAGE 1, 2, 3
    p1_m = re.search(r'READING\s*PASSAGE\s*1\b', html, re.I)
    p2_m = re.search(r'READING\s*PASSAGE\s*2\b', html, re.I)
    p3_m = re.search(r'READING\s*PASSAGE\s*3\b', html, re.I)
    
    if p1_m and p2_m and p3_m:
        p1_html = html[p1_m.start():p2_m.start()]
        p2_html = html[p2_m.start():p3_m.start()]
        # p3 ends before comments or footer
        end_m = re.search(r'(?:<footer|Leave a Reply|Related Tests|Practice More)', html[p3_m.start():], re.I)
        p3_end = p3_m.start() + end_m.start() if end_m else p3_m.start() + 15000
        p3_html = html[p3_m.start():p3_end]
        
        passages.append(clean_html(p1_html))
        passages.append(clean_html(p2_html))
        passages.append(clean_html(p3_html))
    else:
        print(f"Cam {b} T{t}: could not find passage markers (p1:{bool(p1_m)}, p2:{bool(p2_m)}, p3:{bool(p3_m)})")
        return None

    return {
        'id': f'cambridge-{b}-reading-{t}',
        'book': b,
        'test': t,
        'passages': passages
    }

print("Crawling authentic Cambridge 10-16 Reading tests...")
tasks = []
with ThreadPoolExecutor(max_workers=8) as executor:
    for b in [10, 11, 12, 13, 14, 15, 16]:
        for t in [1, 2, 3, 4]:
            tasks.append(executor.submit(process_reading_test, b, t))

reading_data = {}
for task in tasks:
    res = task.result()
    if res:
        reading_data[res['id']] = res
        print(f"Loaded {res['id']}: 3 passages, lengths: {[len(p) for p in res['passages']]}")

out_path = PRIVATE / "cambridge-10-16-reading-crawled.json"
out_path.write_text(json.dumps(reading_data, ensure_ascii=False, indent=2), encoding='utf-8')
print(f"Saved {len(reading_data)} tests to {out_path}!")
