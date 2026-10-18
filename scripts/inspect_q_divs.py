import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('C:/Users/admin/Downloads/SAT-Reading-Writing-16-tuan.html', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

# Find first 3 <div class="q">
matches = list(re.finditer(r'<div class="q">(.*?)</div>\s*(?=<div class="q">|<h[123]|<div class="ans"|$)', text, re.DOTALL))
print(f"Total q divs found: {len(matches)}")
for i, m in enumerate(matches[:3]):
    print(f"\n--- Question {i+1} ---")
    content = m.group(1).strip()
    print(content[:500])
