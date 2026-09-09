import test from 'node:test';
import assert from 'node:assert/strict';

import { evaluate, supportsThesis, valueAt } from './evaluate';
import type { Claim, EvidenceTable } from './types';

const TABLE: EvidenceTable = {
  caption: 'Bảng 1. Số loài chim ghi nhận tại bốn khu bảo tồn',
  entityHeader: 'Khu bảo tồn',
  columns: ['2019', '2022'],
  unit: 'loài',
  rows: [
    { entity: 'Ba Bể', values: [48, 61] },
    { entity: 'Cát Tiên', values: [72, 75] },
    { entity: 'Cúc Phương', values: [55, 50] },
    { entity: 'Xuân Thuỷ', values: [39, 44] },
  ],
};

/* ------------------------------------------------------------- tra ô bảng */

test('lấy đúng ô theo tên hàng và tên cột', () => {
  assert.equal(valueAt(TABLE, 'Cát Tiên', '2019'), 72);
  assert.equal(valueAt(TABLE, 'Xuân Thuỷ', '2022'), 44);
});

test('hàng hoặc cột không có thì trả null, không ném lỗi', () => {
  assert.equal(valueAt(TABLE, 'Không Có', '2019'), null);
  assert.equal(valueAt(TABLE, 'Ba Bể', '2030'), null);
});

/* --------------------------------------------------------- mệnh đề "value" */

test('value đúng khi con số khớp ô bảng', () => {
  assert.equal(evaluate(TABLE, { kind: 'value', entity: 'Ba Bể', column: '2022', value: 61 }), true);
});

test('value sai khi lệch dù chỉ một đơn vị', () => {
  assert.equal(evaluate(TABLE, { kind: 'value', entity: 'Ba Bể', column: '2022', value: 62 }), false);
});

test('value trỏ vào hàng không có thì SAI, không phải lỗi', () => {
  assert.equal(evaluate(TABLE, { kind: 'value', entity: 'Tam Đảo', column: '2022', value: 61 }), false);
});

/* ---------------------------------------------------------- mệnh đề "rank" */

test('rank cao nhất và thấp nhất', () => {
  assert.equal(
    evaluate(TABLE, { kind: 'rank', entity: 'Cát Tiên', column: '2019', extreme: 'highest' }),
    true,
  );
  assert.equal(
    evaluate(TABLE, { kind: 'rank', entity: 'Xuân Thuỷ', column: '2019', extreme: 'lowest' }),
    true,
  );
});

test('rank sai khi chỉ vào nơi không phải cực trị', () => {
  assert.equal(
    evaluate(TABLE, { kind: 'rank', entity: 'Ba Bể', column: '2019', extreme: 'highest' }),
    false,
  );
});

test('rank khi có hoà nhau thì KHÔNG ai là cực trị duy nhất', () => {
  /*
    Hai nơi cùng cao nhất thì câu "X cao nhất" không còn một đáp án đúng. Bộ sinh
    phải tránh dựng ra bảng như vậy, và ở đây thì trả false cho cả hai — thà loại
    oan một câu còn hơn để lọt một câu có hai đáp án đúng.
  */
  const tie: EvidenceTable = {
    ...TABLE,
    rows: [
      { entity: 'A', values: [70, 1] },
      { entity: 'B', values: [70, 2] },
      { entity: 'C', values: [10, 3] },
    ],
  };
  assert.equal(evaluate(tie, { kind: 'rank', entity: 'A', column: '2019', extreme: 'highest' }), false);
  assert.equal(evaluate(tie, { kind: 'rank', entity: 'B', column: '2019', extreme: 'highest' }), false);
});

/* -------------------------------------------------------- mệnh đề "change" */

test('change bắt đúng chiều tăng và giảm', () => {
  const up: Claim = { kind: 'change', entity: 'Ba Bể', from: '2019', to: '2022', direction: 'increase' };
  const down: Claim = { kind: 'change', entity: 'Cúc Phương', from: '2019', to: '2022', direction: 'decrease' };
  assert.equal(evaluate(TABLE, up), true);
  assert.equal(evaluate(TABLE, down), true);
});

