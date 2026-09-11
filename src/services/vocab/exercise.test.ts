import test from 'node:test';
import assert from 'node:assert/strict';

import { BLANK, buildChoices, buildCloze, buildExercise } from './exercise';
import { VOCAB_MODES, entriesForMode, findWordInSentence, modeAvailability } from './modes';
import type { VocabEntry } from '@/store/useVocabStore';

function entry(over: Partial<VocabEntry> = {}): VocabEntry {
  return {
    id: over.id ?? 'v1',
    word: 'mitigate',
    lemma: 'mitigate',
    phonetic: null,
    partOfSpeech: 'verb',
    definitionContext: null,
    definitionGeneral: null,
    definitionVi: 'làm giảm nhẹ',
    exampleSentence: null,
    sourceSentence: 'Planting trees can mitigate the summer heat in dense districts.',
    articleId: 'a1',
    articleTitle: 'Urban heat',
    paragraphIndex: 2,
    isCollocation: false,
    masteryPercent: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...over,
  };
}

function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x1_0000_0000;
  };
}

/* ------------------------------------------------------------ khoét chỗ trống */

test('khoét đúng từ trong câu và giữ nguyên phần còn lại', () => {
  const out = buildCloze(entry())!;
  assert.equal(out.answer, 'mitigate');
  assert.equal(
    out.blanked,
    `Planting trees can ${BLANK} the summer heat in dense districts.`,
  );
});

test('KHÔNG khoét trúng từ nằm bên trong từ khác', () => {
  /*
    Tìm "act" bằng indexOf sẽ trúng chữ "act" trong "fact", và câu khoét ra
    thành "f______". Phải so theo biên từ.
  */
  const e = entry({ word: 'act', lemma: 'act', sourceSentence: 'That is a fact about action.' });
  assert.equal(findWordInSentence('That is a fact about action.', e), null);
  assert.equal(buildCloze(e), null);
});

test('từ trong câu chia ở dạng khác thì rơi về `lemma`, và không khoét bừa', () => {
  const e = entry({ word: 'ran', lemma: 'run', sourceSentence: 'She will run tomorrow morning.' });
  const out = buildCloze(e)!;
  assert.equal(out.answer, 'run');

  const none = entry({ word: 'ran', lemma: 'run', sourceSentence: 'She walked home slowly.' });
  assert.equal(buildCloze(none), null, 'câu không chứa từ thì không được khoét');
});

test('khoét không phân biệt hoa thường nhưng GIỮ NGUYÊN chữ trong câu', () => {
  const e = entry({ word: 'mitigate', sourceSentence: 'Mitigate the risk before it grows.' });
  const out = buildCloze(e)!;
  assert.equal(out.answer, 'Mitigate', 'đáp án phải là đúng chữ trong câu, không phải chữ trong sổ');
  assert.ok(out.blanked.startsWith(BLANK));
});

/* ------------------------------------------------------------- trắc nghiệm */

test('bốn phương án, một đúng, ba nhiễu lấy từ sổ', () => {
  const pool = [
    entry({ id: 'v1' }),
    entry({ id: 'v2', word: 'scarce', definitionVi: 'khan hiếm' }),
    entry({ id: 'v3', word: 'abundant', definitionVi: 'dồi dào' }),
    entry({ id: 'v4', word: 'fragile', definitionVi: 'dễ vỡ' }),
  ];
  const out = buildChoices(pool[0]!, pool, seeded(5))!;
  assert.equal(out.options.length, 4);
  assert.equal(new Set(out.options).size, 4, 'phương án trùng nhau');
  assert.equal(out.options[out.answerIndex], 'làm giảm nhẹ');
});

test('hai từ cùng nghĩa trong sổ KHÔNG được làm nhiễu của nhau', () => {
  /*
    Hai từ đồng nghĩa cho hai nghĩa giống nhau, và câu ấy có hai đáp án đúng —
    người học chọn cái nào cũng đúng mà máy vẫn báo sai một nửa số lần.
  */
  const pool = [
    entry({ id: 'v1', definitionVi: 'làm giảm nhẹ' }),
    entry({ id: 'v2', word: 'alleviate', definitionVi: 'Làm giảm nhẹ  ' }),
    entry({ id: 'v3', word: 'scarce', definitionVi: 'khan hiếm' }),
    entry({ id: 'v4', word: 'abundant', definitionVi: 'dồi dào' }),
  ];
  const out = buildChoices(pool[0]!, pool, seeded(9));
  assert.equal(out, null, 'chỉ còn hai nhiễu hợp lệ thì không dựng câu, không nhồi cho đủ');
});

