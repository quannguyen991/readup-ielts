import test from 'node:test';
import assert from 'node:assert/strict';

import { buildCustomPlan, type PlanInput } from '../plan/custom';
import { agendaFrom, buildMapNodes, planProfile, stageOf } from './map';

const input: PlanInput = {
  ielts: { now: 5, target: 6.5, examIso: '2027-06-15' },
  sat: null,
  minutesPerDay: 60,
  studyDays: [1, 2, 3, 4, 5, 6],
  weak: ['writing'],
  startIso: '2026-10-19',
};
const TODAY = '2026-10-19';
const plan = buildCustomPlan(input);

test('nút đầu luôn mở, nút đang học là nút đầu tiên chưa xong', () => {
  const nodes = buildMapNodes(plan, {});
  assert.ok(nodes.length >= 2);
  assert.equal(nodes[0]?.status, 'current');
  assert.ok(nodes.slice(1).every((n) => n.status === 'locked' || n.status === 'open'));
  assert.equal(nodes.filter((n) => n.status === 'current').length, 1);
});

test('hoàn thành nút đầu thì nút đó thành đã xong, nút kế tiếp thành đang học', () => {
  const first = buildMapNodes(plan, {})[0]!;
  const done: Record<string, true> = {};
  for (const b of plan.weeks.flatMap((w) => w.days.flatMap((d) => d.blocks))) {
    if (b.skill === first.skill) done[b.id] = true;
  }
  const nodes = buildMapNodes(plan, done);
  assert.equal(nodes[0]?.status, 'done');
  assert.equal(nodes[0]?.stars, 3);
  assert.equal(nodes[1]?.status, 'current');
});

test('sao khớp với tiến độ: ít nhất 1 sao khi đã làm một nửa', () => {
  const first = buildMapNodes(plan, {})[0]!;
  const done: Record<string, true> = {};
  const blocks = plan.weeks.flatMap((w) => w.days.flatMap((d) => d.blocks)).filter((b) => b.skill === first.skill);
  blocks.slice(0, Math.ceil(blocks.length / 2)).forEach((b) => (done[b.id] = true));
  const node = buildMapNodes(plan, done)[0]!;
  assert.ok(node.progress >= 0.5 && node.progress < 0.9);
  assert.equal(node.stars, Math.round(node.progress * 3));
});

test('cửa kiểm tra luôn đứng cuối nếu có', () => {
  const nodes = buildMapNodes(plan, {});
  const checkAt = nodes.findIndex((n) => n.skill === 'check');
  if (checkAt >= 0) assert.equal(checkAt, nodes.length - 1);
});

test('giai đoạn hiện tại bao đúng tuần hôm nay và có số khối đã làm', () => {
  const stage = stageOf(plan, input, TODAY, {});
  assert.ok(stage);
  assert.equal(stage?.goal, 'ielts');
  assert.ok((stage?.weekFrom ?? 0) <= 1 && (stage?.weekTo ?? 0) >= 1);
  assert.equal(stage?.blocksDone, 0);
  assert.ok((stage?.blocksTotal ?? 0) > 0);
});

test('lịch 7 ngày: chỉ có ngày trong khoảng, luôn có hôm nay đánh dấu', () => {
  const days = agendaFrom(plan, TODAY, {}, 7);
  assert.ok(days.every((d) => d.iso >= TODAY && d.iso <= '2026-10-25'));
  const today = days.find((d) => d.isToday);
  assert.equal(today?.iso, TODAY);
  assert.ok(days.every((d) => d.blocks.every((b) => b.done === false)));
});

test('hồ sơ gửi cho AI chỉ có số liệu lộ trình, đúng số ngày học và ngày còn lại', () => {
  const p = planProfile(plan, input, TODAY);
  assert.equal(p.studyDaysPerWeek, 6);
  assert.equal(p.minutesPerDay, 60);
  assert.deepEqual(p.weakSkills, ['writing']);
  assert.equal(p.goals.length, 1);
  assert.ok((p.goals[0]?.daysLeft ?? 0) > 200);
  assert.equal(Object.keys(p).includes('name'), false);
});
