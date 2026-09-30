import type { AttemptMetrics } from './metrics';

/**
 * CHẤM ĐIỂM SPEAKING — phần THUẦN (không gọi mạng): làm tròn band kiểu IELTS,
 * ước lượng Pronunciation từ độ rõ, và kiểm/ép khuôn JSON model trả về.
 *
 * Nguyên tắc: KHÔNG TIN số model đưa. Band từng tiêu chí bị kẹp về 0–9 bước
 * 0,5; band tổng do code tính từ bốn tiêu chí (model hay cộng sai hoặc làm
 * tròn kiểu khác); dẫn chứng "trích lời người học" phải thật sự có trong bản
 * chữ, không có thì bỏ.
 */

export type CriterionKey = 'fc' | 'lr' | 'gr' | 'pr';
export const CRITERIA: Array<{ key: CriterionKey; en: string; vi: string }> = [
  { key: 'fc', en: 'Fluency & Coherence', vi: 'Độ trôi chảy & mạch lạc' },
  { key: 'lr', en: 'Lexical Resource', vi: 'Vốn từ' },
  { key: 'gr', en: 'Grammatical Range & Accuracy', vi: 'Ngữ pháp' },
  { key: 'pr', en: 'Pronunciation', vi: 'Phát âm (ước lượng)' },
];

export type CriterionGrade = { band: number | null; explanationVi: string; fixes: string[] };

export type SpeakingFix = { quote: string; problemVi: string; better: string; questionIndex: number | null };
export type SpeakingSample = { questionIndex: number; improved: string; whyVi: string };

/**
 * Pronunciation dựa trên gì:
 *   - 'clarity+ai': chủ yếu từ độ tin cậy của bộ nhận giọng, cộng phần nhận xét
 *     của AI về những đoạn máy nghe không ra;
 *   - 'text-only': trình duyệt không báo độ tin cậy, chỉ còn AI đọc bản chữ —
 *     yếu nhất, bị kẹp không vượt các tiêu chí khác;
 *   - 'none': bài gõ phím, không có phát âm để chấm.
 */
export type PronunciationBasis = 'clarity+ai' | 'text-only' | 'none';

export type SpeakingGrade = {
  criteria: Record<CriterionKey, CriterionGrade>;
  overall: number | null;
  pronunciationBasis: PronunciationBasis;
  strengths: string[];
  fixes: SpeakingFix[];
  samples: SpeakingSample[];
  summaryVi: string;
  /** Các mức trần code đã áp (tiếng Việt), để màn kết quả nói rõ vì sao điểm bị giới hạn. */
  capsApplied: string[];
  model: string;
  gradedAt: string;
};

/** Kẹp về 0–9, bước 0,5. Không phải số thì null. */
export function clampBand(v: unknown): number | null {
  const n = typeof v === 'string' ? Number(v) : v;
  if (typeof n !== 'number' || !Number.isFinite(n)) return null;
  return Math.min(9, Math.max(0, Math.round(n * 2) / 2));
}

/**
 * Band tổng theo cách IELTS làm tròn trung bình bốn tiêu chí: phần lẻ .25 lên
 * .5, phần lẻ .75 lên số nguyên kế tiếp (6,25 → 6,5; 6,75 → 7; 6,125 → 6).
 */
export function ieltsRound(mean: number): number {
  const base = Math.floor(mean);
  const frac = Math.round((mean - base) * 1000) / 1000;
  if (frac < 0.25) return base;
  if (frac < 0.75) return base + 0.5;
  return base + 1;
}

export function overallBand(bands: Array<number | null>): number | null {
  if (bands.length !== 4 || bands.some((b) => b == null)) return null;
  return ieltsRound((bands as number[]).reduce((a, b) => a + b, 0) / 4);
}

const halfStep = (n: number) => Math.round(n * 2) / 2;

/**
 * Band phát âm từ ĐỘ RÕ (độ tin cậy trung bình của bộ nhận giọng).
 *
 * 0,55 → 4 … 0,95 → 8, trừ thêm theo tỉ lệ từ nghe không chắc. Trần 8: chỉ từ
 * độ tin cậy của máy thì không đủ căn cứ để nói ai đó phát âm ở mức 8,5–9.
 */
