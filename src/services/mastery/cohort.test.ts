import test from 'node:test';
import assert from 'node:assert/strict';

import { buildExport, parseExport, summariseCohort, worthTeaching, type LearnerExport } from './cohort';
import type { Ledger, SkillRecord, SkillStatus } from './types';

/**
 * Canh phần gộp lớp.
 *
 * Ba tính chất, và cả ba đều là chuyện đúng/sai của một quyết định dạy học chứ
 * không phải chuyện kỹ thuật:
 *
 *   · gửi lại bản mới KHÔNG được làm sĩ số lớp phồng lên;
 *   · xếp theo SỐ người mắc, không theo tỉ lệ — 100% của hai em không phải một
 *     tiết dạy;
 *   · bản xuất KHÔNG mang theo dấu vết người ấy đã làm bài nào.
 */

function rec(over: Partial<SkillRecord> = {}): SkillRecord {
  return {
    skill: { domain: 'reading', key: 'locate' },
    status: 'needs-probe' as SkillStatus,
    lastState: 'misaligned-wrong',
    lastSourceId: 'article-77',
    observations: 3,
    transfers: 0,
    updatedAt: '2026-09-05T10:00:00.000Z',
    ...over,
  };
}

function ledgerOf(...records: SkillRecord[]): Ledger {
  const out: Ledger = {};
  for (const r of records) out[`${r.skill.domain}:${r.skill.key}`] = r;
  return out;
}

function exp(code: string, at: string, ledger: Ledger): LearnerExport {
  return { learnerCode: code, exportedAt: at, ledger };
}

// ------------------------------------------------------------------- gộp lớp

test('gộp đúng số người học theo từng kỹ năng', () => {
  const s = summariseCohort([
    exp('a', '2026-09-05T10:00:00Z', ledgerOf(rec())),
    exp('b', '2026-09-05T10:00:00Z', ledgerOf(rec({ status: 'confirmed' }))),
    exp('c', '2026-09-05T10:00:00Z', ledgerOf(rec({ status: 'probing' }))),
  ]);
  assert.equal(s.length, 1);
  assert.equal(s[0]?.learners, 3);
  assert.equal(s[0]?.counts['needs-probe'], 1);
  assert.equal(s[0]?.counts.confirmed, 1);
  assert.equal(s[0]?.counts.probing, 1);
});

test('cùng một mã gửi hai lần thì chỉ tính bản mới nhất', () => {
  /*
    Người học làm thêm rồi gửi lại là chuyện thường. Cộng dồn cả hai sẽ thổi
    phồng sĩ số ở đúng những kỹ năng chăm chỉ nhất — tức là bóp méo đúng chỗ
    giáo viên đang nhìn để quyết định.
  */
  const s = summariseCohort([
    exp('a', '2026-09-01T10:00:00Z', ledgerOf(rec({ status: 'needs-probe' }))),
    exp('a', '2026-09-05T10:00:00Z', ledgerOf(rec({ status: 'confirmed' }))),
  ]);
  assert.equal(s[0]?.learners, 1, 'một người vẫn phải là một người');
  assert.equal(s[0]?.counts.confirmed, 1, 'phải lấy bản mới nhất');
  assert.equal(s[0]?.counts['needs-probe'], 0);
});

test('cộng tổng số lượt quan sát của cả lớp', () => {
  const s = summariseCohort([
    exp('a', '2026-09-05T10:00:00Z', ledgerOf(rec({ observations: 4 }))),
    exp('b', '2026-09-05T10:00:00Z', ledgerOf(rec({ observations: 6 }))),
  ]);
  assert.equal(s[0]?.observations, 10);
});

test('tính tỉ lệ đang mắc', () => {
  const s = summariseCohort([
    exp('a', '2026-09-05T10:00:00Z', ledgerOf(rec({ status: 'needs-probe' }))),
    exp('b', '2026-09-05T10:00:00Z', ledgerOf(rec({ status: 'probing' }))),
    exp('c', '2026-09-05T10:00:00Z', ledgerOf(rec({ status: 'confirmed' }))),
    exp('d', '2026-09-05T10:00:00Z', ledgerOf(rec({ status: 'confirmed' }))),
  ]);
  assert.equal(s[0]?.stuckRatio, 0.5);
});

