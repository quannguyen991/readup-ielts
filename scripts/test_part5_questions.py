import re
import json
import sys
from collections import Counter

sys.stdout.reconfigure(encoding="utf-8")

with open('C:/Users/admin/Downloads/SAT-Reading-Writing-16-tuan.html', 'r', encoding='utf-8', errors='ignore') as f:
    rw_text = f.read()

# Let's inspect the questions in Part V (Luyện đề có giải chi tiết)
q_pos = rw_text.find('Phần V')
if q_pos == -1:
    q_pos = rw_text.find('Luyện đề có giải chi tiết')

print(f"Part V found at: {q_pos}")
if q_pos != -1:
    part5_text = rw_text[q_pos:q_pos+100000]
    h2s = re.findall(r'<h2[^>]*>(.*?)</h2>', part5_text)
    print("Part V H2s:", [re.sub(r'<[^>]+>', '', h).strip() for h in h2s])
    
    # Check question tags or classes
    q_divs = re.findall(r'<div class=[\'\"]([^\'\"]*q[^\'\"]*)[\'\"]', part5_text)
    print("Question div classes in Part V:", Counter(q_divs))
