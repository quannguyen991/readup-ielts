import sys
sys.stdout.reconfigure(encoding='utf-8')
import urllib.request
import re

url = 'https://onthiielts.com.vn/kien-thuc/ielts-reading/'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, timeout=10) as resp:
    html = resp.read().decode('utf-8', errors='ignore')
    links = re.findall(r'<a[^>]+href=["\'](https?://onthiielts\.com\.vn/[^"\']+)["\'][^>]*>(.*?)</a>', html)
    print('Total links on reading page:', len(links))
    for href, text in links:
        t = re.sub(r'<[^>]+>', '', text).strip()
        if any(w in href for w in ['cambridge', 'reading', 'test', 'passage']) and len(t) > 10:
            print(f'{t} -> {href}')
