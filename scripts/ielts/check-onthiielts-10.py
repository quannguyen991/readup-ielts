import urllib.request
import re

req = urllib.request.Request('https://onthiielts.com.vn/cambridge-ielts-10/', headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req, timeout=10) as r:
        html = r.read().decode('utf-8', errors='ignore')
        links = re.findall(r'href=["\'](https://onthiielts\.com\.vn/[^"\']+)["\']', html)
        print('Links on cambridge-ielts-10:', len(links))
        test_links = [l for l in set(links) if 'test' in l and ('reading' in l or 'listening' in l)]
        for l in sorted(test_links):
            print(' ', l)
except Exception as e:
    print('Error:', e)
