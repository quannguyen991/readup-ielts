import sys
sys.stdout.reconfigure(encoding='utf-8')
import urllib.request
import re
import json

headers = {'User-Agent': 'Mozilla/5.0'}
all_urls = []

for i in range(1, 26):
    sm_url = f'https://onthiielts.com.vn/post-sitemap{i}.xml'
    req = urllib.request.Request(sm_url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            content = resp.read().decode('utf-8', errors='ignore')
            locs = re.findall(r'<loc>(https://onthiielts\.com\.vn/[^<]+)</loc>', content)
            all_urls.extend(locs)
            print(f'Sitemap {i}: {len(locs)} urls')
    except Exception as e:
        print(f'Sitemap {i}: {e}')

print(f'Total URLs from all sitemaps: {len(all_urls)}')

# Save all URLs
with open('.local-private/ielts-ocr/onthiielts-all-urls.json', 'w', encoding='utf-8') as f:
    json.dump(all_urls, f, indent=2, ensure_ascii=False)

cam_reading_urls = [u for u in all_urls if ('reading-passage' in u or 'passage' in u) and ('cambridge' in u or 'cam-' in u or 'ielts' in u)]
cam_listening_urls = [u for u in all_urls if ('listening-part' in u or 'part' in u) and ('cambridge' in u or 'cam-' in u or 'ielts' in u)]

print(f'Found {len(cam_reading_urls)} potential reading passage URLs')
print(f'Found {len(cam_listening_urls)} potential listening URLs')
