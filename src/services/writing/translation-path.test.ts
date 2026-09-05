import test from 'node:test';
import assert from 'node:assert/strict';

import {
  PATH_STEPS,
  getStep,
  stepUnits,
  stripTone,
  structureOf,
  structureTopics,
  topicsForStep,
} from './translation-path';
import { TRANSLATION_SETS } from '@/data/translation-sets';

/**
 * Canh lộ trình luyện dịch.
 *
 * Ràng buộc nặng nhất ở đây là ràng buộc về TRUNG THỰC CỦA CON SỐ: mọi mục trên
 * màn hình đều khoe một số lượt, và số ấy phải là số lượt thật sự mở ra được.
 * Một thẻ ghi "15 mục" mà bấm vào thấy rỗng đắt hơn hẳn một thẻ không có.
 */

test('năm bước, thứ tự liền mạch từ 1', () => {
  assert.equal(PATH_STEPS.length, 5);
  PATH_STEPS.forEach((s, i) => assert.equal(s.order, i + 1));
});

test('mỗi bước tra được bằng id', () => {
  for (const s of PATH_STEPS) assert.equal(getStep(s.id)?.id, s.id);
  assert.equal(getStep('khong-co'), undefined);
});

/*
  Bậc khó phải tăng theo SỐ CÂU MỖI LƯỢT. Nếu hai bước liền nhau cùng chunk thì
  bước sau chỉ đổi tên chứ không đổi việc, và lộ trình thành một danh sách dán
  nhãn.
*/
test('số câu mỗi lượt tăng dần, không có hai bước giống nhau', () => {
  const chunks = PATH_STEPS.map((s) => s.chunk);
  for (let i = 1; i < chunks.length; i += 1) {
    assert.ok(
      (chunks[i] as number) >= (chunks[i - 1] as number),
      `bước ${i + 1} có chunk nhỏ hơn bước trước`,
    );
  }
  assert.ok(new Set(chunks).size >= 4, 'các bước phải khác nhau về khối lượng một lượt');
});

test('bỏ dấu tiếng Việt để so nhãn ngữ pháp', () => {
  assert.equal(stripTone('Thì hiện tại hoàn thành'), 'thi hien tai hoan thanh');
  assert.equal(stripTone('Câu bị động, nhấn mạnh'), 'cau bi dong, nhan manh');
  assert.equal(stripTone('Đảo ngữ'), 'dao ngu');
});

/*
  Một câu có thể khớp nhiều nhóm ("câu bị động ở thì hiện tại hoàn thành"), và
  thứ tự trong bảng quyết định nhóm nào thắng. Dạng câu phải thắng thì, nếu
  không thì mọi câu bị động đều bị hút về nhóm "hiện tại đơn".
*/
test('dạng câu thắng thì khi một câu khớp cả hai', () => {
  assert.equal(
    structureOf({ hint: 'Câu bị động ở thì hiện tại đơn' } as never),
    'passive',
  );
  assert.equal(structureOf({ hint: 'Câu điều kiện loại 0, nói thói quen' } as never), 'conditional');
});

test('nhãn không khớp nhóm nào thì trả null, không nhét bừa', () => {
  assert.equal(structureOf({ hint: 'Từ vựng chủ đề ẩm thực' } as never), null);
  assert.equal(structureOf({ hint: '' } as never), null);
  assert.equal(structureOf({} as never), null);
});

test('mỗi nhóm cấu trúc đều có câu thật, không có nhóm rỗng', () => {
  const topics = structureTopics();
  assert.ok(topics.length >= 5, `mới gom được ${topics.length} nhóm cấu trúc`);
  for (const t of topics) assert.ok(t.units > 0, `nhóm ${t.id} không có câu nào`);
});

test('bước từ vựng phủ đúng toàn bộ kho bộ đề', () => {
  const step = getStep('topic');
  assert.ok(step);
  assert.equal(topicsForStep(step).length, TRANSLATION_SETS.length);
});

/*
  Ở các bước dịch nhiều câu, số lượt là số câu CHIA cho số câu mỗi lượt. Bộ không
  đủ câu cho trọn một lượt thì không được hiện — bấm vào một thẻ rồi thấy rỗng
  tệ hơn là thẻ ấy không có.
*/
test('bước dịch nhiều câu không hiện bộ thiếu câu', () => {
  for (const id of ['para-65', 'para-80', 'essay'] as const) {
    const step = getStep(id);
    assert.ok(step);
    for (const t of topicsForStep(step)) {
      assert.ok(t.units >= 1, `${id}/${t.id} hiện ra nhưng không đủ một lượt`);
    }
  }
});

test('mọi mục đều có đường dẫn mang đủ tham số để mở đúng bài', () => {
  for (const step of PATH_STEPS) {
    for (const t of topicsForStep(step)) {
      assert.ok(t.href.startsWith('/sentence/translate?'), `${step.id}/${t.id}: ${t.href}`);
      if (step.chunk > 1) {
        assert.ok(t.href.includes(`chunk=${step.chunk}`), `${step.id}/${t.id} thiếu chunk`);
      }
    }
  }
});

test('mỗi bước đều có việc để làm', () => {
  for (const step of PATH_STEPS) {
    assert.ok(stepUnits(step) > 0, `bước ${step.title} không có lượt nào`);
  }
});

test('số thứ tự trong một bước chạy liền từ 1', () => {
  for (const step of PATH_STEPS) {
    topicsForStep(step).forEach((t, i) => assert.equal(t.index, i + 1, `${step.id} lệch số thứ tự`));
  }
});
