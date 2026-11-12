"""Create book-vocab-topic-map.json from the seven source PDFs and current word lists."""
import json
import re
import pymupdf

DATA = "src/data/book-vocab.json"
OUT = "src/data/book-vocab-topic-map.json"
PATHS = [
    r"D:\Erica's Vocabulary - A New Approach @DSATPreps.pdf",
    r"D:\SAT Power Vocab - The princetion review (1).pdf",
    r"D:\1_English_Vocabulary_In_Use_Elementary_Cambridge_-_Third_Edition.pdf",
    r"D:\2_English_Vocabulary_In_Use_Pre-Intermediate_Cambridge_-_Fourth_Edition.pdf",
    r"D:\3_English_Vocabulary_In_Use_Upper-Intermediate_Cambridge_-_Fourth_Edition.pdf",
    r"D:\4_English_Vocabulary_In_Use_Advanced_Cambridge_-_Third_Edition.pdf",
    r"D:\1100 Words You Need to Know 6th Edition.pdf",
]

UNIT_GROUPS = {
    2: [(1, 9, "People & family", "Con người và gia đình"), (10, 13, "Food & home", "Đồ ăn và nhà cửa"), (14, 17, "Work, study & communication", "Công việc, học tập và giao tiếp"), (18, 26, "Leisure, shopping & travel", "Giải trí, mua sắm và du lịch"), (27, 37, "The world & society", "Thế giới và xã hội"), (38, 50, "Everyday verbs & expressions", "Động từ và cách diễn đạt hằng ngày"), (51, 60, "Time, places & word building", "Thời gian, địa điểm và cấu tạo từ")],
    3: [(1, 4, "Learning English", "Học tiếng Anh"), (5, 15, "People & the world around us", "Con người và thế giới quanh ta"), (16, 30, "Daily life, home & transport", "Đời sống, nhà cửa và đi lại"), (31, 34, "Education & exams", "Giáo dục và thi cử"), (35, 40, "Work, careers & business", "Công việc, sự nghiệp và kinh doanh"), (41, 51, "Leisure, travel & holidays", "Giải trí, du lịch và kỳ nghỉ"), (52, 55, "Media & technology", "Truyền thông và công nghệ"), (56, 59, "Society & global issues", "Xã hội và vấn đề toàn cầu"), (60, 69, "Concepts & useful expressions", "Khái niệm và cách diễn đạt"), (70, 77, "Word formation & phrases", "Cấu tạo từ và cụm từ")],
    4: [(1, 4, "Learning & vocabulary skills", "Kỹ năng học từ vựng"), (5, 10, "People, countries & relationships", "Con người, quốc gia và quan hệ"), (11, 16, "Home, society & education", "Nhà cửa, xã hội và giáo dục"), (17, 22, "Work, business & the arts", "Công việc, kinh doanh và nghệ thuật"), (23, 26, "Nature, geography & environment", "Thiên nhiên, địa lý và môi trường"), (27, 30, "Health, clothes & lifestyle", "Sức khỏe, trang phục và lối sống"), (31, 40, "Travel, technology & public life", "Du lịch, công nghệ và đời sống công cộng"), (41, 50, "Objects, opinions & feelings", "Đồ vật, quan điểm và cảm xúc"), (51, 60, "Numbers, time & core concepts", "Số lượng, thời gian và khái niệm"), (61, 69, "Linking, speaking & communication", "Từ nối, diễn đạt và giao tiếp"), (70, 100, "Word formation & expressions", "Cấu tạo từ và cách diễn đạt")],
}
CORE_WORD_END = {2: 575, 3: 1199, 4: 968, 5: 849}
ERICA = [(0, 32, "Words in context & reasoning", "Từ trong ngữ cảnh và lập luận"), (32, 48, "Comparison & description", "So sánh và miêu tả"), (48, 64, "Argument, stance & attitude", "Lập luận, lập trường và thái độ"), (64, 80, "Confusing words & precise usage", "Từ dễ nhầm và cách dùng chính xác"), (80, 128, "Word pairs & fine distinctions", "Cặp từ và sắc thái nghĩa"), (128, 153, "Academic argument vocabulary", "Từ vựng học thuật và lập luận"), (153, 173, "Transitions & logical links", "Từ nối và quan hệ logic"), (173, 203, "Words in reading contexts", "Từ vựng trong ngữ cảnh đọc")]
SAT = [(22, "Roots & etymology", "Gốc từ và từ nguyên"), (120, "Mnemonics & word associations", "Mẹo ghi nhớ và liên tưởng từ"), (218, "Practice & cumulative vocabulary", "Luyện tập và từ vựng tổng hợp"), (292, "SAT math vocabulary", "Từ vựng Toán SAT")]
ADV = [(10, "Work and study", "Công việc và học tập"), (24, "People and relationships", "Con người và các mối quan hệ"), (40, "Leisure and lifestyle", "Giải trí và lối sống"), (58, "Travel", "Du lịch"), (64, "The environment", "Môi trường"), (76, "Society and institutions", "Xã hội và các thể chế"), (102, "The media", "Truyền thông"), (110, "Health", "Sức khỏe"), (118, "Technology", "Công nghệ"), (126, "Basic concepts", "Khái niệm cơ bản"), (152, "Functional vocabulary", "Từ vựng chức năng"), (178, "Words and meanings", "Từ và nghĩa"), (192, "Fixed expressions and figurative language", "Cụm cố định và ngôn ngữ hình tượng"), (202, "Language variation", "Biến thể ngôn ngữ")]


