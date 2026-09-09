import test from 'node:test';
import assert from 'node:assert/strict';

import { VOCAB_FRAMES } from './frames';
import { BLANK, buildVocabItem, hasCue, scanCandidates } from './generate';
import { verifyVocabItem } from './verify';

const CANDIDATES = scanCandidates();
const ITEMS = CANDIDATES.map(buildVocabItem);

test('quét được câu dùng được từ kho bài đọc thật', () => {
  assert.ok(ITEMS.length >= 30, `chỉ tìm được ${ITEMS.length} câu`);
});

test('MỌI câu sinh ra đều qua hàng rào', () => {
  for (const item of ITEMS) {
    const v = verifyVocabItem(item);
    assert.equal(v.ok, true, `${item.id} trượt: ${v.ok ? '' : v.reason}`);
  }
});

test('tất định: cùng ứng viên ra cùng câu, cùng thứ tự phương án', () => {
  const c = CANDIDATES[0]!;
  assert.deepEqual(buildVocabItem(c), buildVocabItem(c));
});

test('đúng một chỗ trống, và đáp án nằm đúng chỗ đã ghi', () => {
  for (const item of ITEMS) {
    assert.equal(item.passage.split(BLANK).length - 1, 1, item.id);
    assert.equal(item.options[item.answerIndex], item.word, item.id);
    assert.equal(item.optionWhy[item.answerIndex], null, item.id);
    assert.equal(item.options.length, 4, item.id);
  }
});

test('KHÔNG phương án nào xuất hiện lại trong bài dẫn', () => {
  /*
    Câu nào lặp lại từ đích ở chỗ khác là câu tự lộ: người học dò chuỗi là ra,
    không cần hiểu nghĩa. Nhiễu lặp lại thì còn tệ hơn — nó gợi sai.
  */
  for (const item of ITEMS) {
    const body = item.passage.replace(BLANK, ' ').toLowerCase();
    for (const opt of item.options) {
      assert.ok(
        !new RegExp(`(?<![a-z])${opt.toLowerCase()}(?![a-z])`).test(body),
        `${item.id}: "${opt}" lộ trong bài dẫn`,
      );
    }
  }
});

test('mỗi câu dẫn có ít nhất một cue của khung ấy', () => {
  // Không có cue thì blank điền được nhiều từ, và câu hỏi có nhiều đáp án đúng.
  for (const c of CANDIDATES) {
    assert.ok(hasCue(c.sentence, c.frame), `${c.sourceId}: thiếu cue cho "${c.frame.word}"`);
  }
});

test('không câu dẫn nào là mẩu tiêu đề hay danh sách dài', () => {
  /*
    Hai lỗi chỉ đọc mới thấy, bộ lọc đầu cho lọt:
    · "Rationalism and scientific inquiry: Encouraging critical thinking, ___
      evidence…" — mẩu tiêu đề có dấu hai chấm, không phải câu văn;
    · chỗ trống nằm giữa danh sách tám dấu phẩy, ngữ cảnh không ràng buộc gì.
  */
  for (const item of ITEMS) {
    assert.ok(!/[:;]/.test(item.passage), `${item.id}: có dấu hai chấm`);
    assert.ok((item.passage.match(/,/g) ?? []).length <= 3, `${item.id}: quá nhiều dấu phẩy`);
    assert.ok(item.passage.split(/\s+/).length >= 16, `${item.id}: quá ít từ`);
  }
});

test('câu dẫn không mở đầu bằng đại từ trỏ ra ngoài câu', () => {
  for (const item of ITEMS) {
    assert.ok(
      !/^(it|he|she|they|this|that|these|those|such|but|and|however|therefore)\b/i.test(item.passage.trim()),
      `${item.id}: mở đầu dựa vào câu trước`,
    );
  }
});

/* ------------------------------------------------- luật của chính bảng từ */

test('trong một khung, không nhiễu nào trùng đáp án', () => {
  for (const f of VOCAB_FRAMES) {
    const words = [f.word, ...f.distractors.map((d) => d.word)];
    assert.equal(new Set(words).size, words.length, `khung "${f.word}" có phương án trùng`);
  }
});

