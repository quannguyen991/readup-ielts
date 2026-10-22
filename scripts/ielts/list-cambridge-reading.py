import urllib.request
import re

url = 'https://ieltsdeal.com/category/reading/cambridge-reading/'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req, timeout=8) as r:
        html = r.read().decode('utf-8', errors='ignore')
        posts = re.findall(r'<h2 class="entry-title"><a href="([^"]+)"[^>]*>([^<]+)</a></h2>', html)
        print('Found posts:', len(posts))
        for link, title in posts:
            print(f'  {title} -> {link}')
except Exception as e:
    print('Error:', e)
