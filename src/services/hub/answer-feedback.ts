/**
 * Phân tích một câu trả lời nói. Hai lớp:
 *   1. `localAnalysis` — luật chạy ngay trên máy, không cần mạng và không tốn lượt AI: độ dài, từ nối, từ lặp, độ đa dạng từ, từ đệm.
 *   2. AI (`/api/hub/feedback`) — nhận xét theo tiêu chí band, câu sai kèm bản sửa, từ nâng cấp, bản viết lại và gợi ý luyện tiếp.
 * Dùng chung cho client và máy chủ (không import gì phía máy chủ).
 */

export type FeedbackPart = 1 | 2 | 3;

export type LocalPoint = { tone: 'good' | 'warn' | 'tip'; textVi: string };
export type LocalAnalysis = {
  words: number;
  targetWords: [number, number];
  connectors: string[];
  repeated: { word: string; count: number }[];
  variety: number | null;
  points: LocalPoint[];
};

/** Số từ nên có cho một câu trả lời, theo Part (Part 2 là cả bài 1–2 phút). */
export const TARGET_WORDS: Record<FeedbackPart, [number, number]> = { 1: [22, 55], 2: [140, 260], 3: [45, 100] };

const CONNECTORS = [
  'because', 'since', 'so that', 'as a result', 'therefore', 'however', 'although', 'though', 'while', 'whereas', 'but', 'on the other hand',
  'for example', 'for instance', 'such as', 'in addition', 'besides', 'moreover', 'furthermore', 'also', 'firstly', 'first of all', 'then', 'after that',
  'finally', 'in my opinion', 'i think', 'i believe', 'personally', 'to be honest', 'actually', 'in fact', 'overall', 'in conclusion', 'what is more',
];
const REASON = ['because', 'since', 'so that', 'as a result', 'therefore'];
const EXAMPLE = ['for example', 'for instance', 'such as'];
const CONTRAST = ['however', 'although', 'though', 'while', 'whereas', 'but', 'on the other hand'];

const STOP = new Set(('the a an and or but of to in on at for with from by is are was were be been it its this that these those i you he she we they me my your his her our their ' +
  'do does did have has had will would can could not no yes so very just really like um uh er hmm as if than then there here what which who when where how why about into over more most some any ' +
  'think thing things lot get got go going went make made').split(' '));

function tokens(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z'\s]/g, ' ').split(/\s+/).filter(Boolean);
}

function countPhrase(text: string, phrase: string): number {
  const re = new RegExp(`\\b${phrase.replace(/\s+/g, '\\s+')}\\b`, 'g');
  return (text.toLowerCase().match(re) ?? []).length;
}

