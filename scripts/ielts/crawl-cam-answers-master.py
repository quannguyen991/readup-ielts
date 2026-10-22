import urllib.request
import re
import json
import time

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

def fetch_html(url):
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.read().decode('utf-8', errors='ignore')
    except Exception:
        return None

def extract_answers_from_html(html):
    html_clean = re.sub(r'<(?:script|style)[^>]*>.*?</(?:script|style)>', '', html, flags=re.DOTALL)
    text = re.sub(r'<[^>]+>', '\n', html_clean)
    lines = [l.strip() for l in text.split('\n') if l.strip()]

    ans_dict = {}
    for l in lines:
        m = re.match(r'^(\d{1,2})\.\s*([A-Za-z0-9\s/,\(\)\'\-]+)$', l)
        if m:
            num = int(m.group(1))
            val = m.group(2).strip()
            if 1 <= num <= 40 and num not in ans_dict:
                ans_dict[num] = val
    return ans_dict

def get_answers_for(vol, sec, test_num):
    sec_name = sec.lower()
    # Try different URL formats
    url_candidates = [
        f"https://ieltstrainingonline.com/cambridge-ielts-{vol}-{sec_name}-test-{test_num}-answers-with-explanations/",
        f"https://ieltstrainingonline.com/cambridge-ielts-{vol}-{sec_name}-test-{test_num}-with-answers/",
        f"https://ieltstrainingonline.com/cambridge-ielts-{vol}-{sec_name}-test-{test_num}-answers/",
        f"https://ieltstrainingonline.com/practice-cam-{vol}-{sec_name}-test-{test_num:02d}-with-answer/",
        f"https://ieltstrainingonline.com/answers-and-explanations-for-cambridge-ielts-{vol}-{sec_name}-test-{test_num}/",
        f"https://ieltstrainingonline.com/cambridge-{vol}-test-{test_num}-{sec_name}-answers-with-explanations/",
    ]
    for url in url_candidates:
        html = fetch_html(url)
        if html:
            ans = extract_answers_from_html(html)
            if len(ans) >= 30:
                return ans, url
        time.sleep(0.2)
    return {}, None

results = {}
for vol in [10, 11, 12, 13]:
    for sec in ['Reading', 'Listening']:
        for t in [1, 2, 3, 4]:
            tid = f"cambridge-{vol}-{sec.lower()}-{t}"
            ans, url = get_answers_for(vol, sec, t)
            print(f"{tid}: {len(ans)}/40 answers (from {url})")
            if ans:
                results[tid] = {str(k): ans[k] for k in sorted(ans.keys())}

with open('.local-private/ielts-ocr/cam-10-13-extracted-keys.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, indent=2, ensure_ascii=False)
print("Saved to cam-10-13-extracted-keys.json")
