import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ARTICLES, isReadable } from '@/data/articles';
import { getBilingualArticleById } from '@/data/bilingual-repository';
import { getDictationSet } from '@/data/dictation-sets';
import { MATH_LESSONS } from '@/data/lessons/math-lessons';
import { VERBAL_LESSONS } from '@/data/lessons/verbal-lessons';
import { chapterById } from '@/data/sat-roadmap';
import { getTranslationSet } from '@/data/translation-sets';
import { getVocabTopic } from '@/data/vocab-topics';
import { getWritingPromptById } from '@/data/writing-repository';
import { FREE_STAGE_COUNT } from '@/lib/billing/entitlements';
import { MATH_CURRICULUM, getSet } from '@/services/math/curriculum';
import { getSatRwSet } from '@/services/sat-rw/curriculum';
import { CUE_CARDS, PART1_TOPICS } from '@/services/speaking/bank';
import { satQuizLesson } from '@/services/vocab/sat-quiz';
import { rwSetQuestionIds } from '@/services/learning-path/resolvers';

import {
  IELTS_LEVELS,
  SAT_LEVELS,
  allPathNodes,
  defaultExamFor,
  defaultLevelFor,
  targetHref,
  type PathExam,
  type PathLevel,
  type PathTarget,
} from './index';

const LEVELS: readonly PathLevel[] = [...IELTS_LEVELS, ...SAT_LEVELS];

/** Chữ cái chỉ tiếng Việt mới có (dấu thanh, ơ, ư, ă, â, ê, ô, đ). */
const VIETNAMESE = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/iu;

/** Nội dung đích có thật trong kho của app không — trả lý do nếu không. */
function targetProblem(t: PathTarget, exam: PathExam): string | null {
  switch (t.kind) {
    case 'vocab':
      return getVocabTopic(t.slug) ? null : `không có bộ từ ${t.slug}`;
    case 'sat-vocab':
      return satQuizLesson(t.slug) ? null : `không có bài từ vựng SAT ${t.slug}`;
    case 'read': {
      const a = ARTICLES.find((x) => x.slug === t.slug);
      if (!a) return `không có bài đọc ${t.slug}`;
      if (!isReadable(a)) return `bài ${t.slug} chỉ có link ngoài, không đọc trong app được`;
      if (a.exam !== exam) return `bài ${t.slug} thuộc kỳ thi ${a.exam}`;
      return null;
    }
    case 'bilingual':
      return getBilingualArticleById(t.id) ? null : `không có bài song ngữ ${t.id}`;
    case 'dictation':
      return getDictationSet(t.set) ? null : `không có bộ chép chính tả ${t.set}`;
    case 'translate':
      return getTranslationSet(t.set) ? null : `không có bộ dịch ${t.set}`;
    case 'write':
      return getWritingPromptById(t.prompt) ? null : `không có đề Writing ${t.prompt}`;
    case 'speak':
      if (t.part === 'p1') return PART1_TOPICS.some((x) => x.id === t.topic) ? null : `không có chủ đề Part 1 ${t.topic}`;
      return CUE_CARDS.some((x) => x.id === t.topic) ? null : `không có thẻ đề ${t.topic}`;
    case 'math-lesson':
      return MATH_LESSONS.some((l) => l.skill === t.skill) ? null : `không có bài lý thuyết Toán ${t.skill}`;
    case 'math-set':
      return getSet(t.set) ? null : `không có bộ đề Toán ${t.set}`;
    case 'sat-chapter':
      return chapterById(t.id) ? null : `không có chương ${t.id}`;
    case 'rw-lesson':
      return VERBAL_LESSONS.some((l) => l.skill === t.skill) ? null : `không có bài lý thuyết Verbal ${t.skill}`;
    case 'rw-set':
      return getSatRwSet(t.set) ? null : `không có bộ Verbal ${t.set}`;
  }
}

test('mã bài không trùng trong toàn bộ lộ trình, mã Part và mã trình độ cũng vậy', () => {
  const ids = allPathNodes().map((n) => n.id);
  assert.equal(new Set(ids).size, ids.length, 'có mã bài bị trùng');
  const parts = LEVELS.flatMap((l) => l.parts.map((p) => p.id));
  assert.equal(new Set(parts).size, parts.length, 'có mã Part bị trùng');
  assert.equal(new Set(LEVELS.map((l) => l.id)).size, LEVELS.length);
});

test('mỗi kỳ thi có đúng 3 trình độ; mỗi trình độ 5–7 Part, mỗi Part 4–7 bài', () => {
  assert.deepEqual(IELTS_LEVELS.map((l) => l.label), ['4.0–5.0', '5.5–6.5', '7.0+']);
  assert.deepEqual(SAT_LEVELS.map((l) => l.label), ['~1000', '~1200', '1400+']);
  for (const l of LEVELS) {
    assert.ok(l.parts.length >= 5 && l.parts.length <= 7, `${l.id}: ${l.parts.length} Part`);
    for (const p of l.parts) assert.ok(p.nodes.length >= 4 && p.nodes.length <= 7, `${p.id}: ${p.nodes.length} bài`);
  }
});

