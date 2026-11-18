import { SYN_ENTRIES } from '@/data/sentence-synonyms';
import { offlineGloss } from '@/services/dictionary/offline-glossary';
import { findIssues, hasFiniteVerbHint, wordsWithPositions, type Issue } from './grammar-rules';
import { verbReadings, PRONOUN_SUBJECT, BE_FORMS, DETERMINERS, HAVE_FORMS, DO_FORMS, MODALS, PREPOSITIONS, norm, stem } from './lexicon';
import { detectStructures } from './structure-detect';
import { getStructure, type StructureDef } from './structure-bank';

/**
 * Chấm bài TỰ DIỄN ĐẠT bằng luật: người học đọc nghĩa tiếng Việt, tự viết câu
 * tiếng Anh theo ý mình, hệ thống chỉ ra lỗi cụ thể, người học sửa và nộp lại —
 * cho tới khi câu đúng, đủ ý và đúng cấu trúc đích.
 *
 * VÌ SAO LUẬT CHỨ KHÔNG AI: quyết định chung của app là không thêm đường gọi AI
 * tốn tiền, và đáp án/điểm tính bằng code. Đổi lại, "đúng ý" ở đây là XẤP XỈ —
 * đo bằng phần từ khoá của câu mẫu mà người học đã nói tới (kể cả bằng từ đồng
 * nghĩa trong bảng). Vì xấp xỉ nên ngưỡng qua bài rộng, và luôn có đường "xem
 * đáp án" (không tính là đã học) để người học không bị kẹt.
 */

export type ExpressTarget = {
  id: string;
  /** Câu mẫu (chuẩn). */
  en: string;
  /** Nghĩa tiếng Việt — đề bài. */
  vi: string;
  /** Mã cấu trúc đích, nếu đã soạn sẵn; không có thì đoán từ câu mẫu. */
  structureIds?: readonly string[];
  /** Cặp tương đương soạn sẵn: [cụm, tương đương…, nghĩa]. */
  equivalents?: readonly (readonly string[])[];
  /** Ghi chú cấu trúc của đề (câu dịch có sẵn một dòng như vậy). */
  hintVi?: string;
};

export type MissingConcept = { word: string; vi: string | null };

export type ExpressVerdict = 'empty' | 'short' | 'fix' | 'meaning' | 'structure' | 'pass';

export type ExpressCheck = {
  verdict: ExpressVerdict;
  issues: Issue[];
  errorCount: number;
  /** 0–1: tỉ lệ ý chính của câu mẫu mà người học đã nói tới. */
  coverage: number;
  missing: MissingConcept[];
  required: StructureDef | null;
  structureOk: boolean;
  foundStructures: string[];
  wordCount: number;
  passed: boolean;
  /** Một câu tóm tắt tiếng Việt cho lần nộp này. */
  summaryVi: string;
  /** Điều đã làm tốt (nếu có). */
  goodVi: string[];
};

const STOP = new Set(
  `a an the and or but so to of in on at for with by from as is are was were be been being am do does did have has had will would can could shall should may might must not no
it its this that these those i you he she we they me him her us them my your his our their there here very too also just than then if when while because although
which who whom whose what where how up out about into over after before again more most some any each every all both such only own same other another much many
get gets got go goes went`.split(/\s+/),
);

const TRIVIAL = new Set(['present-simple', 'past-simple']);

/** Từ nội dung của một câu: chuỗi (đã chuẩn hoá) + thân từ. */
const NUMBER_WORDS = new Set('one two three four five six seven eight nine ten eleven twelve twenty thirty forty fifty hundred thousand million first second third'.split(' '));

function contentWords(text: string): { word: string; stem: string }[] {
  const out: { word: string; stem: string }[] = [];
  for (const w of wordsWithPositions(text)) {
    const n = norm(w.text);
    // Số đếm là ý chính (six ≠ seven) nên giữ lại dù từ điển xếp chúng vào từ hạn định.
    if (NUMBER_WORDS.has(n)) {
      out.push({ word: n, stem: n });
      continue;
    }
    if (n.length < 3 || STOP.has(n) || PRONOUN_SUBJECT.has(n) || BE_FORMS.has(n) || HAVE_FORMS.has(n) || DO_FORMS.has(n) || MODALS.has(n) || PREPOSITIONS.has(n) || DETERMINERS.has(n)) continue;
    out.push({ word: n, stem: stem(n) });
  }
  return out;
}

