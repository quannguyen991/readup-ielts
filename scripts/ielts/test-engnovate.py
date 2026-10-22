import sys
sys.stdout.reconfigure(encoding='utf-8')
import urllib.request
import re

url = 'https://engnovate.com/ielts-listening-tests/cambridge-ielts-12-academic-listening-test-1/'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
try:
    with urllib.request.urlopen(req, timeout=10) as r:
        html = r.read().decode('utf-8', errors='ignore')
        print("Success! Length:", len(html))
        # Find answers or questions
        # Look for answer table or list or json
        ans_matches = re.findall(r'(\d{1,2})[\.\:\s]+([A-Za-z0-9\s/,\(\)\'\-]+?)(?=(?:<br|</p|</td>|</li>|\n))', html)
        print("Ans matches:", len(ans_matches))
        # Look for words like mountains, horse, gardens
        for w in ['mountains', 'horse', 'gardens', 'lunch']:
            pos = [m.start() for m in re.finditer(w, html, re.I)]
            print(w, 'pos:', len(pos))
            if pos:
                print(' ', repr(html[pos[0]-20:pos[0]+60]))
except Exception as e:
    print("Error:", e)
