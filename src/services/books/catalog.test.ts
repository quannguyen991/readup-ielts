import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { PDFDocument } from 'pdf-lib';

import { BOOKS, BOOK_TOTALS, bookById, downloadName } from './catalog';

const BOOK_DIR = 'D:/Claude/tong-hop-sach';

test('11 cuốn, id và tên file không trùng', () => {
  assert.equal(BOOKS.length, 11);
  assert.equal(new Set(BOOKS.map((b) => b.id)).size, BOOKS.length);
  assert.equal(new Set(BOOKS.map((b) => b.file)).size, BOOKS.length);
});

test('tổng số trang in trên trang giá là tổng thật', () => {
  assert.equal(BOOK_TOTALS.count, BOOKS.length);
  assert.equal(BOOK_TOTALS.pages, BOOKS.reduce((n, b) => n + b.pages, 0));
});

test('tên file chỉ có chữ Latin không dấu — nó đi vào đường dẫn kho và tên file tải về', () => {
  for (const b of BOOKS) assert.match(b.file, /^[A-Za-z0-9.-]+\.pdf$/, b.file);
});

test('KHÔNG có file cá nhân nào trong danh sách bán', () => {
  // Thư mục sách còn chứa lộ trình học riêng, lịch tuần và danh mục Scribd.
  for (const b of BOOKS) {
    assert.doesNotMatch(b.file, /lo-trinh|lich-tuan|scribd|nhom-facebook/i, b.file);
  }
});

test('tra theo id: có thì ra sách, id lạ thì null', () => {
  assert.equal(bookById('ielts-reading')?.pages, 483);
  assert.equal(bookById('../../masters/x'), null);
  assert.equal(bookById(''), null);
});

test('tên file tải về có chữ Band9 và bỏ số thứ tự', () => {
  assert.equal(downloadName(bookById('ielts-reading')!), 'Band9-IELTS-Reading-Duong-toi-7.5.pdf');
});

test(
  'số trang khớp đúng file PDF thật',
  { skip: existsSync(BOOK_DIR) ? false : 'máy này không có thư mục sách' },
  async () => {
    for (const b of BOOKS) {
      const doc = await PDFDocument.load(readFileSync(`${BOOK_DIR}/${b.file}`), { updateMetadata: false });
      assert.equal(doc.getPageCount(), b.pages, `${b.file}: catalog ghi ${b.pages} trang, file có ${doc.getPageCount()}`);
    }
  },
);
