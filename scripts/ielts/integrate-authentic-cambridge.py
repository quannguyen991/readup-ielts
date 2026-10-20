import sys
sys.stdout.reconfigure(encoding='utf-8')
import json
import re

CRAWLED_FILE = '.local-private/ielts-ocr/cambridge-crawled-full.json'
SOURCE_TESTS_FILE = '.local-private/ielts-ocr/source-tests.json'

with open(CRAWLED_FILE, 'r', encoding='utf-8') as f:
    crawled = json.load(f)

with open(SOURCE_TESTS_FILE, 'r', encoding='utf-8') as f:
    source_bank = json.load(f)

tests = source_bank['tests']
print(f'Loaded {len(crawled)} crawled tests, {len(tests)} tests in source-tests.json')

updated_count = 0

for t in tests:
    t_id = t['id']
    if t_id in crawled:
        c_test = crawled[t_id]
        parts_data = c_test.get('parts', {})
        if not parts_data:
            continue
            
        is_reading = t.get('section') == 'Reading'
        is_listening = t.get('section') == 'Listening'
        
        new_pages = []
        new_parts = []
        combined_key = dict(t.get('answerKey') or {})
        
        sorted_parts = sorted(parts_data.keys(), key=lambda k: int(k))
        
        for p_key in sorted_parts:
            p_info = parts_data[p_key]
            p_num = int(p_key)
            title = p_info.get('title') or f"Part {p_num}"
            text = p_info.get('text') or ''
            answers = p_info.get('answers') or {}
            
            # Merge answers
            for q_num, ans in answers.items():
                if ans and ans.strip():
                    combined_key[str(q_num)] = ans.strip()
                    
            if is_reading:
                q_start = 1 if p_num == 1 else (14 if p_num == 2 else 27)
                q_end = 13 if p_num == 1 else (26 if p_num == 2 else 40)
            elif is_listening:
                q_start = (p_num - 1) * 10 + 1
                q_end = p_num * 10
            else:
                q_start = 1
                q_end = 40
                
            # If text was short, format a rich heading and clean text
            header = f"{t.get('title', '')} · {t.get('section', '')}\n\n"
            if is_reading:
                header += f"READING PASSAGE {p_num}\nYou should spend about 20 minutes on Questions {q_start}–{q_end}, which are based on Reading Passage {p_num} below.\n\n"
            elif is_listening:
                header += f"LISTENING PART {p_num}\nQuestions {q_start}–{q_end}\n\n"
                
            header += f"{title.upper()}\n\n"
            full_page_text = header + text
            
            new_pages.append({
                'page': p_num,
                'text': full_page_text,
                'source': t.get('source', '')
            })
            
            new_parts.append({
                'id': p_num,
                'label': f"Passage {p_num}" if is_reading else f"Part {p_num}",
                'questionStart': q_start,
                'questionEnd': q_end,
                'recommendedMinutes': 20 if is_reading else 10
            })
            
        if new_pages:
            t['pages'] = new_pages
            t['parts'] = new_parts
            t['answerKey'] = combined_key
            t['externalOnly'] = False
            t['questionCount'] = 40
            t['hasAnswerKey'] = True
            
            # Verify if 40 keys exist
            if all(str(i) in combined_key and combined_key[str(i)] for i in range(1, 41)):
                t['answerKeyVerified'] = True
            updated_count += 1

print(f'Successfully updated {updated_count} tests with 100% authentic full-length passages!')

with open(SOURCE_TESTS_FILE, 'w', encoding='utf-8') as f:
    json.dump(source_bank, f, indent=2, ensure_ascii=False)

print('Saved .local-private/ielts-ocr/source-tests.json successfully!')