export function localAnalysis(input: { transcript: string; part: FeedbackPart; fillers: number; wpm: number | null; ms: number }): LocalAnalysis {
  const { transcript, part, fillers, wpm, ms } = input;
  const toks = tokens(transcript);
  const words = toks.length;
  const [lo, hi] = TARGET_WORDS[part];
  const points: LocalPoint[] = [];

  // Độ dài
  if (words < lo * 0.6) points.push({ tone: 'warn', textVi: `Câu trả lời hơi ngắn (${words} từ). Mục tiêu khoảng ${lo}–${hi} từ: thêm một lý do và một ví dụ cụ thể.` });
  else if (words < lo) points.push({ tone: 'tip', textVi: `Gần đủ rồi (${words} từ). Thêm một ý nữa để chạm mức ${lo}–${hi} từ.` });
  else if (words > hi * 1.25) points.push({ tone: 'tip', textVi: `Khá dài (${words} từ). Cô đọng lại, giữ ý chính và một ví dụ.` });
  else points.push({ tone: 'good', textVi: `Độ dài tốt (${words} từ), nằm trong mức ${lo}–${hi} từ.` });

  // Từ nối
  const found = CONNECTORS.filter((c) => countPhrase(transcript, c) > 0);
  const has = (list: string[]) => list.some((c) => found.includes(c));
  if (words >= 15) {
    if (found.length >= 3) points.push({ tone: 'good', textVi: `Có dùng từ nối để các ý liền mạch: ${found.slice(0, 5).join(', ')}.` });
    else if (found.length === 0) points.push({ tone: 'warn', textVi: 'Chưa có từ nối nào. Thử mở đầu lý do bằng “because…”, ví dụ bằng “for example…”.' });
    else points.push({ tone: 'tip', textVi: `Mới có ${found.length} từ nối (${found.join(', ')}). Thêm một từ nối nữa sẽ nghe mạch lạc hơn.` });
    const missing: string[] = [];
    if (!has(REASON)) missing.push('lý do (because…)');
    if (!has(EXAMPLE) && part !== 1) missing.push('ví dụ (for example…)');
    if (!has(CONTRAST) && part === 3) missing.push('ý đối lập (however…, on the other hand…)');
    if (missing.length) points.push({ tone: 'tip', textVi: `Còn thiếu: ${missing.join(', ')}.` });
  }

  // Từ lặp
  const freq = new Map<string, number>();
  for (const t of toks) if (t.length > 3 && !STOP.has(t)) freq.set(t, (freq.get(t) ?? 0) + 1);
  const repeated = [...freq.entries()].filter(([, n]) => n >= (part === 2 ? 4 : 3)).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([word, count]) => ({ word, count }));
  if (repeated.length) points.push({ tone: 'tip', textVi: `Lặp nhiều từ: ${repeated.map((r) => `“${r.word}” ×${r.count}`).join(', ')}. Thay bằng từ đồng nghĩa để tăng điểm từ vựng.` });

  // Độ đa dạng từ
  let variety: number | null = null;
  if (words >= 30) {
    variety = Math.round((new Set(toks).size / words) * 100);
    if (variety >= 62) points.push({ tone: 'good', textVi: `Vốn từ khá đa dạng (${variety}% từ không lặp).` });
    else if (variety < 48) points.push({ tone: 'warn', textVi: `Từ vựng còn lặp (${variety}% từ không lặp). Chuẩn bị 2–3 cách nói khác cho ý chính.` });
  }

  // Từ đệm và tốc độ
  if (fillers === 0 && words >= 15) points.push({ tone: 'good', textVi: 'Không có từ đệm (um, uh), nghe rất gọn.' });
  else if (fillers > 0) {
    const rate = Math.round((fillers / Math.max(1, words)) * 100);
    points.push({ tone: rate >= 5 ? 'warn' : 'tip', textVi: `${fillers} từ đệm (${rate}% bài nói). Khi cần nghĩ, dừng một nhịp hoặc nói “Let me think…” thay vì “um”.` });
  }
  if (wpm !== null && ms >= 8000) {
    if (wpm < 100) points.push({ tone: 'tip', textVi: `Tốc độ ${wpm} từ/phút, hơi chậm. Mục tiêu 110–160 từ/phút.` });
    else if (wpm > 175) points.push({ tone: 'tip', textVi: `Tốc độ ${wpm} từ/phút, hơi nhanh. Hạ nhịp để rõ âm hơn.` });
    else points.push({ tone: 'good', textVi: `Tốc độ ${wpm} từ/phút, vừa tầm giám khảo nghe dễ.` });
  }

  return { words, targetWords: [lo, hi], connectors: found, repeated, variety, points };
}

/* ------------------------------------------------------------------ AI */

export type CriterionKey = 'fluency' | 'vocabulary' | 'grammar' | 'coherence';
export type AnswerFeedback = {
  band: number;
  summaryVi: string;
  criteria: { key: CriterionKey; score: number; noteVi: string }[];
  strengthsVi: string[];
  fixes: { said: string; better: string; whyVi: string }[];
  upgrades: { from: string; to: string; whyVi: string }[];
  improved: string;
  nextVi: string[];
  model?: string;
};

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s']/g, ' ').replace(/\s+/g, ' ').trim();
const clampBand = (n: unknown): number => {
  const v = typeof n === 'number' && Number.isFinite(n) ? n : NaN;
  if (Number.isNaN(v)) throw new Error('điểm không hợp lệ');
  return Math.min(9, Math.max(3, Math.round(v * 2) / 2));
};
const strings = (v: unknown, max: number): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.trim().length > 3).map((x) => x.trim()).slice(0, max) : []);

