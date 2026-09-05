import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildTransferPrompt,
  gradeTransfer,
  parseTransferProbe,
  type TransferProbe,
} from './transfer-probe';

/**
 * Canh phép thử chuyển giao của mảng Viết.
 *
 * Hai ranh giới phải giữ, và chúng kéo về hai phía ngược nhau:
 *
 *   · chấm NỚI đủ để một bản sửa đúng nhưng dùng từ khác vẫn qua — bắt khớp
 *     nguyên văn sẽ đánh trượt đúng những người viết tốt nhất;
 *   · chấm CHẶT đủ để chép lại câu sai không qua được.
 *
 * Bỏ ranh giới nào cũng làm hỏng cả phép thử: một bên đo sai người giỏi, bên kia
 * biến "đã hiểu" thành thứ ai cũng có.
 */

const probe: TransferProbe = {
  sentence: 'The number of students have increased sharply since the new policy was introduced.',
  fixed: 'The number of students has increased sharply since the new policy was introduced.',
  category: 'grammar',
  hintVi: '“The number of …” là chủ ngữ số ít nên động từ phải là “has”.',
};

// ------------------------------------------------------------------ lời nhắc

test('lời nhắc nêu đúng loại lỗi và câu gốc', () => {
  const p = buildTransferPrompt({
    category: 'grammar',
    originalQuote: 'education create equal opportunity',
    whyVi: 'Chủ ngữ số ít nhưng động từ chia số nhiều.',
  });
  assert.ok(p.includes('grammar'));
  assert.ok(p.includes('education create equal opportunity'));
  assert.ok(p.includes('MỚI'), 'phải yêu cầu câu mới, không lấy lại câu cũ');
});

// -------------------------------------------------------------- đọc kết quả

test('đọc được bản hợp lệ', () => {
  const got = parseTransferProbe(
    { sentence: probe.sentence, fixed: probe.fixed, hintVi: probe.hintVi },
    { category: 'grammar', originalQuote: 'education create equal opportunity' },
  );
  assert.ok(!('rejected' in got));
});

test('thiếu trường thì từ chối', () => {
  for (const bad of [
    {},
    { sentence: 'a b c d e f g' },
    { sentence: 'a b c d e f g', fixed: 'a b c d e f h' },
  ]) {
    const got = parseTransferProbe(bad, { category: 'grammar', originalQuote: 'x' });
    assert.ok('rejected' in got, `phải từ chối: ${JSON.stringify(bad)}`);
  }
});

test('câu sai trùng câu sửa thì từ chối — model quên gài lỗi', () => {
  // Không có lỗi nào để sửa thì người học sửa gì cũng thành sai.
  const got = parseTransferProbe(
    { sentence: probe.fixed, fixed: probe.fixed, hintVi: 'x' },
    { category: 'grammar', originalQuote: 'y' },
  );
  assert.deepEqual(got, { rejected: 'câu sai trùng câu sửa' });
});

test('trả lại đúng câu trong bài người học thì từ chối — không phải câu mới', () => {
  /*
    Đây là ràng buộc trung tâm. Sửa lại chính câu vừa đọc lời giải thích không
    tách được "đã hiểu" khỏi "nhớ câu vừa đọc", mà tách hai thứ đó là toàn bộ lý
    do phép thử chuyển giao tồn tại.
  */
  const got = parseTransferProbe(
    { sentence: probe.sentence, fixed: probe.fixed, hintVi: 'x' },
    { category: 'grammar', originalQuote: probe.sentence },
  );
  assert.deepEqual(got, { rejected: 'không phải câu mới' });
});

test('câu quá ngắn thì từ chối', () => {
  const got = parseTransferProbe(
    { sentence: 'He go home.', fixed: 'He goes home.', hintVi: 'x' },
    { category: 'grammar', originalQuote: 'y' },
  );
  assert.deepEqual(got, { rejected: 'câu quá ngắn' });
});

test('đầu vào không phải object cũng không ném lỗi', () => {
  for (const bad of [null, undefined, 'chuỗi', 42, []]) {
    const got = parseTransferProbe(bad, { category: 'grammar', originalQuote: 'x' });
    assert.ok('rejected' in got);
  }
});

// ----------------------------------------------------------------- chấm bài

test('sửa khớp bản mẫu thì qua', () => {
  assert.equal(gradeTransfer(probe.fixed, probe).passed, true);
});

test('bỏ qua hoa thường và dấu câu', () => {
  assert.equal(gradeTransfer(probe.fixed.toUpperCase(), probe).passed, true);
  assert.equal(gradeTransfer(probe.fixed.replace('.', ''), probe).passed, true);
});

test('chép lại câu sai thì KHÔNG qua', () => {
  const got = gradeTransfer(probe.sentence, probe);
  assert.equal(got.passed, false);
  assert.equal(got.reason, 'không đổi gì');
});

test('sửa đúng lỗi nhưng dùng từ khác vẫn qua', () => {
  // "sharply" → "rapidly": vẫn sửa đúng chỗ hoà hợp chủ vị, chỉ khác cách nói.
  const khac = 'The number of students has increased rapidly since the new policy was introduced.';
  assert.equal(gradeTransfer(khac, probe).passed, true);
});

test('viết sang chuyện khác hẳn thì không qua', () => {
  const lac = 'I really enjoy playing football with my friends on Sunday afternoons in the park.';
  const got = gradeTransfer(lac, probe);
  assert.equal(got.passed, false);
  assert.equal(got.reason, 'khác bản sửa');
});

test('bỏ trống thì không qua', () => {
  assert.equal(gradeTransfer('', probe).passed, false);
});
