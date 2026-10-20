import sys
sys.stdout.reconfigure(encoding='utf-8')
import urllib.request
import re

url = 'https://onthiielts.com.vn/ielts-cambridge-18-test-1-reading-passage-1/'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, timeout=10) as resp:
    html = resp.read().decode('utf-8', errors='ignore')

# Find lettered paragraphs
pattern = r'<p class="wp-block-paragraph"><strong>([A-H])\.(?:<br>)?</strong>(.*?)</p>'
paras = re.findall(pattern, html, flags=re.DOTALL)
print(f'Found {len(paras)} lettered paragraphs:')
total_words = 0
for letter, p in paras:
    clean = re.sub(r'<[^>]+>', '', p).strip()
    words = len(clean.split())
    total_words += words
    print(f'  Paragraph {letter} ({words} words): {clean[:80]}...')

print(f'Total passage words: {total_words}')
