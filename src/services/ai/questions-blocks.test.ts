import test from 'node:test';
import assert from 'node:assert/strict';

import { resetBreakers } from './breaker';
import { generateQuestionsWithClaude, planJobs } from './questions';
import { FIXTURE_PARAGRAPHS as P } from '@/services/questions/fixture-passage';
import { gradeQuestions } from '@/services/questions/grade';

/**
 * Sinh đề theo khối với proxy GIẢ: `fetch` toàn cục bị thay, không tốn một đồng nào.
 * Kiểm đường đi: khối có cấu trúc → dựng + kiểm; model trả rác thì gọi lại một lần;
 * cửa chính sập thì sang cửa phụ; sập hết thì lỗi chung, không lộ tên máy chủ.
 */

const ENV = {
  AI_PRIMARY_BASE_URL: 'https://primary.invalid/v1',
  AI_PRIMARY_API_KEY: 'k1',
  AI_PRIMARY_MODEL: 'm1',
  AI_SECONDARY_BASE_URL: 'https://secondary.invalid/v1',
  AI_SECONDARY_API_KEY: 'k2',
  AI_SECONDARY_MODEL: 'm2',
  AI_TERTIARY_BASE_URL: undefined as string | undefined,
  AI_TERTIARY_API_KEY: undefined as string | undefined,
  OPENAI_BASE_URL: undefined as string | undefined,
  OPENAI_API_KEY: undefined as string | undefined,
  QUESTIONS_MODEL: undefined as string | undefined,
  QUESTIONS_FALLBACK_MODEL: undefined as string | undefined,
  AI_ORDER_QUESTIONS: undefined as string | undefined,
};

async function withMock<T>(
  handler: (url: string, userPrompt: string, call: number) => { status: number; content?: string },
  run: () => Promise<T>,
): Promise<T> {
  const saved: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(ENV)) {
    saved[k] = process.env[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  const realFetch = globalThis.fetch;
  let call = 0;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body ?? '{}')) as { messages: { role: string; content: string }[] };
    const user = body.messages.find((m) => m.role === 'user')?.content ?? '';
    const r = handler(String(input), user, call++);
    if (r.status !== 200) return new Response('boom primary.invalid secret', { status: r.status });
    return new Response(JSON.stringify({ choices: [{ message: { content: r.content } }] }), { status: 200 });
  }) as typeof fetch;
  resetBreakers();
  try {
    return await run();
  } finally {
    globalThis.fetch = realFetch;
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
    resetBreakers();
  }
}

const HEADINGS = JSON.stringify({
  options: [
    'Why the sea is a reliable power source',
    'An early barrage and its output',
    'The ecological cost of damming estuaries',
    'Smaller machines with a lighter footprint',
    'Evidence from a field trial',
    'Funding the sea-bed future',
  ],
  questions: [
    { answer: 'An early barrage and its output', evidence_text: 'The first large scheme was built at La Rance in France in 1966.', explanation: 'x' },
    { answer: 'The ecological cost of damming estuaries', evidence_text: 'Barrages have drawbacks.', explanation: 'x' },
    { answer: 'Smaller machines with a lighter footprint', evidence_text: 'Because they do not block the estuary, they disturb marine life far less.', explanation: 'x' },
  ],
});

const TABLE = JSON.stringify({
  form: {
    title: 'Schemes',
    lines: ['Scheme | Place | Note', 'La Rance | {{1}} | barrage', 'Array | Edinburgh | {{2}} homes', 'Silt | birds | harm to {{3}}'],
  },
  word_limit: 2,
  questions: [
    { answer: 'France', evidence_text: 'The first large scheme was built at La Rance in France in 1966.' },
    { answer: '2,000', evidence_text: 'Over twelve months it supplied power to roughly 2,000 homes' },
    { answer: 'habitats', evidence_text: 'which can damage habitats for wading birds' },
  ],
});

const article = { id: 'art-1', title: 'Tidal power', paragraphs: P, cefrLevel: 'B2' };

