import re
import json
import sys

sys.stdout.reconfigure(encoding="utf-8")

with open('C:/Users/admin/Downloads/SAT-Reading-Writing-16-tuan.html', 'r', encoding='utf-8', errors='ignore') as f:
    rw_text = f.read()

# 1. Keep original 11 decks from Erica Meltzer & Princeton Review
with open('src/data/lessons/sat-book-vocab.json', 'r', encoding='utf-8') as f:
    existing = json.load(f)

orig_slugs = [
    'sat-critical-reader-passage', 'sat-critical-reader-context',
    'sat-critical-reader-writing', 'sat-critical-reader-confused-1',
    'sat-critical-reader-confused-2', 'sat-princeton-cram',
    'sat-princeton-glossary-1', 'sat-princeton-glossary-2',
    'sat-princeton-glossary-3', 'sat-princeton-glossary-4',
    'sat-princeton-glossary-5'
]
orig_decks = [d for d in existing if d['slug'] in orig_slugs]
print(f"Original 11 decks retained: {len(orig_decks)}")

all_new_decks = []

# 2. Extract Chapter 27: Tầng 1 — 300 từ lõi (10 groups x 30 words)
pos27 = rw_text.find("@@ch27@@")
pos28 = rw_text.find("@@ch28@@")
ch27_text = rw_text[pos27:pos28]

ch27_groups = re.findall(r'<h3>(27\.\d+[^<]*)</h3>\s*<table class="vocab">(.*?)</table>', ch27_text, re.DOTALL)
for i, (g_title_raw, g_table) in enumerate(ch27_groups):
    g_title = re.sub(r'<[^>]+>', '', g_title_raw).strip()
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
    all_new_decks.append({
        "slug": slug,
        "subject": "verbal",
        "title": f"Tầng 1 · Unit {i+1}: {short_title}",
        "blurb": f"{len(words)} từ lõi · " + ', '.join([w['word'] for w in words[:4]]) + '…',
        "sourceBook": "SAT R&W 16 tuần · Tầng 1 (300 từ lõi)",
        "words": words
    })

print(f"Added {len(ch27_groups)} decks for Chapter 27 (Tầng 1)")

# 3. Extract Chapter 28: Tầng 2 — 220 từ đa nghĩa (split into 6 units of ~38 words)
pos29 = rw_text.find("@@ch29@@")
ch28_text = rw_text[pos28:pos29]

ch28_rows = re.findall(r'<tr><td>(.*?)</td><td>(.*?)</td><td>(.*?)</td></tr>', ch28_text)
words_ch28 = []
seen_ch28 = set()
for w_raw, sat_raw, ex_raw in ch28_rows:
    w = re.sub(r'<[^>]+>', '', w_raw).strip()
    sat_m = re.sub(r'<[^>]+>', '', sat_raw).strip()
    ex = re.sub(r'<[^>]+>', '', ex_raw).strip()
    w_clean = re.sub(r'[\/·].*$', '', w).strip()
    if not w_clean or w_clean.lower() in seen_ch28:
        continue
    seen_ch28.add(w_clean.lower())
    words_ch28.append({
        "word": w_clean,
        "pos": "đa nghĩa",
        "definitionEn": f"SAT meaning: {sat_m}",
        "meaningVi": f"Nghĩa SAT: {sat_m}",
        "collocation": sat_m,
        "example": ex,
        "ipa": "",
        "band": "Tầng 2 · 220 từ đa nghĩa",
        "synonyms": [],
        "antonyms": []
    })

# Split words_ch28 into 6 parts
chunk_size = len(words_ch28) // 6
for i in range(6):
    part = words_ch28[i*chunk_size : (i+1)*chunk_size] if i < 5 else words_ch28[i*chunk_size :]
    slug = f"sat-tang-2-unit-{i+1:02d}"
    all_new_decks.append({
        "slug": slug,
        "subject": "verbal",
        "title": f"Tầng 2 · Unit {i+1}: Từ đa nghĩa SAT (Phần {i+1})",
        "blurb": f"{len(part)} từ đa nghĩa · " + ', '.join([w['word'] for w in part[:4]]) + '…',
        "sourceBook": "SAT R&W 16 tuần · Tầng 2 (220 từ đa nghĩa)",
        "words": part
    })

print(f"Added 6 decks for Chapter 28 (Tầng 2), total {len(words_ch28)} words")

# 4. Extract Chapter 29: Tầng 3 — 180 động từ chức năng (split into 4 units of ~36 words)
pos30 = rw_text.find("@@ch30@@")
ch29_text = rw_text[pos29:pos30]

ch29_rows = re.findall(r'<tr><td>(.*?)</td><td>(.*?)</td><td>(.*?)</td></tr>', ch29_text)
words_ch29 = []
seen_ch29 = set()
for w_raw, m_raw, use_raw in ch29_rows:
    w = re.sub(r'<[^>]+>', '', w_raw).strip()
    meaning = re.sub(r'<[^>]+>', '', m_raw).strip()
    usage = re.sub(r'<[^>]+>', '', use_raw).strip()
    w_clean = re.sub(r'[\/·].*$', '', w).strip()
    if not w_clean or w_clean.lower() in seen_ch29:
        continue
    seen_ch29.add(w_clean.lower())
    words_ch29.append({
        "word": w_clean,
        "pos": "verb",
        "definitionEn": f"Rhetorical function: {usage}",
        "meaningVi": meaning,
        "collocation": usage,
        "example": f"Use case: {usage}",
        "ipa": "",
        "band": "Tầng 3 · 180 động từ chức năng",
        "synonyms": [],
        "antonyms": []
    })

