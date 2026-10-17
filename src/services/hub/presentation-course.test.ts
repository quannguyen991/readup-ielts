import test from 'node:test';
import assert from 'node:assert/strict';

import {
  PASS_SCORE,
  PRESENTATION_COURSE,
  courseProgress,
  findLesson,
  gradeQuiz,
  lessonState,
  lessonsOfLevel,
  levelUnlocked,
  nextLesson,
  quizOfLevel,
  type Bi,
  type DoneMap,
  type Lesson,
  type LessonKind,
} from './presentation-course';

const course = PRESENTATION_COURSE;
const KINDS: LessonKind[] = ['LEARN', 'WATCH', 'MAKEOVER', 'EYE', 'QUIZ', 'CAPSTONE'];

/** Đánh dấu xong mọi bài của cấp, trừ bài kiểm tra và thử thách. */
function finishBeforeQuiz(level: 1 | 2 | 3): DoneMap {
  const done: DoneMap = {};
  for (const l of lessonsOfLevel(course, level)) {
    if (l.kind !== 'QUIZ' && l.kind !== 'CAPSTONE') done[l.id] = { at: '2026-10-17T00:00:00.000Z' };
  }
  return done;
}

function passQuiz(done: DoneMap, level: 1 | 2 | 3, score = PASS_SCORE): DoneMap {
  const quiz = quizOfLevel(course, level)!;
  return { ...done, [quiz.id]: { at: '2026-10-17T00:00:00.000Z', score } };
}

function allBi(): Bi[] {
  const out: Bi[] = [];
  const add = (b: Bi) => out.push(b);
  for (const b of Object.values(course.levels)) {
    add(b.title);
    add(b.subtitle);
  }
  add(course.title);
  add(course.blurb);
  for (const l of course.lessons) {
    add(l.title);
    add(l.desc);
    if (l.kind === 'LEARN') {
      l.points.forEach(add);
      add(l.example);
    } else if (l.kind === 'WATCH') {
      add(l.scene);
      add(l.choice.q);
      add(l.choice.why);
      l.choice.options.forEach(add);
    } else if (l.kind === 'MAKEOVER') {
      for (const s of [l.before, l.after]) {
        add(s.headline);
        s.bullets.forEach(add);
      }
      add(l.choice.q);
      add(l.choice.why);
      l.choice.options.forEach(add);
    } else if (l.kind === 'EYE') {
      for (const s of [l.a, l.b]) {
        add(s.headline);
        s.bullets.forEach(add);
      }
      add(l.choice.q);
      add(l.choice.why);
      l.choice.options.forEach(add);
    } else if (l.kind === 'QUIZ') {
      for (const q of l.questions) {
        add(q.q);
        add(q.why);
        q.options.forEach(add);
      }
    } else {
      l.tasks.forEach(add);
    }
  }
  return out;
}

test('mỗi cấp có đủ sáu loại bài và đúng một bài kiểm tra + một thử thách', () => {
  for (const level of [1, 2, 3] as const) {
    const list = lessonsOfLevel(course, level);
    for (const kind of KINDS) assert.ok(list.some((l) => l.kind === kind), `cấp ${level} thiếu ${kind}`);
    assert.equal(list.filter((l) => l.kind === 'QUIZ').length, 1);
    assert.equal(list.filter((l) => l.kind === 'CAPSTONE').length, 1);
  }
});

test('id bài học không trùng và tra cứu được', () => {
  const ids = course.lessons.map((l) => l.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) assert.ok(findLesson(id), id);
  assert.equal(findLesson('không-có'), undefined);
});

test('mọi bài kiểm tra có 5 câu, đáp án nằm trong phạm vi lựa chọn', () => {
  for (const l of course.lessons) {
    if (l.kind === 'QUIZ') {
      assert.equal(l.questions.length, 5, l.id);
      for (const q of l.questions) assert.ok(q.answer >= 0 && q.answer < q.options.length, l.id);
    } else if (l.kind === 'WATCH' || l.kind === 'MAKEOVER' || l.kind === 'EYE') {
      assert.ok(l.choice.answer >= 0 && l.choice.answer < l.choice.options.length, l.id);
    } else if (l.kind === 'LEARN') {
      assert.ok(l.points.length >= 2, l.id);
    }
  }
});

test('mọi chuỗi song ngữ đều có nội dung cả hai thứ tiếng', () => {
  for (const b of allBi()) {
    assert.ok(b.vi.trim().length > 0, `thiếu tiếng Việt: ${JSON.stringify(b)}`);
    assert.ok(b.en.trim().length > 0, `thiếu tiếng Anh: ${JSON.stringify(b)}`);
  }
});

