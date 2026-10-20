import sys
sys.stdout.reconfigure(encoding='utf-8')
import urllib.request
import re

url = 'https://onthiielts.com.vn/ielts-cambridge-18-test-1-listening-part-1/'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, timeout=10) as resp:
    html = resp.read().decode('utf-8', errors='ignore')

# Check title
h1 = re.search(r'<h1[^>]*>(.*?)</h1>', html)
print('H1:', re.sub(r'<[^>]+>', '', h1.group(1)).strip() if h1 else 'None')

# Check questions
q_blocks = re.findall(r'<h3[^>]*>.*?Question\s*(\d+)[:\s]*(.*?)</h3\s*>.*?<strong>Câu hỏi:\s*</strong>(.*?)</p>', html, flags=re.DOTALL)
print(f'Found {len(q_blocks)} question blocks in Listening Part 1:')
for q_num, ans, stem in q_blocks[:5]:
    ans_clean = re.sub(r'<[^>]+>', '', ans).replace('&nbsp;', '').strip()
    stem_clean = re.sub(r'<[^>]+>', '', stem).strip()
    print(f'  Q{q_num} [{ans_clean}]: {stem_clean[:80]}...')

# Check transcript
# Look for Transcript section
m = re.search(r'(?:Transcript|Bản chép lời).*?(?:<footer|Chia sẻ lên|Đăng ký)', html, flags=re.DOTALL | re.IGNORECASE)
if m:
    clean_t = re.sub(r'<[^>]+>', '\n', m.group(0))
    lines = [l.strip() for l in clean_t.split('\n') if len(l.strip()) > 30 and not any(l.strip().startswith(x) for x in ['Transcript', 'Phân tích', 'Question', 'Chia sẻ'])]
    print(f'Found {len(lines)} transcript dialogue lines:')
    for l in lines[:4]:
        print('  ', l[:100])
    total_words = sum(len(l.split()) for l in lines)
    print(f'Total transcript words: {total_words}')
