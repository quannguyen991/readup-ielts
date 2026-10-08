import test from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';

import { stampLine, stampPdf } from './stamp';

test('dòng in có email và mã đơn, chỉ còn ký tự ASCII', () => {
  const line = stampLine('học.sinh@example.com', 'B9-ĐƠN1');
  assert.match(line, /h\?c\.sinh@example\.com/);
  assert.match(line, /Order B9-\?\?N1/);
  assert.ok(/^[\x20-\x7E]+$/.test(line));
});

test('in đủ mọi trang, giữ nguyên số trang, ghi email + mã đơn vào thông tin file', async () => {
  const src = await PDFDocument.create();
  for (let i = 0; i < 3; i++) src.addPage([595, 842]);
  const out = await PDFDocument.load(await stampPdf(await src.save(), 'a@b.vn', 'B9-X1'));
  assert.equal(out.getPageCount(), 3);
  assert.match(out.getSubject() ?? '', /a@b\.vn.*B9-X1/);
  for (const page of out.getPages()) {
    // mỗi trang có thêm luồng nội dung chứa lệnh vẽ chữ
    assert.ok(page.node.Contents(), 'trang không có nội dung in');
  }
});
