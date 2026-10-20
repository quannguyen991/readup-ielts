import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildExamParts, canonicalSourceTestId, compareSourceTests, hasCompleteKey } from './source-catalog';

test('saved legacy test links resolve to the correct skill paper', () => {
  assert.equal(canonicalSourceTestId('cambridge-18-test-2'), 'cambridge-18-reading-2');
  assert.equal(canonicalSourceTestId('cambridge-19-writing-test-1'), 'cambridge-19-writing-1');
  assert.equal(canonicalSourceTestId('vol-10-reading-test-3'), 'vol-10-reading-3');
  assert.equal(canonicalSourceTestId('vol-10-key-reading-3'), 'vol-10-reading-3');
});

test('catalogue sorts Cambridge 21 downward and numeric Vol 10 before Vol 8', () => {
  const source = ['Actual Test Vol 8', 'Cambridge IELTS 9', 'VOL 10 KEY', 'Cambridge IELTS 20', 'Cambridge IELTS 21'];
  assert.deepEqual(source.map((source) => ({ id: source, source })).sort(compareSourceTests).map((t) => t.source),
    ['Cambridge IELTS 21', 'Cambridge IELTS 20', 'Cambridge IELTS 9', 'VOL 10 KEY', 'Actual Test Vol 8']);
});

test('Reading follows headings on shared pages and retains actual question boundaries', () => {
  const parts = buildExamParts([
    { page: 1, text: 'READING PASSAGE 1\nYou should spend 20 minutes on Questions 1–14.\nFirst passage.' },
    { page: 2, text: 'Last questions from Passage 1.\nREADING PASSAGE 2\nQuestions 15–26\nSecond passage.' },
    { page: 3, text: 'More of passage 2.' },
    { page: 4, text: 'READING PASSAGE 3\nQuestions 27–40\nThird passage.' },
  ], 'Reading');
  assert.deepEqual(parts.map((p) => [p.questionStart, p.questionEnd]), [[1, 14], [15, 26], [27, 40]]);
  assert.match(parts[0]!.pages[1]!.text, /Last questions/);
  assert.doesNotMatch(parts[0]!.pages[1]!.text, /Second passage/);
  assert.match(parts[1]!.pages[0]!.text, /^READING PASSAGE 2/);
  assert.equal(parts[1]!.pages.length, 2);
});

test('Listening headings survive flattened PDF text; all four parts have 10 answers', () => {
  const parts = buildExamParts([{ page: 1, text: 'LISTENING PART 1 Questions 1-10 Content. PART 2 Questions 11-20 Content. PART 3 Questions 21-30 Content. PART 4 Questions 31-40 Content.' }], 'Listening');
  assert.deepEqual(parts.map((p) => [p.questionStart, p.questionEnd]), [[1, 10], [11, 20], [21, 30], [31, 40]]);
});

test('OCR ranges with a lost dash retain questions 1–40', () => {
  const parts = buildExamParts([{ page: 1, text: 'READINGPASSAGE1\nQuestions113\nREADINGPASSAGE2\nQuestions1426\nREADINGPASSAGE3\nQuestions2740' }], 'Reading');
  assert.deepEqual(parts.map((p) => [p.questionStart, p.questionEnd]), [[1, 13], [14, 26], [27, 40]]);
});

test('Writing splits two tasks on one page and uses the correct word minima', () => {
  const parts = buildExamParts([{ page: 1, text: 'WRITING TASK 1\nDescribe a chart.\nWRITING TASK 2\nDiscuss an opinion.' }], 'Writing');
  assert.deepEqual(parts.map((p) => [p.questionStart, p.questionEnd, p.minimumWords]), [[1, 1, 150], [2, 2, 250]]);
  assert.doesNotMatch(parts[0]!.pages[0]!.text, /Discuss/);
});

test('an empty or partial key cannot become a verified 40-question score', () => {
  const base = { id: 'test', title: 'Test', source: 'Local source', section: 'Reading' as const, pages: [], supportPages: [], answerKeyVerified: true };
  assert.equal(hasCompleteKey({ ...base, answerKey: {} }), false);
  assert.equal(hasCompleteKey({ ...base, answerKey: { '1': 'A' } }), false);
  assert.equal(hasCompleteKey({ ...base, answerKey: Object.fromEntries(Array.from({ length: 40 }, (_, i) => [String(i + 1), 'A'])) }), true);
  assert.equal(hasCompleteKey({ ...base, section: 'Writing', answerKey: { '1': 'A', '2': 'B' } }), false);
});
