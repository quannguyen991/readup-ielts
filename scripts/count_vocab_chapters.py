import re
import sys

sys.stdout.reconfigure(encoding="utf-8")

with open('C:/Users/admin/Downloads/SAT-Reading-Writing-16-tuan.html', 'r', encoding='utf-8', errors='ignore') as f:
    rw_text = f.read()

# For each chapter from 27 to 45, extract words
for ch_num in range(27, 46):
    start_tag = f"@@ch{ch_num}@@"
    end_tag = f"@@ch{ch_num+1}@@" if ch_num < 45 else "@@ch46@@"
    
    start_idx = rw_text.find(start_tag)
    end_idx = rw_text.find(end_tag)
    if start_idx == -1 or end_idx == -1:
        continue
        
    ch_text = rw_text[start_idx:end_idx]
    
    # Extract title
    h2 = re.search(r'<h2[^>]*>(.*?)</h2>', ch_text)
    title = re.sub(r'<[^>]+>', '', h2.group(1)).strip() if h2 else f"Chương {ch_num}"
    
    # Count table rows
    rows = re.findall(r'<tr>(.*?)</tr>', ch_text)
    # Filter header rows
    data_rows = [r for r in rows if '<th>' not in r and '<td>' in r]
    
    print(f"Chương {ch_num}: {title} -> {len(data_rows)} items")
