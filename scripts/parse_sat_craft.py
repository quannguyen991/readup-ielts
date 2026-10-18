import re
import json
import sys

sys.stdout.reconfigure(encoding="utf-8")

with open('scripts/sat_craft_structure_questions.txt', 'r', encoding='utf-8') as f:
    full_text = f.read()

# Split into Question Section and Answer Section
sep_match = re.search(r'Detailed Answer & Explanation', full_text, re.IGNORECASE)
if not sep_match:
    print("Could not find separator!")
    sys.exit(1)

q_section = full_text[:sep_match.start()]
a_section = full_text[sep_match.start():]

print(f"Q Section length: {len(q_section)}, A Section length: {len(a_section)}")

# Parse Answer section: Question <num> <difficulty> -> answer and rationales
# Pattern: Question (\d+)\s+([A-Za-z]+)\s+The correct answer is ([A-D])\.(.*?)(?=Question \d+|\Z)
ans_blocks = re.findall(r'Question\s+(\d+)\s+([A-Za-z]+)\s*\n+The correct answer is\s+([A-D])\.(.*?)(?=Question\s+\d+\s+[A-Za-z]+|\Z)', a_section, re.DOTALL | re.IGNORECASE)
print(f"Found {len(ans_blocks)} answer blocks")

answers_map = {}
for q_num, diff, correct_letter, explanation in ans_blocks:
    q_num = int(q_num)
    correct_letter = correct_letter.strip().upper()
    
    # Parse why correct and why wrong
    # Extract letter reasons: A) ... B) ... C) ... D) ...
    why_wrong = ["", "", "", ""]
    # Look for explanation of choices
    letter_explains = re.findall(r'([A-D])\)\s*([^A-D\n][^\n]+(?:\n[^\nA-D][^\n]+)*)', explanation)
    for l, exp in letter_explains:
        idx = ord(l.upper()) - ord('A')
        if 0 <= idx < 4:
            why_wrong[idx] = exp.strip()
            
    answers_map[q_num] = {
        'difficulty': diff.strip().lower(),
        'answer': correct_letter,
        'answerIndex': ord(correct_letter) - ord('A'),
        'explanation': explanation.strip(),
        'whyWrong': why_wrong
    }

print(f"Mapped {len(answers_map)} answers.")

# Parse Question Section:
# Pattern: Question (\d+)\s+([A-Za-z]+)\s*\n+(.*?)(?=Question \d+|\Z)
q_blocks = re.findall(r'Question\s+(\d+)\s+([A-Za-z]+)\s*\n+(.*?)(?=Question\s+\d+\s+[A-Za-z]+|\Z)', q_section, re.DOTALL | re.IGNORECASE)
print(f"Found {len(q_blocks)} question blocks")

parsed_questions = []
for q_num_str, diff, body in q_blocks:
    q_num = int(q_num_str)
    body = body.strip()
    
    # Extract options: A) ... B) ... C) ... D) ...
    # Look for options at the end
    opts_match = re.search(r'([A-D]\)\s*.*?)\s*([A-D]\)\s*.*?)\s*([A-D]\)\s*.*?)\s*([A-D]\)\s*.*?)$', body, re.DOTALL)
    if not opts_match:
        # Try alternate pattern
        opts_match = re.findall(r'([A-D])\)\s*([^\n]+)', body)
        if len(opts_match) == 4:
            options = [opt[1].strip() for opt in opts_match]
            passage_and_stem = re.sub(r'[A-D]\)\s*[^\n]+', '', body).strip()
        else:
            continue
    else:
        # Extract the 4 options
        opt_texts = [opts_match.group(i) for i in range(1, 5)]
        options = [re.sub(r'^[A-D]\)\s*', '', opt).strip() for opt in opt_texts]
        passage_and_stem = body[:opts_match.start()].strip()

    # Split passage and question stem
    # Usually stem is the last sentence ending with ?
    stem_match = re.search(r'([A-Z][^\n\.\?!]*\?)\s*$', passage_and_stem)
    if stem_match:
        stem = stem_match.group(1).strip()
        passage = passage_and_stem[:stem_match.start()].strip()
    else:
        # Fallback: look for common stems
        common_stems = [
            "Which choice completes the text with the most logical and precise word or phrase?",
            "As used in the text, what does the word",
            "Which choice best describes the function of the",
            "Which choice best states the main idea of the text?",
            "Which choice best describes the overall structure of the text?",
            "Based on the texts, how would",
        ]
        found_stem = False
        for cs in common_stems:
            if cs.lower() in passage_and_stem.lower():
                pos = passage_and_stem.lower().rfind(cs.lower())
                passage = passage_and_stem[:pos].strip()
                stem = passage_and_stem[pos:].strip()
                found_stem = True
                break
        if not found_stem:
            parts = passage_and_stem.split('\n\n')
            if len(parts) > 1:
                passage = '\n\n'.join(parts[:-1]).strip()
                stem = parts[-1].strip()
            else:
                passage = passage_and_stem
                stem = "Which choice best completes or answers the question?"

    ans_info = answers_map.get(q_num)
    if not ans_info:
        continue

    # Determine skill from stem
    stem_lower = stem.lower()
    if "most nearly mean" in stem_lower or "logical and precise word" in stem_lower:
        skill = "words_in_context"
        unit = 11
        unitTitle = "Từ trong ngữ cảnh (Words in Context)"
    elif "cross-text" in stem_lower or "both texts" in stem_lower or "based on the texts" in stem_lower or "author of text 1" in stem_lower or "author of text 2" in stem_lower:
        skill = "cross_text_connections"
        unit = 12
        unitTitle = "Liên kết hai văn bản (Cross-Text Connections)"
    elif "overall structure" in stem_lower or "structure of the text" in stem_lower:
        skill = "text_structure"
        unit = 13
        unitTitle = "Cấu trúc văn bản (Text Structure)"
    elif "function of the" in stem_lower or "serves mainly to" in stem_lower or "purpose" in stem_lower:
        skill = "purpose"
        unit = 13
        unitTitle = "Mục đích & Chức năng (Purpose & Function)"
    else:
        skill = "craft_and_structure"
        unit = 11
        unitTitle = "Kỹ xảo & Cấu trúc (Craft & Structure)"

    # Normalize difficulty
    diff_val = ans_info['difficulty']
    if diff_val in ['easy', 'dễ']:
        difficulty = 'easy'
    elif diff_val in ['medium', 'vừa']:
        difficulty = 'medium'
    else:
        difficulty = 'hard'

    # Build clean solutionVi
    solution_lines = [
        f"Đáp án đúng là {ans_info['answer']}.",
        ans_info['explanation'][:500] if len(ans_info['explanation']) > 500 else ans_info['explanation']
    ]

    parsed_questions.append({
        "id": f"sat-real-craft-{q_num:03d}",
        "unit": unit,
        "unitTitle": unitTitle,
        "domain": "Craft and Structure",
        "skill": skill,
        "passage": passage,
        "stem": stem,
        "options": options,
        "answerIndex": ans_info['answerIndex'],
        "solutionVi": "\n\n".join(solution_lines),
        "difficulty": difficulty,
        "whyWrong": ans_info['whyWrong'],
        "sourceBook": "SAT Suite Question Bank · Craft and Structure (Đề thi thật)"
    })

print(f"Successfully compiled {len(parsed_questions)} complete SAT questions with full keys and rationales!")
with open('scripts/parsed_sat_craft_questions.json', 'w', encoding='utf-8') as f:
    json.dump(parsed_questions, f, ensure_ascii=False, indent=2)
print("Saved to scripts/parsed_sat_craft_questions.json")
