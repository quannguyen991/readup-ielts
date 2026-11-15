import assert from 'node:assert/strict';
import { test } from 'node:test';

import { applyMeaningLang, shortGloss, vietnameseOf } from './meaning-lang';
import type { StudyWord } from './topic-study';

const base: StudyWord = {
  word: '寄付',
  pos: 'danh từ',
  ipa: 'きふ',
  meaningVi: 'quyên góp; đóng góp',
  definitionEn: 'contribution; donation; gift; endowment; offering',
  example: '寄付をしました。',
  collocation: '',
  exampleVi: 'Tôi đã quyên góp.',
  exampleEn: 'I made a donation.',
  band: 'JLPT N3',
  language: 'ja',
  glossLanguage: 'vi',
};
const english: StudyWord = { word: 'habitat', pos: 'noun', ipa: '', meaningVi: 'môi trường sống', definitionEn: 'the natural home of an animal or plant', example: 'x', collocation: '', band: '6-7' };

test('mặc định tiếng Việt: trả lại đúng danh sách, không tạo bản sao', () => {
  const list = [base, english];
  assert.equal(applyMeaningLang(list, 'vi'), list);
});

test('tiếng Anh: từ Nhật dùng nghĩa Anh gọn, giữ nghĩa Việt gốc và đổi câu ví dụ sang tiếng Anh', () => {
  const [w] = applyMeaningLang([base], 'en');
  assert.equal(w!.meaningVi, 'contribution; donation; gift');
  assert.equal(w!.glossLanguage, 'en');
  assert.equal(w!.exampleVi, 'I made a donation.');
  assert.equal(vietnameseOf(w!), 'quyên góp; đóng góp');
  assert.equal(w!.word, '寄付');
});

test('tiếng Anh: từ tiếng Anh dùng nguyên định nghĩa tiếng Anh (Anh–Anh)', () => {
  const [w] = applyMeaningLang([english], 'en');
  assert.equal(w!.meaningVi, 'the natural home of an animal or plant');
  assert.equal(vietnameseOf(w!), 'môi trường sống');
});

test('từ không có nghĩa tiếng Anh thì giữ nghĩa tiếng Việt, không thẻ trống', () => {
  const noEn = { ...english, definitionEn: '' };
  const [w] = applyMeaningLang([noEn], 'en');
  assert.equal(w, noEn);
  assert.equal(w!.meaningVi, 'môi trường sống');
});

test('áp hai lần không làm mất nghĩa Việt gốc', () => {
  const once = applyMeaningLang([base], 'en');
  const twice = applyMeaningLang(once, 'en');
  assert.equal(vietnameseOf(twice[0]!), 'quyên góp; đóng góp');
});

test('shortGloss cắt ở ranh giới nghĩa và không cắt giữa chừng', () => {
  assert.equal(shortGloss('a; b; c; d'), 'a; b; c');
  assert.equal(shortGloss('single'), 'single');
  const long = shortGloss('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa; bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb; cccccccccccccc');
  assert.ok(long.length <= 100 && !long.endsWith(';'));
});
