import json
import urllib.request
import concurrent.futures

with open('src/data/seed/video-library/index.json', 'r', encoding='utf-8') as f:
    videos = json.load(f)

print(f"Total videos to check: {len(videos)}")

def check_video(v):
    vid = v['id']
    url = f"https://i.ytimg.com/vi/{vid}/mqdefault.jpg"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=4) as resp:
            content = resp.read()
            # YouTube returns a tiny 1097-byte 1x1 or 120x90 grey placeholder when video doesn't exist
            if len(content) < 1800:
                return (vid, v['title'], v['channel'], f"Too small: {len(content)} bytes")
            return None
    except Exception as e:
        return (vid, v['title'], v['channel'], str(e))

broken = []
with concurrent.futures.ThreadPoolExecutor(max_workers=20) as executor:
    results = executor.map(check_video, videos)
    for r in results:
        if r:
            broken.append(r)

print(f"Total broken thumbnails found: {len(broken)}")
for b in broken[:20]:
    print(b)
