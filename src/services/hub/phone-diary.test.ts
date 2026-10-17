import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ROLEPLAYS, roleplayById } from './roleplay';
import { DIARY_PROMPTS, TUTORS, tutorById } from './tutors';

test('gọi điện: có ít nhất bốn kịch bản, id không trùng, mỗi lượt đúng một lựa chọn tốt', () => {
  const phone = ROLEPLAYS.filter((r) => r.id.startsWith('rp-phone-'));
  assert.ok(phone.length >= 4, `chỉ có ${phone.length} kịch bản gọi điện`);
  assert.equal(new Set(ROLEPLAYS.map((r) => r.id)).size, ROLEPLAYS.length, 'có id kịch bản trùng');
  for (const r of phone) {
    assert.equal(r.steps.length, 3, `${r.id}: phải đúng 3 lượt`);
    for (const step of r.steps) {
      assert.equal(step.options.length, 3, `${r.id}: lượt phải có 3 lựa chọn`);
      assert.equal(step.options.filter((o) => o.good).length, 1, `${r.id}: ${step.ai}`);
      for (const o of step.options) assert.ok(o.tip.trim().length > 3, `${r.id}: thiếu lời giải thích`);
    }
    assert.equal(roleplayById(r.id)?.id, r.id);
  }
});

test('gia sư gọi điện và nhật ký: đang chạy, có vai và câu mở đầu', () => {
  for (const id of ['phone', 'diary']) {
    const t = tutorById(id);
    assert.ok(t, `thiếu gia sư ${id}`);
    assert.equal(t!.status, 'live');
    assert.ok(t!.persona && t!.persona.length > 40, id);
    assert.ok(t!.opening && t!.opening.length > 20, id);
  }
  assert.equal(new Set(TUTORS.map((t) => t.id)).size, TUTORS.length);
});

test('nhật ký: đủ câu gợi ý, không trùng, câu mở đầu dùng câu gợi ý đầu tiên', () => {
  assert.ok(DIARY_PROMPTS.length >= 6, `chỉ có ${DIARY_PROMPTS.length} câu gợi ý`);
  assert.equal(new Set(DIARY_PROMPTS).size, DIARY_PROMPTS.length, 'có câu gợi ý trùng');
  for (const p of DIARY_PROMPTS) assert.ok(/[.?]$/.test(p) && p.length > 15, p);
  assert.ok(tutorById('diary')!.opening!.includes(DIARY_PROMPTS[0]!));
});
