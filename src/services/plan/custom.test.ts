import assert from 'node:assert/strict';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import {
  blocksOn,
  buildCustomPlan,
  mondayOf,
  planWeekOf,
  splitMinutes,
  validatePlanInput,
  type PlanInput,
} from './custom';

const both: PlanInput = {
  ielts: { now: 5.5, target: 7, examIso: '2027-03-06' },
  sat: { now: 1200, target: 1450, examIso: '2027-06-05' },
  minutesPerDay: 90,
  studyDays: [1, 2, 3, 4, 5, 6],
  weak: ['writing'],
  startIso: '2026-09-26',
};

test('chia phút: bội số của 5, tổng đúng bằng số phút', () => {
  assert.deepEqual(splitMinutes(70, 2), [35, 35]);
  assert.deepEqual(splitMinutes(65, 2), [35, 30]);
  assert.equal(splitMinutes(155, 3).reduce((a, b) => a + b, 0), 155);
});

test('tuần 1 là tuần của ngày lập, không phải một ngày cố định của người làm app', () => {
  assert.equal(mondayOf('2026-09-26'), '2026-09-21');
  assert.equal(planWeekOf(both, '2026-09-26'), 1);
  assert.equal(planWeekOf(both, '2026-09-28'), 2);
  assert.equal(planWeekOf(both, '2026-09-20'), 0);
});

test('lộ trình phủ từ ngày lập tới kỳ thi cuối, chỉ học vào ngày đã chọn, đúng số phút mỗi ngày', () => {
  const plan = buildCustomPlan(both);
  const days = plan.weeks.flatMap((w) => w.days);
  assert.ok(days[0]!.iso >= both.startIso, 'không có ngày học trước ngày lập');
  assert.ok(days[days.length - 1]!.iso < '2027-06-05', 'không học vào hoặc sau ngày thi cuối');
  for (const d of days) {
    assert.ok(both.studyDays.includes(d.weekday), `${d.iso} không phải ngày học đã chọn`);
    assert.equal(d.blocks.reduce((s, b) => s + b.minutes, 0), 90, `${d.iso} sai tổng phút`);
    assert.equal(d.blocks[0]!.skill, 'vocab', 'khối đầu mỗi ngày là từ vựng');
  }
  assert.ok(plan.weeks.some((w) => w.milestones.includes('Ngày thi IELTS')));
  assert.ok(plan.weeks.some((w) => w.milestones.includes('Ngày thi SAT')));
});

test('sau ngày thi IELTS thì không còn khối IELTS nào', () => {
  const plan = buildCustomPlan(both);
  for (const w of plan.weeks) {
    for (const d of w.days) {
      if (d.iso < '2027-03-06') continue;
      assert.ok(d.blocks.every((b) => b.goal === 'sat'), `${d.iso} vẫn còn khối IELTS`);
    }
  }
});

test('phần tự nhận yếu được nhiều phút hơn phần cùng kỳ thi không yếu', () => {
  const plan = buildCustomPlan(both);
  assert.ok(plan.minutesBySkill.writing > plan.minutesBySkill.reading);
  assert.ok(plan.minutesBySkill.writing > plan.minutesBySkill.listening);
  const flip = buildCustomPlan({ ...both, weak: ['reading'] });
  assert.ok(flip.minutesBySkill.reading > flip.minutesBySkill.writing);
});

test('kỳ thi còn xa mục tiêu hơn (trên mỗi tuần còn lại) được nhiều giờ hơn', () => {
  const satHeavy = buildCustomPlan({ ...both, weak: [], ielts: { now: 6.5, target: 7, examIso: '2027-06-05' }, sat: { now: 1000, target: 1500, examIso: '2027-06-05' } });
  const ielts = satHeavy.minutesBySkill.reading + satHeavy.minutesBySkill.listening + satHeavy.minutesBySkill.writing;
  const sat = satHeavy.minutesBySkill.math + satHeavy.minutesBySkill.verbal;
  assert.ok(sat > ielts * 2, `SAT ${sat} phút, IELTS ${ielts} phút`);
});

test('mỗi giai đoạn kết thúc bằng một cửa kiểm tra là bài thi thử thật', () => {
  const plan = buildCustomPlan({ ...both, ielts: null });
  const checks = plan.weeks.flatMap((w) => w.days.flatMap((d) => d.blocks)).filter((b) => b.skill === 'check');
  assert.ok(checks.length >= 2, `chỉ có ${checks.length} cửa`);
  assert.ok(checks.every((c) => c.href === '/sat/full-test'));
});

test('ba giai đoạn theo thứ tự: nền → dạng → đề, tuần cuối là nước rút', () => {
  const plan = buildCustomPlan({ ...both, ielts: null });
  const seq = plan.weeks.map((w) => w.phases.sat).filter(Boolean);
  const order = ['nen', 'dang', 'de', 'nuoc-rut'];
  for (let i = 1; i < seq.length; i++) assert.ok(order.indexOf(seq[i]!) >= order.indexOf(seq[i - 1]!), `giai đoạn đi lùi ở tuần ${i + 1}`);
  assert.equal(seq[0], 'nen');
  assert.equal(seq[seq.length - 1], 'nuoc-rut');
});

test('mọi đường dẫn trong lộ trình trỏ tới một màn có thật', () => {
  const app = join(__dirname, '..', '..', '..', 'app');
  const plan = buildCustomPlan(both);
  const hrefs = new Set(plan.weeks.flatMap((w) => w.days.flatMap((d) => d.blocks.map((b) => b.href.split('?')[0]!))));
  for (const href of hrefs) {
    const parts = href.split('/').filter(Boolean);
    // Đoạn cuối có thể là tham số động ([skill], [setId]…): chấp nhận file tĩnh hoặc thư mục có route động.
    const staticFile = join(app, ...parts) + '.tsx';
    const staticIndex = join(app, ...parts, 'index.tsx');
    const dir = join(app, ...parts.slice(0, -1));
    const dynamic = existsSync(dir) && readdirSync(dir).some((f: string) => f.startsWith('['));
    const nested = parts.length >= 2 && existsSync(join(app, ...parts.slice(0, -2))) &&
      readdirSync(join(app, ...parts.slice(0, -2))).some((f: string) => f.startsWith('['));
    assert.ok(existsSync(staticFile) || existsSync(staticIndex) || dynamic || nested, `không có màn cho ${href}`);
  }
});

test('ô nhập sai thì nói rõ sai ở đâu', () => {
  assert.deepEqual(validatePlanInput(both), []);
  assert.ok(validatePlanInput({ ...both, ielts: null, sat: null }).length > 0);
  assert.ok(validatePlanInput({ ...both, sat: { now: 1500, target: 1400, examIso: '2027-06-05' } }).some((p) => p.includes('cao hơn')));
  assert.ok(validatePlanInput({ ...both, ielts: { now: null, target: 7, examIso: '2026-09-30' } }).some((p) => p.includes('2 tuần')));
  assert.ok(validatePlanInput({ ...both, studyDays: [] }).length > 0);
});

test('ngày nghỉ không có khối nào', () => {
  const plan = buildCustomPlan({ ...both, studyDays: [1, 3, 5] });
  assert.equal(blocksOn(plan, '2026-09-29').length, 0); // thứ Ba
  assert.ok(blocksOn(plan, '2026-09-28').length > 0); // thứ Hai
});
