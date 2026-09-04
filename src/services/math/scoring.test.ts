import assert from 'node:assert/strict';
import { test } from 'node:test';

import { DIAGNOSTIC_LENGTH, buildDiagnostic, diagnosticHeadline, readDiagnostic } from './diagnostic';
import { MOCK_DOMAIN_BLUEPRINT, MOCK_MODULE_LENGTH, buildMockModule } from './mock';
import {
  MODULE_ROUTING_THRESHOLD,
  countErrorTags,
  estimateMathScore,
  rankSkillsToPractice,
  routeSecondModule,
  summarizeByDomain,
  summarizeBySkill,
} from './scoring';
import type { ScoredAttempt } from './scoring';
import { MATH_SKILL_DOMAIN } from '@/lib/math/types';
import type { MathDomain, MathSkill } from '@/lib/math/types';

const attempt = (
  skill: MathSkill,
  isCorrect: boolean,
  errorTag: ScoredAttempt['errorTag'] = null,
  timeSpentMs = 60_000,
): ScoredAttempt => ({ skill, isCorrect, errorTag, timeSpentMs });

// ------------------------------------------------------------- tổng hợp

test('kỹ năng chưa làm câu nào có accuracy null, KHÔNG phải 0', () => {
  // Phân biệt này là cả thiết kế: "chưa biết gì về nó" và "làm rồi và sai hết"
  // dẫn tới hai lời khuyên khác nhau.
  const stats = summarizeBySkill([attempt('percentages', true)]);
  assert.equal(stats.percentages.accuracy, 1);
  assert.equal(stats.circles.accuracy, null);
  assert.equal(stats.circles.total, 0);
});

test('mọi kỹ năng của taxonomy đều có mặt trong bảng tổng hợp', () => {
  const stats = summarizeBySkill([]);
  assert.equal(Object.keys(stats).length, 19);
});

test('tổng hợp theo domain gộp đúng các kỹ năng con', () => {
  const stats = summarizeByDomain([
    attempt('linear_functions', true),
    attempt('linear_inequalities', false),
    attempt('circles', true),
  ]);
  assert.equal(stats.algebra.total, 2);
  assert.equal(stats.algebra.correct, 1);
  assert.equal(stats.geometry_trig.total, 1);
  assert.equal(stats.advanced_math.accuracy, null);
});

test('thời gian trung bình tính trên số câu đã làm', () => {
  const stats = summarizeBySkill([
    attempt('percentages', true, null, 30_000),
    attempt('percentages', false, 'sign_flip', 90_000),
  ]);
  assert.equal(stats.percentages.avgTimeMs, 60_000);
});

test('đếm nhãn lỗi bỏ qua câu làm đúng', () => {
  const counts = countErrorTags([
    attempt('percentages', false, 'sign_flip'),
    attempt('circles', false, 'sign_flip'),
    attempt('linear_functions', true, null),
    attempt('probability', false, 'wrong_denominator'),
  ]);
  assert.deepEqual(counts, [
    { tag: 'sign_flip', count: 2 },
    { tag: 'wrong_denominator', count: 1 },
  ]);
});

test('nhãn lỗi gộp được qua nhiều kỹ năng khác nhau', () => {
  // Đây là lý do tồn tại của bảng nhãn lỗi: sai dấu ở đại số và sai dấu ở hình
  // học là cùng một thói quen, mà bảng theo kỹ năng không bao giờ cho thấy.
  const counts = countErrorTags([
    attempt('linear_equations_one_var', false, 'sign_flip'),
    attempt('circles', false, 'sign_flip'),
    attempt('nonlinear_functions', false, 'sign_flip'),
  ]);
  assert.deepEqual(counts, [{ tag: 'sign_flip', count: 3 }]);
});

// ------------------------------------------------------ xếp hạng ưu tiên

