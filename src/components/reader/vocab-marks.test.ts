import assert from 'node:assert/strict';
import { test } from 'node:test';

import { markKinds, stemMark } from './vocab-marks';

const toks = (s: string) => s.split(' ');

test('từ đơn, kể cả biến thể đuôi -ed / -s', () => {
  const k = markKinds(toks('Experts enlisted the help of historians'), [{ word: 'enlist' }, { word: 'historian' }]);
  assert.deepEqual(k, [undefined, 'word', undefined, undefined, undefined, 'word']);
});

test('cụm nhiều từ tô nền vàng và thắng từ đơn bên trong', () => {
  const k = markKinds(toks('This paved the way for the digital age'), [{ word: 'paved' }, { word: 'paved the way' }]);
  assert.deepEqual(k.slice(1, 4), ['phrase', 'phrase', 'phrase']);
  assert.equal(k[0], undefined);
});

test('cụm kết hợp tô xanh, không đè lên cụm vàng', () => {
  const k = markKinds(toks('They made a seminal discovery in the lab'), [{ word: 'seminal', collocation: 'seminal discovery' }]);
  assert.equal(k[3], 'colloc'); // "seminal" nằm trong cụm kết hợp (cụm đi trước từ đơn)
  assert.equal(k[4], 'colloc');
});

test('"led" không khớp "lead", không có từ vựng thì rỗng', () => {
  assert.deepEqual(markKinds(toks('She led the team'), [{ word: 'lead' }]), [undefined, undefined, undefined, undefined]);
  assert.deepEqual(markKinds(toks('anything'), []), [undefined]);
  assert.equal(stemMark('enlisted'), 'enlist');
});

test('dấu câu dính token vẫn khớp', () => {
  const k = markKinds(['historians,', 'agreed.'], [{ word: 'historian' }]);
  assert.equal(k[0], 'word');
});
