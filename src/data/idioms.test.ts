import assert from 'node:assert/strict';
import { test } from 'node:test';

import { IDIOMS, IDIOM_THEMES, idiomsOfTheme, searchIdioms } from './idioms';

test('100 thành ngữ, mỗi chủ đề đúng 10, không trùng', () => {
  assert.equal(IDIOMS.length, 100);
  const phrases = IDIOMS.map((i) => i.phrase.toLowerCase());
  assert.equal(new Set(phrases).size, phrases.length, 'có thành ngữ bị trùng');
  for (const t of IDIOM_THEMES) assert.equal(idiomsOfTheme(t.id).length, 10, `${t.id} không đủ 10`);
  const themeIds = new Set(IDIOM_THEMES.map((t) => t.id));
  for (const i of IDIOMS) assert.ok(themeIds.has(i.theme), `${i.phrase}: chủ đề lạ ${i.theme}`);
});

test('mỗi mục có nghĩa tiếng Việt và câu ví dụ hoàn chỉnh', () => {
  for (const i of IDIOMS) {
    assert.ok(i.vi.trim().length >= 3, `${i.phrase}: thiếu nghĩa`);
    assert.ok(i.example.trim().length >= 15, `${i.phrase}: ví dụ quá ngắn`);
    assert.match(i.example, /[.!?]$/, `${i.phrase}: ví dụ không kết thúc bằng dấu câu`);
    assert.match(i.example, /^[A-Z]/, `${i.phrase}: ví dụ không viết hoa đầu câu`);
  }
});

test('ví dụ có chứa ít nhất một từ nội dung của thành ngữ', () => {
  const stop = new Set(['a', 'an', 'the', 'of', 'in', 'on', 'to', 'it', 'its', "it's", 'is', 'at', 'your', 'my', 'you', 'with', 'for', 'and', 'can', 'than', 'no', 'not']);
  for (const i of IDIOMS) {
    const words = i.phrase.toLowerCase().split(/[\s,]+/).filter((w) => w.length > 2 && !stop.has(w));
    const ex = i.example.toLowerCase();
    // chấp nhận biến đổi động từ: so khớp theo gốc 4 chữ cái đầu
    assert.ok(words.some((w) => ex.includes(w.slice(0, Math.min(4, w.length)))), `${i.phrase}: ví dụ không dùng thành ngữ`);
  }
});

test('tìm kiếm không dấu theo thành ngữ và nghĩa', () => {
  assert.ok(searchIdioms('spill').some((i) => i.phrase === 'spill the beans'));
  assert.ok(searchIdioms('bi mat').some((i) => i.phrase === 'spill the beans'));
  assert.ok(searchIdioms('Mưa như trút').some((i) => i.phrase === "it's raining cats and dogs"));
  assert.equal(searchIdioms('').length, 100);
  assert.equal(searchIdioms('zzzzqq').length, 0);
});
