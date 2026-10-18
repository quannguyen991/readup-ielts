import re
import sys

sys.stdout.reconfigure(encoding="utf-8")

with open('C:/Users/admin/Downloads/SAT-Math-20-tuan.html', 'r', encoding='utf-8', errors='ignore') as f:
    math_text = f.read()

pos41 = math_text.find("@@ch41@@")
print("pos41:", pos41)
if pos41 != -1:
    print(math_text[pos41:pos41+2500])
