import re
import sys

sys.stdout.reconfigure(encoding="utf-8")

with open('C:/Users/admin/Downloads/SAT-Math-20-tuan.html', 'r', encoding='utf-8', errors='ignore') as f:
    math_text = f.read()

pos13 = math_text.find("200 thuật ngữ toán theo chủ đề")
print("pos13:", pos13)
if pos13 != -1:
    snippet = math_text[pos13:pos13+3000]
    tables = re.findall(r'<table[^>]*>(.*?)</table>', snippet, re.DOTALL)
    print("Tables in snippet:", len(tables))
    if tables:
        rows = re.findall(r'<tr>(.*?)</tr>', tables[0])
        print("Rows in table 0:", len(rows))
        for r in rows[:5]:
            cells = [re.sub(r'<[^>]+>', '', c).strip() for c in re.findall(r'<td[^>]*>(.*?)</td>', r)]
            print("  Row:", cells)
