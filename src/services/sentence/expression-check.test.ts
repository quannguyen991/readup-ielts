import assert from 'node:assert/strict';
import { test } from 'node:test';

import { checkExpression, hintFor, markText, maskSentence, type ExpressTarget } from './expression-check';

const T: ExpressTarget = {
  id: 't1',
  en: 'I have lived in this city since 2018.',
  vi: 'Tôi sống ở thành phố này từ năm 2018.',
};
const BREAKFAST: ExpressTarget = {
  id: 't2',
  en: 'She studies English every morning before breakfast.',
  vi: 'Cô ấy học tiếng Anh mỗi sáng trước bữa sáng.',
};

test('trùng câu mẫu thì qua ngay', () => {
  const r = checkExpression(T, 'I have lived in this city since 2018.');
  assert.equal(r.verdict, 'pass');
  assert.equal(r.passed, true);
});

test('câu rỗng và câu quá ngắn chưa qua', () => {
  assert.equal(checkExpression(T, '').verdict, 'empty');
  const short = checkExpression(BREAKFAST, 'She studies.');
  assert.equal(short.passed, false);
  assert.equal(short.verdict, 'short');
});

test('có lỗi ngữ pháp thì vào bước "fix" và chỉ ra lỗi cụ thể', () => {
  const r = checkExpression(BREAKFAST, 'She study English every morning before breakfast.');
  assert.equal(r.verdict, 'fix');
  assert.ok(r.issues.some((i) => i.found === 'study'));
  assert.equal(r.passed, false);
});

test('đúng ngữ pháp nhưng thiếu ý thì báo ý thiếu', () => {
  const r = checkExpression(BREAKFAST, 'She likes learning every day today.');
  assert.equal(r.verdict, 'meaning');
  assert.ok(r.missing.length > 0);
  assert.ok(r.coverage < 0.55);
});

test('diễn đạt khác chữ nhưng đủ ý và đúng cấu trúc thì qua (từ đồng nghĩa trong bảng)', () => {
  const r = checkExpression(
    { id: 't3', en: 'It is important to sleep well before an exam.', vi: 'Ngủ đủ giấc trước kỳ thi là quan trọng.', structureIds: ['it-extraposition'] },
    'It is essential to sleep well before an exam.',
  );
  assert.equal(r.verdict, 'pass', JSON.stringify(r));
});

test('sai cấu trúc đích thì dừng ở bước "structure" dù đúng ý', () => {
  const target: ExpressTarget = { id: 't4', en: 'The bridge was built in 1998.', vi: 'Cây cầu được xây vào năm 1998.', structureIds: ['passive'] };
  const r = checkExpression(target, 'Workers built the bridge in 1998.');
  assert.equal(r.structureOk, false);
  assert.equal(r.verdict, 'structure');
  const ok = checkExpression(target, 'The bridge was constructed in 1998.');
  assert.equal(ok.passed, true, JSON.stringify(ok));
});

test('gợi ý tăng dần: hướng đi, khuôn, khung che từ, đáp án', () => {
  const h1 = hintFor(BREAKFAST, 1, null);
  const h2 = hintFor(BREAKFAST, 2, null);
  const h3 = hintFor(BREAKFAST, 3, null);
  const h4 = hintFor(BREAKFAST, 4, null);
  assert.equal(h1.level, 1);
  assert.ok(h2.body.length > 10);
  assert.match(h3.body, /_/);
  assert.ok(!h3.body.includes('breakfast'));
  assert.equal(h4.body, BREAKFAST.en);
});

test('maskSentence giữ từ chức năng, che từ nội dung', () => {
  const m = maskSentence('She studies English every morning.');
  assert.match(m, /^She s_+ E_+ every m_+\.$/);
});

test('markText tô lỗi đúng chỗ', () => {
  const text = 'I goed home.';
  const issues = checkExpression(BREAKFAST, text).issues;
  const segs = markText(text, issues);
  assert.equal(segs.map((s) => s.text).join(''), text);
  assert.ok(segs.some((s) => s.issue && s.text === 'goed'));
});

test('số đếm là ý chính: six khác seven, và wakes/wake cùng gốc', () => {
  const t: ExpressTarget = { id: 't5', en: 'I wake up at six every morning.', vi: 'Tôi dậy lúc sáu giờ mỗi sáng.' };
  const same = checkExpression(t, 'I wake up at six every morning.');
  assert.equal(same.passed, true);
  const typo = checkExpression(t, 'I wakes up at six every mornin.');
  assert.ok(typo.coverage >= 0.5, String(typo.coverage));
  const wrongNumber = checkExpression(t, 'I wake up at seven every morning.');
  assert.ok(wrongNumber.missing.some((m) => m.word === 'six'));
});

test('cụm tương đương ("get up" thay "wake up") được tính là đủ ý', () => {
  const t: ExpressTarget = { id: 't6', en: 'I wake up at six every morning.', vi: 'Tôi dậy lúc sáu giờ mỗi sáng.' };
  const r = checkExpression(t, 'I get up at six every morning.');
  assert.equal(r.coverage, 1, JSON.stringify(r.missing));
  assert.equal(r.passed, true, r.summaryVi);
});

test('đề ở quá khứ mà viết hiện tại (wake thay woke) bị báo lỗi thì', () => {
  const t: ExpressTarget = { id: 't7', en: 'Last Monday morning, I woke up with a heavy head.', vi: 'Sáng thứ Hai tuần trước, tôi tỉnh dậy với cái đầu nặng trịch.' };
  const r = checkExpression(t, 'Last Monday morning I wake up with a heavy head.');
  assert.equal(r.passed, false);
  assert.ok(r.issues.some((i) => i.id === 'tense-mismatch'));
  assert.equal(checkExpression(t, 'Last Monday morning I woke up with a heavy head.').passed, true);
});
