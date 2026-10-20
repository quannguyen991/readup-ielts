import sys
sys.stdout.reconfigure(encoding='utf-8')
import urllib.request
import re
import json
import time

LINKS_FILE = '.local-private/ielts-ocr/onthiielts-cam-links.json'
OUT_FILE = '.local-private/ielts-ocr/cambridge-crawled-full.json'

with open(LINKS_FILE, 'r', encoding='utf-8') as f:
    all_links = json.load(f)

# Filter for reading and listening specific part URLs
test_urls = [l for l in all_links if 'reading-passage' in l or 'listening-part' in l]
print(f'Total test URLs to process: {len(test_urls)}')

results = {}

for idx, url in enumerate(test_urls):
    vol_match = re.search(r'cambridge-(\d+)', url)
    test_match = re.search(r'test-(\d+)', url)
    part_match = re.search(r'(?:passage|part)-(\d+)', url)
    is_reading = 'reading-passage' in url
    
    vol = int(vol_match.group(1)) if vol_match else None
    test_num = int(test_match.group(1)) if test_match else 1
    part_num = int(part_match.group(1)) if part_match else 1
    sec = 'reading' if is_reading else 'listening'
    
    if not vol:
        continue
        
    test_id = f'cambridge-{vol}-{sec}-{test_num}'
    if test_id not in results:
        results[test_id] = {
            'id': test_id,
            'vol': vol,
            'testNum': test_num,
            'section': 'Reading' if is_reading else 'Listening',
            'parts': {}
        }
        
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            
            # Title
            h1 = re.search(r'<h1[^>]*>(.*?)</h1>', html)
            raw_title = re.sub(r'<[^>]+>', '', h1.group(1)).strip() if h1 else ''
            title_parts = raw_title.split(':')
            part_title = title_parts[-1].strip() if len(title_parts) > 1 else raw_title
            
            # Answers table
            answers = {}
            table = re.search(r'<table.*?</table>', html, flags=re.DOTALL)
            if table:
                rows = re.findall(r'<tr>(.*?)</tr>', table.group(0), flags=re.DOTALL)
                for r in rows:
                    cols = [re.sub(r'<[^>]+>', '', c).strip() for c in re.findall(r'<td[^>]*>(.*?)</td>', r, flags=re.DOTALL)]
                    if len(cols) >= 2 and cols[0].isdigit():
                        answers[cols[0]] = cols[1]
                        
            # Text paragraphs or transcript
            paras = []
            if is_reading:
                matches = [m.start() for m in re.finditer(r'(?:Dịch chi tiết|Bản dịch chi tiết)', html)]
                section = html[matches[1]:] if len(matches) > 1 else (html[matches[0]:] if matches else html)
                p_tags = re.findall(r'<p[^>]*>(.*?)</p>', section, flags=re.DOTALL)
                for p in p_tags:
                    clean_p = re.sub(r'<[^>]+>', '', p).strip()
                    if any(clean_p.startswith(x) for x in ['Đáp án:', 'Câu hỏi:', 'Vị trí:', 'Phân tích:', 'Từ vựng cần nhớ', 'Transcript:']):
                        continue
                    if len(clean_p) > 60:
                        ascii_ratio = sum(1 for c in clean_p if ord(c) < 128) / len(clean_p)
                        if ascii_ratio > 0.85:
                            p_text = re.sub(r'^(?:\d+\.|\([A-Z0-9]+\)|Paragraph\s+[A-Z]:?)\s*', '', clean_p)
                            p_text = re.sub(r'\([A-Z0-9\s,-]+\)', '', p_text).strip()
                            paras.append(p_text)
            else:
                # Listening transcript
                # Find transcript table or text block
                t_match = re.search(r'(?:Transcript|Bản chép lời).*?(?:<h2|<footer|Đăng ký)', html, flags=re.DOTALL | re.IGNORECASE)
                if t_match:
                    t_text = re.sub(r'<script.*?</script>', '', t_match.group(0), flags=re.DOTALL)
                    t_text = re.sub(r'<[^>]+>', '\n', t_text)
                    lines = [l.strip() for l in t_text.split('\n') if l.strip()]
                    # Filter out header lines
                    valid_lines = [l for l in lines if len(l) > 30 and not any(l.startswith(x) for x in ['Transcript', 'Phân tích', 'Question', 'Lưu ý'])]
                    paras = valid_lines
                    
            full_text = '\n\n'.join(paras)
            word_count = len(full_text.split())
            
            results[test_id]['parts'][part_num] = {
                'part': part_num,
                'title': part_title,
                'url': url,
                'text': full_text,
                'wordCount': word_count,
                'paragraphs': paras,
                'answers': answers
            }
            print(f'[{idx+1}/{len(test_urls)}] {test_id} Part {part_num}: {part_title} ({word_count} words, {len(answers)} keys)')
    except Exception as e:
        print(f'[{idx+1}/{len(test_urls)}] Error {url}: {e}')
    time.sleep(0.3)

with open(OUT_FILE, 'w', encoding='utf-8') as f:
    json.dump(results, f, indent=2, ensure_ascii=False)

print(f'\nFinished processing! Successfully saved {len(results)} tests to {OUT_FILE}')
