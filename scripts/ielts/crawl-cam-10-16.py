import urllib.request
import re
import os
import json
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor

ROOT = Path(__file__).resolve().parents[2]
PRIVATE = ROOT / ".local-private" / "ielts-ocr"

def fetch_test_info(b, t):
    url = f'https://ieltstrainingonline.com/practice-cam-{b}-listening-test-{t:02d}/'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            
            # Find audio links
            media = list(set(re.findall(r'https?://[^\s\"\'<>]+\.(?:mp3|m4a)', html)))
            test_media = [m for m in media if re.search(rf'cam-?{b}.*?test-?{t}', m, re.I) or re.search(rf'cam{b}.*?test{t}', m, re.I)]
            if not test_media:
                test_media = [m for m in media if 'part' in m.lower() or 'section' in m.lower()]
            test_media.sort()
            
            # Extract questions by Part
            clean_html = re.sub(r'<(script|style)[^>]*>.*?</\1>', '', html, flags=re.DOTALL)
            parts_text = {}
            for part in [1, 2, 3, 4]:
                part_match = re.search(rf'((?:PART|SECTION)\s*{part}\b.*?)(?=(?:PART|SECTION)\s*{part+1}\b|Audioscript|Practice More|<h2|$)', clean_html, re.DOTALL | re.I)
                if part_match:
                    text = re.sub(r'<[^>]+>', '\n', part_match.group(1))
                    lines = [line.strip() for line in text.split('\n') if line.strip()]
                    parts_text[f'part_{part}'] = '\n'.join(lines)
            
            return {
                'book': b,
                'test': t,
                'id': f'cambridge-{b}-listening-{t}',
                'url': url,
                'media': test_media,
                'parts': parts_text
            }
    except Exception as e:
        print(f"Error fetching Cam {b} T{t}: {e}")
        return None

print("Starting fetch of Cam 10-16...")
tasks = []
with ThreadPoolExecutor(max_workers=6) as executor:
    for b in [10, 11, 12, 13, 14, 15, 16]:
        for t in [1, 2, 3, 4]:
            tasks.append(executor.submit(fetch_test_info, b, t))

all_data = {}
for task in tasks:
    res = task.result()
    if res:
        all_data[res['id']] = res
        print(f"Loaded {res['id']}: {len(res['media'])} media, {len(res['parts'])} parts")

out_file = PRIVATE / "cambridge-10-16-crawled.json"
out_file.write_text(json.dumps(all_data, ensure_ascii=False, indent=2), encoding='utf-8')
print(f"Saved {len(all_data)} tests to {out_file}")
