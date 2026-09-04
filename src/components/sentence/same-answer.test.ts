import test from 'node:test';
import assert from 'node:assert/strict';

/**
 * Kiểm luật chấm câu ĐIỀN TỪ của phần Nghe hiểu.
 *
 * Bản sao của `sameAnswer` trong `ListeningQuiz.tsx` — file kia là component
 * React nên `node:test` nạp thẳng không được. Chép sang đây vì đây là luật CHẤM:
 * chặt quá thì người học gõ đúng vẫn bị báo sai, mà rộng quá thì gõ gì cũng đúng.
 * Cả hai kiểu sai đều làm mất tin vào phần chấm, nên phải có ranh giới rõ.
 */
function sameAnswer(a: string | null, b: string): boolean {
  const chuan = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/^(a|an|the)\s+/, '')
      .replace(/\s+/g, ' ')
      .trim();
  return a !== null && chuan(a) === chuan(b);
}

test('chưa trả lời thì không tính là đúng', () => {
  assert.equal(sameAnswer(null, 'expel'), false);
});

test('khớp nguyên văn', () => {
  assert.equal(sameAnswer('expel', 'expel'), true);
});

test('bỏ qua hoa thường — đề IELTS không phân biệt', () => {
  assert.equal(sameAnswer('Expel', 'expel'), true);
  assert.equal(sameAnswer('BLEACHING', 'bleaching'), true);
});

test('bỏ qua dấu câu thừa người học hay gõ kèm', () => {
  assert.equal(sameAnswer('expel.', 'expel'), true);
  assert.equal(sameAnswer('"white"', 'white'), true);
});

test('bỏ qua mạo từ đứng đầu', () => {
  assert.equal(sameAnswer('the algae', 'algae'), true);
  assert.equal(sameAnswer('algae', 'the algae'), true);
  assert.equal(sameAnswer('a reef', 'reef'), true);
});

test('mạo từ ở GIỮA câu thì giữ nguyên, không cắt bừa', () => {
  // Cắt mọi mạo từ sẽ biến hai đáp án khác nghĩa thành như nhau.
  assert.equal(sameAnswer('heat of the sun', 'heat of sun'), false);
});

test('khoảng trắng thừa không làm sai', () => {
  assert.equal(sameAnswer('  coral   polyps ', 'coral polyps'), true);
});

test('đáp án khác thì vẫn phải là sai', () => {
  assert.equal(sameAnswer('absorb', 'expel'), false);
  assert.equal(sameAnswer('four', 'five'), false);
  assert.equal(sameAnswer('', 'expel'), false);
});

test('số giữ nguyên, không bị luật chữ cái nuốt mất', () => {
  assert.equal(sameAnswer('1998', '1998'), true);
  assert.equal(sameAnswer('1998.', '1998'), true);
  assert.equal(sameAnswer('1997', '1998'), false);
});

// -------------------------------------------------- phương án cho dạng cố định

/** Bản sao của `optionsFor` — cùng lý do chép như `sameAnswer` ở trên. */
const FIXED_OPTIONS: Partial<Record<string, string[]>> = {
  true_false_not_given: ['TRUE', 'FALSE', 'NOT GIVEN'],
  yes_no_not_given: ['YES', 'NO', 'NOT GIVEN'],
};

function optionsFor(q: { type: string; options: string[] | null }): string[] {
  if (q.options?.length) return q.options;
  return FIXED_OPTIONS[q.type] ?? [];
}

test('model quên gửi phương án cho TFNG thì tự bù đủ ba lựa chọn', () => {
  // Đo thật trên production: cùng một dạng câu, lượt có lượt không.
  assert.deepEqual(optionsFor({ type: 'true_false_not_given', options: null }), [
    'TRUE',
    'FALSE',
    'NOT GIVEN',
  ]);
  assert.deepEqual(optionsFor({ type: 'yes_no_not_given', options: null }), [
    'YES',
    'NO',
    'NOT GIVEN',
  ]);
});

test('model có gửi phương án thì dùng của model, không đè', () => {
  const riêng = ['Ba', 'Bốn', 'Năm'];
  assert.deepEqual(optionsFor({ type: 'multiple_choice', options: riêng }), riêng);
  assert.deepEqual(optionsFor({ type: 'true_false_not_given', options: riêng }), riêng);
});

test('dạng điền từ vẫn không có phương án — nó phải ra ô gõ', () => {
  assert.deepEqual(optionsFor({ type: 'sentence_completion', options: null }), []);
  assert.deepEqual(optionsFor({ type: 'short_answer', options: null }), []);
});