test('sổ quá ít từ thì KHÔNG dựng câu trắc nghiệm', () => {
  const pool = [entry({ id: 'v1' }), entry({ id: 'v2', definitionVi: 'khan hiếm' })];
  assert.equal(buildChoices(pool[0]!, pool, seeded(1)), null);
});

test('đáp án KHÔNG luôn nằm ở một vị trí', () => {
  /*
    Đáp án cố định ở vị trí A thì người học học được quy luật vị trí thay vì
    học từ, và họ không tự biết mình đang làm thế.
  */
  const pool = Array.from({ length: 8 }, (_, i) =>
    entry({ id: `v${i}`, word: `w${i}`, definitionVi: `nghĩa số ${i}` }),
  );
  const spots = new Set<number>();
  for (let s = 1; s <= 25; s += 1) {
    const out = buildChoices(pool[0]!, pool, seeded(s));
    if (out) spots.add(out.answerIndex);
  }
  assert.ok(spots.size >= 3, `đáp án chỉ rơi vào ${spots.size} vị trí trong 25 lượt`);
});

/* --------------------------------------------------------------- dựng lượt */

test('mỗi chế độ dựng được lượt khi đủ liệu', () => {
  const pool = [
    entry({ id: 'v1' }),
    entry({ id: 'v2', word: 'scarce', definitionVi: 'khan hiếm' }),
    entry({ id: 'v3', word: 'abundant', definitionVi: 'dồi dào' }),
    entry({ id: 'v4', word: 'fragile', definitionVi: 'dễ vỡ' }),
  ];
  for (const mode of ['flashcard', 'context', 'multiple_choice', 'translate_sentence', 'dictation'] as const) {
    const ex = buildExercise(mode, pool[0]!, pool, seeded(3));
    assert.ok(ex, `${mode} không dựng được dù đủ liệu`);
    assert.equal(ex!.mode, mode);
  }
});

test('thiếu nghĩa thì KHÔNG dựng thẻ lật, và trả null chứ không dựng thẻ trống', () => {
  const bare = entry({ definitionVi: null, definitionContext: null, definitionGeneral: null });
  assert.equal(buildExercise('flashcard', bare, [bare], seeded(1)), null);
  assert.ok(buildExercise('dictation', bare, [bare], seeded(1)), 'chép chính tả chỉ cần câu, vẫn chạy');
});

/* ------------------------------------------------------- điều kiện chế độ */

test('mỗi chế độ khai đúng thứ nó cần, và cửa vào đếm được', () => {
  const full = entry({ id: 'a' });
  const noMeaning = entry({ id: 'b', definitionVi: null });
  const noSentence = entry({ id: 'c', sourceSentence: '', exampleSentence: null });
  const noArticle = entry({ id: 'd', articleId: null, paragraphIndex: null });

  const counts = modeAvailability([full, noMeaning, noSentence, noArticle]);
  assert.equal(counts.flashcard, 3, 'ba từ có nghĩa');
  assert.equal(counts.dictation, 3, 'ba từ có câu');
  assert.equal(counts.translate_paragraph, 3, 'ba từ gắn với bài đọc');
  assert.ok(counts.context >= 1);
});

test('lọc theo chế độ trả về đúng những từ chạy được', () => {
  const ok = entry({ id: 'a' });
  const bad = entry({ id: 'b', definitionVi: null, definitionContext: null, definitionGeneral: null });
  assert.deepEqual(
    entriesForMode([ok, bad], 'flashcard').map((e) => e.id),
    ['a'],
  );
});

test('mọi chế độ đều khai rõ ai chấm, và blurb không rỗng', () => {
  // Người học phải biết TRƯỚC khi bấm là máy chấm hay tự chấm — hai thứ khác
  // hẳn nhau về việc buổi ôn ấy đáng tin tới đâu.
  for (const mode of VOCAB_MODES) {
    assert.ok(mode.grading === 'auto' || mode.grading === 'self');
    assert.ok(mode.blurb.length > 30, `${mode.id} thiếu mô tả`);
  }
});
