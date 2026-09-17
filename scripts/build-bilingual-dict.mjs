// Dựng từ điển chi tiết cho từng bài song ngữ.
//
//   node scripts/build-bilingual-dict.mjs
//
// Đọc:  content/bilingual-rich-dictionary.json  { tu: [ipa, pos, defEn, meaningVi, example, synonyms[]] }
// Ghi:  public/bilingual-dict/<articleId>.json  — chỉ những từ có trong bài đó
//       src/data/seed/bilingual/glossary.json   — bổ sung nghĩa rê chuột cho từ còn thiếu
//
// Vì sao tách theo bài: xem `src/services/dictionary/rich-dictionary.ts`.
// Từ nào trong bài mà từ điển chưa có thì in ra cuối — soạn thêm rồi chạy lại.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const articles = JSON.parse(readFileSync('src/data/seed/bilingual/index.json', 'utf8'));
const rich = JSON.parse(readFileSync('content/bilingual-rich-dictionary.json', 'utf8'));
const glossaryPath = 'src/data/seed/bilingual/glossary.json';
const glossary = JSON.parse(readFileSync(glossaryPath, 'utf8'));

// Cùng luật thường hoá với `normaliseToken` ở offline-glossary.ts.
const norm = (raw) =>
  raw
    .replace(/<\/?[a-z][^>]*>/gi, '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’‘]/g, "'")
    .replace(/–/g, '-')
    .toLowerCase()
    .replace(/[^a-z0-9'-]/g, '');

const candidates = (w) => {
  const t = w.replace(/^['-]+|['-]+$/g, '');
  return [w, t, t.replace(/'s$/, ''), t.replace(/s'$/, 's')];
};

rmSync('public/bilingual-dict', { recursive: true, force: true });
mkdirSync('public/bilingual-dict', { recursive: true });

const missing = new Set();
let bytes = 0;
let added = 0;

for (const a of articles) {
  const table = {};
  const texts = [a.titleEn, a.standfirstEn, ...a.paragraphs.map((p) => p.en)];
  for (const t of texts) {
    for (const part of t.split(/\s+/).flatMap((p) => p.split(/(?<=[—―/])(?=\S)/))) {
      const w = norm(part);
      if (w.length < 2 || !/[a-z]/.test(w)) continue;
      const key = candidates(w).find((k) => rich[k]);
      if (!key) {
        missing.add(w);
        continue;
      }
      table[key] = rich[key];
    }
  }
  const json = JSON.stringify(table);
  bytes += json.length;
  writeFileSync(`public/bilingual-dict/${a.id}.json`, json);
}

for (const [word, entry] of Object.entries(rich)) {
  if (!glossary[word] && entry[3]) {
    glossary[word] = [entry[3], entry[1]];
    added++;
  }
}
const sorted = Object.fromEntries(Object.keys(glossary).sort().map((k) => [k, glossary[k]]));
writeFileSync(glossaryPath, JSON.stringify(sorted));

console.log(`${articles.length} bài · trung bình ${Math.round(bytes / articles.length / 1024)} KB/bài · glossary +${added}`);
if (missing.size) console.log(`THIẾU ${missing.size} từ:`, [...missing].slice(0, 60).join(', '));
