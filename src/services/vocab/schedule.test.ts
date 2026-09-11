import test from 'node:test';
import assert from 'node:assert/strict';
import { State } from 'ts-fsrs';

import {
  CARD_KINDS,
  applyGrade,
  cardKey,
  emptyCard,
  isDue,
  masteryFromCards,
  nextStatus,
  type StoredCard,
} from './schedule';

const NOW = new Date('2026-09-11T09:00:00.000Z');

function fourFreshCards(id: string, now = NOW): Record<string, StoredCard> {
  const out: Record<string, StoredCard> = {};
  for (const kind of CARD_KINDS) out[cardKey(id, kind)] = emptyCard(now);
  return out;
}

/* ------------------------------------------------------------ chấm một thẻ */

test('chấm thẻ đã có thì hạn ôn đổi, và thẻ khác KHÔNG bị đụng vào', () => {
  const cards = fourFreshCards('w1');
  const before = cards[cardKey('w1', 'cloze')]!;
  const other = cards[cardKey('w1', 'word_to_meaning')]!;

  const out = applyGrade(cards, 'w1', 'cloze', 3, NOW);

  assert.equal(out.key, cardKey('w1', 'cloze'));
  assert.notEqual(out.card.due, before.due, 'chấm xong mà hạn không đổi');
  assert.equal(out.createdCard, false);
  assert.equal(cards[cardKey('w1', 'word_to_meaning')], other, 'hàm phải thuần, không sửa đầu vào');
});

test('TỪ CHƯA CÓ THẺ vẫn chấm được — tạo thẻ rồi chấm, không im lặng bỏ qua', () => {
  /*
    Đây là lỗi đã hỏng thật và hỏng IM LẶNG: bản cũ `return` ngay khi không
    tìm thấy thẻ, nên màn ôn vẫn chạy tiếp, người học vẫn thấy mình vừa ôn
    xong mười hai từ, mà lịch đứng nguyên — hôm sau mở ra vẫn đúng ngần ấy từ
    đến hạn và không có gì nói vì sao.

    Thiếu thẻ không phải giả định: từ đồng bộ từ máy khác có thể chưa đủ bốn
    loại, và ngày nào thêm một loại thẻ mới thì MỌI từ cũ đều thiếu nó.
  */
  const out = applyGrade({}, 'w-moi', 'multiple_choice', 3, NOW);

  assert.equal(out.createdCard, true, 'phải báo rõ là vừa tạo thẻ');
  assert.equal(out.key, cardKey('w-moi', 'multiple_choice'));
  assert.ok(Date.parse(out.card.due) > NOW.getTime(), 'thẻ mới phải có hạn ôn ở tương lai');
});

test('"quên" đẩy hạn về gần hơn "nhớ", và "nhớ" gần hơn "dễ"', () => {
  const cards = fourFreshCards('w1');
  const again = applyGrade(cards, 'w1', 'cloze', 1, NOW);
  const good = applyGrade(cards, 'w1', 'cloze', 3, NOW);
  const easy = applyGrade(cards, 'w1', 'cloze', 4, NOW);

  assert.ok(Date.parse(again.card.due) < Date.parse(good.card.due), 'quên mà được giãn xa hơn nhớ');
  assert.ok(Date.parse(good.card.due) <= Date.parse(easy.card.due), 'nhớ mà được giãn xa hơn dễ');
});

test('mastery tính trên CẢ BỐN loại thẻ, không chỉ loại vừa chấm', () => {
  /*
    Tính riêng loại vừa chấm thì một từ mới học đúng một lần ở một kiểu sẽ
    hiện 60% thuộc. Con số ấy làm người học bỏ qua từ đó, và nó là con số app
    tự bịa ra.
  */
  const full = applyGrade(fourFreshCards('w1'), 'w1', 'cloze', 4, NOW);
  const lonely = applyGrade({}, 'w2', 'cloze', 4, NOW);

  assert.ok(
    lonely.masteryPercent > full.masteryPercent,
    'một thẻ đơn độc phải cho % cao hơn khi cùng điểm — chứng tỏ mẫu số là số thẻ ĐANG CÓ',
  );
  assert.ok(full.masteryPercent < 60, `bốn thẻ mà vừa chấm một đã ${full.masteryPercent}%`);
});

/* ------------------------------------------------------------- trạng thái từ */

test('chấm "quên" luôn kéo từ về learning, dù thẻ đang ổn định tới đâu', () => {
  const solid = { ...emptyCard(NOW), state: State.Review, stability: 90 } as StoredCard;
  assert.equal(nextStatus(1, solid), 'learning');
  assert.equal(nextStatus(3, solid), 'known');
});

test('thẻ đang học chưa bao giờ được coi là "known"', () => {
  const learning = { ...emptyCard(NOW), state: State.Learning, stability: 999 } as StoredCard;
  assert.equal(nextStatus(4, learning), 'learning');
});

/* ------------------------------------------------------------------ mastery */

test('sổ rỗng thì mastery bằng 0, không chia cho 0', () => {
  assert.equal(masteryFromCards([]), 0);
});

test('mastery không bao giờ vượt 100 dù độ ổn định rất lớn', () => {
  const huge = { ...emptyCard(NOW), state: State.Review, stability: 100_000 } as StoredCard;
  assert.ok(masteryFromCards([huge]) <= 100);
});

/* ---------------------------------------------------------------- đến hạn */

test('đến hạn tính theo mốc thời gian, và ĐÚNG LÚC đáo hạn là đến hạn', () => {
  const card = { ...emptyCard(NOW), due: NOW.toISOString() } as StoredCard;
  assert.equal(isDue(card, NOW), true, 'đúng giây đáo hạn phải tính là đến hạn');
  assert.equal(isDue(card, new Date(NOW.getTime() - 1000)), false);
  assert.equal(isDue(card, new Date(NOW.getTime() + 1000)), true);
});

/* -------------------------------------------------------------- bất biến */

test('bốn loại thẻ có mã riêng, không loại nào đè loại nào', () => {
  const keys = CARD_KINDS.map((k) => cardKey('w1', k));
  assert.equal(new Set(keys).size, CARD_KINDS.length);
});

test('module này KHÔNG kéo theo react-native — đó là lý do nó tồn tại', async () => {
  /*
    Test này canh chính điều kiện khiến cả file test này chạy được. Ai đó nhập
    một thứ từ `@/store` vào đây thì bộ test Node sẽ chết khi dịch
    `react-native/index.js`, và họ sẽ mất một lúc mới hiểu vì sao.
  */
  const { readFileSync } = await import('node:fs');
  const src = readFileSync(new URL('./schedule.ts', import.meta.url), 'utf8');
  assert.ok(!/from '@\/store/.test(src), 'schedule.ts không được import từ store');
  assert.ok(!/from 'react-native/.test(src), 'schedule.ts không được import react-native');
});
