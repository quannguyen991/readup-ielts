import re
import json
import sys

sys.stdout.reconfigure(encoding="utf-8")

with open('C:/Users/admin/Downloads/SAT-Reading-Writing-16-tuan.html', 'r', encoding='utf-8', errors='ignore') as f:
    rw_text = f.read()

# 1. Parse Chapter 27: Tầng 1 — 300 từ lõi (10 groups x 30 words)
pos27 = rw_text.find("@@ch27@@")
pos28 = rw_text.find("@@ch28@@")
ch27_text = rw_text[pos27:pos28]

ch27_groups = re.findall(r'<h3>(27\.\d+[^<]*)</h3>\s*<table class="vocab">(.*?)</table>', ch27_text, re.DOTALL)
print(f"Ch27 groups found: {len(ch27_groups)}")

decks = []

for i, (g_title_raw, g_table) in enumerate(ch27_groups):
    g_title = re.sub(r'<[^>]+>', '', g_title_raw).strip()
    # e.g., "27.1 · Nhóm 1 — Lập luận, bằng chứng, nghiên cứu"
    short_title = g_title.split('—')[-1].strip() if '—' in g_title else g_title
    
    rows = re.findall(r'<tr><td>(.*?)</td><td>(.*?)</td><td>(.*?)</td><td>(.*?)</td></tr>', g_table)
    words = []
    seen = set()
    for w_raw, pos_raw, def_raw, col_raw in rows:
        w = re.sub(r'<[^>]+>', '', w_raw).strip()
        pos = re.sub(r'<[^>]+>', '', pos_raw).strip()
        meaning = re.sub(r'<[^>]+>', '', def_raw).strip()
        col = re.sub(r'<[^>]+>', '', col_raw).strip()
        
        w_clean = re.sub(r'[\/·].*$', '', w).strip()
        if not w_clean or w_clean.lower() in seen:
            continue
        seen.add(w_clean.lower())
        
        words.append({
            "word": w_clean,
            "pos": pos,
            "definitionEn": col,
            "meaningVi": meaning,
            "collocation": col,
            "example": f"Context: {col}",
            "ipa": "",
            "band": "Tầng 1 · 300 từ lõi SAT",
            "synonyms": [],
            "antonyms": []
        })
        
    slug = f"sat-tang-1-unit-{i+1:02d}"
    decks.append({
        "slug": slug,
        "subject": "verbal",
        "title": f"Tầng 1 · Unit {i+1}: {short_title}",
        "blurb": f"{len(words)} từ lõi · " + ', '.join([w['word'] for w in words[:4]]) + '…',
        "sourceBook": "SAT R&W 16 tuần · Tầng 1 (300 từ lõi)",
        "words": words
    })

print(f"Generated {len(decks)} decks for Chapter 27 (Tầng 1)")
for d in decks:
    print(f"  * {d['slug']}: {len(d['words'])} words")
