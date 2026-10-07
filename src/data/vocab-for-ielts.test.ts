import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { getStaticDeck, groupDeckWords } from './study-decks';
import { VFI_DECKS, VFI_PREFIX, VFI_TOTALS, getVfiDeck, type VfiDeck } from './vocab-for-ielts';
import { VFIA_DECKS, VFIA_PREFIX, VFIA_TOTALS, getVfiaDeck } from './vocab-for-ielts-advanced';
import { LISTENING_DECKS } from './vocab-listening';
import { BAND_ORDER, VOCAB_TOPICS, getVocabTopic, type VocabTopicWord } from './vocab-topics';

/**
 * Hai cuốn "Vocabulary for IELTS" soạn tay (scripts/vfi/units, units-adv → build.mjs),
 * mỗi cuốn 20 unit. Dữ liệu đi thẳng vào bundle nên một phiên âm sai hay một ví dụ
 * không chứa từ cần học là lỗi người học không tự phát hiện được. Test này canh lại
 * đúng những luật mà `scripts/vfi/build.mjs` đã kiểm lúc dựng, phòng khi seed bị sửa tay.
 */

const UNITS = 20;
const stem = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');

/** Từ đầu tiên có từ 4 chữ cái trở lên, cắt 4 ký tự — "put your mind at ease" → "your". */
function keyStem(word: string): string | null {
  const token = word.toLowerCase().replace(/\([^)]*\)/g, ' ').split(/[^a-z]+/).find((t) => t.length >= 4);
  return token ? token.slice(0, 4) : null;
}

type SetCfg = {
  label: string;
  decks: VfiDeck[];
  prefix: string;
  extra: number;
  minBook: number;
  minWords: number;
  totals: { decks: number; words: number; extra: number };
  find: (slug: string) => VfiDeck | undefined;
  namePrefix: string;
};

const SETS: SetCfg[] = [
  { label: 'Vocabulary for IELTS', decks: VFI_DECKS, prefix: VFI_PREFIX, extra: 20, minBook: 40, minWords: 1500, totals: VFI_TOTALS, find: getVfiDeck, namePrefix: '' },
  { label: 'Vocabulary for IELTS Advanced', decks: VFIA_DECKS, prefix: VFIA_PREFIX, extra: 15, minBook: 14, minWords: 800, totals: VFIA_TOTALS, find: getVfiaDeck, namePrefix: 'Advanced · ' },
];

