import sys
sys.stdout.reconfigure(encoding='utf-8')
import urllib.request
import re
import json
import time

base_url = 'https://onthiielts.com.vn/kien-thuc/tai-lieu-ielts/ielts-cambridge/'
article_links = []

for page in range(1, 25):
    url = f'{base_url}page/{page}/' if page > 1 else base_url
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            articles = re.findall(r'<article[^>]*>(.*?)</article>', html, flags=re.DOTALL)
            count = 0
            for a in articles:
                link = re.search(r'href=["\'](https?://onthiielts\.com\.vn/[^"\']+)["\']', a)
                if link:
                    href = link.group(1)
                    if any(k in href for k in ['reading-passage', 'listening-part', 'cambridge']):
                        article_links.append(href)
                        count += 1
            print(f'Page {page}: found {count} relevant articles')
    except Exception as e:
        print(f'Page {page}: error {e}')
        break
    time.sleep(0.5)

unique_links = sorted(list(set(article_links)))
print('Total unique links found:', len(unique_links))
with open('.local-private/ielts-ocr/onthiielts-cam-links.json', 'w', encoding='utf-8') as f:
    json.dump(unique_links, f, indent=2, ensure_ascii=False)
print('Saved links to .local-private/ielts-ocr/onthiielts-cam-links.json')
