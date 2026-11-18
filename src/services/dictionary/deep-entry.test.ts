import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildDeepIndex,
  familyKey,
  highlightParts,
  lookupDeep,
  nearbyWords,
  normalizePos,
  suggestDeep,
  usIpaFrom,
  type RawWord,
} from './deep-entry';
import { loadDeepIndex } from './deep-loader';

const mini: RawWord[] = [
  { word: 'resilient', pos: 'adjective', ipa: '/rɪˈzɪliənt/', meaningVi: 'kiên cường', definitionEn: 'able to recover quickly from difficulties', example: 'The economy proved resilient.', collocation: 'resilient economy', cefr: 'B2', band: '6-7', synonyms: ['tough'], antonyms: ['fragile'], src: 'deck' },
  { word: 'resilient', pos: 'adjective', ipa: '/rɪˈzɪliənt/', meaningVi: 'có sức bật', definitionEn: 'Able to recover quickly from difficulties or shocks.', example: 'Children are resilient.', cefr: 'B2', src: 'deck' },
  { word: 'resilience', pos: 'noun', ipa: '/rɪˈzɪliəns/', meaningVi: 'khả năng phục hồi', definitionEn: 'the ability to recover', example: 'Her resilience helped.', cefr: 'C1', src: 'deck' },
  { word: 'tough', pos: 'adjective', meaningVi: 'cứng rắn', src: 'deck' },
  { word: 'present', pos: 'verb', meaningVi: 'trình bày', src: 'deck' },
  { word: 'press', pos: 'verb', meaningVi: 'ấn', src: 'deck' },
  { word: 'presence', pos: 'noun', meaningVi: 'sự hiện diện', src: 'deck' },
  { word: 'university', pos: 'noun', meaningVi: 'đại học', src: 'deck' },
  { word: 'universe', pos: 'noun', meaningVi: 'vũ trụ', src: 'deck' },
  { word: 'build resilient teams', pos: 'phrase', meaningVi: 'x', src: 'deck' },
  { word: 'nihongo', language: 'ja', meaningVi: 'tiếng Nhật' },
  { word: 'running', pos: 'verb', meaningVi: 'chạy', src: 'oxford' },
  { word: 'running', pos: 'noun', meaningVi: 'sự chạy', src: 'deck', definitionEn: 'the activity of running' },
];

test('chuẩn hoá từ loại', () => {
  assert.equal(normalizePos('n'), 'noun');
  assert.equal(normalizePos('adjective'), 'adjective');
  assert.equal(normalizePos('weird'), 'other');
});

test('họ từ: cùng gốc thì cùng khoá, nhầm gốc thì khác', () => {
  assert.equal(familyKey('resilient'), familyKey('resilience'));
  assert.equal(familyKey('happiness'), familyKey('happy'));
  assert.notEqual(familyKey('present'), familyKey('press'));
  assert.notEqual(familyKey('university'), familyKey('universe'));
  assert.equal(familyKey('cat'), null);
});

test('dựng mục: gộp nghĩa trùng, bỏ từ không phải tiếng Anh, chọn CEFR', () => {
  const idx = buildDeepIndex(mini);
  assert.equal(idx.entries.has('nihongo'), false);
  const e = lookupDeep(idx, 'Resilient');
  assert.ok(e);
  assert.equal(e.word, 'resilient');
  assert.equal(e.senses.length, 1, 'hai dòng cùng nghĩa gộp một');
  assert.equal(e.senses[0]?.examples.length, 2);
  assert.equal(e.cefr, 'B2');
  assert.equal(e.pos, 'adjective');
  assert.deepEqual(e.synonyms.map((s) => s.word), ['tough']);
  assert.equal(e.synonyms[0]?.meaningVi, 'cứng rắn');
  assert.ok(e.collocations.includes('resilient economy'));
  assert.ok(e.collocations.includes('build resilient teams'));
  const fam = e.family.flatMap((g) => g.words.map((w) => w.word));
  assert.deepEqual(fam.sort(), ['resilience', 'resilient']);
  assert.ok(!fam.includes('tough'));
});

