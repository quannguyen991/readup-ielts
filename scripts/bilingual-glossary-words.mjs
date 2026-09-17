// Liệt kê các dạng từ trong kho song ngữ CHƯA có nghĩa trong glossary.json,
// kèm một câu ví dụ để người soạn chọn đúng nghĩa theo ngữ cảnh.
//
//   node scripts/bilingual-glossary-words.mjs > thieu.tsv
//
// Soạn nghĩa xong thì gộp vào src/data/seed/bilingual/glossary.json theo dạng
// { "tu": ["nghĩa tiếng Việt", "loại từ"] }.
import { readFileSync } from 'node:fs';

const seed = JSON.parse(readFileSync('src/data/seed/bilingual/index.json', 'utf8'));
const articles = Array.isArray(seed) ? seed : seed.articles;
const glossary = JSON.parse(readFileSync('src/data/seed/bilingual/glossary.json', 'utf8'));

const example = new Map();
const add = (text) => {
  for (const sentence of text.split(/(?<=[.!?])\s+/)) {
    for (const m of sentence.matchAll(/[A-Za-z][A-Za-z'-]*/g)) {
      const w = m[0].toLowerCase().replace(/'s$/, '').replace(/['-]+$/, '');
      if (w && !glossary[w] && !example.has(w)) example.set(w, sentence.trim().slice(0, 160));
    }
  }
};

for (const a of articles) {
  add(`${a.titleEn}. ${a.standfirstEn}`);
  for (const p of a.paragraphs) add(p.en);
}

for (const [w, s] of [...example].sort((x, y) => x[0].localeCompare(y[0]))) {
  console.log(`${w}\t${s}`);
}
console.error(`${example.size} từ còn thiếu`);
