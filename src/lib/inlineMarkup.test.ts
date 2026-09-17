import { test } from 'node:test';
import assert from 'node:assert/strict';

import { parseInline, stripInline } from './inlineMarkup';

test('tách chữ nghiêng và đậm thành từng đoạn', () => {
  assert.deepEqual(parseInline('The word <i>salary</i> comes from <b>salt</b>.'), [
    { text: 'The word ', italic: false, bold: false },
    { text: 'salary', italic: true, bold: false },
    { text: ' comes from ', italic: false, bold: false },
    { text: 'salt', italic: false, bold: true },
    { text: '.', italic: false, bold: false },
  ]);
});

test('thẻ lồng nhau và thẻ lạ', () => {
  assert.deepEqual(parseInline('<b><i>go</i>ed</b> <span>x</span>'), [
    { text: 'go', italic: true, bold: true },
    { text: 'ed', italic: false, bold: true },
    { text: ' x', italic: false, bold: false },
  ]);
  assert.equal(stripInline('<i>went</i>, not <b>goed</b>'), 'went, not goed');
});
