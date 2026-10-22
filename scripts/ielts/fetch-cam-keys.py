import urllib.request
import re
import json

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

def get_keys_for_cam(vol, section, test_num):
    # Try multiple standard URL patterns on IELTS prep sites
    urls = [
        f"https://ieltstrainingonline.com/cambridge-ielts-{vol}-{section.lower()}-test-{test_num}-answers/",
        f"https://ieltstrainingonline.com/cambridge-ielts-{vol}-{section.lower()}-test-{test_num}-with-answers/",
        f"https://ieltstrainingonline.com/cambridge-ielts-{vol}-test-{test_num}-{section.lower()}-answers/",
        f"https://ieltstrainingonline.com/ielts-{vol}-test-{test_num}-{section.lower()}-answers/",
    ]
    for url in urls:
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=6) as resp:
                html = resp.read().decode('utf-8', errors='ignore')
                # Parse answers: typically in <p>1. answer</p> or table
                matches = re.findall(r'(?:<p>|<td>|<li>|^)\s*(\d{1,2})[\.\:\s]+([A-Za-z0-9\s/,\(\)\'\-]+?)(?:</p>|</td>|</li>|<br|$)', html, re.M)
                ans_map = {}
                for num, val in matches:
                    clean_v = re.sub(r'<[^>]+>', '', val).strip()
                    if clean_v and len(clean_v) < 60 and not clean_v.lower().startswith('question'):
                        if int(num) not in ans_map:
                            ans_map[int(num)] = clean_v
                if len(ans_map) >= 20:
                    print(f"Found {len(ans_map)} keys from {url}")
                    return {str(k): ans_map[k] for k in sorted(ans_map.keys())}
        except Exception:
            continue
    return None

print("Testing fetch for Cam 10 Reading Test 1:")
k = get_keys_for_cam(10, 'Reading', 1)
print(k)
