import json, re

with open('.local-private/ielts-ocr/source-tests.json', 'r', encoding='utf-8') as f:
    st = json.load(f)

cut_count = 0
for t in st['tests']:
    for pi, p in enumerate(t.get('pages', [])):
        txt = p.get('text', '')
        m = re.search(r'\n+(?:Answer Cam|Cam \d+\s*(?:Listening|Reading)|View Answers with Explanations|Search \[)', txt, re.IGNORECASE)
        if m:
            cut_count += 1
            before = txt[:m.start()].strip()
            leaked = txt[m.start():].strip()
            if cut_count <= 5:
                print(f"{t['id']} p{pi}: cut {len(leaked)} chars, preserved {len(before)} chars")
                print("  Leaked start:", repr(leaked[:60]))

print('Total pages with leaked block:', cut_count)
