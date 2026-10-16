import { estimateBand, type Dimension, type VoiceReport } from './voice-report';

/**
 * Logic thuần của buổi luyện nói cùng AI: chuyển hội thoại thành tin nhắn cho giám khảo,
 * và gộp số liệu từng lượt thành một bản phân tích có điểm mạnh, điểm yếu, bước tiếp theo.
 *
 * Mọi con số ở đây đến từ `buildVoiceReport` (đo trên bản ghi và thời gian nói thật). Phần
 * chưa đo được (ngữ pháp, mạch lạc, phát âm từng âm) được ghi rõ là chưa đo, không bịa điểm.
 */

export type LiveTurn = {
  id: string;
  role: 'ai' | 'user';
  text: string;
  /** Số liệu của lượt nói (chỉ có ở lượt của người học). */
  report?: VoiceReport;
  /** Lượt không nghe rõ: không tính vào phân tích. */
  silent?: boolean;
};

export type AnalysisDimension = { key: Dimension; score: number | null; note: string };

export type SessionAnalysis = {
  answers: number;
  words: number;
  avgWpm: number | null;
  fillers: number;
  fillerRate: number;
  pauses: number;
  longestPauseMs: number;
  repeated: Array<{ word: string; count: number }>;
  dimensions: AnalysisDimension[];
  overall: number | null;
  band: number | null;
  strengths: string[];
  weaknesses: string[];
  nextSteps: string[];
};

const MAX_HISTORY = 12;
const WPM_MIN = 110;
const WPM_MAX = 160;
const FILLER_OK = 0.04;
const FILLER_HIGH = 0.08;
const LONG_PAUSE_MS = 2500;
const REPEAT_MIN = 3;

/**
 * Tin nhắn gửi cho giám khảo: toàn bộ hội thoại gần nhất, và lượt trả lời mới nhất kèm một
 * chỉ dẫn ngầm. Chỉ dẫn nói rõ AI phải phản ứng ngắn rồi hỏi đúng câu tiếp theo, không đọc
 * lại chỉ dẫn. Khi `nextQuestion` là null, AI chỉ cảm ơn và kết thúc.
 */
export function examinerMessages(
  turns: LiveTurn[],
  nextQuestion: string | null,
): Array<{ role: 'user' | 'assistant'; content: string }> {
  const history = turns
    .filter((t) => !t.silent && t.text.trim().length > 0)
    .map((t) => ({ role: (t.role === 'ai' ? 'assistant' : 'user') as 'user' | 'assistant', content: t.text.trim() }))
    .slice(-MAX_HISTORY);

  // Phải kết thúc bằng lượt của người học. Nếu lịch sử cuối là của AI thì không có gì để trả lời.
  const last = history[history.length - 1];
  if (!last || last.role !== 'user') return history;

  const instruction = nextQuestion
    ? `(Examiner instruction, do not read it aloud: react to the answer in at most two short sentences, then ask exactly this question: "${nextQuestion}")`
    : '(Examiner instruction, do not read it aloud: thank the candidate in one or two short sentences and close the interview. Do not ask any new question.)';
  return [...history.slice(0, -1), { role: 'user', content: `${last.content}\n\n${instruction}` }];
}

export type LiveQuestion = { label: string; text: string; part: 1 | 2 | 3 };

/**
 * Sáu câu của một buổi, theo đúng thứ tự thi: 3 câu Part 1, cue card Part 2 (đề và gợi ý gộp
 * thành một câu để giám khảo đọc liền mạch), 2 câu Part 3.
 */
export function questionsOf(topic: { part1: string[]; part2: { prompt: string; bullets: string[] }; part3: string[] }): LiveQuestion[] {
  return [
    ...topic.part1.map((text) => ({ label: 'Part 1', text, part: 1 as const })),
    { label: 'Part 2', text: `${topic.part2.prompt} You should say: ${topic.part2.bullets.join(', ')}.`, part: 2 as const },
    ...topic.part3.map((text) => ({ label: 'Part 3', text, part: 3 as const })),
  ];
}

/** Gộp số liệu của mọi lượt có tiếng nói thành một bản phân tích. */
export function analyzeSession(turns: LiveTurn[]): SessionAnalysis {
  const reports = turns
    .filter((t) => t.role === 'user' && !t.silent && t.report)
    .map((t) => t.report as VoiceReport);

  const words = reports.reduce((sum, r) => sum + r.wordCount, 0);
  const paced = reports.map((r) => r.wpm).filter((w): w is number => w !== null);
  const avgWpm = paced.length ? Math.round(paced.reduce((a, b) => a + b, 0) / paced.length) : null;
  const fillers = reports.reduce((sum, r) => sum + r.fillers.total, 0);
  const fillerRate = words > 0 ? fillers / words : 0;
  const pauses = reports.reduce((sum, r) => sum + r.pauses.count, 0);
  const longestPauseMs = reports.reduce((max, r) => Math.max(max, r.pauses.longestMs), 0);

  const counts = new Map<string, number>();
  for (const r of reports) for (const w of r.repeated) counts.set(w.word, (counts.get(w.word) ?? 0) + w.count);
  const repeated = [...counts.entries()]
    .map(([word, count]) => ({ word, count }))
    .filter((w) => w.count >= REPEAT_MIN)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const dimensions = averageDimensions(reports, { avgWpm, fillerRate, words });
  const scored = reports.map((r) => r.overall).filter((o): o is number => o !== null);
  const overall = scored.length ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length) : null;
  const band = overall === null ? null : estimateBand(overall);

  const { strengths, weaknesses, nextSteps } = judge({
    words,
    avgWpm,
    fillerRate,
    fillers,
    longestPauseMs,
    repeated,
    vocab: dimensions.find((d) => d.key === 'vocabulary')?.score ?? null,
  });

  return {
    answers: reports.length,
    words,
    avgWpm,
    fillers,
    fillerRate,
    pauses,
    longestPauseMs,
    repeated,
    dimensions,
    overall,
    band,
    strengths,
    weaknesses,
    nextSteps,
  };
}

