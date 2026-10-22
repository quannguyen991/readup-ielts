import sys
sys.stdout.reconfigure(encoding='utf-8')
import urllib.request
import re
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SOURCE_TESTS_PATH = ROOT / ".local-private" / "ielts-ocr" / "source-tests.json"

print("1. Fetching Cambridge 16 official answer keys from onthiielts.com.vn...")
url = 'https://onthiielts.com.vn/dap-an-cambridge-16/'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
with urllib.request.urlopen(req, timeout=12) as resp:
    html = resp.read().decode('utf-8', errors='ignore')

tables = re.findall(r'<table.*?</table>', html, flags=re.DOTALL)
print(f"Found {len(tables)} tables on Cambridge 16 page.")

cam16_keys = {}
table_map = [
    ("cambridge-16-listening-1", 0),
    ("cambridge-16-reading-1", 1),
    ("cambridge-16-listening-2", 2),
    ("cambridge-16-reading-2", 3),
    ("cambridge-16-listening-3", 4),
    ("cambridge-16-reading-3", 5),
    ("cambridge-16-listening-4", 6),
    ("cambridge-16-reading-4", 7),
]

for tid, t_idx in table_map:
    tbl = tables[t_idx]
    cells = re.findall(r'<td[^>]*>(.*?)</td>', tbl, flags=re.DOTALL)
    ans_map = {}
    for c in cells:
        clean = re.sub(r'<[^>]+>', ' ', c).replace('&nbsp;', ' ').strip()
        # Handle ranges like "23 - 24. B, C" or "25 - 26. A, C"
        range_match = re.search(r'(\d+)\s*[-–]\s*(\d+)\s*[\.:]\s*([A-Za-z0-9\s/,\(\)\'\-]+)', clean)
        if range_match:
            q1, q2 = int(range_match.group(1)), int(range_match.group(2))
            answers_part = range_match.group(3).strip()
            sub_ans = [s.strip() for s in answers_part.split(',') if s.strip()]
            if len(sub_ans) >= 2:
                ans_map[str(q1)] = sub_ans[0]
                ans_map[str(q2)] = sub_ans[1]
            elif len(sub_ans) == 1:
                ans_map[str(q1)] = sub_ans[0]
                ans_map[str(q2)] = sub_ans[0]
            clean = clean[:range_match.start()] + clean[range_match.end():]

        # Match regular "X. Answer" or "X: Answer"
        parts = re.split(r'(?:^|\s+)(\d{1,2})\s*[\.:]\s*', clean)
        for i in range(1, len(parts), 2):
            q_num = parts[i].strip()
            q_ans = parts[i+1].strip().strip('.')
            if q_ans and str(q_num) not in ans_map:
                ans_map[str(q_num)] = q_ans

    cam16_keys[tid] = ans_map
    missing = [i for i in range(1, 41) if str(i) not in ans_map]
    print(f"  {tid}: {len(ans_map)}/40 answers. Missing: {missing}")

print("\n2. Loading source-tests.json...")
data = json.load(open(SOURCE_TESTS_PATH, 'r', encoding='utf-8'))
tests = data.get('tests', [])

# Apply Cambridge 16 keys
cam16_applied = 0
for test in tests:
    tid = test.get('id')
    if tid in cam16_keys and len(cam16_keys[tid]) >= 38:
        test['answerKey'] = cam16_keys[tid]
        test['answerKeyVerified'] = True
        test['answers'] = [
            {'questionNumber': int(k), 'correctAnswer': v, 'acceptableAnswers': [v]}
            for k, v in sorted(cam16_keys[tid].items(), key=lambda x: int(x[0]))
        ]
        cam16_applied += 1
print(f"Applied authentic keys to {cam16_applied} Cambridge 16 tests.")

# Apply Vol 10 Reading keys
print("\n3. Extracting and applying Vol 10 Reading keys...")
vol10_applied = 0
for tnum in range(1, 7):
    tid = f'vol-10-reading-{tnum}'
    test = next((t for t in tests if t.get('id') == tid), None)
    if not test:
        continue
    all_txt = '\n'.join(p.get('text', '') for p in test.get('supportPages', []))
    pattern = r'C[âa]u\s*s[ốo]\s*(\d{1,2}(?:\s*[-–]\s*\d{1,2})?)\s*:\s*(.+?)(?=\n*\s*(?:\.\.\.|…|C[âa]u\s*s[ốo]|\Z))'
    matches = re.findall(pattern, all_txt, re.IGNORECASE | re.DOTALL)
    v10_answers = {}
    for q_target, ans in matches:
        clean = ans.strip().strip('.')
        lines = [l.strip() for l in clean.split('\n') if l.strip() and l.strip() not in ['...', '…']]
        if not lines:
            continue
        first_line = lines[0]
        if '-' in q_target or '–' in q_target:
            parts = re.split(r'[-–]', q_target)
            q1, q2 = int(parts[0]), int(parts[1])
            sub_ans = [s.strip() for s in first_line.split(',')]
            if len(sub_ans) >= 2:
                v10_answers[str(q1)] = sub_ans[0]
                v10_answers[str(q2)] = sub_ans[1]
        else:
            v10_answers[str(int(q_target))] = first_line

    if len(v10_answers) >= 38:
        test['answerKey'] = v10_answers
        test['answerKeyVerified'] = True
        test['answers'] = [
            {'questionNumber': int(k), 'correctAnswer': v, 'acceptableAnswers': [v]}
            for k, v in sorted(v10_answers.items(), key=lambda x: int(x[0]))
        ]
        vol10_applied += 1
        print(f"  {tid}: applied {len(v10_answers)}/40 authentic keys.")

print(f"Applied authentic keys to {vol10_applied} Vol 10 tests.")

# Mark synthetic Vol 7, 8, 9, 11, 12
print("\n4. Marking synthetic Vol 7, 8, 9, 11, 12...")
synthetic_count = 0
for test in tests:
    tid = test.get('id', '')
    for sv in [7, 8, 9, 11, 12]:
        if f'vol-{sv}-' in tid:
            test['isSyntheticPractice'] = True
            test['answerKeyVerified'] = False
            synthetic_count += 1
print(f"Marked {synthetic_count} synthetic Vol tests (isSyntheticPractice: True, answerKeyVerified: False).")

# Save updated source-tests.json
with open(SOURCE_TESTS_PATH, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("\nSuccessfully updated source-tests.json!")
