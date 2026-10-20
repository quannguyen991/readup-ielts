import urllib.request
import re
import os
import json
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor

ROOT = Path(__file__).resolve().parents[2]
PRIVATE = ROOT / ".local-private" / "ielts-ocr"

def clean_lines(html_chunk):
    clean = re.sub(r'<[^>]+>', '\n', html_chunk)
    lines = [l.strip() for l in clean.split('\n') if l.strip()]
    return '\n'.join(lines)

def process_test(b, t):
    base_url = f'https://ieltstrainingonline.com/practice-cam-{b}-listening-test-{t:02d}/'
    ans_url = f'https://ieltstrainingonline.com/practice-cam-{b}-listening-test-{t:02d}-with-answer-and-transcript/'
    
    req = urllib.request.Request(base_url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        html = urllib.request.urlopen(req, timeout=15).read().decode('utf-8', errors='ignore')
    except Exception as e:
        print(f"Cam {b} T{t} base error: {e}")
        return None
        
    # Extract audio URLs
    audio_urls = []
    # Match in order of Part 1, 2, 3, 4
    for p in [1, 2, 3, 4]:
        m = re.search(rf'https?://[^\s\"\'<>]+\.(?:mp3|m4a)(?=[^\s\"\'<>]*?(?:part|section)-?{p}\b|\?_={p})', html, re.I)
        if not m:
            m = re.search(rf'https?://[^\s\"\'<>]+(?:cam-?{b}|cam{b})[^\s\"\'<>]+(?:test-?{t}|test{t})[^\s\"\'<>]+(?:part|section)-?{p}[^\s\"\'<>]+\.(?:mp3|m4a)', html, re.I)
        if m:
            audio_urls.append(m.group(0))
    if len(audio_urls) < 4:
        # Fallback regex
        all_media = re.findall(r'https?://[^\s\"\'<>]+\.(?:mp3|m4a)', html)
        seen = []
        for am in all_media:
            if am not in seen and ('upload' in am or 'cam' in am.lower()):
                seen.append(am)
        audio_urls = seen[:4]

    # Download audio files
    local_audio_filenames = []
    for idx, aurl in enumerate(audio_urls):
        ext = '.m4a' if aurl.endswith('.m4a') else '.mp3'
        fname = f'cambridge{b}-listening-test{t}-part{idx+1}{ext}'
        local_path = PRIVATE / fname
        local_audio_filenames.append(fname)
        if not local_path.exists() or local_path.stat().st_size < 10000:
            try:
                areq = urllib.request.Request(aurl, headers={'User-Agent': 'Mozilla/5.0'})
                data = urllib.request.urlopen(areq, timeout=20).read()
                local_path.write_bytes(data)
                print(f"Downloaded {fname} ({len(data)} bytes)")
            except Exception as e:
                print(f"Error downloading {aurl}: {e}")

    # Extract Questions by Part
    parts_data = []
    # Try finding markers between audio or Part headings
    for p in [1, 2, 3, 4]:
        p_start = re.search(rf'(?:PART|SECTION)\s*{p}\b', html, re.I)
        if p_start:
            start_idx = p_start.start()
            if p < 4:
                p_end = re.search(rf'(?:PART|SECTION)\s*{p+1}\b', html[start_idx+10:], re.I)
                end_idx = start_idx + 10 + p_end.start() if p_end else start_idx + 4000
            else:
                end_idx = start_idx + 5000
            q_chunk = clean_lines(html[start_idx:end_idx])
            # filter out navigation junk
            q_lines = [l for l in q_chunk.split('\n') if not any(x in l.lower() for x in ['speaking', 'writing practice', 'advertisement', 'facebook', 'twitter'])]
            parts_data.append('\n'.join(q_lines))
        else:
            parts_data.append(f"PART {p}\nQuestions {(p-1)*10+1}–{p*10}\nListen to the audio and answer the questions.")

    # Try fetching answer key from ans_url
    answers = {}
    try:
        areq = urllib.request.Request(ans_url, headers={'User-Agent': 'Mozilla/5.0'})
        ans_html = urllib.request.urlopen(areq, timeout=12).read().decode('utf-8', errors='ignore')
        # Find lines with "1. answer", "2. answer"
        clean_ans = clean_lines(ans_html)
        for line in clean_ans.split('\n'):
            match = re.match(r'^(\d{1,2})[.\s:–-]+\s*([A-Za-z0-9\s/(),-]+)', line)
            if match:
                qnum = int(match.group(1))
                if 1 <= qnum <= 40:
                    ans_val = match.group(2).strip()
                    if ans_val and not any(k in ans_val.lower() for k in ['questions', 'part', 'page', 'test']):
                        answers[str(qnum)] = ans_val
    except Exception as e:
        pass

    return {
        'id': f'cambridge-{b}-listening-{t}',
        'title': f'Cambridge IELTS {b} · Listening Test {t}',
        'book': b,
        'test': t,
        'local_audio': local_audio_filenames,
        'cloud_audio': audio_urls,
        'parts': parts_data,
        'answer_key': answers
    }

print("Testing Cam 16 Test 1 extraction...")
res = process_test(16, 1)
print(f"Cam 16 T1 complete! Audio: {res['local_audio']}, Parts: {len(res['parts'])}, Keys: {len(res['answer_key'])}")
