import urllib.request
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor

ROOT = Path(__file__).resolve().parents[2]
PRIVATE = ROOT / ".local-private" / "ielts-ocr"

vol_audio = [
    # Vol 7 (Folder 1)
    ("vol-7-listening-1", "http://media.intergreat.com/Audio/Simulation/1/Practice%20Test%201.mp3", "vol7-listening-test1.mp3"),
    ("vol-7-listening-2", "http://media.intergreat.com/Audio/Simulation/1/Practice%20Test%202.mp3", "vol7-listening-test2.mp3"),
    ("vol-7-listening-3", "http://media.intergreat.com/Audio/Simulation/1/Practice%20Test%203.mp3", "vol7-listening-test3.mp3"),
    ("vol-7-listening-4", "http://media.intergreat.com/Audio/Simulation/1/Practice%20Test%204.mp3", "vol7-listening-test4.mp3"),
    # Vol 8 (Folder 2)
    ("vol-8-listening-1", "http://media.intergreat.com/Audio/Simulation/2/Practice%20Test%201.mp3", "vol8-listening-test1.mp3"),
    ("vol-8-listening-2", "http://media.intergreat.com/Audio/Simulation/2/Practice%20Test%202.mp3", "vol8-listening-test2.mp3"),
    ("vol-8-listening-3", "http://media.intergreat.com/Audio/Simulation/2/Practice%20Test%203.mp3", "vol8-listening-test3.mp3"),
    ("vol-8-listening-4", "http://media.intergreat.com/Audio/Simulation/2/Practice%20Test%204.mp3", "vol8-listening-test4.mp3"),
]

def dl_vol(item):
    tid, url, fname = item
    dest = PRIVATE / fname
    if dest.exists() and dest.stat().st_size > 1000000:
        return fname, "exists"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=40) as resp:
            data = resp.read()
            dest.write_bytes(data)
            return fname, f"downloaded {len(data)} bytes"
    except Exception as e:
        return fname, f"error: {e}"

with ThreadPoolExecutor(max_workers=4) as ex:
    for fname, msg in ex.map(dl_vol, vol_audio):
        print(f"{fname}: {msg}")
