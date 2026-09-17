import { test } from 'node:test';
import assert from 'node:assert/strict';

import seed from '@/data/seed/bilingual/index.json';

import { glossaryWordsOf, offlineGloss } from './offline-glossary';

type Article = {
  titleEn: string;
  standfirstEn: string;
  paragraphs: { en: string }[];
};

const articles = (Array.isArray(seed) ? seed : (seed as { articles: unknown }).articles) as Article[];

test('từ điển dựng sẵn có nghĩa cho MỌI từ trong kho song ngữ', () => {
  const missing = new Set<string>();
  for (const a of articles) {
    const texts = [a.titleEn, a.standfirstEn, ...a.paragraphs.map((p) => p.en)];
    for (const t of texts) {
      for (const w of glossaryWordsOf(t)) if (!offlineGloss(w)) missing.add(w);
    }
  }
  assert.deepEqual([...missing], []);
});

test('nhận cả dạng có dấu nháy và sở hữu cách như token của bài', () => {
  const plain = offlineGloss('city');
  assert.ok(plain?.meaningVi);
  assert.equal(offlineGloss("city's")?.meaningVi, plain?.meaningVi);
  assert.equal(offlineGloss("'city'")?.meaningVi, plain?.meaningVi);
});

test('từ ngoài kho trả null để còn rơi xuống tra mạng', () => {
  assert.equal(offlineGloss('zzzqqq'), null);
});
