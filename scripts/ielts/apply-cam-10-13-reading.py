import sys
sys.stdout.reconfigure(encoding='utf-8')
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SOURCE_TESTS_PATH = ROOT / ".local-private" / "ielts-ocr" / "source-tests.json"
KEYS_PATH = ROOT / ".local-private" / "ielts-ocr" / "cam-10-13-reading-keys.json"

reading_keys = json.load(open(KEYS_PATH, 'r', encoding='utf-8'))
data = json.load(open(SOURCE_TESTS_PATH, 'r', encoding='utf-8'))
tests = data.get('tests', [])

applied = 0
for test in tests:
    tid = test.get('id')
    if tid in reading_keys:
        k_map = reading_keys[tid]
        if len(k_map) >= 36:
            test['answerKey'] = k_map
            test['answerKeyVerified'] = True
            test['answers'] = [
                {'questionNumber': int(k), 'correctAnswer': v, 'acceptableAnswers': [v]}
                for k, v in sorted(k_map.items(), key=lambda x: int(x[0]))
            ]
            applied += 1
            print(f"Applied authentic keys to {tid} ({len(k_map)}/40)")

with open(SOURCE_TESTS_PATH, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f"\nSuccessfully applied {applied} authentic Cambridge 10-13 Reading tests to source-tests.json!")
