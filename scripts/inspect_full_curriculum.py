import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

for path, name in [
    ('C:/Users/admin/Downloads/SAT-Reading-Writing-16-tuan.html', 'R&W 16 Tuan'),
    ('C:/Users/admin/Downloads/SAT-Math-20-tuan.html', 'Math 20 Tuan')
]:
    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
        text = f.read()
    h1s = re.findall(r'<h1[^>]*>(.*?)</h1>', text)
    h2s = re.findall(r'<h2[^>]*>(.*?)</h2>', text)
    qs = len(re.findall(r'class=[\'"]q[\'"]', text))
    print(f'=== {name} === len:{len(text)} qs:{qs} h1s:{len(h1s)} h2s:{len(h2s)}')
    print('H2 sample:', [re.sub(r'<[^>]+>', '', h).strip() for h in h2s[:10]])
