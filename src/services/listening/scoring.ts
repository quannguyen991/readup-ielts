import type { ListeningAnswers, ListeningGroup, ListeningQuestion, ListeningSection } from './types';

/**
 * Chấm Listening: chuẩn hoá câu trả lời rồi so với đáp án + các dạng chấp nhận.
 *
 * Luật chuẩn hoá (cả hai phía đều qua cùng một hàm, nên "8" = "eight" = "Eight."):
 *   - hoa/thường, dấu câu, dấu nối ("well-known" = "well known");
 *   - số viết chữ <-> chữ số ("twenty one" = "21", "1,000" = "1000", "9:30" = "9.30");
 *   - cặp chính tả Anh/Mỹ ("colour" = "color");
 *   - ngoặc trong đáp án = từ tuỳ chọn: "(the) library" chấp nhận cả "library";
 *   - khoảng trắng: "mind map" = "mindmap".
 * KHÔNG chấp nhận: sai số nhiều, thiếu/thừa từ khác, lỗi chính tả.
 */

// ---------------------------------------------------------------------------
// Số viết chữ
// ---------------------------------------------------------------------------

const UNITS = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen',
];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

const WORD_VALUE = new Map<string, number>();
UNITS.forEach((w, i) => WORD_VALUE.set(w, i));
TENS.forEach((w, i) => {
  if (w) WORD_VALUE.set(w, i * 10);
});

const unit = (i: number) => UNITS[i] ?? '';
const ten = (i: number) => TENS[i] ?? '';

/** Số -> chữ tiếng Anh (0-999 999), không có "and" — dùng để kiểm một cụm chữ có đúng là MỘT số không. */
export function numberToWords(n: number): string[] {
  if (n < 20) return [unit(n)];
  if (n < 100) return n % 10 ? [ten(Math.floor(n / 10)), unit(n % 10)] : [ten(n / 10)];
  if (n < 1000) {
    const rest = n % 100;
    return [unit(Math.floor(n / 100)), 'hundred', ...(rest ? numberToWords(rest) : [])];
  }
  const rest = n % 1000;
  return [...numberToWords(Math.floor(n / 1000)), 'thousand', ...(rest ? numberToWords(rest) : [])];
}

const isNumberWord = (t: string) => WORD_VALUE.has(t) || t === 'hundred' || t === 'thousand';

/** Một cụm token toàn chữ số -> số, hoặc null nếu cụm không phải MỘT số hợp lệ. */
function parseNumberRun(tokens: string[]): number | null {
  const words = tokens.filter((t) => t !== 'and');
  if (words.length === 0) return null;
  let total = 0;
  let cur = 0;
  for (const t of words) {
    if (t === 'hundred') cur = (cur || 1) * 100;
    else if (t === 'thousand') {
      total += (cur || 1) * 1000;
      cur = 0;
    } else cur += WORD_VALUE.get(t) ?? 0;
  }
  const value = total + cur;
  if (value > 999999) return null;
  return numberToWords(value).join(' ') === words.join(' ') ? value : null;
}

