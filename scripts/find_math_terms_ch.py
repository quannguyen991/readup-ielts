import re
import sys

sys.stdout.reconfigure(encoding="utf-8")

with open('C:/Users/admin/Downloads/SAT-Math-20-tuan.html', 'r', encoding='utf-8', errors='ignore') as f:
    math_text = f.read()

matches = [m.start() for m in re.finditer(r'200 thuật ngữ', math_text)]
print("Matches for 200 thuật ngữ:", matches)
if len(matches) > 1:
    pos = matches[1]
    print(math_text[pos:pos+3000])
