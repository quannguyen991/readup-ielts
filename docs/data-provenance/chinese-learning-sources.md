# Chinese learning sources and access

## User-provided Hanyu Jiaocheng scans

The six PDFs in the supplied Drive folder are the **2006 revised edition** (《汉语教程（修订本）》), not the later third edition. BLCUP's catalog describes 76 lessons across six student volumes: 30 / 20 / 26 lessons for books one to three, split between upper and lower volumes. Product pages and ISBNs are listed in `src/data/zh-learn/hanyu-course.ts`.

The PDFs are scanned images. All 1,212 pages have OCR text in `.local-private/hanyu-source/ocr/`, and the complete OCR transcription, source scans, extraction CSVs, and QA images remain local and are ignored by Git. The verified vocabulary is integrated in the app as `book-hanyu-revised-2006`: 3,256 study rows across 76 lesson topics, with printed page references. Headword lists and lesson counts were checked against the scans and indexes. Dictionary-filled pinyin and flagged OCR-damaged English glosses were verified on the page images; Vietnamese senses are attached only when simplified headword plus pinyin match CVDICT through OpenCidian exactly.

BLCUP's public catalog and sample pages do not require an account. Its full digital materials may require an individual account/password/captcha or institutional login; no Google sign-in was found. The supplied Drive PDFs already provide the files needed for OCR, so no BLCUP login is currently needed.

## Open vocabulary sources

- The current HSK 3.0 deck contains the 11,000-word 2025 syllabus. The official Chinese Test Service site says HSK 3.0 launches worldwide on **13 December 2026**; label the existing deck as syllabus-based until that date, not as a currently launched exam. The public comparison file [LinZi HSK 3.0 JSON](https://www.linzi.app/data/files/hsk30-words.json) has 11,036 rows with simplified/traditional forms, pinyin, zhuyin, and English definitions under CC BY-SA 4.0. It downloads without login and is a useful cross-check rather than a duplicate app set.
- [LinZi TOCFL data](https://www.linzi.app/data/) and [DouDou/wordfreq](https://doudou-chinese.com/downloads/README.txt) are already included as separately labeled study sets. See [east-asian-open-vocab.md](east-asian-open-vocab.md) for row counts and attribution.
- [Mandarin The Wild](https://mandarinthewild.com/teachers) exposes HSK word-list PDFs/spreadsheets without login. Its page explicitly licenses the word lists CC BY-SA 4.0; do not treat its 446 readings, exam papers, audio, or other site materials as covered by that word-list license.

## Chinese–Vietnamese dictionary glosses

- [OpenCidian by Perxel](https://github.com/OpenCidian/opencidian-data) publishes a downloadable dictionary snapshot under CC BY-SA 4.0. The release used here is `data-2026-11-10-dc2df3f` (commit `dc2df3feb6ece6d6585c3492225c9bd31ebb96b0`). Its per-entry `vi` senses identify CVDICT as their source; its English senses and pinyin identify CC-CEDICT. The project documents both datasets as CC BY-SA 4.0.
- For Hanyu vocabulary, only join a Vietnamese sense when both the simplified headword and tone-normalized pinyin syllables match. Preserve the textbook's pinyin and English gloss; do not turn an English-only fallback into a claimed Vietnamese dictionary definition. Keep unmatched names/compound forms flagged for separate review.
- Required attribution from the snapshot metadata: “OpenCidian by Perxel (github.com/OpenCidian), built from CC-CEDICT, published by MDBG; CEDICT © 1997, 1998 Paul Andrew Denisowski; CVDICT by Phong Phan; Unicode Han Database (Unihan), © Unicode, Inc.; Make Me a Hanzi by Shaunak Kishore (dictionary.txt, derived from Unihan and CJKlib); Complete HSK Vocabulary by Yanis Zafirópulos (drkameleon); Thiều Chửu, Hán Việt tự điển (1942); digital edition proofread by Đặng Thế Kiệt, Lê Văn Đặng, Nguyễn Hữu Vinh; file by Phan Cát Tú (catusf/tudien, CC0).” The matching subset and any derivative gloss data remain CC BY-SA 4.0.

## Additional public courses and readings

These sources are linked in the Hanyu page. Their content is not bundled into ReadUp unless a separate source-specific reuse check is completed.

| Source | Material | License / scope | Login |
| --- | --- | --- | --- |
| [UT Austin COERLL Chinese Dialogues](https://coerll.utexas.edu/coerll/oer/chinese-dialogues-podcast/) | Beginner audio dialogues with downloadable simplified/traditional Chinese transcripts and English translations | CC BY | Public transcript pages; no login found |
| [UT Austin Chinese Grammar Lesson Videos](https://coerll.utexas.edu/coerll/materials/language/chinese/) | Beginner grammar video playlist | CC BY-NC | Public YouTube playlist; no login to view |
| [Chinese Take-In](https://www.laits.utexas.edu/chinese_take_in/) | Interactive first-year listening practice | CC BY-NC-SA | Public; no login found |
| [Du Chinese OER](https://duchinese.net/l/oer) | 35 selected Chinese readings with direct text downloads | CC BY-NC-SA 4.0 covers the Chinese text only; excludes translations, audio, and ancillary materials | Public download; no login |
| [EverFlow Mandarin](https://www.colorado.edu/project/everflowmandarin/) | 10 intermediate/advanced lessons; public 550-word glossary | CC BY-NC-SA 4.0 for included textbook material; some cited/linked items are expressly outside that license | Public site and glossary; no login found |
| [Michigan State University Elementary Chinese II](https://openbooks.lib.msu.edu/chs102/) | Six second-semester chapters with dialogue, vocabulary, grammar, and culture notes | CC BY-NC 4.0 | Public book/PDF/EPUB; no login |
| [A Course in Mandarin Chinese · Wikibooks](https://open-book-project.github.io/textbooks/open-textbooks/wb-chinese-mandarin/index.html) | 17 chapters of pronunciation, dialogue, vocabulary, grammar, and exercises | CC BY-SA 4.0 | Public; no login |
| [MIT OpenCourseWare Learning Chinese](https://ocw.mit.edu/courses/res-21g-003-learning-chinese-a-foundation-course-in-mandarin-spring-2011/) | Beginner/intermediate materials and audio | CC BY-NC-SA 4.0 | Public; no login |

Sources marked NC remain link-only because that license does not permit commercial reuse. Chinese-language readings are not automatically available for redistribution merely because they can be opened without an account.
