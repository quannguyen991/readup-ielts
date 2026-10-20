import sys
sys.stdout.reconfigure(encoding='utf-8')
import urllib.request
import re

url = 'https://onthiielts.com.vn/ielts-cambridge-18-test-1-reading-passage-1/'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, timeout=10) as resp:
    html = resp.read().decode('utf-8', errors='ignore')

# Extract questions
# Pattern for question blocks
q_blocks = re.findall(r'<h3[^>]*>.*?Question\s*(\d+)[:\s]*(.*?)</h3\s*>.*?<strong>Câu hỏi:\s*</strong>(.*?)</p>', html, flags=re.DOTALL)
print(f'Found {len(q_blocks)} question blocks:')
for q_num, ans, stem in q_blocks:
    ans_clean = re.sub(r'<[^>]+>', '', ans).replace('&nbsp;', '').strip()
    stem_clean = re.sub(r'<[^>]+>', '', stem).strip()
    # Strip Vietnamese translation in parentheses at the end if present
    stem_en = re.sub(r'\s*\([^)]*[\u00C0-\u1EF9][^)]*\)\s*$', '', stem_clean).strip()
    print(f'  Q{q_num} [{ans_clean}]: {stem_en}')
