import test from 'node:test';
import assert from 'node:assert/strict';

import { BLOCK_RUBRIC } from '@/services/questions/blueprint';
import { parseLegend, roman } from './exam-theme';

test('roman: số La Mã thường cho List of Headings', () => {
  assert.deepEqual([1, 2, 3, 4, 5, 9, 10].map(roman), ['i', 'ii', 'iii', 'iv', 'v', 'ix', 'x']);
});

test('parseLegend: TFNG và YNNG tách đủ ba dòng chú giải', () => {
  const tf = parseLegend(BLOCK_RUBRIC.true_false_not_given);
  assert.ok(tf);
  assert.deepEqual(
    tf.rows.map((r) => r.key),
    ['TRUE', 'FALSE', 'NOT GIVEN'],
  );
  const yn = parseLegend(BLOCK_RUBRIC.yes_no_not_given);
  assert.deepEqual(
    yn?.rows.map((r) => r.key),
    ['YES', 'NO', 'NOT GIVEN'],
  );
});

test('parseLegend: lời dẫn dạng khác giữ nguyên văn (trả null)', () => {
  assert.equal(parseLegend(BLOCK_RUBRIC.multiple_choice), null);
});
