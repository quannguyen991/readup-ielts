# IELTS source tests kept on this machine

The Cambridge PDFs, audio, answer keys and extracted text live in `.local-private/ielts-ocr/`. That folder is ignored by Git and is not included in normal deploy bundles. The `/ielts-source-practice` screen reads this private store on the local Expo web server.

## Sources imported

- Cambridge IELTS 8 Academic Tests 1–4 and General Training Tests A–B.
- Six Reading tests named **VOL 10 KEY**; this folder does not verify them as an official Cambridge volume.
- Cambridge IELTS 20 Reading and Listening Tests 1–4, including answer keys. Reading/Listening pages are extracted into the 40-question answer-sheet flow. Audio is available for Listening Tests 1–2; the shared Drive folder did not contain playable audio for Tests 3–4.
- Cambridge IELTS 21 Academic Tests 1–4 across Listening, Reading, Writing and Speaking, with the source PDF and all four Listening audio tracks. Reading and Listening answer keys are included as source pages but are not auto-scored until verified. Original files and extracted text stay in the private local store.
- Cambridge IELTS 17–19 full-book scans and their Listening audio. OCR output is machine-extracted and must be checked against the source PDF before using its answers for a final score.

The spreadsheet contains 99 `XEM` links to an outside practice site. Cambridge IELTS 10–16 remain available as external-source entries. Cambridge IELTS 21 is imported from the user-provided local PDF and audio files. The sheet is not the source PDF library.

## Inventory checked on 20 October 2026

- 106 local skill papers: Cambridge 8 Academic and General Training, Cambridge 17–21, and six `VOL 10 KEY` Reading papers. Every local paper has the expected number of parts, split using source headings or reviewed source boundaries.
- Cambridge 21 sorts before 20, 19 and older books. Volumes sort numerically from newest to oldest; test numbers increase within each book.
- 421 public practice links were collected from 41 source pages, including IELTS Practice Test Volumes 7–8, Recent Mock Tests, Practice Tests Plus, British Council and IDP samples, and current Speaking forecast pages. These open at their source; the crawler keeps source links and task-type metadata instead of copying the providers' test bodies or answer keys.
- Listening uses four 10-question parts; Reading uses three passages with the source question ranges; Writing uses two tasks with 150/250-word minima; Speaking uses three parts, including a one-minute preparation timer and a two-minute long turn.
- Page images retain maps, charts and diagrams. Unverified keys remain source pages for review after submission. Only six complete Cambridge 20 keys currently qualify for automatic scoring.
- Missing source audio: Cambridge 20 Listening Tests 3–4 and Cambridge 8 Listening Tests 1–4. The old Drive entries for Cambridge 20 Tests 3–4 were AppleDouble `._` metadata, not playable audio. These papers are marked as missing audio.
- The Speaking library now has eight sets and 72 samples: four sourced September–December 2026 forecast themes and four original common cue-card patterns. Every sample has a Vietnamese translation, vocabulary, speaking structure notes and a matching practice question.
- Original Listening papers now vary note, table, summary and sentence completion layouts. British Council and IDP source pages were crawled for common task formats; the ReadUp question text is authored separately.

The metadata-only audit is saved in `docs/IELTS_BANK_AUDIT_2026-10-20.json`. The original private manifest is retained as `source-tests.before-source-rebuild.json`.

## Rebuild the local import

Place the Drive files in `.local-private/ielts-ocr/` with the names used by the importer, then run:

```sh
node scripts/ielts/extract-drive-cambridge.mjs
python scripts/ielts/ocr-drive-cambridge.py
python scripts/ielts/import-drive-cambridge.py
python scripts/ielts/import-local-cambridge-20-21.py
python scripts/ielts/rebuild-source-bank.py
```

After the initial source extraction, `npm run ielts:rebuild-sources` rebuilds the current local bank, `npm run ielts:crawl-catalog` refreshes public test links, and `npm run ielts:audit-sources` checks part counts, answer ranges, local assets and Speaking sample links. The rebuild requires Pillow in addition to PyMuPDF. Original Cambridge 8, Cambridge 20 Academic and VOL 10 KEY PDFs are read from the `D:\` paths named in the script.

The OCR step requires local Python packages `pymupdf`, `numpy`, `rapidocr-onnxruntime` and `openpyxl`. It saves a checkpoint every 25 pages so an interrupted scan can resume. The Cambridge 20 extractor uses the repo's `pdfjs-dist` dependency. Rerunning the earlier Cambridge 8 importer preserves the Cambridge 17–21 and external-link entries already in the private bundle. Public catalog entries are provider web pages, not downloaded scans; OCR is generated for source PDFs kept in the private folder, and the catalog links open the provider's page.

## Practice behavior

Choose a source and skill at `/ielts-source-practice`. The practice room uses the paper's actual parts and question ranges. Reading/Listening have 40 answer slots; Writing has two essays; Speaking supports voice-to-text practice for each part. Draft answers stay in the browser. Source keys appear after submission. Verified Reading/Listening keys show an estimated band; Writing/Speaking are not graded as objective 40-question tests.