function convertNumberWords(tokens: string[]): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < tokens.length) {
    const tok = tokens[i] ?? '';
    if (!isNumberWord(tok)) {
      out.push(tok);
      i += 1;
      continue;
    }
    // Cụm dài nhất toàn từ số ("and" ở giữa được phép).
    let j = i + 1;
    while (j < tokens.length && (isNumberWord(tokens[j] ?? '') || (tokens[j] === 'and' && j + 1 < tokens.length && isNumberWord(tokens[j + 1] ?? '')))) j += 1;
    // Cụm không hợp lệ thì cắt bớt từ cuối cho tới khi hợp lệ.
    let end = j;
    let value: number | null = null;
    while (end > i) {
      value = parseNumberRun(tokens.slice(i, end));
      if (value !== null) break;
      end -= 1;
    }
    if (value === null) {
      out.push(String(WORD_VALUE.get(tok) ?? tok));
      i += 1;
    } else {
      out.push(String(value));
      i = end;
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Anh / Mỹ
// ---------------------------------------------------------------------------

/** [Anh, Mỹ] — chuẩn hoá về dạng Mỹ. Chỉ liệt kê từ hay gặp trong đề nghe. */
const UK_US: [string, string][] = [
  ['colour', 'color'], ['colours', 'colors'], ['favourite', 'favorite'], ['favourites', 'favorites'],
  ['neighbour', 'neighbor'], ['neighbours', 'neighbors'], ['neighbourhood', 'neighborhood'],
  ['behaviour', 'behavior'], ['honour', 'honor'], ['labour', 'labor'], ['harbour', 'harbor'], ['flavour', 'flavor'],
  ['centre', 'center'], ['centres', 'centers'], ['theatre', 'theater'], ['metre', 'meter'], ['metres', 'meters'],
  ['kilometre', 'kilometer'], ['kilometres', 'kilometers'], ['litre', 'liter'], ['litres', 'liters'], ['fibre', 'fiber'],
  ['organise', 'organize'], ['organised', 'organized'], ['organisation', 'organization'], ['organisations', 'organizations'],
  ['recognise', 'recognize'], ['realise', 'realize'], ['specialise', 'specialize'], ['specialised', 'specialized'],
  ['apologise', 'apologize'], ['summarise', 'summarize'], ['analyse', 'analyze'], ['criticise', 'criticize'],
  ['memorise', 'memorize'], ['emphasise', 'emphasize'], ['socialise', 'socialize'], ['utilise', 'utilize'],
  ['civilisation', 'civilization'], ['categorise', 'categorize'], ['minimise', 'minimize'], ['maximise', 'maximize'],
  ['customise', 'customize'], ['prioritise', 'prioritize'], ['familiarise', 'familiarize'],
  ['catalogue', 'catalog'], ['dialogue', 'dialog'], ['programme', 'program'], ['programmes', 'programs'],
  ['licence', 'license'], ['defence', 'defense'], ['offence', 'offense'], ['pretence', 'pretense'],
  ['grey', 'gray'], ['tyre', 'tire'], ['tyres', 'tires'], ['kerb', 'curb'], ['cheque', 'check'], ['cheques', 'checks'],
  ['plough', 'plow'], ['draught', 'draft'], ['aluminium', 'aluminum'], ['jewellery', 'jewelry'], ['moustache', 'mustache'],
  ['travelling', 'traveling'], ['travelled', 'traveled'], ['traveller', 'traveler'], ['travellers', 'travelers'],
  ['cancelled', 'canceled'], ['cancelling', 'canceling'], ['labelled', 'labeled'], ['modelling', 'modeling'],
  ['counsellor', 'counselor'], ['marvellous', 'marvelous'], ['fuelled', 'fueled'], ['enrol', 'enroll'], ['enrolment', 'enrollment'],
  ['fulfil', 'fulfill'], ['skilful', 'skillful'], ['ageing', 'aging'], ['judgement', 'judgment'], ['acknowledgement', 'acknowledgment'],
  ['practise', 'practice'], ['practised', 'practiced'], ['sceptical', 'skeptical'], ['storey', 'story'], ['storeys', 'stories'],
  ['mum', 'mom'], ['maths', 'math'], ['paediatric', 'pediatric'], ['anaemia', 'anemia'],
  ['oestrogen', 'estrogen'], ['encyclopaedia', 'encyclopedia'], ['manoeuvre', 'maneuver'], ['mould', 'mold'],
  ['sulphur', 'sulfur'], ['yoghurt', 'yogurt'], ['woollen', 'woolen'],
  ['artefact', 'artifact'], ['artefacts', 'artifacts'], ['pyjamas', 'pajamas'],
];
const US_OF = new Map<string, string>(UK_US);

// ---------------------------------------------------------------------------
// Chuẩn hoá
// ---------------------------------------------------------------------------

export function normalizeAnswer(input: string): string {
  let s = String(input ?? '').toLowerCase();
  s = s.replace(/[‘’ʼ`]/g, "'");
  // 1,000 -> 1000 (lặp để xử lý 1,234,567).
  while (/\d,\d{3}/.test(s)) s = s.replace(/(\d),(\d{3})/g, '$1$2');
  s = s.replace(/(\d):(\d)/g, '$1.$2');
  s = s.replace(/&/g, ' and ');
  s = s.replace(/'/g, '');
  s = s.replace(/[-‐-―_/]/g, ' ');
  // Giữ chữ, số, khoảng trắng, dấu chấm thập phân và ký hiệu tiền / phần trăm.
  s = s.replace(/[^\p{L}\p{N}\s.£$€%]/gu, ' ');
  s = s.replace(/(?<!\d)\.|\.(?!\d)/g, ' ');
  let tokens = s.split(/\s+/).filter(Boolean);
  tokens = tokens.map((t) => US_OF.get(t) ?? t);
  tokens = convertNumberWords(tokens);
  return tokens.join(' ');
}

const squash = (s: string) => s.replace(/\s+/g, '');

/** "(the) library" -> ["the library", "library"]. */
export function expandOptional(answer: string): string[] {
  const m = /\(([^()]*)\)/.exec(answer);
  if (!m) return [answer];
  const withIt = answer.replace(m[0], m[1] ?? '');
  const without = answer.replace(m[0], '');
  return [...expandOptional(withIt), ...expandOptional(without)];
}

export function answerCandidates(q: Pick<ListeningQuestion, 'answer' | 'accept'>): string[] {
  const base = Array.isArray(q.answer) ? q.answer : [q.answer];
  const all = [...base, ...(q.accept ?? [])];
  const out = new Set<string>();
  for (const a of all) {
    for (const v of expandOptional(a)) {
      const n = normalizeAnswer(v);
      if (n) out.add(n);
    }
  }
  return [...out];
}

/** Câu điền từ: đúng nếu khớp đáp án hay một dạng chấp nhận sau chuẩn hoá. */
export function isGapCorrect(user: string, q: Pick<ListeningQuestion, 'answer' | 'accept'>): boolean {
  const u = normalizeAnswer(user);
  if (!u) return false;
  const su = squash(u);
  return answerCandidates(q).some((c) => c === u || squash(c) === su);
}

const key = (s: string) => String(s ?? '').trim().toUpperCase();

/** Số khoá chọn đúng của câu chọn nhiều đáp án (mỗi khoá đúng = 1 điểm, không vượt số đáp án). */
export function manyCorrectCount(user: string[] | string | undefined, expected: string[]): number {
  const picked = new Set((Array.isArray(user) ? user : user ? [user] : []).map(key));
  const want = new Set(expected.map(key));
  let n = 0;
  for (const k of picked) if (want.has(k)) n += 1;
  return Math.min(n, want.size);
}

// ---------------------------------------------------------------------------
// Chấm cả đề / section
// ---------------------------------------------------------------------------

/** Các số câu mà một câu hỏi phủ (mcq-many phủ nhiều số). */
export function coveredNumbers(q: ListeningQuestion): number[] {
  const count = Array.isArray(q.answer) ? Math.max(1, q.answer.length) : 1;
  return Array.from({ length: count }, (_, i) => q.n + i);
}

export function sectionNumbers(section: ListeningSection): number[] {
  return section.groups.flatMap((g) => g.questions.flatMap(coveredNumbers)).sort((a, b) => a - b);
}

export type QuestionResult = {
  /** Số câu đầu tiên. */
  n: number;
  /** Số câu phủ (mcq-many: 2-3, còn lại 1). */
  span: number;
  type: ListeningGroup['type'];
  /** Số điểm đạt được (0..span). */
  got: number;
  correct: boolean;
  userText: string;
  expectedText: string;
  accepted: string[];
  prompt?: string;
};

const text = (v: string | string[] | undefined) => (Array.isArray(v) ? v.join(', ') : (v ?? ''));

export function scoreGroup(group: ListeningGroup, answers: ListeningAnswers): QuestionResult[] {
  return group.questions.map((q) => {
    const user = answers[q.n];
    if (group.type === 'mcq-many') {
      const expected = Array.isArray(q.answer) ? q.answer : [q.answer];
      const got = manyCorrectCount(user, expected);
      return {
        n: q.n,
        span: expected.length,
        type: group.type,
        got,
        correct: got === expected.length,
        userText: text(Array.isArray(user) ? [...user].sort() : user),
        expectedText: [...expected].sort().join(', '),
        accepted: [],
        prompt: q.prompt,
      };
    }
    const u = Array.isArray(user) ? (user[0] ?? '') : (user ?? '');
    const ok = group.type === 'gap' ? isGapCorrect(u, q) : key(u) !== '' && key(u) === key(String(q.answer));
    return {
      n: q.n,
      span: 1,
      type: group.type,
      got: ok ? 1 : 0,
      correct: ok,
      userText: u,
      expectedText: text(q.answer),
      accepted: q.accept ?? [],
      prompt: q.prompt,
    };
  });
}

export type SectionScore = { score: number; total: number; results: QuestionResult[] };

export function scoreSections(sections: ListeningSection[], answers: ListeningAnswers): SectionScore {
  const results = sections.flatMap((s) => s.groups.flatMap((g) => scoreGroup(g, answers)));
  return {
    score: results.reduce((a, r) => a + r.got, 0),
    total: results.reduce((a, r) => a + r.span, 0),
    results: results.sort((a, b) => a.n - b.n),
  };
}

/** Các số câu đã trả lời (để tô ô điều hướng). */
export function answeredNumbers(sections: ListeningSection[], answers: ListeningAnswers): Set<number> {
  const out = new Set<number>();
  for (const s of sections) {
    for (const g of s.groups) {
      for (const q of g.questions) {
        const v = answers[q.n];
        if (g.type === 'mcq-many') {
          const k = Array.isArray(v) ? v.length : 0;
          coveredNumbers(q).forEach((n, i) => {
            if (i < k) out.add(n);
          });
        } else if (typeof v === 'string' && v.trim() !== '') out.add(q.n);
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Band
// ---------------------------------------------------------------------------

/** Bảng quy đổi Listening 40 câu -> band (bảng IELTS chuẩn). */
const BAND_TABLE: [number, number][] = [
  [39, 9], [37, 8.5], [35, 8], [32, 7.5], [30, 7], [26, 6.5], [23, 6], [18, 5.5],
  [16, 5], [13, 4.5], [10, 4], [8, 3.5], [6, 3], [4, 2.5], [2, 2], [1, 1],
];

export function bandFromRaw40(raw: number): number {
  for (const [min, band] of BAND_TABLE) if (raw >= min) return band;
  return 0;
}

/** Band xấp xỉ cho đề đủ 40 câu hoặc section lẻ (quy tỉ lệ lên 40 câu). */
export function bandFromScore(score: number, total: number): number {
  if (total <= 0) return 0;
  return bandFromRaw40(Math.round((score / total) * 40));
}
