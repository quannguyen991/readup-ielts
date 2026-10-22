import urllib.request
import re

url = 'https://navsenglish.com/ielts/reading/test?slug=cambridge-10-academic-reading-test-1&ref=vankhongluoi'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, timeout=10) as r:
    html = r.read().decode('utf-8', errors='ignore')

# Print all inline scripts
scripts = re.findall(r'<script(?![^>]*src)[^>]*>(.*?)</script>', html, re.DOTALL)
print('Inline scripts:', len(scripts))
for i, s in enumerate(scripts):
    if 'fetch' in s or 'slug' in s or 'http' in s or 'test' in s:
        print(f'=== Script {i} ===')
        print(s[:300].encode('ascii', errors='replace').decode('ascii'))
