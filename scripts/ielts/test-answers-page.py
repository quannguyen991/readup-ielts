import urllib.request
import re

url = 'https://ieltstrainingonline.com/cambridge-ielts-10-reading-test-1-answers-with-explanations/'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, timeout=12) as resp:
    html = resp.read().decode('utf-8', errors='ignore')

print('Length:', len(html))
# Find answers: look for headings or bold questions or answer tables
matches = re.findall(r'<p>.*?<strong>(?:Answer|Question)\s*(\d+)[:\.\s]*(.*?)</strong>', html, re.I | re.DOTALL)
print('matches p strong:', len(matches))
if not matches:
    matches = re.findall(r'<strong>(\d+)[\.\s]+(.*?)</strong>', html)
    print('matches strong num:', len(matches))
    for m in matches[:10]:
        print(' ', m[0], re.sub(r'<[^>]+>', '', m[1])[:50])

# Let's see some text
clean = re.sub(r'<[^>]+>', '\n', html)
lines = [l.strip() for l in clean.split('\n') if l.strip()]
ans_lines = [l for l in lines if any(k in l.lower() for k in ['answer:', 'false', 'true', 'not given'])][:20]
print('sample answer lines:', ans_lines[:10])
