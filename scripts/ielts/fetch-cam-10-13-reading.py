import urllib.request
import re
import json

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

all_reading_keys = {}

for vol in [10, 11, 12, 13]:
    for t in [1, 2, 3, 4]:
        tid = f"cambridge-{vol}-reading-{t}"
        url = f"https://ieltstrainingonline.com/cambridge-ielts-{vol}-reading-test-{t}-answers-with-explanations/"
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=12) as resp:
                html = resp.read().decode('utf-8', errors='ignore')
                html_clean = re.sub(r'<(?:script|style)[^>]*>.*?</(?:script|style)>', '', html, flags=re.DOTALL)
                text = re.sub(r'<[^>]+>', '\n', html_clean)
                lines = [l.strip() for l in text.split('\n') if l.strip()]

                ans_dict = {}
                for l in lines:
                    m = re.match(r'^(\d{1,2})\.\s*([A-Za-z0-9\s/,\(\)\'\-]+)$', l)
                    if m:
                        num = int(m.group(1))
                        val = m.group(2).strip()
                        if 1 <= num <= 40 and num not in ans_dict:
                            ans_dict[str(num)] = val
                print(f"{tid}: {len(ans_dict)}/40 answers")
                all_reading_keys[tid] = ans_dict
        except Exception as e:
            print(f"{tid}: Error {e}")

with open('.local-private/ielts-ocr/cam-10-13-reading-keys.json', 'w', encoding='utf-8') as f:
    json.dump(all_reading_keys, f, indent=2, ensure_ascii=False)
print("Done! Saved reading keys.")