export function clarityBand(avgConfidence: number, lowShare: number): number {
  const base = 4 + ((avgConfidence - 0.55) / 0.4) * 4;
  const penalty = Math.max(0, lowShare) * 3;
  return Math.min(8, Math.max(2, halfStep(base - penalty)));
}

export function pronunciationBand(input: {
  avgConfidence: number | null;
  lowShare: number | null;
  aiBand: number | null;
  otherBands: Array<number | null>;
  typed: boolean;
}): { band: number | null; basis: PronunciationBasis } {
  if (input.typed) return { band: null, basis: 'none' };
  if (input.avgConfidence != null && input.avgConfidence > 0) {
    const c = clarityBand(input.avgConfidence, input.lowShare ?? 0);
    const ai = input.aiBand ?? c;
    return { band: Math.min(8, halfStep(0.75 * c + 0.25 * ai)), basis: 'clarity+ai' };
  }
  // Không có độ tin cậy: AI chỉ đọc được chữ. Không cho phần đoán này vượt
  // trung bình ba tiêu chí còn lại.
  const others = input.otherBands.filter((b): b is number => b != null);
  const cap = others.length ? halfStep(others.reduce((a, b) => a + b, 0) / others.length) : 6;
  const ai = input.aiBand ?? cap;
  return { band: Math.min(ai, cap, 7), basis: 'text-only' };
}

const str = (v: unknown, max: number): string => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ').slice(0, max) : '');
const strList = (v: unknown, maxItems: number, maxLen: number): string[] =>
  Array.isArray(v) ? v.map((x) => str(x, maxLen)).filter(Boolean).slice(0, maxItems) : [];

/** So khớp trích dẫn: bỏ hoa/thường, dấu câu, khoảng trắng thừa. */
export function normalizeForQuote(s: string): string {
  return s
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^\p{L}\p{N}'\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export type GradeContext = {
  /** Bản chữ từng câu, đúng thứ tự gửi cho model (chỉ số 0-based). */
  transcripts: string[];
  typed: boolean;
  metrics: AttemptMetrics;
  model: string;
  now?: Date;
};

/**
 * Trần theo LƯỢNG NÓI. Model đọc một câu trả lời 15 từ trôi chảy vẫn hay cho 6;
 * nhưng giám khảo không chấm được vốn từ hay ngữ pháp khi gần như không có gì
 * để nghe. Trần tính trên dữ liệu đo được, không phụ thuộc model.
 */
export function volumeCap(metrics: AttemptMetrics): { cap: number | null; noteVi: string | null } {
  if (metrics.words < 25) return { cap: 3, noteVi: `Cả lượt chỉ có ${metrics.words} từ — quá ít để chấm, mọi tiêu chí bị giới hạn ở 3,0.` };
  if (metrics.words < 60 || metrics.avgWords < 10)
    return { cap: 5, noteVi: `Câu trả lời trung bình chỉ ${metrics.avgWords} từ — mọi tiêu chí bị giới hạn ở 5,0. Hãy trả lời dài hơn, có lý do và ví dụ.` };
  return { cap: null, noteVi: null };
}

/** Trần Fluency theo tốc độ nói: dưới 70 từ/phút thì khó trên 5,5. */
export function fluencyCap(metrics: AttemptMetrics): { cap: number | null; noteVi: string | null } {
  if (metrics.wpm != null && metrics.wpm < 70)
    return { cap: 5.5, noteVi: `Tốc độ nói ${metrics.wpm} từ/phút (người nói trôi chảy thường 110–160) — Fluency bị giới hạn ở 5,5.` };
  return { cap: null, noteVi: null };
}

/**
 * Kiểm và ép khuôn JSON model trả về thành `SpeakingGrade`.
 * Ném lỗi (Error thường) khi thiếu hẳn phần chấm — nơi gọi đổi thành AiError.
 */
