import test from 'node:test';
import assert from 'node:assert/strict';

import {
  BREAK_MINUTES,
  FULL_TEST_ELAPSED_MINUTES,
  FULL_TEST_QUESTIONS,
  FULL_TEST_TESTING_MINUTES,
  endBreak,
  fullTestScore,
  stageIndex,
  stageLabel,
  startFullTest,
  submitModule,
  type FullTestState,
} from './full-test';
import { RW_MODULE_LENGTH } from './build';

/** Chạy hết một bài thi với kết quả cho trước ở từng module. */
function runThrough(
  seed: string,
  results: [number, number, number, number],
): FullTestState {
  let s = startFullTest(seed);
  s = submitModule(s, { correct: results[0], total: RW_MODULE_LENGTH });
  s = submitModule(s, { correct: results[1], total: RW_MODULE_LENGTH });
  s = endBreak(s);
  s = submitModule(s, { correct: results[2], total: 22 });
  s = submitModule(s, { correct: results[3], total: 22 });
  return s;
}

/* --------------------------------------------------------------- khổ bài thi */

test('khổ đề số hoá: 98 câu, 134 phút LÀM BÀI, 144 phút ngồi phòng', () => {
  /*
    Bản đầu của test này khẳng định tổng là 134 và nó đỏ — nhưng mã đúng, test
    sai. "2 giờ 14 phút" mà College Board công bố là thời gian LÀM BÀI, không
    tính mười phút nghỉ. Lẫn hai con số là nói sai về đề thi: đếm ngược 134 phút
    mà tính cả giờ nghỉ thì người học hết giờ sớm mười phút.
  */
  assert.equal(FULL_TEST_QUESTIONS, 98);
  assert.equal(FULL_TEST_TESTING_MINUTES, 134); // 32+32+35+35
  assert.equal(FULL_TEST_ELAPSED_MINUTES, 144); // + 10 phút nghỉ
  assert.equal(BREAK_MINUTES, 10);
});

test('bắt đầu ở R&W module 1, đủ 27 câu', () => {
  const s = startFullTest('s1');
  assert.equal(s.stage.kind, 'rw');
  if (s.stage.kind === 'rw') {
    assert.equal(s.stage.module, 1);
    assert.equal(s.stage.items.length, RW_MODULE_LENGTH);
    assert.equal(s.stage.minutes, 32);
  }
});

/* ------------------------------------------------------------ đi một chiều */

test('đi đúng thứ tự: R&W 1 → R&W 2 → nghỉ → Math 1 → Math 2 → kết quả', () => {
  let s = startFullTest('s2');
  const seen: string[] = [s.stage.kind];

  s = submitModule(s, { correct: 20, total: 27 });
  seen.push(s.stage.kind);
  s = submitModule(s, { correct: 19, total: 27 });
  seen.push(s.stage.kind);
  s = endBreak(s);
  seen.push(s.stage.kind);
  s = submitModule(s, { correct: 15, total: 22 });
  seen.push(s.stage.kind);
  s = submitModule(s, { correct: 14, total: 22 });
  seen.push(s.stage.kind);

  assert.deepEqual(seen, ['rw', 'rw', 'break', 'math', 'math', 'result']);
});

test('module 2 của R&W không lặp câu của module 1', () => {
  const s1 = startFullTest('s3');
  const ids1 = s1.stage.kind === 'rw' ? s1.stage.items.map((i) => i.id) : [];
  const s2 = submitModule(s1, { correct: 22, total: 27 });
  const ids2 = s2.stage.kind === 'rw' ? s2.stage.items.map((i) => i.id) : [];
  assert.equal(ids2.length, RW_MODULE_LENGTH);
  for (const id of ids2) assert.ok(!ids1.includes(id), `${id} lặp lại`);
});

test('nộp nhầm lúc đang nghỉ hoặc đã xong thì KHÔNG làm sập bài thi', () => {
  /*
    Màn hình bấm nhầm hai lần không nên phá trạng thái. Trả về nguyên trạng thái
    cũ là câu trả lời đúng ở đây — ném lỗi sẽ biến một cú bấm thừa thành mất bài.
  */
  let s = startFullTest('s4');
  s = submitModule(s, { correct: 20, total: 27 });
  s = submitModule(s, { correct: 20, total: 27 });
  assert.equal(s.stage.kind, 'break');

  const same = submitModule(s, { correct: 5, total: 22 });
  assert.deepEqual(same.stage, s.stage);

  const done = runThrough('s4b', [20, 20, 15, 15]);
  assert.deepEqual(submitModule(done, { correct: 1, total: 22 }).stage, done.stage);
});

