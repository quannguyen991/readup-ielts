import sys
sys.stdout.reconfigure(encoding='utf-8')
import urllib.request
import re

url = 'https://onthiielts.com.vn/cambridge-practice-tests-for-ielts-full/'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
with urllib.request.urlopen(req, timeout=15) as resp:
    html = resp.read().decode('utf-8', errors='ignore')

# find all cambridge volume pages
cam_pages = re.findall(r'href=["\'](https?://onthiielts\.com\.vn/(?:ielts-)?cambridge-[^"\']+)["\']', html)
cam_pages = sorted(list(set(cam_pages)))
print('Found Cambridge volume pages on onthiielts:', len(cam_pages))
for p in cam_pages:
    print(' ', p)
