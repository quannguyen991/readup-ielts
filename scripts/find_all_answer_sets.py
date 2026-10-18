import re
import sys

sys.stdout.reconfigure(encoding="utf-8")

with open('C:/Users/admin/Downloads/SAT-Reading-Writing-16-tuan.html', 'r', encoding='utf-8', errors='ignore') as f:
    rw_text = f.read()

matches = list(re.finditer(r'Đáp án Bộ\s+([A-Z])', rw_text))
print(f"Matches for 'Đáp án Bộ': {len(matches)}")
for m in matches:
    print("---", m.group(0), "at", m.start())
    print(rw_text[m.start():m.start()+400])
