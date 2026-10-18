import re
import sys

sys.stdout.reconfigure(encoding="utf-8")

with open('C:/Users/admin/Downloads/SAT-Math-20-tuan.html', 'r', encoding='utf-8', errors='ignore') as f:
    math_text = f.read()

matches = list(re.finditer(r'<div class="q">', math_text))
print(f"Total <div class=\"q\"> in Math HTML: {len(matches)}")

for i in [0, 20, 44, 68, 82, 96, 118, len(matches)-1]:
    if i < len(matches):
        m = matches[i]
        preceding = math_text[:m.start()]
        h2 = re.findall(r'<h2[^>]*>(.*?)</h2>', preceding)
        last_h2 = re.sub(r'<[^>]+>', '', h2[-1]).strip() if h2 else 'No H2'
        print(f"Math Question #{i+1} under: {last_h2}")
