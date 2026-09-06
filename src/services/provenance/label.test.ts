import test from 'node:test';
import assert from 'node:assert/strict';

import { generateKeyPair } from '@/services/credential/keys';
import {
  buildLabel,
  gateStatus,
  isFullyChecked,
  signLabel,
  verifyLabel,
  type LabelInput,
} from './label';

const INPUT: LabelInput = {
  itemId: 'wiki-coral-reef#q3',
  sourceId: 'wiki-coral-reef',
  model: 'claude-haiku-4-5-20251001',
  generatedAt: '2026-09-07T09:00:00.000Z',
  attempts: 3,
  rejectedDrafts: ['evidence-not-verbatim', 'answerable-without-passage'],
  gates: [
    { gate: 'rules', result: 'passed' },
    { gate: 'blind', result: 'passed', note: 'blind-model-answered-wrong' },
  ],
};

/* --------------------------------------------------------------------- id */

test('cùng nội dung ra cùng id', () => {
  assert.equal(buildLabel(INPUT).id, buildLabel(INPUT).id);
});

test('thứ tự khoá lúc dựng không đổi id', () => {
  const reordered: LabelInput = {
    gates: INPUT.gates,
    rejectedDrafts: INPUT.rejectedDrafts,
    attempts: INPUT.attempts,
    generatedAt: INPUT.generatedAt,
    model: INPUT.model,
    sourceId: INPUT.sourceId,
    itemId: INPUT.itemId,
  };
  assert.equal(buildLabel(reordered).id, buildLabel(INPUT).id);
});

test('đổi model là đổi id — nhãn phải ghim được ai viết câu này', () => {
  const other = buildLabel({ ...INPUT, model: 'glm-5.2-fast-preview' });
  assert.notEqual(other.id, buildLabel(INPUT).id);
});

test('đổi phán quyết hàng rào là đổi id', () => {
  const flipped = buildLabel({
    ...INPUT,
    gates: [
      { gate: 'rules', result: 'passed' },
      { gate: 'blind', result: 'rejected', reason: 'answerable-without-passage' },
    ],
  });
  assert.notEqual(flipped.id, buildLabel(INPUT).id);
});

test('id ngắn, chỉ dùng bảng base58', () => {
  assert.match(buildLabel(INPUT).id, /^[1-9A-HJ-NP-Za-km-z]{12}$/);
});

/* ------------------------------------------- CHƯA KIỂM KHÁC VỚI ĐÃ ĐỖ */

test('hàng rào chưa chạy KHÔNG được tính là đã đỗ', () => {
  /*
    Đây là luật quan trọng nhất trong cả tệp, và cũng là luật dễ bị bào mòn nhất
    khi ai đó muốn cho biên nhận "sạch" hơn: lời gọi model hỏng thì câu vẫn được
    phục vụ — chặn người học vì hàng rào tự nó hỏng là phạt nhầm người — nhưng
    nhãn phải ghi là CHƯA KIỂM. Nói dối rằng đã kiểm là điều duy nhất không được
    phép, vì nó biến cả biên nhận thành đồ trang trí.
  */
  const label = buildLabel({
    ...INPUT,
    gates: [
      { gate: 'rules', result: 'passed' },
      { gate: 'blind', result: 'not-run', why: 'check-failed' },
    ],
  });
  assert.equal(gateStatus(label, 'blind'), 'not-run');
  assert.equal(isFullyChecked(label), false);
});

test('thiếu hẳn một hàng rào cũng không phải đã đỗ', () => {
  const label = buildLabel({ ...INPUT, gates: [{ gate: 'rules', result: 'passed' }] });
  assert.equal(gateStatus(label, 'blind'), 'absent');
  assert.equal(isFullyChecked(label), false);
});

test('đủ cả hai hàng rào và cùng đỗ thì mới là đã kiểm đủ', () => {
  assert.equal(isFullyChecked(buildLabel(INPUT)), true);
});

test('một hàng rào loại thì không phải đã kiểm đủ', () => {
  const label = buildLabel({
    ...INPUT,
    gates: [
      { gate: 'rules', result: 'passed' },
      { gate: 'blind', result: 'rejected', reason: 'answerable-without-passage' },
    ],
  });
  assert.equal(isFullyChecked(label), false);
});

/* -------------------------------------------------------------- chữ ký */

test('nhãn ký rồi kiểm thì hợp lệ', () => {
  const { privateKey, did } = generateKeyPair();
  const signed = signLabel(buildLabel(INPUT), privateKey, did);
  assert.equal(verifyLabel(signed).ok, true);
});

test('sửa phán quyết hàng rào sau khi ký là bị bắt', () => {
  const { privateKey, did } = generateKeyPair();
  const signed = signLabel(buildLabel(INPUT), privateKey, did);
  const faked = structuredClone(signed);
  faked.label.gates = [
    { gate: 'rules', result: 'passed' },
    { gate: 'blind', result: 'passed', note: 'blind-model-could-not-answer' },
  ];
  assert.equal(verifyLabel(faked).ok, false);
});

test('sửa id cho khớp nội dung đã sửa VẪN bị bắt', () => {
  // Kẻ sửa khéo sẽ tính lại id. Chữ ký phủ cả id lẫn nội dung nên vẫn hỏng.
  const { privateKey, did } = generateKeyPair();
  const signed = signLabel(buildLabel(INPUT), privateKey, did);
  const faked = structuredClone(signed);
  faked.label = buildLabel({ ...INPUT, model: 'gpt-nonexistent' });
  assert.equal(verifyLabel(faked).ok, false);
});

test('id không khớp nội dung thì bị bắt trước cả khi xét chữ ký', () => {
  const { privateKey, did } = generateKeyPair();
  const signed = signLabel(buildLabel(INPUT), privateKey, did);
  const faked = structuredClone(signed);
  faked.label.id = 'zzzzzzzzzzzz';
  const got = verifyLabel(faked);
  assert.equal(got.ok, false);
  if (!got.ok) assert.equal(got.code, 'id-mismatch');
});

test('đầu vào rác thì trả lý do, không ném lỗi', () => {
  for (const bad of [null, 7, 'x', {}, { label: {} }, []]) {
    assert.equal(verifyLabel(bad).ok, false, `phải từ chối ${JSON.stringify(bad)}`);
  }
});
