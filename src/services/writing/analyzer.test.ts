import assert from 'node:assert/strict';
import { test } from 'node:test';

import { analyseDraft } from './analyzer';

const T1 = { task: 'ielts_task1' as const, minWords: 150 };
const T2 = { task: 'ielts_task2' as const, minWords: 250 };

/** Bài giả đủ dài, để phép thử số từ không lấn sang phép thử khác. */
function padTo(words: number, text: string): string {
  const need = Math.max(0, words - text.trim().split(/\s+/).length);
  return `${text} ${'filler '.repeat(need)}`.trim();
}

test('bài rỗng không làm sập và báo thiếu từ', () => {
  const a = analyseDraft('', T1);
  assert.equal(a.wordCount, 0);
  assert.ok(a.hints.some((h) => h.code === 'too_short'));
});

test('đếm đoạn theo dòng trống, không theo xuống dòng đơn', () => {
  const a = analyseDraft('Đoạn một.\n\nĐoạn hai.\nVẫn đoạn hai.\n\nĐoạn ba.', T2);
  assert.equal(a.paragraphCount, 3);
});

test('dưới số từ tối thiểu thì cảnh báo, đủ từ thì thôi', () => {
  assert.ok(analyseDraft(padTo(100, 'The chart shows.'), T1).hints.some((h) => h.code === 'too_short'));
  assert.ok(!analyseDraft(padTo(170, 'The chart shows.'), T1).hints.some((h) => h.code === 'too_short'));
});

test('Task 1 thiếu Overall thì cảnh báo — đây là lỗi tốn điểm nhất', () => {
  const a = analyseDraft(padTo(170, 'The line graph illustrates sales. Sales rose to 40.'), T1);
  assert.ok(a.hints.some((h) => h.code === 'no_overview'));
  assert.equal(a.hasOverview, false);
});

test('nhận ra overview qua nhiều cách mở đầu khác nhau', () => {
  for (const opener of ['Overall,', 'In general,', 'It is clear that']) {
    const a = analyseDraft(padTo(170, `The graph shows X.\n\n${opener} sales rose.`), T1);
    assert.equal(a.hasOverview, true, `không nhận ra "${opener}"`);
  }
});

test('Task 2 không bị đòi Overall — Task 2 không có overview', () => {
  const a = analyseDraft(padTo(270, 'Some people think X. I disagree.'), T2);
  assert.ok(!a.hints.some((h) => h.code === 'no_overview'));
});

test('overview của Task 1 có con số thì cảnh báo', () => {
  const withNumber = padTo(170, 'The graph shows X.\n\nOverall, sales rose from 30 to 125 litres.');
  assert.ok(analyseDraft(withNumber, T1).hints.some((h) => h.code === 'overview_has_numbers'));

  const withoutNumber = padTo(170, 'The graph shows X.\n\nOverall, sales rose sharply over the period.');
  assert.ok(!analyseDraft(withoutNumber, T1).hints.some((h) => h.code === 'overview_has_numbers'));
});

test('lặp động từ xu hướng quá hai lần thì cảnh báo', () => {
  const text = padTo(
    170,
    'Sales increased. Prices increased. Numbers increased. Demand increased.',
  );
  const a = analyseDraft(text, T1);
  assert.ok(a.hints.some((h) => h.code === 'repeated_verb'));
  assert.ok(a.repeatedWords.some((w) => w.word === 'increase' && w.count >= 3));
});

test('đếm cả dạng chia của cùng một động từ', () => {
  const a = analyseDraft(padTo(170, 'It rose. It rises. It has risen. Overall, it grew.'), T1);
  assert.ok(a.repeatedWords.some((w) => w.word === 'rise' && w.count >= 3));
});

test('dùng từ nối ở mọi câu thì cảnh báo lạm dụng', () => {
  const text = padTo(
    180,
    'Overall, X rose. Furthermore, Y fell. Moreover, Z rose. In addition, W fell. However, V rose.',
  );
  assert.ok(analyseDraft(text, T1).hints.some((h) => h.code === 'too_many_connectives'));
});

test('câu dài quá 45 từ thì cảnh báo', () => {
  const long = `Overall, ${'word '.repeat(50)}ends here.`;
  assert.ok(analyseDraft(padTo(170, long), T1).hints.some((h) => h.code === 'long_sentence'));
});

test('mọi câu dài bằng nhau thì cảnh báo đơn điệu', () => {
  const same = Array.from({ length: 8 }, () => 'The figure for this category rose sharply here.').join(' ');
  const a = analyseDraft(`Overall, it rose.\n\n${same}`, T1);
  assert.ok(a.hints.some((h) => h.code === 'monotonous_sentences'));
});

test('bài tốt thì không có cảnh báo nghiêm trọng nào', () => {
  const good = [
    'The line graph compares the average cost of petrol in three countries.',
    '',
    'Overall, prices in the two nations moved in opposite directions, while the third remained stable.',
    '',
    'In 2000, Country C was the most expensive at 95 cents, roughly twice the figure for Country A. Over the following two decades the cost in Country A climbed consistently, reaching 155 cents.',
    '',
    'Country B showed far less variation. Its price edged up from 60 to 78 cents before easing back to 70. As a result, the two countries exchanged places.',
  ].join('\n');
  const a = analyseDraft(padTo(170, good), T1);
  assert.deepEqual(
    a.hints.filter((h) => h.severity === 'warn').map((h) => h.code),
    [],
  );
});

test('ước lượng band là một khoảng, và bài hỏng thì thấp hơn bài tốt', () => {
  const bad = analyseDraft(padTo(80, 'Sales increased. Sales increased. Sales increased.'), T1);
  const good = analyseDraft(
    padTo(
      170,
      'The graph shows X.\n\nOverall, sales rose sharply while juice declined.\n\nSales climbed from 30 to 125 litres, and juice slipped to 42.\n\nSoft drinks held steady near 110 before easing to 88 by the end.',
    ),
    T1,
  );
  assert.ok(bad.estimate.low < good.estimate.low);
  assert.ok(good.estimate.low <= good.estimate.high);
  assert.ok(bad.estimate.low >= 4);
  assert.ok(good.estimate.high <= 8);
});
