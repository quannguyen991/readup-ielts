# Cambridge IELTS 10–21 vocabulary corpus

This corpus combines the project's Cambridge Reading wordlist with headwords found in available Cambridge page OCR/text caches. It stores vocabulary evidence and short phrases only; it does not copy complete passages, questions, Writing prompts, or sample answers.

## Files

- `src/data/seed/vocab-cambridge/cambridge-10-21-vocabulary.json` — generated vocabulary records, page references, collocations, paraphrases, and coverage manifest.
- `src/data/seed/vocab-cambridge/ocr-additions.json` — compact runtime index containing the prioritized OCR additions and book/section groups.
- `src/data/cambridge-vocabulary-ocr.ts` — accessor for looking up OCR terms by book and section.
- `scripts/cambridge/build-cambridge-vocabulary.mjs` — rebuilds the corpus from the local Cambridge caches and vocabulary sources.

## Current coverage

- The pre-existing Reading baseline has 6,155 unique headwords across 144 Reading passage lists (12 passages for each book 10–21).
- The combined corpus has 10,936 unique terms, including the 6,155-term Reading baseline and 8,500 linked topic-lexicon entries. There are 6,334 terms matched to exact local page text; 1,366 of those are outside the Reading baseline.
- `additionalTerms` contains 1,334 prioritized OCR/text-evidence study terms, deduplicated by lemma when the source provides one. Selection requires exact source-page evidence plus at least one of: a useful dictionary collocation, paraphrase set, multiword expression, or recurrence across tests/books. Each item keeps its surface variants, dictionary details, and exact page refs. These are study-selection signals, not official Cambridge frequency ratings.
- The compact runtime file contains only those 1,334 selected terms; the 10,936-record evidence corpus is not imported by the app.
- Cached source-test pages cover 136 tests: 48 Listening, 48 Reading, and 20 each for Writing and Speaking. Within that cached dataset, Writing and Speaking records exist only for Cambridge 17–21.
- Standalone PDF OCR caches cover Cambridge 11 (143 pages), Cambridge 12 (129 pages), Cambridge 13 (140 pages), Cambridge 14 (95 pages), Cambridge 17, 18, 19, and Cambridge 20 Academic (1,111 pages total). Two additional local PDFs have selectable text: Cambridge 10 is partial (92 pages, all with text, 91 classified as Reading); Cambridge 21 has 146 pages, 144 with text across Listening (28), Reading (57), Writing (28), and Speaking (24).

### OCR addition counts by book and skill

Counts are unique selected terms with an exact page hit in the indicated book/skill. “Unknown” is retained for pages whose nearby heading does not identify a skill.

| Book | Listening | Reading | Writing | Speaking | Unknown |
| --- | ---: | ---: | ---: | ---: | ---: |
| 10 | 123 | 548 | — | — | — |
| 11 | 138 | 230 | 82 | 226 | 33 |
| 12 | 158 | 268 | 151 | 79 | 36 |
| 13 | 140 | 263 | 119 | 193 | 2 |
| 14 | 152 | 215 | 30 | 34 | — |
| 15 | 123 | 210 | — | — | — |
| 16 | 155 | 205 | — | — | — |
| 17 | 167 | 283 | 74 | 296 | 1 |
| 18 | 199 | 274 | 99 | 255 | 1 |
| 19 | 171 | 259 | 100 | 276 | 35 |
| 20 | 124 | 268 | 78 | 317 | 14 |
| 21 | 160 | 294 | 126 | 268 | 47 |

## Evidence fields

- `references.readingPassages` points to the older Cambridge Reading wordlist baseline.
- `references.curatedExamLists` points to existing Cambridge exam-vocabulary lists and is not presented as newly OCR-verified evidence.
- `references.cachedPageText` records exact matches in the local test-page cache, including book, test, section, page, source PDF label, and matched source term.
- `references.standalonePdfOcr` records exact page matches in the standalone PDF OCR caches. Test and section are inferred from nearby page headings when present.
- `references.standalonePdfText` records exact page matches in selectable PDF text layers. Test and section are inferred from nearby page headings when present; Cambridge 10 and 21 local text-layer data are held in ignored `.local-private/ielts-ocr/` caches.
- `confidence` is `null` because the available OCR caches do not contain token-level confidence scores.
- `priority` and `tags` derive from repeated appearances, multiword forms, dictionary paraphrases, and available collocation fields. They are study-selection signals, not official Cambridge frequency ratings.

## Source access and gaps

The volume landing pages are linked in `sourcePages` in the JSON. Cambridge 11 was downloaded from its anonymous SharePoint share link by adding `download=1`, then OCRed across all 143 pages. Cambridge 12 was recovered from an anonymous SharePoint ZIP and OCRed across all 129 pages. Cambridge 13 was recovered from an anonymous SharePoint archive and OCRed across all 140 pages. Cambridge 14 was recovered from a RAR archive and OCRed across its 95 PDF pages. Cambridge 15–16 are folder links that return a SharePoint web app shell; the listing/download APIs tested require authenticated SharePoint access. Cambridge 17 links to a Google Drive folder.

No local full-book PDF/OCR source is currently available for Cambridge 15–16; their cached source-test data has Listening/Reading only. Cambridge 10’s local PDF is partial and covers Reading only. Cambridge 21’s local PDF has selectable text across all four skills. Audio transcripts for Listening are not represented in these OCR/text sources. No token-level confidence scores are available, so the term-level `confidence` field remains `null` throughout.

Source index: [The IELTS Workshop — Cambridge Practice Tests 1–21](https://onthiielts.com.vn/tron-bo-cambridge-practice-tests-for-ielts/). Cambridge 10 page: [Cambridge IELTS 10 PDF + Audio](https://onthiielts.com.vn/cambridge-ielts-10/).
