# Local IELTS OCR sources

This private import keeps book OCR out of Git and normal app bundles.

From the repository root, run:

```sh
npm run ielts:import-local-ocr -- "C:\Users\admin\Documents\Codex\2026-10-02\h-y-t-m-cho-t\outputs"
```

The importer writes `.local-private/ielts-ocr/source-tests.json`. Open `/ielts-source-practice` in the local Expo web app to browse the imported page text. Imported answers/support pages are requested only after submitting the page. Draft responses are saved in that browser's local storage.

The import contains Cambridge IELTS 8 Academic Tests 1–4, General Training Tests A–B, and six Reading tests named **VOL 10 KEY**. It does not identify VOL 10 KEY as official Cambridge IELTS 10. Original PDF page numbers and OCR confidence markers are retained. Cambridge pages flagged for review are 21, 44, 48, 62, 65, 67, 73, 85, 87, 88, 109, 111, 112, 120, 122, 126, 135, 154, 158, 164, 168, 171, and 173.

This view is a local OCR review/practice surface: it presents page text and a saved answer draft, then reveals source support pages after submission. It does not yet normalize every item into individual interactive question widgets or calculate Reading raw scores/bands. OCR content is not suitable for official scoring until the flagged lines and question/answer mapping are checked against the PDFs. No Cambridge Listening audio or Speaking prompt set is included.
