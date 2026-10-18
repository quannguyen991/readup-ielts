import re
import json
import sys

sys.stdout.reconfigure(encoding="utf-8")

with open('scripts/sat_geom_trig_questions.txt', 'r', encoding='utf-8') as f:
    text = f.read()

# Separate into Question Section and Answer Section
sep = "Detailed Answer & Explanation"
idx = text.find(sep)
if idx == -1:
    print("Cannot find Detailed Answer & Explanation!")
    sys.exit(1)

q_text = text[:idx]
a_text = text[idx:]

# Parse Answers
ans_matches = re.findall(r'Question\s+(\d+)\s+([A-Za-z]+)\s*\n+The correct answer is\s+([A-D0-9\.\/\-]+)\.?(.*?)(?=Question\s+\d+\s+[A-Za-z]+|\Z)', a_text, re.DOTALL | re.IGNORECASE)
print(f"Found {len(ans_matches)} math answer blocks")

ans_map = {}
for q_num_str, diff, ans_val, exp in ans_matches:
    q_num = int(q_num_str)
    ans_val = ans_val.strip()
    ans_map[q_num] = {
        'difficulty': diff.strip().lower(),
        'answer': ans_val,
        'explanation': exp.strip()
    }

# Parse Questions
q_matches = re.findall(r'Question\s+(\d+)\s+([A-Za-z]+)\s*\n+(.*?)(?=Question\s+\d+\s+[A-Za-z]+|\Z)', q_text, re.DOTALL | re.IGNORECASE)
print(f"Found {len(q_matches)} math question blocks")

math_questions = []
for q_num_str, diff, body in q_matches:
    q_num = int(q_num_str)
    body = body.strip()
    ans_info = ans_map.get(q_num)
    if not ans_info:
        continue

    # Check if multiple choice: A. ... B. ... C. ... D. ... or A) ...
    opts_match = re.findall(r'([A-D])[\.\)]\s*([^\n]+)', body)
    if len(opts_match) == 4:
        options = [opt[1].strip() for opt in opts_match]
        # Clean question text
        question_text = re.sub(r'([A-D])[\.\)]\s*[^\n]+', '', body).strip()
        is_multiple_choice = True
        
        # Determine answerIndex if answer is A/B/C/D
        ans_letter = ans_info['answer'].strip(' .\t\r\n').upper()
        if len(ans_letter) == 1 and ans_letter in ['A', 'B', 'C', 'D']:
            answerIndex = ord(ans_letter) - ord('A')
        else:
            answerIndex = 0
    else:
        # Student produced response (grid-in)
        options = []
        question_text = body
        is_multiple_choice = False
        answerIndex = -1

    diff_val = ans_info['difficulty']
    if diff_val in ['easy', 'dễ']:
        difficulty = 'easy'
    elif diff_val in ['medium', 'vừa']:
        difficulty = 'medium'
    else:
        difficulty = 'hard'

    math_questions.append({
        'id': f'sat-math-geom-{q_num:03d}',
        'questionNumber': q_num,
        'domain': 'Geometry and Trigonometry',
        'skill': 'geometry_and_trigonometry',
        'difficulty': difficulty,
        'stem': question_text,
        'options': options,
        'isMultipleChoice': is_multiple_choice,
        'correctAnswer': ans_info['answer'],
        'answerIndex': answerIndex,
        'explanation': ans_info['explanation'],
        'sourceBook': 'Đề thi thật SAT Math 2025 · Geometry & Trigonometry'
    })

print(f"Successfully compiled {len(math_questions)} Math questions!")
with open('scripts/parsed_sat_math_questions.json', 'w', encoding='utf-8') as f:
    json.dump(math_questions, f, ensure_ascii=False, indent=2)
print("Saved to scripts/parsed_sat_math_questions.json")