/**
 * Cách nói tương đương của một từ khoá (bảng tay + cặp soạn sẵn): các thân từ lẻ và các
 * CỤM (dãy thân từ) — cụm là chỗ "wake up" ↔ "get up", nơi từng từ riêng lẻ (get, up) quá chung.
 */
function equivalents(wordStem: string, curated: readonly (readonly string[])[]): { stems: Set<string>; phrases: string[][] } {
  const stems = new Set<string>([wordStem]);
  const phrases: string[][] = [];
  const addPhrase = (text: string) => {
    const seq = text.toLowerCase().split(/\s+/).filter(Boolean).map((t) => stem(t));
    if (seq.length === 0) return;
    if (seq.length === 1) stems.add(seq[0]!);
    else phrases.push(seq);
  };
  for (const e of SYN_ENTRIES) {
    const entryStems = e.word.split(' ').map(stem);
    const hitsWord = entryStems.includes(wordStem);
    const hitsAlt = e.alts.some((alt) => alt.split(' ').map(stem).includes(wordStem));
    if (!hitsWord && !hitsAlt) continue;
    addPhrase(e.word);
    for (const alt of e.alts) addPhrase(alt);
  }
  for (const row of curated) {
    const phrase = (row[0] ?? '').toLowerCase();
    if (!phrase.split(/\s+/).map((t) => stem(t)).includes(wordStem)) continue;
    addPhrase(phrase);
    for (const alt of row.slice(1, -1)) addPhrase(alt);
  }
  return { stems, phrases };
}

function containsSeq(haystack: readonly string[], needle: readonly string[]): boolean {
  outer: for (let i = 0; i + needle.length <= haystack.length; i += 1) {
    for (let j = 0; j < needle.length; j += 1) if (haystack[i + j] !== needle[j]) continue outer;
    return true;
  }
  return false;
}

/** Câu có động từ ở quá khứ rõ ràng (was/were/had/did hoặc dạng V2 không trùng dạng gốc). */
function pastVerbs(text: string): string[] {
  return wordsWithPositions(text)
    .map((w) => w.lower)
    .filter((w) => ['was', 'were', 'had', 'did'].includes(w) || verbReadings(w).some((r) => r.form === 'past') && !verbReadings(w).some((r) => r.form === 'base'));
}

/** Động từ chia ở hiện tại (gốc sau chủ ngữ ngôi I/you/we/they, hoặc -s sau he/she/it, am/is/are). */
function presentVerbs(text: string): string[] {
  const ws = wordsWithPositions(text).map((w) => w.lower);
  const out: string[] = [];
  ws.forEach((w, i) => {
    const prev = ws[i - 1] ?? '';
    if (['am', 'is', 'are', 'has', 'have', 'does', 'do'].includes(w)) out.push(w);
    else if (['i', 'you', 'we', 'they'].includes(prev) && verbReadings(w).some((r) => r.form === 'base') && !MODALS.has(w)) out.push(w);
    else if (['he', 'she', 'it'].includes(prev) && verbReadings(w).some((r) => r.form === 'third')) out.push(w);
  });
  return out;
}

function sameSentence(a: string, b: string): boolean {
  const f = (s: string) => wordsWithPositions(s).map((w) => norm(w.text)).join(' ');
  return f(a) === f(b);
}

function glossOf(word: string): string | null {
  const g = offlineGloss(word);
  if (!g) return null;
  return g.meaningVi.split(/[,;]/)[0]!.trim() || null;
}

export function requiredStructure(target: ExpressTarget): StructureDef | null {
  const id = target.structureIds?.[0] ?? detectStructures(target.en).main?.id;
  return id ? (getStructure(id) ?? null) : null;
}

