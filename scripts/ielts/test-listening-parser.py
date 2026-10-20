import sys
sys.stdout.reconfigure(encoding='utf-8')
import urllib.request
import re

url = 'https://onthiielts.com.vn/ielts-cambridge-19-test-1-listening-part-1/'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
with urllib.request.urlopen(req, timeout=12) as resp:
    html = resp.read().decode('utf-8', errors='ignore')

matches = [m.start() for m in re.finditer(r'Transcript', html)]
print('Matches:', len(matches))
for pos in matches[:3]:
    section = html[pos:pos+1500]
    print('--- SNIPPET ---')
    print(re.sub(r'<[^>]+>', ' ', section)[:400])