test('kỹ năng chưa làm xếp trước kỹ năng đã làm và sai', () => {
  const stats = summarizeBySkill([
    attempt('percentages', false, 'sign_flip'),
    attempt('circles', true),
  ]);
  const ranked = rankSkillsToPractice(stats);
  assert.equal(ranked[0]?.total, 0, 'Đầu danh sách phải là kỹ năng chưa có dữ liệu.');
  const percentagesIndex = ranked.findIndex((s) => s.skill === 'percentages');
  const circlesIndex = ranked.findIndex((s) => s.skill === 'circles');
  assert.ok(percentagesIndex < circlesIndex, 'Kỹ năng sai phải xếp trước kỹ năng đúng.');
});

// ---------------------------------------------------------- quy ra điểm

test('quy điểm nằm trong đúng dải của bậc module', () => {
  assert.equal(estimateMathScore(0, 44, 'easier'), 200);
  assert.equal(estimateMathScore(44, 44, 'easier'), 600);
  assert.equal(estimateMathScore(0, 44, 'harder'), 400);
  assert.equal(estimateMathScore(44, 44, 'harder'), 800);
});

test('làm đúng hết ở module dễ vẫn KHÔNG chạm 800', () => {
  // Đây là tính chất có thật của đề số hoá, và là lý do phải giữ hai dải riêng.
  assert.ok(estimateMathScore(44, 44, 'easier') < estimateMathScore(0, 44, 'harder') + 250);
  assert.ok(estimateMathScore(44, 44, 'easier') < 800);
});

test('điểm luôn tròn chục và tăng theo số câu đúng', () => {
  let previous = -1;
  for (let correct = 0; correct <= 44; correct += 1) {
    const score = estimateMathScore(correct, 44, 'harder');
    assert.equal(score % 10, 0, `Điểm ${score} không tròn chục.`);
    assert.ok(score >= previous, 'Điểm phải không giảm khi làm đúng nhiều hơn.');
    previous = score;
  }
});

test('bài rỗng không làm vỡ phép quy đổi', () => {
  assert.equal(estimateMathScore(0, 0, 'easier'), 200);
});

test('chuyển module theo đúng ngưỡng đã công bố trong code', () => {
  const total = 22;
  const boundary = Math.ceil(MODULE_ROUTING_THRESHOLD * total);
  assert.equal(routeSecondModule(boundary, total), 'harder');
  assert.equal(routeSecondModule(boundary - 1, total), 'easier');
  assert.equal(routeSecondModule(0, 0), 'easier');
});

// ------------------------------------------------------- bài chẩn đoán

test('bài chẩn đoán phủ đúng 19 kỹ năng, mỗi kỹ năng một câu', () => {
  const items = buildDiagnostic('t1');
  assert.equal(items.length, DIAGNOSTIC_LENGTH);
  const skills = items.map((i) => i.skill);
  assert.equal(new Set(skills).size, 19, 'Có kỹ năng bị lặp hoặc bị bỏ sót.');
});

test('bài chẩn đoán xếp theo cụm domain, không nhảy qua nhảy lại', () => {
  const domains = buildDiagnostic('t1').map((i) => i.domain);
  const firstSeen = new Map<MathDomain, number>();
  domains.forEach((d, i) => {
    if (!firstSeen.has(d)) firstSeen.set(d, i);
  });
  for (const [domain, start] of firstSeen) {
    const indices = domains.map((d, i) => (d === domain ? i : -1)).filter((i) => i >= 0);
    const last = indices[indices.length - 1]!;
    assert.equal(
      last - start + 1,
      indices.length,
      `Domain ${domain} bị cắt thành nhiều cụm rời nhau.`,
    );
  }
});

test('cùng hạt ra cùng bài chẩn đoán', () => {
  assert.deepEqual(buildDiagnostic('abc'), buildDiagnostic('abc'));
  assert.notDeepEqual(buildDiagnostic('abc'), buildDiagnostic('xyz'));
});

test('đọc kết quả: sai một câu chỉ là "cần kiểm lại", không phải "yếu"', () => {
  const items = buildDiagnostic('t1');
  const attempts = items.map((item, i) => attempt(item.skill, i % 2 === 0));
  const reading = readDiagnostic(attempts);

  const verdicts = new Set(reading.bySkill.map((s) => s.verdict));
  assert.ok(!verdicts.has('chua_lam'), 'Làm hết rồi thì không còn kỹ năng nào "chưa làm".');
  assert.deepEqual([...verdicts].sort(), ['can_kiem_lai', 'tam_on']);
});

