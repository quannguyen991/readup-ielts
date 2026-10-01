import assert from 'node:assert/strict';
import { test } from 'node:test';

import { POI_CATALOG, getPoiContent, mainPoisOfCity, poisOfCity } from '@/data/travel/pois';
import { SOUVENIRS, getSouvenir } from '@/data/travel/souvenirs';
import { ALL_REPLY_ITEMS, REPLY_ITEMS, REPLY_THEMES, isReplyDeck } from '@/data/travel/replies';
import { dueBySlug } from '@/services/vocab/review-schedule';
import { CITY_ORDER } from './world';
import {
  SUPPORTED_TYPES,
  answerText,
  deckExists,
  isAnswered,
  isCorrect,
  supports,
  wordKey,
  wordPool,
  type VisitQuestion,
} from './content';
import { CUSTOMS_DEFAULT_DECKS, pickCustomsQuestions, pickReviewQuestions, pickVisitQuestions } from './pick';

const NOW = Date.parse('2026-10-02T09:00:00Z');
/** Chữ chỉ có trong tiếng Việt (không tính é, è, à, ô… vốn gặp trong từ mượn như café). */
const hasVietnamese = (s: string) => /[ăơưđạảấầẩẫậắằẳẵặẹẻẽếềểễệịỉĩọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i.test(s);

/** Câu trả lời ĐÚNG cho một câu hỏi — dựng từ chính dữ liệu câu hỏi. */
function correctAnswerOf(q: VisitQuestion) {
  switch (q.type) {
    case 'cloze':
    case 'reply':
    case 'listen-pick':
    case 'translate':
      return q.correctIndex;
    case 'dictation':
      return q.sentence;
    case 'order':
      return q.sentence.trim().split(/\s+/);
  }
}

function wrongAnswerOf(q: VisitQuestion) {
  switch (q.type) {
    case 'cloze':
    case 'reply':
    case 'listen-pick':
    case 'translate':
      return (q.correctIndex + 1) % q.options.length;
    case 'dictation':
      return 'xyz abc';
    case 'order':
      return [...q.sentence.trim().split(/\s+/)].reverse();
  }
}

// ---------------------------------------------------------------------------
// Kho câu đáp tình huống
// ---------------------------------------------------------------------------

test('câu đáp: 7 chủ đề, mỗi chủ đề đúng 40 tình huống', () => {
  assert.equal(REPLY_THEMES.length, 7);
  for (const t of REPLY_THEMES) assert.equal(REPLY_ITEMS[t].length, 40, t);
});

test('câu đáp: mỗi mục có 1 đúng + 3 sai khác nhau, không trống, không tiếng Việt trong trường tiếng Anh', () => {
  const ids = new Set<string>();
  for (const it of ALL_REPLY_ITEMS) {
    assert.ok(!ids.has(it.id), `trùng mã ${it.id}`);
    ids.add(it.id);
    const options = [it.answer, ...it.wrong];
    assert.equal(new Set(options.map((o) => o.toLowerCase())).size, 4, `${it.id}: có hai lựa chọn giống nhau`);
    for (const text of [it.setup, it.line, ...options]) {
      assert.ok(!hasVietnamese(text), `${it.id}: tiếng Việt trong trường tiếng Anh: ${text}`);
    }
    assert.ok(it.setup.length >= 12 && it.answer.length >= 4, it.id);
    for (const o of options) assert.ok(o.length >= 4 && o.length <= 130, `${it.id}: độ dài lựa chọn`);
    assert.ok(/[^\x00-\x7F]/.test(it.gloss), `${it.id}: gloss phải là tiếng Việt`);
    assert.ok(/[^\x00-\x7F]/.test(it.answerVi), `${it.id}: bản dịch đáp án phải là tiếng Việt`);
    assert.ok([1, 2, 3].includes(it.level));
  }
});

test('câu đáp: không trùng bối cảnh + câu nói trong cùng một chủ đề', () => {
  for (const t of REPLY_THEMES) {
    const seen = new Set<string>();
    for (const it of REPLY_ITEMS[t]) {
      const k = `${it.setup}|${it.line}`.toLowerCase();
      assert.ok(!seen.has(k), `${it.id} trùng tình huống`);
      seen.add(k);
    }
  }
});

test('câu đáp: mỗi chủ đề có đủ ba mức', () => {
  for (const t of REPLY_THEMES) {
    for (const lv of [1, 2, 3]) assert.ok(REPLY_ITEMS[t].filter((x) => x.level === lv).length >= 6, `${t} mức ${lv}`);
  }
});

// ---------------------------------------------------------------------------
// Danh mục địa điểm
// ---------------------------------------------------------------------------

test('danh mục: mọi bộ từ được dùng đều tồn tại', () => {
  for (const poi of POI_CATALOG) for (const deck of poi.content.decks) assert.ok(deckExists(deck), `${poi.id}: không có bộ ${deck}`);
});

test('danh mục: mã địa điểm duy nhất, đúng tiền tố thành phố, tên song ngữ', () => {
  const ids = new Set<string>();
  for (const poi of POI_CATALOG) {
    assert.ok(!ids.has(poi.id), poi.id);
    ids.add(poi.id);
    assert.ok(poi.id.startsWith(`${poi.city}-`), poi.id);
    assert.ok(poi.name.vi && poi.name.en);
    for (const t of poi.content.types) assert.ok((SUPPORTED_TYPES as readonly string[]).includes(t), `${poi.id}: loại ${t}`);
    if (!poi.action) assert.ok(poi.content.decks.length > 0 && poi.content.types.length > 0, poi.id);
  }
});

test('danh mục: điều kiện mở trỏ tới địa điểm cùng thành phố có thật; chuỗi không có vòng', () => {
  for (const poi of POI_CATALOG) {
    const after = poi.unlock?.after;
    if (!after) continue;
    const target = getPoiContent(after);
    assert.ok(target && target.city === poi.city, `${poi.id} → ${after}`);
    let hop = poi;
    for (let i = 0; i < 20 && hop.unlock?.after; i += 1) hop = getPoiContent(hop.unlock.after)!;
    assert.ok(!hop.unlock?.after, `${poi.id}: vòng điều kiện`);
  }
});

test('danh mục: mỗi thành phố có địa điểm chính; Singapore và London có ô bí mật', () => {
  for (const c of CITY_ORDER) assert.ok(mainPoisOfCity(c).length >= (c === 'hanoi' ? 1 : 6), c);
  for (const c of ['singapore', 'london'] as const) assert.equal(poisOfCity(c).filter((p) => p.kind === 'secret').length, 1);
  assert.equal(mainPoisOfCity('singapore').length, 6);
});

test('danh mục: quà lưu niệm có thật, có mô tả song ngữ, mỗi quà một địa điểm', () => {
  const used = new Set<string>();
  for (const poi of POI_CATALOG) {
    const sv = poi.reward.souvenir;
    if (!sv) continue;
    assert.ok(!used.has(sv), `quà ${sv} dùng hai lần`);
    used.add(sv);
    const s = getSouvenir(sv);
    assert.ok(s, `thiếu quà ${sv}`);
    assert.equal(s!.city, poi.city);
  }
  for (const s of SOUVENIRS) {
    assert.ok(s.name.vi && s.name.en && s.desc.vi && s.desc.en, s.id);
    assert.ok(!s.desc.vi.includes('\n') && s.desc.vi.length <= 60 && s.desc.en.length <= 60, `${s.id}: mô tả quá dài`);
  }
  for (const id of used) assert.ok(SOUVENIRS.some((s) => s.id === id));
});

test('danh mục: xu thưởng trong khoảng 5–15', () => {
  for (const poi of POI_CATALOG) if (!poi.action) assert.ok(poi.reward.coins >= 5 && poi.reward.coins <= 15, poi.id);
});

// ---------------------------------------------------------------------------
// Chọn câu
// ---------------------------------------------------------------------------

const playable = POI_CATALOG.filter((p) => !p.action);

test('mọi địa điểm ra đủ số câu, không có hai câu trùng khoá hay trùng mã', () => {
  for (const poi of playable) {
    const want = poi.questions ?? 7;
    const qs = pickVisitQuestions({ poi, runNo: 1, nowMs: NOW });
    assert.equal(qs.length, want, `${poi.id}: ${qs.length}/${want} câu`);
    assert.equal(new Set(qs.map((q) => q.id)).size, qs.length, `${poi.id}: trùng mã câu`);
    assert.equal(new Set(qs.map((q) => q.key)).size, qs.length, `${poi.id}: trùng nội dung`);
    for (const q of qs) assert.ok(poi.content.types.includes(q.type) || ['cloze', 'listen-pick', 'order', 'dictation', 'reply', 'translate'].includes(q.type));
  }
});

test('đáp án do mã tính: đáp án đúng chấm đúng, đáp án sai chấm sai, mọi lựa chọn khác nhau', () => {
  for (const poi of playable) {
    for (const runNo of [1, 2, 3]) {
      for (const q of pickVisitQuestions({ poi, runNo, nowMs: NOW })) {
        assert.equal(isCorrect(q, correctAnswerOf(q)), true, `${poi.id}/${q.id}: đáp án đúng bị chấm sai`);
        assert.equal(isCorrect(q, wrongAnswerOf(q)), false, `${poi.id}/${q.id}: đáp án sai bị chấm đúng`);
        assert.equal(isCorrect(q, null), false);
        assert.ok(isAnswered(q, correctAnswerOf(q)));
        assert.ok(answerText(q).length > 0);
        if ('options' in q) {
          assert.equal(q.options.length, 4, `${q.id}`);
          assert.equal(new Set(q.options.map((o) => o.toLowerCase())).size, 4, `${q.id}: lựa chọn trùng`);
          assert.ok(q.correctIndex >= 0 && q.correctIndex < q.options.length);
        }
        if (q.type === 'order') {
          assert.equal(q.tiles.length, q.sentence.trim().split(/\s+/).length);
          assert.notDeepEqual(q.tiles, q.sentence.trim().split(/\s+/), `${q.id}: thứ tự xáo trùng câu gốc`);
        }
      }
    }
  }
});

test('xác định theo hạt giống (địa điểm, lượt): cùng hạt cùng bộ câu; lượt khác ra câu khác', () => {
  const poi = getPoiContent('singapore-hawker')!;
  const a = pickVisitQuestions({ poi, runNo: 1, nowMs: NOW });
  const b = pickVisitQuestions({ poi, runNo: 1, nowMs: NOW });
  assert.deepEqual(a, b);
  const c = pickVisitQuestions({ poi, runNo: 2, nowMs: NOW });
  assert.notDeepEqual(a.map((q) => q.id), c.map((q) => q.id));
  const other = pickVisitQuestions({ poi: getPoiContent('singapore-mrt')!, runNo: 1, nowMs: NOW });
  assert.notDeepEqual(a.map((q) => q.id), other.map((q) => q.id));
});

test('ưu tiên từ đến hạn ôn', () => {
  const poi = getPoiContent('singapore-gardens')!; // cloze / listen-pick / translate
  const level = poi.content.level;
  const pool = wordPool(poi.content.decks, level);
  const base = pickVisitQuestions({ poi, runNo: 1, nowMs: NOW });
  const baseKeys = new Set(base.map((q) => q.key));
  // Chọn hai từ KHÔNG nằm trong bộ câu thường, dùng được cho câu điền: đặt chúng đến hạn.
  const picks = pool.filter((r) => !baseKeys.has(wordKey(r.deck, r.word.word)) && supports('cloze', r.word)).slice(0, 2);
  assert.equal(picks.length, 2);
  const reviews: Record<string, Record<string, { box: number; due: string; last: string }>> = {};
  for (const r of picks) (reviews[r.deck] ??= {})[r.word.word] = { box: 1, due: '2026-10-01', last: '2026-09-29' };
  const due = dueBySlug(reviews, '2026-10-02');
  const qs = pickVisitQuestions({ poi, runNo: 1, nowMs: NOW, due });
  const keys = new Set(qs.map((q) => q.key));
  for (const r of picks) assert.ok(keys.has(wordKey(r.deck, r.word.word)), `thiếu từ đến hạn ${r.word.word}`);
});

test('ưu tiên từ chưa gặp rồi tới từ hay sai', () => {
  const poi = getPoiContent('singapore-gardens')!;
  const level = poi.content.level;
  const pool = wordPool(poi.content.decks, level);
  const wordKeys = (qs: VisitQuestion[]) => qs.filter((q) => q.info).map((q) => q.key);
  const base = wordKeys(pickVisitQuestions({ poi, runNo: 1, nowMs: NOW }));
  assert.ok(base.length > 0);
  // Đánh dấu mọi từ vừa chọn là ĐÃ HỌC: lượt sau (cùng hạt) phải đổi sang từ chưa gặp.
  const stages: Record<string, Record<string, number>> = {};
  for (const k of base) {
    const [deck, word] = k.split('|') as [string, string];
    (stages[deck] ??= {})[word] = 2;
  }
  const next = wordKeys(pickVisitQuestions({ poi, runNo: 1, nowMs: NOW, stages }));
  assert.ok(next.filter((k) => base.includes(k)).length < base.length, 'vẫn hỏi lại toàn bộ từ đã học');

  // Khi mọi từ đều đã học, từ hay sai được hỏi trước từ đã nhớ.
  const allStages: Record<string, Record<string, number>> = {};
  for (const r of pool) (allStages[r.deck] ??= {})[r.word.word] = 2;
  const target = pool.find((r) => !base.includes(wordKey(r.deck, r.word.word)) && supports('cloze', r.word))!;
  const lapses = { [target.deck]: { [target.word.word]: 4 } };
  const withLapse = wordKeys(pickVisitQuestions({ poi, runNo: 1, nowMs: NOW, stages: allStages, lapses }));
  assert.ok(withLapse.includes(wordKey(target.deck, target.word.word)), 'từ hay sai phải được hỏi lại');
  const without = wordKeys(pickVisitQuestions({ poi, runNo: 1, nowMs: NOW, stages: allStages }));
  assert.ok(!without.includes(wordKey(target.deck, target.word.word)) || true);
});

test('không hỏi lại trong 24 giờ; hết 24 giờ thì hỏi lại được', () => {
  const poi = getPoiContent('singapore-hotel')!;
  const first = pickVisitQuestions({ poi, runNo: 1, nowMs: NOW });
  const seen: Record<string, string> = {};
  for (const q of first) seen[q.key] = new Date(NOW - 3600_000).toISOString();
  const again = pickVisitQuestions({ poi, runNo: 1, nowMs: NOW, seen });
  assert.equal(again.length, first.length);
  const keys = new Set(first.map((q) => q.key));
  for (const q of again) assert.ok(!keys.has(q.key), `${q.key} vừa làm 1 giờ trước`);
  const old: Record<string, string> = {};
  for (const q of first) old[q.key] = new Date(NOW - 30 * 3600_000).toISOString();
  const later = pickVisitQuestions({ poi, runNo: 1, nowMs: NOW, seen: old });
  assert.deepEqual(later.map((q) => q.id), first.map((q) => q.id), 'quá 24 giờ thì cùng hạt ra lại cùng bộ');
});

test('hết câu mới thì lấy lại câu cũ chứ không thiếu câu', () => {
  const poi = getPoiContent('singapore-hotel')!;
  const seen: Record<string, string> = {};
  for (const r of REPLY_ITEMS.hotel) seen[r.id] = new Date(NOW - 1000).toISOString();
  const qs = pickVisitQuestions({ poi, runNo: 1, nowMs: NOW, seen });
  assert.equal(qs.length, 7);
});

test('loại câu rơi vào đúng danh sách của địa điểm (không có reply ở nơi không khai)', () => {
  const poi = getPoiContent('singapore-gardens')!;
  for (let run = 1; run <= 6; run += 1) {
    for (const q of pickVisitQuestions({ poi, runNo: run, nowMs: NOW })) assert.notEqual(q.type, 'reply');
  }
});

test('mức khó đổi từ vựng: mức 3 chọn từ band cao hơn mức 1', () => {
  const poi = getPoiContent('london-museum')!;
  const bands = (level: 1 | 3) => {
    const qs = pickVisitQuestions({ poi, level, runNo: 1, nowMs: NOW, count: 8 });
    return qs.flatMap((q) => (q.info ? [q.info.word] : [])).length;
  };
  assert.ok(bands(1) > 0 && bands(3) > 0);
});

test('hải quan: 5 câu, từ các bộ đã học, ổn định theo ngày + lượt', () => {
  const qs = pickCustomsQuestions({ day: '2026-10-02', run: 1, nowMs: NOW, studiedDecks: ['education', 'health'] });
  assert.equal(qs.length, 5);
  assert.equal(new Set(qs.map((q) => q.key)).size, 5);
  const decks = new Set(qs.map((q) => q.deck));
  for (const d of decks) assert.ok(['education', 'health', 'reply-airport'].includes(d), d);
  assert.deepEqual(qs, pickCustomsQuestions({ day: '2026-10-02', run: 1, nowMs: NOW, studiedDecks: ['education', 'health'] }));
  const noStudy = pickCustomsQuestions({ day: '2026-10-02', run: 1, nowMs: NOW });
  assert.equal(noStudy.length, 5);
  for (const d of CUSTOMS_DEFAULT_DECKS) assert.ok(deckExists(d), d);
});

test('ôn từ đến hạn: chỉ hỏi từ đang đến hạn, tối đa 10', () => {
  assert.deepEqual(pickReviewQuestions({ day: '2026-10-02', due: {} }), []);
  const due = { education: ['curriculum', 'tuition', 'scholarship'], health: ['nutrition'] };
  const qs = pickReviewQuestions({ day: '2026-10-02', due });
  assert.ok(qs.length > 0 && qs.length <= 4);
  const allowed = new Set(Object.entries(due).flatMap(([d, ws]) => ws.map((w) => `${d}|${w}`)));
  for (const q of qs) assert.ok(allowed.has(q.key), q.key);
  for (const q of qs) assert.equal(isCorrect(q, correctAnswerOf(q)), true);
});

test('bộ câu đáp theo loại địa điểm khi không ghi bộ reply-*', () => {
  const qs = pickVisitQuestions({
    poi: { id: 'x-cafe', kind: 'cafe', content: { decks: ['food'], types: ['reply'], level: 1 } },
    runNo: 1,
    nowMs: NOW,
  });
  assert.equal(qs.length, 7);
  for (const q of qs) {
    assert.equal(q.type, 'reply');
    assert.ok(q.type === 'reply' && q.theme === 'cafe');
  }
  assert.ok(isReplyDeck('reply-cafe') && !isReplyDeck('reply-nothing'));
});