export function validateGrade(raw: unknown, ctx: GradeContext): SpeakingGrade {
  if (!raw || typeof raw !== 'object') throw new Error('Model không trả về đối tượng JSON.');
  const r = raw as Record<string, unknown>;
  const crit = (r.criteria && typeof r.criteria === 'object' ? r.criteria : {}) as Record<string, unknown>;

  const readCrit = (key: CriterionKey): CriterionGrade => {
    const c = (crit[key] && typeof crit[key] === 'object' ? crit[key] : {}) as Record<string, unknown>;
    return {
      band: clampBand(c.band),
      explanationVi: str(c.explanationVi ?? c.summaryVi, 500),
      fixes: strList(c.fixes, 3, 240),
    };
  };

  const criteria: Record<CriterionKey, CriterionGrade> = {
    fc: readCrit('fc'),
    lr: readCrit('lr'),
    gr: readCrit('gr'),
    pr: readCrit('pr'),
  };

  if (criteria.lr.band == null || criteria.gr.band == null) throw new Error('Model không chấm Lexical/Grammar.');
  if (!ctx.typed && criteria.fc.band == null) throw new Error('Model không chấm Fluency.');

  const caps: string[] = [];
  const vol = volumeCap(ctx.metrics);
  const flu = fluencyCap(ctx.metrics);
  const applyCap = (key: CriterionKey, cap: number | null) => {
    const b = criteria[key].band;
    if (cap != null && b != null && b > cap) criteria[key].band = cap;
  };

  if (ctx.typed) {
    // Bài gõ phím: không có nói nên không có Fluency (theo nghĩa nói) và Pronunciation.
    criteria.fc.band = null;
    criteria.pr.band = null;
  } else {
    const before = criteria.fc.band;
    applyCap('fc', flu.cap);
    if (flu.noteVi && flu.cap != null && before != null && before > flu.cap) caps.push(flu.noteVi);
  }

  const pr = pronunciationBand({
    avgConfidence: ctx.metrics.avgConfidence,
    lowShare: ctx.metrics.lowConfShare,
    aiBand: criteria.pr.band,
    otherBands: [criteria.fc.band, criteria.lr.band, criteria.gr.band],
    typed: ctx.typed,
  });
  criteria.pr.band = pr.band;

  if (vol.cap != null) {
    for (const k of ['fc', 'lr', 'gr', 'pr'] as CriterionKey[]) applyCap(k, vol.cap);
    if (vol.noteVi) caps.push(vol.noteVi);
  }

  const norms = ctx.transcripts.map(normalizeForQuote);
  const findQuote = (quote: string, hint: number | null): number | null => {
    const q = normalizeForQuote(quote);
    if (q.split(' ').length < 2 && q.length < 4) return null;
    if (hint != null && norms[hint]?.includes(q)) return hint;
    const i = norms.findIndex((t) => t.includes(q));
    return i >= 0 ? i : null;
  };

  const fixes: SpeakingFix[] = [];
  if (Array.isArray(r.fixes)) {
    for (const f of r.fixes) {
      if (!f || typeof f !== 'object') continue;
      const o = f as Record<string, unknown>;
      const quote = str(o.quote, 200);
      const hint = typeof o.questionIndex === 'number' && Number.isInteger(o.questionIndex) ? o.questionIndex : null;
      const at = quote ? findQuote(quote, hint) : null;
      // Không tìm thấy trong bản chữ = trích bịa → bỏ cả mục.
      if (at == null) continue;
      const problemVi = str(o.problemVi, 300);
      const better = str(o.better, 300);
      if (!problemVi || !better) continue;
      fixes.push({ quote, problemVi, better, questionIndex: at });
      if (fixes.length >= 3) break;
    }
  }

  const samples: SpeakingSample[] = [];
  if (Array.isArray(r.samples)) {
    for (const s of r.samples) {
      if (!s || typeof s !== 'object') continue;
      const o = s as Record<string, unknown>;
      const qi = typeof o.questionIndex === 'number' ? Math.trunc(o.questionIndex) : -1;
      const improved = str(o.improved, 1600);
      if (qi < 0 || qi >= ctx.transcripts.length || improved.split(' ').length < 8) continue;
      if (samples.some((x) => x.questionIndex === qi)) continue;
      samples.push({ questionIndex: qi, improved, whyVi: str(o.whyVi, 300) });
      if (samples.length >= 2) break;
    }
  }

  return {
    criteria,
    overall: ctx.typed ? null : overallBand([criteria.fc.band, criteria.lr.band, criteria.gr.band, criteria.pr.band]),
    pronunciationBasis: pr.basis,
    strengths: strList(r.strengths, 3, 240),
    fixes,
    samples,
    summaryVi: str(r.summaryVi, 600),
    capsApplied: caps,
    model: ctx.model,
    gradedAt: (ctx.now ?? new Date()).toISOString(),
  };
}
