import sys
sys.stdout.reconfigure(encoding='utf-8')
import urllib.request
import json
import re
import html
import time

HEADERS = {
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}

BASE_API = 'https://qbank-api.collegeboard.org/msreportingquestionbank-prod/questionbank/digital/'

def clean_html(text):
    if not text:
        return ''
    # Convert paragraph tags to newlines
    text = re.sub(r'</p>\s*<p>', '\n\n', text)
    text = re.sub(r'<br\s*/?>', '\n', text)
    # Remove all other tags
    text = re.sub(r'<[^>]+>', '', text)
    # Unescape HTML entities
    text = html.unescape(text)
    # Normalize typography
    text = text.replace('’', "'").replace('‘', "'").replace('“', '"').replace('”', '"')
    text = text.replace('—', ' — ').replace('–', '-')
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def fetch_question_list(test_type, domains):
    url = BASE_API + 'get-questions'
    body = {'asmtEventId': 99, 'test': test_type, 'domain': domains}
    req = urllib.request.Request(url, data=json.dumps(body).encode('utf-8'), headers=HEADERS)
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode('utf-8'))

def fetch_single_question(ext_id):
    url = BASE_API + 'get-question'
    body = {'external_id': ext_id}
    req = urllib.request.Request(url, data=json.dumps(body).encode('utf-8'), headers=HEADERS)
    with urllib.request.urlopen(req, timeout=12) as resp:
        return json.loads(resp.read().decode('utf-8'))

print('Fetching Reading & Writing list...')
rw_list = fetch_question_list(1, 'INI,CAS,EOI,SEC')
print(f'Total RW available: {len(rw_list)}')

# Filter for hard and medium questions from recent updates
rw_target = [q for q in rw_list if q.get('score_band_range_cd') in [6, 7] and (q.get('external_id') or q.get('ibn'))]
print(f'Target hard/medium RW: {len(rw_target)}')

# Sample 50 high-yield questions covering diverse skills
skills_seen = {}
sampled_rw = []
for q in rw_target:
    skill = q.get('skill_desc') or 'General'
    if skills_seen.get(skill, 0) < 5:
        sampled_rw.append(q)
        skills_seen[skill] = skills_seen.get(skill, 0) + 1
    if len(sampled_rw) >= 50:
        break

print(f'Selected {len(sampled_rw)} high-yield RW items across skills: {list(skills_seen.keys())}')

parsed_rw_questions = []

SKILL_TO_UNIT = {
    'Boundaries': (3, 'Dấu câu & Ranh giới mệnh đề', 'boundaries'),
    'Form, Structure, and Sense': (2, 'Hòa hợp & Dạng từ', 'form'),
    'Words in Context': (11, 'Từ trong ngữ cảnh', 'words'),
    'Text Structure and Purpose': (12, 'Cấu trúc & Mục đích', 'structure'),
    'Cross-Text Connections': (13, 'So sánh 2 văn bản', 'crosstext'),
    'Central Ideas and Details': (14, 'Ý chính & Chi tiết', 'central'),
    'Command of Evidence': (15, 'Bằng chứng văn bản', 'evidence'),
    'Inferences': (16, 'Suy luận logic', 'inference'),
    'Transitions': (10, 'Từ nối & Chuyển đoạn', 'transition'),
    'Rhetorical Synthesis': (9, 'Tổng hợp diễn đạt', 'synthesis')
}

for i, meta in enumerate(sampled_rw):
    ext_id = meta.get('external_id') or meta.get('ibn')
    try:
        data = fetch_single_question(ext_id)
        stimulus = clean_html(data.get('body') or data.get('stimulus') or '')
        stem = clean_html(data.get('prompt') or data.get('stem') or '')
        
        # Options
        options = []
        raw_options = data.get('answerOptions') or []
        if not raw_options and data.get('answer', {}).get('choices'):
            choices_dict = data.get('answer', {}).get('choices')
            for k in sorted(choices_dict.keys()):
                options.append(clean_html(choices_dict[k].get('body', '')))
        else:
            for opt in raw_options:
                options.append(clean_html(opt.get('content', '')))

        if len(options) != 4 or not stimulus:
            continue

        # Correct answer
        ans_raw = data.get('correct_answer') or [data.get('answer', {}).get('correct_choice', 'A')]
        correct_letter = ans_raw[0].upper() if ans_raw else 'A'
        ans_idx = ['A', 'B', 'C', 'D'].index(correct_letter) if correct_letter in ['A', 'B', 'C', 'D'] else 0

        rationale = clean_html(data.get('rationale') or data.get('answer', {}).get('rationale') or '')
        
        skill_name = meta.get('skill_desc', '')
        unit_info = SKILL_TO_UNIT.get(skill_name, (11, 'Từ trong ngữ cảnh', 'words'))

        q_obj = {
            'id': f'sat-cb-{meta.get("questionId")}',
            'unit': unit_info[0],
            'unitTitle': unit_info[1],
            'domain': meta.get('primary_class_cd_desc', 'Craft and Structure'),
            'skill': unit_info[2],
            'passage': stimulus,
            'stem': stem,
            'options': options,
            'answerIndex': ans_idx,
            'solutionVi': f'Đáp án đúng là {correct_letter}.\n\n{rationale}',
            'difficulty': 'hard' if meta.get('score_band_range_cd') == 7 else 'medium',
            'sourceBook': f'College Board Official SAT Suite Question Bank ({skill_name})'
        }
        parsed_rw_questions.append(q_obj)
        print(f'[{i+1}/{len(sampled_rw)}] RW {q_obj["id"]} ({skill_name}): {stimulus[:60]}...')
        time.sleep(0.3)
    except Exception as e:
        print(f'Error fetching {ext_id}: {e}')
        time.sleep(1)

