import urllib.request
import re

url = 'https://ieltsdeal.com/?s=cambridge+10+reading+test+1'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req, timeout=8) as r:
        html = r.read().decode('utf-8', errors='ignore')
        links = re.findall(r'href=["\'](https://ieltsdeal\.com/[^"\']+)["\']', html)
        print('Found links:', len(links))
        for l in set(links[:20]):
            print(' ', l)
except Exception as e:
    print('Error:', e)