def normalized_pages(doc):
    result = []
    for page in doc:
        text = page.get_text().lower()
        result.append(" " + re.sub(r"[^a-z0-9]+", " ", text).strip() + " ")
    return result


def find_page(pages, word, start, end):
    phrase = re.sub(r"[^a-z0-9]+", " ", word.lower()).strip()
    if not phrase:
        return None
    needle = " " + phrase + " "
    for index in range(start - 1, min(end, len(pages))):
        if needle in pages[index]:
            return index + 1
    compact = phrase.replace(" ", "")
    if len(compact) >= 6:
        for index in range(start - 1, min(end, len(pages))):
            if compact in pages[index].replace(" ", ""):
                return index + 1
    return None


def compress(indices):
    ranges = []
    if not indices:
        return ranges
    first = previous = indices[0]
    for index in indices[1:]:
        if index != previous + 1:
            ranges.append([first, previous + 1])
            first = index
        previous = index
    ranges.append([first, previous + 1])
    return ranges


books = json.load(open(DATA, encoding="utf-8"))
topic_map = {}
for book_index, book in enumerate(books):
    assignments = [None] * len(book["words"])
    if book_index == 0:
        definitions = ERICA
        for group_index, (start, end, *_labels) in enumerate(definitions):
            for word_index in range(start, end):
                assignments[word_index] = group_index
    else:
        document = pymupdf.open(PATHS[book_index])
        pages = normalized_pages(document)
        definitions = []
        if book_index == 1:
            definitions = [(SAT[index][0], SAT[index + 1][0] if index + 1 < len(SAT) else 10000, SAT[index][1], SAT[index][2]) for index in range(len(SAT))]
            for word_index, word in enumerate(book["words"]):
                page = find_page(pages, word["word"], 22, len(pages))
                if page is not None:
                    match = next((j for j, (start, end, *_labels) in enumerate(definitions) if start <= page < end), None)
                    assignments[word_index] = match
        elif book_index in (2, 3, 4):
            definitions = UNIT_GROUPS[book_index]
            core_end = min(CORE_WORD_END[book_index], len(book["words"]))
            last_unit = definitions[-1][1]
            previous_end = 0
            for group_index, (unit_start, unit_end, *_labels) in enumerate(definitions):
                end = round(core_end * unit_end / last_unit)
                for word_index in range(previous_end, end):
                    assignments[word_index] = group_index
                previous_end = end
            # Alphabetical index words appear after the source units in these extracted lists.
            # Match those to the first unit where they occur; unmatched entries are kept for review.
            unit_pages = [page for _level, title, page in document.get_toc() if re.match(r"\s*\d+\s+", title)]
            content_start = min(unit_pages, default=9)
            content_end = max(unit_pages, default=len(pages)) + 2
            for word_index in range(core_end, len(book["words"])):
                page = find_page(pages, book["words"][word_index]["word"], content_start, content_end)
                if page is None:
                    continue
                unit = max((int(match.group(1)) for _level, title, unit_page in document.get_toc() if unit_page <= page and (match := re.match(r"\s*(\d+)\s+", title))), default=None)
                assignments[word_index] = next((j for j, (start, end, *_labels) in enumerate(definitions) if unit is not None and start <= unit <= end), None)
        elif book_index == 5:
            definitions = [(ADV[index][0], ADV[index + 1][0] if index + 1 < len(ADV) else 212, ADV[index][1], ADV[index][2]) for index in range(len(ADV))]
            core_end = min(CORE_WORD_END[book_index], len(book["words"]))
            previous_end = 0
            total_pages = definitions[-1][1] - definitions[0][0]
            for group_index, (start_page, end_page, *_labels) in enumerate(definitions):
                end = round(core_end * (end_page - definitions[0][0]) / total_pages)
                for word_index in range(previous_end, end):
                    assignments[word_index] = group_index
                previous_end = end
            for word_index in range(core_end, len(book["words"])):
                page = find_page(pages, book["words"][word_index]["word"], 10, 212)
                if page is not None:
                    assignments[word_index] = next((j for j, (start, end, *_labels) in enumerate(definitions) if start <= page < end), None)
        else:
            weeks = []
            for page_index, page in enumerate(document):
                match = re.search(r"WEEK\s+(\d+)\s+DAY\s+1", page.get_text(), re.I)
                if match:
                    weeks.append((int(match.group(1)), page_index + 1))
            if not weeks:
                weeks = [(1, 10)]
            definitions = [(page, weeks[index + 1][1] if index + 1 < len(weeks) else len(pages) + 1, f"Week {number}", f"Tuần {number}") for index, (number, page) in enumerate(weeks)]
            for word_index, word in enumerate(book["words"]):
                page = find_page(pages, word["word"], weeks[0][1], len(pages))
                if page is not None:
                    assignments[word_index] = next((j for j, (start, end, *_labels) in enumerate(definitions) if start <= page < end), None)

    missing = [index for index, assignment in enumerate(assignments) if assignment is None]
    if missing:
        definitions.append((0, 0, "Review & index words", "Từ ôn tập và mục lục"))
        for index in missing:
            assignments[index] = len(definitions) - 1

    topics = []
    for group_index, definition in enumerate(definitions):
        indices = [index for index, assignment in enumerate(assignments) if assignment == group_index]
        if not indices:
            continue
        topics.append({"slug": f"{book['slug']}-topic-{len(topics) + 1:02d}", "name": definition[2], "nameVi": definition[3], "ranges": compress(indices), "wordCount": len(indices)})
    topic_map[book["slug"]] = topics
    print(f"{book['name']}: {len(book['words'])} từ → {len(topics)} chủ đề; {len(missing)} từ ở mục ôn/index")

json.dump(topic_map, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
