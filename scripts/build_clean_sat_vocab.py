import json
import csv
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")

# 1. Read existing original 11 decks from sat-book-vocab.json
with open('src/data/lessons/sat-book-vocab.json', 'r', encoding='utf-8') as f:
    decks = json.load(f)

orig_slugs = [
    'sat-critical-reader-passage', 'sat-critical-reader-context',
    'sat-critical-reader-writing', 'sat-critical-reader-confused-1',
    'sat-critical-reader-confused-2', 'sat-princeton-cram',
    'sat-princeton-glossary-1', 'sat-princeton-glossary-2',
    'sat-princeton-glossary-3', 'sat-princeton-glossary-4',
    'sat-princeton-glossary-5'
]
orig_decks = [d for d in decks if d['slug'] in orig_slugs]
print(f"Original decks retained: {len(orig_decks)}")

# 2. Parse real test words
with open('scripts/sat_vocab_real_tests.csv', 'r', encoding='utf-8') as f:
    rows = list(csv.reader(f))

real_words = []
seen = set()
for r in rows[4:]:
    if len(r) >= 8 and r[2].strip() and r[2].strip().lower() != 'word':
        w = r[2].strip().lower()
        if w in seen:
            continue
        seen.add(w)
        real_words.append({
            'word': r[2].strip(),
            'pos': 'words in context',
            'definitionEn': r[3].strip(),
            'example': r[7].strip(),
            'ipa': '',
            'band': 'Đề thi thật SAT 2024–2025',
            'meaningVi': r[4].strip(),
            'collocation': r[6].strip(),
            'synonyms': [s.strip() for s in r[5].replace(';', ',').split(',') if s.strip()],
            'antonyms': []
        })

p1 = real_words[:38]
p2 = real_words[38:76]
p3 = real_words[76:]

deck_p1 = {
    'slug': 'sat-real-tests-2025-p1',
    'subject': 'verbal',
    'title': 'Đề thi thật SAT 2024–2025 · Phần 1',
    'blurb': f'{len(p1)} từ · ' + ', '.join([w['word'] for w in p1[:4]]) + '…',
    'sourceBook': 'Springboard · Đề thi thật SAT 2024–2025',
    'words': p1
}

deck_p2 = {
    'slug': 'sat-real-tests-2025-p2',
    'subject': 'verbal',
    'title': 'Đề thi thật SAT 2024–2025 · Phần 2',
    'blurb': f'{len(p2)} từ · ' + ', '.join([w['word'] for w in p2[:4]]) + '…',
    'sourceBook': 'Springboard · Đề thi thật SAT 2024–2025',
    'words': p2
}

deck_p3 = {
    'slug': 'sat-real-tests-2025-p3',
    'subject': 'verbal',
    'title': 'Đề thi thật SAT 2024–2025 · Phần 3',
    'blurb': f'{len(p3)} từ · ' + ', '.join([w['word'] for w in p3[:4]]) + '…',
    'sourceBook': 'Springboard · Đề thi thật SAT 2024–2025',
    'words': p3
}

# 3. Parse 15k vocab
with open('scripts/sat_15k_vocab.txt', 'r', encoding='utf-8') as f:
    text_15k = f.read()

entries_15k = re.findall(r'(\d+)\.\s+([a-zA-Z\-]+)\s*\n+\(([a-z]+)\):\s*([^:\n]+):\s*([^\n~]+)\n+~\s*([^\n]+)\n+Ví dụ:\s*([^\n]+)', text_15k, re.IGNORECASE)
words_15k = []
seen_15k = set()
for stt, word, pos, def_en, def_vi, syns, ex in entries_15k:
    w = word.strip().lower()
    if w in seen_15k:
        continue
    seen_15k.add(w)
    words_15k.append({
        'word': word.strip(),
        'pos': pos.strip(),
        'definitionEn': def_en.strip(),
        'example': ex.strip(),
        'ipa': '',
        'band': 'SAT 15.000 Database',
        'meaningVi': def_vi.strip(),
        'collocation': '',
        'synonyms': [s.strip() for s in syns.split(',') if s.strip()],
        'antonyms': []
    })

