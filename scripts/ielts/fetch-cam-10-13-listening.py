import sys
sys.stdout.reconfigure(encoding='utf-8')
import urllib.request
import urllib.parse
import re
import json
import time

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

all_listening_keys = {}

for vol in [10, 11, 12, 13]:
    for t in [1, 2, 3, 4]:
        tid = f"cambridge-{vol}-listening-{t}"
        url = f"https://tuhoc.dolenglish.vn/luyen-thi-ielts/ielts-online-test-answer-key-mock-test-ielts-{vol}-test-{t}-listening"
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=12) as resp:
                html = resp.read().decode('utf-8', errors='ignore')
                decoded = urllib.parse.unquote(html)

                # Match patterns like:
                # 'Đáp án đúng\\",\\"bold\\":true},{\\"text\\":\\": Ardleigh\\"'
                matches = re.findall(r'Đáp án đúng(?:\\\\\"|\")?,(?:\\\\\"|\")?bold(?:\\\\\"|\")?:true(?:\\\\\"|\")?\},(?:\\\\\"|\")?\{(?:\\\\\"|\")?text(?:\\\\\"|\")?:(?:\\\\\"|\")?:\\s*([^\"\\]+)', decoded)
                if not matches:
                    # Fallback pattern
                    matches = re.findall(r'Đáp án đúng.*?text.*?:\s*([A-Za-z0-9\s/,\(\)\'\-]+?)(?:\\\\\"|\")', decoded)

                ans_map = {}
                q_counter = 1
                for raw_ans in matches:
                    ans = raw_ans.strip()
                    # If multiple choice options like A. the gym\nC. the pool
                    if '\n' in ans:
                        sub = [s.strip() for s in ans.split('\n') if s.strip()]
                        for s in sub:
                            ans_map[str(q_counter)] = s
                            q_counter += 1
                    else:
                        ans_map[str(q_counter)] = ans
                        q_counter += 1

                print(f"{tid}: {len(ans_map)}/40 answers")
                all_listening_keys[tid] = ans_map
        except Exception as e:
            print(f"{tid}: Error {e}")
        time.sleep(0.3)

with open('.local-private/ielts-ocr/cam-10-13-listening-keys.json', 'w', encoding='utf-8') as f:
    json.dump(all_listening_keys, f, indent=2, ensure_ascii=False)
print("Saved listening keys!")
