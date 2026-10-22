import sys
sys.stdout.reconfigure(encoding='utf-8')
import urllib.request
import re
import json

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

for t in [2, 3]:
    url = f"https://ieltsprogress.com/cambridge-13-listening-test-{t}-answers/"
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as r:
            html = r.read().decode('utf-8', errors='ignore')
            clean_html = re.sub(r'<(?:script|style)[^>]*>.*?</(?:script|style)>', '', html, flags=re.DOTALL)
            clean_text = re.sub(r'<[^>]+>', '\n', clean_html)
            lines = [l.strip() for l in clean_text.split('\n') if l.strip()]

            ans_map = {}
            for l in lines:
                m = re.match(r'^(\d{1,2})\.\s*([A-Za-z0-9\s/,\(\)\'\-]+)$', l)
                if m:
                    num = int(m.group(1))
                    val = m.group(2).strip()
                    if 1 <= num <= 40 and num not in ans_map:
                        ans_map[str(num)] = val

            print(f"Cambridge 13 Listening Test {t}: {len(ans_map)}/40 answers from {url}")
            # If missing, print missing
            missing = [i for i in range(1, 41) if str(i) not in ans_map]
            print(f"  Missing: {missing}")
            # Save to file
            with open(f'.local-private/ielts-ocr/cam-13-listening-{t}.json', 'w', encoding='utf-8') as f:
                json.dump(ans_map, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Error {t}: {e}")
