import urllib.request
import re
import json

url = 'https://navsenglish.com/ielts/reading/test?slug=cambridge-10-academic-reading-test-1&ref=vankhongluoi'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, timeout=10) as r:
    html = r.read().decode('utf-8', errors='ignore')

# Find JSON objects or scripts
scripts = re.findall(r'<script[^>]*>([^<]+)</script>', html)
print('Scripts count:', len(scripts))
for i, s in enumerate(scripts):
    if len(s) > 100:
        print(f'Script {i} len {len(s)}: {s[:120]}...')
        if 'pavilions' in s or 'FALSE' in s or 'answers' in s or 'Stepwells' in s:
            print(f'   --> CONTAINS KEYWORDS!')
