"""Group the seven English vocabulary books by their real source units/topics.

Cambridge indexes identify the unit for each headword. Erica is a scanned PDF,
so its OCR page sections are used. Barron's 1100 Words is grouped by its source
weeks. The app splits each resulting topic into lessons of at most 50 words.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import pymupdf

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


DATA = Path("src/data/book-vocab.json")
OUT = Path("src/data/book-vocab-topic-map.json")
OCR_DIR = Path(".local-private/book-vocab-ocr")
PATHS = {
    "book-ericas-vocabulary": Path(r"D:\Erica's Vocabulary - A New Approach @DSATPreps.pdf"),
    "book-sat-power-vocab": Path(r"D:\SAT Power Vocab - The princetion review (1).pdf"),
    "book-vocab-in-use-elementary": Path(r"D:\1_English_Vocabulary_In_Use_Elementary_Cambridge_-_Third_Edition.pdf"),
    "book-vocab-in-use-preintermediate": Path(r"D:\2_English_Vocabulary_In_Use_Pre-Intermediate_Cambridge_-_Fourth_Edition.pdf"),
    "book-vocab-in-use-upperintermediate": Path(r"D:\3_English_Vocabulary_In_Use_Upper-Intermediate_Cambridge_-_Fourth_Edition.pdf"),
    "book-vocab-in-use-advanced": Path(r"D:\4_English_Vocabulary_In_Use_Advanced_Cambridge_-_Third_Edition.pdf"),
    "book-1100-words": Path(r"D:\1100 Words You Need to Know 6th Edition.pdf"),
}

# Broad themes contain the real units listed below them; they are not assigned
# by slicing the word array at arbitrary offsets.
UNIT_THEMES = {
    "book-vocab-in-use-elementary": [
        (1, 9, "People, relationships & feelings", "Con người, quan hệ và cảm xúc"),
        (10, 13, "Food & home", "Đồ ăn và nhà cửa"),
        (14, 17, "Work, study & communication", "Công việc, học tập và giao tiếp"),
        (18, 26, "Travel, shopping & leisure", "Du lịch, mua sắm và giải trí"),
        (27, 31, "Countries, weather & local places", "Quốc gia, thời tiết và địa điểm quanh ta"),
        (32, 37, "Travel, media & social issues", "Du lịch, truyền thông và vấn đề xã hội"),
        (38, 50, "Everyday verbs, movement & conversation", "Động từ, vận động và giao tiếp hằng ngày"),
        (51, 60, "Time, places & word building", "Thời gian, địa điểm và cấu tạo từ"),
    ],
    "book-vocab-in-use-preintermediate": [
        (1, 4, "Learning English & vocabulary tools", "Học tiếng Anh và công cụ từ vựng"),
        (5, 8, "Countries, nature & weather", "Quốc gia, thiên nhiên và thời tiết"),
        (9, 15, "People, body & relationships", "Con người, cơ thể và các mối quan hệ"),
        (16, 20, "Daily life, home & health", "Đời sống, nhà cửa và sức khỏe"),
        (21, 25, "Clothes, shopping & food", "Quần áo, mua sắm và đồ ăn"),
        (26, 30, "Cities, countryside & transport", "Thành phố, nông thôn và giao thông"),
        (31, 34, "School & education", "Trường học và giáo dục"),
        (35, 40, "Jobs, careers & business", "Việc làm, sự nghiệp và kinh doanh"),
        (41, 51, "Sport, culture & travel", "Thể thao, văn hóa và du lịch"),
        (52, 55, "Media, communication & technology", "Truyền thông, giao tiếp và công nghệ"),
        (56, 59, "Crime, politics & global issues", "Tội phạm, chính trị và vấn đề toàn cầu"),
        (60, 64, "Time, numbers & objects", "Thời gian, con số và đồ vật"),
        (65, 69, "Conversation, opinions & attitudes", "Giao tiếp, quan điểm và thái độ"),
        (70, 84, "Word building & fixed phrases", "Cấu tạo từ và cụm cố định"),
        (85, 94, "Senses, grammar & everyday expressions", "Giác quan, ngữ pháp và cách diễn đạt"),
        (95, 100, "Writing, forms & messages", "Viết, biểu mẫu và tin nhắn"),
    ],
    "book-vocab-in-use-upperintermediate": [
        (1, 4, "Learning vocabulary & reference skills", "Học từ vựng và kỹ năng tra cứu"),
        (5, 6, "Countries & weather", "Quốc gia và thời tiết"),
        (7, 10, "People & relationships", "Con người và các mối quan hệ"),
        (11, 12, "Home & everyday problems", "Nhà cửa và vấn đề thường ngày"),
        (13, 13, "Global problems", "Vấn đề toàn cầu"),
        (14, 17, "Education, work & business", "Giáo dục, công việc và kinh doanh"),
        (18, 21, "Sport, arts & entertainment", "Thể thao, nghệ thuật và giải trí"),
        (22, 26, "Food, places & the natural world", "Đồ ăn, địa lý và thế giới tự nhiên"),
        (27, 30, "Clothes, health & lifestyle", "Quần áo, sức khỏe và lối sống"),
        (31, 36, "Travel, technology & communication", "Du lịch, công nghệ và giao tiếp"),
        (37, 40, "Media, public life & money", "Truyền thông, đời sống công cộng và tiền bạc"),
        (41, 50, "Objects, feelings & communication", "Đồ vật, cảm xúc và giao tiếp"),
        (51, 60, "Numbers, time & description", "Số lượng, thời gian và miêu tả"),
        (61, 69, "Linking ideas & discourse", "Liên kết ý và diễn ngôn"),
        (70, 73, "Roots, affixes & abstract nouns", "Gốc từ, phụ tố và danh từ trừu tượng"),
        (74, 79, "Compounds, word combinations & abbreviations", "Từ ghép, kết hợp từ và chữ viết tắt"),
        (80, 82, "Pronunciation & similar-sounding words", "Phát âm và các từ có âm giống nhau"),
        (83, 88, "Countability & collective nouns", "Danh từ đếm được và danh từ tập hợp"),
        (89, 101, "Phrasal expressions, register & English varieties", "Cụm từ, văn phong và biến thể tiếng Anh"),
    ],
}

ERICA_SECTIONS = [
    (5, 31, "Vocabulary in context", "Từ vựng trong ngữ cảnh"),
    (31, 57, "Passage-based vocabulary", "Từ vựng trong đoạn đọc"),
    (57, 87, "Commonly confused words", "Các từ thường dễ nhầm"),
    (87, 112, "Transitions & phrases", "Từ nối và cụm diễn đạt"),
    (112, 129, "Key essay vocabulary", "Từ vựng trọng tâm cho bài luận"),
]

POWER_THEMES = [
    (1, 4, "Roots & etymology", "Gốc từ và từ nguyên"),
    (5, 7, "Mnemonics & word associations", "Mẹo ghi nhớ và liên tưởng từ"),
    (8, 9, "Practice & vocabulary in context", "Luyện tập và từ vựng trong ngữ cảnh"),
    (10, 10, "SAT math vocabulary", "Từ vựng Toán SAT"),
]

ADVANCED_SECTION_TRANSLATIONS = {
    "public services, beliefs & cultural history": "Dịch vụ công, niềm tin và lịch sử văn hóa",
    "poverty, politics & global affairs": "Nghèo đói, chính trị và các vấn đề toàn cầu",
    "work and study": "Công việc và học tập",
    "people and relationships": "Con người và các mối quan hệ",
    "leisure and lifestyle": "Giải trí và lối sống",
    "travel": "Du lịch",
    "the environment": "Môi trường",
    "society and institutions": "Xã hội và các thể chế",
    "the media": "Truyền thông",
    "health": "Sức khỏe",
    "technology": "Công nghệ",
    "basic concepts": "Khái niệm cơ bản",
    "functional vocabulary": "Từ vựng chức năng",
    "words and meanings": "Từ và nghĩa",
    "fixed expressions and figurative language": "Cụm cố định và ngôn ngữ hình tượng",
    "language variation": "Biến thể ngôn ngữ",
}


def normalize(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", text.lower()).strip()


def word_forms(word: str) -> list[str]:
    """Return conservative inflection variants for a source-index lookup."""
    value = normalize(word)
    if not value or " " in value:
        return []
    forms = []
    if value.endswith("ies") and len(value) > 4:
        forms.append(value[:-3] + "y")
    if value.endswith("ied") and len(value) > 4:
        forms.append(value[:-3] + "y")
    if value.endswith("es") and len(value) > 4:
        forms.extend((value[:-2], value[:-1]))
    if value.endswith("s") and len(value) > 3:
        forms.append(value[:-1])
    if value.endswith("ed") and len(value) > 4:
        stem = value[:-2]
        forms.extend((stem, stem + "e"))
        if len(stem) > 2 and stem[-1] == stem[-2]:
            forms.append(stem[:-1])
    if value.endswith("ing") and len(value) > 5:
        stem = value[:-3]
        forms.extend((stem, stem + "e"))
        if len(stem) > 2 and stem[-1] == stem[-2]:
            forms.append(stem[:-1])
    forms.extend({"mice": ["mouse"]}.get(value, []))
    return list(dict.fromkeys(forms))


def normalized_pages(document: pymupdf.Document) -> list[str]:
    return [" " + normalize(page.get_text()) + " " for page in document]


def find_page(pages: list[str], word: str, start: int, end: int) -> int | None:
    phrase = normalize(word)
    if not phrase:
        return None
    needle = " " + phrase + " "
    upper = min(end, len(pages) + 1)
    for page_number in range(max(start, 1), upper):
        if needle in pages[page_number - 1]:
            return page_number
    compact = phrase.replace(" ", "")
    if len(compact) >= 6:
        for page_number in range(max(start, 1), upper):
            if compact in pages[page_number - 1].replace(" ", ""):
                return page_number
    return None


def build_index_lookup(document: pymupdf.Document, index_page: int, words: list[dict], max_unit: int) -> dict[str, list[int]]:
    lines = "\n".join(page.get_text() for page in list(document)[index_page - 1 :]).splitlines()
    targets = {normalize(item["word"]) for item in words}
    first_tokens: dict[str, list[str]] = {}
    for target in targets:
        if target:
            first_tokens.setdefault(target.split()[0], []).append(target)
    lookup: dict[str, list[int]] = {}
    trailing_refs = re.compile(r"(?<![A-Za-z])(\d{1,3}(?:\s*,\s*\d{1,3})*)\s*$")

    def refs_after(position: int) -> list[int]:
        match = trailing_refs.search(lines[position])
        if match:
            refs = [int(value) for value in re.findall(r"\d+", match.group(1))]
            return [value for value in refs if 1 <= value <= max_unit]
        for offset in range(1, 9):
            next_position = position + offset
            if next_position >= len(lines):
                break
            candidate = lines[next_position].strip()
            if re.fullmatch(r"\d{1,3}(?:\s*,\s*\d{1,3})*", candidate):
                refs = [int(value) for value in re.findall(r"\d+", candidate)]
                return [value for value in refs if 1 <= value <= max_unit]
        return []

    for position, raw_line in enumerate(lines):
        normalized = normalize(raw_line)
        if not normalized:
            continue
        first = normalized.split()[0]
        for target in first_tokens.get(first, []):
            if normalized != target and not normalized.startswith(target + " "):
                continue
            refs = refs_after(position)
            if refs and (target not in lookup or normalized == target):
                lookup[target] = refs
    return lookup


def find_index_unit(word: str, lookup: dict[str, list[int]]) -> int | None:
    value = normalize(word)
    references = lookup.get(value)
    if references:
        return min(references)
    for form in word_forms(word):
        references = lookup.get(form)
        if references:
            return min(references)
    return None


def compress(indices: list[int]) -> list[list[int]]:
    if not indices:
        return []
    result = []
    first = previous = indices[0]
    for value in indices[1:]:
        if value != previous + 1:
            result.append([first, previous + 1])
            first = value
        previous = value
    result.append([first, previous + 1])
    return result


def make_topics(book: dict, definitions: list[dict], assignments: list[int | None], review_label: tuple[str, str]) -> list[dict]:
    review_indices = [i for i, value in enumerate(assignments) if value is None]
    if review_indices:
        definitions = [*definitions, {"name": review_label[0], "nameVi": review_label[1]}]
        review_index = len(definitions) - 1
        for word_index in review_indices:
            assignments[word_index] = review_index

    topics = []
    for definition_index, definition in enumerate(definitions):
        indices = [i for i, assigned in enumerate(assignments) if assigned == definition_index]
        if not indices:
            continue
        topics.append(
            {
                "slug": f"{book['slug']}-topic-{len(topics) + 1:02d}",
                "name": definition["name"],
                "nameVi": definition["nameVi"],
                "ranges": compress(indices),
                "wordCount": len(indices),
            }
        )
    return topics


def assign_by_unit(book: dict, document: pymupdf.Document, theme_specs: list[tuple], max_unit: int) -> tuple[list[dict], list[int | None]]:
    toc = document.get_toc()
    units = []
    index_page = len(document) + 1
    for _level, title, page_number in toc:
        if title.strip().lower() == "index":
            index_page = page_number
        match = re.match(r"\s*(\d+)\s+(.+)", title)
        if match and 1 <= int(match.group(1)) <= max_unit and page_number < index_page:
            units.append((int(match.group(1)), title.strip(), page_number))
    unit_titles = {number: title for number, title, _page in units}
    unit_pages = {number: page for number, _title, page in units}
    index = build_index_lookup(document, index_page, book["words"], max_unit)
    pages = normalized_pages(document)
    assignments = [None] * len(book["words"])
    for word_index, item in enumerate(book["words"]):
        unit = find_index_unit(item["word"], index)
        if unit is None:
            page = find_page(pages, item["word"], min(unit_pages.values(), default=9), index_page)
            if page is None:
                for form in word_forms(item["word"]):
                    page = find_page(pages, form, min(unit_pages.values(), default=9), index_page)
                    if page is not None:
                        break
            if page is not None:
                unit = max((number for number, start in unit_pages.items() if start <= page), default=None)
        if unit is not None:
            assignments[word_index] = next(
                (i for i, (start, end, *_labels) in enumerate(theme_specs) if start <= unit <= end), None
            )
    definitions = [{"name": name, "nameVi": name_vi} for _start, _end, name, name_vi in theme_specs]
    return definitions, assignments


def map_advanced(book: dict, document: pymupdf.Document) -> tuple[list[dict], list[int | None]]:
    toc = document.get_toc()
    index_page = next(page for _level, title, page in toc if title.strip().lower() == "index")
    answer_page = next(page for _level, title, page in toc if title.strip().lower().startswith("answer key"))
    sections = [
        (page, title.strip().replace("\r", " ").replace("\n", " "))
        for _level, title, page in toc
        if 10 <= page < answer_page and title.strip().lower() not in {"thanks", "introduction"}
    ]
    section_starts = []
    for page_number, title in sections:
        lines = [line.strip() for line in document[page_number - 1].get_text().splitlines() if line.strip()]
        numbers = [int(line) for line in lines if line.isdigit() and 1 <= int(line) <= 101]
        if numbers:
            start_unit = numbers[-1]
            section_starts.append((start_unit, page_number, title))
    section_starts.sort()
    # The source section "Society and institutions" spans 13 units. Split it at
    # the source unit boundary into two coherent, shorter study themes.
    expanded_starts = []
    for index, (start_unit, page_number, title) in enumerate(section_starts):
        if title.lower() == "society and institutions":
            split_unit = 40
            expanded_starts.extend(
                [
                    (start_unit, page_number, "Public services, beliefs & cultural history"),
                    (split_unit, page_number + 2 * (split_unit - start_unit), "Poverty, politics & global affairs"),
                ]
            )
        else:
            expanded_starts.append((start_unit, page_number, title))
    section_starts = sorted(expanded_starts)
    definitions = [
        {"name": title, "nameVi": ADVANCED_SECTION_TRANSLATIONS.get(title.lower(), title)}
        for _unit, _page, title in section_starts
    ]
    lookup = build_index_lookup(document, index_page, book["words"], 101)
    pages = normalized_pages(document)
    assignments = [None] * len(book["words"])
    for word_index, item in enumerate(book["words"]):
        unit = find_index_unit(item["word"], lookup)
        if unit is not None:
            section_index = max((i for i, (start, _page, _title) in enumerate(section_starts) if start <= unit), default=None)
        else:
            page = find_page(pages, item["word"], 10, answer_page)
            if page is None:
                for form in word_forms(item["word"]):
                    page = find_page(pages, form, 10, answer_page)
                    if page is not None:
                        break
            section_index = max((i for i, (_start, start_page, _title) in enumerate(section_starts) if start_page <= page), default=None) if page else None
        if section_index is not None:
            assignments[word_index] = section_index
    return definitions, assignments


def map_erica(book: dict) -> tuple[list[dict], list[int | None]]:
    text = (OCR_DIR / "book-ericas-vocabulary.txt").read_text(encoding="utf-8")
    page_matches = list(re.finditer(r"===== PDF PAGE (\d+) =====\s*\n", text))
    pages = {}
    for index, match in enumerate(page_matches):
        end = page_matches[index + 1].start() if index + 1 < len(page_matches) else len(text)
        pages[int(match.group(1))] = " " + normalize(text[match.end() : end]) + " "
    definitions = [{"name": name, "nameVi": name_vi} for _start, _end, name, name_vi in ERICA_SECTIONS]
    assignments = [None] * len(book["words"])
    for word_index, item in enumerate(book["words"]):
        page = find_page([pages.get(n, "") for n in range(1, 130)], item["word"], 5, 130)
        if page is None:
            continue
        page_number = page
        section_index = next((i for i, (start, end, *_labels) in enumerate(ERICA_SECTIONS) if start <= page_number < end), None)
        assignments[word_index] = section_index
    return definitions, assignments


def map_sat_power(book: dict, document: pymupdf.Document) -> tuple[list[dict], list[int | None]]:
    toc = document.get_toc()
    chapters = []
    glossary_page = len(document) + 1
    for _level, title, page in toc:
        if title.strip().lower() == "glossary":
            glossary_page = page
        match = re.match(r"Chapter\s+(\d+):?\s*(.*)", title.strip())
        if match:
            chapters.append((int(match.group(1)), page, match.group(2).strip()))
    themes = []
    for first, last, name, name_vi in POWER_THEMES:
        chapters_in_theme = [number for number, _page, _title in chapters if first <= number <= last]
        if chapters_in_theme:
            themes.append((chapters_in_theme, name, name_vi))
    pages = normalized_pages(document)
    assignments = [None] * len(book["words"])
    for word_index, item in enumerate(book["words"]):
        page = find_page(pages, item["word"], 22, glossary_page)
        if page is None:
            for form in word_forms(item["word"]):
                page = find_page(pages, form, 22, glossary_page)
                if page is not None:
                    break
        if page is None:
            continue
        chapter = max((number for number, start, _title in chapters if start <= page), default=None)
        if chapter is not None:
            assignments[word_index] = next((i for i, (nums, *_labels) in enumerate(themes) if chapter in nums), None)
    definitions = [{"name": name, "nameVi": name_vi} for _chapters, name, name_vi in themes]
    return definitions, assignments


def map_1100(book: dict) -> tuple[list[dict], list[int | None]]:
    source = json.loads((OCR_DIR / "1100-structured.json").read_text(encoding="utf-8"))
    ordered = []
    by_word: dict[str, tuple[str, int]] = {}
    for key, field in (("headwords", "word"), ("idioms", "phrase")):
        for item in source[key]:
            week = str(item["week"])
            page = int(item.get("page", 0))
            normalized = normalize(item[field])
            if normalized and (normalized not in by_word or page < by_word[normalized][1]):
                by_word[normalized] = (week, page)
    for week, _page in sorted(set(by_word.values()), key=lambda value: value[1]):
        if week not in ordered:
            ordered.append(week)
    definitions = []
    for week in ordered:
        label = f"Week {week}" if week.isdigit() else f"Bonus Week {week}"
        label_vi = f"Tuần {week}" if week.isdigit() else f"Tuần bổ sung {week}"
        definitions.append({"name": label, "nameVi": label_vi})
    supplemental_index = len(definitions)
    definitions.append({"name": "Additional vocabulary", "nameVi": "Từ vựng bổ sung"})
    week_index = {week: index for index, week in enumerate(ordered)}
    assignments = [None] * len(book["words"])
    for word_index, item in enumerate(book["words"]):
        if word_index >= 1138:
            assignments[word_index] = supplemental_index
            continue
        source_item = by_word.get(normalize(item["word"]))
        if source_item:
            assignments[word_index] = week_index[source_item[0]]
    return definitions, assignments


books = json.loads(DATA.read_text(encoding="utf-8"))
topic_map = {}
for book in books:
    slug = book["slug"]
    if slug == "book-ericas-vocabulary":
        definitions, assignments = map_erica(book)
        review = ("Supplemental · OCR review", "Từ bổ sung · cần kiểm tra OCR")
    elif slug == "book-sat-power-vocab":
        document = pymupdf.open(PATHS[slug])
        definitions, assignments = map_sat_power(book, document)
        review = ("Supplemental vocabulary", "Từ vựng bổ sung")
    elif slug in UNIT_THEMES:
        document = pymupdf.open(PATHS[slug])
        max_unit = max(end for _start, end, *_labels in UNIT_THEMES[slug])
        definitions, assignments = assign_by_unit(book, document, UNIT_THEMES[slug], max_unit)
        review = ("Supplemental · not indexed", "Từ bổ sung · không có trong mục lục")
    elif slug == "book-vocab-in-use-advanced":
        document = pymupdf.open(PATHS[slug])
        definitions, assignments = map_advanced(book, document)
        review = ("Supplemental · not indexed", "Từ bổ sung · không có trong mục lục")
    elif slug == "book-1100-words":
        definitions, assignments = map_1100(book)
        review = ("Additional vocabulary", "Từ vựng bổ sung")
    else:
        raise ValueError(f"No source-unit mapper for {slug}")

    topics = make_topics(book, definitions, assignments, review)
    topic_map[slug] = topics
    lesson_counts = [((topic["wordCount"] + 49) // 50) for topic in topics]
    max_topic = max((topic["wordCount"] for topic in topics), default=0)
    max_lesson = max((min(50, topic["wordCount"]) for topic in topics), default=0)
    print(
        f"{book['name']}: {len(book['words'])} từ → {len(topics)} chủ đề; "
        f"{sum(lesson_counts)} buổi; chủ đề lớn nhất {max_topic}; buổi tối đa {max_lesson}"
    )

OUT.write_text(json.dumps(topic_map, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
