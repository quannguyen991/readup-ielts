import test from 'node:test';
import assert from 'node:assert/strict';

import { __clockInternals } from './clock';

/**
 * Kiểm phần KHÔNG cần React của đồng hồ dùng chung.
 *
 * Chỗ dễ hỏng nhất không phải giá trị trả về mà là vòng đời cái timer: đăng ký
 * hai lần phải dùng chung một timer, và người nghe cuối cùng rời đi thì timer
 * phải tắt hẳn — nếu không, chỉ cần mở rồi đóng vài màn là có một nắm
 * `setInterval` chạy ngầm suốt phiên.
 */

test('hai người nghe cùng nhịp dùng chung một timer', () => {
  const { clockFor } = __clockInternals;
  const clock = clockFor(50_000);

  const offA = clock.subscribe(() => undefined);
  const timerSauA = clock.timer;
  const offB = clock.subscribe(() => undefined);

  assert.ok(timerSauA !== null, 'người nghe đầu tiên phải bật timer');
  assert.equal(clock.timer, timerSauA, 'người thứ hai không được bật thêm timer mới');
  assert.equal(clock.listeners.size, 2);

  offA();
  offB();
});

test('người nghe cuối cùng rời đi thì timer tắt hẳn', () => {
  const { clockFor } = __clockInternals;
  const clock = clockFor(51_000);

  const off = clock.subscribe(() => undefined);
  assert.ok(clock.timer !== null);

  off();
  assert.equal(clock.timer, null, 'không còn ai nghe mà timer vẫn chạy là rò rỉ');
  assert.equal(clock.listeners.size, 0);
});

test('cùng một nhịp thì trả về đúng một đồng hồ', () => {
  const { clockFor } = __clockInternals;
  assert.equal(clockFor(52_000), clockFor(52_000));
  assert.notEqual(clockFor(52_000), clockFor(53_000), 'khác nhịp thì phải là hai đồng hồ');
});

test('hàm subscribe giữ nguyên tham chiếu qua nhiều lần đọc', () => {
  const { clockFor } = __clockInternals;
  // Đây là điều kiện để useSyncExternalStore không gỡ/gắn lại listener mỗi render.
  assert.equal(clockFor(54_000).subscribe, clockFor(54_000).subscribe);
});

test('mỗi nhịp báo lại mốc thời gian mới cho mọi người nghe', async () => {
  const { clockFor } = __clockInternals;
  const clock = clockFor(20);
  const truoc = clock.now;

  let soLanBao = 0;
  const off = clock.subscribe(() => {
    soLanBao += 1;
  });

  await new Promise((resolve) => setTimeout(resolve, 70));
  off();

  assert.ok(soLanBao >= 2, `phải báo ít nhất 2 nhịp trong 70ms, thực tế ${soLanBao}`);
  assert.ok(clock.now >= truoc, 'mốc thời gian không được đi lùi');
});
