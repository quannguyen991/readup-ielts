import assert from 'node:assert/strict';
import { test } from 'node:test';

import { flattenMath } from './flatten';

test('flattenMath: chữ thuần theo thứ tự vẽ, tử số trước mẫu số', () => {
  assert.equal(flattenMath('If frac(x,5) - 5 = 6, what is x?'), 'If x5 - 5 = 6, what is x?');
  assert.equal(flattenMath('plain words here'), 'plain words here');
});

test('flattenMath: mũ và căn giữ chữ bên trong, không thêm ký tự', () => {
  assert.equal(flattenMath('x^2 + sqrt(y)'), 'x2 + y');
});