deck_15k = {
    'slug': 'sat-springboard-core',
    'subject': 'verbal',
    'title': 'Từ vựng học thuật SAT 15.000 Database',
    'blurb': f'{len(words_15k)} từ · ' + ', '.join([w['word'] for w in words_15k[:4]]) + '…',
    'sourceBook': 'SAT 15.000 Database · Springboard',
    'words': words_15k
}

# 4. 550 Words to Know for Digital SAT (32 words)
words_550 = [
    {"word": "anachronism", "pos": "noun", "definitionEn": "something located in a time when it could not have existed or occurred", "example": "The sword-wielding character using a smartphone was an intentional anachronism.", "ipa": "/əˈnæk.rə.nɪ.zəm/", "band": "550 Digital SAT Words", "meaningVi": "sự sai niên đại, lỗi thời", "collocation": "historical anachronism", "synonyms": ["misplacement", "archaism"], "antonyms": []},
    {"word": "capitulate", "pos": "verb", "definitionEn": "to surrender often after negotiation of terms; to cease resisting", "example": "After weeks of siege, the defending army was forced to capitulate.", "ipa": "/kəˈpɪtʃ.ə.leɪt/", "band": "550 Digital SAT Words", "meaningVi": "đầu hàng, chịu khuất phục", "collocation": "capitulate to demands", "synonyms": ["surrender", "yield", "concede"], "antonyms": ["resist"]},
    {"word": "deleterious", "pos": "adjective", "definitionEn": "harmful often in a subtle or unexpected way", "example": "Chronic sleep deprivation has deleterious effects on cognitive performance.", "ipa": "/ˌdel.ɪˈtɪə.ri.əs/", "band": "550 Digital SAT Words", "meaningVi": "gây hại, độc hại ngấm ngầm", "collocation": "deleterious effects", "synonyms": ["harmful", "detrimental", "pernicious"], "antonyms": ["beneficial"]},
    {"word": "ephemeral", "pos": "adjective", "definitionEn": "lasting for a very short time; transitory", "example": "The ephemeral beauty of cherry blossoms draws millions of visitors each spring.", "ipa": "/ɪˈfem.ər.əl/", "band": "550 Digital SAT Words", "meaningVi": "phù du, sớm nở tối tàn", "collocation": "ephemeral pleasure", "synonyms": ["fleeting", "transient", "evanescent"], "antonyms": ["permanent"]},
    {"word": "fastidious", "pos": "adjective", "definitionEn": "very attentive to and concerned about accuracy and detail", "example": "The editor was fastidious about grammatical precision and formatting.", "ipa": "/fæsˈtɪd.i.əs/", "band": "550 Digital SAT Words", "meaningVi": "kỹ tính, tỉ mỉ từng chi tiết", "collocation": "fastidious attention", "synonyms": ["meticulous", "scrupulous", "punctilious"], "antonyms": ["careless"]},
    {"word": "gregarious", "pos": "adjective", "definitionEn": "fond of company; sociable; living in herds", "example": "Dolphins are highly gregarious animals that thrive in large pods.", "ipa": "/ɡrɪˈɡeə.ri.əs/", "band": "550 Digital SAT Words", "meaningVi": "thích giao du, sống bầy đàn", "collocation": "gregarious nature", "synonyms": ["sociable", "companionable", "outgoing"], "antonyms": ["solitary"]},
    {"word": "haughty", "pos": "adjective", "definitionEn": "arrogantly superior and disdainful", "example": "His haughty demeanor alienated his colleagues during meetings.", "ipa": "/ˈhɔː.ti/", "band": "550 Digital SAT Words", "meaningVi": "kiêu kỳ, trịch thượng", "collocation": "haughty manner", "synonyms": ["arrogant", "conceited", "condescending"], "antonyms": ["humble"]},
    {"word": "innocuous", "pos": "adjective", "definitionEn": "not harmful or offensive; harmless", "example": "What seemed like an innocuous remark sparked an intense debate.", "ipa": "/ɪˈnɒk.ju.əs/", "band": "550 Digital SAT Words", "meaningVi": "vô hại, không xúc phạm", "collocation": "innocuous question", "synonyms": ["harmless", "benign", "inoffensive"], "antonyms": ["harmful"]},
    {"word": "judicious", "pos": "adjective", "definitionEn": "having, showing, or done with good sense and judgment", "example": "A judicious allocation of resources prevented budget overruns.", "ipa": "/dʒuːˈdɪʃ.əs/", "band": "550 Digital SAT Words", "meaningVi": "sáng suốt, khôn ngoan", "collocation": "judicious use", "synonyms": ["prudent", "wise", "sensible"], "antonyms": ["foolish"]},
    {"word": "laconic", "pos": "adjective", "definitionEn": "using very few words; concise to the point of seeming rude", "example": "His laconic response of 'No' ended any further discussion.", "ipa": "/ləˈkɒn.ɪk/", "band": "550 Digital SAT Words", "meaningVi": "kiệm lời, súc tích", "collocation": "laconic reply", "synonyms": ["terse", "succinct", "concise"], "antonyms": ["verbose"]},
    {"word": "meticulous", "pos": "adjective", "definitionEn": "showing great attention to detail; very careful and precise", "example": "The scientist kept meticulous records of every stage in the experiment.", "ipa": "/məˈtɪk.jə.ləs/", "band": "550 Digital SAT Words", "meaningVi": "tỉ mỉ, cẩn thận tuyệt đối", "collocation": "meticulous planning", "synonyms": ["thorough", "diligent", "precise"], "antonyms": ["sloppy"]},
    {"word": "nonchalant", "pos": "adjective", "definitionEn": "feeling or appearing casually calm and relaxed; not displaying anxiety", "example": "She gave a nonchalant shrug as if failing the quiz didn't matter at all.", "ipa": "/ˌnɒn.ʃəl.ənt/", "band": "550 Digital SAT Words", "meaningVi": "bình thản, thờ ơ dửng dưng", "collocation": "nonchalant attitude", "synonyms": ["unconcerned", "indifferent", "cool"], "antonyms": ["anxious"]},
    {"word": "ostentatious", "pos": "adjective", "definitionEn": "characterized by vulgar or pretentious display; designed to impress", "example": "The mansion featured ostentatious gold chandeliers and marble staircases.", "ipa": "/ˌɒs.tenˈteɪ.ʃəs/", "band": "550 Digital SAT Words", "meaningVi": "phô trương, khoe của", "collocation": "ostentatious display", "synonyms": ["showy", "flamboyant", "pretentious"], "antonyms": ["restrained"]},
    {"word": "pragmatic", "pos": "adjective", "definitionEn": "dealing with things sensibly and realistically based on practical considerations", "example": "In times of financial crisis, leaders must take pragmatic steps.", "ipa": "/præɡˈmæt.ɪk/", "band": "550 Digital SAT Words", "meaningVi": "thực dụng, thực tế", "collocation": "pragmatic approach", "synonyms": ["practical", "sensible", "down-to-earth"], "antonyms": ["idealistic"]},
    {"word": "quintessential", "pos": "adjective", "definitionEn": "representing the most perfect or typical example of a quality or class", "example": "The cozy coffee shop was the quintessential college study spot.", "ipa": "/ˌkwɪn.tɪˈsen.ʃəl/", "band": "550 Digital SAT Words", "meaningVi": "tinh hoa, điển hình nhất", "collocation": "quintessential example", "synonyms": ["archetypal", "exemplary", "classic"], "antonyms": []},
    {"word": "resilient", "pos": "adjective", "definitionEn": "able to withstand or recover quickly from difficult conditions", "example": "The local community proved resilient in rebuilding after the typhoon.", "ipa": "/rɪˈzɪl.i.ənt/", "band": "550 Digital SAT Words", "meaningVi": "kiên cường, mau hồi phục", "collocation": "resilient economy", "synonyms": ["tough", "adaptable", "hardy"], "antonyms": ["vulnerable"]},
    {"word": "scrutinize", "pos": "verb", "definitionEn": "to examine or inspect closely and thoroughly", "example": "Auditors arrived to scrutinize the company's financial records.", "ipa": "/ˈskruː.tɪ.naɪz/", "band": "550 Digital SAT Words", "meaningVi": "săm soi, kiểm tra kỹ lưỡng", "collocation": "scrutinize evidence", "synonyms": ["inspect", "examine", "investigate"], "antonyms": ["glance"]},
    {"word": "tenacious", "pos": "adjective", "definitionEn": "tending to keep a firm hold of something; clinging or adhering closely", "example": "Her tenacious pursuit of the truth eventually exposed the scandal.", "ipa": "/təˈneɪ.ʃəs/", "band": "550 Digital SAT Words", "meaningVi": "ngoan cường, kiên định", "collocation": "tenacious grip", "synonyms": ["persistent", "determined", "resolute"], "antonyms": ["yielding"]},
    {"word": "ubiquitous", "pos": "adjective", "definitionEn": "present, appearing, or found everywhere", "example": "Smartphones have become ubiquitous across all generations.", "ipa": "/juːˈbɪk.wɪ.təs/", "band": "550 Digital SAT Words", "meaningVi": "nhan nhản, có mặt khắp nơi", "collocation": "ubiquitous presence", "synonyms": ["omnipresent", "pervasive", "universal"], "antonyms": ["rare"]},
    {"word": "venerate", "pos": "verb", "definitionEn": "regard with great respect; revere", "example": "Many cultures venerate their elders for their accumulated wisdom.", "ipa": "/ˈven.ər.eɪt/", "band": "550 Digital SAT Words", "meaningVi": "tôn kính, sùng bái", "collocation": "venerate ancestors", "synonyms": ["revere", "honor", "respect"], "antonyms": ["disdain"]},
    {"word": "ambivalent", "pos": "adjective", "definitionEn": "having mixed feelings or contradictory ideas about something", "example": "Voters felt ambivalent about both political candidates.", "ipa": "/æmˈbɪv.ə.lənt/", "band": "550 Digital SAT Words", "meaningVi": "mâu thuẫn trong cảm xúc, phân vân", "collocation": "feel ambivalent", "synonyms": ["equivocal", "uncertain", "conflicted"], "antonyms": ["decisive"]},
    {"word": "capricious", "pos": "adjective", "definitionEn": "given to sudden and unaccountable changes of mood or behavior", "example": "The desert's capricious weather shifted from scorching sun to hail.", "ipa": "/kəˈprɪʃ.əs/", "band": "550 Digital SAT Words", "meaningVi": "thất thường, sáng nắng chiều mưa", "collocation": "capricious climate", "synonyms": ["fickle", "volatile", "unpredictable"], "antonyms": ["steady"]},
    {"word": "esoteric", "pos": "adjective", "definitionEn": "intended for or likely to be understood by only a small number of people", "example": "The lecture was full of esoteric quantum mechanics formulas.", "ipa": "/ˌes.əˈter.ɪk/", "band": "550 Digital SAT Words", "meaningVi": "uyên bác, thâm thúy bí truyền", "collocation": "esoteric knowledge", "synonyms": ["obscure", "abstruse", "arcane"], "antonyms": ["common"]},
    {"word": "fortitude", "pos": "noun", "definitionEn": "courage in pain or adversity", "example": "She endured the grueling medical treatments with admirable fortitude.", "ipa": "/ˈfɔː.tɪ.tʃuːd/", "band": "550 Digital SAT Words", "meaningVi": "sự dũng cảm chịu đựng", "collocation": "moral fortitude", "synonyms": ["courage", "bravery", "endurance"], "antonyms": ["cowardice"]},
    {"word": "hackneyed", "pos": "adjective", "definitionEn": "lacking significance through having been overused; unoriginal and trite", "example": "The commencement speech relied on hackneyed clichés about reaching for the stars.", "ipa": "/ˈhæk.nid/", "band": "550 Digital SAT Words", "meaningVi": "sáo rỗng, nhàm chán", "collocation": "hackneyed phrase", "synonyms": ["trite", "clichéd", "platitudinous"], "antonyms": ["fresh"]},
    {"word": "impervious", "pos": "adjective", "definitionEn": "not allowing fluid to pass through; unable to be affected by", "example": "He remained impervious to criticism and continued his radical reforms.", "ipa": "/ɪmˈpɜː.vi.əs/", "band": "550 Digital SAT Words", "meaningVi": "trơ lì, không bị lay chuyển", "collocation": "impervious to pain", "synonyms": ["impenetrable", "immune", "resistant"], "antonyms": ["susceptible"]},
    {"word": "juxtaposition", "pos": "noun", "definitionEn": "the fact of two things being seen or placed close together with contrasting effect", "example": "The artist created a striking juxtaposition of ancient ruins and neon skyscrapers.", "ipa": "/ˌdʒʌk.stə.pəˈzɪʃ.ən/", "band": "550 Digital SAT Words", "meaningVi": "sự đặt cạnh nhau để tương phản", "collocation": "jarring juxtaposition", "synonyms": ["contrast", "comparison", "adjacency"], "antonyms": []},
    {"word": "loquacious", "pos": "adjective", "definitionEn": "tending to talk a great deal; talkative", "example": "The loquacious tour guide kept the passengers entertained for hours.", "ipa": "/ləˈkweɪ.ʃəs/", "band": "550 Digital SAT Words", "meaningVi": "ba hoa, nói nhiều", "collocation": "loquacious host", "synonyms": ["talkative", "voluble", "garrulous"], "antonyms": ["taciturn"]},
    {"word": "magnanimous", "pos": "adjective", "definitionEn": "generous or forgiving, especially toward a rival or less powerful person", "example": "The victor was magnanimous in defeat, praising his opponent's bravery.", "ipa": "/mæɡˈnæn.ɪ.məs/", "band": "550 Digital SAT Words", "meaningVi": "hào hiệp, độ lượng", "collocation": "magnanimous gesture", "synonyms": ["generous", "charitable", "benevolent"], "antonyms": ["petty"]},
    {"word": "nebulous", "pos": "adjective", "definitionEn": "in the form of a cloud or haze; hazy; vague or ill-defined", "example": "The startup had only a nebulous plan for generating revenue.", "ipa": "/ˈneb.jə.ləs/", "band": "550 Digital SAT Words", "meaningVi": "mơ hồ, mập mờ chưa rõ", "collocation": "nebulous concept", "synonyms": ["vague", "indistinct", "hazy"], "antonyms": ["clear"]},
    {"word": "opulent", "pos": "adjective", "definitionEn": "ostentatiously rich and luxurious or lavish", "example": "The palace was decorated in an opulent Baroque style with gold leaf walls.", "ipa": "/ˈɒp.jə.lənt/", "band": "550 Digital SAT Words", "meaningVi": "xa hoa, vương giả", "collocation": "opulent lifestyle", "synonyms": ["luxurious", "sumptuous", "palatial"], "antonyms": ["austere"]},
    {"word": "pristine", "pos": "adjective", "definitionEn": "in its original condition; unspoiled; clean and fresh as if new", "example": "The national park preserves miles of pristine wilderness.", "ipa": "/ˈprɪs.tiːn/", "band": "550 Digital SAT Words", "meaningVi": "nguyên sơ, tinh khôi", "collocation": "pristine condition", "synonyms": ["unspoiled", "immaculate", "pure"], "antonyms": ["polluted"]}
]

deck_550 = {
    'slug': 'sat-550-digital-must-know',
    'subject': 'verbal',
    'title': '550 Words to Know for Digital SAT',
    'blurb': f'{len(words_550)} từ · ' + ', '.join([w['word'] for w in words_550[:4]]) + '…',
    'sourceBook': '550 Words to Know for Digital SAT (The Princeton Review)',
    'words': words_550
}

new_decks = [deck_p1, deck_p2, deck_p3, deck_15k, deck_550]
all_decks = orig_decks + new_decks

# Verify deck constraints
for d in all_decks:
    w_len = len(d['words'])
    uniq_len = len(set(w['word'].lower() for w in d['words']))
    assert 30 <= w_len <= 60, f"{d['slug']} word count {w_len} out of [30, 60]"
    assert uniq_len == w_len, f"{d['slug']} has duplicate words: {w_len} vs {uniq_len}"

with open('src/data/lessons/sat-book-vocab.json', 'w', encoding='utf-8') as f:
    json.dump(all_decks, f, ensure_ascii=False, indent=2)

print(f"SUCCESS: Wrote {len(all_decks)} decks (11 original + {len(new_decks)} new) to sat-book-vocab.json")
