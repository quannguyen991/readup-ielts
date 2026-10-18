import json
import urllib.request
import re
import concurrent.futures

CHANNELS = [
    ('TED-Ed', 'https://www.youtube.com/@TEDEd/videos', 'B1', 'Kiến thức phổ thông'),
    ('BBC Learning English', 'https://www.youtube.com/@bbclearningenglish/videos', 'B1', 'Tiếng Anh hằng ngày'),
    ('Kurzgesagt – In a Nutshell', 'https://www.youtube.com/@kurzgesagt/videos', 'B2', 'Khoa học'),
    ('Vox', 'https://www.youtube.com/@Vox/videos', 'B2', 'Thời sự và xã hội'),
    ('National Geographic', 'https://www.youtube.com/@NatGeo/videos', 'B2', 'Thiên nhiên'),
    ('Veritasium', 'https://www.youtube.com/@veritasium/videos', 'B2', 'Khoa học'),
    ('SciShow', 'https://www.youtube.com/@SciShow/videos', 'B1', 'Khoa học'),
    ('Wendover Productions', 'https://www.youtube.com/@Wendoverproductions/videos', 'B2', 'Kinh tế và hạ tầng'),
    ('Oxford Online English', 'https://www.youtube.com/@Oxfordonlineenglish/videos', 'B1', 'Tiếng Anh hằng ngày'),
    ('BBC News', 'https://www.youtube.com/@BBCNews/videos', 'B2', 'Thời sự và xã hội'),
    ('CNN', 'https://www.youtube.com/@CNN/videos', 'B2', 'Thời sự và xã hội'),
    ('Vietnam Today', 'https://www.youtube.com/@vietnamtodayinternational/videos', 'B1', 'Du lịch & Văn hóa'),
]

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}

def scrape_channel(ch_info):
    name, url, default_level, default_topic = ch_info
    print(f"Scraping channel: {name}...")
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=12) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
        
        # Regex to find videoId and title
        pattern = r'"videoId":"([A-Za-z0-9_-]{11})".*?"title":\{"runs":\[\{"text":"(.*?)"\}'
        raw_matches = re.findall(pattern, html)
        
        unique = {}
        for vid, title in raw_matches:
            if vid not in unique and len(title) > 5:
                unique[vid] = title
        
        print(f" -> Found {len(unique)} candidates for {name}")
        return name, default_level, default_topic, unique
    except Exception as e:
        print(f"Failed to scrape {name}: {e}")
        return name, default_level, default_topic, {}

def check_thumb(vid):
    thumb_url = f"https://i.ytimg.com/vi/{vid}/mqdefault.jpg"
    req = urllib.request.Request(thumb_url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=3) as resp:
            data = resp.read()
            if len(data) > 2000:
                return True
    except:
        pass
    return False

def main():
    with open('src/data/seed/video-library/index.json', 'r', encoding='utf-8') as f:
        existing_videos = json.load(f)

    # Find broken videos
    print("Checking current videos for broken thumbnails...")
    def check_v(v):
        return v if not check_thumb(v['id']) else None

    broken_videos = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=25) as executor:
        for res in executor.map(check_v, existing_videos):
            if res:
                broken_videos.append(res)

    print(f"Found {len(broken_videos)} broken videos to fix/replace.")
    broken_ids = set(v['id'] for v in broken_videos)
    valid_existing_ids = set(v['id'] for v in existing_videos if v['id'] not in broken_ids)

    # Scrape real videos from all channels
    scraped_pool = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
        results = executor.map(scrape_channel, CHANNELS)
        for name, default_level, default_topic, v_dict in results:
            for vid, title in v_dict.items():
                if vid not in valid_existing_ids and vid not in broken_ids:
                    scraped_pool.append({
                        'id': vid,
                        'title': title,
                        'channel': name,
                        'level': default_level,
                        'topic': default_topic,
                        'durationSeconds': 360
                    })

    print(f"Total fresh candidate pool: {len(scraped_pool)}")

    # Verify thumbnails of pool candidates
    verified_fresh = []
    def verify_cand(c):
        return c if check_thumb(c['id']) else None

    with concurrent.futures.ThreadPoolExecutor(max_workers=25) as executor:
        for res in executor.map(verify_cand, scraped_pool):
            if res:
                verified_fresh.append(res)

    print(f"Verified working videos in fresh pool: {len(verified_fresh)}")

    # Replace broken videos with verified fresh ones
    fresh_iter = iter(verified_fresh)
    fixed_videos = []
    replaced_count = 0

    for v in existing_videos:
        if v['id'] in broken_ids:
            # Try to find a fresh one of matching channel if possible
            replacement = None
            for idx, cand in enumerate(verified_fresh):
                if cand and cand['channel'] == v['channel']:
                    replacement = cand
                    verified_fresh[idx] = None
                    break
            if not replacement:
                for idx, cand in enumerate(verified_fresh):
                    if cand:
                        replacement = cand
                        verified_fresh[idx] = None
                        break
            
            if replacement:
                fixed_videos.append(replacement)
                replaced_count += 1
            else:
                # If cannot replace, skip
                pass
        else:
            fixed_videos.append(v)

    # Deduplicate by ID
    seen = set()
    final_videos = []
    for v in fixed_videos:
        if v['id'] not in seen:
            seen.add(v['id'])
            final_videos.append(v)

    with open('src/data/seed/video-library/index.json', 'w', encoding='utf-8') as f:
        json.dump(final_videos, f, indent=1, ensure_ascii=False)
        f.write('\n')

    print(f"Successfully updated library! Total videos: {len(final_videos)}. Replaced {replaced_count} broken thumbnails.")

if __name__ == '__main__':
    main()