export function validateFeedback(raw: unknown, transcript: string, model?: string): AnswerFeedback {
  const o = (raw ?? {}) as Record<string, unknown>;
  if (typeof o.summaryVi !== 'string' || o.summaryVi.length < 15) throw new Error('thiếu nhận xét tổng');
  const keys: CriterionKey[] = ['fluency', 'vocabulary', 'grammar', 'coherence'];
  const critRaw = Array.isArray(o.criteria) ? (o.criteria as Record<string, unknown>[]) : [];
  const criteria = keys.map((key) => {
    const c = critRaw.find((x) => x?.key === key);
    if (!c || typeof c.noteVi !== 'string') throw new Error(`thiếu tiêu chí ${key}`);
    return { key, score: clampBand(c.score), noteVi: c.noteVi.trim() };
  });
  const pool = norm(transcript);
  const fixes = (Array.isArray(o.fixes) ? (o.fixes as Record<string, unknown>[]) : [])
    // Chỉ giữ câu trích có thật trong bài nói, tránh AI bịa lỗi.
    .filter((f) => typeof f?.said === 'string' && typeof f.better === 'string' && typeof f.whyVi === 'string' && norm(f.said as string).length > 2 && pool.includes(norm(f.said as string)))
    .slice(0, 4)
    .map((f) => ({ said: String(f.said).trim(), better: String(f.better).trim(), whyVi: String(f.whyVi).trim() }));
  const upgrades = (Array.isArray(o.upgrades) ? (o.upgrades as Record<string, unknown>[]) : [])
    .filter((u) => typeof u?.from === 'string' && typeof u.to === 'string' && typeof u.whyVi === 'string' && pool.includes(norm(u.from as string)))
    .slice(0, 4)
    .map((u) => ({ from: String(u.from).trim(), to: String(u.to).trim(), whyVi: String(u.whyVi).trim() }));
  const improved = typeof o.improved === 'string' ? o.improved.trim() : '';
  if (improved.length < 20) throw new Error('thiếu bản viết lại');
  return { band: clampBand(o.band), summaryVi: o.summaryVi.trim(), criteria, strengthsVi: strings(o.strengthsVi, 3), fixes, upgrades, improved, nextVi: strings(o.nextVi, 3), model };
}

export function feedbackSystemPrompt(): string {
  return `You are a senior IELTS Speaking examiner and coach for Vietnamese learners. You receive ONE spoken answer as a speech-recognition transcript.
Rules:
- The transcript has no reliable punctuation or capitalisation and may contain recognition errors: never penalise those, and never comment on pronunciation (it cannot be judged from text).
- Judge only what is in the transcript: Fluency and coherence of ideas, Lexical resource, Grammatical range and accuracy, and how well it answers the question.
- Be specific and honest, kind in tone. All explanations are in Vietnamese; examples and rewrites are in English.
- "said" and "from" MUST be copied verbatim from the transcript. Never invent errors; if the answer is clean, give fewer fixes.
- "improved" keeps the learner's own ideas and facts, only upgrading language and structure, at most about two bands above the learner, and similar in length (no more than 30% longer).
Return ONE JSON object only, no markdown:
{"band": number (3-9, step 0.5, content-based estimate),
 "summaryVi": 2-3 sentences summarising the answer and the main thing to fix,
 "criteria": [{"key":"fluency","score":n,"noteVi":"..."},{"key":"vocabulary",...},{"key":"grammar",...},{"key":"coherence",...}],
 "strengthsVi": 2-3 short Vietnamese strengths,
 "fixes": 0-4 of {"said":"exact words from the transcript","better":"corrected or more natural English","whyVi":"short Vietnamese reason"},
 "upgrades": 0-3 of {"from":"basic word or phrase from the transcript","to":"stronger alternative","whyVi":"short Vietnamese reason"},
 "improved": "a stronger version of the whole answer in English",
 "nextVi": 2-3 concrete Vietnamese suggestions for the next practice"}`;
}

export function feedbackUserPrompt(input: { part: FeedbackPart; question: string; transcript: string; wpm: number | null; fillers: number; durationSec: number }): string {
  return `Part ${input.part}. Question: ${input.question}
Speaking time: ${Math.round(input.durationSec)} s${input.wpm ? `, ${input.wpm} words per minute` : ''}, filler words detected: ${input.fillers}.
Transcript:
"""
${input.transcript}
"""`;
}
