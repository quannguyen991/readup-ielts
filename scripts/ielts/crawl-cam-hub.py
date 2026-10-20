import sys
sys.stdout.reconfigure(encoding='utf-8')
import urllib.request
import re

url = 'https://onthiielts.com.vn/kien-thuc/tai-lieu-ielts/ielts-cambridge/'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, timeout=10) as resp:
    html = resp.read().decode('utf-8', errors='ignore')
    # search for articles
    articles = re.findall(r'<article[^>]*>(.*?)</article>', html, flags=re.DOTALL)
    print('Found articles:', len(articles))
    for a in articles:
        link = re.search(r'href=["\'](https?://onthiielts\.com\.vn/[^"\']+)["\']', a)
        title = re.search(r'<(?:h2|h3|a)[^>]*>(.*?)</(?:h2|h3|a)>', a, flags=re.DOTALL)
        clean_t = re.sub(r'<[^>]+>', '', title.group(1)).strip() if title else ''
        print(f'{clean_t} -> {link.group(1) if link else "no link"}')
