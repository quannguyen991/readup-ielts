import json
import os
import re

SCRATCHPAD = r"C:\Users\admin\AppData\Local\Temp\claude\D--Claude\2038161e-58e0-439d-8fb5-e420795e2a81\scratchpad"
SOURCE_TESTS_PATH = r".local-private\ielts-ocr\source-tests.json"
EXTERNAL_TESTS_PATH = r"src\data\ielts-external-tests.json"
HIDDEN_TESTS_DOC = r"docs\HIDDEN_UNVERIFIED_TESTS.json"

def load_json(p):
    with open(p, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(p, data):
    with open(p, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

print("1. Loading verification reports...")
v8_13 = load_json(os.path.join(SCRATCHPAD, "verify-cam-8-13.json"))
v14_16 = load_json(os.path.join(SCRATCHPAD, "verify-cam-14-16.json"))
v17_21 = load_json(os.path.join(SCRATCHPAD, "verify-cam-17-21.json"))
v_vol = load_json(os.path.join(SCRATCHPAD, "verify-vol-iot.json"))

verdict_map = {}
reasons_map = {}

for t in v8_13.get('tests', []):
    verdict_map[t['id']] = t.get('status') or t.get('verdict')
    reasons_map[t['id']] = t.get('statusReason') or '; '.join(t.get('reasons', [])) or t.get('status')

for t in v14_16.get('tests', []):
    verdict_map[t['id']] = t.get('status') or t.get('verdict')
    reasons_map[t['id']] = t.get('statusReason') or '; '.join(t.get('problems', [])) or t.get('status')

for t in v17_21.get('tests', []):
    verdict_map[t['id']] = t.get('verdict') or t.get('status')
    reasons_map[t['id']] = '; '.join(t.get('reasons', [])) or t.get('verdict')

# VOL 10 KEY has verdict PASS in v_vol['vol10_key']
for i in range(1, 7):
    tid = f"vol-10-reading-{i}"
    verdict_map[tid] = "PASS"
    reasons_map[tid] = "VOL 10 KEY: keys match vol10-source.pdf text layer"

# Band 9 Master Prep Writing tests
verdict_map["band9-master-writing-1"] = "PASS"
reasons_map["band9-master-writing-1"] = "Band 9 Master Prep Writing prompt verified"
verdict_map["band9-master-writing-2"] = "PASS"
reasons_map["band9-master-writing-2"] = "Band 9 Master Prep Writing prompt verified"

# Authentic PASS list that can be visible:
# Note: Cam 8 writing/speaking had no print source in .local-private and was previously hidden; keep hidden
ALLOWED_VISIBLE_TESTS = {
    # Cam 17
    'cambridge-17-listening-1',
    'cambridge-17-speaking-3',
    # Cam 18
    'cambridge-18-reading-1',
    # Cam 19
    'cambridge-19-reading-1',
    'cambridge-19-speaking-1',
    'cambridge-19-listening-2',
    'cambridge-19-speaking-2',
    'cambridge-19-listening-3',
    'cambridge-19-speaking-4',
    # Cam 20
    'cambridge-20-speaking-1',
    'cambridge-20-speaking-3',
    'cambridge-20-speaking-4',
    # Cam 21 (Reading 1 hidden due to Passage 1 placeholder questions)
    'cambridge-21-speaking-1',
    'cambridge-21-writing-2',
    'cambridge-21-speaking-2',
    'cambridge-21-reading-3',
    'cambridge-21-writing-3',
    'cambridge-21-speaking-3',
    'cambridge-21-reading-4',
    'cambridge-21-writing-4',
    'cambridge-21-speaking-4',
    # Vol 10 KEY
    'vol-10-reading-1',
    'vol-10-reading-2',
    'vol-10-reading-3',
    'vol-10-reading-4',
    'vol-10-reading-5',
    'vol-10-reading-6',
    # Band 9 Master Prep
    'band9-master-writing-1',
    'band9-master-writing-2',
}

VERIFIED_SCORING_KEY_TESTS = {
    'cambridge-17-listening-1',
    'cambridge-18-reading-1',
    'cambridge-19-reading-1',
    'cambridge-19-listening-2',
    'cambridge-19-listening-3',
    'cambridge-21-reading-3',
    'cambridge-21-reading-4',
    'vol-10-reading-1',
    'vol-10-reading-2',
    'vol-10-reading-3',
    'vol-10-reading-4',
    'vol-10-reading-5',
    'vol-10-reading-6',
}

print("2. Overhauling source-tests.json...")
st_data = load_json(SOURCE_TESTS_PATH)
hidden_records = []
cleaned_leaked_pages = 0

for test in st_data['tests']:
    tid = test['id']
    title = test.get('title', tid)
    section = test.get('section', '')

    # Clean leaked website chrome & answer blocks
    for page in test.get('pages', []):
        txt = page.get('text', '')
        m = re.search(r'\n+(?:Answer Cam|Cam \d+\s*(?:Listening|Reading)|View Answers|Search \[)', txt, re.IGNORECASE)
        if m:
            page['text'] = txt[:m.start()].strip()
            cleaned_leaked_pages += 1
        if '&amp;amp;' in page.get('text', ''):
            page['text'] = page['text'].replace('&amp;amp;', '&')

    # Clean answerKey
    if test.get('answerKey'):
        for q, ans in list(test['answerKey'].items()):
            if isinstance(ans, str):
                if '&amp;amp;' in ans:
                    test['answerKey'][q] = ans.replace('&amp;amp;', '&')
                if ans.startswith('section A – '):
                    test['answerKey'][q] = ans.replace('section A – ', '')

    # Set flags
    if tid in ALLOWED_VISIBLE_TESTS:
        test['hidden'] = False
        test['answerKeyVerified'] = (tid in VERIFIED_SCORING_KEY_TESTS)
    else:
        test['hidden'] = True
        test['answerKeyVerified'] = False
        reason = reasons_map.get(tid, '')
        if tid == 'cambridge-21-reading-1':
            reason = 'Cam 21 Reading Passage 1: câu hỏi giả (research team documented...)'
        elif 'cambridge-9-' in tid:
            reason = 'Cambridge 9 unverified text / audio missing'
        elif not reason:
            reason = f"{verdict_map.get(tid, 'UNVERIFIED')}: unverified test key/content"
        hidden_records.append({
            'id': tid,
            'title': title,
            'section': section,
            'reason': reason
        })

print(f"Cleaned {cleaned_leaked_pages} leaked pages.")
print(f"Total private tests: {len(st_data['tests'])}")
visible_private = [t['id'] for t in st_data['tests'] if not t.get('hidden')]
hidden_private = [t['id'] for t in st_data['tests'] if t.get('hidden')]
verified_keys_count = sum(1 for t in st_data['tests'] if t.get('answerKeyVerified') and not t.get('hidden'))
print(f"Visible private tests: {len(visible_private)}")
print(f"Hidden private tests: {len(hidden_private)}")
print(f"Verified scoring keys in visible private: {verified_keys_count}")

save_json(SOURCE_TESTS_PATH, st_data)
print("Saved updated source-tests.json.")

print("3. Overhauling src/data/ielts-external-tests.json...")
ext_data = load_json(EXTERNAL_TESTS_PATH)
ext_tests = ext_data['tests']

# Detect duplicate keys in external tests
from collections import Counter
has_key = [t for t in ext_tests if t.get('answerKey')]
keys_str = [json.dumps(t['answerKey'], sort_keys=True) for t in has_key]
top_key_str = Counter(keys_str).most_common(1)[0][0]

hidden_public_records = []
for t in ext_tests:
    # 1. Reset all answerKeyVerified to False
    if 'answerKeyVerified' in t:
        t['answerKeyVerified'] = False

    # 2. Hide 108 tests with identical synthetic Listening key
    if t.get('answerKey') and json.dumps(t['answerKey'], sort_keys=True) == top_key_str:
        t['hidden'] = True
        hidden_public_records.append({
            'id': t['id'],
            'title': t.get('title', t['id']),
            'section': t.get('section', ''),
            'reason': 'Shared synthetic listening key repeated across 108 tests'
        })
    else:
        # Check if Chinese text in recent mock vol 4 reading 4
        if t['id'] == 'iot-ielts-recent-mock-tests-volume-4-reading-4':
            for p in t.get('pages', []):
                p['text'] = re.sub(r'\s*\([\u4e00-\u9fff]+\)', '', p.get('text', ''))

print(f"Reset answerKeyVerified to false for {len(has_key)} public tests.")
print(f"Marked hidden: true for {len(hidden_public_records)} duplicate synthetic listening tests.")

save_json(EXTERNAL_TESTS_PATH, ext_data)
print("Saved updated ielts-external-tests.json.")

print("4. Saving docs/HIDDEN_UNVERIFIED_TESTS.json...")
hidden_doc_content = {
    "generatedAt": "2026-10-21",
    "totalPrivateHidden": len(hidden_records),
    "totalPublicHidden": len(hidden_public_records),
    "totalHidden": len(hidden_records) + len(hidden_public_records),
    "hiddenPrivateTests": hidden_records,
    "hiddenPublicTests": hidden_public_records,
}
save_json(HIDDEN_TESTS_DOC, hidden_doc_content)
print(f"Saved {len(hidden_records)} hidden private records + {len(hidden_public_records)} hidden public records to {HIDDEN_TESTS_DOC}.")
