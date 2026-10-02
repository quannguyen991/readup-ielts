import assert from 'node:assert/strict';
import { test } from 'node:test';

import { levelById } from '@/data/learning-path';
import { getPoiContent } from '@/data/travel/pois';
import { MAX_CHOSEN_DECKS, cleanDecks, deckCatalog, pathVocabDecks, resolveFocusDecks, toggleDeck } from './decks';
import { pickCustomsQuestions, pickVisitQuestions } from './pick';

const NOW = Date.parse('2026-10-02T09:00:00Z');

test('danh mục bộ từ: có cả 50 chủ đề và bộ Nghe, không trùng mã', () => {
  const cat = deckCatalog();
  assert.ok(cat.some((d) => d.group === 'topic'));
  assert.ok(cat.some((d) => d.group === 'listening' && d.slug.startsWith('listening-')));
  assert.equal(new Set(cat.map((d) => d.slug)).size, cat.length);
});

test('ưu tiên bộ từ: tự chọn, rồi theo lộ trình, rồi không có', () => {
  assert.deepEqual(resolveFocusDecks({ chosen: ['food'], path: ['tourism'] }), { decks: ['food'], source: 'chosen' });
  assert.deepEqual(resolveFocusDecks({ chosen: [], path: ['tourism'] }), { decks: ['tourism'], source: 'path' });
  assert.deepEqual(resolveFocusDecks({ chosen: ['khong-co'], path: [] }), { decks: [], source: 'none' });
  assert.deepEqual(resolveFocusDecks({}), { decks: [], source: 'none' });
});

test('chọn bộ: bật / tắt, có trần, bỏ mã không tồn tại', () => {
  assert.deepEqual(toggleDeck(['food'], 'tourism'), ['food', 'tourism']);
  assert.deepEqual(toggleDeck(['food', 'tourism'], 'food'), ['tourism']);
  const all = deckCatalog().slice(0, MAX_CHOSEN_DECKS + 3).map((d) => d.slug);
  let list: string[] = [];
  for (const s of all) list = toggleDeck(list, s);
  assert.equal(list.length, MAX_CHOSEN_DECKS);
  assert.equal(cleanDecks(['food', 'reply-cafe', 'x']).length, 1);
});

test('theo lộ trình: bài từ vựng CHƯA xong lên trước; không biết trình độ thì rỗng', () => {
  const level = levelById('ielts-45')!;
  const vocabIds = level.parts.flatMap((p) => p.nodes).filter((n) => n.target.kind === 'vocab').map((n) => n.id);
  assert.ok(vocabIds.length >= 2);
  const firstDone = new Set([vocabIds[0]!]);
  const none = pathVocabDecks(level, () => false, 3);
  const skipFirst = pathVocabDecks(level, (id) => firstDone.has(id), 3);
  assert.equal(none.length, 3);
  assert.notEqual(skipFirst[0], none[0]);
  assert.deepEqual(pathVocabDecks(null, () => false), []);
  assert.deepEqual(pathVocabDecks(undefined, () => false), []);
});

const wordsFrom = (qs: ReturnType<typeof pickVisitQuestions>, deck: string) => qs.filter((q) => q.info && q.deck === deck).length;

test('câu hỏi: có bộ chọn thì từ lấy từ bộ chọn trước, không chọn thì theo bộ của địa điểm', () => {
  const poi = getPoiContent('singapore-hawker')!;
  const base = { poi, runNo: 1, nowMs: NOW, count: 7 };
  const plain = pickVisitQuestions(base);
  assert.equal(wordsFrom(plain, 'economy'), 0);
  const focused = pickVisitQuestions({ ...base, focusDecks: ['economy'] });
  assert.ok(wordsFrom(focused, 'economy') >= 3, `chỉ ${wordsFrom(focused, 'economy')} từ từ bộ đã chọn`);
  assert.equal(focused.length, plain.length);
});

test('câu hỏi: bộ chọn hỏng (mã lạ hoặc rỗng) không làm sập, quay về bộ của địa điểm', () => {
  const poi = getPoiContent('singapore-hawker')!;
  const a = pickVisitQuestions({ poi, runNo: 1, nowMs: NOW });
  const b = pickVisitQuestions({ poi, runNo: 1, nowMs: NOW, focusDecks: [] });
  const c = pickVisitQuestions({ poi, runNo: 1, nowMs: NOW, focusDecks: ['khong-co-bo-nay'] });
  assert.deepEqual(a.map((q) => q.id), b.map((q) => q.id));
  assert.ok(c.length > 0);
});

test('câu hỏi: từ vừa làm trong 24 giờ vẫn xuống cuối dù thuộc bộ đã chọn', () => {
  const poi = getPoiContent('singapore-hawker')!;
  const first = pickVisitQuestions({ poi, runNo: 1, nowMs: NOW, focusDecks: ['economy'] });
  const seen: Record<string, string> = {};
  for (const q of first) seen[q.key] = new Date(NOW - 3600_000).toISOString();
  const second = pickVisitQuestions({ poi, runNo: 2, nowMs: NOW, focusDecks: ['economy'], seen });
  const firstKeys = new Set(first.map((q) => q.key));
  const repeats = second.filter((q) => firstKeys.has(q.key)).length;
  assert.ok(repeats <= 1, `${repeats} câu lặp`);
});

test('hải quan: bộ ưu tiên thay cho bộ đã học', () => {
  const qs = pickCustomsQuestions({ studiedDecks: ['food'], focusDecks: ['economy'], day: '2026-10-02', run: 1, nowMs: NOW });
  const decks = new Set(qs.filter((q) => q.info).map((q) => q.deck));
  assert.ok(!decks.has('food'));
});
