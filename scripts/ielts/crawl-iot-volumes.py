import urllib.request
import re
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[2]
PRIVATE = ROOT / ".local-private" / "ielts-ocr"

volumes = [7, 8, 9, 11, 12]
results = {}

for v in volumes:
    for t in [1, 2, 3, 4]:
        urls_to_try = [
            f'https://ieltsonlinetests.com/ielts-practice-test-volume-{v}-listening-practice-test-{t}',
            f'https://ieltsonlinetests.com/ielts-recent-actual-test-answers-vol-{v}-listening-practice-test-{t}',
            f'https://ieltsonlinetests.com/ielts-recent-actual-test-answers-volume-{v}-listening-practice-test-{t}'
        ]
        found_audio = None
        for url in urls_to_try:
            try:
                req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
                html = urllib.request.urlopen(req, timeout=8).read().decode('utf-8', errors='ignore')
                media = [m for m in set(re.findall(r'https?://[^\s\"\'<>]+\.mp3', html)) if 'media.intergreat.com' in m or 'audio' in m.lower()]
                if media:
                    found_audio = media[0]
                    break
            except Exception:
                pass
        
        tid = f'vol-{v}-listening-{t}'
        if found_audio:
            print(f"[FOUND] {tid}: {found_audio}")
            results[tid] = found_audio
        else:
            print(f"[MISSING] {tid}")

out_path = PRIVATE / "iot-volumes-audio.json"
out_path.write_text(json.dumps(results, indent=2), encoding='utf-8')
print(f"Saved {len(results)} audio links to {out_path}")
