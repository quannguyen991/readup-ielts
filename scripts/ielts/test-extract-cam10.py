import urllib.request
import re

url = 'https://ieltstrainingonline.com/cambridge-ielts-10-reading-test-1-answers-with-explanations/'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, timeout=12) as resp:
    html = resp.read().decode('utf-8', errors='ignore')

# Strip style and scripts
html_clean = re.sub(r'<(?:script|style)[^>]*>.*?</(?:script|style)>', '', html, flags=re.DOTALL)
text = re.sub(r'<[^>]+>', '\n', html_clean)
lines = [l.strip() for l in text.split('\n') if l.strip()]

ans_dict = {}
# Look for pattern "1. FALSE" or "1. Answer" or "Question 1:" or "1. ..."
for l in lines:
    m = re.match(r'^(\d{1,2})\.\s*([A-Za-z0-9\s/,\(\)\'\-]+)$', l)
    if m:
        num = int(m.group(1))
        val = m.group(2).strip()
        if 1 <= num <= 40 and num not in ans_dict:
            ans_dict[num] = val

print(f"Extracted {len(ans_dict)} answers:")
for i in sorted(ans_dict.keys()):
    print(f"  {i}: {ans_dict[i]}")
