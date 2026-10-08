# IELTS source tests kept on this machine

The Cambridge PDFs, audio, answer keys and extracted text live in `.local-private/ielts-ocr/`. That folder is ignored by Git and is not included in normal deploy bundles. The `/ielts-source-practice` screen reads this private store on the local Expo web server.

## Sources imported

- Cambridge IELTS 8 Academic Tests 1–4 and General Training Tests A–B.
- Six Reading tests named **VOL 10 KEY**; this folder does not verify them as an official Cambridge volume.
- Cambridge IELTS 20 Reading and Listening Tests 1–4, including answer keys. Reading/Listening pages are extracted into the 40-question answer-sheet flow. Audio is available for Listening Tests 1–2; the shared Drive folder did not contain playable audio for Tests 3–4.
- Cambridge IELTS 17–19 full-book scans and their Listening audio. OCR output is machine-extracted and must be checked against the source PDF before using its answers for a final score.

The spreadsheet contains 99 `XEM` links to an outside practice site. Cambridge IELTS 10–16 and 21 are listed in the screen as external-source entries so learners can open those pages; their questions, answers, PDFs and audio are not copied into the app. The sheet is not the source PDF library.

## Rebuild the local import

Place the Drive files in `.local-private/ielts-ocr/` with the names used by the importer, then run:

```sh
node scripts/ielts/extract-drive-cambridge.mjs
python scripts/ielts/ocr-drive-cambridge.py
python scripts/ielts/import-drive-cambridge.py
```

The OCR step requires local Python packages `pymupdf`, `numpy`, `rapidocr-onnxruntime` and `openpyxl`. It saves a checkpoint every 25 pages so an interrupted scan can resume. The Cambridge 20 extractor uses the repo's `pdfjs-dist` dependency. Rerunning the earlier Cambridge 8 importer preserves the Cambridge 17–20 and external-link entries already in the private bundle.

## Practice behavior

Choose a source and test at `/ielts-source-practice`, fill the 40 answer slots, and submit. Draft answers stay in that browser's local storage. Structured keys are hidden until submission. Verified Reading/Listening keys also show an estimated section band from typical raw-score thresholds; this is not an official result, and conversion cutoffs can vary by test version. Cambridge 17–19 OCR keys remain available as source pages after submission but are not auto-scored until their OCR answers are checked against the PDF. OCR review pages and their confidence notes are retained when present.
