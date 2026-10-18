import re
import sys

sys.stdout.reconfigure(encoding="utf-8")

with open('C:/Users/admin/Downloads/SAT-Reading-Writing-16-tuan.html', 'r', encoding='utf-8', errors='ignore') as f:
    rw_text = f.read()

pos47 = rw_text.find("@@ch47@@")
print("pos47:", pos47)
ch47_text = rw_text[pos47:]

h2s = re.findall(r'<h2[^>]*>(.*?)</h2>', ch47_text)
print("Ch47 H2s:", [re.sub(r'<[^>]+>', '', h).strip() for h in h2s])

h3s = re.findall(r'<h3[^>]*>(.*?)</h3>', ch47_text)
print("Ch47 H3s:", [re.sub(r'<[^>]+>', '', h).strip() for h in h3s[:15]])

q_count = len(re.findall(r'<div class="q">', ch47_text))
print("Questions in Ch47:", q_count)
