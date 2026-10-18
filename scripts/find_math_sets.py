import re
import sys

sys.stdout.reconfigure(encoding="utf-8")

with open('C:/Users/admin/Downloads/SAT-Math-20-tuan.html', 'r', encoding='utf-8', errors='ignore') as f:
    math_text = f.read()

pos = math_text.find("Algebra — 24 câu")
print("Position:", pos)
if pos != -1:
    print(math_text[pos:pos+2500])
