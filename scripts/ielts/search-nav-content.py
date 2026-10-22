import urllib.request
import re

url = 'https://navsenglish.com/ielts/reading/test?slug=cambridge-10-academic-reading-test-1'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, timeout=10) as r:
    html = r.read().decode('utf-8', errors='ignore')

# Search for passage content or questions
for kw in ['Passage 1', 'Reading Passage', 'Question 1', 'question-item', 'class="question']:
    m = [match.start() for match in re.finditer(kw, html, re.I)]
    print(kw, 'matches:', len(m))
    if m:
        pos = m[0]
        print('  snippet:', html[pos:pos+300].replace('\n', ' ').encode('ascii', errors='replace').decode('ascii'))
