import urllib.request
import re

url = 'https://navsenglish.com/ielts/reading/test?slug=cambridge-10-academic-reading-test-1&ref=vankhongluoi'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, timeout=10) as r:
    html = r.read().decode('utf-8', errors='ignore')

for kw in ['Stepwells', 'pavilions', 'drought', 'api', 'slug']:
    pos = html.find(kw)
    print(f'{kw}: found at {pos}')
    if pos != -1:
        print('  context:', html[pos:pos+200].replace('\n', ' ').encode('ascii', errors='replace').decode('ascii'))
