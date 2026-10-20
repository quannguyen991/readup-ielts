import urllib.request
import re

books = [10, 11, 12, 13, 14, 15, 16]
results = {}

for b in books:
    for t in [1, 2, 3, 4]:
        url = f'https://ieltstrainingonline.com/practice-cam-{b}-listening-test-{t:02d}/'
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        try:
            with urllib.request.urlopen(req, timeout=8) as resp:
                html = resp.read().decode('utf-8', errors='ignore')
                media = list(set(re.findall(r'https?://[^\s\"\'<>]+\.(?:mp3|m4a)', html)))
                test_media = [m for m in media if re.search(rf'cam-?{b}.*?test-?{t}', m, re.I) or re.search(rf'cam{b}.*?test{t}', m, re.I)]
                if not test_media:
                    # fallback to any mp3/m4a with part or section
                    test_media = [m for m in media if 'part' in m.lower() or 'section' in m.lower()]
                test_media.sort()
                results[f'cambridge-{b}-listening-{t}'] = {
                    'url': url,
                    'media': test_media
                }
                print(f"Cam {b} T{t}: {len(test_media)} files -> {[m.split('/')[-1] for m in test_media]}")
        except Exception as e:
            print(f"Cam {b} T{t}: ERROR {e}")

print("Total mapped:", len(results))
