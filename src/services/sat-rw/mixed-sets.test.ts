import test from 'node:test';
import assert from 'node:assert/strict';

import { SAT_RW_QUESTIONS } from '@/data/sat-rw-repository';
import {
  MIXED_SET_COUNT,
  __mixedInternals,
  QUESTIONS_PER_SET,
  SAT_RW_MIXED_SETS,
  allocate,
  getMixedSet,
  mixedSetStats,
} from './mixed-sets';

/**
 * Canh phần trộn đề SAT R&W.
 *
 * Ba tính chất phải giữ, và cả ba đều đã suýt hỏng trong lúc viết:
 *   · đề không được lặp câu bên trong chính nó,
 *   · cùng số đề phải luôn ra cùng bộ câu (không có `Math.random()` lọt vào),
 *   · các câu phải được dùng ĐỀU — không có câu nào ra lần thứ hai trong khi còn
 *     câu chưa ra lần nào, vì như thế là một phần kho không bao giờ được nhìn tới.
 */

test('có đủ 50 đề, mỗi đề đủ số câu', () => {
  assert.equal(SAT_RW_MIXED_SETS.length, MIXED_SET_COUNT);
  for (const set of SAT_RW_MIXED_SETS) {
    assert.equal(set.questions.length, QUESTIONS_PER_SET, `đề ${set.order} sai số câu`);
  }
});

test('trong một đề không có câu nào lặp lại', () => {
  for (const set of SAT_RW_MIXED_SETS) {
    const ids = set.questions.map((q) => q.id);
    assert.equal(new Set(ids).size, ids.length, `đề ${set.order} có câu trùng`);
  }
});

test('id đề không trùng nhau và số thứ tự chạy liên tục', () => {
  const ids = SAT_RW_MIXED_SETS.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length);
  SAT_RW_MIXED_SETS.forEach((s, i) => assert.equal(s.order, i + 1));
});

test('mọi câu trong đề đều là câu có thật trong kho', () => {
  const known = new Set(SAT_RW_QUESTIONS.map((q) => q.id));
  for (const set of SAT_RW_MIXED_SETS) {
    for (const q of set.questions) {
      assert.ok(known.has(q.id), `đề ${set.order} chứa câu lạ ${q.id}`);
    }
  }
});

test('đề trộn đủ bốn mảng, không dồn về một mảng', () => {
  for (const set of SAT_RW_MIXED_SETS) {
    const domains = new Set(set.questions.map((q) => q.domain));
    assert.ok(
      domains.size >= 3,
      `đề ${set.order} chỉ có ${domains.size} mảng — trộn thế thì không khác gì một unit`,
    );
  }
});

test('các câu được dùng đều: chênh lệch số lượt tối đa là 1 trong mỗi mảng', () => {
  /*
    Đây là tính chất đáng giá nhất của cách chia. Bốc ngẫu nhiên độc lập cho từng
    đề sẽ để một số câu ra năm lần còn một số câu không bao giờ ra — tức là người
    học làm hết 50 đề mà vẫn chưa nhìn thấy một phần kho.
  */
  const dem = new Map<string, number>();
  for (const set of SAT_RW_MIXED_SETS) {
    for (const q of set.questions) dem.set(q.id, (dem.get(q.id) ?? 0) + 1);
  }

  const theoMang = new Map<string, number[]>();
  for (const q of SAT_RW_QUESTIONS) {
    const list = theoMang.get(q.domain) ?? [];
    list.push(dem.get(q.id) ?? 0);
    theoMang.set(q.domain, list);
  }

  for (const [domain, counts] of theoMang) {
    const min = Math.min(...counts);
    const max = Math.max(...counts);
    assert.ok(
      max - min <= 1,
      `mảng "${domain}": câu dùng nhiều nhất ${max} lượt, ít nhất ${min} lượt`,
    );
  }
});

test('tái lập được: dựng lại cho ra đúng cùng bộ câu, cùng thứ tự', () => {
  const lai = __mixedInternals.buildAll();
  assert.equal(lai.length, SAT_RW_MIXED_SETS.length);
  for (let i = 0; i < SAT_RW_MIXED_SETS.length; i += 1) {
    assert.deepEqual(
      lai[i]?.questions.map((q) => q.id),
      SAT_RW_MIXED_SETS[i]?.questions.map((q) => q.id),
      `đề ${i + 1} khác nhau giữa hai lần dựng — có gì đó không gieo hạt`,
    );
  }
});

test('tra được đề theo id, id lạ thì trả về undefined', () => {
  assert.equal(getMixedSet('satrw-mix-01')?.order, 1);
  assert.equal(getMixedSet('satrw-mix-99'), undefined);
});

test('thống kê khớp với dữ liệu thật', () => {
  const stats = mixedSetStats();
  assert.equal(stats.sets, SAT_RW_MIXED_SETS.length);
  assert.equal(
    stats.questions,
    SAT_RW_MIXED_SETS.reduce((n, s) => n + s.questions.length, 0),
  );
});

// ------------------------------------------------------------------- allocate

test('chia theo tỷ trọng, tổng luôn đúng bằng số câu yêu cầu', () => {
  for (const total of [8, 10, 12, 20, 27]) {
    const got = allocate(total, [26, 28, 20, 26]);
    assert.equal(
      got.reduce((a, b) => a + b, 0),
      total,
      `tổng lệch ở total=${total}`,
    );
    assert.ok(
      got.every((n) => n >= 0),
      'không được có phần âm',
    );
  }
});

test('mảng nặng cân hơn thì được nhiều suất hơn', () => {
  const [a, b] = allocate(10, [10, 90]);
  assert.ok((b ?? 0) > (a ?? 0), 'mảng 90% phải nhiều suất hơn mảng 10%');
});

test('suất lẻ về tay mảng có phần dư lớn nhất', () => {
  // 7 chia cho [1,1,1]: mỗi mảng 2 phần nguyên, còn 1 suất lẻ cho mảng đầu tiên.
  assert.deepEqual(allocate(7, [1, 1, 1]), [3, 2, 2]);
});

test('tổng trọng số bằng 0 thì trả về toàn số 0, không chia cho 0', () => {
  assert.deepEqual(allocate(10, [0, 0]), [0, 0]);
});
