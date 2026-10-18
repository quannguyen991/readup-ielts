import re
import sys

sys.stdout.reconfigure(encoding="utf-8")

with open('C:/Users/admin/Downloads/SAT-Reading-Writing-16-tuan.html', 'r', encoding='utf-8', errors='ignore') as f:
    rw_text = f.read()

pos = 650000
chunk = rw_text[pos:pos+50000]
h2s = re.findall(r'<h2[^>]*>(.*?)</h2>', chunk)
print("H2s in chunk:", h2s)
titles = re.findall(r'<div class="bt">(.*?)</div>', chunk)
print("Box titles in chunk:", titles)