test('kết quả nói rõ mức tin cậy thay vì để màn hình tự suy diễn', () => {
  const items = buildDiagnostic('t1');
  const reading = readDiagnostic(items.map((item, i) => attempt(item.skill, i > 3)));
  const headline = diagnosticHeadline(reading);
  assert.ok(headline.includes('ĐÚNG MỘT CÂU'), 'Phải nói rõ mỗi kỹ năng chỉ được hỏi một câu.');
  assert.ok(headline.includes('bản đồ định hướng'));
});

test('làm đúng hết thì gợi ý bước tiếp theo, không khen suông', () => {
  const items = buildDiagnostic('t1');
  const reading = readDiagnostic(items.map((item) => attempt(item.skill, true)));
  assert.equal(reading.priority.length, 0);
  assert.ok(diagnosticHeadline(reading).includes('mock'));
});

test('chưa làm gì thì không bịa ra nhận định', () => {
  const reading = readDiagnostic([]);
  assert.equal(reading.total, 0);
  assert.ok(diagnosticHeadline(reading).includes('Chưa làm'));
});

// ------------------------------------------------------------ mock test

test('mỗi module đúng 22 câu và đúng tỉ trọng bốn domain', () => {
  for (const tier of ['mixed', 'easier', 'harder'] as const) {
    const items = buildMockModule('m1', 1, tier);
    assert.equal(items.length, MOCK_MODULE_LENGTH);

    const counts: Record<string, number> = {};
    for (const item of items) counts[item.domain] = (counts[item.domain] ?? 0) + 1;
    for (const domain of Object.keys(MOCK_DOMAIN_BLUEPRINT) as MathDomain[]) {
      assert.equal(
        counts[domain],
        MOCK_DOMAIN_BLUEPRINT[domain],
        `Bậc ${tier}: domain ${domain} có ${counts[domain]} câu, phải là ${MOCK_DOMAIN_BLUEPRINT[domain]}.`,
      );
    }
  }
});

test('tổng bản thiết kế đúng bằng độ dài một module', () => {
  const total = Object.values(MOCK_DOMAIN_BLUEPRINT).reduce((s, n) => s + n, 0);
  assert.equal(total, MOCK_MODULE_LENGTH);
});

test('module khó hơn thật sự nhiều câu khó hơn module dễ hơn', () => {
  const countHard = (tier: 'easier' | 'harder') =>
    buildMockModule('m1', 2, tier).filter((i) => i.difficulty === 'hard').length;
  assert.ok(
    countHard('harder') > countHard('easier'),
    `Bậc khó có ${countHard('harder')} câu hard, bậc dễ có ${countHard('easier')} — không phân biệt được.`,
  );
});

test('module 1 và module 2 không phải cùng một bộ câu', () => {
  const first = buildMockModule('m1', 1, 'mixed').map((i) => i.id);
  const second = buildMockModule('m1', 2, 'harder').map((i) => i.id);
  assert.equal(first.filter((id) => second.includes(id)).length, 0);
});

test('các domain được trộn lẫn trong module, không xếp thành khối', () => {
  // Đề thật trộn lẫn; xếp khối thì người làm đoán được domain của câu tiếp theo.
  const domains = buildMockModule('m1', 1, 'mixed').map((i) => i.domain);
  let switches = 0;
  for (let i = 1; i < domains.length; i += 1) {
    if (domains[i] !== domains[i - 1]) switches += 1;
  }
  assert.ok(switches >= 6, `Chỉ có ${switches} lần đổi domain trong 22 câu — trông như xếp khối.`);
});

test('cùng hạt ra cùng module', () => {
  assert.deepEqual(buildMockModule('seedA', 1, 'mixed'), buildMockModule('seedA', 1, 'mixed'));
});

test('mỗi câu trong module đều thuộc đúng domain của kỹ năng nó', () => {
  for (const item of buildMockModule('m2', 1, 'mixed')) {
    assert.equal(item.domain, MATH_SKILL_DOMAIN[item.skill]);
  }
});
