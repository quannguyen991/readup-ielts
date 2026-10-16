import test from 'node:test';
import assert from 'node:assert/strict';

import { PHONEMES, PHONEME_COUNT } from './phonemes';
import { MINIMAL_PAIRS, STRESS_WORDS } from './games';
import { A1_LESSONS, ALL_LESSONS, LEVEL_LESSONS, gradeLesson } from './grammar-course';
import { clean, customPersona, resolvePersona, slidesPersona } from './persona';
import { ROLEPLAYS, gradeRoleplay } from './roleplay';
import { TUTORS, tutorById } from './tutors';
import { dailyTasks, streakDays, weekStrip } from './daily';
import { editDistance, scoreTranscript, scoreWord } from './pronounce';
import { buildVoiceReport, estimateBand } from './voice-report';
import { CLIPS, SEED_SETS, lookupWord } from './content';

test('44 âm vị, ký hiệu không trùng, mỗi âm có ví dụ và mẹo', () => {
  assert.equal(PHONEME_COUNT, 44);
  assert.equal(new Set(PHONEMES.map((p) => p.symbol)).size, 44);
  for (const p of PHONEMES) {
    assert.ok(p.examples.length >= 1, p.symbol);
    assert.ok(p.tipVi.length > 10, p.symbol);
    if (p.pairWith) assert.ok(PHONEMES.some((q) => q.symbol === p.pairWith), `${p.symbol} → ${p.pairWith}`);
  }
});

test('cặp âm tối thiểu: hai từ khác nhau, phiên âm khác nhau', () => {
  for (const pair of MINIMAL_PAIRS) {
    assert.notEqual(pair.a, pair.b);
    assert.notEqual(pair.aIpa, pair.bIpa);
  }
  assert.ok(MINIMAL_PAIRS.length >= 12);
});

test('trọng âm: vị trí âm tiết chính nằm trong danh sách âm tiết', () => {
  for (const w of STRESS_WORDS) {
    assert.ok(w.primary >= 0 && w.primary < w.syllables.length, w.word);
  }
});

test('ngữ pháp A1: đủ 8 bài, đáp án đúng nằm trong lựa chọn', () => {
  assert.equal(A1_LESSONS.length, 8);
  assert.equal(new Set(A1_LESSONS.map((l) => l.id)).size, 8);
  for (const lesson of A1_LESSONS) {
    assert.ok(lesson.rules.length >= 1, lesson.id);
    for (const q of lesson.questions) {
      assert.ok(q.answer >= 0 && q.answer < q.options.length, `${lesson.id}: ${q.q}`);
    }
  }
});

test('ngữ pháp: đạt khi đúng ít nhất 2/3 câu', () => {
  const lesson = A1_LESSONS[0]!;
  const answers = lesson.questions.map((q) => q.answer);
  assert.equal(gradeLesson(lesson, answers).passed, true);
  assert.equal(gradeLesson(lesson, [answers[0]!, null, null]).passed, false);
  assert.equal(gradeLesson(lesson, [answers[0]!, answers[1]!, null]).passed, true);
});

test('ngữ pháp A2–C: mỗi cấp có bài, id không trùng, đáp án hợp lệ', () => {
  assert.equal(ALL_LESSONS.length, 24);
  assert.equal(new Set(ALL_LESSONS.map((l) => l.id)).size, ALL_LESSONS.length);
  for (const level of ['A2', 'B1', 'B2', 'C'] as const) {
    assert.ok(LEVEL_LESSONS[level].length >= 3, level);
    for (const lesson of LEVEL_LESSONS[level]) {
      assert.equal(lesson.level, level);
      assert.equal(lesson.questions.length, 3, lesson.id);
      for (const q of lesson.questions) {
        assert.ok(q.answer >= 0 && q.answer < q.options.length, `${lesson.id}: ${q.q}`);
      }
    }
  }
});

test('gia sư: làm sạch đầu vào, vai tự tạo, slide có giới hạn', () => {
  assert.equal(clean('  hi\n{evil}  '), 'hi evil');
  assert.equal(clean(42), '');
  assert.equal(customPersona({ role: 'ab', tone: '', situation: 'x', goal: '' }, 'S').ok, false);
  const ok = customPersona({ role: 'a café owner', tone: 'calm', situation: 'a late order', goal: '' }, 'S');
  assert.equal(ok.ok, true);
  assert.ok(ok.ok && ok.persona.includes('café owner'));
  assert.equal(slidesPersona(TUTORS_PRESENTATION(), [], 'S').ok, false);
  const big = Array.from({ length: 50 }, (_, k) => `point ${k} ${'x'.repeat(500)}`);
  const deck = slidesPersona(TUTORS_PRESENTATION(), big, 'S');
  assert.ok(deck.ok && deck.persona.length < 7000);
  assert.equal(resolvePersona({ tutorId: 'presentation' }, 'S').ok, false);
  assert.equal(resolvePersona({ tutorId: 'grammar' }, 'S').ok, true);
});

