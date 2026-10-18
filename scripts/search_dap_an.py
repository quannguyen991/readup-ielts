import re
import sys

sys.stdout.reconfigure(encoding="utf-8")

with open('C:/Users/admin/Downloads/SAT-Reading-Writing-16-tuan.html', 'r', encoding='utf-8', errors='ignore') as f:
    rw_text = f.read()

# Search for "Đáp án" occurrences
matches = list(re.finditer(r'Đáp án', rw_text))
print("Matches for 'Đáp án':", len(matches))
for m in matches[:10]:
    print("--- at", m.start())
    print(rw_text[m.start():m.start()+300])
