import re
import sys

sys.stdout.reconfigure(encoding="utf-8")

with open('C:/Users/admin/Downloads/SAT-Reading-Writing-16-tuan.html', 'r', encoding='utf-8', errors='ignore') as f:
    rw_text = f.read()

# Search for chapters 48 to 54
for ch in range(48, 55):
    pos = rw_text.find(f"@@ch{ch}@@")
    if pos != -1:
        snippet = rw_text[pos:pos+1500]
        h2 = re.search(r'<h2[^>]*>(.*?)</h2>', snippet)
        print(f"Ch {ch} at {pos}: {h2.group(1) if h2 else 'No H2'}")
