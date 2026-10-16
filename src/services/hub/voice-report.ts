/**
 * Báo cáo phân tích giọng nói sau một lần ghi âm tự do.
 *
 * Chỉ tính những gì đo được TỪ BẢN CHỮ và MỐC THỜI GIAN của bộ nhận giọng trình
 * duyệt (không có âm thanh gốc): tốc độ nói, từ đệm, khoảng lặng, đa dạng từ,
 * từ lặp và độ tin cậy từng đoạn. Ngữ điệu, ngữ pháp và độ mạch lạc CHƯA đo được
 * trên trình duyệt — báo cáo ghi rõ là "chưa chấm", không đoán số.
 */
import {
  clarityOf,
  countFillers,
  countWords,
  lexicalVariety,
  pausesFromEvents,
  repeatedWords,
  words,
  type RecognizedSegment,
} from '@/services/speaking/metrics';

export type Dimension = 'pronunciation' | 'intonation' | 'fluency' | 'grammar' | 'vocabulary' | 'coherence';

export type DimensionScore = { key: Dimension; score: number | null; note: string };

export type VoiceReport = {
  wordCount: number;
  wpm: number | null;
  fillers: { total: number; byWord: Record<string, number> };
  pauses: { count: number; longestMs: number };
  variety: number | null;
  repeated: Array<{ word: string; count: number }>;
  /** Từng đoạn đã chốt, kèm mức tin cậy để tô màu. */
  segments: Array<{ text: string; level: 'good' | 'fair' | 'poor' | 'unknown' }>;
  dimensions: DimensionScore[];
  /** Điểm tổng 0–100 trên các chiều đo được; null nếu không đo được gì. */
  overall: number | null;
  /** Ước lượng band IELTS Speaking (heuristic, không phải chấm chính thức). */
  estimatedBand: number | null;
};

/** Đổi điểm 0–100 thành band 4.0–9.0, làm tròn 0,5. Chỉ là ước lượng. */
export function estimateBand(score: number): number {
  const raw = 4 + (Math.max(0, Math.min(100, score)) / 100) * 5;
  return Math.round(raw * 2) / 2;
}

function fluencyScore(wpm: number | null, fillers: number, longPauses: number, words: number): number | null {
  if (wpm === null || words < 10) return null;
  // Khoảng 110–160 từ/phút là tự nhiên; ngoài khoảng đó giảm dần.
  const pace = wpm >= 110 && wpm <= 160 ? 100 : wpm < 110 ? Math.max(0, 100 - (110 - wpm) * 1.5) : Math.max(0, 100 - (wpm - 160) * 1.5);
  const fillerRate = fillers / Math.max(1, words);
  const penalty = Math.min(40, fillerRate * 400) + Math.min(25, longPauses * 5);
  return Math.round(Math.max(0, pace - penalty));
}

export function buildVoiceReport(input: {
  transcript: string;
  segments: RecognizedSegment[];
  eventTimes: number[];
  durationMs: number;
  /** Ngữ điệu đo từ âm thanh micro; không có thì chiều ngữ điệu để null. */
  intonation?: { score: number | null; note: string };
}): VoiceReport {
  const { transcript, segments, eventTimes, durationMs, intonation } = input;
  const wordCount = countWords(transcript);
  const minutes = durationMs / 60_000;
  const wpm = minutes > 0.25 && wordCount > 0 ? Math.round(wordCount / minutes) : null;
  const fillers = countFillers(transcript);
  const pauses = pausesFromEvents(eventTimes);
  const toks = words(transcript);
  const variety = lexicalVariety(toks);
  const repeated = repeatedWords(toks);
  const clarity = clarityOf(segments);

  const segmentLevels = segments.map((s) => {
    const c = s.confidence;
    const level: 'good' | 'fair' | 'poor' | 'unknown' = c === null || c === undefined ? 'unknown' : c >= 0.85 ? 'good' : c >= 0.6 ? 'fair' : 'poor';
    return { text: s.text, level };
  });

  const pronunciation = clarity.avg === null ? null : Math.round(clarity.avg * 100);
  const fluency = fluencyScore(wpm, fillers.total, pauses.count, wordCount);
  const vocab = variety === null ? null : Math.round(Math.min(100, variety * 100));

  const dimensions: DimensionScore[] = [
    { key: 'pronunciation', score: pronunciation, note: pronunciation === null ? 'Chưa có đoạn nào để đo độ rõ.' : 'Dựa trên độ tin cậy của máy nghe, không phải chấm âm thanh.' },
    intonation
      ? { key: 'intonation', score: intonation.score, note: intonation.note }
      : { key: 'intonation', score: null, note: 'Chưa đo ngữ điệu: cần thu âm micro trong lúc nói.' },
    { key: 'fluency', score: fluency, note: wpm === null ? 'Nói thêm để đo tốc độ.' : `${wpm} từ/phút, ${fillers.total} từ đệm, ${pauses.count} lần ngập ngừng.` },
    { key: 'grammar', score: null, note: 'Chưa chấm ngữ pháp trong bản ghi tự do.' },
    { key: 'vocabulary', score: vocab, note: variety === null ? 'Cần nói thêm để đo độ đa dạng từ.' : `Tỉ lệ từ khác nhau ${Math.round(variety * 100)}%.` },
    { key: 'coherence', score: null, note: 'Chưa chấm độ mạch lạc.' },
  ];

  const measured = dimensions.map((d) => d.score).filter((s): s is number => s !== null);
  const overall = measured.length ? Math.round(measured.reduce((a, b) => a + b, 0) / measured.length) : null;

  return {
    wordCount,
    wpm,
    fillers,
    pauses,
    variety,
    repeated,
    segments: segmentLevels,
    dimensions,
    overall,
    estimatedBand: overall === null ? null : estimateBand(overall),
  };
}
