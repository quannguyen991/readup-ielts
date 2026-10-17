import test from 'node:test';
import assert from 'node:assert/strict';

import { translateAllLines } from './translate-client';

type Call = { url: string; body: { lines: string[] }; auth: string | null };

/** Thay fetch bằng một bản giả; trả về nhật ký các lượt gọi để kiểm tra. */
function stubFetch(handler: (call: Call, index: number) => Response | Promise<Response>) {
  const calls: Call[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = (init?.headers ?? {}) as Record<string, string>;
    const call: Call = {
      url: String(input),
      body: JSON.parse(String(init?.body ?? '{}')) as { lines: string[] },
      auth: headers.Authorization ?? null,
    };
    calls.push(call);
    return handler(call, calls.length - 1);
  }) as typeof fetch;
  return {
    calls,
    restore: () => {
      globalThis.fetch = original;
    },
  };
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

test('không có token thì không gọi máy chủ và báo cần đăng nhập', async () => {
  const f = stubFetch(() => json(200, { lines: [] }));
  try {
    const out = await translateAllLines(['Hello.'], null);
    assert.equal(out.ok, false);
    if (!out.ok) assert.equal(out.reason, 'signed_out');
    assert.equal(f.calls.length, 0);
  } finally {
    f.restore();
  }
});

test('dịch nhiều lô, giữ đúng thứ tự câu và báo tiến độ từng lô', async () => {
  const lines = Array.from({ length: 13 }, (_, i) => `line ${i}`);
  const progress: Array<[number, number]> = [];
  const f = stubFetch((call) => json(200, { lines: call.body.lines.map((l) => `VI ${l}`) }));
  try {
    const out = await translateAllLines(lines, 'tok', (done, total) => progress.push([done, total]));
    assert.equal(out.ok, true);
    if (out.ok) assert.deepEqual(out.lines, lines.map((l) => `VI ${l}`));
    assert.equal(f.calls.length, 2, '13 câu với lô 10 là 2 lượt gọi');
    assert.ok(f.calls.every((c) => c.url === '/api/youtube/translate'));
    assert.ok(f.calls.every((c) => c.auth === 'Bearer tok'));
    assert.deepEqual(progress, [
      [10, 13],
      [13, 13],
    ]);
  } finally {
    f.restore();
  }
});

test('hết hạn mức (429) thì dừng và trả lại lời nhắn của máy chủ', async () => {
  const f = stubFetch(() => json(429, { error: 'Đã hết lượt AI của tháng này.', code: 'quota_exceeded' }));
  try {
    const out = await translateAllLines(['One.', 'Two.'], 'tok');
    assert.equal(out.ok, false);
    if (!out.ok) {
      assert.equal(out.reason, 'quota');
      assert.equal(out.message, 'Đã hết lượt AI của tháng này.');
    }
  } finally {
    f.restore();
  }
});

test('lỗi mạng hoặc máy chủ lỗi thì báo thất bại, không ném lỗi ra ngoài', async () => {
  const offline = stubFetch(() => {
    throw new TypeError('network down');
  });
  try {
    const out = await translateAllLines(['One.'], 'tok');
    assert.equal(out.ok, false);
    if (!out.ok) assert.equal(out.reason, 'failed');
  } finally {
    offline.restore();
  }

  const broken = stubFetch(() => json(502, { error: 'Dịch chưa được, thử lại sau.' }));
  try {
    const out = await translateAllLines(['One.'], 'tok');
    assert.equal(out.ok, false);
    if (!out.ok) assert.equal(out.message, 'Dịch chưa được, thử lại sau.');
  } finally {
    broken.restore();
  }
});
