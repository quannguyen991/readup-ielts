import urllib.request
import re

url = 'https://ieltstrainingonline.com/audioscripts-cam-10-listening-test-01/'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req, timeout=10) as r:
        html = r.read().decode('utf-8', errors='ignore')
        print("Success! Length:", len(html))
        # Look for Q1, Q2, or bolding
        q_matches = re.findall(r'(?:Q\d+|Question\s*\d+|\[\d+\]|\(\d+\))', html, re.I)
        print("Q matches:", q_matches[:10])
        # Look for bold text
        bolds = re.findall(r'<strong>(.*?)</strong>', html)
        print("Bolds:", [re.sub(r'<[^>]+>', '', b).strip() for b in bolds[:15]])
except Exception as e:
    print("Error:", e)
