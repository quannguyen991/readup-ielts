import assert from 'node:assert/strict';
import { test } from 'node:test';
import { State } from 'ts-fsrs';
import { cardKey, emptyCard, type StoredCard } from './schedule';
import {
  calculate7DayForecast,
  calculateMemoryLevels,
  findTopicWordInfo,
  importLearnedTopicWords,
  WEEKDAY_LABELS,
} from './spaced-repetition';

test('dự báo 7 ngày trả về đủ 7 thứ từ CN đến Th7', () => {
  const forecast = calculate7DayForecast({}, {}, new Date('2026-09-27T10:00:00Z'));
  assert.equal(forecast.length, 7);
  assert.deepEqual(forecast.map((f) => f.dayLabel), WEEKDAY_LABELS);
  // Ngày 2026-09-27 là Chủ Nhật
  assert.equal(forecast[0]?.isToday, true);
  assert.equal(forecast[1]?.isToday, false);
});

test('thẻ đã đến hạn hoặc quá hạn được dồn vào ngày hôm nay', () => {
  const now = new Date('2026-09-27T10:00:00Z'); // Chủ Nhật
  const entries = {
    w1: { id: 'w1' },
    w2: { id: 'w2' },
  };

  const cards: Record<string, StoredCard> = {
    // w1 quá hạn (hạn ngày 25)
    [cardKey('w1', 'word_to_meaning')]: {
      ...emptyCard(now),
      due: '2026-09-25T10:00:00Z',
    },
    // w2 đến hạn hôm nay lúc 11h
    [cardKey('w2', 'word_to_meaning')]: {
      ...emptyCard(now),
      due: '2026-09-27T11:00:00Z',
    },
  };

  const forecast = calculate7DayForecast(entries, cards, now);
  // Chủ nhật (hôm nay) nhận cả 2 từ
  assert.equal(forecast[0]?.count, 2);
});

test('thẻ có hạn ôn vào Thứ Ba được xếp đúng vào cột Th3', () => {
  const now = new Date('2026-09-27T10:00:00Z'); // Chủ Nhật
  const entries = {
    w3: { id: 'w3' },
  };

  // Thứ Ba tuần này là 2026-09-29
  const cards: Record<string, StoredCard> = {
    [cardKey('w3', 'word_to_meaning')]: {
      ...emptyCard(now),
      due: '2026-09-29T14:00:00Z',
    },
  };

  const forecast = calculate7DayForecast(entries, cards, now);
  const tuesday = forecast.find((f) => f.dayLabel === 'Th3');
  assert.equal(tuesday?.count, 1);
});

test('phân loại mức độ nhớ: chưa nhớ, cần học, hay quên, nhớ tạm, nhớ sâu', () => {
  const now = new Date('2026-09-27T10:00:00Z');
  const entries = {
    w_new: { id: 'w_new', lemma: 'new' },
    w_learning: { id: 'w_learning', lemma: 'learning' },
    w_forgetful: { id: 'w_forgetful', lemma: 'forgetful' },
    w_temp: { id: 'w_temp', lemma: 'temp' },
    w_master: { id: 'w_master', lemma: 'master' },
  };

  const cards: Record<string, StoredCard> = {
    // New: state New, chưa ôn
    [cardKey('w_new', 'word_to_meaning')]: emptyCard(now),

    // Learning: state Learning
    [cardKey('w_learning', 'word_to_meaning')]: {
      ...emptyCard(now),
      state: State.Learning,
      last_review: '2026-09-26T10:00:00Z',
      stability: 1.5,
    },

    // Forgetful: state Relearning
    [cardKey('w_forgetful', 'word_to_meaning')]: {
      ...emptyCard(now),
      state: State.Relearning,
      last_review: '2026-09-27T08:00:00Z',
      stability: 0.5,
    },

    // Temp: state Review, stability < 21
    [cardKey('w_temp', 'word_to_meaning')]: {
      ...emptyCard(now),
      state: State.Review,
      last_review: '2026-09-25T10:00:00Z',
      stability: 10,
    },

    // Mastered: state Review, stability >= 21
    [cardKey('w_master', 'word_to_meaning')]: {
      ...emptyCard(now),
      state: State.Review,
      last_review: '2026-09-10T10:00:00Z',
      stability: 35,
    },
  };

  const levels = calculateMemoryLevels(entries, cards, undefined, now);
  assert.equal(levels.unmemorized, 1);
  assert.equal(levels.needLearning, 1);
  assert.equal(levels.forgetful, 1);
  assert.equal(levels.temporary, 1);
  assert.equal(levels.mastered, 1);
  assert.equal(levels.total, 5);
});

test('tra cứu từ theo chủ đề trong kho 2.500 từ', () => {
  // Tìm thử một từ phổ biến trong bộ từ chủ đề
  const info = findTopicWordInfo('environment');
  if (info) {
    assert.equal(info.word.toLowerCase(), 'environment');
    assert.ok(info.meaningVi.length > 0);
  }
});

test('importLearnedTopicWords: tự động tạo entry và FSRS cards cho từ đã học ở bộ từ', () => {
  const now = new Date('2026-09-27T10:00:00Z');
  const stages = {
    environment: {
      pollution: 2, // stage 2: nhớ được
    },
  };

  const result = importLearnedTopicWords(stages, {}, {}, now);
  assert.equal(result.addedCount, 1);
  const entry = Object.values(result.entries)[0];
  assert.ok(entry);
  assert.equal(entry.lemma, 'pollution');
  assert.equal(entry.masteryPercent, 60);

  // Thẻ FSRS được tạo và có lịch ôn
  const card = result.cards[cardKey(entry.id, 'word_to_meaning')];
  assert.ok(card);
  assert.ok(card.due);
  // Do rating là Good (3) nên due sau now
  assert.ok(new Date(card.due).getTime() > now.getTime());
});

