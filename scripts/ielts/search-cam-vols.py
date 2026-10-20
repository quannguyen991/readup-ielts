import sys
sys.stdout.reconfigure(encoding='utf-8')
import urllib.request
import re

for vol in [10, 11, 12, 13]:
    url = f'https://onthiielts.com.vn/?s=Cambridge+{vol}+reading'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            links = re.findall(r'<h[23][^>]*class="[^"]*title[^"]*"[^>]*><a[^>]+href=["\'](https?://[^"\']+)["\'][^>]*>(.*?)</a>', html)
            print(f'Search Cam {vol}: {len(links)} results')
            for href, title in links[:5]:
                print(f'   {re.sub(r"<[^>]+>", "", title).strip()} -> {href}')
    except Exception as e:
        print(f'Error searching Cam {vol}: {e}')
