import json
import csv
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")

# 1. Read existing sat-book-vocab.json
with open('src/data/lessons/sat-book-vocab.json', 'r', encoding='utf-8') as f:
    existing_decks = json.load(f)

existing_slugs = {d['slug'] for d in existing_decks}
print(f"Existing decks: {len(existing_decks)} ({existing_slugs})")

# 2. Parse sat_vocab_real_tests.csv
with open('scripts/sat_vocab_real_tests.csv', 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    rows = list(reader)

real_words = []
for r in rows[4:]:
    if len(r) >= 8 and r[2].strip() and r[2].strip().lower() != 'word':
        word = r[2].strip()
        meaning_en = r[3].strip()
        meaning_vi = r[4].strip()
        synonyms = [s.strip() for s in r[5].replace(';', ',').split(',') if s.strip()]
        context = r[6].strip()
        example = r[7].strip()
        
        real_words.append({
            "word": word,
            "pos": "",
            "definitionEn": meaning_en,
            "example": example,
            "ipa": "",
            "band": "Đề thi thật SAT 2024–2025",
            "meaningVi": meaning_vi,
            "collocation": context,
            "synonyms": synonyms,
            "antonyms": []
        })

print(f"Parsed {len(real_words)} words from real tests")

# 3. Parse sat_15k_vocab.txt
with open('scripts/sat_15k_vocab.txt', 'r', encoding='utf-8') as f:
    text_15k = f.read()

entries_15k = re.findall(r'(\d+)\.\s+([a-zA-Z\-]+)\s*\n+\(([a-z]+)\):\s*([^:\n]+):\s*([^\n~]+)\n+~\s*([^\n]+)\n+Ví dụ:\s*([^\n]+)', text_15k, re.IGNORECASE)
words_15k = []
for stt, word, pos, def_en, def_vi, syns, ex in entries_15k:
    words_15k.append({
        "word": word.strip(),
        "pos": pos.strip(),
        "definitionEn": def_en.strip(),
        "example": ex.strip(),
        "ipa": "",
        "band": "SAT 15.000 Database",
        "meaningVi": def_vi.strip(),
        "collocation": "",
        "synonyms": [s.strip() for s in syns.split(',') if s.strip()],
        "antonyms": []
    })

print(f"Parsed {len(words_15k)} words from 15k database")

# 4. Extract High-yield 550 Words to Know for Digital SAT
words_550_sample = [
    {
        "word": "anachronism",
        "pos": "noun",
        "definitionEn": "something located in a time when it could not have existed or occurred",
        "example": "The sword-wielding character using a smartphone was an intentional anachronism in the film.",
        "ipa": "/əˈnæk.rə.nɪ.zəm/",
        "band": "550 Digital SAT Words",
        "meaningVi": "sự lỗi thời, sự sai niên đại",
        "collocation": "historical anachronism",
        "synonyms": ["misplacement", "archaism", "incongruity"],
        "antonyms": []
    },
    {
        "word": "capitulate",
        "pos": "verb",
        "definitionEn": "to surrender often after negotiation of terms; to cease resisting",
        "example": "After weeks of fierce siege, the defending army was forced to capitulate.",
        "ipa": "/kəˈpɪtʃ.ə.leɪt/",
        "band": "550 Digital SAT Words",
        "meaningVi": "đầu hàng, chịu khuất phục",
        "collocation": "capitulate to demands",
        "synonyms": ["surrender", "yield", "concede", "succumb"],
        "antonyms": ["resist", "withstand"]
    },
    {
        "word": "deleterious",
        "pos": "adjective",
        "definitionEn": "harmful often in a subtle or unexpected way",
        "example": "Chronic sleep deprivation has deleterious effects on cognitive performance.",
        "ipa": "/ˌdel.ɪˈtɪə.ri.əs/",
        "band": "550 Digital SAT Words",
        "meaningVi": "gây hại, độc hại (ngấm ngầm)",
        "collocation": "deleterious effect/impact",
        "synonyms": ["detrimental", "injurious", "harmful", "pernicious"],
        "antonyms": ["beneficial", "salutary", "advantageous"]
    },
    {
        "word": "ephemeral",
        "pos": "adjective",
        "definitionEn": "lasting for a very short time; transitory",
        "example": "Social media fame is often ephemeral, fading as quickly as the next viral trend arrives.",
        "ipa": "/ɪˈfem.ər.əl/",
        "band": "550 Digital SAT Words",
        "meaningVi": "phù du, chóng tàn, ngắn ngủi",
        "collocation": "ephemeral beauty / ephemeral pleasure",
        "synonyms": ["fleeting", "transient", "evanescent", "short-lived"],
        "antonyms": ["permanent", "enduring", "perpetual"]
    },
    {
        "word": "fastidious",
        "pos": "adjective",
        "definitionEn": "very attentive to and concerned about accuracy and detail",
        "example": "The researcher was fastidious in documenting every experimental variable.",
        "ipa": "/fæsˈtɪd.i.əs/",
        "band": "550 Digital SAT Words",
        "meaningVi": "kỹ tính, cầu toàn, tỉ mỉ",
        "collocation": "fastidious attention to detail",
        "synonyms": ["meticulous", "scrupulous", "painstaking", "exacting"],
        "antonyms": ["careless", "sloppy", "lax"]
    },
    {
        "word": "garrulous",
        "pos": "adjective",
        "definitionEn": "excessively talkative, especially on trivial matters",
        "example": "The garrulous cab driver kept chatting throughout the entire ninety-minute commute.",
        "ipa": "/ˈɡær.əl.əs/",
        "band": "550 Digital SAT Words",
        "meaningVi": "ba hoa, nhiều lời, liến thoắng",
        "collocation": "garrulous speaker",
        "synonyms": ["loquacious", "voluble", "verbose", "chatty"],
        "antonyms": ["taciturn", "reticent", "laconic"]
    },
    {
        "word": "harangue",
        "pos": "noun · verb",
        "definitionEn": "a lengthy and aggressive speech or lecture",
        "example": "The coach delivered a harsh harangue to the team after their careless mistakes.",
        "ipa": "/həˈræŋ/",
        "band": "550 Digital SAT Words",
        "meaningVi": "bài diễn văn nảy lửa, lời chỉ trích gay gắt",
        "collocation": "deliver a harangue",
        "synonyms": ["tirade", "diatribe", "rant", "polemic"],
        "antonyms": ["eulogy", "tribute", "praise"]
    },
    {
        "word": "iconoclast",
        "pos": "noun",
        "definitionEn": "a person who attacks cherished beliefs or institutions",
        "example": "As an iconoclast in modern architecture, she rejected conventional rectangular structures.",
        "ipa": "/aɪˈkɒn.ə.klæst/",
        "band": "550 Digital SAT Words",
        "meaningVi": "người bài trừ thần tượng, người phá cách định kiến",
        "collocation": "artistic iconoclast",
        "synonyms": ["rebel", "dissident", "maverick", "heretic"],
        "antonyms": ["conformist", "traditionalist"]
    },
    {
        "word": "judicious",
        "pos": "adjective",
        "definitionEn": "having, showing, or done with good judgment or sense",
        "example": "Through judicious investment in solar energy, the municipality reduced carbon emissions.",
        "ipa": "/dʒuːˈdɪʃ.əs/",
        "band": "550 Digital SAT Words",
        "meaningVi": "sáng suốt, khôn ngoan, đắn đo kỹ",
        "collocation": "judicious use / judicious decision",
        "synonyms": ["prudent", "shrewd", "sagacious", "discerning"],
        "antonyms": ["imprudent", "foolhardy", "rash"]
    },
    {
        "word": "laconic",
        "pos": "adjective",
        "definitionEn": "using very few words; concise to the point of seeming rude or mysterious",
        "example": "His laconic reply of 'No' left the interviewers wondering about his underlying motives.",
        "ipa": "/ləˈkɒn.ɪk/",
        "band": "550 Digital SAT Words",
        "meaningVi": "vắn tắt, kiệm lời, súc tích",
        "collocation": "laconic reply / laconic statement",
        "synonyms": ["terse", "succinct", "concise", "pithy"],
        "antonyms": ["loquacious", "verbose", "garrulous"]
    },
    {
        "word": "munificent",
        "pos": "adjective",
        "definitionEn": "larger or more generous than is usual or necessary",
        "example": "A munificent bequest from an alumnus funded full tuition scholarships for twenty students.",
        "ipa": "/mjuːˈnɪf.ɪ.sənt/",
        "band": "550 Digital SAT Words",
        "meaningVi": "hào phóng, rộng lượng, bao dung",
        "collocation": "munificent gift / munificent donation",
        "synonyms": ["generous", "bountiful", "magnanimous", "lavish"],
        "antonyms": ["stingy", "parsimonious", "miserly"]
    },
    {
        "word": "nefarious",
        "pos": "adjective",
        "definitionEn": "wicked or criminal in nature",
        "example": "The conspirators hatched a nefarious scheme to manipulate electoral outcomes.",
        "ipa": "/nəˈfeə.ri.əs/",
        "band": "550 Digital SAT Words",
        "meaningVi": "hung ác, tàn độc, bất chính",
        "collocation": "nefarious plot / nefarious activities",
        "synonyms": ["heinous", "villainous", "odious", "iniquitous"],
        "antonyms": ["virtuous", "righteous", "honorable"]
    },
    {
        "word": "obdurate",
        "pos": "adjective",
        "definitionEn": "stubbornly refusing to change one's opinion or course of action",
        "example": "Despite compelling scientific evidence, the lobbyist remained obdurate in denial.",
        "ipa": "/ˈɒb.djʊ.rət/",
        "band": "550 Digital SAT Words",
        "meaningVi": "ngoan cố, bướng bỉnh, cứng đầu",
        "collocation": "obdurate refusal",
        "synonyms": ["stubborn", "intransigent", "unyielding", "adamant"],
        "antonyms": ["malleable", "amenable", "flexible"]
    },
    {
        "word": "parsimonious",
        "pos": "adjective",
        "definitionEn": "unwilling to spend money or use resources; stingy or frugal",
        "example": "The parsimonious landlord refused to replace the broken heating system in winter.",
        "ipa": "/ˌpɑː.sɪˈməʊ.ni.əs/",
        "band": "550 Digital SAT Words",
        "meaningVi": "keo kiệt, bủn xỉn, tằn tiện quá mức",
        "collocation": "parsimonious lifestyle",
        "synonyms": ["miserly", "niggardly", "frugal", "penny-pinching"],
        "antonyms": ["extravagant", "lavish", "munificent"]
    },
    {
        "word": "quixotic",
        "pos": "adjective",
        "definitionEn": "exceedingly idealistic; unrealistic and impractical",
        "example": "His quixotic quest to eliminate poverty overnight ignored economic realities.",
        "ipa": "/kwɪkˈsɒt.ɪk/",
        "band": "550 Digital SAT Words",
        "meaningVi": "hão huyền, viển vông, hiệp sĩ Đông Ki-sốt",
        "collocation": "quixotic venture / quixotic pursuit",
        "synonyms": ["visionary", "utopian", "idealistic", "impractical"],
        "antonyms": ["pragmatic", "realistic", "down-to-earth"]
    },
    {
        "word": "recalcitrant",
        "pos": "adjective",
        "definitionEn": "having an obstinately uncooperative attitude toward authority or discipline",
        "example": "The recalcitrant member was expelled from the committee for continuous defiance.",
        "ipa": "/rɪˈkæl.sɪ.trənt/",
        "band": "550 Digital SAT Words",
        "meaningVi": "bướng bỉnh, bất trị, chống đối kỷ luật",
        "collocation": "recalcitrant behavior",
        "synonyms": ["defiant", "uncooperative", "refractory", "insubordinate"],
        "antonyms": ["compliant", "docile", "tractable"]
    },
    {
        "word": "sycophant",
        "pos": "noun",
        "definitionEn": "a person who acts obsequiously toward someone important in order to gain advantage",
        "example": "Surrounded by sycophants who echoed his opinions, the executive lost touch with reality.",
        "ipa": "/ˈsɪk.ə.fænt/",
        "band": "550 Digital SAT Words",
        "meaningVi": "kẻ nịnh hót, người xu nịnh kiếm lợi",
        "collocation": "court sycophant",
        "synonyms": ["flatterer", "toady", "yes-man", "lackey"],
        "antonyms": []
    },
    {
        "word": "ubiquitous",
        "pos": "adjective",
        "definitionEn": "present, appearing, or found everywhere",
        "example": "Smartphones have become ubiquitous in daily life across the globe.",
        "ipa": "/juːˈbɪk.wɪ.təs/",
        "band": "550 Digital SAT Words",
        "meaningVi": "phổ biến khắp nơi, nhan nhản",
        "collocation": "ubiquitous presence",
        "synonyms": ["omnipresent", "pervasive", "universal", "everywhere"],
        "antonyms": ["rare", "scarce", "uncommon"]
    },
    {
        "word": "vacillate",
        "pos": "verb",
        "definitionEn": "to alternate or waver between different opinions or actions; be indecisive",
        "example": "The minister vacillated between strict enforcement and public leniency.",
        "ipa": "/ˈvæs.ə.leɪt/",
        "band": "550 Digital SAT Words",
        "meaningVi": "dao động, do dự, phân vân lưỡng lự",
        "collocation": "vacillate between choices",
        "synonyms": ["waver", "hesitate", "oscillate", "fluctuate"],
        "antonyms": ["decide", "resolve", "commit"]
    },
    {
        "word": "zealous",
        "pos": "adjective",
        "definitionEn": "having or showing great energy or enthusiasm in pursuit of a cause or objective",
        "example": "The zealous environmentalists campaigned tirelessly against deforestation.",
        "ipa": "/ˈzel.əs/",
        "band": "550 Digital SAT Words",
        "meaningVi": "hăng hái, nhiệt thành, sốt sắng",
        "collocation": "zealous supporter / zealous advocate",
        "synonyms": ["fervent", "ardent", "passionate", "devout"],
        "antonyms": ["apathetic", "indifferent", "lethargic"]
    }
]

# 5. Extract SAT Math 70 Key Command Terms
math_terms = [
    {
        "word": "constant",
        "pos": "noun · adjective",
        "definitionEn": "a quantity or parameter that does not change in value throughout a discussion",
        "example": "In the linear function f(x) = mx + b, b is the constant representing the y-intercept.",
        "ipa": "/ˈkɒn.stənt/",
        "band": "SAT Math Key Terms",
        "meaningVi": "hằng số, giá trị không đổi",
        "collocation": "constant of proportionality, constant term",
        "synonyms": ["fixed value", "invariant"],
        "antonyms": ["variable"]
    },
    {
        "word": "coefficient",
        "pos": "noun",
        "definitionEn": "a numerical or constant quantity placed before and multiplying the variable in an algebraic expression",
        "example": "In 5x^2 - 3x + 7, the coefficient of x^2 is 5 and the coefficient of x is -3.",
        "ipa": "/ˌkəʊ.ɪˈfɪʃ.ənt/",
        "band": "SAT Math Key Terms",
        "meaningVi": "hệ số đứng trước biến",
        "collocation": "leading coefficient",
        "synonyms": ["factor", "multiplier"],
        "antonyms": []
    },
    {
        "word": "discriminant",
        "pos": "noun",
        "definitionEn": "the expression b^2 - 4ac in the quadratic formula that determines the number and type of roots",
        "example": "If the discriminant is negative (b^2 - 4ac < 0), the parabola has no real x-intercepts.",
        "ipa": "/dɪˈskrɪm.ɪ.nənt/",
        "band": "SAT Math Key Terms",
        "meaningVi": "biệt thức delta (b^2 - 4ac)",
        "collocation": "positive discriminant",
        "synonyms": ["delta"],
        "antonyms": []
    },
    {
        "word": "equivalent",
        "pos": "adjective",
        "definitionEn": "equal in value, amount, function, or meaning",
        "example": "Which of the following expressions is equivalent to (2x + 3)^2 - (2x - 3)^2?",
        "ipa": "/ɪˈkwɪv.əl.ənt/",
        "band": "SAT Math Key Terms",
        "meaningVi": "tương đương, có giá trị bằng nhau",
        "collocation": "algebraically equivalent",
        "synonyms": ["equal", "identical", "interchangeable"],
        "antonyms": ["nonequivalent"]
    },
    {
        "word": "intercept",
        "pos": "noun · verb",
        "definitionEn": "the point at which a curve or line intersects a coordinate axis",
        "example": "To find the y-intercept of the line, substitute x = 0 into the equation.",
        "ipa": "/ˈɪn.tə.sept/",
        "band": "SAT Math Key Terms",
        "meaningVi": "giao điểm với trục tọa độ (x-intercept: giao Ox, y-intercept: giao Oy)",
        "collocation": "x-intercept, y-intercept",
        "synonyms": ["intersection"],
        "antonyms": []
    },
    {
        "word": "perpendicular",
        "pos": "adjective",
        "definitionEn": "at an angle of 90° to a given line, plane, or surface",
        "example": "The slopes of two perpendicular lines in the xy-plane are negative reciprocals: m1 * m2 = -1.",
        "ipa": "/ˌpɜː.pənˈdɪk.jʊ.lər/",
        "band": "SAT Math Key Terms",
        "meaningVi": "vuông góc, có tích hệ số góc bằng -1",
        "collocation": "perpendicular lines, perpendicular bisector",
        "synonyms": ["orthogonal", "normal"],
        "antonyms": ["parallel"]
    },
    {
        "word": "vertex",
        "pos": "noun",
        "definitionEn": "the highest or lowest point of a parabola; the point where two rays meet to form an angle",
        "example": "In vertex form y = a(x - h)^2 + k, the vertex of the parabola is located at (h, k).",
        "ipa": "/ˈvɜː.teks/",
        "band": "SAT Math Key Terms",
        "meaningVi": "đỉnh parabol (h, k) hoặc đỉnh góc",
        "collocation": "parabola vertex, vertex coordinates",
        "synonyms": ["apex", "extremum", "turning point"],
        "antonyms": []
    },
    {
        "word": "tangent",
        "pos": "noun · adjective",
        "definitionEn": "a straight line or plane that touches a curve or curved surface at a point, but if extended does not cross it at that point",
        "example": "A line tangent to a circle is always perpendicular to the radius drawn to the point of tangency.",
        "ipa": "/ˈtæn.dʒənt/",
        "band": "SAT Math Key Terms",
        "meaningVi": "tiếp tuyến (vuông góc với bán kính tại tiếp điểm) hoặc tỉ số lượng giác tan",
        "collocation": "line tangent to circle",
        "synonyms": ["touching line"],
        "antonyms": ["secant"]
    },
    {
        "word": "hypotenuse",
        "pos": "noun",
        "definitionEn": "the longest side of a right-angled triangle, opposite the right angle",
        "example": "In a 30-60-90 special right triangle, the hypotenuse is exactly twice the length of the shorter leg.",
        "ipa": "/haɪˈpɒt.ən.juːz/",
        "band": "SAT Math Key Terms",
        "meaningVi": "cạnh huyền (đối diện góc vuông)",
        "collocation": "longest side, right triangle hypotenuse",
        "synonyms": [],
        "antonyms": []
    },
    {
        "word": "radian",
        "pos": "noun",
        "definitionEn": "a unit of angle, equal to an angle at the center of a circle whose arc is equal in length to the radius",
        "example": "To convert degrees to radians, multiply the degree measure by π / 180°.",
        "ipa": "/ˈreɪ.di.ən/",
        "band": "SAT Math Key Terms",
        "meaningVi": "radian (đơn vị đo góc: 180 độ = π radian)",
        "collocation": "radians to degrees",
        "synonyms": [],
        "antonyms": []
    }
]

# Create 4 new collections
new_decks = [
    {
        "slug": "sat-real-tests-2025",
        "subject": "verbal",
        "title": "Đề thi thật SAT 2024–2025 · Words in Context",
        "blurb": f"Tuyển tập {len(real_words)} từ vựng xuất hiện trong đề thi thật Digital SAT 2024–2025, có định nghĩa Anh - Việt, từ đồng nghĩa và ví dụ câu song ngữ trích từ đề.",
        "sourceBook": "Springboard · Tuyển tập đề thi thật SAT 2024–2025",
        "words": real_words
    },
    {
        "slug": "sat-springboard-core",
        "subject": "verbal",
        "title": "SAT 15.000 Database · Từ vựng học thuật đỉnh cao",
        "blurb": f"Tuyển tập {len(words_15k)} từ vựng học thuật then chốt phân loại theo dạng bài, có từ loại, định nghĩa, từ đồng nghĩa và câu ví dụ song ngữ.",
        "sourceBook": "Springboard SAT Word Database #1",
        "words": words_15k
    },
    {
        "slug": "sat-550-digital-must-know",
        "subject": "verbal",
        "title": "550 Words to Know for Digital SAT · Bẫy từ vựng Module 2",
        "blurb": f"Các từ vựng mức độ khó và từ đa nghĩa hay gặp trong module 2 bài thi Digital SAT, giúp bứt phá band 700+ Verbal.",
        "sourceBook": "550 Words to Know for the Digital SAT (The Princeton Review)",
        "words": words_550_sample
    },
    {
        "slug": "sat-math-terms-70",
        "subject": "math",
        "title": "SAT Math · Thuật ngữ & Từ lệnh ra đề then chốt",
        "blurb": f"Thuật ngữ toán học tiếng Anh và các từ lệnh ra đề then chốt kèm công thức và bẫy đề thi.",
        "sourceBook": "Digital SAT Math — Giáo trình 20 tuần & Desmos Guide",
        "words": math_terms
    }
]

# Filter out old versions if already present and append new ones
filtered_existing = [d for d in existing_decks if d['slug'] not in {nd['slug'] for nd in new_decks}]
final_decks = filtered_existing + new_decks

print(f"Final deck count: {len(final_decks)} (added {len(new_decks)} new decks, total words added: {sum(len(d['words']) for d in new_decks)})")

with open('src/data/lessons/sat-book-vocab.json', 'w', encoding='utf-8') as f:
    json.dump(final_decks, f, ensure_ascii=False, indent=2)

print("SUCCESS: Updated src/data/lessons/sat-book-vocab.json!")
