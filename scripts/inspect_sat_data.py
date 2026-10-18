import json
import sys

sys.stdout.reconfigure(encoding="utf-8")

with open('src/data/lessons/sat-book-vocab.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print(f"Total collections in sat-book-vocab.json: {len(data)}")
for c in data:
    print(f"- {c['slug']}: {c['title']} ({len(c['words'])} words)")
