import sys
sys.stdout.reconfigure(encoding='utf-8')
import urllib.request
import re
import json
import time

URLS_FILE = '.local-private/ielts-ocr/onthiielts-all-urls.json'
OUT_FILE = '.local-private/ielts-ocr/cambridge-crawled-authentic.json'

with open(URLS_FILE, 'r', encoding='utf-8') as f:
    all_urls = json.load(f)

# Find all reading passage URLs and listening part URLs
r_urls = [u for u in all_urls if 'reading-passage' in u]
l_urls = [u for u in all_urls if 'listening-part' in u]

print(f'Total reading URLs: {len(r_urls)}')
print(f'Total listening URLs: {len(l_urls)}')

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

def fetch_url(url):
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            return resp.read().decode('utf-8', errors='ignore')
    except Exception as e:
        print(f'Error fetching {url}: {e}')
        return None

def clean_html_text(text):
    text = re.sub(r'<(?:script|style)[^>]*>.*?</(?:script|style)>', '', text, flags=re.DOTALL)
    text = re.sub(r'<br\s*/?>', '\n', text)
    text = re.sub(r'</p>', '\n\n', text)
    text = re.sub(r'<[^>]+>', '', text)
    text = text.replace('&nbsp;', ' ').replace('&#8217;', "'").replace('&#8216;', "'")
    text = text.replace('&#8220;', '"').replace('&#8221;', '"').replace('&#8211;', '-').replace('&amp;', '&')
    return '\n'.join(line.strip() for line in text.split('\n') if line.strip())

def parse_reading_page(html, url):
    # Title
    h1 = re.search(r'<h1[^>]*>(.*?)</h1>', html)
    raw_title = re.sub(r'<[^>]+>', '', h1.group(1)).strip() if h1 else ''
    title = raw_title.split(':')[-1].strip() if ':' in raw_title else raw_title

    # Lettered paragraphs or main passage text
    # 1. Try lettered paragraphs pattern
    lettered = re.findall(r'<p class="wp-block-paragraph"><strong>([A-H])\.(?:<br>)?</strong>(.*?)</p>', html, flags=re.DOTALL)
    paras = []
    if lettered and len(lettered) >= 4:
        for letter, p_html in lettered:
            p_clean = re.sub(r'<[^>]+>', '', p_html).strip()
            paras.append(f'{letter}\n{p_clean}')
    else:
        # 2. Extract from full translation section
        m_trans = re.search(r'(?:Bản dịch chi tiết|Dịch chi tiết).*?(?:Chia sẻ lên|<footer)', html, flags=re.DOTALL)
        if m_trans:
            p_tags = re.findall(r'<p[^>]*>(.*?)</p>', m_trans.group(0), flags=re.DOTALL)
            for p in p_tags:
                clean_p = re.sub(r'<[^>]+>', '', p).strip()
                if any(clean_p.startswith(x) for x in ['Đáp án:', 'Câu hỏi:', 'Vị trí:', 'Phân tích:', 'Từ vựng cần nhớ', 'Lưu ý:']):
                    continue
                if len(clean_p) > 60:
                    ascii_ratio = sum(1 for c in clean_p if ord(c) < 128) / len(clean_p)
                    if ascii_ratio > 0.85:
                        p_text = re.sub(r'^(?:\d+\.|\([A-Z0-9]+\)|Paragraph\s+[A-Z]:?)\s*', '', clean_p).strip()
                        paras.append(p_text)

    # Questions and answers
    answers = {}
    questions = []
    
    # Check answers table
    table = re.search(r'<table.*?</table>', html, flags=re.DOTALL)
    if table:
        rows = re.findall(r'<tr>(.*?)</tr>', table.group(0), flags=re.DOTALL)
        for r in rows:
            cols = [re.sub(r'<[^>]+>', '', c).strip() for c in re.findall(r'<td[^>]*>(.*?)</td>', r, flags=re.DOTALL)]
            if len(cols) >= 2 and cols[0].isdigit():
                answers[cols[0]] = cols[1]

    # Question blocks
    q_blocks = re.findall(r'<h3[^>]*>.*?Question\s*(\d+)[:\s]*(.*?)</h3\s*>.*?<strong>Câu hỏi:\s*</strong>(.*?)</p>', html, flags=re.DOTALL)
    for q_num, ans, stem in q_blocks:
        ans_clean = re.sub(r'<[^>]+>', '', ans).replace('&nbsp;', '').strip()
        if ans_clean and q_num not in answers:
            answers[q_num] = ans_clean
        stem_clean = re.sub(r'<[^>]+>', '', stem).strip()
        stem_en = re.sub(r'\s*\([^)]*[\u00C0-\u1EF9][^)]*\)\s*$', '', stem_clean).strip()
        questions.append({
            'num': int(q_num),
            'stem': stem_en,
            'answer': answers.get(q_num, ans_clean)
        })

    passage_text = '\n\n'.join(paras)
    return {
        'title': title,
        'passage': passage_text,
        'wordCount': len(passage_text.split()),
        'questions': sorted(questions, key=lambda x: x['num']),
        'answers': answers
    }

