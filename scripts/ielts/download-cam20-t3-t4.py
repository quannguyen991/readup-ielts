import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PRIVATE = ROOT / ".local-private" / "ielts-ocr"

for t in [3, 4]:
    for p in [1, 2, 3, 4]:
        fname = f"cambridge20-listening-test{t}-part{p}.mp3"
        dest = PRIVATE / fname
        if dest.exists() and dest.stat().st_size > 20000:
            print(f"{fname} already exists")
            continue
        # Try different URL casings
        urls = [
            f"https://ieltstrainingonline.com/wp-content/uploads/2025/07/cam20-test{t}-part{p}.MP3",
            f"https://ieltstrainingonline.com/wp-content/uploads/2025/07/cam20-test{t}-part{p}.mp3",
            f"https://ieltstrainingonline.com/wp-content/uploads/2024/07/cam20-test{t}-part{p}.mp3",
            f"https://ieltstrainingonline.com/wp-content/uploads/2024/07/cam20-test{t}-part{p}.MP3"
        ]
        downloaded = False
        for url in urls:
            try:
                req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req, timeout=15) as resp:
                    data = resp.read()
                    dest.write_bytes(data)
                    print(f"Downloaded {fname} from {url} ({len(data)} bytes)")
                    downloaded = True
                    break
            except Exception as e:
                pass
        if not downloaded:
            print(f"Failed to download {fname}")
