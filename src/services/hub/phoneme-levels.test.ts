import assert from 'node:assert/strict';
import { test } from 'node:test';

import { PHONEMES } from './phonemes';
import { LEVEL_ORDER, currentStage, gridSections, levelOf, nextToPractice, practicedCount, stageProgress } from './phoneme-levels';

test('mọi âm có độ khó, mỗi chặng đủ lớn', () => {
  for (const p of PHONEMES) assert.ok(['easy', 'medium', 'hard'].includes(levelOf(p.symbol)), `${p.symbol} chưa có độ khó`);
  for (const level of LEVEL_ORDER) {
    const { total } = stageProgress(level, {});
    assert.ok(total >= 10, `${level}: chỉ ${total} âm`);
  }
  const sum = LEVEL_ORDER.reduce((n, l) => n + stageProgress(l, {}).total, 0);
  assert.equal(sum, PHONEMES.length);
});

test('các âm đặc trưng khó với người Việt xếp đúng chặng', () => {
  for (const s of ['θ', 'ð', 'ʃ', 'ʒ', 'dʒ', 'r', 'ɪ', 'æ', 'ə']) assert.equal(levelOf(s), 'hard', `${s} phải là Khó`);
  for (const s of ['iː', 'uː', 'b', 'm', 'h']) assert.equal(levelOf(s), 'easy', `${s} phải là Dễ`);
});

test('lưới IPA phân hoạch đúng: mỗi âm xuất hiện đúng một lần, không thiếu', () => {
  const all = gridSections().flatMap((s) => s.rows.flatMap((r) => r.symbols));
  assert.equal(all.length, PHONEMES.length, `lưới có ${all.length} ô`);
  assert.equal(new Set(all).size, all.length, 'có âm bị lặp trong lưới');
  for (const p of PHONEMES) assert.ok(all.includes(p.symbol), `${p.symbol} không có trong lưới`);
  for (const section of gridSections()) for (const row of section.rows) assert.ok(row.symbols.length > 0, `${section.id}/${row.label} trống`);
});

test('nguyên âm dài có dấu ː, nguyên âm ngắn thì không', () => {
  const vowels = gridSections().find((s) => s.id === 'vowels')!;
  assert.ok(vowels.rows[0]!.symbols.every((s) => s.includes('ː')));
  assert.ok(vowels.rows[1]!.symbols.every((s) => !s.includes('ː')));
});

test('chặng hiện tại và âm nên luyện tiếp đi từ dễ đến khó', () => {
  assert.equal(currentStage({}), 'easy');
  assert.equal(nextToPractice({})!.symbol, PHONEMES.find((p) => levelOf(p.symbol) === 'easy')!.symbol);
  const allEasy = Object.fromEntries(PHONEMES.filter((p) => levelOf(p.symbol) === 'easy').map((p) => [p.symbol, 90]));
  assert.equal(currentStage(allEasy), 'medium');
  assert.equal(levelOf(nextToPractice(allEasy)!.symbol), 'medium');
  const everything = Object.fromEntries(PHONEMES.map((p) => [p.symbol, 90]));
  assert.equal(nextToPractice(everything), undefined);
  assert.equal(currentStage(everything), 'hard');
  assert.equal(practicedCount(everything), PHONEMES.length);
  assert.equal(practicedCount({}), 0);
});
