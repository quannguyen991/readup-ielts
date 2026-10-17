import test from 'node:test';
import assert from 'node:assert/strict';

import { analyzePlan } from './analyze-client';

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

function stub(response: () => Response): () => void {
  const original = globalThis.fetch;
  globalThis.fetch = (async () => response()) as typeof fetch;
  return () => {
    globalThis.fetch = original;
  };
}

const analysis = {
  summary: 'Cần ưu tiên viết.',
  risks: [],
  allocation: [{ skill: 'writing', minutesPerWeek: 200, reason: 'yếu nhất' }],
  tips: [],
  priority: ['writing'],
};

test('không có token thì không gọi máy chủ', async () => {
  const out = await analyzePlan({}, null);
  assert.equal(out.ok, false);
  if (!out.ok) assert.equal(out.reason, 'signed_out');
});

test('phản hồi đúng thì trả về phân tích đã kiểm tra và ngân sách', async () => {
  const restore = stub(() => json(200, { analysis, budget: 360, model: 'm' }));
  try {
    const out = await analyzePlan({ x: 1 }, 'tok');
    assert.equal(out.ok, true);
    if (out.ok) {
      assert.equal(out.budget, 360);
      assert.equal(out.analysis.allocation[0]?.skill, 'writing');
    }
  } finally {
    restore();
  }
});

test('phản hồi thiếu phân bổ hợp lệ thì báo lỗi định dạng, không ném lỗi', async () => {
  const restore = stub(() => json(200, { analysis: { summary: 'x', allocation: [] }, budget: 1 }));
  try {
    const out = await analyzePlan({}, 'tok');
    assert.equal(out.ok, false);
    if (!out.ok) assert.equal(out.reason, 'failed');
  } finally {
    restore();
  }
});

test('hết hạn mức và máy bận được báo đúng lý do', async () => {
  const quota = stub(() => json(429, { error: 'Hết lượt.' }));
  try {
    const out = await analyzePlan({}, 'tok');
    if (!out.ok) assert.equal(out.reason, 'quota');
  } finally {
    quota();
  }
  const busy = stub(() => json(503, { error: 'Bận.' }));
  try {
    const out = await analyzePlan({}, 'tok');
    if (!out.ok) assert.equal(out.reason, 'busy');
  } finally {
    busy();
  }
});
