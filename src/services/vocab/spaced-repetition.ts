import { State, type Card } from 'ts-fsrs';
import { CARD_KINDS, cardKey, emptyCard, applyGrade, fromStored, isDue, type CardKind, type StoredCard } from './schedule';
import type { VocabEntry } from '@/store/useVocabStore';
import { VOCAB_TOPICS, type VocabTopicWord } from '@/data/vocab-topics';

/**
 * Xếp lịch và thống kê LẶP LẠI NGẮT QUÃNG (Spaced Repetition / FSRS).
 *
 * Hàm thuần — không phụ thuộc React, test được độc lập bằng Node test runner.
 */

export type DayForecast = {
  /** Nhãn thứ: 'CN', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7'. */
  dayLabel: string;
  /** YYYY-MM-DD */
  dateKey: string;
  /** Số từ đến hạn trong ngày này */
  count: number;
  /** Có phải ngày hôm nay không */
  isToday: boolean;
};

export const WEEKDAY_LABELS = ['CN', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7'];

/**
 * Dự báo ôn tập 7 ngày trong tuần (từ Chủ Nhật đến Thứ Bảy).
 *
 * Ngày hôm nay nhận mọi thẻ ĐÃ ĐẾN HẠN (kể cả quá hạn từ hôm trước chưa ôn).
 * Các ngày tiếp theo nhận thẻ có hạn ôn rơi vào ngày đó.
 */
export function calculate7DayForecast(
  entries: Record<string, { id: string }>,
  cards: Record<string, StoredCard>,
  now: Date = new Date(),
): DayForecast[] {
  // Tìm Chủ Nhật của tuần hiện tại (bắt đầu tuần lúc 00:00:00)
  const today = new Date(now);
  const currentDayOfWeek = today.getDay(); // 0: CN, 1: Th2, ..., 6: Th7

  const sunday = new Date(today);
  sunday.setDate(today.getDate() - currentDayOfWeek);
  sunday.setHours(0, 0, 0, 0);

  const days: DayForecast[] = [];
  const endOfToday = new Date(today);
  endOfToday.setHours(23, 59, 59, 999);

  // Chuẩn bị 7 ngày
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateKey = `${yyyy}-${mm}-${dd}`;

    days.push({
      dayLabel: WEEKDAY_LABELS[i]!,
      dateKey,
      count: 0,
      isToday: i === currentDayOfWeek,
    });
  }

  // Duyệt qua từng từ và tìm ngày đến hạn sớm nhất của từ đó
  for (const entry of Object.values(entries)) {
    let earliestDue: Date | null = null;

    for (const kind of CARD_KINDS) {
      const card = cards[cardKey(entry.id, kind)];
      if (!card) continue;
      const dueDate = new Date(card.due);
      if (!earliestDue || dueDate < earliestDue) {
        earliestDue = dueDate;
      }
    }

    if (!earliestDue) continue;

    // Nếu từ đã đến hạn trước hoặc trong ngày hôm nay: cộng vào cột ngày hôm nay
    if (earliestDue.getTime() <= endOfToday.getTime()) {
      days[currentDayOfWeek]!.count += 1;
    } else {
      // Tìm xem rơi vào ngày nào trong các ngày còn lại của tuần
      const yyyy = earliestDue.getFullYear();
      const mm = String(earliestDue.getMonth() + 1).padStart(2, '0');
      const dd = String(earliestDue.getDate()).padStart(2, '0');
      const dueKey = `${yyyy}-${mm}-${dd}`;

      const targetDay = days.find((d) => d.dateKey === dueKey);
      if (targetDay) {
        targetDay.count += 1;
      }
    }
  }

  return days;
}

export type MemoryLevels = {
  /** Chưa nhớ (New) */
  unmemorized: number;
  /** Cần học (Learning) */
  needLearning: number;
  /** Hay quên (Relearning hoặc lapses cao) */
  forgetful: number;
  /** Nhớ tạm (Review stability < 21 ngày) */
  temporary: number;
  /** Nhớ sâu (Review stability >= 21 ngày) */
  mastered: number;
  /** Tổng số từ đến hạn ôn hôm nay */
  dueCount: number;
  /** Tổng số từ */
  total: number;
};

/**
 * Phân loại mức độ nhớ của các từ theo tiêu chuẩn FSRS / Spaced Repetition.
 */
