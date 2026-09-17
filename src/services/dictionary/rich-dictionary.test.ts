import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

import { BILINGUAL_ARTICLES } from '@/data/bilingual-repository';

import { isGlossable, normaliseToken } from './offline-glossary';
import { findRich, type RichEntry } from './rich-dictionary';

type Packed = [string, string, string, string, string, string[]];

function load(id: string): Record<string, RichEntry> {
  const raw = JSON.parse(readFileSync(`public/bilingual-dict/${id}.json`, 'utf8')) as Record<string, Packed>;
  return Object.fromEntries(
    Object.entries(raw).map(([w, p]) => [
      w,
      { ipa: p[0], pos: p[1], defEn: p[2], meaningVi: p[3], example: p[4], synonyms: p[5] },
    ]),
  );
}

test('mọi bài song ngữ đều có tệp từ điển chi tiết, phủ MỌI từ bấm được', () => {
  const gaps: string[] = [];
  for (const a of BILINGUAL_ARTICLES) {
    const path = `public/bilingual-dict/${a.id}.json`;
    assert.ok(existsSync(path), `${a.id} chưa dựng từ điển — chạy node scripts/build-bilingual-dict.mjs`);
    const table = load(a.id);
    for (const t of [a.titleEn, a.standfirstEn, ...a.paragraphs.map((p) => p.en)]) {
      for (const part of t.split(/\s+/)) {
        const w = normaliseToken(part);
        if (isGlossable(w) && !findRich(table, w)) gaps.push(`${a.id}: ${w}`);
      }
    }
  }
  assert.deepEqual(gaps.slice(0, 20), []);
});

test('mục từ điển đủ trường: phiên âm, nghĩa Việt, ví dụ, từ đồng nghĩa là mảng', () => {
  const table = load(BILINGUAL_ARTICLES[0]!.id);
  const bad = Object.entries(table).filter(
    ([, e]) => !e.meaningVi || !Array.isArray(e.synonyms) || typeof e.example !== 'string',
  );
  assert.deepEqual(bad.map(([w]) => w), []);
});
