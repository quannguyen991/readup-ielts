import assert from 'node:assert/strict';
import { test } from 'node:test';

import { DICTATION_SENTENCES, TRANSLATION_SENTENCES } from './sentence-drills';

test('chép chính tả: đủ 100 câu, id không trùng, không câu nào rỗng', () => {
  assert.equal(DICTATION_SENTENCES.length, 100);
  const ids = new Set(DICTATION_SENTENCES.map((i) => i.id));
  assert.equal(ids.size, DICTATION_SENTENCES.length);
  for (const item of DICTATION_SENTENCES) {
    assert.ok(item.text.trim().length > 0, `câu rỗng: ${item.id}`);
    // Câu đọc bằng TTS phải kết câu rõ ràng — không có dấu câu thì giọng đọc
    // dính liền các câu khi ghép, và người nghe không biết câu đã hết chưa.
    assert.match(item.text.trim(), /[.!?]$/, `thiếu dấu kết câu: ${item.id}`);
    // Bắt đúng lớp lỗi đã gặp thật: bước sinh/sửa bằng AI có lúc trả về
    // nguyên một object JSON lồng vào trường "text" thay vì câu thuần.
    assert.ok(!item.text.trim().startsWith('{'), `text bị lồng JSON: ${item.id}`);
  }
});

test('dịch câu: đủ 100 câu, id không trùng, đủ ba trường vi/en/hint', () => {
  assert.equal(TRANSLATION_SENTENCES.length, 100);
  const ids = new Set(TRANSLATION_SENTENCES.map((i) => i.id));
  assert.equal(ids.size, TRANSLATION_SENTENCES.length);
  for (const item of TRANSLATION_SENTENCES) {
    assert.ok(item.vi.trim().length > 0, `thiếu câu tiếng Việt: ${item.id}`);
    assert.ok(item.en.trim().length > 0, `thiếu đáp án mẫu: ${item.id}`);
    assert.ok(item.hint.trim().length > 0, `thiếu gợi ý cấu trúc: ${item.id}`);
    assert.ok(!item.en.trim().startsWith('{'), `en bị lồng JSON: ${item.id}`);
  }
});

test('không có hai câu chép chính tả nào trùng nội dung (không phân biệt hoa/thường, dấu câu)', () => {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  const seen = new Map<string, string>();
  for (const item of DICTATION_SENTENCES) {
    const key = norm(item.text);
    const dupOf = seen.get(key);
    assert.ok(!dupOf, `${item.id} trùng nội dung với ${dupOf}`);
    seen.set(key, item.id);
  }
});

test('không có hai câu dịch nào trùng câu tiếng Việt đề bài', () => {
  const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}0-9 ]/gu, ' ').replace(/\s+/g, ' ').trim();
  const seen = new Map<string, string>();
  for (const item of TRANSLATION_SENTENCES) {
    const key = norm(item.vi);
    const dupOf = seen.get(key);
    assert.ok(!dupOf, `${item.id} trùng câu tiếng Việt với ${dupOf}`);
    seen.set(key, item.id);
  }
});

test('mỗi bài đều chia đủ ba mức khó, mỗi mức ít nhất vài câu', () => {
  for (const bank of [DICTATION_SENTENCES, TRANSLATION_SENTENCES]) {
    const byDifficulty = { easy: 0, medium: 0, hard: 0 };
    for (const item of bank) byDifficulty[item.difficulty] += 1;
    assert.ok(byDifficulty.easy >= 5 && byDifficulty.medium >= 5 && byDifficulty.hard >= 5);
  }
});
