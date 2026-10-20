import sys
sys.stdout.reconfigure(encoding='utf-8')
import urllib.request
import re

url = 'https://onthiielts.com.vn/cambridge-practice-tests-for-ielts-full/'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
with urllib.request.urlopen(req, timeout=15) as resp:
    html = resp.read().decode('utf-8', errors='ignore')
    links = re.findall(r'<a[^>]+href=["\'](https?://[^"\']+)["\'][^>]*>(.*?)</a>', html, flags=re.DOTALL)
    for href, text in links:
        t = re.sub(r'<[^>]+>', '', text).strip()
        if any(w in href.lower() for w in ['drive', 'download', 'pdf', 'cambridge-ielts']) or any(w in t.lower() for w in ['tải', 'download', 'cambridge', 'cam ']):
            print(f'{t} -> {href}')
