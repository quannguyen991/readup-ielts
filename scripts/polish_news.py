import json, re

with open('src/data/seed/wiki-news/index.json', 'r', encoding='utf-8') as f:
    wiki = json.load(f)

for item in wiki:
    if not item.get('details') or len(item['details']) == 0:
        text = item['headline'].strip()
        # Look for sentence boundary
        parts = re.split(r'(?<=[.!?])\s+(?=[A-Z0-9"\'“])', text, maxsplit=1)
        if len(parts) == 2 and len(parts[0]) >= 20:
            item['headline'] = parts[0].strip()
            item['details'] = [parts[1].strip()]
        else:
            item['details'] = [text]

with open('src/data/seed/wiki-news/index.json', 'w', encoding='utf-8') as f:
    json.dump(wiki, f, indent=2, ensure_ascii=False)
    f.write('\n')

empty_count = sum(1 for w in wiki if not w.get('details') or len(w['details']) == 0)
print(f"Polished {len(wiki)} news articles. Empty details count: {empty_count}")