test('endBreak chỉ có tác dụng khi đang nghỉ', () => {
  const s = startFullTest('s5');
  assert.deepEqual(endBreak(s).stage, s.stage);
});

/* ------------------------------------------------------------------ điểm */

test('KHÔNG có điểm trước khi làm xong', () => {
  /*
    Trần điểm mỗi phần phụ thuộc module 2 đã đi hướng nào, mà module 2 thì chưa
    làm. Một con số sai đưa ra đúng lúc người học đang lo là thứ họ sẽ nhớ và tin.
  */
  let s = startFullTest('s6');
  assert.equal(fullTestScore(s), null);
  s = submitModule(s, { correct: 20, total: 27 });
  assert.equal(fullTestScore(s), null);
  s = submitModule(s, { correct: 20, total: 27 });
  assert.equal(fullTestScore(s), null, 'xong R&W vẫn chưa có điểm');
  s = endBreak(s);
  s = submitModule(s, { correct: 15, total: 22 });
  assert.equal(fullTestScore(s), null);
});

test('điểm cuối nằm trong thang 400–1600', () => {
  const s = runThrough('s7', [22, 22, 18, 18]);
  const score = fullTestScore(s)!;
  assert.ok(score.total >= 400 && score.total <= 1600, `điểm ${score.total} ngoài thang`);
  assert.equal(score.total, score.readingWriting + score.math);
});

test('làm hết đúng nhưng bị đẩy sang module DỄ thì không chạm trần', () => {
  /*
    Đây là cách đề thích ứng thật hoạt động, và giấu nó đi sẽ cho người học một
    con số đẹp mà sai: ai trượt module 1 rồi làm đúng hết module 2 dễ vẫn không
    thể được 1600.
  */
  const weakThenPerfect = runThrough('s8', [5, 27, 4, 22]);
  const score = fullTestScore(weakThenPerfect)!;
  assert.ok(score.readingWriting <= 600, `R&W ${score.readingWriting} vượt trần module dễ`);
  assert.ok(score.math <= 600, `Math ${score.math} vượt trần module dễ`);
  assert.ok(score.total < 1600);
});

test('làm tốt cả hai module thì với tới vùng điểm cao', () => {
  const strong = runThrough('s9', [26, 26, 21, 21]);
  const score = fullTestScore(strong)!;
  assert.ok(score.readingWriting >= 700, `R&W chỉ ${score.readingWriting}`);
  assert.ok(score.math >= 700, `Math chỉ ${score.math}`);
});

test('điểm cộng từ ĐIỂM hai phần, không từ tổng số câu đúng', () => {
  /*
    Hai người cùng đúng 60/98 câu nhưng đi hai nhánh module 2 khác nhau thì điểm
    khác nhau — gộp số câu rồi mới quy đổi sẽ xoá mất điều đó.
  */
  const a = fullTestScore(runThrough('s10', [24, 12, 20, 6]))!;
  const b = fullTestScore(runThrough('s10', [12, 24, 6, 20]))!;
  assert.notEqual(a.total, b.total, 'hai nhánh khác nhau phải cho điểm khác nhau');
});

/* ------------------------------------------------------------ nhãn chặng */

test('nhãn và thứ tự chặng đủ để vẽ thanh tiến độ', () => {
  let s = startFullTest('s11');
  assert.match(stageLabel(s.stage), /Reading and Writing — Module 1/);
  assert.equal(stageIndex(s.stage), 1);

  s = submitModule(s, { correct: 20, total: 27 });
  s = submitModule(s, { correct: 20, total: 27 });
  assert.equal(stageLabel(s.stage), 'Break');

  s = endBreak(s);
  assert.match(stageLabel(s.stage), /Math — Module 1/);
  assert.equal(stageIndex(s.stage), 3);
});

test('tất định: cùng hạt giống và cùng kết quả ra cùng bài', () => {
  const a = runThrough('lap-lai', [20, 20, 15, 15]);
  const b = runThrough('lap-lai', [20, 20, 15, 15]);
  assert.deepEqual(fullTestScore(a), fullTestScore(b));
  assert.deepEqual(a.rwModule1Ids, b.rwModule1Ids);
});

/* --------------------------------------------------------------- xem lại */

/** Bài làm R&W đúng `n` câu đầu, còn lại bỏ trống. */
function rwWork(items: { answerIndex: number }[], n: number): (number | null)[] {
  return items.map((item, i) => (i < n ? item.answerIndex : null));
}

