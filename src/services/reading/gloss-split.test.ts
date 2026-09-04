import test from 'node:test';
import assert from 'node:assert/strict';

import { splitByGloss } from './gloss-split';
import type { BilingualGloss } from '@/data/bilingual-repository';

function g(word: string, meaningVi = 'nghĩa'): BilingualGloss {
  return { word, ipa: '/x/', pos: 'v.', meaningVi };
}

/** Ghép các mảnh lại phải ra đúng đoạn gốc — không mất, không thừa chữ nào. */
function rejoin(segments: { text: string }[]): string {
  return segments.map((s) => s.text).join('');
}

test('không có chú giải thì trả về nguyên đoạn, một mảnh', () => {
  const out = splitByGloss('The city stays warm.', []);
  assert.equal(out.length, 1);
  assert.equal(out[0]?.text, 'The city stays warm.');
  assert.equal(out[0]?.gloss, null);
});

test('đánh dấu đúng từ có chú giải, phần còn lại giữ nguyên', () => {
  const text = 'Cities absorb heat all day.';
  const out = splitByGloss(text, [g('absorb', 'hấp thụ')]);
  assert.equal(rejoin(out), text);
  const marked = out.filter((s) => s.gloss);
  assert.equal(marked.length, 1);
  assert.equal(marked[0]?.text, 'absorb');
  assert.equal(marked[0]?.gloss?.meaningVi, 'hấp thụ');
});

test('bỏ phần trong ngoặc của mục chú giải khi đi tìm', () => {
  const text = 'The traffic has thinned tonight.';
  const out = splitByGloss(text, [g('thin (out)')]);
  // "thinned" không phải "thin" trọn từ, nên không khớp — đúng như mong đợi.
  assert.equal(rejoin(out), text);
  assert.equal(out.filter((s) => s.gloss).length, 0);

  const out2 = splitByGloss('The traffic will thin tonight.', [g('thin (out)')]);
  assert.equal(out2.filter((s) => s.gloss)[0]?.text, 'thin');
});

test('cụm dài được ưu tiên hơn từ ngắn nằm trong nó', () => {
  const text = 'This is the urban heat island effect.';
  const out = splitByGloss(text, [g('heat'), g('heat island', 'đảo nhiệt')]);
  const marked = out.filter((s) => s.gloss);
  assert.equal(marked[0]?.text, 'heat island');
  assert.equal(marked[0]?.gloss?.meaningVi, 'đảo nhiệt');
  assert.equal(rejoin(out), text);
});

test('chỉ khớp trọn từ — không gạch chân chữ nằm bên trong từ khác', () => {
  const text = 'They start the art class.';
  const out = splitByGloss(text, [g('art')]);
  const marked = out.filter((s) => s.gloss);
  assert.equal(marked.length, 1, 'chỉ được khớp "art", không khớp "start"');
  assert.equal(marked[0]?.text, 'art');
});

test('không phân biệt hoa thường nhưng giữ nguyên chữ trong bài', () => {
  const text = 'Absorb and absorb again.';
  const out = splitByGloss(text, [g('absorb')]);
  const marked = out.filter((s) => s.gloss);
  assert.equal(marked.length, 2);
  assert.equal(marked[0]?.text, 'Absorb', 'phải giữ đúng chữ hoa như trong bài');
  assert.equal(marked[1]?.text, 'absorb');
});

test('ký tự đặc biệt trong mục chú giải không làm hỏng biểu thức tìm', () => {
  const text = 'It costs $5 (roughly) per day.';
  const out = splitByGloss(text, [g('per day')]);
  assert.equal(rejoin(out), text);
  assert.equal(out.filter((s) => s.gloss)[0]?.text, 'per day');
});

test('ghép lại luôn ra đúng đoạn gốc dù có nhiều chú giải chồng chéo', () => {
  const text = 'Soil and grass hold water, and as that water evaporates it carries heat away.';
  const out = splitByGloss(text, [g('hold'), g('evaporate'), g('water'), g('carry')]);
  assert.equal(rejoin(out), text);
});
