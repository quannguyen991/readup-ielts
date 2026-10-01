import test from 'node:test';
import assert from 'node:assert/strict';

import { MATH_LESSONS } from './lessons/math-lessons';
import { VERBAL_LESSONS } from './lessons/verbal-lessons';
import { SAT_DOMAINS, SAT_SECTIONS, SAT_STRATEGY } from './sat-knowledge';

test('cấu trúc Digital SAT: 54 câu Đọc & Viết trong 64 phút, 44 câu Toán trong 70 phút', () => {
  const rw = SAT_SECTIONS.find((s) => s.id === 'rw')!;
  const math = SAT_SECTIONS.find((s) => s.id === 'math')!;
  assert.equal(rw.modules * rw.perModule, 54);
  assert.equal(rw.modules * rw.minutesPerModule, 64);
  assert.equal(math.modules * math.perModule, 44);
  assert.equal(math.modules * math.minutesPerModule, 70);
});

test('tỉ trọng các mảng mỗi phần cộng lại 100%', () => {
  for (const sec of ['rw', 'math'] as const) {
    const sum = SAT_DOMAINS.filter((d) => d.section === sec).reduce((a, d) => a + d.share, 0);
    assert.equal(sum, 100, sec);
  }
});

test('mọi đường dẫn bài học trỏ tới bài có thật', () => {
  const math = new Set(MATH_LESSONS.map((l) => l.skill));
  const verbal = new Set(VERBAL_LESSONS.map((l) => l.skill));
  for (const d of SAT_DOMAINS)
    for (const l of d.lessons) {
      const [, kind, , skill] = l.href.split('/');
      assert.ok(kind === 'math' ? math.has(skill!) : verbal.has(skill!), `${d.id}: ${l.href}`);
    }
});

test('bản tiếng Anh: đủ dòng như bản Việt, không sót chữ tiếng Việt, công thức giữ nguyên số dòng', () => {
  const vi = /[ăâđêôơưàáạảãèéẹẻẽìíịỉĩòóọỏõùúụủũỳýỵỷỹ]/i;
  for (const d of SAT_DOMAINS) {
    assert.equal(d.coreEn.length, d.core.length, `${d.id} core`);
    assert.equal(d.trapsEn.length, d.traps.length, `${d.id} traps`);
    assert.equal(d.formulasEn?.length, d.formulas?.length, `${d.id} formulas`);
    for (const t of [...d.coreEn, ...d.trapsEn, ...(d.formulasEn ?? []), ...d.lessons.map((l) => l.labelEn)])
      assert.ok(!vi.test(t), `${d.id}: "${t}"`);
  }
  for (const s of SAT_STRATEGY) assert.ok(!vi.test(s.tEn) && !vi.test(s.dEn), s.tEn);
});
