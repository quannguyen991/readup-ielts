import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  SAT_VOCAB_CATEGORY_BLURB,
  SAT_VOCAB_CATEGORY_LABEL,
  SAT_VOCAB_CATEGORY_ORDER,
  SAT_VOCAB_TERMS,
  groupSatVocabByCategory,
  satVocabLemma,
} from './sat-math-vocab';

/**
 * Kho từ vựng SAT Math soạn tay, nhưng vẫn phải bị soi như mọi kho dữ liệu đi
 * thẳng vào bundle — một mục thiếu nghĩa tiếng Việt hay ví dụ rỗng thì người
 * học gặp ngay ô trống, không ai báo cho họ biết vì sao.
 */

test('có đủ số lượng, và mỗi category đều có ít nhất vài mục', () => {
  assert.ok(SAT_VOCAB_TERMS.length >= 60, `Chỉ có ${SAT_VOCAB_TERMS.length} mục, quá mỏng cho một chuyên đề riêng.`);
  for (const category of SAT_VOCAB_CATEGORY_ORDER) {
    const n = SAT_VOCAB_TERMS.filter((t) => t.category === category).length;
    assert.ok(n >= 5, `Category "${category}" chỉ có ${n} mục.`);
  }
});

test('mọi category dùng trong dữ liệu đều có nhãn và mô tả', () => {
  for (const category of SAT_VOCAB_CATEGORY_ORDER) {
    assert.ok(SAT_VOCAB_CATEGORY_LABEL[category]?.trim(), `Thiếu nhãn cho "${category}"`);
    assert.ok(SAT_VOCAB_CATEGORY_BLURB[category]?.trim(), `Thiếu mô tả cho "${category}"`);
  }
  // Không có category NÀO trong dữ liệu nằm ngoài SAT_VOCAB_CATEGORY_ORDER —
  // nếu có thì groupSatVocabByCategory() sẽ âm thầm bỏ sót cả nhóm đó.
  for (const t of SAT_VOCAB_TERMS) {
    assert.ok(
      SAT_VOCAB_CATEGORY_ORDER.includes(t.category),
      `"${t.term}" thuộc category "${t.category}", không có trong SAT_VOCAB_CATEGORY_ORDER`,
    );
  }
});

test('không trùng term TRONG cùng một category', () => {
  /*
    Trùng GIỮA các category là CÓ CHỦ Ý: "range" của hàm số (advanced_math) và
    "range" của tập dữ liệu (problem_solving_data) là hai khái niệm khác nhau,
    và người học cần biết một từ có thể mang hai nghĩa tuỳ ngữ cảnh. Test này
    chỉ cấm trùng NGAY TRONG một category, nơi trùng chắc chắn là lỗi copy-paste.
  */
  for (const category of SAT_VOCAB_CATEGORY_ORDER) {
    const seen = new Set<string>();
    for (const t of SAT_VOCAB_TERMS.filter((x) => x.category === category)) {
      const key = t.term.trim().toLowerCase();
      assert.ok(!seen.has(key), `"${key}" lặp lại trong category "${category}"`);
      seen.add(key);
    }
  }
});

test('mọi mục đủ bốn trường, không rỗng', () => {
  for (const t of SAT_VOCAB_TERMS) {
    for (const field of ['term', 'meaningVi', 'definitionEn', 'example'] as const) {
      assert.ok(String(t[field] ?? '').trim() !== '', `"${t.term}" (${t.category}) thiếu ${field}`);
    }
  }
});

test('nghĩa tiếng Việt không phải bản chép lại định nghĩa tiếng Anh', () => {
  for (const t of SAT_VOCAB_TERMS) {
    assert.notEqual(
      t.meaningVi.trim().toLowerCase(),
      t.definitionEn.trim().toLowerCase(),
      `"${t.term}" để nguyên tiếng Anh ở ô nghĩa`,
    );
  }
});

test('câu ví dụ chứa chính term đang dạy', () => {
  /*
    So bằng bốn ký tự đầu của TỪ ĐẦU TIÊN trong term, không so cả cụm — cụm dài
    như "the value of x that satisfies" hiếm khi lặp lại y nguyên trong câu ví
    dụ ngắn, nhưng "value" hay "satisf(y/ies)" thì có. Bốn ký tự đủ chặt để bắt
    ví dụ lạc đề mà không bắt oan cách diễn đạt lại tự nhiên.
  */
  const bad: string[] = [];
  for (const t of SAT_VOCAB_TERMS) {
    const firstWord = t.term.toLowerCase().split(/\s+/)[0]!.replace(/[^a-z]/g, '');
    const stem = firstWord.slice(0, 4);
    if (stem.length < 4) continue;
    const example = t.example.toLowerCase().replace(/[^a-z ]/g, '');
    if (!example.includes(stem)) bad.push(`${t.category}/${t.term}`);
  }
  assert.deepEqual(bad, [], `${bad.length} ví dụ không chứa từ đang dạy: ${bad.join(', ')}`);
});

test('gộp theo category giữ đủ số mục và đúng thứ tự đã khai', () => {
  const groups = groupSatVocabByCategory();
  const total = groups.reduce((sum, g) => sum + g.terms.length, 0);
  assert.equal(total, SAT_VOCAB_TERMS.length, 'gộp theo category làm rơi mất mục');

  const order = groups.map((g) => SAT_VOCAB_CATEGORY_ORDER.indexOf(g.category));
  for (let i = 1; i < order.length; i += 1) {
    assert.ok(order[i]! > order[i - 1]!, 'nhóm category không theo đúng SAT_VOCAB_CATEGORY_ORDER');
  }
});

test('satVocabLemma giữ nguyên cụm từ, không cắt đuôi như lemmatize thường', () => {
  /*
    Đây là lý do satVocabLemma() tồn tại thay vì dùng lemmatize() có sẵn: hàm
    đó cắt đuôi động từ bằng regex, và với một cụm nhiều từ nó sẽ nuốt luôn
    khoảng trắng — "at least" phải ra "at least", không phải "atleast".
  */
  assert.equal(satVocabLemma('at least'), 'at least');
  assert.equal(satVocabLemma('  Quadratic Equation  '), 'quadratic equation');
  assert.equal(satVocabLemma('is a factor of'), 'is a factor of');
});

test('mọi lemma trong bộ đều duy nhất (không hai mục cùng khoá lưu sổ từ)', () => {
  /*
    Khác với test "trùng term trong category" ở trên: đây kiểm trùng TOÀN BỘ
    bộ, vì khoá lưu sổ từ (`satVocabLemma`) không phân biệt category — hai mục
    "range" ở hai category khác nhau CÙNG map vào một khoá "range", và
    `saveWord` sẽ coi chúng là MỘT từ (dedup theo lemma). Test này không cấm
    điều đó — nó chỉ xác nhận số lượng khoá trùng đúng bằng số lần "range" xuất
    hiện, để không có collision nào KHÁC lẻn vào mà không ai để ý.
  */
  const byLemma = new Map<string, number>();
  for (const t of SAT_VOCAB_TERMS) {
    const key = satVocabLemma(t.term);
    byLemma.set(key, (byLemma.get(key) ?? 0) + 1);
  }
  const collisions = [...byLemma.entries()].filter(([, n]) => n > 1);
  assert.deepEqual(
    collisions.map(([k]) => k),
    ['range'],
    `Có khoá lưu sổ từ trùng ngoài dự kiến: ${collisions.map(([k, n]) => `${k}×${n}`).join(', ')}`,
  );
});
