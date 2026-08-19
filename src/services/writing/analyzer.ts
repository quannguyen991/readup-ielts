import { countWords } from '@/lib/writing/word-count';
import type { WritingTask } from '@/lib/writing/types';

/**
 * Bộ phân tích bài viết KHÔNG dùng AI.
 *
 * Đây vừa là đường lui khi chấm AI hỏng, vừa là tính năng chính: nó chạy ngay
 * trong lúc người học gõ, nên phản hồi tức thì và không tốn token. Những gì đo
 * được bằng máy — số từ, có Overall hay không, lặp từ, độ dài câu — thì không
 * có lý do gì phải hỏi model.
 *
 * Nó KHÔNG thay được chấm AI: nó không đọc được nghĩa, không biết bài có bám
 * đúng số liệu hay không. Vì vậy `estimate` luôn là một khoảng rộng và phải
 * được hiển thị kèm chữ "ước lượng".
 */

export type HintCode =
  | 'too_short'
  | 'too_long'
  | 'few_paragraphs'
  | 'no_overview'
  | 'overview_has_numbers'
  | 'repeated_verb'
  | 'too_many_connectives'
  | 'long_sentence'
  | 'monotonous_sentences'
  | 'no_data_in_body';

export type Hint = {
  code: HintCode;
  /** 'warn' là lỗi ăn điểm; 'info' là chỗ có thể tốt hơn. */
  severity: 'warn' | 'info';
  message: string;
};

export type DraftAnalysis = {
  wordCount: number;
  paragraphCount: number;
  sentenceCount: number;
  hasOverview: boolean;
  repeatedWords: Array<{ word: string; count: number }>;
  connectivesPerSentence: number;
  hints: Hint[];
  /** Ước lượng thô, KHÔNG phải band. Luôn hiển thị kèm chữ "ước lượng". */
  estimate: { low: number; high: number };
};

/** Cách mở đầu đoạn overview mà giám khảo tìm. */
const OVERVIEW_OPENERS = [
  'overall',
  'in general',
  'it is clear that',
  'it can be seen that',
  'the most striking',
  'the most noticeable',
];

/**
 * Động từ xu hướng, gom về dạng gốc. Người học hay lặp đúng một chữ suốt bài —
 * đây là dấu hiệu điển hình của band 5.5 ở tiêu chí từ vựng.
 */
const TREND_LEMMAS: Record<string, string[]> = {
  increase: ['increase', 'increases', 'increased', 'increasing'],
  rise: ['rise', 'rises', 'rose', 'risen', 'rising'],
  grow: ['grow', 'grows', 'grew', 'grown', 'growing'],
  climb: ['climb', 'climbs', 'climbed', 'climbing'],
  fall: ['fall', 'falls', 'fell', 'fallen', 'falling'],
  decrease: ['decrease', 'decreases', 'decreased', 'decreasing'],
  decline: ['decline', 'declines', 'declined', 'declining'],
  drop: ['drop', 'drops', 'dropped', 'dropping'],
};

const CONNECTIVES = [
  'however',
  'moreover',
  'furthermore',
  'in addition',
  'additionally',
  'therefore',
  'thus',
  'consequently',
  'nevertheless',
  'on the other hand',
  'in contrast',
  'firstly',
  'secondly',
  'finally',
  'besides',
];

const LONG_SENTENCE_WORDS = 45;

