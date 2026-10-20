import urllib.request
from pathlib import Path
import json
import re
from concurrent.futures import ThreadPoolExecutor

ROOT = Path(__file__).resolve().parents[2]
PRIVATE = ROOT / ".local-private" / "ielts-ocr"

data = json.loads((PRIVATE / "cambridge-10-16-crawled.json").read_text(encoding='utf-8'))

download_tasks = []

for tid, tinfo in data.items():
    b = tinfo['book']
    t = tinfo['test']
    media = tinfo['media']
    # Sort media by part or section if possible
    sorted_media = sorted(media, key=lambda m: (
        1 if ('part1' in m.lower() or 'section1' in m.lower()) else
        2 if ('part2' in m.lower() or 'section2' in m.lower()) else
        3 if ('part3' in m.lower() or 'section3' in m.lower()) else
        4 if ('part4' in m.lower() or 'section4' in m.lower()) else 5
    ))
    
    for idx, url in enumerate(sorted_media[:4]):
        ext = '.m4a' if url.endswith('.m4a') else '.mp3'
        fname = f'cambridge{b}-listening-test{t}-part{idx+1}{ext}'
        dest = PRIVATE / fname
        download_tasks.append((url, dest, fname, tid, idx))

print(f"Total files to ensure: {len(download_tasks)}")

def download_one(item):
    url, dest, fname, tid, idx = item
    if dest.exists() and dest.stat().st_size > 20000:
        return fname, True, "exists"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = resp.read()
            dest.write_bytes(data)
            return fname, True, f"downloaded {len(data)} bytes"
    except Exception as e:
        return fname, False, str(e)

success_count = 0
fail_count = 0

with ThreadPoolExecutor(max_workers=8) as executor:
    for fname, ok, msg in executor.map(download_one, download_tasks):
        if ok:
            success_count += 1
            if msg != "exists":
                print(f"[OK] {fname}: {msg}")
        else:
            fail_count += 1
            print(f"[FAIL] {fname}: {msg}")

print(f"\nDone! Successful: {success_count}, Failed: {fail_count}")