function TUTORS_PRESENTATION() {
  const t = tutorById('presentation');
  if (!t) throw new Error('missing presentation tutor');
  return t;
}

test('kịch bản nhập vai: mỗi lượt đúng một lựa chọn tốt', () => {
  assert.ok(ROLEPLAYS.length >= 8);
  for (const r of ROLEPLAYS) {
    for (const step of r.steps) {
      assert.equal(step.options.filter((o) => o.good).length, 1, `${r.id}: ${step.ai}`);
    }
  }
});

test('chấm nhập vai: đạt khi chọn tốt ít nhất 2/3 lượt', () => {
  const r = ROLEPLAYS[0]!;
  const good = r.steps.map((s) => s.options.findIndex((o) => o.good));
  assert.equal(gradeRoleplay(good, r.steps).passed, true);
  assert.equal(gradeRoleplay([null, null, null], r.steps).passed, false);
});

test('gia sư: id không trùng; gia sư đang chạy có vai và câu mở đầu', () => {
  assert.equal(new Set(TUTORS.map((t) => t.id)).size, TUTORS.length);
  for (const t of TUTORS.filter((x) => x.status === 'live')) {
    assert.ok(t.persona && t.persona.length > 20, t.id);
    assert.ok(t.opening && t.opening.length > 5, t.id);
  }
});

test('nhiệm vụ hằng ngày: ba nhiệm vụ, cùng một ngày thì không đổi', () => {
  const input = { phonemeBest: {}, lessonsDone: {}, roleplayDone: {} };
  const a = dailyTasks('2026-10-16', input);
  const b = dailyTasks('2026-10-16', input);
  assert.equal(a.length, 3);
  assert.deepEqual(a, b);
  assert.deepEqual(a.map((t) => t.kind), ['phoneme', 'grammar', 'roleplay']);
});

test('chuỗi ngày: liên tục từ hôm nay hoặc hôm qua, đứt quãng thì dừng', () => {
  const today = '2026-10-16';
  assert.equal(streakDays({ '2026-10-16': ['x'], '2026-10-15': ['x'], '2026-10-14': ['x'] }, today), 3);
  assert.equal(streakDays({ '2026-10-15': ['x'], '2026-10-14': ['x'] }, today), 2);
  assert.equal(streakDays({ '2026-10-13': ['x'] }, today), 0);
  const strip = weekStrip({}, today);
  assert.equal(strip.length, 7);
  assert.equal(strip[6]!.isToday, true);
  assert.equal(strip[6]!.day, '2026-10-16');
});

test('chấm phát âm theo từ: khớp đầy đủ là 100, thiếu từ là đỏ', () => {
  assert.equal(scoreWord('think', 'think'), 100);
  assert.ok(scoreWord('think', 'sink') < 100);
  const perfect = scoreTranscript('I like tea', 'I like tea');
  assert.equal(perfect.overall, 100);
  const missing = scoreTranscript('I like tea', 'I tea');
  assert.equal(missing.words[1]!.band, 'poor');
  assert.equal(editDistance('kitten', 'sitting'), 3);
});

test('báo cáo giọng nói: đo được tốc độ và từ đệm, chiều chưa đo để null', () => {
  const transcript = 'uh I think um the the plan is good you know it works well';
  const report = buildVoiceReport({
    transcript,
    segments: [{ text: transcript, confidence: 0.9 }],
    eventTimes: [100, 500, 900],
    durationMs: 30_000,
  });
  assert.ok(report.wpm !== null && report.wpm > 0);
  assert.ok(report.fillers.total >= 2);
  const grammar = report.dimensions.find((d) => d.key === 'grammar');
  assert.equal(grammar?.score, null);
  assert.ok(report.overall !== null);
});

test('ước lượng band nằm trong 4.0–9.0 và làm tròn 0,5', () => {
  assert.equal(estimateBand(0), 4);
  assert.equal(estimateBand(100), 9);
  const b = estimateBand(63);
  assert.equal(b * 2, Math.round(b * 2));
});

test('clip luyện nói: id không trùng và có mẹo', () => {
  assert.equal(new Set(CLIPS.map((c) => c.id)).size, CLIPS.length);
  for (const c of CLIPS) assert.ok(c.tipVi.length > 5, c.id);
});

test('bộ học có sẵn có ít nhất một từ mỗi bộ', () => {
  for (const s of SEED_SETS) assert.ok(s.items.length > 0, s.id);
});

test('từ điển tra được từ có trong kho', () => {
  const hit = lookupWord('menu');
  assert.ok(hit && hit.ipa.length > 0);
  assert.equal(lookupWord('zzzqqq'), null);
});
