import assert from 'node:assert/strict';
import { test } from 'node:test';

import { PARAGRAPH_PROMPTS } from '@/data/paragraph-prompts';
import { reviewParagraph, splitSentences } from './paragraph-review';

test('tách câu giữ vị trí', () => {
  const t = 'I like tea. Do you like it? Yes!';
  const s = splitSentences(t);
  assert.equal(s.length, 3);
  assert.equal(t.slice(s[1]!.start, s[1]!.end), 'Do you like it?');
});

test('đoạn mẫu của mọi đề: không có lỗi cứng nào (chống báo nhầm)', () => {
  const bad: string[] = [];
  for (const p of PARAGRAPH_PROMPTS) {
    const r = reviewParagraph({ id: p.id, minSentences: p.minSentences, keywords: p.keywords, structures: p.structures }, p.model);
    for (const s of r.sentences) {
      const errs = s.issues.filter((i) => i.severity === 'error');
      if (errs.length) bad.push(`${p.id}: ${s.text} => ${errs.map((e) => `${e.found}=>${e.fix ?? ''}`).join(' | ')}`);
    }
    assert.equal(r.meetsLength, true, `${p.id} ngắn hơn ${p.minSentences} câu`);
  }
  assert.equal(bad.length, 0, bad.join('\n'));
});

test('đoạn có lỗi: chỉ ra lỗi theo câu và không cho qua', () => {
  const text = 'i think social media is very good. It make teenagers talks to friends. But I am agree that too much time online is bad';
  const r = reviewParagraph({ id: 'x', minSentences: 3, keywords: ['social', 'media', 'teenagers'] }, text);
  assert.equal(r.sentenceCount, 3);
  assert.ok(r.sentences[0]!.issues.some((i) => i.kind === 'punctuation'));
  assert.ok(r.sentences[0]!.vocab.some((v) => v.kind === 'upgrade'));
  assert.ok(r.sentences[1]!.issues.some((i) => i.severity === 'error'));
  assert.ok(r.sentences[2]!.issues.some((i) => i.kind === 'vietnamese'));
  assert.equal(r.passed, false);
  assert.ok(r.improveVi.length > 0);
});

test('bốn tiêu chí luôn có và nằm trong 0–3', () => {
  const r = reviewParagraph({ id: 'y', minSentences: 2 }, 'Cats sleep a lot. However, dogs prefer walking because they enjoy company.');
  assert.equal(r.criteria.length, 4);
  for (const c of r.criteria) assert.ok(c.score >= 0 && c.score <= 3);
});

test('chế độ dịch cả đoạn: đối chiếu từng câu với câu mẫu', () => {
  const r = reviewParagraph(
    {
      id: 'z',
      minSentences: 2,
      models: [
        { en: 'I wake up at six every morning.', vi: 'Tôi dậy lúc sáu giờ mỗi sáng.' },
        { en: 'I make coffee for breakfast.', vi: 'Tôi pha cà phê ăn sáng.' },
      ],
    },
    'I wake up at six every morning. I like music.',
  );
  assert.ok(r.sentences[0]!.versus?.passed);
  assert.ok(r.sentences[1]!.versus && r.sentences[1]!.versus.missing.length > 0);
});