with open('src/data/seed/sat-rw/official-qbank-rw.json', 'w', encoding='utf-8') as f:
    json.dump(parsed_rw_questions, f, indent=2, ensure_ascii=False)

print(f'\nSuccessfully saved {len(parsed_rw_questions)} authentic RW questions to src/data/seed/sat-rw/official-qbank-rw.json')

print('\nFetching Math question list...')
math_list = fetch_question_list(2, 'H,P,Q,S')
print(f'Total Math available: {len(math_list)}')

math_target = [q for q in math_list if q.get('score_band_range_cd') in [6, 7] and (q.get('external_id') or q.get('ibn'))]
print(f'Target hard/medium Math: {len(math_target)}')

math_skills_seen = {}
sampled_math = []
for q in math_target:
    skill = q.get('skill_desc') or 'General'
    if math_skills_seen.get(skill, 0) < 4:
        sampled_math.append(q)
        math_skills_seen[skill] = math_skills_seen.get(skill, 0) + 1
    if len(sampled_math) >= 40:
        break

print(f'Selected {len(sampled_math)} high-yield Math items across skills: {list(math_skills_seen.keys())}')

parsed_math_questions = []

for i, meta in enumerate(sampled_math):
    ext_id = meta.get('external_id') or meta.get('ibn')
    try:
        data = fetch_single_question(ext_id)
        stem = clean_html(data.get('prompt') or data.get('stem') or data.get('body') or '')
        
        options = []
        raw_options = data.get('answerOptions') or []
        if not raw_options and data.get('answer', {}).get('choices'):
            choices_dict = data.get('answer', {}).get('choices')
            for k in sorted(choices_dict.keys()):
                options.append(clean_html(choices_dict[k].get('body', '')))
        else:
            for opt in raw_options:
                options.append(clean_html(opt.get('content', '')))

        is_mcq = len(options) == 4
        ans_raw = data.get('correct_answer') or [data.get('answer', {}).get('correct_choice', '')]
        correct_answer = ans_raw[0] if ans_raw else '0'
        ans_idx = ['A', 'B', 'C', 'D'].index(correct_answer.upper()) if is_mcq and correct_answer.upper() in ['A', 'B', 'C', 'D'] else 0

        rationale = clean_html(data.get('rationale') or data.get('answer', {}).get('rationale') or '')
        skill_name = meta.get('skill_desc', 'Algebra')

        q_obj = {
            'id': f'sat-cb-math-{meta.get("questionId")}',
            'questionNumber': i + 1,
            'domain': meta.get('primary_class_cd_desc', 'Advanced Math'),
            'skill': skill_name,
            'difficulty': 'hard' if meta.get('score_band_range_cd') == 7 else 'medium',
            'stem': stem,
            'options': options if is_mcq else [],
            'isMultipleChoice': is_mcq,
            'correctAnswer': str(correct_answer),
            'answerIndex': ans_idx,
            'explanation': f'Lời giải chính thức từ College Board:\n\n{rationale}',
            'sourceBook': f'College Board Official SAT Suite Question Bank ({skill_name})'
        }
        parsed_math_questions.append(q_obj)
        print(f'[{i+1}/{len(sampled_math)}] Math {q_obj["id"]} ({skill_name}): {stem[:60]}...')
        time.sleep(0.3)
    except Exception as e:
        print(f'Error fetching math {ext_id}: {e}')
        time.sleep(1)

with open('src/data/seed/sat-math/official-qbank-math.json', 'w', encoding='utf-8') as f:
    json.dump(parsed_math_questions, f, indent=2, ensure_ascii=False)

print(f'\nSuccessfully saved {len(parsed_math_questions)} authentic Math questions to src/data/seed/sat-math/official-qbank-math.json')
