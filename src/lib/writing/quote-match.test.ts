import assert from 'node:assert/strict';
import { test } from 'node:test';

import { findVerbatim } from './quote-match';

const BAI = "It isn’t   cheap, and the chart\nshows sales.";

test('khớp dù khác khoảng trắng, nháy cong hay thẳng, và trả về đúng đoạn trong bài', () => {
  assert.equal(findVerbatim("it isn't cheap", BAI), 'It isn’t   cheap');
  assert.equal(findVerbatim('the chart shows sales', BAI), 'the chart\nshows sales');
});

test('thiếu một từ thật thì không khớp', () => {
  assert.equal(findVerbatim('the chart shows profit', BAI), null);
});

test('ký tự đặc biệt trong trích dẫn không làm hỏng biểu thức', () => {
  assert.equal(findVerbatim('costs $5.00 (approx.)', 'It costs $5.00 (approx.) today'), 'costs $5.00 (approx.)');
  assert.equal(findVerbatim('a+b?', 'a+b? yes'), 'a+b?');
});

test('trích dẫn rỗng không khớp gì', () => {
  assert.equal(findVerbatim('   ', BAI), null);
});