chunk_size = len(words_ch29) // 4
for i in range(4):
    part = words_ch29[i*chunk_size : (i+1)*chunk_size] if i < 3 else words_ch29[i*chunk_size :]
    slug = f"sat-tang-3-unit-{i+1:02d}"
    all_new_decks.append({
        "slug": slug,
        "subject": "verbal",
        "title": f"Tầng 3 · Unit {i+1}: Động từ chức năng (Phần {i+1})",
        "blurb": f"{len(part)} động từ tu từ · " + ', '.join([w['word'] for w in part[:4]]) + '…',
        "sourceBook": "SAT R&W 16 tuần · Tầng 3 (180 động từ chức năng)",
        "words": part
    })

print(f"Added 4 decks for Chapter 29 (Tầng 3), total {len(words_ch29)} words")

# 5. Extract Chapters 31-42: 12 Chủ đề học thuật (each chapter is 1 deck)
topic_names = [
    ("Science & Research Methods", "Khoa học & Phương pháp nghiên cứu"),
    ("Biology, Ecology & Environment", "Sinh học & Môi trường"),
    ("History, Politics & Founding Documents", "Lịch sử & Chính trị"),
    ("Economics, Business & Labor", "Kinh tế & Thị trường lao động"),
    ("Psychology, Cognition & Behavior", "Tâm lý học & Nhận thức"),
    ("Literature, Poetry & Narrative Craft", "Văn học & Nghệ thuật tự sự"),
    ("Art, Music & Aesthetics", "Nghệ thuật & Mỹ học"),
    ("Technology, Engineering & Space", "Công nghệ & Vũ trụ"),
    ("Anthropology, Archaeology & Culture", "Nhân chủng & Văn hoá"),
    ("Language, Rhetoric & Media", "Ngôn ngữ & Truyền thông"),
    ("Medicine, Health & the Body", "Y học & Sức khoẻ"),
    ("Law, Ethics & Social Movements", "Luật pháp & Xã hội")
]

for ch_idx, (en_name, vi_name) in enumerate(topic_names, start=31):
    start_tag = f"@@ch{ch_idx}@@"
    end_tag = f"@@ch{ch_idx+1}@@"
    s_pos = rw_text.find(start_tag)
    e_pos = rw_text.find(end_tag)
    if s_pos == -1 or e_pos == -1:
        continue
    topic_text = rw_text[s_pos:e_pos]
    t_rows = re.findall(r'<tr><td>(.*?)</td><td>(.*?)</td><td>(.*?)</td></tr>', topic_text)
    
    words_topic = []
    seen_topic = set()
    for w_raw, m_raw, ex_raw in t_rows:
        w = re.sub(r'<[^>]+>', '', w_raw).strip()
        meaning = re.sub(r'<[^>]+>', '', m_raw).strip()
        ex = re.sub(r'<[^>]+>', '', ex_raw).strip()
        w_clean = re.sub(r'[\/·].*$', '', w).strip()
        if not w_clean or w_clean.lower() in seen_topic:
            continue
        seen_topic.add(w_clean.lower())
        words_topic.append({
            "word": w_clean,
            "pos": "academic",
            "definitionEn": ex,
            "meaningVi": meaning,
            "collocation": ex,
            "example": ex,
            "ipa": "",
            "band": f"Chủ đề {ch_idx-30} · {en_name}",
            "synonyms": [],
            "antonyms": []
        })
        
    slug = f"sat-chude-{ch_idx-30:02d}"
    all_new_decks.append({
        "slug": slug,
        "subject": "verbal",
        "title": f"Chủ đề {ch_idx-30}: {vi_name}",
        "blurb": f"{len(words_topic)} từ học thuật · " + ', '.join([w['word'] for w in words_topic[:4]]) + '…',
        "sourceBook": f"SAT R&W 16 tuần · {en_name}",
        "words": words_topic
    })

print(f"Added 12 decks for Chapters 31-42 (12 Chủ đề học thuật)")

# 6. Add Springboard Real Tests (3 decks) + 15k (1 deck) + 550 Words (1 deck)
# Load from existing sat-book-vocab.json
prev_new_slugs = ['sat-real-tests-2025-p1', 'sat-real-tests-2025-p2', 'sat-real-tests-2025-p3', 'sat-springboard-core', 'sat-550-digital-must-know']
prev_decks = [d for d in existing if d['slug'] in prev_new_slugs]
all_new_decks.extend(prev_decks)
print(f"Added {len(prev_decks)} previously created Springboard & 550 words decks")

# Combine all
full_catalog = orig_decks + all_new_decks

print(f"\nTotal decks compiled: {len(full_catalog)} decks")
# Check all constraints
for d in full_catalog:
    w_len = len(d['words'])
    uniq_len = len(set(w['word'].lower() for w in d['words']))
    if not (30 <= w_len <= 60):
        print(f"WARNING: {d['slug']} count is {w_len}")
    if uniq_len != w_len:
        print(f"WARNING: {d['slug']} duplicate words: {w_len} vs {uniq_len}")

with open('src/data/lessons/sat-book-vocab.json', 'w', encoding='utf-8') as f:
    json.dump(full_catalog, f, ensure_ascii=False, indent=2)

print("SUCCESS: Updated src/data/lessons/sat-book-vocab.json with all curriculum decks!")
