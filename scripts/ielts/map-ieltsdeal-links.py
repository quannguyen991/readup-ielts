import urllib.request
import re
import json

req = urllib.request.Request('https://ieltsdeal.com/llms.txt', headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, timeout=10) as r:
    txt = r.read().decode('utf-8')

links = re.findall(r'- \[([^\]]+)\]\((https://ieltsdeal\.com/[^\)]+)\)', txt)

target_posts = {}
for title, url in links:
    m = re.search(r'Cambridge\s*(10|11|12|13|16)\s*(?:Test\s*(\d)|Reading\s*Test\s*(\d))', title, re.I)
    if m:
        vol = m.group(1)
        tnum = m.group(2) or m.group(3) or '1'
        key = f"cambridge-{vol}-reading-{tnum}"
        if key not in target_posts:
            target_posts[key] = []
        target_posts[key].append((title, url))

print(f"Mapped {len(target_posts)} tests to ieltsdeal URLs:")
for k, v in sorted(target_posts.items()):
    print(f"  {k}: {len(v)} posts")
    for t, u in v[:2]:
        print(f"     {t[:60]} -> {u}")
