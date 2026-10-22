import sys
sys.stdout.reconfigure(encoding='utf-8')
import urllib.request
import urllib.parse
import re
import json

url = 'https://tuhoc.dolenglish.vn/luyen-thi-ielts/ielts-online-test-answer-key-mock-test-ielts-10-test-1-listening'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, timeout=10) as r:
    html = r.read().decode('utf-8', errors='ignore')
decoded = urllib.parse.unquote(html)

matches = re.findall(r'\"Đáp án đúng\".*?\"text\":\s*\"[:\s]*([^\"\\]+)\"', decoded)
print(f"Total answers found: {len(matches)}")
for i, ans in enumerate(matches, 1):
    print(f"  {i}: {ans.strip()}")