test('dòng Oxford chỉ lấp chỗ trống', () => {
  const idx = buildDeepIndex(mini);
  const e = lookupDeep(idx, 'running');
  assert.ok(e);
  assert.equal(e.source, 'deck');
  assert.equal(e.senses.length, 1);
  assert.equal(e.senses[0]?.pos, 'noun');
});

test('dạng chia trỏ về dạng gốc và ghi chú lại', () => {
  const idx = buildDeepIndex(mini);
  const e = lookupDeep(idx, 'resiliences');
  assert.equal(e?.word, 'resilience');
  assert.equal(e?.matchedFrom, 'resiliences');
  assert.ok(e?.notes[0]?.includes('dạng chia'));
  assert.equal(lookupDeep(idx, 'zzzqqq'), null);
});

test('gợi ý theo tiền tố và từ gần giống', () => {
  const idx = buildDeepIndex(mini);
  assert.deepEqual(suggestDeep(idx, 'resil').map((s) => s.word), ['resilient', 'resilience'].sort((a, b) => a.length - b.length || a.localeCompare(b)));
  assert.deepEqual(suggestDeep(idx, ''), []);
  assert.equal(nearbyWords(idx, 'resilent')[0]?.word, 'resilient');
});

test('phiên âm Mỹ quy đổi', () => {
  assert.equal(usIpaFrom('/ˈkəʊstlaɪn/', 'coastline'), '/ˈkoʊstlaɪn/');
  assert.equal(usIpaFrom('/ˈfɑːmə/', 'farmer'), '/ˈfɑːrmər/');
  assert.equal(usIpaFrom('/rɪˈzɪliənt/', 'resilient'), '/rɪˈzɪliənt/');
  assert.equal(usIpaFrom('/lɒt/', 'lot'), '/lɑːt/');
});

test('làm nổi từ trong câu, gồm cả dạng chia', () => {
  const parts = highlightParts('The rugged coastline attracts hikers.', 'coastline');
  assert.deepEqual(parts.filter((p) => p.hit).map((p) => p.text), ['coastline']);
  assert.equal(parts.map((p) => p.text).join(''), 'The rugged coastline attracts hikers.');
  assert.deepEqual(highlightParts('They were studying hard.', 'study').filter((p) => p.hit).map((p) => p.text), ['studying']);
  assert.deepEqual(highlightParts('Cats sleep.', 'cat').filter((p) => p.hit).map((p) => p.text), ['Cats']);
  assert.equal(highlightParts('No match here.', 'zebra').some((p) => p.hit), false);
});

test('kho thật: coastline và resilient có đủ các phần', async () => {
  const idx = await loadDeepIndex();
  const c = lookupDeep(idx, 'coastline');
  assert.ok(c);
  assert.equal(c.pos, 'noun');
  assert.ok(c.ipaUk && c.ipaUs && c.ipaUs !== c.ipaUk);
  assert.ok(c.cefr);
  assert.ok(c.senses[0]?.meaningVi && c.senses[0].examples.length > 0);
  assert.ok(c.synonyms.some((s) => s.word === 'shoreline'));
  assert.ok(c.collocations.includes('rugged coastline'));

  const r = lookupDeep(idx, 'resilient');
  assert.ok(r);
  assert.ok(r.antonyms.some((s) => s.word === 'fragile'));
  assert.ok(r.family.flatMap((g) => g.words).some((w) => w.word === 'resilience'));
  assert.equal(lookupDeep(idx, 'blorptangzz'), null);
});

test('kho thật: họ từ không có dạng chia của chính từ và không lẫn từ lạ', async () => {
  const idx = await loadDeepIndex();
  const famOf = (w: string) => lookupDeep(idx, w)?.family.flatMap((g) => g.words.map((x) => x.word)) ?? [];
  const happy = famOf('happy');
  assert.ok(!happy.includes('happys'));
  for (const bad of [['present', 'press'], ['university', 'universe']] as const) {
    const f = famOf(bad[0]);
    assert.ok(!f.includes(bad[1]), `${bad[0]} không được ghép với ${bad[1]}`);
  }
});
