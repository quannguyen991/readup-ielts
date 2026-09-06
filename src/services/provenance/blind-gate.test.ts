import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildBlindPrompt,
  judgeBlindReply,
  readBlindReply,
  worthBlindChecking,
  type BlindProbe,
} from './blind-gate';

const MC: BlindProbe = {
  questionId: 'q1',
  type: 'multiple_choice',
  prompt: 'What happens to coral once the algae leave?',
  options: ['It turns white and starves', 'It grows faster', 'It splits in two', 'It changes colour to red'],
  correctAnswer: 'It turns white and starves',
};

const TFNG: BlindProbe = {
  questionId: 'q2',
  type: 'true_false_not_given',
  prompt: 'The Earth completes one orbit of the Sun in approximately 365 days.',
  options: null,
  correctAnswer: 'TRUE',
};

/* ------------------------------------------------------------- lời dặn */

test('lời dặn KHÔNG nói đây là bài kiểm chất lượng đề', () => {
  /*
    Nói ra thì model đoán được câu trả lời "đúng ý người hỏi" là "không xác định
    được", và nó sẽ trả lời như vậy cho mọi câu — lúc đó hàng rào luôn xanh và
    không chặn gì nữa. Cùng lý do đã ghi ở `proofloop/blind-check.ts`.
  */
  const p = buildBlindPrompt(MC).toLowerCase();
  for (const tell of ['quality', 'validity', 'evaluate the question', 'is this a good question', 'flawed']) {
    assert.ok(!p.includes(tell), `lời dặn lộ ý đồ qua cụm "${tell}"`);
  }
});

test('lời dặn KHÔNG chứa bài đọc — đó là toàn bộ ý nghĩa của "bịt mắt"', () => {
  const p = buildBlindPrompt(MC);
  assert.ok(!p.includes('passage:'), 'không được nhét bài vào');
  assert.ok(p.includes(MC.prompt));
});

test('lời dặn cho TFNG nêu đúng ba nhãn', () => {
  const p = buildBlindPrompt(TFNG);
  for (const label of ['TRUE', 'FALSE', 'NOT GIVEN']) assert.ok(p.includes(label));
});

test('lời dặn cho phép nói không biết', () => {
  // Không cho lối ra thì model buộc phải chọn bừa, và một lần trúng trong bốn
  // phương án sẽ loại oan một câu tốt.
  assert.match(buildBlindPrompt(MC).toLowerCase(), /cannot tell|null/);
});

/* -------------------------------------------------------------- phán quyết */

test('trả lời ĐÚNG và tự nhận xác định được → LOẠI', () => {
  const v = judgeBlindReply(MC, { answer: 'It turns white and starves', determinable: true });
  assert.equal(v.ok, false);
  if (!v.ok) assert.equal(v.note, 'answerable-without-passage');
});

test('trả lời đúng nhưng tự nhận là đoán → GIỮ, có ghi lại', () => {
  const v = judgeBlindReply(MC, { answer: 'It turns white and starves', determinable: false });
  assert.equal(v.ok, true);
  if (v.ok) assert.equal(v.note, 'guess-hit');
});

test('trả lời sai → GIỮ, càng chắc là phải đọc bài', () => {
  const v = judgeBlindReply(MC, { answer: 'It grows faster', determinable: true });
  assert.equal(v.ok, true);
  if (v.ok) assert.equal(v.note, 'answered-wrong');
});

test('nói không biết → GIỮ', () => {
  const v = judgeBlindReply(MC, { answer: null, determinable: false });
  assert.equal(v.ok, true);
  if (v.ok) assert.equal(v.note, 'could-not-answer');
});

test('so đáp án bỏ qua hoa thường và khoảng trắng thừa', () => {
  const v = judgeBlindReply(MC, { answer: '  it TURNS white and starves ', determinable: true });
  assert.equal(v.ok, false);
});

test('TFNG: nhãn đúng và xác định được → LOẠI', () => {
  // Đây chính là kiểu hỏng đáng bắt nhất: một nhận định mà kiến thức phổ thông
  // phân xử được thì nó không đo đọc hiểu, dù đúng định dạng đề thi.
  const v = judgeBlindReply(TFNG, { answer: 'true', determinable: true });
  assert.equal(v.ok, false);
});

test('TFNG: "NOT GIVEN" khác "NOTGIVEN" thì vẫn khớp', () => {
  const q: BlindProbe = { ...TFNG, correctAnswer: 'NOT GIVEN' };
  assert.equal(judgeBlindReply(q, { answer: 'not given', determinable: true }).ok, false);
  assert.equal(judgeBlindReply(q, { answer: 'NOTGIVEN', determinable: true }).ok, false);
});

