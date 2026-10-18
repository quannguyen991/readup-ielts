import json
import sys

sys.stdout.reconfigure(encoding="utf-8")

with open('src/data/lessons/sat-book-vocab.json', 'r', encoding='utf-8') as f:
    decks = json.load(f)

# Group the 37 curriculum decks
tang1 = [d for d in decks if d['slug'].startswith('sat-tang-1-')]
tang2 = [d for d in decks if d['slug'].startswith('sat-tang-2-')]
tang3 = [d for d in decks if d['slug'].startswith('sat-tang-3-')]
topics = [d for d in decks if d['slug'].startswith('sat-chude-')]
real_spring = [d for d in decks if d['slug'] in ['sat-real-tests-2025-p1', 'sat-real-tests-2025-p2', 'sat-real-tests-2025-p3', 'sat-springboard-core', 'sat-550-digital-must-know']]
books = [d for d in decks if d['slug'].startswith('sat-critical-') or d['slug'].startswith('sat-princeton-')]

print(f"Tầng 1: {len(tang1)} decks ({sum(len(d['words']) for d in tang1)} words)")
print(f"Tầng 2: {len(tang2)} decks ({sum(len(d['words']) for d in tang2)} words)")
print(f"Tầng 3: {len(tang3)} decks ({sum(len(d['words']) for d in tang3)} words)")
print(f"Topics: {len(topics)} decks ({sum(len(d['words']) for d in topics)} words)")
print(f"Real & Springboard: {len(real_spring)} decks ({sum(len(d['words']) for d in real_spring)} words)")
print(f"Original Books: {len(books)} decks ({sum(len(d['words']) for d in books)} words)")
print(f"TOTAL: {len(decks)} decks ({sum(len(d['words']) for d in decks)} words)")
