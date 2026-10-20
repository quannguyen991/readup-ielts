import sys
sys.stdout.reconfigure(encoding='utf-8')
import urllib.request
import re

for vol in [10, 11, 12, 13, 17]:
    url = f'https://onthiielts.com.vn/cambridge-ielts-{vol}/'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            links = re.findall(r'href=["\'](https?://onthiielts\.com\.vn/[^"\']*(?:giai|dap-an|reading|listening|test)[^"\']*)["\']', html)
            print(f'Vol {vol} page links:', len(links))
            for l in list(set(links))[:10]:
                print('  ', l)
    except Exception as e:
        print(f'Vol {vol}: {e}')
