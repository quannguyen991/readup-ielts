import urllib.request
import re

urls = [
    'https://ieltstrainingonline.com/practice-cam-16-reading-test-01/',
    'https://ieltstrainingonline.com/cambridge-ielts-16-reading-test-1-with-answers/',
    'https://ieltstrainingonline.com/practice-cam-16-reading-test-1/'
]

for url in urls:
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        html = urllib.request.urlopen(req, timeout=8).read().decode('utf-8', errors='ignore')
        print(f"Found {url} (len {len(html)})")
        m = re.search(r'Questions\s*1[-–]7', html, re.I)
        if m:
            print("Found Questions 1-7!")
            clean = re.sub(r'<[^>]+>', '\n', html[m.start():m.start()+1500])
            lines = [l.strip() for l in clean.split('\n') if l.strip()]
            print('\n'.join(lines[:20]))
        break
    except Exception as e:
        print(f"Error {url}: {e}")
