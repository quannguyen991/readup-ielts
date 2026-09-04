import assert from 'node:assert/strict';
import { test } from 'node:test';

import { fitsGrid, gradeGridIn, gridInAcceptedForms, gridInEquals, parseGridInput } from './grid-in';
import { rat } from '@/lib/math/value';

/**
 * Bộ ca biên viết tay cho ô grid-in.
 *
 * Không sinh tự động được: mỗi ca ở đây là một điều College Board quy định,
 * không phải một tính chất suy ra từ số học. Sai một ca là chấm oan người học
 * ở đúng chỗ họ làm đúng.
 */

const TWO_THIRDS = rat(2, 3);

// --------------------------------------------------------- đọc chuỗi vào

test('đọc được phân số, số thập phân và số nguyên', () => {
  assert.deepEqual(parseGridInput('7/2')?.value, rat(7, 2));
  assert.deepEqual(parseGridInput('3.5')?.value, rat(7, 2));
  assert.deepEqual(parseGridInput('240')?.value, rat(240));
  assert.deepEqual(parseGridInput('.5')?.value, rat(1, 2));
  assert.deepEqual(parseGridInput('-1/3')?.value, rat(-1, 3));
});

test('từ chối những gì ô điền thật cũng không nhận', () => {
  for (const bad of ['50%', '1,000', 'x', '', '   ', '.', '-', '1/0', '1.2.3', '5 5', '2/3/4']) {
    const parsed = parseGridInput(bad);
    assert.equal(parsed, null, `"${bad}" đáng lẽ phải bị từ chối`);
  }
});

test('khoảng trắng thừa hai đầu không bị tính là lỗi', () => {
  // Đây là chuyện của bàn phím, không phải chuyện của người học hiểu bài.
  assert.deepEqual(parseGridInput('  240  ')?.value, rat(240));
});

// ------------------------------------------------- đáp án viết chính xác được

test('7/2 nhận cả phân số lẫn số thập phân tương đương', () => {
  const answer = rat(7, 2);
  assert.ok(gridInEquals('7/2', answer));
  assert.ok(gridInEquals('3.5', answer));
  assert.ok(gridInEquals('3.50', answer));
  assert.ok(gridInEquals('14/4', answer), 'phân số chưa rút gọn vẫn là đúng giá trị');
});

test('đáp án nguyên', () => {
  assert.ok(gridInEquals('240', rat(240)));
  assert.ok(gridInEquals('240/1', rat(240)));
  assert.equal(gradeGridIn('241', rat(240)).ok, false);
});

test('đáp án âm được thêm một ô cho dấu trừ', () => {
  assert.ok(gridInEquals('-1/3', rat(-1, 3)));
  assert.ok(gridInEquals('-.3333', rat(-1, 3)), '6 ký tự vẫn vừa ô khi đáp án âm');
  assert.ok(gridInEquals('-0.333', rat(-1, 3)));
});

// ------------------------------------------- đáp án thập phân vô hạn tuần hoàn

test('2/3 nhận đúng bốn cách viết kín ô, ngoài chính phân số', () => {
  for (const form of ['2/3', '.6666', '.6667', '0.666', '0.667']) {
    assert.ok(gridInEquals(form, TWO_THIRDS), `"${form}" đáng lẽ phải được tính đúng`);
  }
});

test('còn ô trống thì đề thật tính sai, app cũng phải tính sai', () => {
  // Đây là chỗ dễ dãi tay nhất, và cũng là chỗ khiến người học mất điểm oan ở
  // phòng thi nếu app đã quen chấm đúng cho họ.
  const verdict = gradeGridIn('.667', TWO_THIRDS);
  assert.equal(verdict.ok, false);
  assert.equal(verdict.ok === false && verdict.reason, 'not_precise_enough');
  assert.equal(gradeGridIn('0.67', TWO_THIRDS).ok, false);
});

