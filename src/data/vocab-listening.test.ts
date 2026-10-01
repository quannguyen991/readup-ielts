import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  LISTENING_DECKS,
  LISTENING_PREFIX,
  LISTENING_SECTIONS,
  LISTENING_TOTALS,
  getListeningDeck,
} from './vocab-listening';
import { BAND_ORDER, VOCAB_TOPICS, getVocabTopic, type VocabTopicWord } from './vocab-topics';

/**
 * Bộ từ vựng Nghe IELTS do soạn tay, nhưng vẫn là dữ liệu đi thẳng vào bundle:
 * một phiên âm sai hay một ví dụ không chứa từ cần học là lỗi người học không tự
 * phát hiện được. Test này giữ khuôn giống `vocab-topics.test.ts`, thêm các luật
 * riêng của bộ Nghe (tiền tố slug, Section, ví dụ ngắn kiểu lời thoại).
 */

const EXPECTED_DECKS = 21;
const WORDS_PER_DECK = 40;

const stem = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');

/** Từ đầu tiên của cụm có từ 4 chữ cái trở lên, cắt 4 ký tự — "to put it another way" → "anot". */
function keyStem(word: string): string | null {
  const token = word.toLowerCase().split(/[^a-z]+/).find((t) => t.length >= 4);
  return token ? token.slice(0, 4) : null;
}

test('đủ 21 bộ, mỗi bộ đúng 40 từ', () => {
  assert.equal(LISTENING_DECKS.length, EXPECTED_DECKS);
  for (const d of LISTENING_DECKS) assert.equal(d.words.length, WORDS_PER_DECK, `Bộ "${d.slug}" có ${d.words.length} từ.`);
  assert.equal(LISTENING_TOTALS.decks, EXPECTED_DECKS);
  assert.equal(LISTENING_TOTALS.words, EXPECTED_DECKS * WORDS_PER_DECK);
});

test('slug có tiền tố listening-, không trùng nhau và không trùng 50 chủ đề IELTS', () => {
  const topicSlugs = new Set(VOCAB_TOPICS.map((t) => t.slug));
  const seen = new Set<string>();
  for (const d of LISTENING_DECKS) {
    assert.ok(d.slug.startsWith(LISTENING_PREFIX), `slug "${d.slug}" thiếu tiền tố`);
    assert.match(d.slug, /^[a-z0-9-]+$/, `slug "${d.slug}" có ký tự lạ`);
    assert.ok(!topicSlugs.has(d.slug), `slug "${d.slug}" trùng một chủ đề IELTS`);
    assert.ok(!seen.has(d.slug), `slug "${d.slug}" bị lặp`);
    seen.add(d.slug);
  }
});

test('mỗi bộ có tên Anh, tên Việt, mô tả một dòng và thuộc một Section hợp lệ', () => {
  const sections = new Set(LISTENING_SECTIONS.map((s) => s.key));
  for (const d of LISTENING_DECKS) {
    assert.ok(d.name.trim(), `${d.slug} thiếu tên tiếng Anh`);
    assert.ok(d.nameVi.trim(), `${d.slug} thiếu tên tiếng Việt`);
    assert.ok(d.blurb.trim().length > 8, `${d.slug} mô tả quá ngắn`);
    assert.ok(d.blurb.length <= 110, `${d.slug} mô tả dài hơn một dòng (${d.blurb.length} ký tự)`);
    assert.ok(sections.has(d.section), `${d.slug} có Section lạ: ${String(d.section)}`);
  }
  for (const s of LISTENING_SECTIONS) {
    assert.ok(LISTENING_DECKS.some((d) => d.section === s.key), `Section ${String(s.key)} không có bộ nào`);
  }
});

test('đủ trường, không rỗng, phiên âm trong hai dấu gạch chéo', () => {
  const fields: (keyof VocabTopicWord)[] = ['word', 'pos', 'ipa', 'meaningVi', 'definitionEn', 'example', 'collocation', 'band'];
  const bad: string[] = [];
  for (const d of LISTENING_DECKS) {
    for (const w of d.words) {
      for (const f of fields) if (String(w[f] ?? '').trim() === '') bad.push(`${d.slug}/${w.word}: thiếu ${String(f)}`);
      if (!/^\/.+\/$/.test(w.ipa.trim())) bad.push(`${d.slug}/${w.word}: ipa ${w.ipa}`);
    }
  }
  assert.deepEqual(bad.slice(0, 10), [], `${bad.length} lỗi`);
});

test('phiên âm chỉ dùng ký tự IPA kiểu Cambridge (ɡ chứ không phải g, ˈ chứ không phải dấu nháy)', () => {
  const allowed = /^[ .abdefhijklmnprstuvwzæðŋɑɒɔəɜɡɪʃʊʌʒˈˌːθ]+$/;
  const bad: string[] = [];
  for (const d of LISTENING_DECKS) {
    for (const w of d.words) {
      const inner = w.ipa.slice(1, -1);
      if (!allowed.test(inner) || /\s{2,}|\.\./.test(inner) || /^\s|\s$/.test(inner)) bad.push(`${d.slug}/${w.word}: ${w.ipa}`);
    }
  }
  assert.deepEqual(bad.slice(0, 10), [], `${bad.length} phiên âm sai ký tự`);
});

