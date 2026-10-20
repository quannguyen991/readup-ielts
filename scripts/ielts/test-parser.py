import sys
sys.stdout.reconfigure(encoding='utf-8')
import urllib.request
import re
import json

def parse_onthiielts_page(url, html):
    # Determine type
    is_reading = 'reading-passage' in url
    is_listening = 'listening-part' in url
    
    # Volume and test
    vol_match = re.search(r'cambridge-(\d+)', url)
    test_match = re.search(r'test-(\d+)', url)
    part_match = re.search(r'(?:passage|part)-(\d+)', url)
    
    vol = int(vol_match.group(1)) if vol_match else None
    test_num = int(test_match.group(1)) if test_match else 1
    part_num = int(part_match.group(1)) if part_match else 1
    
    # Title
    h1 = re.search(r'<h1[^>]*>(.*?)</h1>', html)
    raw_title = re.sub(r'<[^>]+>', '', h1.group(1)).strip() if h1 else ''
    # Clean title e.g. "Giải chi tiết Cambridge 14 Test 1 Reading Passage 1: Why we need to protect polar bears"
    title_parts = raw_title.split(':')
    passage_title = title_parts[-1].strip() if len(title_parts) > 1 else raw_title
    
    # Answers table
    answers = {}
    table = re.search(r'<table.*?</table>', html, flags=re.DOTALL)
    if table:
        rows = re.findall(r'<tr>(.*?)</tr>', table.group(0), flags=re.DOTALL)
        for r in rows:
            cols = [re.sub(r'<[^>]+>', '', c).strip() for c in re.findall(r'<td[^>]*>(.*?)</td>', r, flags=re.DOTALL)]
            if len(cols) >= 2 and cols[0].isdigit():
                answers[cols[0]] = cols[1]
                
    # Detailed explanations & questions
    explanations = {}
    questions = {}
    q_blocks = re.findall(r'<h[234][^>]*>(?:Question|Câu)\s*(\d+).*?</h[234]>(.*?)(?=<h[234]|$)', html, flags=re.DOTALL | re.IGNORECASE)
    for q_num, block in q_blocks:
        clean_block = re.sub(r'<[^>]+>', '\n', block)
        lines = [l.strip() for l in clean_block.split('\n') if l.strip()]
        exp_text = '\n'.join(lines)
        explanations[q_num] = exp_text
        # extract Question text if present
        q_match = re.search(r'(?:Câu hỏi|Question):\s*(.*?)(?=\n|$)', exp_text)
        if q_match:
            questions[q_num] = q_match.group(1).strip()
            
    # Full passage text / translation paragraphs
    english_paras = []
    viet_paras = []
    
    # Look for the translation / passage section
    matches = [m.start() for m in re.finditer(r'(?:Dịch chi tiết|Bản dịch chi tiết)', html)]
    if len(matches) > 1:
        section = html[matches[1]:]
    elif len(matches) == 1:
        section = html[matches[0]:]
    else:
        section = html
        
    p_tags = re.findall(r'<p[^>]*>(.*?)</p>', section, flags=re.DOTALL)
    for p in p_tags:
        clean_p = re.sub(r'<[^>]+>', '', p).strip()
        # skip metadata / prompt lines
        if any(clean_p.startswith(x) for x in ['Đáp án:', 'Câu hỏi:', 'Vị trí:', 'Phân tích:', 'Từ vựng cần nhớ', 'Transcript:']):
            continue
        if len(clean_p) > 60:
            # Check if largely English
            # quick heuristic: ratio of ascii characters
            ascii_ratio = sum(1 for c in clean_p if ord(c) < 128) / len(clean_p)
            if ascii_ratio > 0.85:
                # Remove leading paragraph numbers like "1. ", "Paragraph A: ", "(Q1) "
                p_text = re.sub(r'^(?:\d+\.|\([A-Z0-9]+\)|Paragraph\s+[A-Z]:?)\s*', '', clean_p)
                p_text = re.sub(r'\([A-Z0-9\s,-]+\)', '', p_text).strip()
                english_paras.append(p_text)
            else:
                viet_paras.append(clean_p)
                
    full_text = '\n\n'.join(english_paras)
    return {
        'url': url,
        'section': 'Reading' if is_reading else 'Listening',
        'vol': vol,
        'testNum': test_num,
        'partNum': part_num,
        'passageTitle': passage_title,
        'wordCount': len(full_text.split()),
        'paragraphCount': len(english_paras),
        'passageText': full_text,
        'vietParasCount': len(viet_paras),
        'answersCount': len(answers),
        'answers': answers,
        'explanationsCount': len(explanations),
        'questionsCount': len(questions),
        'sampleParagraph': english_paras[0][:120] if english_paras else ''
    }

# Test with 4 URLs
urls = [
    'https://onthiielts.com.vn/ielts-cambridge-19-test-1-reading-passage-1/',
    'https://onthiielts.com.vn/ielts-cambridge-19-test-1-reading-passage-2/',
    'https://onthiielts.com.vn/cambridge-19-test-1-reading-passage-3/',
    'https://onthiielts.com.vn/ielts-cambridge-14-test-1-reading-passage-1/'
]

for u in urls:
    req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    with urllib.request.urlopen(req, timeout=12) as resp:
        res = parse_onthiielts_page(u, resp.read().decode('utf-8', errors='ignore'))
        print(f"[{res['section']} Vol {res['vol']} T{res['testNum']} P{res['partNum']}] {res['passageTitle']}")
        print(f"  Words: {res['wordCount']} | Paras: {res['paragraphCount']} | Answers: {res['answersCount']}")
        print(f"  Sample: {res['sampleParagraph']}...")
        print()
