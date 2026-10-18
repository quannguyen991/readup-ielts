import re
import sys

sys.stdout.reconfigure(encoding="utf-8")

with open('C:/Users/admin/Downloads/SAT-Reading-Writing-16-tuan.html', 'r', encoding='utf-8', errors='ignore') as f:
    rw_text = f.read()

# Look for answer explanations, e.g., "Đáp án Câu 1" or "Giải thích Câu 1" or "Đáp án và giải thích"
matches = list(re.finditer(r'(?:Đáp án|Giải thích|Lời giải|Answer).*?Câu 1', rw_text, re.IGNORECASE))
print(f"Matches for answer section: {len(matches)}")
for m in matches[:5]:
    print("--- MATCH AT", m.start())
    print(rw_text[m.start():m.start()+600])
