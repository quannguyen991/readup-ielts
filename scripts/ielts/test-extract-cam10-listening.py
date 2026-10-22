import urllib.request
import re

url = 'https://ieltstrainingonline.com/practice-cam-10-listening-test-01-with-answer/'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, timeout=10) as r:
    html = r.read().decode('utf-8', errors='ignore')

# Strip scripts and styles
html_clean = re.sub(r'<(?:script|style)[^>]*>.*?</(?:script|style)>', '', html, flags=re.DOTALL)
text = re.sub(r'<[^>]+>', '\n', html_clean)
lines = [l.strip() for l in text.split('\n') if l.strip()]

ans_dict = {}
for l in lines:
    m = re.match(r'^(\d{1,2})\.\s*([A-Za-z0-9\s/,\(\)\'\-]+)$', l)
    if m:
        num = int(m.group(1))
        val = m.group(2).strip()
        if 1 <= num <= 40 and num not in ans_dict:
            ans_dict[num] = val

print(f"Extracted {len(ans_dict)} answers for Cam 10 Listening Test 1:")
for k in sorted(ans_dict.keys())[:15]:
    print(f"  {k}: {ans_dict[k]}")
