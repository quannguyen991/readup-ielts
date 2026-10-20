import sys
sys.stdout.reconfigure(encoding='utf-8')
import urllib.request
import re

url = 'https://onthiielts.com.vn/ielts-cambridge-14-test-1-reading-passage-1/'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
with urllib.request.urlopen(req, timeout=12) as resp:
    html = resp.read().decode('utf-8', errors='ignore')

pos = html.find('Bản dịch chi tiết IELTS Cambridge 14')
if pos != -1:
    section = html[pos:pos+5000]
    paras = re.findall(r'<p[^>]*>(.*?)</p>', section, flags=re.DOTALL)
    print(f'Total paragraphs in translation: {len(paras)}')
    for i, p in enumerate(paras[:6]):
        print(f'P{i+1}:', re.sub(r'<[^>]+>', '', p).strip()[:150])
