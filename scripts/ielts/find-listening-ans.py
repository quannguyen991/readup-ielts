import urllib.request
import re

url = 'https://ieltstrainingonline.com/practice-cam-10-listening-test-01/'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, timeout=10) as r:
    html = r.read().decode('utf-8', errors='ignore')
    links = re.findall(r'href="([^"]+)"', html)
    ans_links = [l for l in set(links) if any(k in l.lower() for k in ['answer', 'audioscript', 'listening-test-1', 'listening-test-01'])]
    for l in ans_links:
        print(l)
