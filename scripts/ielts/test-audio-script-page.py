import urllib.request
import re

url = 'https://ieltstrainingonline.com/audio-script-cambridge-ielts-10-listening-test-01/'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req, timeout=10) as r:
        html = r.read().decode('utf-8', errors='ignore')
        print("Success! Length:", len(html))
        # Look for Q1, Q2, or bolding
        q_matches = re.findall(r'(?:Q\d+|Question\s*\d+|\[\d+\]|\(\d+\))', html, re.I)
        print("Q matches:", len(q_matches), q_matches[:10])
        # Look for patterns like (1) or [Q1] or Answer
        matches = re.findall(r'(\[[^\]]+\]|\([0-9]+\)|Q\d+)', html)
        print("Marker matches:", len(matches), matches[:10])
        # Look for bold tags
        bolds = re.findall(r'<strong>(.*?)</strong>', html)
        print("Bolds count:", len(bolds))
        for b in bolds[:15]:
            print(" ", re.sub(r'<[^>]+>', '', b).strip())
except Exception as e:
    print("Error:", e)
