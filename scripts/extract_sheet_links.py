import urllib.request
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")

url = 'https://docs.google.com/spreadsheets/d/1eCZ7lVpWyfIM3Q3kWZoN-LoN96j_eHFl_YVW6ZLmtkA/htmlview?gid=415923450'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as resp:
        html = resp.read().decode('utf-8')
        print(f"HTML length: {len(html)}")
        with open("scripts/sheet.html", "w", encoding="utf-8") as f:
            f.write(html)
        
        # Match any google drive or document links
        drive_links = re.findall(r'https?://[^\s\"\'<>]+(?:drive\.google|docs\.google|dropbox|satsuite)[^\s\"\'<>]*', html)
        print(f"Found {len(drive_links)} cloud/drive links:")
        for l in set(drive_links):
            print("  ", l)
            
        links = re.findall(r'<a[^>]+href="([^"]+)"[^>]*>(.*?)</a>', html, re.DOTALL)
        print(f"\nFound {len(links)} <a> tags:")
        for href, text in links:
            clean_text = re.sub(r'<[^>]+>', '', text).strip()
            if clean_text:
                print(f"  [{clean_text}] -> {href}")

except Exception as e:
    print("Error:", e)
