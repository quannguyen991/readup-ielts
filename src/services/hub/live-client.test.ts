import test from 'node:test';
import assert from 'node:assert/strict';

import { askExaminer, parseFeedbackJson } from './live-client';

/** Phản hồi giả với thân là luồng các mẩu văn bản, giống route tutor. */
function streamResponse(parts: string[], status = 200): Response {
  const enc = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const p of parts) controller.enqueue(enc.encode(p));
      controller.close();
    },
  });
  return new Response(body, { status, headers: { 'content-type': 'text/plain; charset=utf-8' } });
}

function stubFetch(response: () => Response | Promise<Response>): () => void {
  const original = globalThis.fetch;
  globalThis.fetch = (async () => response()) as typeof fetch;
  return () => {
    globalThis.fetch = original;
  };
}

const msgs = [{ role: 'user' as const, content: 'Hello' }];

test('không có token thì không gọi máy chủ', async () => {
  const restore = stubFetch(() => {
    throw new Error('không được gọi');
  });
  try {
    const out = await askExaminer({ tutorId: 'ielts-examiner', messages: msgs, token: null });
    assert.equal(out.ok, false);
    if (!out.ok) assert.equal(out.reason, 'signed_out');
  } finally {
    restore();
  }
});

test('đọc luồng theo từng mẩu, báo văn bản dần và trả về bản đầy đủ', async () => {
  const seen: string[] = [];
  const restore = stubFetch(() => streamResponse(['Nice ', 'answer. ', 'Next question?']));
  try {
    const out = await askExaminer({
      tutorId: 'ielts-examiner',
      messages: msgs,
      token: 'tok',
      onChunk: (s) => seen.push(s),
    });
    assert.equal(out.ok, true);
    if (out.ok) assert.equal(out.text, 'Nice answer. Next question?');
    assert.equal(seen[seen.length - 1], 'Nice answer. Next question?');
    assert.ok(seen.length >= 2, 'phải báo tiến độ nhiều lần');
  } finally {
    restore();
  }
});

test('hết hạn mức, bận và phiên hết hạn được báo đúng lý do', async () => {
  const quota = stubFetch(() => new Response(JSON.stringify({ error: 'Hết lượt.' }), { status: 429 }));
  try {
    const out = await askExaminer({ tutorId: 'x', messages: msgs, token: 't' });
    assert.equal(out.ok, false);
    if (!out.ok) {
      assert.equal(out.reason, 'quota');
      assert.equal(out.message, 'Hết lượt.');
    }
  } finally {
    quota();
  }

  const busy = stubFetch(() => new Response('', { status: 503 }));
  try {
    const out = await askExaminer({ tutorId: 'x', messages: msgs, token: 't' });
    if (!out.ok) assert.equal(out.reason, 'busy');
  } finally {
    busy();
  }

  const expired = stubFetch(() => new Response('', { status: 401 }));
  try {
    const out = await askExaminer({ tutorId: 'x', messages: msgs, token: 't' });
    if (!out.ok) assert.equal(out.reason, 'signed_out');
  } finally {
    expired();
  }
});

test('phản hồi trống được báo là lỗi, không coi là thành công', async () => {
  const restore = stubFetch(() => streamResponse(['   ']));
  try {
    const out = await askExaminer({ tutorId: 'x', messages: msgs, token: 't' });
    assert.equal(out.ok, false);
  } finally {
    restore();
  }
});

test('đọc JSON nhận xét dù AI bọc trong chữ hoặc khối mã', () => {
  const raw = 'Đây là nhận xét:\n```json\n{"grammar":["Dùng thì quá khứ cho việc đã xảy ra."],"coherence":[],"vocabulary":["Thử từ đồng nghĩa cho good."]}\n```';
  const parsed = parseFeedbackJson(raw);
  assert.deepEqual(parsed?.grammar, ['Dùng thì quá khứ cho việc đã xảy ra.']);
  assert.deepEqual(parsed?.coherence, []);
  assert.equal(parsed?.vocabulary.length, 1);
});

test('JSON hỏng hoặc không có thì trả về null, không ném lỗi', () => {
  assert.equal(parseFeedbackJson('không có json'), null);
  assert.equal(parseFeedbackJson('{"grammar": [}'), null);
});
