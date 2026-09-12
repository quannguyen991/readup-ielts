import test from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';

import { asciiOnly, stampLine, stampPdf } from './stamp';

const INFO = {
  email: 'hoc.vien@example.com',
  orderRef: 'RU7K2M9Q',
  issuedAt: new Date('2026-09-11T03:00:00.000Z'),
};

async function blankPdf(pages: number): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i += 1) doc.addPage([595, 842]);
  doc.setTitle('Sách thử');
  return doc.save();
}

test('dòng in có email, mã đơn và ngày — đủ để truy về một đơn hàng', () => {
  const line = stampLine(INFO);
  assert.match(line, /hoc\.vien@example\.com/);
  assert.match(line, /RU7K2M9Q/);
  assert.match(line, /2026-09-11/);
});

test('ký tự ngoài bảng Latin bị thay bằng dấu hỏi thay vì làm hỏng file', () => {
  assert.equal(asciiOnly('nguyễn@x.vn'), 'nguy?n@x.vn');
  assert.doesNotThrow(() => stampLine({ ...INFO, email: 'ngườidùng@ví-dụ.vn' }));
});

test('in xong vẫn đủ trang, vẫn mở được, và tên người mua nằm cả trong siêu dữ liệu', async () => {
  const out = await stampPdf(await blankPdf(3), INFO);
  const back = await PDFDocument.load(out);
  assert.equal(back.getPageCount(), 3);
  assert.match(back.getSubject() ?? '', /hoc\.vien@example\.com/);
  assert.match(back.getSubject() ?? '', /RU7K2M9Q/);
  assert.equal(back.getTitle(), 'Sách thử', 'không được xoá tên sách gốc');
});

test('email lạ vẫn in được, không làm hỏng file', async () => {
  const out = await stampPdf(await blankPdf(1), { ...INFO, email: 'ngườidùng@ví-dụ.vn' });
  assert.equal((await PDFDocument.load(out)).getPageCount(), 1);
});

test('file ra khác file vào — tức là có in thật, không trả nguyên bản', async () => {
  const input = await blankPdf(1);
  const out = await stampPdf(input, INFO);
  assert.notDeepEqual(Buffer.from(out), Buffer.from(input));
  assert.equal(Buffer.from(out.subarray(0, 5)).toString(), '%PDF-');
});
