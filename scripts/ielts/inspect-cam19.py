import sys
sys.stdout.reconfigure(encoding='utf-8')
import urllib.request
import re

url = 'https://onthiielts.com.vn/ielts-cambridge-19/'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
with urllib.request.urlopen(req, timeout=15) as resp:
    html = resp.read().decode('utf-8', errors='ignore')
    match = re.search(r'id=["\']4_Download_mien_phi_sach_IELTS_Cambridge_19_PDF["\'].*?(?=id=["\']5_)', html, flags=re.DOTALL)
    if match:
        print(match.group(0))
