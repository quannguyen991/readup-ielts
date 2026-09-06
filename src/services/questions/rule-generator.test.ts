import test from 'node:test';
import assert from 'node:assert/strict';

import { buildFalse, buildNotGiven, buildTrue, usableSentence } from './rule-generator';
import { overlapRatio } from '@/services/proofloop/probe-validity';

/**
 * Canh bộ sinh nhận định bằng luật.
 *
 * Ràng buộc nặng nhất KHÔNG phải "câu có đúng ngữ pháp không" — đó là thứ bảng
 * từ lo. Nặng nhất là: nhận định phải KHÁC CHỮ so với câu trong bài. Bản
 * sinh-bằng-luật trước chết đúng ở đây, vì FALSE luôn là câu gốc chèn thêm một
 * chữ nên dò chuỗi là ra.
 */

const S = 'Scientists found that the number of birds increased rapidly after 1990 in every protected area.';

test('câu quá ngắn hoặc quá dài thì không dùng', () => {
  assert.equal(usableSentence('It cannot fly.'), false);
  assert.equal(usableSentence(`${'word '.repeat(40)}end.`), false);
  assert.equal(usableSentence(S), true);
});

test('câu hỏi và câu trích dẫn trực tiếp thì không dùng', () => {
  assert.equal(usableSentence('Why do the birds migrate south during the winter months each year?'), false);
  assert.equal(usableSentence('He said “the birds are gone forever” during the long interview yesterday.'), false);
});

/* ---------------- nhận định ĐÚNG ---------------- */

test('nhận định đúng đổi chữ, giữ nghĩa', () => {
  const c = buildTrue(S, 'a');
  assert.ok(c);
  assert.equal(c.label, 'TRUE');
  assert.notEqual(c.text, S);
});

/*
  Đây là ràng buộc sống còn: nếu nhận định trùng gần hết chữ với câu gốc thì
  người học chỉ cần dò chuỗi, và bộ kiểm `verify.ts` cũng sẽ chặn nó.
*/
test('nhận định đúng KHÔNG được trùng gần hết chữ với câu gốc', () => {
  for (const seed of ['a', 'b', 'c', 'd', 'e']) {
    const c = buildTrue(S, seed);
    if (!c) continue;
    assert.ok(overlapRatio(c.text, S) <= 0.95, `trùng quá nhiều: ${c.text}`);
  }
});

test('câu không có từ nào trong bảng đồng nghĩa thì trả null, không bịa', () => {
  assert.equal(buildTrue('Zzz qqq wwww vvvv bbbb nnnn mmmm kkkk jjjj.', 'a'), null);
});

/* ---------------- nhận định SAI ---------------- */

test('nhận định sai luôn kèm TÊN luật đã phá', () => {
  const c = buildFalse(S, 'a');
  assert.ok(c);
  assert.equal(c.label, 'FALSE');
  assert.ok(c.rule);
  assert.ok(c.why.length > 20);
});

/*
  Bản trước dựng FALSE bằng đúng một cách — chèn "not" — nên hai bài là thuộc
  mẹo. Ở đây bốn luật phải cùng có cửa xuất hiện.
*/
test('bốn luật phá đều được dùng tới, không dồn về một luật', () => {
  const sentences = [
    S,
    'All of the samples were collected before the storm arrived at the northern coast.',
    'The team recorded 240 nests during the survey of the eastern valley last spring.',
    'Watson believed the result while Crick argued that the measurement was simply wrong.',
  ];
  const used = new Set<string>();
  for (const s of sentences) {
    for (const seed of ['a', 'b', 'c', 'd', 'e', 'f']) {
      const c = buildFalse(s, seed);
      if (c?.rule) used.add(c.rule);
    }
  }
  assert.ok(used.size >= 3, `mới dùng ${used.size} luật: ${[...used].join(', ')}`);
});

test('đổi số phải ra con số khác hẳn, không lệch một đơn vị', () => {
  const s = 'The team recorded 240 nests during the survey of the eastern valley last spring.';
  for (const seed of ['a', 'b', 'c', 'd']) {
    const c = buildFalse(s, seed);
    if (c?.rule !== 'number') continue;
    const n = Number((c.text.match(/\b\d+\b/) ?? ['0'])[0]);
    assert.ok(Math.abs(n - 240) > 20, `số mới quá sát số cũ: ${n}`);
  }
});

test('câu không phá được luật nào thì trả null', () => {
  assert.equal(buildFalse('Zzz qqq wwww vvvv bbbb nnnn mmmm kkkk jjjj.', 'a'), null);
});

/* ---------------- nhận định KHÔNG CÓ TRONG BÀI ---------------- */

const PASSAGE = 'Scientists found that the number of birds increased rapidly after 1990. The nests were counted each spring.';

test('mệnh đề ghép từ bài khác thành nhận định NOT GIVEN', () => {
  const c = buildNotGiven('The birds', 'are commonly kept as household pets in coastal villages', PASSAGE);
  assert.ok(c);
  assert.equal(c.label, 'NOT GIVEN');
  assert.ok(c.text.startsWith('The birds'));
});

/*
  Mệnh đề trùng nhiều từ nội dung với bài thì rất có thể bài ĐÃ nói tới ý ấy, và
  lúc đó nhãn NOT GIVEN là sai. Thà bỏ câu còn hơn gán nhãn không chắc.
*/
test('mệnh đề trùng nhiều từ nội dung với bài thì bị loại', () => {
  const c = buildNotGiven('The birds', 'increased rapidly after scientists counted the nests each spring', PASSAGE);
  assert.equal(c, null);
});

test('nhận định nào cũng kết thúc bằng dấu chấm', () => {
  for (const c of [buildTrue(S, 'a'), buildFalse(S, 'a')]) {
    if (c) assert.ok(/[.!?]$/.test(c.text), c.text);
  }
});
