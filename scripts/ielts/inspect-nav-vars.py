import urllib.request
import re
import json

url = 'https://navsenglish.com/ielts/reading/test?slug=cambridge-10-academic-reading-test-1&ref=vankhongluoi'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, timeout=10) as r:
    html = r.read().decode('utf-8', errors='ignore')

# Check where test data is defined
matches = re.findall(r'var\s+test\s*=\s*(\{.+?\});', html, re.DOTALL)
if not matches:
    matches = re.findall(r'window\.test\s*=\s*(\{.+?\});', html, re.DOTALL)
if not matches:
    matches = re.findall(r'(?:const|let|var)\s+(\w+)\s*=\s*(\[\{.+?\}\]);', html, re.DOTALL)

print('Matches:', len(matches))
for m in matches[:5]:
    if isinstance(m, tuple):
        print('var name:', m[0], 'val len:', len(m[1]))
    else:
        print('val len:', len(m))
