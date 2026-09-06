import test from 'node:test';
import assert from 'node:assert/strict';

import { blueprintFor } from './blueprint';
import { buildBestRuleQuestionSet, buildMixedRuleQuestionSet, buildRuleQuestionSet } from './build-set';
import { verifyQuestion, verifySet } from './verify';

/**
 * Canh dây chuyền dựng đề bằng luật.
 *
 * Đây là bộ đề mà người học GẶP TRONG PHÒNG THI của app, nên ràng buộc ở đây là
 * ràng buộc về đề thi chứ không phải về mã: đi thành khối như đề thật, mọi câu
 * kiểm được từ bài, và không có đường nào chạm tới mạng.
 */

const PARAGRAPHS = [
  'The Great Barrier Reef stretches for more than 2,300 kilometres along the northeastern coastline of Australia and contains nearly 3,000 separate reef structures. Marine scientists describe the system as the largest living formation on the planet, and most of them agree that its scale makes coordinated protection unusually difficult. Early surveys began in 1928, when a British expedition spent a full year on a single island.',
  'Rising ocean temperatures have caused repeated bleaching episodes across the northern sections. Corals expel the tiny algae that supply them with food whenever heat stress becomes prolonged, and recovery usually requires several undisturbed years. Researchers found that the worst affected areas lost more than half of their shallow coral cover within two seasons.',
  'Tourism produces substantial revenue for coastal communities that depend on visiting divers. Operators argue that visitor fees support monitoring programmes no government budget would otherwise fund, and they often claim that regulated access is safer than an outright ban. Conservationists reject this reasoning and say concentrated boat traffic damages precisely the habitats those programmes measure.',
  'Regulators have used rotating closures that prevent access to particular sections for a fixed period. Preliminary surveys showed that closed areas gained juvenile fish far more quickly than continuously open ones. Whether such benefits survive the next prolonged heatwave remains entirely uncertain, and the method has never been tested during a severe summer.',
  'Water quality is affected by farming on the mainland, where fertiliser and sediment reach the sea through a network of rivers. A national plan introduced in 2009 reduced nitrogen runoff by roughly 25 per cent, although progress since then has been slow. Farmers received money to change their methods, and many of them accepted the scheme quickly.',
  'Aboriginal Australian and Torres Strait Islander peoples have used the reef for thousands of years, and their traditional knowledge is increasingly important to modern management. Rangers now record species counts that scientists previously obtained only through expensive boat surveys. This work has proved cheaper and often more accurate than the methods it replaced.',
  'Artificial structures have been placed on damaged sections to help new corals attach. The technique is common in the Caribbean but remains rare in Australian waters, mainly because the reef is so large that any single project covers a tiny fraction of it. Several teams reported early success, though none of them has yet published long-term results.',
];

const ARTICLE = { id: 'reef-test-1', title: 'The Great Barrier Reef', paragraphs: PARAGRAPHS };

test('mọi câu trong bộ đề đều qua được hàng rào kiểm câu', () => {
  const set = buildBestRuleQuestionSet(ARTICLE, 2);
  assert.ok(set.questions.length > 0, 'không dựng được câu nào');

  for (const q of set.questions) {
    const verdict = verifyQuestion(q, PARAGRAPHS);
    assert.ok(verdict.ok, `câu ${q.orderIndex + 1} (${q.type}) hỏng: ${!verdict.ok && verdict.reason}`);
  }
  assert.ok(verifySet(set.questions, PARAGRAPHS).ok, 'cả bộ không qua được hàng rào bộ');
});

/*
  Lý do cả dây chuyền tồn tại: đề thật đi thành KHỐI. Một dạng xuất hiện ở hai
  chỗ rời nhau nghĩa là đã trộn lẫn trở lại, và người luyện mất đúng cái nhịp
  làm bài mà phòng thi đòi.
*/
test('bộ đề đi thành khối: mỗi dạng nằm liền một mạch', () => {
  const types = buildBestRuleQuestionSet(ARTICLE, 2).questions.map((q) => q.type);
  const runs: string[] = [];
  for (const t of types) if (runs[runs.length - 1] !== t) runs.push(t);
  assert.equal(new Set(runs).size, runs.length, `dạng bị cắt thành nhiều khối: ${types.join(', ')}`);
});

test('cùng một bài thì lần nào cũng ra đúng bộ đề đó', () => {
  const a = buildBestRuleQuestionSet(ARTICLE, 2);
  const b = buildBestRuleQuestionSet(ARTICLE, 2);
  assert.deepEqual(
    a.questions.map((q) => [q.type, q.prompt, q.correctAnswer]),
    b.questions.map((q) => [q.type, q.prompt, q.correctAnswer]),
  );
});

test('bài khác thì ra đề khác', () => {
  const other = { ...ARTICLE, id: 'reef-test-2' };
  const a = buildBestRuleQuestionSet(ARTICLE, 2).questions.map((q) => q.prompt).join('|');
  const b = buildBestRuleQuestionSet(other, 2).questions.map((q) => q.prompt).join('|');
  assert.notEqual(a, b);
});

