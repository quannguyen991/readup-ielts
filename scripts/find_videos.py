import urllib.request
import re
from youtube_transcript_api import YouTubeTranscriptApi

yt = YouTubeTranscriptApi()

channels = [
    ('CNN', 'https://www.youtube.com/@CNN/videos'),
    ('BBC News', 'https://www.youtube.com/@BBCNews/videos'),
    ('Vietnam Today', 'https://www.youtube.com/@vietnamtodayinternational/videos'),
    ('TED-Ed', 'https://www.youtube.com/@TEDEd/videos'),
    ('BBC Learning English', 'https://www.youtube.com/@bbclearningenglish/videos')
]

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}

for name, ch_url in channels:
    print(f"\nChecking channel {name}...")
    try:
        req = urllib.request.Request(ch_url, headers=headers)
        with urllib.request.urlopen(req, timeout=12) as res:
            html = res.read().decode('utf-8', errors='ignore')
        
        matches = list(dict.fromkeys(re.findall(r'"videoId":"([A-Za-z0-9_-]{11})"', html)))
        print(f"Found {len(matches)} video candidates for {name}")
        
        valid = []
        for vid in matches[:10]:
            try:
                cues = yt.fetch(vid)
                valid.append((vid, len(cues)))
                print(f"  [OK] {vid} has {len(cues)} cues")
                if len(valid) >= 4:
                    break
            except Exception as e:
                # print(f"  [FAIL] {vid}: {e}")
                pass
    except Exception as e:
        print(f"Error accessing channel {name}: {e}")
