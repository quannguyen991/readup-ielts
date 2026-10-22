import sys
sys.stdout.reconfigure(encoding='utf-8')
import urllib.request
import urllib.parse
import re

url = 'https://tuhoc.dolenglish.vn/luyen-thi-ielts/ielts-online-test-answer-key-mock-test-ielts-10-test-1-listening'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, timeout=10) as r:
    html = r.read().decode('utf-8', errors='ignore')
decoded = urllib.parse.unquote(html)

for m in re.finditer(r'Đáp án đúng', decoded):
    idx = m.start()
    print("MATCH:", repr(decoded[idx:idx+80]))
