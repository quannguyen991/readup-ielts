import assert from 'node:assert/strict';
import { test } from 'node:test';

import { isSortedByDifficulty } from '@/lib/difficulty';
import { rwSetTier, rwSkillSets } from '@/services/sat-rw/skill-sets';
import { SAT_RW_MIXED_SETS } from '@/services/sat-rw/mixed-sets';
import {
  SAT_RW_HARD_QUESTIONS,
  SAT_RW_QUESTIONS,
  SAT_RW_UNITS,
  questionsForSkill,
  questionsForUnit,
  rwDifficulty,
} from './sat-rw-repository';

/**
 * Bậc dễ / vừa / khó của SAT Verbal và bộ câu khó soạn tay (01/10/2026).
 *
 * Câu khó viết tay nên không có luật máy nào tính được đáp án; thứ test giữ
 * được là HÌNH DẠNG: mỗi phương án sai phải nói được vì sao sai, đáp án rải đều,
 * câu điền chỗ trống có đúng một chỗ trống, bảng số là số thật… và mỗi kỹ năng
 * phải có đủ ba bậc, bộ đề phải xếp dễ → khó.
 */

const SKILLS = [...new Set(SAT_RW_QUESTIONS.map((q) => q.skill))];

test('mọi câu trong kho đều có bậc độ khó', () => {
  for (const q of SAT_RW_QUESTIONS) assert.ok(q.difficulty, `${q.id} thiếu bậc`);
});

test('mỗi kỹ năng có câu ở cả ba bậc', () => {
  for (const skill of SKILLS) {
    for (const tier of ['easy', 'medium', 'hard'] as const) {
      assert.ok(
        SAT_RW_QUESTIONS.some((q) => q.skill === skill && q.difficulty === tier),
        `${skill} không có câu bậc ${tier}`,
      );
    }
  }
});

test('mỗi kỹ năng thêm ít nhất 30% câu khó so với kho cũ', () => {
  for (const skill of SKILLS) {
    const old = SAT_RW_QUESTIONS.filter((q) => q.skill === skill && q.difficulty !== 'hard').length;
    const hard = SAT_RW_QUESTIONS.filter((q) => q.skill === skill && q.difficulty === 'hard').length;
    assert.ok(hard >= Math.ceil(old * 0.3), `${skill}: ${hard} câu khó cho ${old} câu cũ`);
  }
});

test('câu khó: bốn phương án khác nhau, mỗi phương án sai có lý do, đáp án không có', () => {
  assert.equal(SAT_RW_HARD_QUESTIONS.length, 210);
  for (const q of SAT_RW_HARD_QUESTIONS) {
    assert.equal(q.difficulty, 'hard');
    assert.equal(q.options.length, 4, q.id);
    assert.equal(new Set(q.options).size, 4, `${q.id}: phương án trùng`);
    assert.ok(q.whyWrong && q.whyWrong.length === 4, `${q.id}: thiếu whyWrong`);
    q.whyWrong!.forEach((w, i) => {
      if (i === q.answerIndex) assert.equal(w, '', `${q.id}: đáp án đúng mà có lý do sai`);
      else assert.ok(w.trim().length > 5, `${q.id}: phương án ${'ABCD'[i]} không có lý do sai`);
    });
    // Lời giải ghép đủ: lý do cho từng phương án sai và phần nghĩa.
    for (let i = 0; i < 4; i += 1) {
      if (i !== q.answerIndex) assert.ok(q.solutionVi.includes(`${'ABCD'[i]} sai:`), `${q.id}: lời giải thiếu ${'ABCD'[i]}`);
    }
    assert.ok(q.solutionVi.includes('Nghĩa:'), `${q.id}: thiếu phần nghĩa`);
  }
});

test('câu khó: đáp án rải đều bốn vị trí trong từng bài', () => {
  for (const unit of SAT_RW_UNITS) {
    const qs = SAT_RW_HARD_QUESTIONS.filter((q) => q.unit === unit.unit);
    if (qs.length === 0) continue;
    const counts = [0, 0, 0, 0];
    for (const q of qs) counts[q.answerIndex]! += 1;
    assert.ok(Math.max(...counts) - Math.min(...counts) <= 1, `unit ${unit.unit}: ${counts.join('/')}`);
  }
});

test('câu khó: dạng điền có đúng một chỗ trống, câu gạch chân có chuỗi gạch chân thật, bảng là số', () => {
  for (const q of SAT_RW_HARD_QUESTIONS) {
    const blanks = (q.passage.match(/_{4,}/g) ?? []).length;
    if (q.unit <= 10) assert.equal(blanks, 1, `${q.id}: ${blanks} chỗ trống`);
    else assert.ok(blanks <= 1, `${q.id}: ${blanks} chỗ trống`);
    if (q.underline) assert.ok(q.passage.includes(q.underline), `${q.id}: chuỗi gạch chân không có trong đoạn`);
    if (q.skill === 'crosstext') assert.ok(/Văn bản 1/u.test(q.passage) && /Văn bản 2/u.test(q.passage), `${q.id}: thiếu hai văn bản`);
    if (q.table) {
      assert.ok(q.table.rows.length >= 2, `${q.id}: bảng quá ít hàng`);
      for (const row of q.table.rows) {
        assert.equal(row.values.length, q.table.columns.length, `${q.id}: hàng ${row.entity} lệch số cột`);
        for (const v of row.values) assert.ok(Number.isFinite(v), `${q.id}: ô không phải số`);
      }
    }
  }
  assert.ok(SAT_RW_HARD_QUESTIONS.filter((q) => q.table).length >= 5, 'cần ít nhất 5 câu bằng chứng có bảng số');
});

test('câu của một bài và của một kỹ năng xếp dễ → vừa → khó', () => {
  for (const unit of SAT_RW_UNITS) assert.ok(isSortedByDifficulty(questionsForUnit(unit.unit), rwDifficulty), `unit ${unit.unit}`);
  for (const skill of SKILLS) assert.ok(isSortedByDifficulty(questionsForSkill(skill), rwDifficulty), skill);
});

test('bộ đề theo kỹ năng: bộ đầu Dễ, bộ cuối Khó, nhãn không đi lùi', () => {
  const rank = { easy: 0, medium: 1, hard: 2 } as const;
  for (const skill of SKILLS) {
    const tiers = rwSkillSets(skill).map(rwSetTier);
    assert.equal(tiers[0], 'easy', `${skill}: bộ đầu ${tiers[0]}`);
    assert.equal(tiers[tiers.length - 1], 'hard', `${skill}: bộ cuối ${tiers[tiers.length - 1]}`);
    for (let i = 1; i < tiers.length; i += 1) assert.ok(rank[tiers[i]!] >= rank[tiers[i - 1]!], `${skill}: ${tiers.join(' → ')}`);
  }
});

test('đề trộn xếp dễ → khó trong từng đề', () => {
  for (const set of SAT_RW_MIXED_SETS) assert.ok(isSortedByDifficulty(set.questions, rwDifficulty), set.id);
});