test('cấp 1 luôn mở; cấp 2 và 3 khoá tới khi bài kiểm tra cấp trước đạt', () => {
  assert.equal(levelUnlocked(course, 1, {}), true);
  assert.equal(levelUnlocked(course, 2, {}), false);
  const all1 = finishBeforeQuiz(1);
  assert.equal(levelUnlocked(course, 2, all1), false, 'làm hết bài nhưng chưa thi thì vẫn khoá');
  assert.equal(levelUnlocked(course, 2, passQuiz(all1, 1, PASS_SCORE - 20)), false, 'điểm dưới ngưỡng không mở');
  assert.equal(levelUnlocked(course, 2, passQuiz(all1, 1, PASS_SCORE)), true, 'đạt đúng ngưỡng thì mở');
  assert.equal(levelUnlocked(course, 3, passQuiz(all1, 1)), false, 'cấp 3 chưa mở khi chỉ xong cấp 1');
});

test('bài kiểm tra chỉ mở khi mọi bài học của cấp đã xong', () => {
  const quiz = quizOfLevel(course, 1)!;
  const partial = finishBeforeQuiz(1);
  const firstKey = Object.keys(partial)[0]!;
  delete partial[firstKey];
  assert.equal(lessonState(course, quiz, partial), 'locked');
  assert.equal(lessonState(course, quiz, finishBeforeQuiz(1)), 'open');
});

test('thử thách chỉ mở sau khi đạt bài kiểm tra cùng cấp', () => {
  const capstone = lessonsOfLevel(course, 1).find((l) => l.kind === 'CAPSTONE')!;
  assert.equal(lessonState(course, capstone, finishBeforeQuiz(1)), 'locked');
  assert.equal(lessonState(course, capstone, passQuiz(finishBeforeQuiz(1), 1)), 'open');
});

test('bài thuộc cấp chưa mở thì khoá, dù bài đó chưa làm', () => {
  const l2 = lessonsOfLevel(course, 2)[0] as Lesson;
  assert.equal(lessonState(course, l2, {}), 'locked');
  assert.equal(lessonState(course, l2, passQuiz(finishBeforeQuiz(1), 1)), 'open');
});

test('chấm điểm: câu bỏ trống tính là sai, 4/5 đạt, 3/5 không đạt', () => {
  const qs = course.lessons.find((l) => l.kind === 'QUIZ' && l.level === 1) as Extract<Lesson, { kind: 'QUIZ' }>;
  const answers = qs.questions.map((q) => q.answer);
  const four = [...answers.slice(0, 4), null];
  const three = [...answers.slice(0, 3), null, null];
  assert.deepEqual(gradeQuiz(qs.questions, four), { correct: 4, total: 5, score: 80, passed: true });
  assert.deepEqual(gradeQuiz(qs.questions, three), { correct: 3, total: 5, score: 60, passed: false });
  assert.equal(gradeQuiz(qs.questions, []).correct, 0);
});

test('tiến độ khoá đếm đúng bài đã xong, bài kiểm tra chỉ tính khi đạt', () => {
  const done = passQuiz(finishBeforeQuiz(1), 1, PASS_SCORE - 1);
  const p = courseProgress(course, done);
  assert.equal(p.total, course.lessons.length);
  assert.equal(p.done, lessonsOfLevel(course, 1).length - 2, 'bài kiểm tra điểm thấp không được tính');
  assert.equal(courseProgress(course, passQuiz(done, 1)).done, p.done + 1);
});

test('nextLesson trả về bài kế tiếp, cuối khoá trả về undefined', () => {
  const first = course.lessons[0]!;
  assert.equal(nextLesson(course, first)?.id, course.lessons[1]?.id);
  const last = course.lessons[course.lessons.length - 1]!;
  assert.equal(nextLesson(course, last), undefined);
});

test('gộp tiến độ: hợp bài đã xong, giữ điểm cao nhất, không mất bài bên nào', async () => {
  const { mergeCourseDone } = await import('./presentation-course');
  const local = { done: { 'p1-hook': { at: '2026-10-02T00:00:00.000Z' }, 'p1-check': { at: '2026-10-03T00:00:00.000Z', score: 60 } } };
  const remote = { done: { 'p1-check': { at: '2026-10-01T00:00:00.000Z', score: 100 }, 'p2-hook': { at: '2026-10-05T00:00:00.000Z' } } };
  const merged = mergeCourseDone(local, remote).done;
  assert.deepEqual(Object.keys(merged).sort(), ['p1-check', 'p1-hook', 'p2-hook']);
  assert.equal(merged['p1-check']!.score, 100);
  assert.equal(merged['p1-check']!.at, '2026-10-01T00:00:00.000Z');
  assert.deepEqual(mergeCourseDone(null, null), { done: {} });
  assert.deepEqual(mergeCourseDone(local, null).done, local.done);
});
