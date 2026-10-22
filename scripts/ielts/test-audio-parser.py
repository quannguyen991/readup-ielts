import urllib.request
import re

url = 'https://ieltstrainingonline.com/audio-script-cambridge-ielts-10-listening-test-01/'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, timeout=10) as r:
    html = r.read().decode('utf-8', errors='ignore')

# Find all <strong> tags or text containing (Q\d+)
ans_map = {}
# Pattern 1: <strong>answer (Q1)</strong> or <strong>answer</strong> (Q1) or <strong>(Q1)</strong>
# Let's search around every (Q\d+) or [Q\d+]
q_positions = [m for m in re.finditer(r'\(Q(\d+)\)|\[Q(\d+)\]|\bQ(\d+)\b', html)]
print(f"Found {len(q_positions)} question markers.")

# Also let's check p tags
p_tags = re.findall(r'<p[^>]*>(.*?)</p>', html, flags=re.DOTALL)
for p in p_tags:
    clean_p = re.sub(r'<(?!strong|/strong)[^>]+>', '', p)
    # Find <strong> tags with (Q\d+) inside or immediately after
    bolds = re.findall(r'<strong>(.*?)</strong>', p, flags=re.DOTALL)
    for b in bolds:
        clean_b = re.sub(r'<[^>]+>', '', b).strip()
        m = re.search(r'\(Q(\d+)\)', clean_b)
        if m:
            q_num = m.group(1)
            ans = re.sub(r'\(Q\d+\)', '', clean_b).strip().strip('.')
            if ans and q_num not in ans_map:
                ans_map[int(q_num)] = ans

print(f"Mapped {len(ans_map)} answers so far: {ans_map}")