test('band hợp lệ, mỗi bộ trải đủ cả bốn mức và xếp dễ → khó (không lùi band)', () => {
  for (const d of LISTENING_DECKS) {
    const bands = new Set<string>();
    let last = -1;
    for (const w of d.words) {
      const at = (BAND_ORDER as string[]).indexOf(w.band);
      assert.ok(at >= 0, `"${w.word}" (${d.slug}) có band lạ: ${w.band}`);
      assert.ok(at >= last, `"${w.word}" (${d.slug}) band ${w.band} đứng sau từ khó hơn`);
      last = at;
      bands.add(w.band);
    }
    assert.equal(bands.size, 4, `Bộ "${d.slug}" chỉ có ${bands.size} mức band.`);
    const easy = d.words.filter((w) => w.band === '5-6').length;
    const top = d.words.filter((w) => w.band === '8+').length;
    assert.ok(easy >= 10 && easy <= 16, `Bộ "${d.slug}" có ${easy} từ band 5-6.`);
    assert.ok(top >= 2 && top <= 6, `Bộ "${d.slug}" có ${top} từ band 8+.`);
  }
});

test('không có từ nào lặp lại TRONG cùng một bộ', () => {
  for (const d of LISTENING_DECKS) {
    const seen = new Set<string>();
    for (const w of d.words) {
      const key = w.word.trim().toLowerCase();
      assert.ok(!seen.has(key), `"${key}" xuất hiện hai lần trong ${d.slug}`);
      seen.add(key);
    }
  }
});

test('câu ví dụ chứa chính từ đang dạy (hoặc dạng chia của nó) và không quá 22 từ', () => {
  const bad: string[] = [];
  for (const d of LISTENING_DECKS) {
    for (const w of d.words) {
      const k = keyStem(w.word);
      const example = w.example.toLowerCase().replace(/[^a-z ]/g, '');
      if (k && !example.includes(k)) bad.push(`${d.slug}/${w.word}`);
      const n = w.example.trim().split(/\s+/).length;
      if (n > 22 || n < 4) bad.push(`${d.slug}/${w.word}: ${n} từ`);
    }
  }
  assert.deepEqual(bad.slice(0, 10), [], `${bad.length} ví dụ lỗi`);
});

test('collocation chứa chính từ đó', () => {
  const bad: string[] = [];
  for (const d of LISTENING_DECKS) {
    for (const w of d.words) {
      const k = keyStem(w.word);
      if (k && !stem(w.collocation).includes(k)) bad.push(`${d.slug}/${w.word} → ${w.collocation}`);
    }
  }
  assert.deepEqual(bad.slice(0, 10), [], `${bad.length} collocation không chứa từ của nó`);
});

test('nghĩa tiếng Việt khác định nghĩa tiếng Anh, và định nghĩa gọn', () => {
  for (const d of LISTENING_DECKS) {
    for (const w of d.words) {
      assert.notEqual(w.meaningVi.trim().toLowerCase(), w.definitionEn.trim().toLowerCase(), `${d.slug}/${w.word}`);
      assert.ok(w.definitionEn.split(/\s+/).length <= 20, `${d.slug}/${w.word}: định nghĩa quá dài`);
      assert.ok(w.meaningVi.length <= 40, `${d.slug}/${w.word}: nghĩa tiếng Việt quá dài`);
    }
  }
});

test('đồng nghĩa/trái nghĩa gọn, không lặp từ gốc, không tự mâu thuẫn', () => {
  let withSyn = 0;
  let total = 0;
  for (const d of LISTENING_DECKS) {
    for (const w of d.words) {
      total += 1;
      const syn = w.synonyms ?? [];
      const ant = w.antonyms ?? [];
      if (syn.length) withSyn += 1;
      assert.ok(syn.length <= 4 && ant.length <= 2, `${w.word}: quá nhiều mục`);
      for (const s of [...syn, ...ant]) {
        assert.notEqual(s.toLowerCase(), w.word.toLowerCase(), `${w.word}: lặp từ gốc`);
        assert.ok(s.trim().split(/\s+/).length <= 3, `${w.word}: "${s}" quá dài`);
      }
      assert.equal(new Set(syn.map((s) => s.toLowerCase())).size, syn.length, `${w.word}: đồng nghĩa lặp`);
      assert.ok(!ant.some((a) => syn.includes(a)), `${w.word}: vừa đồng vừa trái nghĩa`);
    }
  }
  assert.ok(withSyn / total > 0.6, `chỉ ${withSyn}/${total} từ có đồng nghĩa`);
});

test('các bộ vẫn phân biệt được: không từ nào xuất hiện ở quá ba bộ Nghe', () => {
  const owner = new Map<string, number>();
  for (const d of LISTENING_DECKS) for (const w of d.words) owner.set(w.word.toLowerCase(), (owner.get(w.word.toLowerCase()) ?? 0) + 1);
  const many = [...owner.entries()].filter(([, n]) => n > 3);
  assert.deepEqual(many, [], 'từ lặp ở quá nhiều bộ');
  const repeated = [...owner.values()].filter((n) => n > 1).length;
  assert.ok(repeated / owner.size < 0.1, `${repeated} từ nằm ở nhiều bộ Nghe — các bộ đang giống nhau quá`);
});

test('getVocabTopic tìm được bộ Nghe; 50 chủ đề IELTS giữ nguyên', () => {
  for (const d of LISTENING_DECKS) {
    const found = getVocabTopic(d.slug);
    assert.ok(found, `getVocabTopic("${d.slug}") không tìm thấy`);
    assert.equal(found!.words.length, WORDS_PER_DECK);
    assert.equal(found!.nameVi, d.nameVi);
    assert.equal(getListeningDeck(d.slug), d);
  }
  assert.equal(getVocabTopic('environment')?.slug, 'environment');
  assert.equal(getVocabTopic('listening-không-có'), undefined);
  assert.equal(getListeningDeck('environment'), undefined);
  assert.equal(VOCAB_TOPICS.length, 50, 'bộ Nghe đã lọt vào VOCAB_TOPICS');
  assert.ok(!VOCAB_TOPICS.some((t) => t.slug.startsWith(LISTENING_PREFIX)));
});
