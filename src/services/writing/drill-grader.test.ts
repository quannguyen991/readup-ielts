import assert from 'node:assert/strict';
import { test } from 'node:test';

import { gradeBrainstorm, gradeOverview, gradeParaphrase } from './drill-grader';
import type { AnalysisKey } from '@/lib/writing/types';

const KEY: AnalysisKey = {
  trends: [
    { subject: 'Country A', direction: 'up', magnitude: 'large', from: 44, to: 191 },
    { subject: 'Country B', direction: 'down', magnitude: 'large', from: 175, to: 42 },
    { subject: 'Country C', direction: 'stable', magnitude: 'small', from: 113, to: 115 },
  ],
  extremes: [
    { subject: 'Country B', rank: 'highest', at: '2000' },
    { subject: 'Country A', rank: 'highest', at: '2020' },
  ],
  crossings: [{ subject: 'Country A', other: 'Country B', nearLabel: '2010' }],
  grouping: [['Country A'], ['Country B', 'Country C']],
};

// ---------------------------------------------------------------- Overview

test('nêu đủ ba xu hướng thì cả ba được tính là đã bắt', () => {
  const r = gradeOverview(
    'Overall, Country A rose sharply while Country B fell steadily, and Country C remained stable.',
    KEY,
  );
  assert.equal(r.covered.length, 3);
  assert.equal(r.missed.length, 0);
});

test('nhắc đúng tên nhưng sai chiều thì KHÔNG tính là bắt được', () => {
  // Nói Country B tăng trong khi nó giảm là mô tả sai, không phải mô tả thiếu.
  const r = gradeOverview('Overall, Country A rose and Country B also rose.', KEY);
  assert.ok(r.covered.some((t) => t.subject === 'Country A'));
  assert.ok(r.missed.some((t) => t.subject === 'Country B'));
});

test('nhận nhiều cách diễn đạt khác nhau của cùng một chiều', () => {
  for (const verb of ['increased', 'grew', 'climbed', 'went up', 'showed an upward trend']) {
    const r = gradeOverview(`Overall, Country A ${verb} over the period.`, KEY);
    assert.ok(
      r.covered.some((t) => t.subject === 'Country A'),
      `không nhận ra "${verb}"`,
    );
  }
});

test('nhận diễn đạt của chiều đi ngang', () => {
  for (const phrase of ['remained stable', 'stayed steady', 'was unchanged', 'levelled off']) {
    const r = gradeOverview(`Overall, Country C ${phrase}.`, KEY);
    assert.ok(
      r.covered.some((t) => t.subject === 'Country C'),
      `không nhận ra "${phrase}"`,
    );
  }
});

test('phát hiện overview có con số — chỗ này không được có số liệu', () => {
  assert.equal(gradeOverview('Overall, Country A rose from 44 to 191.', KEY).hasNumbers, true);
  assert.equal(gradeOverview('Overall, Country A rose sharply.', KEY).hasNumbers, false);
});

test('phát hiện có nhắc tới việc hai đường đổi ngôi', () => {
  const yes = gradeOverview('Overall, Country A overtook Country B midway.', KEY);
  assert.equal(yes.mentionsCrossing, true);

  const no = gradeOverview('Overall, Country A rose and Country B fell.', KEY);
  assert.equal(no.mentionsCrossing, false);
});

test('điểm phản ánh tỷ lệ xu hướng bắt được, và bị trừ khi có số liệu', () => {
  const full = gradeOverview(
    'Overall, Country A rose while Country B fell, and Country C stayed flat.',
    KEY,
  );
  const withNumbers = gradeOverview(
    'Overall, Country A rose to 191 while Country B fell to 42, and Country C stayed flat.',
    KEY,
  );
  assert.ok(full.score > withNumbers.score);
  assert.ok(full.score <= 100 && withNumbers.score >= 0);
});

test('bài rỗng thì không bắt được gì và không ném lỗi', () => {
  const r = gradeOverview('', KEY);
  assert.equal(r.covered.length, 0);
  assert.equal(r.missed.length, 3);
  assert.equal(r.score, 0);
});

// -------------------------------------------------------------- Paraphrase

const PROMPT = 'The line graph below shows the average price of petrol in three countries, 2000–2020.';

test('chép nguyên đề thì bị báo là không paraphrase', () => {
  const r = gradeParaphrase(PROMPT, PROMPT);
  assert.ok(r.overlapRatio > 0.9);
  assert.equal(r.verdict, 'copied');
});

test('paraphrase mạnh — đổi gần hết từ nội dung — thì được ghi nhận', () => {
  const r = gradeParaphrase(
    PROMPT,
    'The graph compares how much a litre of fuel cost in three different nations over two decades.',
  );
  assert.ok(r.overlapRatio < 0.6, `overlap ${r.overlapRatio}`);
  assert.equal(r.verdict, 'good');
});

test('chỉ đổi đúng một chữ thì vẫn là chép, không phải paraphrase yếu', () => {
  const r = gradeParaphrase(
    PROMPT,
    'The line graph below shows the average price of petrol in three nations, 2000–2020.',
  );
  assert.equal(r.verdict, 'copied');
});

test('đổi được vài từ nội dung nhưng giữ nguyên khung câu thì là paraphrase yếu', () => {
  const r = gradeParaphrase(
    PROMPT,
    'The line graph shows the average cost of fuel in three countries, 2000–2020.',
  );
  assert.equal(r.verdict, 'weak');
});

test('từ chức năng và tên riêng không tính vào độ trùng', () => {
  // "the", "in", "of" trùng là chuyện đương nhiên, không phải chép.
  const r = gradeParaphrase('The number of cars in the city', 'The proportion of vehicles in the town');
  assert.ok(r.overlapRatio < 0.5);
});

// ------------------------------------------------------------- Brainstorm

test('đếm số ý gạch đầu dòng và đối chiếu với đối tượng trong đề', () => {
  const r = gradeBrainstorm('- Country A tang manh\n- Country B giam\n- Country C phang', KEY);
  assert.equal(r.ideaCount, 3);
  assert.equal(r.matchedSubjects.length, 3);
});

test('ý viết mỗi dòng không có gạch đầu dòng vẫn đếm được', () => {
  const r = gradeBrainstorm('Country A rises\nCountry B falls', KEY);
  assert.equal(r.ideaCount, 2);
});

test('bỏ sót đối tượng nào thì liệt kê ra', () => {
  const r = gradeBrainstorm('- Country A tang', KEY);
  assert.deepEqual(r.missedSubjects.sort(), ['Country B', 'Country C']);
});
