import test from 'node:test';
import assert from 'node:assert/strict';

import { toBase64 } from './pronounce-client';

test('base64: khớp với Buffer trên cùng dữ liệu', () => {
  const bytes = Uint8Array.from({ length: 70000 }, (_, i) => (i * 37) % 256);
  assert.equal(toBase64(bytes), Buffer.from(bytes).toString('base64'));
});
