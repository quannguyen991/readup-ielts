import assert from 'node:assert/strict';
import { test } from 'node:test';

import { IELTS_LEVELS, SAT_LEVELS, articleIdForSlug, type PathLevel, type PathNode, type PathTarget } from '@/data/learning-path';

import { levelProgress, nextNode, nodeStatus, speakingAnswerMatches, type NodeStatus, type PathData } from './progress';
import { PATH_RESOLVERS, rwSetQuestionIds } from './resolvers';

const node = (target: PathTarget, id = 'n'): PathNode => ({
  id,
  minutes: 10,
  target,
  title: { vi: 't', en: 't' },
  desc: { vi: 'd', en: 'd' },
});
const empty: PathData = { synced: true };
const st = (target: PathTarget, d: PathData, id?: string) => nodeStatus(node(target, id), d, PATH_RESOLVERS).state;

test('chưa có dữ liệu học thì mọi bài đều chưa làm', () => {
  for (const n of [...IELTS_LEVELS, ...SAT_LEVELS].flatMap((l) => l.parts.flatMap((p) => p.nodes))) {
    assert.equal(nodeStatus(n, empty, PATH_RESOLVERS).state, 'todo', n.id);
  }
});

test('bài đọc: xong khi có một lượt làm bài, đang làm khi mới mở đọc', () => {
  const id = articleIdForSlug('sleep')!;
  const t: PathTarget = { kind: 'read', slug: 'sleep' };
  assert.equal(st(t, { ...empty, study: { progress: { [id]: { percentCompleted: 30 } } } }), 'started');
  assert.equal(st(t, { ...empty, study: { sessions: [{ articleId: 'other' }] } }), 'todo');
  assert.equal(st(t, { ...empty, study: { sessions: [{ articleId: id }] } }), 'done');
});

test('chép chính tả và dịch câu: chỉ tính buổi gắn đúng bộ và đúng chế độ', () => {
  const dict: PathTarget = { kind: 'dictation', set: 'set-05' };
  const tr: PathTarget = { kind: 'translate', set: 'tset-family' };
  const sessions = [
    { mode: 'dictation', setId: 'set-06' },
    { mode: 'translation', setId: 'set-05' },
    { mode: 'dictation' },
  ];
  assert.equal(st(dict, { ...empty, sentence: { sessions } }), 'todo');
  assert.equal(st(dict, { ...empty, sentence: { sessions: [...sessions, { mode: 'dictation', setId: 'set-05' }] } }), 'done');
  assert.equal(st(tr, { ...empty, sentence: { sessions } }), 'todo');
  assert.equal(st(tr, { ...empty, sentence: { sessions: [{ mode: 'translation', setId: 'tset-family' }] } }), 'done');
});

test('Writing: xong khi đã nộp một bài cho đúng đề', () => {
  const t: PathTarget = { kind: 'write', prompt: 'w-t2-health-6-discussion' };
  assert.equal(st(t, { ...empty, writing: { submissions: [{ promptId: 'w-t2-health-6-opinion' }] } }), 'todo');
  assert.equal(st(t, { ...empty, writing: { submissions: [{ promptId: 'w-t2-health-6-discussion' }] } }), 'done');
});

test('Speaking: chỉ tính câu trả lời thuộc đúng chủ đề và đúng phần thi, bỏ qua câu bị bỏ', () => {
  const p1: PathTarget = { kind: 'speak', part: 'p1', topic: 'p1-home' };
  const p2: PathTarget = { kind: 'speak', part: 'p2', topic: 'p2-tech' };
  const p3: PathTarget = { kind: 'speak', part: 'p3', topic: 'p2-tech' };
  const attempt = (answers: { questionId: string; part: number; skipped?: boolean }[]) => ({ ...empty, speaking: { attempts: [{ mode: 'full', answers }] } });

  assert.equal(st(p1, attempt([{ questionId: 'p1-food-1', part: 1 }])), 'todo');
  assert.equal(st(p1, attempt([{ questionId: 'p1-home-2', part: 1, skipped: true }])), 'todo');
  assert.equal(st(p1, attempt([{ questionId: 'p1-home-2', part: 1 }])), 'done');

  // Lượt thi đủ 3 phần với thẻ p2-tech: tính cho cả Part 2 lẫn Part 3 của thẻ đó.
  const full = attempt([
    { questionId: 'p2-tech', part: 2 },
    { questionId: 'p2-tech-p3-1', part: 3 },
  ]);
  assert.equal(st(p2, full), 'done');
  assert.equal(st(p3, full), 'done');
  // Chỉ làm Part 2 thì Part 3 chưa xong.
  assert.equal(st(p3, attempt([{ questionId: 'p2-tech', part: 2 }])), 'todo');
  assert.equal(speakingAnswerMatches(p2, 'p2-tech-p3-1'), false);
});

test('lý thuyết: đọc từ dấu "đã học xong" của bài lý thuyết Toán / Verbal', () => {
  assert.equal(st({ kind: 'math-lesson', skill: 'percentages' }, { ...empty, lessons: { 'verbal:percentages': 'x' } }), 'todo');
  assert.equal(st({ kind: 'math-lesson', skill: 'percentages' }, { ...empty, lessons: { 'math:percentages': 'x' } }), 'done');
  assert.equal(st({ kind: 'rw-lesson', skill: 'words' }, { ...empty, lessons: { 'verbal:words': 'x' } }), 'done');
});

