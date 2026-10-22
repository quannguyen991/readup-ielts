import urllib.request
import re

url = 'https://navsenglish.com/ielts/reading/test?slug=cambridge-10-academic-reading-test-1&ref=vankhongluoi'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, timeout=10) as r:
    html = r.read().decode('utf-8', errors='ignore')

# Find js script files included in HTML
js_files = re.findall(r'src="([^"]+\.js[^"]*)"', html)
print('JS files:', len(js_files))
for js in js_files[:10]:
    print(' ', js)
