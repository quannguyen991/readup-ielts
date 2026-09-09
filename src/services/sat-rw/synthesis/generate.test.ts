import test from 'node:test';
import assert from 'node:assert/strict';

import { allSynthesisItems, buildSynthesisItem, subjectsWithUnusableGoals } from './generate';
import { SUBJECTS } from './subjects';
import { verifySynthesisItem } from './verify';

const ITEMS = allSynthesisItems();

test('mọi mục đích khai ra đều dựng được câu', () => {
  /*
    Bản đầu khai 24 mục đích mà chỉ dựng được 6, vì một ghi chú mang nhiều nhãn
    nên phần lớn mục đích khớp hai ghi chú. Test này giữ cho lỗi ấy không quay lại
    khi ai đó thêm chủ đề mới: bảng lớn dần mà số câu không tăng là kiểu hỏng
    không ai để ý cho tới lúc đếm.
  */
  const declared = SUBJECTS.reduce((n, s) => n + s.goals.length, 0);
  const unusable = subjectsWithUnusableGoals();
  assert.deepEqual(unusable, [], `mục đích hỏng: ${JSON.stringify(unusable)}`);
  assert.equal(ITEMS.length, declared);
});

test('MỌI câu sinh ra đều qua hàng rào', () => {
  for (const item of ITEMS) {
    const v = verifySynthesisItem(item);
    assert.equal(v.ok, true, `${item.id} trượt: ${v.ok ? '' : v.reason}`);
  }
});

test('tất định: cùng chủ đề cùng mục đích ra cùng câu', () => {
  const a = buildSynthesisItem('hollow-bridge', 'physical')!;
  const b = buildSynthesisItem('hollow-bridge', 'physical')!;
  assert.deepEqual(a, b);
});

test('bốn phương án, một đáp án, ba nhiễu có tên', () => {
  for (const item of ITEMS) {
    assert.equal(item.options.length, 4, item.id);
    assert.equal(item.optionWhy.filter((w) => w === null).length, 1, item.id);
    assert.equal(item.optionWhy[item.answerIndex], null, item.id);
    assert.equal(item.optionWhy.filter((w) => w === 'accurate_but_irrelevant').length, 2, item.id);
    assert.equal(item.optionWhy.filter((w) => w === 'not_in_notes').length, 1, item.id);
  }
});

test('hai nhiễu accurate_but_irrelevant thật sự nằm trong ghi chú', () => {
  /*
    Đây là cái bẫy chính của dạng này: phương án sai vẫn là một SỰ THẬT, in ngay
    trên đề. Nếu nhiễu không có trong ghi chú thì người học loại nó bằng cách dò
    chuỗi, và bẫy biến mất.
  */
  for (const item of ITEMS) {
    const notes = new Set(item.notes);
    for (const [i, why] of item.optionWhy.entries()) {
      if (why !== 'accurate_but_irrelevant') continue;
      assert.ok(notes.has(item.options[i]!), `${item.id}: nhiễu không có trong ghi chú`);
    }
  }
});

test('nhiễu not_in_notes thật sự KHÔNG nằm trong ghi chú', () => {
  for (const item of ITEMS) {
    const notes = new Set(item.notes);
    for (const [i, why] of item.optionWhy.entries()) {
      if (why !== 'not_in_notes') continue;
      assert.ok(!notes.has(item.options[i]!), `${item.id}: câu bịa lại có trong ghi chú`);
    }
  }
});

test('trong một chủ đề, nhiễu KHÔNG lặp lại y hệt qua mọi mục đích', () => {
  /*
    Sáu mục đích dùng chung một tập ghi chú. Lấy cố định hai ghi chú đầu làm nhiễu
    thì làm hết sáu câu sẽ gặp lại đúng hai phương án ấy sáu lần — người học nhớ
    mặt chúng và loại bằng trí nhớ chứ không bằng mục đích.
  */
  for (const subject of SUBJECTS) {
    const sets = ITEMS.filter((i) => i.subjectSlug === subject.slug).map((i) =>
      i.optionWhy
        .map((w, k) => (w === 'accurate_but_irrelevant' ? i.options[k]! : null))
        .filter(Boolean)
        .sort()
        .join('|'),
    );
    assert.ok(new Set(sets).size > 1, `${subject.slug}: nhiễu giống nhau ở mọi mục đích`);
  }
});

test('đáp án luôn là ghi chú mang đúng nhãn mục đích', () => {
  for (const item of ITEMS) {
    const subject = SUBJECTS.find((s) => s.slug === item.subjectSlug)!;
    const fact = subject.facts.find((f) => f.text === item.options[item.answerIndex]);
    assert.ok(fact, `${item.id}: đáp án không có trong ghi chú`);
    assert.ok(fact!.tags.includes(item.goalTag), `${item.id}: đáp án sai nhãn`);
  }
});

/* --------------------------------------------------- luật của bảng dữ liệu */

test('trong một chủ đề, mỗi nhãn chỉ xuất hiện đúng một lần', () => {
  for (const s of SUBJECTS) {
    const all = s.facts.flatMap((f) => f.tags);
    const dup = all.filter((t, i) => all.indexOf(t) !== i);
    assert.deepEqual([...new Set(dup)], [], `${s.slug}: nhãn lặp ${dup.join(',')}`);
  }
});

test('mỗi chủ đề có ít nhất hai câu bịa để nhiễu không lặp', () => {
  for (const s of SUBJECTS) {
    assert.ok(s.fabricated.length >= 2, `${s.slug} chỉ có ${s.fabricated.length} câu bịa`);
  }
});

test('ghi chú viết tiếng Anh, lời giải tiếng Việt', () => {
  const item = ITEMS[0]!;
  for (const n of item.notes) assert.ok(!/[àáâãèéêìíòóôõùúýăđĩũơư]/i.test(n));
  assert.ok(!/[àáâãèéêìíòóôõùúýăđĩũơư]/i.test(item.stem));
  assert.match(item.solutionVi, /[àáâãèéêìíòóôõùúýăđĩũơư]/i);
});

test('chủ đề hoặc mục đích lạ thì trả null, không ném lỗi', () => {
  assert.equal(buildSynthesisItem('khong-co-chu-de-nay', 'physical'), null);
  // Nhãn không nằm trong danh sách mục đích của chủ đề ấy.
  assert.equal(buildSynthesisItem('hollow-bridge', 'khong-phai-nhan' as never), null);
});

test('hàng rào tính lại đáp án chứ không tin answerIndex của bộ sinh', () => {
  const item = ITEMS[0]!;
  const wrong = (item.answerIndex + 1) % 4;
  assert.deepEqual(verifySynthesisItem({ ...item, answerIndex: wrong }), {
    ok: false,
    reason: 'answer-index-mismatch',
  });
});