export function checkExpression(target: ExpressTarget, text: string): ExpressCheck {
  const trimmed = text.trim();
  const required = requiredStructure(target);
  const base: ExpressCheck = {
    verdict: 'empty', issues: [], errorCount: 0, coverage: 0, missing: [], required, structureOk: false, foundStructures: [], wordCount: 0, passed: false, summaryVi: '', goodVi: [],
  };
  if (!trimmed) return { ...base, summaryVi: 'Hãy viết câu tiếng Anh của bạn.' };

  const words = wordsWithPositions(trimmed);
  const modelWords = new Set(wordsWithPositions(target.en).map((w) => w.lower));
  const extraWords = new Set<string>(modelWords);
  for (const row of target.equivalents ?? []) for (const part of row.slice(0, -1)) for (const t of part.toLowerCase().split(/\s+/)) extraWords.add(t);

  if (sameSentence(trimmed, target.en)) {
    return { ...base, verdict: 'pass', coverage: 1, structureOk: true, wordCount: words.length, passed: true, foundStructures: detectStructures(trimmed).hits.map((h) => h.id), summaryVi: 'Đúng hoàn toàn — trùng câu mẫu.', goodVi: ['Đủ ý, đúng ngữ pháp, đúng cấu trúc.'] };
  }

  const modelLen = wordsWithPositions(target.en).length;
  const issues = findIssues(trimmed, { extraWords });
  const errors = issues.filter((i) => i.severity === 'error').length;

  // Ý: các từ nội dung của câu mẫu có mặt (hoặc có từ tương đương) trong bài người học.
  const concepts = contentWords(target.en);
  const userStems = new Set(contentWords(trimmed).map((w) => w.stem));
  const userRaw = new Set(words.map((w) => norm(w.text)));
  const userAllStems = words.map((w) => stem(norm(w.text)));
  const seen = new Set<string>();
  const missing: MissingConcept[] = [];
  let hit = 0;
  let total = 0;
  for (const c of concepts) {
    if (seen.has(c.stem)) continue;
    seen.add(c.stem);
    total += 1;
    const eq = equivalents(c.stem, target.equivalents ?? []);
    const covered =
      [...eq.stems].some((s) => userStems.has(s)) || userRaw.has(c.word) || eq.phrases.some((ph) => containsSeq(userAllStems, ph));
    if (covered) hit += 1;
    else missing.push({ word: c.word, vi: glossOf(c.word) });
  }
  const coverage = total === 0 ? 1 : hit / total;

  // Cấu trúc.
  const det = detectStructures(trimmed);
  const found = det.hits.map((h) => h.id);
  let structureOk = true;
  if (required) {
    if (TRIVIAL.has(required.id)) structureOk = det.tenseId === required.id || found.includes(required.id);
    else if (required.id === 'compound-sentence') structureOk = found.includes('compound-sentence') || det.analysis.clauses.length >= 2;
    else if (required.group === 'tense' || required.group === 'modal') structureOk = found.includes(required.id) || det.tenseId === required.id;
    else structureOk = found.includes(required.id);
  }

  const tooShort = words.length < Math.max(3, Math.round(modelLen * 0.45));
  const noVerb = !hasFiniteVerbHint(trimmed) && words.length >= 3;
  if (noVerb && !issues.some((i) => i.kind === 'grammar' && i.severity === 'error')) {
    issues.push({ id: 'no-verb', kind: 'grammar', severity: 'error', start: 0, end: trimmed.length, found: trimmed, vi: 'Câu chưa có động từ chia rõ ràng — thiếu động từ chính hoặc trợ động từ.' });
  }
  // Thì: đề ở quá khứ mà người học viết toàn hiện tại (wake thay vì woke) — lỗi người Việt rất hay gặp.
  if (pastVerbs(target.en).length > 0 && pastVerbs(trimmed).length === 0) {
    const pres = presentVerbs(trimmed);
    if (pres.length > 0) {
      const w = words.find((x) => x.lower === pres[0]);
      if (w) issues.push({ id: 'tense-mismatch', kind: 'grammar', severity: 'error', start: w.start, end: w.end, found: w.text, vi: 'Câu mẫu ở QUÁ KHỨ nhưng động từ của bạn đang ở hiện tại — đổi sang quá khứ.' });
    }
  }
  const errorCount = issues.filter((i) => i.severity === 'error').length;

  const goodVi: string[] = [];
  if (coverage >= 0.8) goodVi.push('Đã nói đủ ý chính.');
  if (errorCount === 0) goodVi.push('Không có lỗi ngữ pháp hay chính tả rõ ràng.');
  if (required && structureOk && !TRIVIAL.has(required.id)) goodVi.push(`Đã dùng đúng cấu trúc: ${required.vi}.`);

  let verdict: ExpressVerdict = 'pass';
  let summaryVi = 'Đạt — đúng, đủ ý và đúng cấu trúc.';
  if (tooShort) {
    verdict = 'short';
    summaryVi = 'Câu còn ngắn so với ý cần nói — thêm các chi tiết còn thiếu.';
  } else if (errorCount > 0) {
    verdict = 'fix';
    summaryVi = `Còn ${errorCount} lỗi cần sửa trước.`;
  } else if (coverage < 0.55) {
    verdict = 'meaning';
    summaryVi = 'Câu chưa nói đủ ý của đề.';
  } else if (!structureOk) {
    verdict = 'structure';
    summaryVi = `Đúng và đủ ý, nhưng chưa dùng cấu trúc đích: ${required?.vi ?? ''}.`;
  }

  return {
    verdict, issues, errorCount, coverage, missing, required, structureOk, foundStructures: found, wordCount: words.length,
    passed: verdict === 'pass', summaryVi, goodVi,
  };
}

