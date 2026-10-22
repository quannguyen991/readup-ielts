import urllib.request
import re

url = 'https://ieltsdeal.com/ielts-academic-reading-cambridge-10-test-1-reading-passage-1-stepwells-with-best-solutions-and-explanations/'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, timeout=10) as r:
    html = r.read().decode('utf-8', errors='ignore')

clean = re.sub(r'<[^>]+>', '\n', html)
lines = [l.strip() for l in clean.splitlines() if l.strip()]

for i, line in enumerate(lines):
    if line.startswith('Question') or 'Answer:' in line or 'Question 1' in line:
        print(f'{i}: {line[:80]}')
        for next_line in lines[i+1:i+5]:
            print(f'   {next_line[:80]}')
