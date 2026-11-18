import assert from 'node:assert/strict';
import { test } from 'node:test';

import { HSA_KIND_ORDER } from '@/data/hsa';
import { buildAutoPlan, buildContext, daysUntil, fitToBudget, inferredDone, latestPerQuestion, makeTask, parseAiPlan, readContext, scheduleTasks, type PlanContext } from './plan';
import type { AttemptItem } from './scoring';

const base: PlanContext = {
  day: '2026-11-15',
  minutesPerDay: 60,
  daysToExam: 90,
  targetScore: 40,
  focus: 'all',
  criteria: [],
  weakKinds: ['cloze', 'reasoning', 'synonym-antonym'],
  wrongCount: 6,
  mocksDone: 1,
  placementDone: true,
  recentKinds: [],
};

const why = { vi: 'vì sao', en: 'why' };

test('chưa làm bài test đầu vào thì việc đầu tiên là làm bài test', () => {
  const plan = buildAutoPlan({ ...base, placementDone: false });
  assert.equal(plan.tasks[0]!.type, 'placement');
  assert.equal(plan.tasks[0]!.href, '/hsa/placement');
  assert.equal(plan.tasks.at(-1)!.type, 'vocab');
});

test('kế hoạch tự động: chữa câu sai, dạng yếu, chủ điểm, rồi ôn từ; vừa ngân sách', () => {
  const plan = buildAutoPlan(base);
  assert.deepEqual(plan.tasks.map((t) => t.type), ['review', 'kind', 'topic', 'vocab']);
  assert.ok(plan.tasks.reduce((s, t) => s + t.minutes, 0) <= base.minutesPerDay * 1.15);
  assert.equal(plan.source, 'auto');
  assert.match(plan.headline.vi, /3 bài \+ ôn từ/);
});

test('dạng câu được chọn nằm trong các dạng yếu và đổi theo ngày', () => {
  const kinds = new Set<string>();
  for (let d = 1; d <= 9; d += 1) {
    const plan = buildAutoPlan({ ...base, day: `2026-11-${String(d).padStart(2, '0')}` });
    kinds.add(plan.tasks.find((t) => t.type === 'kind')!.kind!);
  }
  assert.ok([...kinds].every((k) => base.weakKinds.includes(k as never)));
  assert.ok(kinds.size >= 2);
});

test('dạng đã luyện hôm nay và hôm qua được tránh khi còn dạng khác', () => {
  const plan = buildAutoPlan({ ...base, recentKinds: ['cloze', 'reasoning'] });
  assert.equal(plan.tasks.find((t) => t.type === 'kind')!.kind, 'synonym-antonym');
});

test('kỹ năng người học muốn nâng được ưu tiên', () => {
  const plan = buildAutoPlan({ ...base, focus: 'vocab' });
  assert.equal(plan.tasks.find((t) => t.type === 'kind')!.kind, 'synonym-antonym');
});

test('gần ngày thi và đủ thời gian thì xếp đề mô phỏng kế tiếp', () => {
  const plan = buildAutoPlan({ ...base, daysToExam: 10, minutesPerDay: 90, mocksDone: 2 });
  const mock = plan.tasks.find((t) => t.type === 'mock')!;
  assert.equal(mock.href, '/hsa/exam/3');
  assert.equal(mock.minutes, 60);
});

test('ngân sách nhỏ thì bỏ bài ưu tiên thấp nhưng giữ ôn từ và ít nhất hai bài', () => {
  const tasks = [
    makeTask({ type: 'review', count: 5, minutes: 10, why }),
    makeTask({ type: 'kind', kind: 'cloze', minutes: 20, why }),
    makeTask({ type: 'topic', topicId: 'environment', minutes: 15, why }),
    makeTask({ type: 'vocab', minutes: 10, why }),
  ];
  const fitted = fitToBudget(tasks, 30);
  assert.ok(fitted.length >= 2);
  assert.equal(fitted.at(-1)!.type, 'vocab');
  assert.ok(!fitted.some((t) => t.type === 'topic'));
});

test('xếp giờ nối tiếp, qua nửa đêm vẫn đúng', () => {
  const tasks = [makeTask({ type: 'vocab', minutes: 15, why }), makeTask({ type: 'challenge', minutes: 30, why })];
  assert.deepEqual(scheduleTasks(tasks, '23:50'), [
    { start: '23:50', end: '00:05' },
    { start: '00:05', end: '00:35' },
  ]);
});

test('daysUntil', () => {
  assert.equal(daysUntil('2026-11-25', '2026-11-15'), 10);
  assert.equal(daysUntil(null, '2026-11-15'), null);
});

test('AI: đường dẫn do code dựng, bỏ bài sai danh mục, thêm ôn từ cuối', () => {
  const plan = parseAiPlan(
    {
      tasks: [
        { type: 'kind', kind: 'cloze', minutes: 25, why: 'Điền khuyết còn yếu', whyEn: 'Cloze is weak', href: 'https://evil.example' },
        { type: 'kind', kind: 'khong-co', minutes: 10, why: 'x' },
        { type: 'topic', topicId: 'environment', minutes: 15, why: 'Chủ điểm hôm nay' },
        { type: 'lam-gi-do', minutes: 5, why: 'x' },
      ],
    },
    base,
    'model-x',
  )!;
  assert.deepEqual(plan.tasks.map((t) => t.id), ['kind:cloze', 'topic:environment', 'vocab']);
  assert.equal(plan.tasks[0]!.href, '/hsa/practice/cloze');
  assert.ok(plan.tasks.every((t) => t.href.startsWith('/hsa/')));
  assert.equal(plan.source, 'ai');
  assert.equal(plan.model, 'model-x');
});

