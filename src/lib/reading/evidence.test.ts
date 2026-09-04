import assert from 'node:assert/strict';
import { test } from 'node:test';

import { findEvidenceSpan, mergeSpans } from './evidence';

const PARA =
  'The reef has lost more than half its coral cover since 1985 — a finding reaffirmed in 2020.';

test('trích dẫn chép đúng nguyên văn thì tìm được', () => {
  const span = findEvidenceSpan(PARA, 'lost more than half its coral cover');
  assert.ok(span);
  assert.equal(PARA.slice(span.start, span.end), 'lost more than half its coral cover');
});

test('model đổi loại nháy vẫn tìm được', () => {
  /*
    Đây là ca làm tính năng im lặng không chạy. Bản cũ dùng indexOf, lệch một
    dấu nháy là trả -1, và màn chữa bài trả về đoạn văn không tô gì mà không báo
    lỗi — nên trông như app không có tính năng chỉ chỗ chứa đáp án.
  */
  const p = "The world's largest reef system lies off Queensland.";
  const span = findEvidenceSpan(p, '\u2018world\u2019s largest reef system'.replace('\u2018', ''));
  assert.ok(span, 'nháy cong phải khớp với nháy thẳng');
  assert.equal(p.slice(span.start, span.end), "world's largest reef system");
});

test('gạch ngang dài đổi thành gạch ngắn vẫn khớp', () => {
  const span = findEvidenceSpan(PARA, 'since 1985 - a finding');
  assert.ok(span);
  assert.equal(PARA.slice(span.start, span.end), 'since 1985 — a finding');
});

test('khoảng trắng lặp và xuống dòng vẫn khớp', () => {
  const p = 'Rising sea\n\n  temperatures  caused bleaching.';
  const span = findEvidenceSpan(p, 'Rising sea temperatures caused bleaching');
  assert.ok(span);
  // Vị trí trả về phải là vị trí TRONG ĐOẠN GỐC, không phải trên bản chuẩn hoá.
  assert.equal(p.slice(span.start, span.end), 'Rising sea\n\n  temperatures  caused bleaching');
});

test('khác chữ hoa chữ thường vẫn khớp', () => {
  const span = findEvidenceSpan(PARA, 'THE REEF HAS LOST');
  assert.ok(span);
  assert.equal(span.start, 0);
});

test('trích dẫn model tự nghĩ ra thì trả về null', () => {
  assert.equal(findEvidenceSpan(PARA, 'Tourism revenue fell by forty percent'), null);
});

test('trích dẫn quá ngắn bị từ chối', () => {
  // "reef" có trong đoạn, nhưng tô bốn chữ cái không chỉ ra được gì.
  assert.equal(findEvidenceSpan(PARA, 'reef'), null);
});

test('đoạn rỗng hoặc trích rỗng không làm chương trình chết', () => {
  assert.equal(findEvidenceSpan('', 'abc'), null);
  assert.equal(findEvidenceSpan(PARA, ''), null);
});

test('vị trí trả về luôn nằm trong đoạn', () => {
  const span = findEvidenceSpan(PARA, 'reaffirmed in 2020.');
  assert.ok(span);
  assert.ok(span.end <= PARA.length, `end ${span.end} vượt quá độ dài ${PARA.length}`);
});

// -------------------------------------------------------------- mergeSpans

test('hai vùng chồng nhau gộp thành một', () => {
  assert.deepEqual(mergeSpans([{ start: 0, end: 10 }, { start: 5, end: 20 }]), [
    { start: 0, end: 20 },
  ]);
});

test('hai vùng rời nhau giữ nguyên', () => {
  assert.deepEqual(mergeSpans([{ start: 30, end: 40 }, { start: 0, end: 10 }]), [
    { start: 0, end: 10 },
    { start: 30, end: 40 },
  ]);
});

test('vùng liền kề sát nhau gộp lại', () => {
  assert.deepEqual(mergeSpans([{ start: 0, end: 10 }, { start: 10, end: 15 }]), [
    { start: 0, end: 15 },
  ]);
});

test('danh sách rỗng trả về rỗng', () => {
  assert.deepEqual(mergeSpans([]), []);
});