test('mỗi khung có ba nhiễu, có nghĩa ngược, và không dồn hết vào một kiểu sai', () => {
  /*
    LUẬT NÀY ĐÃ ĐƯỢC NỚI SAU KHI NÓ BẮT ĐƯỢC MỘT CA THẬT.

    Bản đầu bắt buộc mọi khung phải có nhiễu `too_strong` hoặc `wrong_register`,
    và nó bắt được khung `contingent` — hai nhiễu đều là nghĩa ngược. Nhưng nhìn
    kỹ thì lỗi nằm ở LUẬT chứ không ở dữ liệu: không phải từ nào cũng có một
    "phiên bản quá mức" tự nhiên, và ép cho có sẽ đẻ ra nhiễu gượng, tức là dữ
    liệu tệ hơn chứ không tốt hơn.

    Ý định thật là "đừng dồn cả ba nhiễu vào một kiểu sai", nên luật viết đúng ý
    định ấy: có nghĩa ngược, và có ít nhất hai kiểu sai khác nhau.
  */
  for (const f of VOCAB_FRAMES) {
    assert.equal(f.distractors.length, 3, `khung "${f.word}"`);
    const whys = f.distractors.map((d) => d.why);
    assert.ok(whys.includes('opposite'), `khung "${f.word}" thiếu nhiễu nghĩa ngược`);
    assert.ok(new Set(whys).size >= 2, `khung "${f.word}" dồn cả ba nhiễu vào một kiểu`);
  }
});

test('phần lớn bảng vẫn có nhiễu "quá mức" — chỗ SAT hay đánh nhất', () => {
  /*
    Nới luật từng khung thì phải giữ áp lực ở mức BẢNG, nếu không bảng sẽ trôi
    dần về phía dễ: mức độ chính là chỗ đề thật hay ăn thua, và một bảng không
    còn nhiễu quá mức là một bảng chỉ còn dạy phân biệt trái/phải.
  */
  const withStrong = VOCAB_FRAMES.filter((f) => f.distractors.some((d) => d.why === 'too_strong'));
  const ratio = withStrong.length / VOCAB_FRAMES.length;
  assert.ok(ratio >= 0.6, `chỉ ${(ratio * 100).toFixed(0)}% khung có nhiễu quá mức`);
});

test('không khung nào để trống cue', () => {
  for (const f of VOCAB_FRAMES) {
    assert.ok(f.cues.length >= 4, `khung "${f.word}" chỉ có ${f.cues.length} cue`);
  }
});

test('đề bằng tiếng Anh, lời giải tiếng Việt', () => {
  const item = ITEMS[0]!;
  assert.ok(!/[àáâãèéêìíòóôõùúýăđĩũơư]/i.test(item.passage), 'bài dẫn phải là tiếng Anh');
  for (const o of item.options) assert.ok(!/[àáâãèéêìíòóôõùúýăđĩũơư]/i.test(o));
  assert.match(item.solutionVi, /[àáâãèéêìíòóôõùúýăđĩũơư]/i);
});

/* ------------------------------------------------------ hàng rào bắt được gì */

test('hàng rào bắt câu thiếu chỗ trống', () => {
  const bad = { ...ITEMS[0]!, passage: ITEMS[0]!.passage.replace(BLANK, 'something') };
  assert.deepEqual(verifyVocabItem(bad), { ok: false, reason: 'no-blank' });
});

test('hàng rào bắt phương án cùng gốc từ', () => {
  const bad = { ...ITEMS[0]!, options: ['precise', 'precisely', 'vague', 'broad'], answerIndex: 0, word: 'precise' };
  assert.deepEqual(verifyVocabItem(bad), { ok: false, reason: 'morphological-overlap' });
});

test('hàng rào bắt answerIndex trỏ sai', () => {
  const item = ITEMS[0]!;
  const wrong = (item.answerIndex + 1) % 4;
  assert.deepEqual(verifyVocabItem({ ...item, answerIndex: wrong }), {
    ok: false,
    reason: 'answer-index-mismatch',
  });
});
