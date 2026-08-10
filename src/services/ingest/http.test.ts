import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createPacer, fetchJson, fetchText, mapWithConcurrency } from './http';

test('mapWithConcurrency: giữ đúng thứ tự kết quả dù thời gian hoàn thành khác nhau', async () => {
  // Item lẻ trả về nhanh, item chẵn trả về chậm hơn — nếu implementation gom
  // kết quả theo thứ tự hoàn thành (thay vì theo index) thì test này sẽ lộ ra.
  const items = [50, 5, 40, 5, 30, 5];
  const results = await mapWithConcurrency(items, 3, async (delayMs, index) => {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return index;
  });

  assert.deepEqual(results, [0, 1, 2, 3, 4, 5]);
});

test('mapWithConcurrency: không bao giờ chạy quá `limit` việc cùng lúc', async () => {
  const items = Array.from({ length: 12 }, (_, i) => i);
  let active = 0;
  let peak = 0;

  await mapWithConcurrency(items, 3, async () => {
    active += 1;
    peak = Math.max(peak, active);
    // Nhường lượt cho các worker khác kịp tăng `active` trước khi giảm lại,
    // mô phỏng một tác vụ I/O thật thay vì hoàn thành ngay lập tức.
    await new Promise((resolve) => setTimeout(resolve, 10));
    active -= 1;
  });

  assert.ok(peak <= 3, `peak đồng thời là ${peak}, phải ≤ 3`);
  assert.equal(peak, 3, 'với 12 việc và limit 3 thì phải có lúc chạy đủ 3 việc song song');
});

test('mapWithConcurrency: một callback bị reject không làm hỏng các callback còn lại', async () => {
  const items = [1, 2, 3, 4, 5];

  const results = await mapWithConcurrency(items, 2, async (item) => {
    if (item === 3) throw new Error('lỗi giả lập cho item 3');
    return item * 10;
  }).catch((err: unknown) => err);

  // Promise.all trong worker pool: nếu một worker throw mà không được bắt bên
  // trong callback, toàn bộ mapWithConcurrency reject — đây là hành vi đúng
  // theo brief ("callback push vào mảng errors" là trách nhiệm của caller).
  // Test này xác nhận lỗi không bị NUỐT âm thầm (silently swallowed): nó
  // phải nổi lên rõ ràng, không phải biến mất hay làm sai kết quả các item khác.
  assert.ok(results instanceof Error);
  assert.equal((results as Error).message, 'lỗi giả lập cho item 3');
});

test('mapWithConcurrency: caller tự bắt lỗi trong callback thì các item khác vẫn chạy đủ', async () => {
  const items = [1, 2, 3, 4, 5];
  const errors: string[] = [];

  const results = await mapWithConcurrency(items, 2, async (item) => {
    if (item === 3) {
      errors.push(`item ${item} lỗi`);
      return null;
    }
    return item * 10;
  });

  assert.deepEqual(results, [10, 20, null, 40, 50]);
  assert.deepEqual(errors, ['item 3 lỗi']);
});

test('mapWithConcurrency: limit lớn hơn số item hoặc bằng 0 không làm sập', async () => {
  const results1 = await mapWithConcurrency([1, 2], 10, async (n) => n);
  assert.deepEqual(results1, [1, 2]);

  const results2 = await mapWithConcurrency([1, 2], 0, async (n) => n);
  assert.deepEqual(results2, [1, 2]);

  const results3 = await mapWithConcurrency([], 3, async (n: number) => n);
  assert.deepEqual(results3, []);
});

test('createPacer: hai lệnh gọi đồng thời được xếp cách nhau tối thiểu spacingMs', async () => {
  // spacingMs lớn (80ms) + ngưỡng chấp nhận 60% để chịu được độ phân giải
  // timer thô của một số máy (Windows có thể lệch hàng chục ms); nếu việc
  // giữ chỗ (claim) không race-free thì hai lệnh gọi sẽ resolve gần như
  // đồng thời (lệch chỉ vài ms) bất kể ngưỡng rộng cỡ nào, nên test vẫn có
  // sức phát hiện lỗi thật.
  const spacingMs = 80;
  const pace = createPacer(spacingMs);
  const start = Date.now();

  // Gọi cả ba KHÔNG await giữa chừng — mô phỏng đúng tình huống nhiều worker
  // xin nhịp "cùng lúc".
  const p1 = pace();
  const p2 = pace();
  const p3 = pace();

  const resolvedAt = await Promise.all([p1, p2, p3].map(async (p) => {
    await p;
    return Date.now() - start;
  }));

  const [t1, t2, t3] = resolvedAt.sort((a, b) => a - b) as [number, number, number];
  const minGap = spacingMs * 0.6;

  assert.ok(t2 - t1 >= minGap, `khoảng cách lệnh 1→2 là ${t2 - t1}ms, phải ≥ ${minGap}ms`);
  assert.ok(t3 - t2 >= minGap, `khoảng cách lệnh 2→3 là ${t3 - t2}ms, phải ≥ ${minGap}ms`);
});

