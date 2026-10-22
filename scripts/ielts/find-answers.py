import urllib.request
import re
import json

url = 'https://ieltstrainingonline.com/practice-cam-10-reading-test-01/'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, timeout=12) as resp:
    html = resp.read().decode('utf-8', errors='ignore')

links = re.findall(r'href="([^"]+)"', html)
for l in set(links):
    if 'answer' in l.lower() or 'explanation' in l.lower():
        print(l)