test('bài nào cũng có tiêu đề và lời giới thiệu đủ hai thứ tiếng, bản tiếng Anh không lẫn tiếng Việt', () => {
  for (const l of LEVELS) {
    for (const bi of [l.title, l.blurb, ...l.parts.flatMap((p) => [p.title, p.blurb])]) {
      assert.ok(bi.vi.trim() && bi.en.trim(), `${l.id}: thiếu một bản dịch`);
      assert.ok(!VIETNAMESE.test(bi.en), `${l.id}: bản tiếng Anh có chữ Việt — "${bi.en}"`);
    }
    for (const n of l.parts.flatMap((p) => p.nodes)) {
      assert.ok(n.title.vi.trim() && n.title.en.trim(), `${n.id}: thiếu tiêu đề`);
      assert.ok(n.desc.vi.trim() && n.desc.en.trim(), `${n.id}: thiếu lời giới thiệu`);
      assert.ok(!VIETNAMESE.test(n.title.en), `${n.id}: tiêu đề tiếng Anh có chữ Việt — "${n.title.en}"`);
      assert.ok(!VIETNAMESE.test(n.desc.en), `${n.id}: lời giới thiệu tiếng Anh có chữ Việt — "${n.desc.en}"`);
      // Lời giới thiệu là 2–3 câu "học gì, vì sao" — không phải một dòng nhãn.
      assert.ok(n.desc.vi.length >= 60 && n.desc.en.length >= 60, `${n.id}: lời giới thiệu quá ngắn`);
      assert.ok(n.minutes >= 5 && n.minutes <= 60, `${n.id}: ${n.minutes} phút`);
    }
  }
});

test('tiêu đề Part không chấm câu ở cuối (không theo kiểu "Mục tiêu band.")', () => {
  for (const p of LEVELS.flatMap((l) => l.parts)) {
    assert.ok(!/[.!]$/.test(p.title.vi) && !/[.!]$/.test(p.title.en), `${p.id}: "${p.title.vi}"`);
  }
});

test('mọi bài trỏ tới nội dung CÓ THẬT trong app — không link gãy', () => {
  for (const l of LEVELS) {
    for (const n of l.parts.flatMap((p) => p.nodes)) {
      const problem = targetProblem(n.target, l.exam);
      assert.equal(problem, null, `${n.id}: ${problem}`);
      assert.ok(targetHref(n.target), `${n.id}: không dựng được đường dẫn`);
    }
  }
});

test('bộ đề Toán chỉ lấy ở chặng miễn phí, bộ Verbal đo được (không phải bộ sinh mới)', () => {
  const freeSets = new Set(MATH_CURRICULUM.slice(0, FREE_STAGE_COUNT).flatMap((s) => s.units.flatMap((u) => u.sets.map((x) => x.id))));
  for (const n of allPathNodes()) {
    if (n.target.kind === 'math-set') assert.ok(freeSets.has(n.target.set), `${n.id}: ${n.target.set} cần gói trả phí`);
    if (n.target.kind === 'rw-set') {
      const ids = rwSetQuestionIds(n.target.set);
      assert.ok(ids && ids.length > 0, `${n.id}: bộ ${n.target.set} không có câu cố định`);
      assert.notEqual(getSatRwSet(n.target.set)?.kind, 'checkpoint', `${n.id}: bộ chốt trùng câu với bộ Học/Luyện`);
    }
  }
});

test('độ khó bám trình độ: bộ dịch easy → medium → hard theo ba mức IELTS', () => {
  const expected = ['easy', 'medium', 'hard'];
  IELTS_LEVELS.forEach((l, i) => {
    for (const n of l.parts.flatMap((p) => p.nodes)) {
      if (n.target.kind !== 'translate') continue;
      assert.equal(getTranslationSet(n.target.set)?.level, expected[i], `${n.id}`);
    }
  });
});

test('đường dẫn Speaking mở đúng chủ đề và phần thi', () => {
  assert.equal(targetHref({ kind: 'speak', part: 'p1', topic: 'p1-home' }), '/speaking?mode=p1&p1=p1-home');
  assert.equal(targetHref({ kind: 'speak', part: 'p3', topic: 'p2-tech' }), '/speaking?mode=p3&cue=p2-tech');
  assert.match(targetHref({ kind: 'read', slug: 'sleep' }) ?? '', /^\/read\/[0-9a-f-]+$/);
});

test('trình độ mặc định lấy từ lộ trình đã khai', () => {
  const base = { minutesPerDay: 60, studyDays: [1, 2, 3], weak: [], startIso: '2026-10-01' };
  assert.equal(defaultLevelFor('ielts', null).id, 'ielts-45');
  assert.equal(defaultLevelFor('ielts', { ...base, ielts: { now: 6, target: 7, examIso: '' }, sat: null }).id, 'ielts-56');
  assert.equal(defaultLevelFor('ielts', { ...base, ielts: { now: 7, target: 8, examIso: '' }, sat: null }).id, 'ielts-7');
  // Không biết điểm hiện tại: mục tiêu trừ một bậc.
  assert.equal(defaultLevelFor('ielts', { ...base, ielts: { now: null, target: 6.5, examIso: '' }, sat: null }).id, 'ielts-56');
  assert.equal(defaultLevelFor('sat', { ...base, ielts: null, sat: { now: 1000, target: 1300, examIso: '' } }).id, 'sat-1000');
  assert.equal(defaultLevelFor('sat', { ...base, ielts: null, sat: { now: 1200, target: 1400, examIso: '' } }).id, 'sat-1200');
  assert.equal(defaultLevelFor('sat', { ...base, ielts: null, sat: { now: null, target: 1500, examIso: '' } }).id, 'sat-1400');
  assert.equal(defaultExamFor({ ...base, ielts: null, sat: { now: null, target: 1500, examIso: '' } }), 'sat');
  assert.equal(defaultExamFor(null), 'ielts');
});
