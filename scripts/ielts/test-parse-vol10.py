import json
import re

data = json.load(open('.local-private/ielts-ocr/source-tests.json', encoding='utf-8'))

for tnum in range(1, 7):
    tid = f'vol-10-reading-{tnum}'
    test = next((t for t in data['tests'] if t.get('id') == tid), None)
    if not test:
        print(tid, 'NOT FOUND')
        continue
    
    answers = {}
    for p in test.get('supportPages', []):
        txt = p.get('text', '')
        # Pattern: "Câu số X:\nANSWER" or "Câu số X: ANSWER"
        matches = re.findall(r'C[âa]u\s*s[ốo]\s*(\d{1,2})\s*:\s*\n*([^\n\r]+)', txt, re.IGNORECASE)
        for qnum, ans in matches:
            clean_ans = ans.strip().strip('.')
            if clean_ans and clean_ans not in ['...', '…']:
                answers[str(int(qnum))] = clean_ans
    
    print(f"{tid}: parsed {len(answers)}/40 answers")
    print("  Q1-5:", {k: answers[k] for k in sorted(answers.keys(), key=int)[:5] if k in answers})