test('không đưa bài làm thì `review` vẫn rỗng — cũ vẫn chạy', () => {
  /*
    13 test phía trên gọi `submitModule` bằng hai tham số. Chúng phải xanh nguyên
    trạng, nếu không thì đây là một cuộc đổi giao diện chứ không phải thêm việc.
  */
  const s = runThrough('r0', [20, 20, 15, 15]);
  assert.deepEqual(s.review, []);
  assert.ok(fullTestScore(s));
});

test('đưa bài làm vào thì giữ đúng câu của chặng vừa nộp', () => {
  const s1 = startFullTest('r1');
  const items = s1.stage.kind === 'rw' ? s1.stage.items : [];
  const answers = rwWork(items, 9);

  const s2 = submitModule(s1, { correct: 9, total: RW_MODULE_LENGTH }, { kind: 'rw', answers });

  assert.equal(s2.review.length, 1);
  const entry = s2.review[0]!;
  assert.equal(entry.kind, 'rw');
  assert.equal(entry.module, 1);
  assert.deepEqual(
    entry.items.map((i) => i.id),
    items.map((i) => i.id),
    'câu trong bảng xem lại phải là câu của module vừa nộp',
  );
  if (entry.kind === 'rw') assert.deepEqual(entry.answers, answers);
});

test('số câu đúng lệch với bài làm thì NÉM, không đi tiếp', () => {
  /*
    Hai con số ấy chỉ gặp nhau ở đây. Cho chúng lệch nhau đi tiếp nghĩa là người
    học thấy một điểm số và một bảng xem lại nói hai chuyện khác nhau, mà không
    có gì trên màn hình cho biết cái nào đúng.
  */
  const s = startFullTest('r2');
  const items = s.stage.kind === 'rw' ? s.stage.items : [];
  assert.throws(
    () => submitModule(s, { correct: 27, total: 27 }, { kind: 'rw', answers: rwWork(items, 4) }),
    /lệch nhau/,
  );
});

test('đưa bài làm SAI KIỂU cho chặng thì NÉM', () => {
  const s = startFullTest('r3');
  assert.throws(
    () => submitModule(s, { correct: 0, total: 27 }, { kind: 'math', attempts: [] }),
    /math.*rw|rw.*math/,
  );
});

test('bốn module xếp đúng thứ tự trong bảng xem lại', () => {
  let s = startFullTest('r4');
  const seen: string[] = [];

  for (let i = 0; i < 2; i += 1) {
    const items = s.stage.kind === 'rw' ? s.stage.items : [];
    s = submitModule(s, { correct: 5, total: RW_MODULE_LENGTH }, { kind: 'rw', answers: rwWork(items, 5) });
    seen.push(`rw${i + 1}`);
  }
  s = endBreak(s);
  for (let i = 0; i < 2; i += 1) {
    const items = s.stage.kind === 'math' ? s.stage.items : [];
    const attempts = items.map((it, j) => ({
      itemId: it.id,
      skill: it.skill,
      domain: it.domain,
      format: it.format,
      userAnswer: null,
      isCorrect: j < 3,
      errorTag: null,
      note: null,
      timeSpentMs: 0,
    }));
    s = submitModule(s, { correct: 3, total: 22 }, { kind: 'math', attempts });
    seen.push(`math${i + 1}`);
  }

  assert.equal(s.stage.kind, 'result');
  assert.equal(seen.length, 4);
  assert.deepEqual(
    s.review.map((r) => `${r.kind}${r.module}`),
    ['rw1', 'rw2', 'math1', 'math2'],
  );
  /* Đủ 98 câu để xem lại — bằng đúng số câu của bài thi. */
  assert.equal(
    s.review.reduce((n, r) => n + r.items.length, 0),
    FULL_TEST_QUESTIONS,
  );
});

test('bấm nộp thừa lúc đang nghỉ KHÔNG thêm mục vào bảng xem lại', () => {
  let s = startFullTest('r5');
  for (let i = 0; i < 2; i += 1) {
    const items = s.stage.kind === 'rw' ? s.stage.items : [];
    s = submitModule(s, { correct: 2, total: RW_MODULE_LENGTH }, { kind: 'rw', answers: rwWork(items, 2) });
  }
  assert.equal(s.stage.kind, 'break');
  assert.equal(s.review.length, 2);

  const again = submitModule(s, { correct: 0, total: 22 }, { kind: 'math', attempts: [] });
  assert.equal(again.review.length, 2, 'cú bấm thừa đã lọt vào bảng xem lại');
});
