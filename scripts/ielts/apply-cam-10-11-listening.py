import json

data = json.load(open('.local-private/ielts-ocr/source-tests.json', 'r', encoding='utf-8'))
l_keys = json.load(open('.local-private/ielts-ocr/cam-10-13-listening-keys.json', 'r', encoding='utf-8'))

applied = 0
for test in data.get('tests', []):
    tid = test.get('id')
    if tid in l_keys and len(l_keys[tid]) >= 28:
        test['answerKey'] = l_keys[tid]
        test['answerKeyVerified'] = True
        test['answers'] = [
            {'questionNumber': int(k), 'correctAnswer': v, 'acceptableAnswers': [v]}
            for k, v in sorted(l_keys[tid].items(), key=lambda x: int(x[0]))
        ]
        applied += 1
        print(f"Applied authentic keys to {tid} ({len(l_keys[tid])}/40)")

with open('.local-private/ielts-ocr/source-tests.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f"Applied authentic listening keys to {applied} tests.")
