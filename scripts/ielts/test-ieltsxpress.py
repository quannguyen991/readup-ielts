import sys
sys.stdout.reconfigure(encoding='utf-8')
import urllib.request
import re

url = 'https://www.ieltsxpress.com/ielts-practice-cambridge-12-listening-test-1/'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
try:
    with urllib.request.urlopen(req, timeout=10) as r:
        html = r.read().decode('utf-8', errors='ignore')
        print("Success! Length:", len(html))
        # Find tables or answers
        tables = re.findall(r'<table.*?</table>', html, flags=re.DOTALL)
        print("Tables:", len(tables))
        for t_idx, t in enumerate(tables):
            rows = re.findall(r'<tr>(.*?)</tr>', t, flags=re.DOTALL)
            print(f"Table {t_idx}: {len(rows)} rows")
            for r in rows[:3]:
                print("  row:", re.sub(r'<[^>]+>', ' ', r).strip())

        # Also search for Answer Key heading
        m = re.findall(r'(?:Answer\s*Key|Answers).*?(?=</div>|</article>|<footer)', html, re.I | re.DOTALL)
        print("Answer blocks:", len(m))
        for b in m[:2]:
            clean = re.sub(r'<[^>]+>', ' ', b).strip()
            print("  sample:", clean[:150])
except Exception as e:
    print("Error:", e)
