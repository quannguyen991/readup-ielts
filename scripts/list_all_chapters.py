import re
import sys

sys.stdout.reconfigure(encoding="utf-8")

with open('C:/Users/admin/Downloads/SAT-Reading-Writing-16-tuan.html', 'r', encoding='utf-8', errors='ignore') as f:
    rw_text = f.read()

ch_markers = re.findall(r'@@ch\d+@@', rw_text)
print("Chapter markers in RW HTML:", ch_markers)