/**
 * Câu mẫu bị che: giữ từ chức năng, từ nội dung chỉ còn chữ đầu + gạch dưới.
 * Là mức gợi ý 3 — đủ để lộ khung câu mà chưa lộ từ.
 */
export function maskSentence(en: string): string {
  return en.replace(/[A-Za-z]+(?:['’][A-Za-z]+)?/g, (w) => {
    const n = norm(w);
    if (n.length < 4 || STOP.has(n) || PREPOSITIONS.has(n)) return w;
    return `${w[0]}${'_'.repeat(Math.max(2, Math.min(7, w.length - 1)))}`;
  });
}

export type ExpressHint = { level: 1 | 2 | 3 | 4; title: string; body: string };

/** Gợi ý tăng dần — mức 4 là lộ câu mẫu (không tính là tự làm được). */
export function hintFor(target: ExpressTarget, level: 1 | 2 | 3 | 4, check: ExpressCheck | null): ExpressHint {
  const required = check?.required ?? requiredStructure(target);
  if (level === 1) {
    const need = contentWords(target.en);
    const n = new Set(need.map((c) => c.stem)).size;
    const got = check ? Math.round(check.coverage * n) : 0;
    return {
      level,
      title: 'Hướng đi',
      body: `Ý chính của câu có khoảng ${n} từ khoá${check ? `; bạn đã nói tới ${got}` : ''}. ${required ? `Hãy dùng cấu trúc “${required.vi}”.` : 'Hãy bám sát nghĩa tiếng Việt.'}`,
    };
  }
  if (level === 2) {
    return {
      level,
      title: 'Khuôn câu',
      body: required
        ? `${required.vi}: ${required.formula}. ${required.usage}`
        : (target.hintVi ?? 'Viết thành một câu đủ chủ ngữ và động từ chia đúng thì.'),
    };
  }
  if (level === 3) {
    return { level, title: 'Khung câu (đã che từ)', body: maskSentence(target.en) };
  }
  return { level, title: 'Đáp án mẫu', body: target.en };
}

export type TextSegment = { text: string; issue?: Issue };

/** Cắt chuỗi người học gõ thành các đoạn, đoạn nào có lỗi thì mang theo lỗi đó (để tô đỏ). */
export function markText(text: string, issues: readonly Issue[]): TextSegment[] {
  const marks = [...issues].filter((i) => i.end > i.start && i.severity !== 'info').sort((a, b) => a.start - b.start);
  const out: TextSegment[] = [];
  let pos = 0;
  for (const m of marks) {
    if (m.start < pos) continue;
    if (m.start > pos) out.push({ text: text.slice(pos, m.start) });
    out.push({ text: text.slice(m.start, m.end), issue: m });
    pos = m.end;
  }
  if (pos < text.length) out.push({ text: text.slice(pos) });
  return out;
}
