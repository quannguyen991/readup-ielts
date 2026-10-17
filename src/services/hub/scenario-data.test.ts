import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import { DIALOGUES } from '@/data/hub/dialogues';
import { SCENE_IMAGE } from '@/data/hub/scenes';
import { CALLS } from '@/data/hub/calls';
import { NHAP_VAI } from '@/data/hub/roleplays';
import { ROLEPLAYS, gradeRoleplay } from './roleplay';
import { dialogueById, gradeDialogue, mergeDialogueBest } from './dialogue';

const ROOT = path.resolve(import.meta.dirname, '..', '..', '..');

test('nhập vai và gọi điện: đủ 30 + 30 kịch bản, id không trùng', () => {
  assert.equal(NHAP_VAI.length, 30);
  assert.equal(CALLS.length, 30);
  assert.equal(new Set(ROLEPLAYS.map((r) => r.id)).size, ROLEPLAYS.length);
  assert.ok(NHAP_VAI.every((r) => r.mode === 'roleplay'));
  assert.ok(CALLS.every((r) => r.mode === 'call' && r.id.startsWith('rp-phone-')));
});

test('kịch bản: mỗi lượt đúng một cách tốt, có nhiệm vụ và từ mục tiêu', () => {
  for (const r of ROLEPLAYS) {
    assert.equal(r.steps.length, 3, `${r.id} phải có 3 lượt`);
    for (const step of r.steps) {
      assert.equal(step.options.filter((opt) => opt.good).length, 1, `${r.id} có lượt không đúng một cách tốt`);
      assert.equal(step.options.length, 3, `${r.id} phải có 3 cách đáp`);
    }
    assert.ok(r.tasks.length >= 3, `${r.id} thiếu nhiệm vụ`);
    assert.ok(r.vocab.length >= 3, `${r.id} thiếu từ mục tiêu`);
  }
});

test('kịch bản: vị trí cách tốt được xoay đều, không đoán theo vị trí', () => {
  const counts = [0, 0, 0];
  for (const r of ROLEPLAYS) for (const step of r.steps) counts[step.options.findIndex((opt) => opt.good)]! += 1;
  const total = counts.reduce((a, b) => a + b, 0);
  for (const c of counts) assert.ok(c / total >= 0.25, `vị trí đúng bị lệch: ${counts.join(',')}`);
});

test('kịch bản: mỗi bối cảnh có ảnh, và file ảnh có trên đĩa', () => {
  for (const r of ROLEPLAYS) {
    const img = SCENE_IMAGE[r.setting];
    assert.ok(img, `${r.id} dùng bối cảnh ${r.setting} không có ảnh`);
    assert.ok(existsSync(path.join(ROOT, 'public', img)), `thiếu file ${img}`);
  }
});

test('gọi điện và nhập vai: chấm đạt khi đúng ít nhất 2 trên 3 lượt', () => {
  const r = ROLEPLAYS[0]!;
  const good = r.steps.map((s) => s.options.findIndex((opt) => opt.good));
  assert.equal(gradeRoleplay(good, r.steps).passed, true);
  assert.equal(gradeRoleplay([null, null, null], r.steps).passed, false);
});

test('hội thoại: đủ 30 bài, mỗi bài 8 câu, 3 câu điền từ, id không trùng', () => {
  assert.equal(DIALOGUES.length, 30);
  assert.equal(new Set(DIALOGUES.map((d) => d.id)).size, DIALOGUES.length);
  for (const d of DIALOGUES) {
    assert.equal(d.lines.length, 8, `${d.id} phải có 8 câu`);
    assert.equal(d.quiz.length, 3, `${d.id} phải có 3 câu điền`);
    assert.ok(d.keyPhrases.length >= 3, `${d.id} thiếu cụm từ then chốt`);
    assert.ok(SCENE_IMAGE[d.setting], `${d.id} thiếu ảnh bối cảnh`);
    for (const item of d.quiz) {
      assert.ok(item.answer >= 0 && item.answer < item.options.length, `${d.id} có đáp án ngoài khoảng`);
      assert.ok(item.q.includes('____'), `${d.id} có câu thiếu chỗ trống`);
    }
  }
  assert.ok(dialogueById('d-airport-checkin'));
});

test('hội thoại: chấm câu điền từ và gộp điểm cao nhất', () => {
  const d = DIALOGUES[0]!;
  const right = d.quiz.map((q) => q.answer);
  assert.equal(gradeDialogue(right, d.quiz).passed, true);
  assert.equal(gradeDialogue([null, null, null], d.quiz).passed, false);
  assert.deepEqual(mergeDialogueBest({ a: 67, b: 33 }, { a: 100, c: 67 }), { a: 100, b: 33, c: 67 });
});
