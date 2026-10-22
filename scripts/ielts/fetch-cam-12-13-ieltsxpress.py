import sys
sys.stdout.reconfigure(encoding='utf-8')
import urllib.request
import re
import json
import time

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

results = {}

for vol in [12, 13]:
    for t in [1, 2, 3, 4]:
        tid = f"cambridge-{vol}-listening-{t}"
        url = f"https://www.ieltsxpress.com/ielts-practice-cambridge-{vol}-listening-test-{t}/"
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=12) as resp:
                html = resp.read().decode('utf-8', errors='ignore')
                
                # Match 1. answer, 2. answer, etc.
                # Remove script/style
                clean_html = re.sub(r'<(?:script|style)[^>]*>.*?</(?:script|style)>', '', html, flags=re.DOTALL)
                clean_text = re.sub(r'<[^>]+>', '\n', clean_html)
                lines = [l.strip() for l in clean_text.split('\n') if l.strip()]
                
                ans_map = {}
                for l in lines:
                    m = re.match(r'^(\d{1,2})\.\s*([A-Za-z0-9\s/,\(\)\'\-]+)$', l)
                    if m:
                        q_num = int(m.group(1))
                        q_ans = m.group(2).strip()
                        if 1 <= q_num <= 40 and q_num not in ans_map:
                            if not any(k in q_ans.lower() for k in ['test', 'section', 'part', 'page']):
                                ans_map[str(q_num)] = q_ans

                print(f"{tid}: {len(ans_map)}/40 answers from {url}")
                if len(ans_map) >= 30:
                    results[tid] = ans_map
        except Exception as e:
            print(f"{tid}: Error {e}")
        time.sleep(0.5)

with open('.local-private/ielts-ocr/cam-12-13-listening-keys.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, indent=2, ensure_ascii=False)
print("Saved cam-12-13-listening-keys.json")