const DIM_ORDER: Dimension[] = ['pronunciation', 'intonation', 'fluency', 'grammar', 'vocabulary', 'coherence'];

/**
 * Trung bình từng tiêu chí trên các lượt đo được. Tiêu chí không lượt nào đo được thì null,
 * và ghi lời giải thích thật: vì sao chưa đo, không phải một con số giả.
 */
function averageDimensions(
  reports: VoiceReport[],
  s: { avgWpm: number | null; fillerRate: number; words: number },
): AnalysisDimension[] {
  return DIM_ORDER.map((key) => {
    const values = reports
      .map((r) => r.dimensions.find((d) => d.key === key)?.score)
      .filter((v): v is number => typeof v === 'number');
    const score = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null;
    return { key, score, note: noteFor(key, score, s) };
  });
}

function noteFor(
  key: Dimension,
  score: number | null,
  s: { avgWpm: number | null; fillerRate: number; words: number },
): string {
  switch (key) {
    case 'pronunciation':
      return score === null
        ? 'Chưa có đoạn nào đủ rõ để đo độ rõ lời.'
        : 'Đo theo độ tin cậy của máy nghe. Đây chưa phải chấm âm từng nguyên âm.';
    case 'intonation':
      return 'Chưa đo ngữ điệu: cần thu âm micro trong lúc nói.';
    case 'fluency':
      return s.avgWpm === null
        ? 'Nói thêm để đo tốc độ.'
        : `${s.avgWpm} từ/phút, từ đệm chiếm ${Math.round(s.fillerRate * 100)}% số từ.`;
    case 'grammar':
      return 'Chưa chấm ngữ pháp bằng máy. Phần nhận xét AI bên dưới có thể gợi ý thêm.';
    case 'vocabulary':
      return score === null ? 'Cần nói thêm để đo độ đa dạng từ.' : `Độ đa dạng từ vựng ${score}/100.`;
    case 'coherence':
      return 'Chưa chấm độ mạch lạc bằng máy. Phần nhận xét AI có thể gợi ý.';
  }
}

function judge(input: {
  words: number;
  avgWpm: number | null;
  fillerRate: number;
  fillers: number;
  longestPauseMs: number;
  repeated: Array<{ word: string; count: number }>;
  vocab: number | null;
}): { strengths: string[]; weaknesses: string[]; nextSteps: string[] } {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const nextSteps: string[] = [];

  if (input.avgWpm !== null) {
    if (input.avgWpm >= WPM_MIN && input.avgWpm <= WPM_MAX) {
      strengths.push(`Tốc độ ${input.avgWpm} từ/phút, trong khoảng tự nhiên (${WPM_MIN}–${WPM_MAX}).`);
    } else if (input.avgWpm < WPM_MIN) {
      weaknesses.push(`Tốc độ ${input.avgWpm} từ/phút, hơi chậm so với nhịp tự nhiên.`);
      nextSteps.push('Nói thành cụm dài theo nhịp: đọc to một câu mẫu rồi nói lại không dừng.');
    } else {
      weaknesses.push(`Tốc độ ${input.avgWpm} từ/phút, hơi nhanh, dễ nuốt âm cuối.`);
      nextSteps.push('Nghỉ một nhịp ngắn giữa các ý để người nghe theo kịp.');
    }
  }

  if (input.words >= 20) {
    if (input.fillerRate <= FILLER_OK) {
      strengths.push(`Từ đệm ít (${Math.round(input.fillerRate * 100)}% số từ).`);
    } else if (input.fillerRate > FILLER_HIGH) {
      weaknesses.push(`Từ đệm chiếm ${Math.round(input.fillerRate * 100)}% số từ (${input.fillers} lần).`);
      nextSteps.push('Thay “um”, “uh” bằng một nhịp im ngắn: dừng, nghĩ, rồi nói tiếp.');
    }
  }

  if (input.longestPauseMs > LONG_PAUSE_MS) {
    weaknesses.push(`Có khoảng ngập ngừng dài nhất ${Math.round(input.longestPauseMs / 1000)} giây.`);
    nextSteps.push('Trước khi trả lời, chốt ba ý trong đầu rồi mới bắt đầu nói.');
  }

  if (input.repeated.length > 0) {
    const top = input.repeated[0]!;
    weaknesses.push(`Lặp từ “${top.word}” ${top.count} lần.`);
    nextSteps.push('Tra 2–3 từ đồng nghĩa cho từ hay lặp và thử dùng trong câu tiếp theo.');
  }

  if (input.vocab !== null) {
    if (input.vocab >= 70) strengths.push('Vốn từ đa dạng, ít lặp.');
    else if (input.vocab < 50) weaknesses.push('Vốn từ còn lặp nhiều, chưa đa dạng.');
  }

  if (input.words > 0 && input.words < 30) {
    weaknesses.push(`Các câu trả lời còn ngắn (${input.words} từ).`);
    nextSteps.push('Trả lời đủ ba bước: ý chính, lý do, một ví dụ cụ thể.');
  }

  return {
    strengths,
    weaknesses,
    nextSteps: [...new Set(nextSteps)].slice(0, 4),
  };
}