test('xếp theo SỐ người mắc, không theo tỉ lệ', () => {
  /*
    Kỹ năng B có 2/2 người mắc (100%) nhưng chỉ hai em; kỹ năng A có 5/20 (25%)
    nhưng là năm em. Một tiết dạy chung đáng dành cho A.
  */
  const A = { domain: 'reading' as const, key: 'entailment' };
  const B = { domain: 'reading' as const, key: 'quantifier' };

  const exports: LearnerExport[] = [];
  for (let i = 0; i < 5; i += 1) {
    exports.push(exp(`a${i}`, '2026-09-05T10:00:00Z', ledgerOf(rec({ skill: A, status: 'needs-probe' }))));
  }
  for (let i = 0; i < 15; i += 1) {
    exports.push(exp(`c${i}`, '2026-09-05T10:00:00Z', ledgerOf(rec({ skill: A, status: 'confirmed' }))));
  }
  for (let i = 0; i < 2; i += 1) {
    exports.push(exp(`b${i}`, '2026-09-05T10:00:00Z', ledgerOf(rec({ skill: B, status: 'needs-probe' }))));
  }

  const s = summariseCohort(exports);
  assert.equal(s[0]?.key, 'entailment', 'kỹ năng 5 em mắc phải đứng trước kỹ năng 2 em mắc');
  assert.equal(s[1]?.key, 'quantifier');
  assert.equal(s[1]?.stuckRatio, 1, 'tỉ lệ vẫn được tính, chỉ không dùng để xếp');
});

test('danh sách rỗng không ném lỗi', () => {
  assert.deepEqual(summariseCohort([]), []);
});

test('lọc được kỹ năng đủ đông người mắc để dạy chung', () => {
  const A = { domain: 'reading' as const, key: 'entailment' };
  const B = { domain: 'reading' as const, key: 'quantifier' };
  const exports = [
    ...Array.from({ length: 4 }, (_, i) =>
      exp(`a${i}`, '2026-09-05T10:00:00Z', ledgerOf(rec({ skill: A }))),
    ),
    exp('b0', '2026-09-05T10:00:00Z', ledgerOf(rec({ skill: B }))),
  ];
  const got = worthTeaching(summariseCohort(exports), 3);
  assert.deepEqual(got.map((s) => s.key), ['entailment']);
});

// ------------------------------------------------------------- xuất và đọc

test('bản xuất KHÔNG mang theo dấu vết đã làm bài nào', () => {
  // `lastSourceId` là id bài đọc — dấu vết người ấy làm gì, không cần cho lớp.
  const out = buildExport(ledgerOf(rec({ lastSourceId: 'article-77' })), 'HS-01');
  assert.equal(out.ledger['reading:locate']?.lastSourceId, null);
});

test('bản xuất giữ nguyên phần cần cho việc gộp lớp', () => {
  const out = buildExport(ledgerOf(rec({ status: 'probing', observations: 5, transfers: 1 })), 'HS-01');
  const r = out.ledger['reading:locate'];
  assert.equal(r?.status, 'probing');
  assert.equal(r?.observations, 5);
  assert.equal(r?.transfers, 1);
});

test('mã người học được cắt khoảng trắng thừa', () => {
  assert.equal(buildExport({}, '  HS-01  ').learnerCode, 'HS-01');
});

test('đọc được bản xuất hợp lệ', () => {
  const out = buildExport(ledgerOf(rec()), 'HS-02');
  const got = parseExport(JSON.parse(JSON.stringify(out)));
  assert.ok(!('rejected' in got));
  assert.equal((got as LearnerExport).learnerCode, 'HS-02');
});

test('từ chối file sai hình dạng thay vì đoán', () => {
  for (const bad of [null, 'chuỗi', 42, {}, { learnerCode: '' }, { learnerCode: 'a' }]) {
    assert.ok('rejected' in parseExport(bad), `phải từ chối: ${JSON.stringify(bad)}`);
  }
});
