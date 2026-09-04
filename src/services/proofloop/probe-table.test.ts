import test from 'node:test';
import assert from 'node:assert/strict';

import { PROBE_TABLE, probeFor } from './probe-table';

test('mỗi trạng thái ánh xạ đúng một phép thử', () => {
  assert.equal(probeFor('aligned-correct'), 'transfer');
  assert.equal(probeFor('misaligned-correct'), 'evidence-reselect');
  assert.equal(probeFor('aligned-wrong'), 'entailment');
  assert.equal(probeFor('misaligned-wrong'), 'locate');
});

test('unobserved KHÔNG sinh phép thử nào', () => {
  assert.equal(probeFor('unobserved'), null);
});

/**
 * Test khoá.
 *
 * Bảng này được in nguyên vào hồ sơ dự thi — giám khảo đọc được toàn bộ logic
 * quyết định trên một trang. Đổi bảng mà không đổi hồ sơ là để hồ sơ nói sai về
 * sản phẩm. Thêm hay bớt một dòng ở đây thì test này phải đỏ.
 */
test('bảng đúng năm dòng, không hơn không kém', () => {
  assert.deepEqual(Object.keys(PROBE_TABLE).sort(), [
    'aligned-correct',
    'aligned-wrong',
    'misaligned-correct',
    'misaligned-wrong',
    'unobserved',
  ]);
});

test('bảng bị đóng băng, không sửa được lúc chạy', () => {
  assert.throws(() => {
    // @ts-expect-error — cố tình phá để kiểm rằng Object.freeze có tác dụng
    PROBE_TABLE['aligned-correct'] = 'locate';
  });
});
