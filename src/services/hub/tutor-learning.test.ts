import test from 'node:test';
import assert from 'node:assert/strict';

import { HOME_TUTOR_IDS, TUTORS, homeTutors, tutorRoute, type Tutor } from './tutors';
import { tutorCopy } from './tutors-en';

const LIVE = TUTORS.filter((t) => t.status === 'live');

test('gia sư đang live: có mức, 2–3 kỹ năng và 2–3 bài tập mẫu, không rỗng', () => {
  assert.ok(LIVE.length > 0);
  for (const t of LIVE) {
    assert.ok(t.level && /^[ABC][12]?(–[ABC][12]?)?$/.test(t.level), `${t.id}: level "${t.level}"`);
    assert.ok(t.focus && t.focus.length >= 2 && t.focus.length <= 3, `${t.id}: focus`);
    assert.ok(t.tasks && t.tasks.length >= 2 && t.tasks.length <= 3, `${t.id}: tasks`);
    for (const f of t.focus!) assert.ok(f.trim().length > 2, `${t.id}: focus rỗng`);
    for (const task of t.tasks!) {
      assert.ok(task.trim().length > 15, `${t.id}: bài tập quá ngắn "${task}"`);
      assert.ok(/[.?!]$/.test(task.trim()), `${t.id}: bài tập thiếu dấu kết thúc "${task}"`);
    }
  }
});

test('bản tiếng Anh: số kỹ năng và bài tập khớp với tiếng Việt', () => {
  for (const t of LIVE) {
    const en = tutorCopy(t, true);
    assert.equal(en.focus.length, t.focus!.length, `${t.id}: focus EN`);
    assert.equal(en.tasks.length, t.tasks!.length, `${t.id}: tasks EN`);
    for (const task of en.tasks) assert.ok(task.trim().length > 15, `${t.id}: task EN "${task}"`);
    const vi = tutorCopy(t, false);
    assert.deepEqual(vi.focus, t.focus);
    assert.deepEqual(vi.tasks, t.tasks);
  }
});

test('lưới chính Luyện nói: chỉ gia sư đang live, không trùng, tối đa 6 thẻ', () => {
  const home = homeTutors();
  assert.ok(home.length >= 1 && home.length <= 6, `có ${home.length} thẻ`);
  assert.equal(new Set(home.map((t) => t.id)).size, home.length);
  for (const t of home) assert.equal(t.status, 'live', t.id);
  assert.deepEqual(home.map((t) => t.id), HOME_TUTOR_IDS.filter((id) => home.some((h) => h.id === id)));
});

test('điều hướng gia sư: màn riêng, gia sư soon sang màn chuẩn bị, còn lại vào phòng hội thoại', () => {
  const byId = (id: string) => TUTORS.find((t) => t.id === id)!;
  assert.equal(tutorRoute(byId('grammar')), '/hub/tutor/grammar');
  assert.equal(tutorRoute(byId('speech-analysis')), '/hub/analyze');
  assert.equal(tutorRoute(byId('vocab')), '/hub/tutor/vocab');
  const soon: Tutor = { id: 'x-soon', name: 'x', desc: 'x', status: 'soon' };
  assert.equal(tutorRoute(soon), '/hub/tutor/coming/x-soon');
});
