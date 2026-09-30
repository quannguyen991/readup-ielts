/**
 * CHỈ SỐ NÓI ĐO TẠI MÁY — không cần AI, luôn có, kể cả khi hết lượt AI.
 *
 * Nói thật về giới hạn: tất cả chỉ số ở đây đọc từ BẢN CHỮ mà bộ nhận giọng
 * của trình duyệt trả về, không từ âm thanh. Hệ quả cụ thể:
 *   - Bộ nhận giọng của Chrome hay LƯỢC BỎ "uh", "um" — số từ đệm đếm được có
 *     thể thấp hơn thực tế.
 *   - Khoảng lặng ước từ nhịp các sự kiện nhận giọng (mỗi lần máy nghe thêm
 *     được chữ là một sự kiện), không đo biên độ âm thanh.
 *
 * Bản chữ là tiếng Anh, nhưng vẫn dùng ranh giới `\p{L}` kèm cờ `u` thay cho
 * `\b` — `\b` của JS không hiểu chữ có dấu, và câu trả lời có thể lẫn tên riêng
 * tiếng Việt.
 */

export type RecognizedSegment = {
  text: string;
  /** Độ tin cậy 0–1 của bộ nhận giọng; null khi trình duyệt không báo (hoặc báo 0). */
  confidence: number | null;
};

export type AnswerMetrics = {
  words: number;
  /** Tổng thời gian của câu trả lời (từ lúc bắt đầu nghe tới lúc dừng), giây. */
  durationSec: number;
  /** Thời gian thực sự nói (bỏ khoảng chờ đầu và khoảng lặng cuối), giây. null khi gõ phím. */
  speakingSec: number | null;
  /** Từ mỗi phút trên thời gian thực sự nói. null khi gõ phím hoặc quá ít dữ liệu. */
  wpm: number | null;
  fillers: number;
  fillerWords: Record<string, number>;
  /** Số khoảng lặng dài (≥ LONG_PAUSE_MS) GIỮA lúc nói. */
  longPauses: number;
  longestPauseSec: number;
  /** Thời gian từ lúc micro mở tới khi máy nghe được chữ đầu tiên. */
  startDelaySec: number | null;
  /** Độ tin cậy trung bình (theo số từ) của các đoạn có báo độ tin cậy. */
  avgConfidence: number | null;
  /** Số từ nằm trong đoạn có độ tin cậy thấp. */
  lowConfWords: number;
  /** Số từ nằm trong đoạn có báo độ tin cậy. */
  confWords: number;
};

export type AttemptMetrics = {
  answers: number;
  words: number;
  avgWords: number;
  wpm: number | null;
  fillers: number;
  fillersPer100: number;
  longPauses: number;
  /** Độ đa dạng từ: tỉ lệ từ khác nhau trên cửa sổ trượt 50 từ (MATTR), 0–1. */
  lexicalVariety: number | null;
  repeated: Array<{ word: string; count: number }>;
  /** Số câu trả lời ngắn hơn mức tối thiểu của phần đó. */
  shortAnswers: number;
  avgConfidence: number | null;
  /** Tỉ lệ từ nghe không chắc, 0–1. */
  lowConfShare: number | null;
};

/** Khoảng lặng từ 2 giây trở lên giữa lúc nói được tính là ngắt quãng dài. */
export const LONG_PAUSE_MS = 2_000;
/** Đoạn có độ tin cậy dưới mức này coi là máy nghe không chắc. */
export const LOW_CONFIDENCE = 0.75;
/** Số từ tối thiểu để một câu trả lời không bị coi là quá ngắn. */
export const MIN_WORDS: Record<1 | 2 | 3, number> = { 1: 20, 2: 110, 3: 35 };

const L = '\\p{L}\\p{N}';
const WORD_RE = new RegExp(`[${L}]+(?:['’][${L}]+)*`, 'gu');

export function words(text: string): string[] {
  return (text.match(WORD_RE) ?? []).map((w) => w.toLowerCase().replace(/’/g, "'"));
}

export function countWords(text: string): number {
  return (text.match(WORD_RE) ?? []).length;
}

/**
 * Từ đệm. "like" chỉ tính khi đứng sau một từ mà sau nó "like" gần như chắc
 * chắn là đệm ("it was like…", "and like…") — "I like music" hay "a city
 * like Hanoi" là cách dùng đúng, đếm vào là oan cho người học.
 */
const SIMPLE_FILLERS = ['uh', 'um', 'uhm', 'umm', 'er', 'erm', 'ah', 'hmm', 'mm'];
const PHRASE_FILLERS = ['you know', 'i mean'];
const LIKE_AFTER = new Set(['was', 'is', "it's", 'its', 'just', 'and', 'so', 'but', 'um', 'uh', 'er', 'basically', 'literally', 'were', "i'm", "he's", "she's", "they're", "we're"]);