test('trả lời bằng SỐ THỨ TỰ phương án cũng khớp', () => {
  // Model hay trả về chỉ số thay vì chữ. Không nhận dạng này thì hàng rào bỏ
  // lọt: câu bị coi là "trả lời sai" trong khi model thật ra đã trúng.
  assert.equal(judgeBlindReply(MC, { answer: '0', determinable: true }).ok, false);
  assert.equal(judgeBlindReply(MC, { answer: '1', determinable: true }).ok, true);
});

/* --------------------------------------------------------- đọc bản trả lời */

test('đọc JSON bình thường', () => {
  assert.deepEqual(readBlindReply('{"answer":"TRUE","determinable":true}'), {
    answer: 'TRUE',
    determinable: true,
  });
});

test('đọc được JSON nằm trong rào mã hoặc kèm lời dẫn', () => {
  const got = readBlindReply('Sure!\n```json\n{"answer": null, "determinable": false}\n```');
  assert.deepEqual(got, { answer: null, determinable: false });
});

test('answer là SỐ cũng đọc được — model hay trả chỉ số phương án', () => {
  /*
    Lời dặn nêu phương án dưới dạng "0. …", "1. …" nên model rất tự nhiên trả về
    một SỐ. Bản đầu chỉ nhận chuỗi, và đo thật thấy 18% số lượt rơi vào nhánh
    "đọc không nổi" rồi bị ghi là CHƯA KIỂM — không phải vì hàng rào hỏng, chỉ vì
    bộ đọc kén kiểu dữ liệu. Hỏng kiểu ấy nguy hiểm hơn hỏng to tiếng: nó lặng lẽ
    làm mẫu số nhỏ đi và thiên về phía những câu model chịu trả lời bằng chữ.
  */
  assert.deepEqual(readBlindReply('{"answer":2,"determinable":true}'), {
    answer: '2',
    determinable: true,
  });
});

test('answer là số 0 không bị nhầm thành thiếu trường', () => {
  // 0 là giá trị falsy; kiểm bằng `if (!answer)` là bỏ mất đúng phương án đầu.
  assert.deepEqual(readBlindReply('{"answer":0,"determinable":false}'), {
    answer: '0',
    determinable: false,
  });
});

test('answer là số đi hết được tới phán quyết', () => {
  const v = judgeBlindReply(MC, readBlindReply('{"answer":0,"determinable":true}')!);
  assert.equal(v.ok, false, 'chỉ số 0 trỏ đúng đáp án nên phải bị LOẠI');
});

test('answer kiểu lạ (mảng, object) thì vẫn trả null', () => {
  for (const bad of ['{"answer":[1],"determinable":true}', '{"answer":{"x":1},"determinable":true}']) {
    assert.equal(readBlindReply(bad), null, `phải từ chối ${bad}`);
  }
});

test('không đọc nổi thì trả null, không đoán', () => {
  for (const junk of ['', 'xin lỗi tôi không thể', '{khong phai json']) {
    assert.equal(readBlindReply(junk), null);
  }
});

test('thiếu determinable thì coi như KHÔNG xác định được', () => {
  // Mặc định an toàn: thiếu thông tin thì không được loại câu. Loại oan một câu
  // tốt đắt hơn giữ lại một câu đáng ngờ, vì câu đáng ngờ còn hàng rào luật.
  assert.deepEqual(readBlindReply('{"answer":"TRUE"}'), { answer: 'TRUE', determinable: false });
});

/* ------------------------------------------------- dạng nào đáng kiểm */

test('dạng điền từ lấy chữ trong bài thì KHÔNG cần kiểm bịt mắt', () => {
  /*
    Đáp án là chữ trích nguyên từ bài. Model không đọc bài thì gần như không thể
    đoán trúng đúng cụm ấy, nên hàng rào này hầu như luôn xanh — chạy nó chỉ tốn
    tiền. Hàng rào luật đã lo dạng này bằng cách bắt đáp án phải có thật trong bài.
  */
  for (const t of ['sentence_completion', 'summary_completion', 'short_answer'] as const) {
    assert.equal(worthBlindChecking(t), false, `${t} không nên kiểm`);
  }
});

test('trắc nghiệm và TFNG thì PHẢI kiểm', () => {
  for (const t of ['multiple_choice', 'true_false_not_given', 'yes_no_not_given'] as const) {
    assert.equal(worthBlindChecking(t), true, `${t} phải kiểm`);
  }
});

test('các dạng SAT trắc nghiệm cũng phải kiểm', () => {
  for (const t of ['sat_inference', 'sat_central_idea', 'sat_words_in_context'] as const) {
    assert.equal(worthBlindChecking(t), true);
  }
});
