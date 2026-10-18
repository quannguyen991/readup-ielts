import re
import sys

sys.stdout.reconfigure(encoding="utf-8")

with open('C:/Users/admin/Downloads/SAT-Reading-Writing-16-tuan.html', 'r', encoding='utf-8', errors='ignore') as f:
    rw_text = f.read()

# For each <div class="q">, find preceding h2
matches = list(re.finditer(r'<div class="q">', rw_text))
print(f"Total <div class=\"q\">: {len(matches)}")

for i, m in enumerate(matches):
    preceding = rw_text[:m.start()]
    h2 = re.findall(r'<h2[^>]*>(.*?)</h2>', preceding)
    last_h2 = re.sub(r'<[^>]+>', '', h2[-1]).strip() if h2 else 'No H2'
    if i in [0, 10, 24, 38, 58, 88, 100, 112]:
        print(f"Question #{i+1} under: {last_h2}")