export type TextPiece = { text: string; filler: boolean };

/** Tách bản chữ thành các mẩu, đánh dấu mẩu là từ đệm — để tô màu ở màn kết quả. */
export function markFillers(text: string): TextPiece[] {
  const ranges: Array<[number, number]> = [];
  const lower = text.toLowerCase().replace(/’/g, "'");
  const bound = (s: string) => new RegExp(`(?<![${L}'])${s}(?![${L}'])`, 'gu');

  for (const f of [...PHRASE_FILLERS, ...SIMPLE_FILLERS]) {
    for (const m of lower.matchAll(bound(f.replace(/ /g, '\\s+')))) {
      ranges.push([m.index, m.index + m[0].length]);
    }
  }
  for (const m of lower.matchAll(bound('like'))) {
    const before = lower.slice(0, m.index).match(new RegExp(`([${L}']+)[\\s,]*$`, 'u'));
    const prev = before?.[1];
    if ((prev && LIKE_AFTER.has(prev)) || /,\s*$/.test(lower.slice(0, m.index))) ranges.push([m.index, m.index + 4]);
  }

  ranges.sort((a, b) => a[0] - b[0]);
  const merged: Array<[number, number]> = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (last && r[0] < last[1]) last[1] = Math.max(last[1], r[1]);
    else merged.push([r[0], r[1]]);
  }

  const out: TextPiece[] = [];
  let at = 0;
  for (const [s, e] of merged) {
    if (s > at) out.push({ text: text.slice(at, s), filler: false });
    out.push({ text: text.slice(s, e), filler: true });
    at = e;
  }
  if (at < text.length) out.push({ text: text.slice(at), filler: false });
  return out;
}

export function countFillers(text: string): { total: number; byWord: Record<string, number> } {
  const byWord: Record<string, number> = {};
  let total = 0;
  for (const p of markFillers(text)) {
    if (!p.filler) continue;
    const key = p.text.toLowerCase().replace(/\s+/g, ' ');
    byWord[key] = (byWord[key] ?? 0) + 1;
    total += 1;
  }
  return { total, byWord };
}

/**
 * Khoảng lặng từ nhịp sự kiện nhận giọng.
 *
 * `times` là mốc (ms, tính từ lúc mở micro) của MỖI lần bộ nhận giọng báo thêm
 * chữ. Khoảng trống giữa hai mốc liên tiếp ≥ ngưỡng là một lần ngắt dài. Khoảng
 * lặng SAU mốc cuối không tính: đó là lúc người học đã nói xong và máy đang chờ
 * đủ ngưỡng im lặng để tự dừng.
 */
export function pausesFromEvents(times: number[], thresholdMs = LONG_PAUSE_MS): { count: number; longestMs: number } {
  const sorted = [...times].filter((t) => Number.isFinite(t) && t >= 0).sort((a, b) => a - b);
  let count = 0;
  let longestMs = 0;
  for (let i = 1; i < sorted.length; i += 1) {
    const gap = sorted[i]! - sorted[i - 1]!;
    if (gap >= thresholdMs) {
      count += 1;
      longestMs = Math.max(longestMs, gap);
    }
  }
  return { count, longestMs };
}

