/**
 * HUẤN LUYỆN VIÊN GIỌNG NÓI — phần THUẦN (không chạm giọng đọc, test được trong Node).
 *
 * Từ kết quả chấm của máy (điểm + những từ hụt / gần đúng) dựng một KỊCH BẢN lời
 * nói tiếng Anh ngắn: khen / chỉ từ cần sửa / đọc mẫu chậm / mời đọc lại. Toàn
 * khuôn có sẵn, chọn ngẫu nhiên trong một nhóm câu nhưng KHÔNG lặp câu vừa dùng —
 * không gọi AI, không cần mạng.
 *
 *   ≥ 85       khen, mời sang câu tiếp.
 *   60 – 84    gọi tên 1–2 từ cần sửa, đọc mẫu từng từ thật chậm, mời đọc lại.
 *   < 60       "chậm lại", đọc mẫu cả câu chậm, mời đọc lại.
 */

export type CoachBand = 'good' | 'ok' | 'low';

/** Một câu huấn luyện viên nói: chữ, tốc độ (1 = thường), và quãng lặng sau đó (ms). */
export type CoachLine = { text: string; rate: number; pauseMs: number };

export type CoachPlan = { band: CoachBand; lines: CoachLine[]; captionVi: string; captionEn: string };

export type CoachInput = {
  score: number;
  /** Từ máy không nghe được. */
  missed: readonly string[];
  /** Từ gần đúng (cam). */
  near?: readonly string[];
  /** Câu / từ đang luyện — để đọc mẫu cả câu khi điểm thấp. */
  sentence: string;
};

export function coachBand(score: number): CoachBand {
  if (score >= 85) return 'good';
  if (score >= 60) return 'ok';
  return 'low';
}

const PRAISE = ['Great job!', 'Perfect!', 'Nice and clear!', 'Well done!', 'Excellent!', 'That sounded great!'];
const MOVE_ON = ["Let's move on.", 'Next one!', 'Ready for the next one?'];
const OK_OPEN = ['Good try.', 'Almost there.', 'Nice effort.', "You're close."];
const FOCUS_ONE = ['Watch the word', "Let's fix the word", 'Listen to the word'];
const FOCUS_TWO = ['Watch these words', "Let's fix these words", 'Listen to these words'];
const RETRY = ['Try again.', 'Now you try.', 'One more time.', 'Your turn.'];
const LOW_OPEN = ["Let's slow down.", 'No worries. Take it slowly.', "Let's try that slowly."];
const LOW_LISTEN = ['Listen.', 'Listen to me.', 'Here it is.'];
const GENERIC_OK = ['A little clearer this time.', 'Say each word a bit more clearly.'];

/** Bộ nhớ "câu vừa dùng" của mỗi nhóm — để lần sau không lặp lại. */
export type CoachMemory = Record<string, string>;

/** Chọn ngẫu nhiên một câu trong nhóm, tránh câu vừa dùng của nhóm đó. */
export function pickPhrase(pool: readonly string[], key: string, memory: CoachMemory, rng: () => number = Math.random): string {
  const choices = pool.length > 1 ? pool.filter((p) => p !== memory[key]) : pool;
  const out = choices[Math.min(choices.length - 1, Math.floor(rng() * choices.length))]!;
  memory[key] = out;
  return out;
}

/** Từ cần sửa: ưu tiên từ hụt, rồi từ gần đúng; tối đa hai, không trùng. */
export function wordsToFix(missed: readonly string[], near: readonly string[] = []): string[] {
  return [...new Set([...missed, ...near].map((w) => w.trim().toLowerCase()).filter((w) => /\p{L}/u.test(w)))].slice(0, 2);
}

export function planCoach(input: CoachInput, memory: CoachMemory = {}, rng: () => number = Math.random): CoachPlan {
  const band = coachBand(input.score);
  const p = (pool: readonly string[], key: string) => pickPhrase(pool, key, memory, rng);

  if (band === 'good') {
    return {
      band,
      lines: [
        { text: p(PRAISE, 'praise'), rate: 1, pauseMs: 150 },
        { text: p(MOVE_ON, 'moveOn'), rate: 1, pauseMs: 0 },
      ],
      captionVi: 'Rất tốt! Sang câu tiếp nhé.',
      captionEn: 'Great! On to the next one.',
    };
  }

  if (band === 'ok') {
    const words = wordsToFix(input.missed, input.near);
    const lines: CoachLine[] = [{ text: p(OK_OPEN, 'okOpen'), rate: 1, pauseMs: 120 }];
    if (words.length === 0) {
      lines.push({ text: p(GENERIC_OK, 'genericOk'), rate: 1, pauseMs: 120 });
    } else {
      lines.push({ text: `${p(words.length > 1 ? FOCUS_TWO : FOCUS_ONE, 'focus')}.`, rate: 1, pauseMs: 200 });
      for (const w of words) lines.push({ text: w, rate: 0.55, pauseMs: 450 });
    }
    lines.push({ text: p(RETRY, 'retry'), rate: 1, pauseMs: 0 });
    return {
      band,
      lines,
      captionVi: words.length ? `Gần đúng rồi. Luyện: ${words.join(', ')}. Thử lại nhé.` : 'Gần đúng rồi. Đọc rõ hơn chút, thử lại nhé.',
      captionEn: words.length ? `Almost. Practise: ${words.join(', ')}. Try again.` : 'Almost. A bit clearer, try again.',
    };
  }

  const lines: CoachLine[] = [
    { text: p(LOW_OPEN, 'lowOpen'), rate: 1, pauseMs: 150 },
    { text: p(LOW_LISTEN, 'lowListen'), rate: 1, pauseMs: 250 },
    { text: input.sentence, rate: 0.6, pauseMs: 400 },
    { text: p(RETRY, 'retry'), rate: 1, pauseMs: 0 },
  ];
  return { band, lines, captionVi: 'Chậm lại một chút. Nghe mẫu rồi thử lại nhé.', captionEn: 'Slow down a little. Listen, then try again.' };
}
