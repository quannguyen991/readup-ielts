import test from 'node:test';
import assert from 'node:assert/strict';

import { countQuoteMatches, summarise, writingReceipt } from './verification';

/**
 * Canh biên nhận kiểm chứng.
 *
 * Đây là thứ NÓI VỚI NGƯỜI HỌC rằng hệ thống đã kiểm những gì, nên nó sai kiểu
 * nào cũng tệ hơn bình thường: nói quá thì dạy người ta tin AI hơn mức đáng tin,
 * nói thiếu thì phí mất bằng chứng đang có sẵn trong tay. Vì vậy hai tính chất
 * phải giữ bằng test: đếm đúng, và LUÔN có dòng "máy không kiểm được".
 */

const BAI = 'The government should fund healthcare because it is a basic human right.';

test('đếm đúng trích dẫn thật và trích dẫn bịa', () => {
  const got = countQuoteMatches(
    ['The government should fund healthcare', 'a basic human right', 'a masterful command of prose'],
    BAI,
  );
  assert.equal(got.checked, 3);
  assert.equal(got.rejected, 1, 'chỉ câu bịa mới bị tính là trượt');
});

test('không phân biệt hoa thường khi đối chiếu', () => {
  assert.equal(countQuoteMatches(['THE GOVERNMENT'], BAI).rejected, 0);
});

test('chuỗi rỗng hoặc quá ngắn tính là trượt, không tính là đạt', () => {
  const got = countQuoteMatches(['', ' ', 'a'], BAI);
  assert.equal(got.checked, 3);
  assert.equal(got.rejected, 3);
});

test('không có trích dẫn nào thì không có gì trượt', () => {
  assert.deepEqual(countQuoteMatches([], BAI), { checked: 0, rejected: 0 });
});

test('biên nhận luôn có dòng "máy không kiểm được"', () => {
  /*
    Đây là ràng buộc quan trọng nhất của cả file.

    Biên nhận chỉ liệt kê những thứ đã kiểm sẽ đọc như một giấy chứng nhận, mà nó
    không phải — band điểm và lời nhận xét vẫn là ước lượng của AI. Bỏ dòng này
    đi thì biên nhận quay ra dạy đúng cái điều ngược lại với điều nó sinh ra để dạy.
  */
  const r = writingReceipt({
    model: 'openai/gpt-oss-120b',
    quotesChecked: 4,
    quotesRejected: 0,
    annotationsChecked: 8,
    annotationsRejected: 0,
    wordCount: 260,
  });
  assert.ok(r.items.some((i) => i.method === 'unverifiable'), 'thiếu dòng nói ra phần không kiểm được');
  assert.equal(r.items[r.items.length - 1]?.method, 'unverifiable', 'dòng đó phải nằm cuối');
});

test('biên nhận không giấu tên model', () => {
  const r = writingReceipt({
    model: 'openai/gpt-oss-120b',
    quotesChecked: 1,
    quotesRejected: 0,
    annotationsChecked: 1,
    annotationsRejected: 0,
    wordCount: 100,
  });
  assert.equal(r.model, 'openai/gpt-oss-120b');
});

test('có trích dẫn bịa thì lời ghi chú nói ra con số, không nói chung chung', () => {
  const r = writingReceipt({
    model: null,
    quotesChecked: 5,
    quotesRejected: 2,
    annotationsChecked: 6,
    annotationsRejected: 1,
    wordCount: 240,
  });
  const quote = r.items.find((i) => i.label.includes('Dẫn chứng'));
  assert.ok(quote?.noteVi.includes('2'), `phải nêu số 2, nhận được: ${quote?.noteVi}`);

  const anns = r.items.find((i) => i.label.includes('vị trí') || i.label.includes('Vị trí'));
  assert.ok(anns?.noteVi.includes('1'));
});

test('không có gì bịa thì lời ghi chú nói vậy, không im lặng', () => {
  const r = writingReceipt({
    model: null,
    quotesChecked: 4,
    quotesRejected: 0,
    annotationsChecked: 9,
    annotationsRejected: 0,
    wordCount: 300,
  });
  const quote = r.items.find((i) => i.label.includes('Dẫn chứng'));
  assert.ok(quote?.noteVi.includes('đều dò lại được'));
});

test('số từ luôn được ghi là tính bằng code', () => {
  const r = writingReceipt({
    model: null,
    quotesChecked: 0,
    quotesRejected: 0,
    annotationsChecked: 0,
    annotationsRejected: 0,
    wordCount: 187,
  });
  const wc = r.items.find((i) => i.label === 'Số từ');
  assert.equal(wc?.method, 'computed');
  assert.ok(wc?.noteVi.includes('187'));
});

test('tổng kết cộng đúng và đếm riêng phần không kiểm được', () => {
  const r = writingReceipt({
    model: null,
    quotesChecked: 4,
    quotesRejected: 1,
    annotationsChecked: 8,
    annotationsRejected: 2,
    wordCount: 250,
  });
  const s = summarise(r);
  // 4 trích dẫn + 8 vị trí + 1 số từ = 13 khẳng định kiểm được.
  assert.equal(s.checked, 13);
  assert.equal(s.rejected, 3);
  assert.equal(s.unverifiable, 1, 'phần không kiểm được KHÔNG được cộng vào phần đã kiểm');
});
