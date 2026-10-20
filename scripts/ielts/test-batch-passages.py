import sys
sys.stdout.reconfigure(encoding='utf-8')
import urllib.request
import re

urls = [
    'https://onthiielts.com.vn/ielts-cambridge-19-test-1-reading-passage-1/',
    'https://onthiielts.com.vn/ielts-cambridge-19-test-1-reading-passage-2/',
    'https://onthiielts.com.vn/cambridge-19-test-1-reading-passage-3/',
    'https://onthiielts.com.vn/ielts-cambridge-14-test-1-reading-passage-1/',
]

for url in urls:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            # Extract title
            h1 = re.search(r'<h1[^>]*>(.*?)</h1>', html)
            title = re.sub(r'<[^>]+>', '', h1.group(1)).strip() if h1 else ''
            
            # Extract questions and answers
            table = re.search(r'<table.*?</table>', html, flags=re.DOTALL)
            answers = {}
            if table:
                rows = re.findall(r'<tr>(.*?)</tr>', table.group(0), flags=re.DOTALL)
                for r in rows:
                    cols = [re.sub(r'<[^>]+>', '', c).strip() for c in re.findall(r'<td[^>]*>(.*?)</td>', r, flags=re.DOTALL)]
                    if len(cols) >= 2 and cols[0].isdigit():
                        answers[cols[0]] = cols[1]

            # Extract passage text paragraphs
            # Look for translation or passage section
            # On onthiielts, under 'Dịch chi tiết' or in paragraphs with (Q1), (Q2) or paragraph numbers
            paras = []
            # Find the section starting with 'Dịch chi tiết' or similar
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
                # If paragraph contains English passage text (often starts with paragraph number like 1., 2. or (Q...))
                # or is an English sentence
                if len(clean_p) > 100 and not clean_p.startswith('Đáp án:') and not clean_p.startswith('Câu hỏi:') and not clean_p.startswith('Vị trí:') and not clean_p.startswith('Phân tích:'):
                    paras.append(clean_p)

            total_words = sum(len(p.split()) for p in paras)
            print(f'URL: {url}')
            print(f'  Title: {title}')
            print(f'  Answers parsed: {len(answers)} -> {list(answers.items())[:5]}')
            print(f'  Passage paragraphs: {len(paras)}, Total words: {total_words}')
            if paras:
                print(f'  Sample P1: {paras[0][:120]}...')
            print()
    except Exception as e:
        print(f'Error {url}: {e}')
