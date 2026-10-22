import json
import re

ocr = json.load(open('.local-private/ielts-ocr/cambridge18-book.ocr.json', encoding='utf-8'))
pages_by_num = {p['page']: p['text'] for p in ocr['pages']}

def parse_key_page(text):
    answers = {}
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    
    # Matches patterns like:
    # 1 DW30 7YZ
    # 2. 24(th) April
    # or line with number followed by answer line
    i = 0
    while i < len(lines):
        line = lines[i]
        # Ignore headers
        if any(h in line for h in ['Listening and Reading', 'TEST', 'LISTENING', 'READING', 'Answer key', 'Resource Bank', 'Questions', 'Part ', 'Reading Passage', 'If you score', 'you are unlikely']):
            i += 1
            continue
        
        # Check single line with question number and answer e.g. "1 lettuces" or "1 DW30 7YZ"
        m_single = re.match(r'^(\d{1,2})[\.\s]+(.+)$', line)
        # Or multi question like "14&15 IN EITHER ORDER" or "27&28"
        m_multi = re.match(r'^(\d{1,2})\s*&\s*(\d{1,2})', line)
        
        if m_multi:
            q1, q2 = m_multi.group(1), m_multi.group(2)
            # Find next answers
            ans_list = []
            j = i + 1
            while j < len(lines) and len(ans_list) < 2:
                next_l = lines[j]
                if not any(h in next_l for h in ['IN EITHER ORDER', 'Part', 'Questions', 'Reading Passage']):
                    # Check if next_l starts a new question number
                    if re.match(r'^\d{1,2}[\.\s]', next_l):
                        break
                    ans_list.append(next_l)
                j += 1
            if len(ans_list) == 2:
                answers[q1] = ans_list[0]
                answers[q2] = ans_list[1]
                i = j
                continue
            elif len(ans_list) == 1:
                answers[q1] = ans_list[0]
                answers[q2] = ans_list[0]
                i = j
                continue
        
        if m_single:
            qnum = m_single.group(1)
            ans = m_single.group(2).strip()
            if not ans.isdigit() or int(ans) > 40: # Not just a lone number
                answers[qnum] = ans
                i += 1
                continue
        
        # Check lone number on line: "1", then next line is "DW30 7YZ"
        if re.match(r'^\d{1,2}\.?$', line):
            qnum = re.sub(r'\D', '', line)
            if i + 1 < len(lines):
                next_l = lines[i+1]
                if not re.match(r'^\d{1,2}\.?$', next_l) and not any(h in next_l for h in ['TEST', 'Part', 'Questions', 'Reading Passage']):
                    answers[qnum] = next_l
                    i += 2
                    continue
        
        i += 1
    return answers

for pnum, tid in [
    (121, 'cambridge-18-listening-1'),
    (122, 'cambridge-18-reading-1'),
    (123, 'cambridge-18-listening-2'),
    (124, 'cambridge-18-reading-2'),
    (125, 'cambridge-18-listening-3'),
    (126, 'cambridge-18-reading-3'),
    (127, 'cambridge-18-listening-4'),
    (128, 'cambridge-18-reading-4'),
]:
    keys = parse_key_page(pages_by_num[pnum])
    print(f'{tid} (page {pnum}): parsed {len(keys)}/40 answers')
    print('  Sample:', list(keys.items())[:6])