test('AI: bài chữa lỗi bị bỏ khi chưa có đủ câu sai, trùng bài chỉ giữ một', () => {
  const plan = parseAiPlan(
    {
      tasks: [
        { type: 'review', minutes: 10, why: 'a' },
        { type: 'kind', kind: 'cloze', minutes: 20, why: 'b' },
        { type: 'kind', kind: 'cloze', minutes: 20, why: 'c' },
      ],
    },
    { ...base, wrongCount: 1 },
    undefined,
  )!;
  assert.deepEqual(plan.tasks.map((t) => t.type), ['kind', 'vocab']);
});

test('AI: JSON hỏng, không có bài học nào hoặc thiếu lời giải thích đều bị từ chối', () => {
  assert.equal(parseAiPlan(null, base, undefined), null);
  assert.equal(parseAiPlan({ tasks: 'x' }, base, undefined), null);
  assert.equal(parseAiPlan({ tasks: [{ type: 'vocab', minutes: 10, why: 'a' }] }, base, undefined), null);
  assert.equal(parseAiPlan({ tasks: [{ type: 'kind', kind: 'cloze', minutes: 10 }] }, base, undefined), null);
});

test('AI: số phút bị chặn trong khoảng 5–90 và cả kế hoạch vừa ngân sách', () => {
  const plan = parseAiPlan(
    {
      tasks: [
        { type: 'kind', kind: 'cloze', minutes: 500, why: 'a' },
        { type: 'kind', kind: 'reasoning', minutes: 20, why: 'b' },
        { type: 'kind', kind: 'synonym-antonym', minutes: 20, why: 'c' },
      ],
    },
    { ...base, minutesPerDay: 45 },
    undefined,
  )!;
  assert.ok(plan.tasks.every((t) => t.minutes >= 5 && t.minutes <= 90));
  assert.ok(plan.tasks.length >= 2);
});

test('buildContext: dạng yếu lấy từ lần làm gần nhất của mỗi câu', () => {
  const it = (qid: string, kind: AttemptItem['kind'], picked: number | null): AttemptItem => ({ qid, kind, level: 'B2', topic: 't', picked, answer: 1 });
  const newer = [it('a', 'cloze', 0), it('b', 'cloze', 0)];
  const older = [it('a', 'cloze', 1), it('c', 'reasoning', 1), it('d', 'reasoning', 1)];
  const latest = latestPerQuestion([newer, older]);
  assert.equal(latest.length, 4);
  const ctx = buildContext({
    profile: { minutesPerDay: 45, examDate: '2026-12-01', target: 40, focus: 'all' },
    day: '2026-11-15',
    latest,
    metas: [{ activity: 'practice:cloze', day: '2026-11-14' }, { activity: 'mock:form-1', day: '2026-11-10' }],
    placementDone: true,
  });
  assert.equal(ctx.weakKinds[0], 'cloze');
  assert.equal(ctx.wrongCount, 2);
  assert.equal(ctx.mocksDone, 1);
  assert.deepEqual(ctx.recentKinds, ['cloze']);
  assert.equal(ctx.daysToExam, 16);
  assert.ok(HSA_KIND_ORDER.includes(ctx.weakKinds[0]!));
});

test('readContext: nhận ngữ cảnh đúng, lọc dạng câu lạ, từ chối giá trị ngoài khoảng', () => {
  const ok = readContext({ ...base, weakKinds: ['cloze', 'khong-co'], extra: 'bỏ' });
  assert.deepEqual(ok?.weakKinds, ['cloze']);
  assert.equal(readContext({ ...base, minutesPerDay: 5 }), null);
  assert.equal(readContext({ ...base, day: '15/11/2026' }), null);
  assert.equal(readContext({ ...base, focus: 'khac' }), null);
  assert.equal(readContext({ ...base, placementDone: 'yes' }), null);
  assert.equal(readContext({ ...base, daysToExam: null })?.daysToExam, null);
  assert.equal(readContext('x'), null);
});

test('inferredDone: bài xong khi hôm nay đã làm đúng loại bài đó; ôn từ thì không tự suy ra', () => {
  const kind = makeTask({ type: 'kind', kind: 'cloze', minutes: 20, why });
  const topic = makeTask({ type: 'topic', topicId: 'environment', minutes: 15, why });
  const vocab = makeTask({ type: 'vocab', minutes: 10, why });
  const today = ['practice:cloze', 'topic:technology', 'mock:form-3'];
  assert.equal(inferredDone(kind, today, false), true);
  assert.equal(inferredDone(kind, ['practice:reasoning'], false), false);
  assert.equal(inferredDone(topic, today, false), false);
  assert.equal(inferredDone(makeTask({ type: 'mock', paper: 3, minutes: 60, why }), today, false), true);
  assert.equal(inferredDone(vocab, today, true), false);
  assert.equal(inferredDone(makeTask({ type: 'placement', minutes: 30, why }), [], true), true);
});
