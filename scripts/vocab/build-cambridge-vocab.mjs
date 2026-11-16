// Dựng src/data/seed/vocab-cambridge/index.json từ CSV (book,test,passage,headword).
// Chạy: node scripts/vocab/build-cambridge-vocab.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const csv = readFileSync(resolve(here, 'cam-vocab-covers/cambridge-reading-headwords.csv'), 'utf8').replace(/^﻿/, '');

function parseLine(line) {
  const out = []; let cur = ''; let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) { if (ch === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
    else if (ch === '"') q = true; else if (ch === ',') { out.push(cur); cur = ''; } else cur += ch;
  }
  out.push(cur); return out;
}

const books = new Map();
for (const line of csv.split(/\r?\n/).slice(1)) {
  if (!line.trim()) continue;
  const [book, test, passage, headword] = parseLine(line);
  const n = +book.match(/(\d+)$/)[1], t = +test.match(/(\d+)$/)[1], p = +passage.match(/(\d+)$/)[1];
  const w = headword.trim();
  if (!w) continue;
  if (!books.has(n)) books.set(n, new Map());
  const key = `${t}.${p}`;
  const b = books.get(n);
  if (!b.has(key)) b.set(key, { test: t, passage: p, words: [] });
  b.get(key).words.push(w);
}

const result = {
  books: [...books.entries()].sort((a, b) => a[0] - b[0]).map(([n, ps]) => ({
    n,
    passages: [...ps.values()].sort((a, b) => a.test - b.test || a.passage - b.passage),
  })),
};
for (const b of result.books) {
  const total = b.passages.reduce((s, p) => s + p.words.length, 0);
  console.log(`Cambridge ${b.n}: ${b.passages.length} passages, ${total} words`);
}
writeFileSync(resolve(here, '../../src/data/seed/vocab-cambridge/index.json'), JSON.stringify(result));
