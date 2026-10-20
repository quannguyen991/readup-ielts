import sys
sys.stdout.reconfigure(encoding='utf-8')
import urllib.request
import re

for vol in range(10, 22):
    url = f'https://onthiielts.com.vn/dap-an-cambridge-{vol}/'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            print(f'Vol {vol}: OK (status 200, length {len(resp.read())})')
    except Exception as e:
        print(f'Vol {vol}: {e}')