def parse_listening_page(html, url):
    # Title
    h1 = re.search(r'<h1[^>]*>(.*?)</h1>', html)
    raw_title = re.sub(r'<[^>]+>', '', h1.group(1)).strip() if h1 else ''
    title = raw_title.split(':')[-1].strip() if ':' in raw_title else raw_title

    # Table answers
    answers = {}
    table = re.search(r'<table.*?</table>', html, flags=re.DOTALL)
    if table:
        rows = re.findall(r'<tr>(.*?)</tr>', table.group(0), flags=re.DOTALL)
        for r in rows:
            cols = [re.sub(r'<[^>]+>', '', c).strip() for c in re.findall(r'<td[^>]*>(.*?)</td>', r, flags=re.DOTALL)]
            if len(cols) >= 2 and cols[0].isdigit():
                answers[cols[0]] = cols[1]

    # Full transcript table
    # Pattern: <table class="has-fixed-layout"> or any table after Transcript heading
    trans_paras = []
    t_match = re.search(r'Transcript và bản dịch chi tiết.*?(?:Phân tích chi tiết|<footer|Chia sẻ lên)', html, flags=re.DOTALL | re.I)
    if t_match:
        t_block = t_match.group(0)
        # Look for table rows with 2 cells (English in col 0)
        t_table = re.search(r'<table.*?</table>', t_block, flags=re.DOTALL)
        if t_table:
            rows = re.findall(r'<tr>(.*?)</tr>', t_table.group(0), flags=re.DOTALL)
            for r in rows:
                cols = re.findall(r'<td[^>]*>(.*?)</td>', r, flags=re.DOTALL)
                if cols:
                    en_cell = clean_html_text(cols[0])
                    if len(en_cell) > 20:
                        trans_paras.append(en_cell)
        else:
            # Fallback to paragraph extraction
            p_tags = re.findall(r'<p[^>]*>(.*?)</p>', t_block, flags=re.DOTALL)
            for p in p_tags:
                clean_p = clean_html_text(p)
                if len(clean_p) > 30 and not clean_p.startswith('Lưu ý') and not clean_p.startswith('Transcript'):
                    ascii_ratio = sum(1 for c in clean_p if ord(c) < 128) / len(clean_p)
                    if ascii_ratio > 0.8:
                        trans_paras.append(clean_p)

    transcript = '\n\n'.join(trans_paras)
    return {
        'title': title,
        'transcript': transcript,
        'wordCount': len(transcript.split()),
        'answers': answers
    }

print('Parser functions ready.')

# Process Reading and Listening
results = {}

print('Starting crawl of Reading passages...')
for i, url in enumerate(r_urls):
    m = re.search(r'cambridge-(\d+)-test-(\d+)-reading-passage-(\d+)', url)
    if not m:
        continue
    vol, test_num, part_num = int(m.group(1)), int(m.group(2)), int(m.group(3))
    test_id = f'cambridge-{vol}-reading-{test_num}'
    if test_id not in results:
        results[test_id] = {
            'id': test_id,
            'source': f'Cambridge IELTS {vol}',
            'section': 'Reading',
            'parts': {}
        }
    html = fetch_url(url)
    if html:
        data = parse_reading_page(html, url)
        results[test_id]['parts'][part_num] = data
        print(f'[{i+1}/{len(r_urls)}] {test_id} P{part_num}: {data["wordCount"]} words, {len(data["questions"])} questions, title: {data["title"][:40]}')
    time.sleep(0.3)

print('\nStarting crawl of Listening parts...')
for i, url in enumerate(l_urls):
    m = re.search(r'cambridge-(\d+)-test-(\d+)-listening-part-(\d+)', url)
    if not m:
        continue
    vol, test_num, part_num = int(m.group(1)), int(m.group(2)), int(m.group(3))
    test_id = f'cambridge-{vol}-listening-{test_num}'
    if test_id not in results:
        results[test_id] = {
            'id': test_id,
            'source': f'Cambridge IELTS {vol}',
            'section': 'Listening',
            'parts': {}
        }
    html = fetch_url(url)
    if html:
        data = parse_listening_page(html, url)
        results[test_id]['parts'][part_num] = data
        print(f'[{i+1}/{len(l_urls)}] {test_id} P{part_num}: {data["wordCount"]} words, {len(data["answers"])} answers, title: {data["title"][:40]}')
    time.sleep(0.3)

with open(OUT_FILE, 'w', encoding='utf-8') as f:
    json.dump(results, f, indent=2, ensure_ascii=False)

print(f'\nFinished crawling! Saved {len(results)} tests to {OUT_FILE}')