test('createPacer: gọi tuần tự (có await) cũng giữ đúng khoảng cách, không cộng dồn thời gian chờ thừa', async () => {
  const spacingMs = 60;
  const pace = createPacer(spacingMs);
  const start = Date.now();

  await pace();
  await pace();
  await pace();

  const elapsed = Date.now() - start;
  // 3 lệnh gọi cách nhau 60ms → tổng thời gian tối thiểu ~120ms (2 khoảng),
  // không phải 180ms — vì bản thân việc gọi tuần tự (có await) đã tự nhiên
  // giãn cách đủ, pacer không được cộng dồn thêm độ trễ.
  assert.ok(elapsed >= spacingMs * 2 * 0.6, `tổng thời gian ${elapsed}ms quá ngắn so với kỳ vọng ~${spacingMs * 2}ms`);
  assert.ok(elapsed < spacingMs * 4, `tổng thời gian ${elapsed}ms quá lớn, có vẻ pacer cộng dồn chờ thừa`);
});

test('createPacer: hai pacer độc lập không ảnh hưởng lẫn nhau', async () => {
  const paceA = createPacer(30);
  const paceB = createPacer(30);

  // Nếu hai pacer vô tình dùng chung state (ví dụ biến module-level không
  // đóng gói trong closure), lệnh gọi paceB sẽ bị paceA làm chậm theo.
  await paceA();
  const t0 = Date.now();
  await paceB();
  const elapsedB = Date.now() - t0;

  assert.ok(elapsedB < 30, `paceB độc lập phải gần như tức thời, nhưng mất ${elapsedB}ms`);
});

/**
 * Ghim đảm bảo: retry bên trong fetchText KHÔNG được lách qua pacer.
 *
 * Trước bản sửa này, `pace()` chỉ được gọi một lần ở phía caller (bên ngoài
 * fetchJson/fetchText) trước lệnh gọi logic — nếu request đó bị 429 và
 * fetchText tự retry (đúng thiết kế sẵn có của nó), lần thử thứ hai bắn ra
 * ngoài mà pacer không hề hay biết. Test này stub `globalThis.fetch` để lần
 * gọi đầu trả 429 (thứ mà fetchText coi là lỗi tạm thời, tự retry), lần gọi
 * sau mới thành công, rồi đếm xem `pace` được xin đúng 2 lần (một cho mỗi
 * lần thử THẬT) hay chỉ 1 lần (bug cũ).
 */
test('fetchText: pace() được xin cho MỖI lần thử thật, kể cả lần retry sau 429', async () => {
  const originalFetch = globalThis.fetch;
  let callCount = 0;

  globalThis.fetch = async (): Promise<Response> => {
    callCount += 1;
    if (callCount === 1) return new Response('', { status: 429 });
    return new Response('ok', { status: 200 });
  };

  let paceCalls = 0;
  const fakePace = async (): Promise<void> => {
    paceCalls += 1;
  };

  try {
    const result = await fetchText('https://example.test/pace-per-attempt', {
      attempts: 3,
      pace: fakePace,
    });
    assert.equal(result, 'ok');
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(callCount, 2, 'fetch thật phải chạy đúng 2 lần: 1 lần 429 rồi 1 lần thành công');
  assert.equal(
    paceCalls,
    2,
    'pace phải được xin cho TỪNG lần thử thật (kể cả lần retry sau 429), không chỉ lần gọi logic đầu tiên — nếu chỉ 1 thì retry đã lách qua pacer',
  );
});

test('fetchJson: forward pace xuống fetchText nguyên vẹn qua thêm một lớp bọc JSON', async () => {
  const originalFetch = globalThis.fetch;
  let callCount = 0;

  globalThis.fetch = async (): Promise<Response> => {
    callCount += 1;
    if (callCount === 1) return new Response('', { status: 429 });
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  };

  let paceCalls = 0;
  const fakePace = async (): Promise<void> => {
    paceCalls += 1;
  };

  try {
    const result = await fetchJson<{ ok: boolean }>('https://example.test/pace-per-attempt-json', {
      attempts: 3,
      pace: fakePace,
    });
    assert.deepEqual(result, { ok: true });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(
    paceCalls,
    2,
    'fetchJson chỉ bọc JSON.parse quanh fetchText — pace vẫn phải được forward và xin đủ 2 lần',
  );
});
