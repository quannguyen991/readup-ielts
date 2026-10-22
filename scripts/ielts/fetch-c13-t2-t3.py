import sys
sys.stdout.reconfigure(encoding='utf-8')
import urllib.request
import re
import json

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

c13_missing_keys = {}

for t in [2, 3]:
    url = f"https://ieltsprogress.com/cambridge-13-listening-test-{t}-answers/"
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=10) as r:
        html = r.read().decode('utf-8', errors='ignore')
        rows = re.findall(r'<tr>\s*<td[^>]*>(.*?)</td>\s*<td[^>]*>(.*?)</td>\s*</tr>', html, flags=re.DOTALL)
        ans_map = {}
        for col1, col2 in rows:
            c1_clean = re.sub(r'<[^>]+>', '', col1).strip()
            c2_clean = re.sub(r'<[^>]+>', '', col2).strip()
            # Handle ranges like "17 & 18" or "19 & 20"
            m_range = re.match(r'(\d+)\s*(?:&|and|-)\s*(\d+)', c1_clean)
            if m_range:
                q1, q2 = m_range.group(1), m_range.group(2)
                sub_ans = [s.strip() for s in re.split(r'[/,]|(?:or)', c2_clean) if s.strip()]
                if len(sub_ans) >= 2:
                    ans_map[q1] = sub_ans[0]
                    ans_map[q2] = sub_ans[1]
                else:
                    ans_map[q1] = c2_clean
                    ans_map[q2] = c2_clean
            elif c1_clean.isdigit():
                ans_map[c1_clean] = c2_clean

        tid = f"cambridge-13-listening-{t}"
        print(f"{tid}: {len(ans_map)}/40 answers")
        missing = [i for i in range(1, 41) if str(i) not in ans_map]
        print(f"  Missing: {missing}")
        c13_missing_keys[tid] = ans_map

with open('.local-private/ielts-ocr/c13-missing-listening.json', 'w', encoding='utf-8') as f:
    json.dump(c13_missing_keys, f, indent=2, ensure_ascii=False)