test('khối nối tiêu đề + bảng: mỗi khối một lô, ghép đúng thứ tự, chấm được', async () => {
  const set = await withMock(
    (_u, user) => ({ status: 200, content: user.includes('Matching Headings') ? HEADINGS : TABLE }),
    () =>
      generateQuestionsWithClaude(article, {
        blocks: [
          { type: 'matching_headings', count: 3 },
          { type: 'table_completion', count: 3 },
        ],
      }),
  );
  assert.equal(set.questions.length, 6);
  assert.deepEqual(
    set.questions.map((q) => q.type),
    ['matching_headings', 'matching_headings', 'matching_headings', 'table_completion', 'table_completion', 'table_completion'],
  );
  assert.deepEqual(set.questions.map((q) => q.orderIndex), [0, 1, 2, 3, 4, 5]);
  assert.equal(new Set(set.questions.map((q) => q.id)).size, 6);
  assert.equal(set.failedTypes, undefined);

  // Điền đúng đáp án mẫu thì chấm đúng hết.
  const answers = Object.fromEntries(set.questions.map((q) => [q.id, q.correctAnswer]));
  const graded = gradeQuestions(set.questions, answers);
  assert.ok(Object.values(graded).every(Boolean));
});

test('model trả rác ở lần đầu thì gọi lại một lần kèm lỗi của bộ kiểm', async () => {
  const prompts: string[] = [];
  const set = await withMock(
    (_u, user, call) => {
      prompts.push(user);
      return { status: 200, content: call === 0 ? 'xin lỗi tôi không biết' : TABLE };
    },
    () => generateQuestionsWithClaude(article, { blocks: [{ type: 'table_completion', count: 3 }] }),
  );
  assert.equal(set.questions.length, 3);
  assert.equal(prompts.length, 2);
  assert.ok(prompts[1]?.includes('BỘ KIỂM TỰ ĐỘNG BÁO LỖI'));
});

test('một khối hỏng không làm hỏng cả bộ, và được ghi vào failedTypes', async () => {
  const set = await withMock(
    (_u, user) => ({ status: 200, content: user.includes('Matching Headings') ? HEADINGS : '{"form":{"lines":["x"]},"questions":[]}' }),
    () =>
      generateQuestionsWithClaude(article, {
        blocks: [
          { type: 'matching_headings', count: 3 },
          { type: 'table_completion', count: 3 },
        ],
      }),
  );
  assert.equal(set.questions.length, 3);
  assert.deepEqual(set.failedTypes, ['table_completion']);
});

test('cửa chính sập thì chuyển sang cửa phụ', async () => {
  const hosts: string[] = [];
  const set = await withMock(
    (url) => {
      hosts.push(new URL(url).hostname);
      return url.includes('primary') ? { status: 502 } : { status: 200, content: TABLE };
    },
    () => generateQuestionsWithClaude(article, { blocks: [{ type: 'table_completion', count: 3 }] }),
  );
  assert.equal(set.questions.length, 3);
  assert.deepEqual(hosts, ['primary.invalid', 'secondary.invalid']);
});

test('sập hết thì báo lỗi CHUNG, không lộ tên máy chủ, model hay thân phản hồi', async () => {
  const err = await withMock(
    () => ({ status: 500 }),
    () => generateQuestionsWithClaude(article, { blocks: [{ type: 'table_completion', count: 3 }] }).then(
      () => null,
      (e: Error) => e,
    ),
  );
  assert.ok(err);
  assert.ok(!/invalid|primary|secondary|secret|m1|m2|HTTP/i.test(err.message), err.message);
});

test('planJobs: dạng có cấu trúc đi lô khối, dạng phẳng đi lô phẳng, SAT luôn phẳng', () => {
  const jobs = planJobs(
    [
      { type: 'true_false_not_given', count: 5 },
      { type: 'matching_headings', count: 4 },
    ],
    9,
    undefined,
    undefined,
    'ielts',
  );
  assert.deepEqual(jobs.map((j) => j.kind), ['flat', 'block']);
  const sat = planJobs(undefined, 6, undefined, ['sat_inference'], 'sat');
  assert.ok(sat.every((j) => j.kind === 'flat'));
});
