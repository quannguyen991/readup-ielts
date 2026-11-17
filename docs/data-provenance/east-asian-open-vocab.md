# Open East Asian vocabulary data

The generated `src/data/east-asian-open-vocab.json` contains five separately attributable study sets. The Chinese additions are separate from the copyrighted Hanyu Jiaocheng textbook and are distributed under **CC BY-SA 4.0**. Keep the attribution and share-alike terms if redistributing this data.

## HSK 3.0 vocabulary under the 2021 proficiency standard

- Source: [LinZi open Chinese learning datasets](https://www.linzi.app/data/), [HSK 3.0 JSON](https://www.linzi.app/data/files/hsk30-words.json), following the Chinese Proficiency Grading Standards for International Chinese Language Education (GF0025-2021).
- The source has 11,036 rows. The app merges repeated simplified headwords into 10,960 cards, retains every source level and traditional variant, and keeps reading/gloss pairs together. The earliest level determines study order.
- License: CC BY-SA 4.0. English definitions derive from CC-CEDICT; keep both attributions.
- This dataset is distinct from the newer 2025 HSK examination syllabus already represented in `book-hsk-3-0`. The official Chinese Test Service site says the revised exam launches worldwide on 13 December 2026. Keep the two versions separate and label their standards clearly.
- Band 9 groups the words into its own topics and study units of at most 50 words; those groups do not represent textbook lesson order.

## HSK 2.0 vocabulary

- Source: [complete-HSK Vocabulary](https://github.com/drkameleon/complete-hsk-vocabulary), HSK 2.0 exclusive level lists.
- Repository data license: MIT. The source repository attributes its HSK lists to public HSK syllabi and its English dictionary glosses to CC-CEDICT.
- This app reuses the HSK words, pinyin, part-of-speech labels, and CC-CEDICT-derived English glosses. The combined dataset therefore follows CC BY-SA 4.0 for redistribution.
- Band 9 groups these entries into its own themes and study units of at most 50 words. Use it for review alongside HSK Standard Course; it is not transcribed from that textbook's lesson order.
- The open list contains 4,991 distinct entries. It is a community HSK 2.0 list, not an exact copy of the [Chinese Test Service 2015 vocabulary file](https://old.chinesetest.cn/userfiles/file/HSK/HSK-2015.xlsx): a local comparison found 4,779 shared spellings, 221 entries only in the CTI file, and 212 only in the community list. The CTI workbook is not bundled here.

## Japanese JLPT vocabulary

- Source: [OpenJLPT](https://github.com/evanclan/OpenJLPT), vocabulary N5–N1 JSON files.
- License: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
- Upstream sources and required notices: [OpenJLPT NOTICE.md](https://github.com/evanclan/OpenJLPT/blob/main/NOTICE.md), including JMdict, KANJIDIC2, Jonathan Waller's community JLPT lists, and Tatoeba examples.
- JLPT levels are community approximations; the Japan Foundation does not publish official post-2010 vocabulary lists. Band 9 regrouped words by topic and study units of at most 50. This set is not copied from the lesson order of Minna no Nihongo, Genki, Shin Kanzen Master, or Nihongo So-Matome.

## TOCFL vocabulary from LinZi

- Source: [LinZi open Chinese learning datasets](https://www.linzi.app/data/), TOCFL 華語八千詞 JSON.
- Upstream file: [tocfl-words.json](https://www.linzi.app/data/files/tocfl-words.json), 7,187 rows with simplified and traditional forms, pinyin, zhuyin, level bands, and English definitions. The app merges repeated simplified headwords into 7,162 flashcards and combines their distinct readings/definitions so progress keys remain unique.
- License: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/), including commercial reuse with attribution and share-alike. LinZi says its English definitions derive from CC-CEDICT; retain both attributions.
- The app displays simplified characters as the main form and keeps the traditional form and zhuyin as supplementary card details. Band 9 groups each source band into themes and study units of at most 50 words. It is a TOCFL list, not Hanyu Jiaocheng lesson order.

## Mandarin frequency vocabulary

- Source: DouDou Chinese's [frequency downloads and README](https://doudou-chinese.com/downloads/README.txt), using the 3.1.1 Chinese list from [wordfreq](https://github.com/rspeer/wordfreq) by Robyn Speer.
- The app takes only the top 10,000 ranks, then keeps the 9,754 simplified headwords with a matching entry in [CC-CEDICT](https://cc-cedict.org/wiki/). Pinyin and English definitions come from CC-CEDICT. This does not claim every word in the frequency ranking has a dictionary match.
- DouDou/wordfreq frequency data and CC-CEDICT are CC BY-SA 4.0. The snapshot draws on multiple corpora, including Wikipedia, subtitles, news, web text, and social media; it is a frequency reference, not a textbook syllabus.
- Band 9 separates ranks into 1,000-word bands, then adds its own thematic groups and study units of at most 50 words.

## Attribution

When distributing `east-asian-open-vocab.json` or a derivative, credit the sources and retain this CC BY-SA 4.0 notice:

> Vocabulary data adapted from complete-HSK Vocabulary, OpenJLPT, LinZi HSK 3.0 (GF0025-2021), LinZi TOCFL, and DouDou Chinese/wordfreq. Japanese JLPT-level data: OpenJLPT, with upstream sources JMdict, KANJIDIC2, Jonathan Waller's lists, and Tatoeba. Chinese dictionary glosses and pinyin: CC-CEDICT. Band 9 topic groupings are original. Licensed under CC BY-SA 4.0.

OpenJLPT's requested attribution line: “Contains data from OpenJLPT (CC BY-SA 4.0), which uses JMdict and KANJIDIC2 (EDRDG), Jonathan Waller's JLPT lists, and Tatoeba.”

The raw source downloads used to build the file are kept in the ignored `.local-private/open-vocab/` directory. Fetch them with `npm run vocab:east-asian-fetch`, then rebuild with `npm run vocab:east-asian-open`.
