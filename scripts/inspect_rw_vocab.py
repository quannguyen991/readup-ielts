import re
import sys

sys.stdout.reconfigure(encoding="utf-8")

with open('C:/Users/admin/Downloads/SAT-Reading-Writing-16-tuan.html', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

# Find all chapters in Part IV (Vocabulary)
matches = re.findall(r'<h3[^>]*>(.*?)</h3>\s*<table class="vocab">(.*?)</table>', text, re.DOTALL)
print(f"Total vocab sub-sections with tables: {len(matches)}")

grand_total = 0
sections_summary = []
for title_raw, table_html in matches:
    title = re.sub(r'<[^>]+>', '', title_raw).strip()
    rows = re.findall(r'<tr><td>(.*?)</td><td>(.*?)</td><td>(.*?)</td><td>(.*?)</td></tr>', table_html)
    grand_total += len(rows)
    sections_summary.append((title, len(rows)))

for t, c in sections_summary:
    print(f"  * {t}: {c} words")

print(f"\nGRAND TOTAL VOCABULARY: {grand_total} words")
