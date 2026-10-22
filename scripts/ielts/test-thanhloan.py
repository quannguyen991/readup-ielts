import urllib.request
import re

url = 'https://ielts-thanhloan.com/dap-an-ielts-listening-cambridge-10-test-1-transcript-answers.html'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
try:
    with urllib.request.urlopen(req, timeout=10) as r:
        html = r.read().decode('utf-8', errors='ignore')
        print("Success! Length:", len(html))
        # Find tables or answers
        tables = re.findall(r'<table.*?</table>', html, flags=re.DOTALL)
        print("Tables:", len(tables))
        for t in tables[:2]:
            rows = re.findall(r'<tr>(.*?)</tr>', t, flags=re.DOTALL)
            print(f"Rows: {len(rows)}")
            for row in rows[:5]:
                print(" ", re.sub(r'<[^>]+>', ' ', row).strip()[:100])
except Exception as e:
    print("Error:", e)
