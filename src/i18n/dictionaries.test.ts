import test from 'node:test';
import assert from 'node:assert/strict';

import { en } from './en';
import { vi } from './vi';
import { translate } from './index';
import type { MessageKey } from './keys';

/**
 * Canh hai bản dịch khớp nhau.
 *
 * Cùng kỷ luật với `src/lib/writing/enum-parity.test.ts`: hai thứ phải khớp nhau
 * mà nằm ở hai file thì sớm muộn cũng trôi lệch, và test là chỗ duy nhất bắt
 * được. Ở đây hậu quả của việc trôi lệch không phải một lỗi chạy — nó là một
 * khoảng trống trong giao diện tiếng Anh mà chỉ người nói tiếng Anh mới thấy,
 * tức là đúng nhóm người ít có khả năng báo lại nhất.
 */

const viKeys = Object.keys(vi) as MessageKey[];
const enKeys = Object.keys(en) as MessageKey[];

test('hai bản dịch có cùng bộ khoá', () => {
  const thieuEn = viKeys.filter((k) => !(k in en));
  const thieuVi = enKeys.filter((k) => !(k in vi));
  assert.deepEqual(thieuEn, [], 'bản tiếng Anh thiếu khoá');
  assert.deepEqual(thieuVi, [], 'bản tiếng Việt thiếu khoá');
});

test('không câu nào bỏ trống', () => {
  for (const k of viKeys) {
    assert.notEqual(vi[k].trim(), '', `vi[${k}] rỗng`);
    assert.notEqual(en[k].trim(), '', `en[${k}] rỗng`);
  }
});

test('bản tiếng Anh không sót câu tiếng Việt chưa dịch', () => {
  // Dấu tiếng Việt trong bản tiếng Anh gần như chắc chắn là quên dịch.
  const VI_DAU = /[àáâãèéêìíòóôõùúýăđĩũơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i;
  for (const k of enKeys) {
    assert.ok(!VI_DAU.test(en[k]), `en[${k}] còn chữ tiếng Việt: "${en[k].slice(0, 60)}"`);
  }
});

test('hai bản dùng cùng bộ tham số trong từng câu', () => {
  /*
    Lệch tham số là lỗi im lặng: câu tiếng Anh thiếu `{n}` sẽ hiện ra một câu
    đọc vẫn trôi nhưng mất con số, và không ai báo lại.
  */
  // So TẬP tham số, không so danh sách: nhánh số nhiều lặp lại `{n}` ở cả hai vế
  // nên đếm theo lần xuất hiện sẽ báo lệch giả.
  const params = (s: string) => [...new Set([...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]))].sort();
  for (const k of viKeys) {
    assert.deepEqual(params(en[k]), params(vi[k]), `tham số của "${k}" không khớp`);
  }
});

test('thay tham số đúng chỗ', () => {
  assert.equal(translate('vi', 'mastery.observations', { n: 5 }), '5 lượt quan sát');
  assert.equal(translate('en', 'mastery.observations', { n: 5 }), '5 observations');
});

test('thay được tham số xuất hiện nhiều lần', () => {
  const got = translate('vi', 'verify.summary', { checked: 12, rejected: 2 });
  assert.ok(got.includes('12') && got.includes('2'));
});

test('thiếu khoá thì trả về chính khoá, không trả chuỗi rỗng', () => {
  // Chuỗi rỗng thành một khoảng trống im lặng sống được nhiều tháng.
  const lỗi = translate('vi', 'khong.ton.tai' as MessageKey);
  assert.equal(lỗi, 'khong.ton.tai');
});

test('ngôn ngữ lạ thì rơi về tiếng Việt, không vỡ', () => {
  assert.equal(translate('de' as 'vi', 'mastery.title'), vi['mastery.title']);
});

test('câu giải thích tiếng Anh giữ đúng thuật ngữ cơ chế', () => {
  // Người đọc bản tiếng Anh chủ yếu để hiểu cơ chế; dịch "transfer" thành một
  // chữ đời thường là làm mất chỗ tra cứu.
  assert.ok(en['probe.transfer'].includes('DIFFERENT PASSAGE'));
  assert.ok(en['explain.conditionBody'].includes('DIFFERENT PASSAGE'));
});

test('bản tiếng Anh không dùng chữ phán đoán trạng thái trong đầu người học', () => {
  const CAM = ['you did not understand', "you don't understand", 'you guessed', 'lazy', 'weak'];
  for (const k of enKeys) {
    const low = en[k].toLowerCase();
    for (const tu of CAM) {
      assert.ok(!low.includes(tu), `en[${k}] chứa chữ phán đoán: "${tu}"`);
    }
  }
});

test('số nhiều: chọn đúng nhánh theo n', () => {
  // Tiếng Anh có hai dạng; "1 observations" đọc là lỗi chứ không phải chuyện nhỏ.
  assert.equal(translate('en', 'mastery.observations', { n: 1 }), '1 observation');
  assert.equal(translate('en', 'mastery.observations', { n: 3 }), '3 observations');
  assert.equal(translate('en', 'mastery.observations', { n: 0 }), '0 observations');
});

test('tiếng Việt không chia số nhiều nên câu giữ nguyên', () => {
  assert.equal(translate('vi', 'mastery.observations', { n: 1 }), '1 lượt quan sát');
  assert.equal(translate('vi', 'mastery.observations', { n: 5 }), '5 lượt quan sát');
});

test('không truyền n thì rơi về dạng số nhiều, không vỡ', () => {
  assert.equal(translate('en', 'mastery.observations'), '{n} observations');
});

test('mọi câu tiếng Anh có {n} đều xử lý được số ít', () => {
  // Bắt sót số nhiều một cách hệ thống: câu nào đếm mà chưa có nhánh số ít thì
  // sớm muộn cũng hiện ra "1 attempts" trước mặt người dùng.
  for (const k of enKeys) {
    if (!en[k].includes('{n}')) continue;
    assert.ok(
      en[k].includes('|'),
      `en[${k}] có {n} nhưng chưa có nhánh số ít: "${en[k]}"`,
    );
  }
});