/** Độ tin cậy trung bình theo số từ; bỏ đoạn không báo độ tin cậy. */
export function clarityOf(segments: RecognizedSegment[]): { avg: number | null; lowWords: number; confWords: number } {
  let sum = 0;
  let confWords = 0;
  let lowWords = 0;
  for (const s of segments) {
    const c = s.confidence;
    if (c == null || !(c > 0) || c > 1) continue;
    const n = countWords(s.text);
    if (!n) continue;
    sum += c * n;
    confWords += n;
    if (c < LOW_CONFIDENCE) lowWords += n;
  }
  return { avg: confWords ? Math.round((sum / confWords) * 1000) / 1000 : null, lowWords, confWords };
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Chỉ số của MỘT câu trả lời.
 *
 * `eventTimes` rỗng nghĩa là câu trả lời được GÕ PHÍM: khi đó không có tốc độ
 * nói, không có khoảng lặng — trả null chứ không bịa số.
 */
export function answerMetrics(input: {
  transcript: string;
  segments: RecognizedSegment[];
  durationMs: number;
  eventTimes: number[];
}): AnswerMetrics {
  const n = countWords(input.transcript);
  const f = countFillers(input.transcript);
  const clarity = clarityOf(input.segments);
  const times = [...input.eventTimes].filter((t) => Number.isFinite(t) && t >= 0).sort((a, b) => a - b);
  const spoken = times.length > 0;
  const pauses = pausesFromEvents(times);

  let speakingSec: number | null = null;
  let wpm: number | null = null;
  if (spoken) {
    // Từ đầu tiên đã được nói TRƯỚC sự kiện đầu tiên một chút; cộng bù 0,6 giây.
    const ms = Math.max(3_000, times[times.length - 1]! - times[0]! + 600);
    speakingSec = round1(ms / 1000);
    wpm = n >= 5 ? Math.round((n / ms) * 60_000) : null;
  }

  return {
    words: n,
    durationSec: round1(Math.max(0, input.durationMs) / 1000),
    speakingSec,
    wpm,
    fillers: f.total,
    fillerWords: f.byWord,
    longPauses: pauses.count,
    longestPauseSec: round1(pauses.longestMs / 1000),
    startDelaySec: spoken ? round1(times[0]! / 1000) : null,
    avgConfidence: clarity.avg,
    lowConfWords: clarity.lowWords,
    confWords: clarity.confWords,
  };
}

/**
 * Độ đa dạng từ theo cửa sổ trượt (MATTR). Tỉ lệ từ-khác-nhau/tổng-từ thô tụt
 * dần theo độ dài bài, nên so một câu trả lời 30 từ với một bài 300 từ là so
 * khập khiễng; cửa sổ cố định 50 từ khử được điều đó.
 */
export function lexicalVariety(tokens: string[], window = 50): number | null {
  if (tokens.length < 10) return null;
  if (tokens.length <= window) return Math.round((new Set(tokens).size / tokens.length) * 100) / 100;
  let sum = 0;
  let count = 0;
  for (let i = 0; i + window <= tokens.length; i += 1) {
    sum += new Set(tokens.slice(i, i + window)).size / window;
    count += 1;
  }
  return Math.round((sum / count) * 100) / 100;
}

/** Từ chức năng không tính là "lặp từ" — nói "the" 20 lần là bình thường. */
const STOP = new Set(
  (
    "a an the and or but so if then than that this these those it its it's is are was were be been being am i i'm me my we our you your he she him her his they them their there here of to in on at for with from by about as into up out not no do does did don't didn't can can't could would will should have has had just very really also because when what which who how where why more most some any all one two lot lots like think know get got go going well yeah yes"
  ).split(' '),
);

export function repeatedWords(tokens: string[], min = 3, top = 6): Array<{ word: string; count: number }> {
  const counts = new Map<string, number>();
  for (const t of tokens) {
    if (t.length < 3 || STOP.has(t) || /^\d+$/.test(t)) continue;
    counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, c]) => c >= min)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, top)
    .map(([word, count]) => ({ word, count }));
}

/** Gộp chỉ số cả lượt thi. */
export function attemptMetrics(
  answers: Array<{ part: 1 | 2 | 3; transcript: string; metrics: AnswerMetrics }>,
): AttemptMetrics {
  const tokens = answers.flatMap((a) => words(a.transcript));
  const total = answers.reduce((s, a) => s + a.metrics.words, 0);
  const fillers = answers.reduce((s, a) => s + a.metrics.fillers, 0);

  // Tốc độ chung = tổng từ / tổng thời gian nói, KHÔNG phải trung bình các wpm.
  let spokenWords = 0;
  let spokenSec = 0;
  for (const a of answers) {
    if (a.metrics.speakingSec != null && a.metrics.words > 0) {
      spokenWords += a.metrics.words;
      spokenSec += a.metrics.speakingSec;
    }
  }
  let confSum = 0;
  let confWords = 0;
  let lowWords = 0;
  for (const a of answers) {
    if (a.metrics.avgConfidence != null && a.metrics.confWords > 0) {
      confSum += a.metrics.avgConfidence * a.metrics.confWords;
      confWords += a.metrics.confWords;
      lowWords += a.metrics.lowConfWords;
    }
  }

  return {
    answers: answers.length,
    words: total,
    avgWords: answers.length ? Math.round(total / answers.length) : 0,
    wpm: spokenSec >= 5 && spokenWords >= 10 ? Math.round((spokenWords / spokenSec) * 60) : null,
    fillers,
    fillersPer100: total ? round1((fillers / total) * 100) : 0,
    longPauses: answers.reduce((s, a) => s + a.metrics.longPauses, 0),
    lexicalVariety: lexicalVariety(tokens),
    repeated: repeatedWords(tokens),
    shortAnswers: answers.filter((a) => a.metrics.words < MIN_WORDS[a.part]).length,
    avgConfidence: confWords ? Math.round((confSum / confWords) * 1000) / 1000 : null,
    lowConfShare: confWords ? Math.round((lowWords / confWords) * 1000) / 1000 : null,
  };
}