export function analyseDraft(
  text: string,
  prompt: { task: WritingTask; minWords: number },
): DraftAnalysis {
  const wordCount = countWords(text);
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  const sentences = splitSentences(text);
  const lower = text.toLowerCase();

  const isTask1 = prompt.task === 'ielts_task1';
  const overviewParagraph = paragraphs.find((p) => startsOverview(p));
  const hasOverview = overviewParagraph != null;

  const repeatedWords = countTrendLemmas(lower);
  const connectiveCount = CONNECTIVES.reduce((sum, c) => sum + occurrences(lower, c), 0);
  const connectivesPerSentence = sentences.length === 0 ? 0 : connectiveCount / sentences.length;

  const hints: Hint[] = [];

  if (wordCount < prompt.minWords) {
    hints.push({
      code: 'too_short',
      severity: 'warn',
      message: `Mới ${wordCount}/${prompt.minWords} từ. Viết dưới mức tối thiểu bị trừ điểm Task Achievement.`,
    });
  } else if (wordCount > prompt.minWords * 1.6) {
    hints.push({
      code: 'too_long',
      severity: 'info',
      message: `${wordCount} từ là dài. Bài dài ở Task 1 thường có nghĩa là đang liệt kê thay vì chọn lọc.`,
    });
  }

  if (paragraphs.length < 4 && wordCount > prompt.minWords * 0.5) {
    hints.push({
      code: 'few_paragraphs',
      severity: 'warn',
      message: `Mới ${paragraphs.length} đoạn. Bài chuẩn có 4 đoạn: mở bài, overview, hai đoạn thân bài.`,
    });
  }

  if (isTask1) {
    if (!hasOverview && wordCount > prompt.minWords * 0.5) {
      hints.push({
        code: 'no_overview',
        severity: 'warn',
        message: 'Chưa có đoạn Overview. Thiếu nó thì Task Achievement bị chặn quanh band 5.',
      });
    }
    if (overviewParagraph && /\d/.test(overviewParagraph)) {
      hints.push({
        code: 'overview_has_numbers',
        severity: 'warn',
        message: 'Overview đang có con số. Chỗ này chỉ nói xu hướng, số liệu để dành cho thân bài.',
      });
    }
  }

  const overused = repeatedWords.filter((w) => w.count > 2);
  if (overused.length > 0) {
    const list = overused.map((w) => `"${w.word}" (${w.count} lần)`).join(', ');
    hints.push({
      code: 'repeated_verb',
      severity: 'info',
      message: `Lặp động từ xu hướng: ${list}. Đổi sang từ khác để nâng điểm từ vựng.`,
    });
  }

  if (sentences.length >= 4 && connectivesPerSentence > 0.6) {
    hints.push({
      code: 'too_many_connectives',
      severity: 'info',
      message: 'Gần như câu nào cũng có từ nối. Một bài chỉ cần 3–5 từ nối là đủ.',
    });
  }

  const longest = Math.max(0, ...sentences.map((s) => countWords(s)));
  if (longest > LONG_SENTENCE_WORDS) {
    hints.push({
      code: 'long_sentence',
      severity: 'info',
      message: `Có câu dài ${longest} từ. Câu quá dài dễ sai ngữ pháp — cân nhắc tách đôi.`,
    });
  }

  if (sentences.length >= 5 && lengthSpread(sentences) < 3) {
    hints.push({
      code: 'monotonous_sentences',
      severity: 'info',
      message: 'Các câu dài gần bằng nhau. Trộn câu ngắn với câu dài để tăng độ đa dạng ngữ pháp.',
    });
  }

  return {
    wordCount,
    paragraphCount: paragraphs.length,
    sentenceCount: sentences.length,
    hasOverview,
    repeatedWords,
    connectivesPerSentence,
    hints,
    estimate: estimateBand(hints),
  };
}

/**
 * Ước lượng thô từ số lỗi đếm được.
 *
 * Không phải band: máy không đọc được nghĩa nên không biết bài có bám đúng số
 * liệu hay không. Khoảng luôn rộng 1.0 để không tạo cảm giác chính xác giả.
 */
function estimateBand(hints: Hint[]): { low: number; high: number } {
  const warns = hints.filter((h) => h.severity === 'warn').length;
  const infos = hints.filter((h) => h.severity === 'info').length;

  const low = Math.max(4, 6.5 - warns * 0.75 - infos * 0.25);
  return { low: round(low), high: round(Math.min(8, low + 1)) };
}

function round(v: number): number {
  return Math.round(v * 2) / 2;
}

function startsOverview(paragraph: string): boolean {
  const head = paragraph.toLowerCase().trimStart().slice(0, 40);
  return OVERVIEW_OPENERS.some((o) => head.startsWith(o));
}

/**
 * Tách câu theo dấu kết câu.
 *
 * Không dùng lại `splitSentences` của `services/ingest/readability`: bản đó đòi
 * câu sau phải bắt đầu bằng chữ hoa, hợp lý với bài báo đã biên tập nhưng sai
 * với bài nháp của người học — họ hay viết thường, và khi đó cả bài bị đếm
 * thành một câu, kéo theo mọi chỉ số về độ dài câu đều sai.
 *
 * Cũng tránh lookbehind: dùng `match` thay vì `split` để chạy được trên mọi
 * engine, kể cả bản Hermes cũ.
 */
function splitSentences(text: string): string[] {
  return (text.match(/[^.!?]+[.!?]*/g) ?? [])
    .map((s) => s.trim())
    .filter((s) => countWords(s) > 0);
}

function countTrendLemmas(lower: string): Array<{ word: string; count: number }> {
  const out: Array<{ word: string; count: number }> = [];
  for (const [lemma, forms] of Object.entries(TREND_LEMMAS)) {
    const count = forms.reduce((sum, f) => sum + wordOccurrences(lower, f), 0);
    if (count > 0) out.push({ word: lemma, count });
  }
  return out.sort((a, b) => b.count - a.count);
}

/** Đếm số lần một từ xuất hiện nguyên vẹn, không tính khi nó nằm trong từ khác. */
function wordOccurrences(haystack: string, word: string): number {
  const re = new RegExp(`\\b${word}\\b`, 'g');
  return (haystack.match(re) ?? []).length;
}

/** Đếm cụm (có thể nhiều từ), dùng cho từ nối kiểu "on the other hand". */
function occurrences(haystack: string, phrase: string): number {
  const re = new RegExp(`\\b${phrase.replace(/\s+/g, '\\s+')}\\b`, 'g');
  return (haystack.match(re) ?? []).length;
}

/** Độ lệch chuẩn số từ mỗi câu — đo độ đa dạng độ dài câu. */
function lengthSpread(sentences: string[]): number {
  const lengths = sentences.map((s) => countWords(s));
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((sum, l) => sum + (l - mean) ** 2, 0) / lengths.length;
  return Math.sqrt(variance);
}