test('cắt hay làm tròn đều được, miễn là kín ô', () => {
  assert.ok(gridInEquals('.6666', TWO_THIRDS), 'cắt');
  assert.ok(gridInEquals('.6667', TWO_THIRDS), 'làm tròn');
});

test('sai giá trị thì kín ô cũng vẫn sai', () => {
  const verdict = gradeGridIn('.6676', TWO_THIRDS);
  assert.equal(verdict.ok, false);
  assert.equal(verdict.ok === false && verdict.reason, 'wrong');
});

// --------------------------------------------------------------- vượt ô

test('đúng giá trị nhưng dài quá ô vẫn là sai, và được nói rõ lý do', () => {
  const verdict = gradeGridIn('0.7500', rat(3, 4));
  assert.equal(verdict.ok, false);
  assert.equal(verdict.ok === false && verdict.reason, 'too_long');
});

test('xấp xỉ đúng nhưng dài quá ô cũng báo là dài quá ô', () => {
  const verdict = gradeGridIn('0.66666', TWO_THIRDS);
  assert.equal(verdict.ok, false);
  assert.equal(verdict.ok === false && verdict.reason, 'too_long');
});

test('đáp án viết chính xác được thì không mở cửa xấp xỉ', () => {
  // 3/4 viết gọn trong ô, nên 0.749 không được du di thành đúng.
  const verdict = gradeGridIn('0.749', rat(3, 4));
  assert.equal(verdict.ok, false);
  assert.equal(verdict.ok === false && verdict.reason, 'wrong');
});

// ------------------------------------------------------------- hỗn số

test('hỗn số bị từ chối và được gọi đúng tên', () => {
  const verdict = gradeGridIn('1 1/2', rat(3, 2));
  assert.equal(verdict.ok, false);
  assert.equal(verdict.ok === false && verdict.reason, 'mixed_number');
  assert.ok(gridInEquals('3/2', rat(3, 2)));
  assert.ok(gridInEquals('1.5', rat(3, 2)));
});

test('ô trống được phân biệt với ô gõ bậy', () => {
  const blank = gradeGridIn('', rat(1));
  const garbage = gradeGridIn('abc', rat(1));
  assert.equal(blank.ok === false && blank.reason, 'empty');
  assert.equal(garbage.ok === false && garbage.reason, 'malformed');
});

// ------------------------------------------------- danh sách cách viết đúng

test('danh sách cách viết được chấp nhận đủ để hiện ở màn Review', () => {
  const forms = gridInAcceptedForms(TWO_THIRDS);
  for (const expected of ['2/3', '.6666', '.6667', '0.666', '0.667']) {
    assert.ok(forms.includes(expected), `thiếu "${expected}" trong ${JSON.stringify(forms)}`);
  }
  // Và mọi cách viết nó liệt kê đều phải thật sự được chấm đúng.
  for (const form of forms) assert.ok(gridInEquals(form, TWO_THIRDS), `"${form}" tự mâu thuẫn`);
});

test('mọi cách viết được liệt kê đều điền vừa ô', () => {
  for (const answer of [rat(2, 3), rat(-1, 3), rat(7, 2), rat(240), rat(0), rat(1, 8)]) {
    const limit = answer.num < 0 ? 6 : 5;
    for (const form of gridInAcceptedForms(answer)) {
      assert.ok(form.length <= limit, `"${form}" dài ${form.length} ký tự, quá ô`);
      assert.ok(gridInEquals(form, answer), `"${form}" tự mâu thuẫn`);
    }
  }
});

test('fitsGrid chặn được đáp án không tài nào điền nổi', () => {
  assert.ok(fitsGrid(rat(2, 3)));
  assert.ok(fitsGrid(rat(-1, 3)));
  assert.ok(fitsGrid(rat(12345)));
  // 123456 dài 6 ký tự, ô dương chỉ có 5 — template nào ra đáp án này là hỏng.
  assert.equal(fitsGrid(rat(123456)), false);
});
