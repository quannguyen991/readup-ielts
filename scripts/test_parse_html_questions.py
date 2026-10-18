import re
import json
import sys

sys.stdout.reconfigure(encoding="utf-8")

with open('C:/Users/admin/Downloads/SAT-Reading-Writing-16-tuan.html', 'r', encoding='utf-8', errors='ignore') as f:
    rw_text = f.read()

# Find answer keys in HTML
# There's a table for each set, e.g. "Đáp án Bộ F — câu 1 → 27", and inline answer explanations
# Let's search for all answer tables in the HTML
ans_tables = re.findall(r'<div class="bt">(Đáp án[^<]*)</div>\s*<table[^>]*>(.*?)</table>', rw_text, re.DOTALL)
print(f"Found {len(ans_tables)} answer tables")
for title, tbl in ans_tables:
    print(f"  * {title}")

# Find question divs
q_divs = re.findall(r'<div class="q">(.*?)</div>\s*(?=<div class="q">|<h[23]|\Z)', rw_text, re.DOTALL)
print(f"Found {len(q_divs)} question divs in RW HTML")

parsed_rw = []
for i, q in enumerate(q_divs):
    # Extract tag (skill)
    tag_match = re.search(r'<span class="tag">(.*?)</span>', q)
    tag = tag_match.group(1).strip() if tag_match else "Reading & Writing"
    
    # Extract passage
    pass_match = re.search(r'<div class="passage">(.*?)</div>', q, re.DOTALL)
    passage = re.sub(r'<[^>]+>', '', pass_match.group(1)).strip() if pass_match else ""
    
    # Extract options
    opts = re.findall(r'<li><span class="L">[A-D]</span>\s*(.*?)</li>', q, re.DOTALL)
    options = [re.sub(r'<[^>]+>', '', opt).strip() for opt in opts]
    
    # Extract stem
    stems = re.findall(r'<p class="stem">(.*?)</p>', q, re.DOTALL)
    stem_text = ""
    for st in stems:
        clean_st = re.sub(r'<[^>]+>', '', st).strip()
        # skip "Câu X. Words in Context"
        if not clean_st.startswith("Câu ") and len(clean_st) > 5:
            stem_text = clean_st
    if not stem_text:
        if "words in context" in tag.lower():
            stem_text = "Which choice completes the text with the most logical and precise word or phrase?"
        else:
            stem_text = "Which choice best completes or answers the question?"
            
    if len(options) == 4 and passage:
        parsed_rw.append({
            "id": f"sat-curriculum-rw-{len(parsed_rw)+1:03d}",
            "tag": tag,
            "passage": passage,
            "stem": stem_text,
            "options": options
        })

print(f"Successfully extracted {len(parsed_rw)} complete 4-option R&W questions!")