test('bộ SAT Verbal: xong khi đã trả lời ≥ 80% số câu của đúng bộ đó', () => {
  const ids = rwSetQuestionIds('satrw-u1-learn')!;
  assert.ok(ids.length > 0);
  const answered = (k: number) => Object.fromEntries(ids.slice(0, k).map((id) => [id, { correct: true }]));
  const t: PathTarget = { kind: 'rw-set', set: 'satrw-u1-learn' };
  assert.equal(st(t, { ...empty, satRw: answered(1) }), 'started');
  assert.equal(st(t, { ...empty, satRw: answered(Math.ceil(ids.length * 0.8) - 1) }), 'started');
  assert.equal(st(t, { ...empty, satRw: answered(Math.ceil(ids.length * 0.8)) }), 'done');
  // Câu của nửa sau (bộ Luyện) không làm bộ Học xong.
  const drill = rwSetQuestionIds('satrw-u1-drill')!;
  assert.equal(drill.some((id) => ids.includes(id)), false);
  assert.equal(st(t, { ...empty, satRw: Object.fromEntries(drill.map((id) => [id, {}])) }), 'todo');
});

test('quiz từ vựng SAT: xong khi một mức đạt ≥ 80%', () => {
  const t: PathTarget = { kind: 'sat-vocab', slug: 'sat-verbal-bai-1' };
  assert.equal(st(t, { ...empty, satQuiz: { 'sat-verbal-bai-1:1': { score: 6, total: 10 } } }), 'started');
  assert.equal(st(t, { ...empty, satQuiz: { 'sat-verbal-bai-10:1': { score: 10, total: 10 } } }), 'todo');
  assert.equal(st(t, { ...empty, satQuiz: { 'sat-verbal-bai-1:2': { score: 8, total: 10 } } }), 'done');
});

test('bộ từ, chương SAT Math, bộ đề Toán: cùng luật với bài giao của Lớp học', () => {
  const words = PATH_RESOLVERS.deckWords('family')!;
  const stages = Object.fromEntries(words.slice(0, Math.ceil(words.length * 0.8)).map((w) => [w, 2]));
  assert.equal(st({ kind: 'vocab', slug: 'family' }, { ...empty, topicStudy: { stages: { family: { [words[0]!]: 1 } } } }), 'started');
  assert.equal(st({ kind: 'vocab', slug: 'family' }, { ...empty, topicStudy: { stages: { family: stages } } }), 'done');
  assert.equal(st({ kind: 'sat-chapter', id: 'percent' }, { ...empty, satRoadmap: { progress: { percent: { easy: { correct: 5, total: 10 } } } } }), 'started');
  assert.equal(st({ kind: 'sat-chapter', id: 'percent' }, { ...empty, satRoadmap: { progress: { percent: { easy: { correct: 8, total: 10 } } } } }), 'done');
  assert.equal(st({ kind: 'math-set', set: 'linear_functions-practice' }, { ...empty, math: { sessions: [{ setId: 'linear_functions-practice' }] } }), 'done');
});

test('bài đọc song ngữ không đo được: chỉ xong khi người học tự đánh dấu, và ghi rõ là tự đánh dấu', () => {
  const t: PathTarget = { kind: 'bilingual', id: 'bl-03-the-bread-that-takes-three-days' };
  const s0 = nodeStatus(node(t, 'x'), empty, PATH_RESOLVERS);
  assert.deepEqual(s0, { state: 'todo', auto: false });
  const s1 = nodeStatus(node(t, 'x'), { ...empty, manual: { x: true } }, PATH_RESOLVERS);
  assert.deepEqual(s1, { state: 'done', auto: false, manual: true });
  // Dấu tự đánh không làm loại đo được thành "xong".
  assert.equal(nodeStatus(node({ kind: 'write', prompt: 'w-t2-health-6-discussion' }, 'y'), { ...empty, manual: { y: true } }, PATH_RESOLVERS).state, 'todo');
});

test('bài kế tiếp là bài chưa xong SỚM NHẤT, kể cả khi người học đã nhảy cóc', () => {
  const level: PathLevel = IELTS_LEVELS[0]!;
  const all = level.parts.flatMap((p) => p.nodes);
  const statuses = (doneIds: string[]): Record<string, NodeStatus> =>
    Object.fromEntries(all.map((n) => [n.id, { state: doneIds.includes(n.id) ? 'done' : 'todo', auto: true } as NodeStatus]));

  assert.equal(nextNode(level, statuses([]))?.id, all[0]!.id);
  assert.equal(nextNode(level, statuses([all[0]!.id, all[1]!.id]))?.id, all[2]!.id);
  // Làm hết Part 2 nhưng bỏ dở Part 1 → vẫn quay về chỗ trống ở Part 1.
  const part2 = level.parts[1]!.nodes.map((n) => n.id);
  assert.equal(nextNode(level, statuses([all[0]!.id, ...part2]))?.id, all[1]!.id);
  assert.equal(nextNode(level, statuses(all.map((n) => n.id))), null);
});

test('tổng hợp tiến độ theo Part và theo trình độ', () => {
  const level = SAT_LEVELS[0]!;
  const p = levelProgress(level, { ...empty, lessons: { 'math:linear_equations_one_var': 'x', 'verbal:boundaries': 'x' } }, PATH_RESOLVERS);
  assert.equal(p.done, 2);
  assert.equal(p.total, level.parts.reduce((a, x) => a + x.nodes.length, 0));
  assert.equal(p.parts[level.parts[0]!.id]!.done, 1);
  assert.equal(p.parts[level.parts[2]!.id]!.done, 1);
  assert.equal(p.next?.id, level.parts[0]!.nodes[1]!.id);
});
