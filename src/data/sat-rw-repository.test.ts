import test from 'node:test';
import assert from 'node:assert/strict';

import {
  SAT_RW_DOMAINS,
  SAT_RW_QUESTIONS,
  SAT_RW_SKILL_LABEL,
  SAT_RW_UNITS,
  getSatRwUnit,
  questionsForUnit,
  satRwStats,
  unitsByDomain,
} from './sat-rw-repository';

test('kho có đủ 16 unit và 384 + 240 câu, id không trùng', () => {
  assert.equal(SAT_RW_UNITS.length, 16);
  assert.equal(SAT_RW_QUESTIONS.length, 624);
  assert.equal(new Set(SAT_RW_QUESTIONS.map((q) => q.id)).size, 624, 'có id bị trùng');
  assert.equal(new Set(SAT_RW_QUESTIONS.map((q) => q.passage)).size >= 600, true, 'đoạn văn trùng nhiều bất thường');
});

test('mỗi unit khai đúng số câu thật sự có trong kho', () => {
  for (const unit of SAT_RW_UNITS) {
    assert.equal(
      questionsForUnit(unit.unit).length,
      unit.count,
      `unit ${unit.unit} khai ${unit.count} câu nhưng kho có khác`,
    );
  }
});

test('mọi câu đều có đúng 4 phương án phân biệt', () => {
  for (const q of SAT_RW_QUESTIONS) {
    assert.equal(q.options.length, 4, `${q.id} không có 4 phương án`);
    assert.equal(new Set(q.options).size, 4, `${q.id} có phương án trùng nhau`);
    for (const option of q.options) {
      assert.ok(option.trim(), `${q.id} có phương án rỗng`);
    }
  }
});

test('đáp án luôn trỏ vào một phương án có thật', () => {
  for (const q of SAT_RW_QUESTIONS) {
    assert.ok(
      q.answerIndex >= 0 && q.answerIndex < q.options.length,
      `${q.id} có đáp án ngoài khoảng`,
    );
  }
});

/**
 * Đáp án phải rải đều bốn vị trí.
 *
 * Đây không phải chuyện thẩm mỹ: người soạn đề có thói quen đặt đáp án đúng ở
 * vị trí thứ hai, và một bộ đề lệch như vậy dạy người học đoán theo vị trí thay
 * vì đọc bài. Cho phép lệch tối đa 1,5 lần mức đều.
 */
test('đáp án rải đều bốn vị trí, không dồn vào một chỗ', () => {
  const counts = [0, 0, 0, 0];
  for (const q of SAT_RW_QUESTIONS) counts[q.answerIndex] = (counts[q.answerIndex] ?? 0) + 1;
  const even = SAT_RW_QUESTIONS.length / 4;
  counts.forEach((n, i) => {
    assert.ok(
      n >= even * 0.5 && n <= even * 1.5,
      `vị trí ${'ABCD'[i]} có ${n} đáp án, lệch quá xa mức đều ${even}`,
    );
  });
});

test('không còn thẻ HTML hay thực thể lọt vào đề và lời giải', () => {
  for (const q of SAT_RW_QUESTIONS) {
    for (const [field, text] of [
      ['passage', q.passage],
      ['stem', q.stem],
      ['solutionVi', q.solutionVi],
    ] as const) {
      assert.ok(!/<[a-z/]/i.test(text), `${q.id} còn thẻ HTML ở ${field}`);
      assert.ok(!/&[a-z]+;/i.test(text), `${q.id} còn thực thể HTML ở ${field}`);
    }
  }
});

test('mọi câu đều có lời giải bằng tiếng Việt', () => {
  for (const q of SAT_RW_QUESTIONS) {
    assert.ok(q.solutionVi.trim(), `${q.id} không có lời giải`);
    assert.ok(
      /[àáâãèéêìíòóôõùúýăđĩũơưạ-ỹ]/i.test(q.solutionVi),
      `${q.id} có lời giải nhưng không phải tiếng Việt`,
    );
  }
});

test('phủ đủ bốn mảng của đề thật, không mảng nào trống', () => {
  const stats = satRwStats();
  for (const domain of SAT_RW_DOMAINS) {
    assert.ok(
      (stats.byDomain[domain.key] ?? 0) > 0,
      `mảng "${domain.key}" không có câu nào`,
    );
    assert.ok(unitsByDomain(domain.key).length > 0, `mảng "${domain.key}" không có unit nào`);
  }
});

/**
 * Ba dạng mà bộ sinh đề tự động của app KHÔNG làm được phải có mặt ở đây —
 * đó chính là lý do kho này được nhập vào.
 */
test('có đủ ba dạng mà bộ sinh đề tự động không làm được', () => {
  for (const skill of ['crosstext', 'evidence', 'structure']) {
    assert.ok(
      SAT_RW_QUESTIONS.some((q) => q.skill === skill),
      `thiếu hẳn dạng "${skill}"`,
    );
  }
});

test('mọi kỹ năng xuất hiện trong kho đều có nhãn tiếng Việt', () => {
  for (const q of SAT_RW_QUESTIONS) {
    assert.ok(SAT_RW_SKILL_LABEL[q.skill], `kỹ năng "${q.skill}" chưa có nhãn`);
  }
});

test('tra unit theo số trả về đúng unit, số lạ trả về undefined', () => {
  assert.equal(getSatRwUnit(1)?.unit, 1);
  assert.equal(getSatRwUnit(999), undefined);
});

test('câu từ nối: không phương án nhiễu nào cùng nhóm quan hệ với đáp án (thế vào vẫn đúng)', () => {
  // Bộ sinh gốc từng bốc ngẫu nhiên trong "họ" từ nối, ra câu hai đáp án (sửa 26/09/2026).
  const GROUP: Record<string, string> = {
    'By contrast': 'contrast', However: 'contrast', Nevertheless: 'contrast', 'Even so': 'contrast', Still: 'contrast', Nonetheless: 'contrast',
    'As a result': 'result', Consequently: 'result', Therefore: 'result', Thus: 'result', Hence: 'result', Accordingly: 'result',
    'For example': 'example', 'For instance': 'example',
    'That is': 'restate', 'In other words': 'restate',
    'In addition': 'add', Moreover: 'add', Furthermore: 'add', Additionally: 'add', Likewise: 'add', Similarly: 'add',
  };
  for (const q of SAT_RW_QUESTIONS.filter((x) => x.skill === 'transition')) {
    const key = GROUP[q.options[q.answerIndex]!];
    if (!key) continue;
    q.options.forEach((o, i) => {
      if (i !== q.answerIndex) assert.notEqual(GROUP[o], key, `${q.id}: "${o}" cùng nhóm với đáp án "${q.options[q.answerIndex]}"`);
    });
  }
});
