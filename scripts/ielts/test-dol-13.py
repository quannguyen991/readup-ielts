import sys
sys.stdout.reconfigure(encoding='utf-8')
import urllib.request
import urllib.parse
import re

url = 'https://tuhoc.dolenglish.vn/luyen-thi-ielts/ielts-online-test-mt-ielts-13-test-1-listening-questions-answer-key-audio-transcript-dap-an-giai-thich-chi-tiet-free-pdf-download'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req, timeout=10) as r:
        html = r.read().decode('utf-8', errors='ignore')
        decoded = urllib.parse.unquote(html)
        matches = re.findall(r'Đáp án đúng(?:\\\\\"|\")?,(?:\\\\\"|\")?bold(?:\\\\\"|\")?:true(?:\\\\\"|\")?\},(?:\\\\\"|\")?\{(?:\\\\\"|\")?text(?:\\\\\"|\")?:(?:\\\\\"|\")?:\\s*([^\"\\]+)', decoded)
        print("Matches found:", len(matches))
        for i, m in enumerate(matches[:10], 1):
            print(f"  {i}: {m.strip()}")
except Exception as e:
    print("Error:", e)
