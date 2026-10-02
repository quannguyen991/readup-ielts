import test from 'node:test';
import assert from 'node:assert/strict';

import { blanksIn, parseFormLine, parseTableRow } from './form-lines';

test('parseFormLine tách chữ và ô trống theo thứ tự', () => {
  assert.deepEqual(parseFormLine('Rain falls on {{3}} and then {{4}}.'), [
    { text: 'Rain falls on ' },
    { blank: 3 },
    { text: ' and then ' },
    { blank: 4 },
    { text: '.' },
  ]);
  assert.deepEqual(parseFormLine('không có ô'), [{ text: 'không có ô' }]);
});

test('parseTableRow bỏ dấu | đầu cuối và cắt ô', () => {
  assert.deepEqual(parseTableRow('Method | Cost | {{1}}'), ['Method', 'Cost', '{{1}}']);
  assert.deepEqual(parseTableRow('| a | b |'), ['a', 'b']);
});

test('blanksIn liệt kê số ô trống', () => {
  assert.deepEqual(blanksIn(['x {{1}}', '## y', 'z {{2}} {{3}}']), [1, 2, 3]);
});
