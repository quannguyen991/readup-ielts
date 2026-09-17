import { test } from 'node:test';
import assert from 'node:assert/strict';

import { BILINGUAL_ARTICLES } from '@/data/bilingual-repository';

import { isGlossable, normaliseToken, offlineGloss } from './offline-glossary';

test('từ điển dựng sẵn có nghĩa cho MỌI từ người đọc rê được trong kho song ngữ', () => {
  // Tách y như màn đọc: theo khoảng trắng, rồi thường hoá từng token.
  const missing = new Set<string>();
  for (const a of BILINGUAL_ARTICLES) {
    const texts = [a.titleEn, a.standfirstEn, ...a.paragraphs.map((p) => p.en)];
    for (const t of texts) {
      for (const part of t.split(/\s+/)) {
        const token = normaliseToken(part);
        if (isGlossable(token) && !offlineGloss(token)) missing.add(`${token} (${part})`);
      }
    }
  }
  assert.deepEqual([...missing], []);
});

test('thường hoá gập dấu, dấu nháy cong và gạch nối dài', () => {
  assert.equal(normaliseToken('Vietnam’s'), "vietnam's");
  assert.equal(normaliseToken('cafés,'), 'cafes');
  assert.equal(normaliseToken('rice–shrimp'), 'rice-shrimp');
  assert.equal(isGlossable(normaliseToken('1247,')), false);
});

test('nhận cả dạng có dấu nháy và sở hữu cách', () => {
  const plain = offlineGloss('city');
  assert.ok(plain?.meaningVi);
  assert.equal(offlineGloss("city's")?.meaningVi, plain?.meaningVi);
  assert.equal(offlineGloss("'city'")?.meaningVi, plain?.meaningVi);
});

test('từ ngoài kho trả null để còn rơi xuống tra mạng', () => {
  assert.equal(offlineGloss('zzzqqq'), null);
});

test('kho song ngữ chỉ mang thẻ đậm/nghiêng — màn đọc chỉ vẽ được hai loại này', () => {
  for (const a of BILINGUAL_ARTICLES) {
    const tags = JSON.stringify(a).match(/<\/?[a-z][^>]*>/gi) ?? [];
    const odd = tags.filter((t) => !/^<\/?(b|i|em|strong)>$/i.test(t));
    assert.deepEqual(odd, [], `${a.id} có thẻ lạ`);
  }
});

test('thường hoá gỡ thẻ trước khi tra', () => {
  assert.equal(normaliseToken('<i>salary</i>,'), 'salary');
});