test('change đảo chiều thì sai — đây là nhiễu reversed_comparison', () => {
  assert.equal(
    evaluate(TABLE, { kind: 'change', entity: 'Cúc Phương', from: '2019', to: '2022', direction: 'increase' }),
    false,
  );
});

test('change đứng yên thì KHÔNG tính là tăng, cũng không tính là giảm', () => {
  const flat: EvidenceTable = { ...TABLE, rows: [{ entity: 'A', values: [50, 50] }] };
  assert.equal(evaluate(flat, { kind: 'change', entity: 'A', from: '2019', to: '2022', direction: 'increase' }), false);
  assert.equal(evaluate(flat, { kind: 'change', entity: 'A', from: '2019', to: '2022', direction: 'decrease' }), false);
});

/* --------------------------------------------------- mệnh đề "change-most" */

test('change-most so mức thay đổi TUYỆT ĐỐI, không so giá trị cuối', () => {
  /*
    Ba Bể tăng 13, Cát Tiên chỉ tăng 3 — dù Cát Tiên cao hơn hẳn ở cả hai mốc.
    Nhầm hai thứ này là kiểu sai rất phổ biến, nên phải có test khoá.
  */
  assert.equal(
    evaluate(TABLE, { kind: 'change-most', entity: 'Ba Bể', from: '2019', to: '2022', direction: 'increase' }),
    true,
  );
  assert.equal(
    evaluate(TABLE, { kind: 'change-most', entity: 'Cát Tiên', from: '2019', to: '2022', direction: 'increase' }),
    false,
  );
});

test('change-most chỉ xét những nơi ĐI CÙNG CHIỀU', () => {
  // Cúc Phương giảm 5 — nó là nơi giảm nhiều nhất, dù xét trị tuyệt đối thì
  // Ba Bể đổi nhiều hơn (13). "Giảm nhiều nhất" chỉ so giữa những nơi có giảm.
  assert.equal(
    evaluate(TABLE, { kind: 'change-most', entity: 'Cúc Phương', from: '2019', to: '2022', direction: 'decrease' }),
    true,
  );
});

/* ------------------------------------------- phương án có ĐỠ nhận định không */

test('cùng thực thể, cùng loại, cùng chiều thì đỡ được nhận định', () => {
  const thesis: Claim = { kind: 'change-most', entity: 'Ba Bể', from: '2019', to: '2022', direction: 'increase' };
  assert.equal(supportsThesis(thesis, thesis), true);
});

test('ĐÚNG với bảng nhưng nói về nơi khác thì KHÔNG đỡ nhận định', () => {
  /*
    Đây là kiểu nhiễu quan trọng nhất của dạng đề này: người học kiểm tra phương
    án có đúng không, thấy đúng, rồi dừng — quên mất câu hỏi là "phương án nào ĐỠ
    NHẬN ĐỊNH", không phải "phương án nào đúng".
  */
  const thesis: Claim = { kind: 'change-most', entity: 'Ba Bể', from: '2019', to: '2022', direction: 'increase' };
  const other: Claim = { kind: 'value', entity: 'Cát Tiên', column: '2019', value: 72 };
  assert.equal(evaluate(TABLE, other), true, 'phương án này đúng với bảng');
  assert.equal(supportsThesis(other, thesis), false, 'nhưng không đỡ nhận định');
});

test('đúng thực thể nhưng đảo chiều thì không đỡ', () => {
  const thesis: Claim = { kind: 'change-most', entity: 'Ba Bể', from: '2019', to: '2022', direction: 'increase' };
  const flipped: Claim = { kind: 'change-most', entity: 'Ba Bể', from: '2019', to: '2022', direction: 'decrease' };
  assert.equal(supportsThesis(flipped, thesis), false);
});

test('mệnh đề change hẹp hơn đỡ được nhận định change-most cùng nơi cùng chiều', () => {
  // "Ba Bể tăng" là một phần của "Ba Bể tăng nhiều nhất" — vẫn đi đúng hướng.
  const thesis: Claim = { kind: 'change-most', entity: 'Ba Bể', from: '2019', to: '2022', direction: 'increase' };
  const narrower: Claim = { kind: 'change', entity: 'Ba Bể', from: '2019', to: '2022', direction: 'increase' };
  assert.equal(supportsThesis(narrower, thesis), true);
});