/*
  Mười ba nhận định cùng nhãn TRUE thì mỗi câu đều hợp lệ mà cả khối vẫn đoán
  được: chọn TRUE mười ba lần là xong.
*/
test('khối TRUE/FALSE/NOT GIVEN dùng từ hai nhãn trở lên', () => {
  for (const pos of [1, 2, 3] as const) {
    const qs = buildBestRuleQuestionSet(ARTICLE, pos).questions.filter(
      (q) => q.type === 'true_false_not_given' || q.type === 'yes_no_not_given',
    );
    if (qs.length < 3) continue;
    const labels = new Set(qs.map((q) => q.correctAnswer));
    assert.ok(labels.size >= 2, `vị trí ${pos} chỉ có một nhãn: ${[...labels].join(', ')}`);
  }
});

/*
  Đáp án điền từ phải là chữ NGƯỜI HỌC TÌM ĐƯỢC TRONG BÀI, và phải là từ mang
  nghĩa. Khoét trúng `another` hay `however` thì đề thành bài ngữ pháp: đoán được
  bằng cấu trúc câu mà không cần mở bài ra.
*/
test('đáp án điền từ là từ mang nghĩa, có thật trong bài', () => {
  const body = PARAGRAPHS.join(' ').toLowerCase();
  for (const pos of [1, 2, 3] as const) {
    for (const q of buildBestRuleQuestionSet(ARTICLE, pos).questions) {
      if (!['sentence_completion', 'summary_completion'].includes(q.type)) continue;
      assert.ok(body.includes(q.correctAnswer.toLowerCase()), `"${q.correctAnswer}" không có trong bài`);
      assert.ok(q.prompt.includes('________'), `câu ${q.orderIndex + 1} thiếu chỗ trống`);
      assert.ok(
        !['another', 'however', 'because', 'therefore'].includes(q.correctAnswer.toLowerCase()),
        `khoét trúng từ chức năng: ${q.correctAnswer}`,
      );
    }
  }
});

/*
  Nhận định NOT GIVEN phải đọc như một câu bình thường.

  Bản trước ghép vị ngữ của bài khác vào chủ ngữ bài này và ra "The Great Barrier
  Reef are solar energy, wind power, and hydropower" — người học khoanh NOT GIVEN
  mà không cần mở bài, nên câu ấy không đo được gì.
*/
test('nhận định NOT GIVEN không dùng lại từ nội dung của bài', () => {
  const body = new Set(PARAGRAPHS.join(' ').toLowerCase().match(/[a-z]{5,}/g) ?? []);
  for (const pos of [1, 2, 3] as const) {
    for (const q of buildBestRuleQuestionSet(ARTICLE, pos).questions) {
      if (!q.correctAnswer.startsWith('NOT GIVEN')) continue;
      const words = (q.prompt.toLowerCase().match(/[a-z]{5,}/g) ?? []).filter((w) => !body.has(w));
      assert.ok(words.length > 0, `nhận định NOT GIVEN toàn từ có sẵn trong bài: ${q.prompt}`);
    }
  }
});

test('bài quá ngắn thì trả bộ ngắn, không ném lỗi', () => {
  const tiny = { id: 'tiny', title: 'Tiny', paragraphs: ['Corals are small.'] };
  const set = buildBestRuleQuestionSet(tiny, 1);
  assert.ok(set.questions.length < 13);
});

/*
  Ràng buộc CỦA NGƯỜI DÙNG, không phải của mã: hết tiền gọi API, nên dây chuyền
  phải dựng được đề khi không có mạng. Chặn `fetch` rồi dựng lại là cách duy nhất
  chứng minh điều đó chứ không phải tin lời chú thích.
*/
test('dựng được đề khi KHÔNG có mạng', () => {
  const real = globalThis.fetch;
  globalThis.fetch = (() => {
    throw new Error('không được gọi mạng khi dựng đề');
  }) as typeof fetch;
  try {
    assert.ok(buildBestRuleQuestionSet(ARTICLE, 3).questions.length > 0);
  } finally {
    globalThis.fetch = real;
  }
});

test('bộ luyện xen kẽ trộn dạng, không đi thành khối', () => {
  const questions = buildMixedRuleQuestionSet(ARTICLE).questions;
  assert.ok(questions.length >= 6, `chỉ trộn được ${questions.length} câu`);

  const runs: string[] = [];
  for (const q of questions) if (runs[runs.length - 1] !== q.type) runs.push(q.type);
  assert.ok(
    runs.length > new Set(questions.map((q) => q.type)).size,
    `vẫn đi thành khối: ${questions.map((q) => q.type).join(', ')}`,
  );
});

test('lắp theo một bản thiết kế cho trước thì không vượt số câu của thiết kế', () => {
  const bp = blueprintFor(1, ARTICLE.id);
  const set = buildRuleQuestionSet(ARTICLE, bp);
  assert.ok(set.questions.length <= 13);
  for (const q of set.questions) {
    assert.ok(bp.blocks.some((b) => b.type === q.type), `dạng ${q.type} không có trong thiết kế`);
  }
});