for (const set of SETS) {
  describe(set.label, () => {
    test(`đủ ${UNITS} unit theo thứ tự, mỗi unit đúng ${set.extra} từ mở rộng`, () => {
      assert.equal(set.decks.length, UNITS);
      set.decks.forEach((d, i) => {
        assert.equal(d.unit, i + 1, `${d.slug} sai thứ tự unit`);
        assert.equal(d.slug, `${set.prefix}unit-${String(i + 1).padStart(2, '0')}`);
        assert.equal(d.words.filter((w) => w.more).length, set.extra, `${d.slug} cần đúng ${set.extra} từ mở rộng`);
        assert.ok(d.words.filter((w) => !w.more).length >= set.minBook, `${d.slug} có quá ít từ trong sách`);
      });
      assert.equal(set.totals.decks, UNITS);
      assert.equal(set.totals.extra, UNITS * set.extra);
      assert.ok(set.totals.words >= set.minWords, `chỉ có ${set.totals.words} từ`);
    });

    test('slug có tiền tố riêng, không trùng 50 chủ đề IELTS, bộ Nghe lẫn cuốn kia', () => {
      const others = new Set([...VOCAB_TOPICS, ...LISTENING_DECKS, ...(set.decks === VFI_DECKS ? VFIA_DECKS : VFI_DECKS)].map((t) => t.slug));
      const seen = new Set<string>();
      for (const d of set.decks) {
        assert.ok(d.slug.startsWith(set.prefix), `slug "${d.slug}" thiếu tiền tố`);
        assert.match(d.slug, /^[a-z0-9-]+$/);
        assert.ok(!others.has(d.slug), `slug "${d.slug}" trùng bộ khác`);
        assert.ok(!seen.has(d.slug), `slug "${d.slug}" bị lặp`);
        seen.add(d.slug);
      }
    });

    test('tên bộ bằng tiếng Anh (cả tên Việt), mô tả một dòng', () => {
      for (const d of set.decks) {
        assert.match(d.name, new RegExp(`^${set.namePrefix}Unit ${d.unit}: [A-Za-z]`), `${d.slug} tên Anh`);
        assert.equal(d.nameVi, d.name, `${d.slug}: tên hiển thị phải là tiếng Anh`);
        assert.ok(d.blurb.trim().length > 8 && d.blurb.length <= 110, `${d.slug} mô tả không hợp lệ`);
      }
    });

    test('đủ trường, không rỗng, phiên âm trong hai dấu gạch chéo và chỉ dùng ký tự IPA Cambridge', () => {
      const fields: (keyof VocabTopicWord)[] = ['word', 'pos', 'ipa', 'meaningVi', 'definitionEn', 'example', 'collocation', 'band'];
      const allowed = /^[ .abdefhijklmnprstuvwzæðŋɑɒɔəɜɡɪʃʊʌʒˈˌːθ]+$/;
      const bad: string[] = [];
      for (const d of set.decks) {
        for (const w of d.words) {
          for (const f of fields) if (String(w[f] ?? '').trim() === '') bad.push(`${d.slug}/${w.word}: thiếu ${String(f)}`);
          if (!/^\/.+\/$/.test(w.ipa.trim()) || !allowed.test(w.ipa.slice(1, -1))) bad.push(`${d.slug}/${w.word}: ipa ${w.ipa}`);
        }
      }
      assert.deepEqual(bad.slice(0, 10), [], `${bad.length} lỗi`);
    });

    test('band hợp lệ và mỗi bộ xếp dễ → khó', () => {
      for (const d of set.decks) {
        let last = -1;
        for (const w of d.words) {
          const at = (BAND_ORDER as string[]).indexOf(w.band);
          assert.ok(at >= 0, `"${w.word}" (${d.slug}) có band lạ: ${w.band}`);
          assert.ok(at >= last, `"${w.word}" (${d.slug}) band ${w.band} đứng sau từ khó hơn`);
          last = at;
        }
      }
    });

    test('không có từ nào lặp lại TRONG cùng một unit', () => {
      for (const d of set.decks) {
        const seen = new Set<string>();
        for (const w of d.words) {
          const key = w.word.trim().toLowerCase();
          assert.ok(!seen.has(key), `"${key}" xuất hiện hai lần trong ${d.slug}`);
          seen.add(key);
        }
      }
    });

    test('ví dụ chứa chính từ đang dạy và dài 4–22 từ; collocation chứa từ đó', () => {
      const bad: string[] = [];
      for (const d of set.decks) {
        for (const w of d.words) {
          const k = keyStem(w.word);
          if (k && !w.example.toLowerCase().replace(/[^a-z ]/g, '').includes(k)) bad.push(`${d.slug}/${w.word}: ví dụ`);
          if (k && !stem(w.collocation).includes(k)) bad.push(`${d.slug}/${w.word}: collocation → ${w.collocation}`);
          const n = w.example.trim().split(/\s+/).length;
          if (n > 22 || n < 4) bad.push(`${d.slug}/${w.word}: ${n} từ`);
        }
      }
      assert.deepEqual(bad.slice(0, 10), [], `${bad.length} lỗi`);
    });

    test('nghĩa Việt khác định nghĩa Anh, định nghĩa và nghĩa đều gọn', () => {
      for (const d of set.decks) {
        for (const w of d.words) {
          assert.notEqual(w.meaningVi.trim().toLowerCase(), w.definitionEn.trim().toLowerCase(), `${d.slug}/${w.word}`);
          assert.ok(w.definitionEn.split(/\s+/).length <= 20, `${d.slug}/${w.word}: định nghĩa quá dài`);
          assert.ok(w.meaningVi.length <= 40, `${d.slug}/${w.word}: nghĩa tiếng Việt quá dài`);
        }
      }
    });

    test('getVocabTopic và getStaticDeck tìm được bộ; 50 chủ đề và bộ Nghe giữ nguyên', () => {
      for (const d of set.decks) {
        const found = getVocabTopic(d.slug);
        assert.ok(found, `getVocabTopic("${d.slug}") không tìm thấy`);
        assert.equal(found!.words.length, d.words.length);
        assert.equal(set.find(d.slug), d);
        const study = getStaticDeck(d.slug);
        assert.equal(study?.kind, 'topic');
        // Hiện theo band như mọi bộ chủ đề IELTS; cuốn Advanced có thể thiếu mức 5-6.
        const labels = groupDeckWords(study!).map((g) => g.label);
        assert.deepEqual(labels, BAND_ORDER.map((b) => `Band ${b}`).filter((l) => labels.includes(l)));
        assert.ok(labels.length >= 2, `${d.slug} chỉ có ${labels.length} mức band`);
      }
      assert.equal(getVocabTopic('environment')?.slug, 'environment');
      assert.equal(getVocabTopic(`${set.prefix}unit-99`), undefined);
      assert.equal(set.find('environment'), undefined);
      assert.equal(VOCAB_TOPICS.length, 50, 'bộ vfi đã lọt vào VOCAB_TOPICS');
      assert.ok(!VOCAB_TOPICS.some((t) => t.slug.startsWith(set.prefix)));
      assert.ok(!LISTENING_DECKS.some((t) => t.slug.startsWith(set.prefix)));
    });
  });
}

test('tiền tố vfi- và vfia- không đè lên nhau', () => {
  assert.ok(!VFI_DECKS.some((d) => d.slug.startsWith(VFIA_PREFIX)), 'vfi- khớp tiền tố vfia-');
  assert.ok(!VFIA_DECKS.some((d) => d.slug.startsWith(VFI_PREFIX)), 'vfia- khớp tiền tố vfi-');
});
