# Open East Asian vocabulary data

The generated `src/data/east-asian-open-vocab.json` contains two separately attributable study sets. Both are derived data and are distributed under **CC BY-SA 4.0**. Keep the attribution and share-alike terms if redistributing this data.

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

## Attribution

When distributing `east-asian-open-vocab.json` or a derivative, credit the sources and retain this CC BY-SA 4.0 notice:

> Vocabulary data adapted from complete-HSK Vocabulary and OpenJLPT. Japanese JLPT-level data: OpenJLPT, with upstream sources JMdict, KANJIDIC2, Jonathan Waller's lists, and Tatoeba. HSK words and dictionary glosses: complete-HSK Vocabulary and CC-CEDICT. Band 9 topic groupings are original. Licensed under CC BY-SA 4.0.

OpenJLPT's requested attribution line: “Contains data from OpenJLPT (CC BY-SA 4.0), which uses JMdict and KANJIDIC2 (EDRDG), Jonathan Waller's JLPT lists, and Tatoeba.”

The raw source downloads used to build the file are kept in the ignored `.local-private/open-vocab/` directory. Fetch them with `npm run vocab:east-asian-fetch`, then rebuild with `npm run vocab:east-asian-open`.