export function calculateMemoryLevels(
  entries: Record<string, { id: string; lemma: string }>,
  cards: Record<string, StoredCard>,
  lapses?: Record<string, Record<string, number>>,
  now: Date = new Date(),
): MemoryLevels {
  let unmemorized = 0;
  let needLearning = 0;
  let forgetful = 0;
  let temporary = 0;
  let mastered = 0;
  let dueCount = 0;

  const nowMs = now.getTime();

  for (const entry of Object.values(entries)) {
    const ownCards = CARD_KINDS.map((k) => cards[cardKey(entry.id, k)]).filter(
      (c): c is StoredCard => Boolean(c),
    );

    const hasDue = ownCards.some((c) => new Date(c.due).getTime() <= nowMs);
    if (hasDue) dueCount += 1;

    if (ownCards.length === 0) {
      unmemorized += 1;
      continue;
    }

    // Kiểm tra xem có lapse cao không
    let maxLapse = 0;
    if (lapses) {
      for (const topicMap of Object.values(lapses)) {
        if (topicMap[entry.lemma]) {
          maxLapse = Math.max(maxLapse, topicMap[entry.lemma] ?? 0);
        }
      }
    }

    // Đánh giá trạng thái tổng hợp của các thẻ
    const anyRelearning = ownCards.some((c) => c.state === State.Relearning);
    const anyLearning = ownCards.some((c) => c.state === State.Learning);
    const allNew = ownCards.every((c) => c.state === State.New && !c.last_review);
    const maxStability = Math.max(...ownCards.map((c) => c.stability));

    if (maxLapse >= 3 || anyRelearning) {
      forgetful += 1;
    } else if (allNew) {
      unmemorized += 1;
    } else if (anyLearning) {
      needLearning += 1;
    } else if (maxStability >= 21) {
      mastered += 1;
    } else {
      temporary += 1;
    }
  }

  return {
    unmemorized,
    needLearning,
    forgetful,
    temporary,
    mastered,
    dueCount,
    total: Object.keys(entries).length,
  };
}

/** Tra cứu thông tin từ theo chủ đề trong bộ 2.500 từ */
const topicWordsMap = new Map<string, VocabTopicWord>();
for (const topic of VOCAB_TOPICS) {
  for (const w of topic.words) {
    const key = w.word.trim().toLowerCase();
    if (!topicWordsMap.has(key)) {
      topicWordsMap.set(key, w);
    }
  }
}

export function findTopicWordInfo(word: string): VocabTopicWord | undefined {
  return topicWordsMap.get(word.trim().toLowerCase());
}

/**
 * Tự động đưa các từ đã học trong các bộ chủ đề (stage >= 1) vào sổ từ và
 * khởi tạo thẻ FSRS lặp lại ngắt quãng nếu chưa có.
 *
 * Nhờ vậy: người học học 50 từ ở bộ từ hôm nay sẽ tự động được FSRS xếp lịch
 * ôn tập vào ngày mai và phân bổ trong 1 tuần tới.
 */
export function importLearnedTopicWords(
  stages: Record<string, Record<string, number>>,
  existingEntries: Record<string, VocabEntry>,
  existingCards: Record<string, StoredCard>,
  now: Date = new Date(),
): { entries: Record<string, VocabEntry>; cards: Record<string, StoredCard>; addedCount: number } {
  const existingLemmas = new Set(
    Object.values(existingEntries).map((e) => e.lemma.trim().toLowerCase()),
  );

  const nextEntries = { ...existingEntries };
  const nextCards = { ...existingCards };
  let addedCount = 0;

  for (const [slug, topicStages] of Object.entries(stages)) {
    for (const [word, stage] of Object.entries(topicStages)) {
      if (stage < 1) continue;
      const lemma = word.trim().toLowerCase();
      if (existingLemmas.has(lemma)) continue;

      const info = findTopicWordInfo(word);
      if (!info) continue;

      const id = `topic_${slug}_${lemma.replace(/[^a-z0-9]/gi, '_')}`;
      const entry: VocabEntry = {
        id,
        word: info.word,
        lemma,
        phonetic: info.ipa || null,
        partOfSpeech: info.pos || null,
        definitionVi: info.meaningVi || null,
        definitionContext: info.definitionEn || null,
        definitionGeneral: info.definitionEn || null,
        exampleSentence: info.example || null,
        sourceSentence: info.example || '',
        articleId: slug,
        articleTitle: `Chủ đề: ${slug}`,
        paragraphIndex: null,
        isCollocation: Boolean(info.collocation),
        masteryPercent: stage === 2 ? 60 : 30,
        createdAt: now.toISOString(),
        synonyms: info.synonyms,
        antonyms: info.antonyms,
      };

      nextEntries[id] = entry;
      existingLemmas.add(lemma);
      addedCount += 1;

      // Khởi tạo 4 loại thẻ FSRS và xếp lịch ôn
      for (const kind of CARD_KINDS) {
        const k = cardKey(id, kind);
        const outcome = applyGrade(nextCards, id, kind, stage === 2 ? 3 : 2, now);
        nextCards[k] = outcome.card;
      }
    }
  }

  return { entries: nextEntries, cards: nextCards, addedCount };
}

