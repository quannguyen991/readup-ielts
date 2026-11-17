import commonWords from '@/data/common-words.json';
import definitions from '@/data/english-definitions.json';
import glossary from '@/data/seed/bilingual/glossary.json';
import { IRREGULAR_VERBS } from '@/data/irregular-verbs';
import { lemmaCandidates } from '@/services/dictionary/lemma-candidates';
import {
  BE_FORMS,
  CONTRACTIONS,
  DO_FORMS,
  HAVE_FORMS,
  MODALS,
  NEGATIVE_AUX,
  PRONOUN_SUBJECT,
  VERB_BASE,
  gerund,
  thirdPerson,
  isAdjectiveLike,
  verbReadings,
} from './lexicon';

/**
 * Bắt lỗi ngữ pháp, chính tả và "lỗi người Việt hay mắc" trong một câu tiếng Anh
 * bằng LUẬT — không gọi AI. Dùng cho bài Tự diễn đạt và Viết cả đoạn.
 *
 * KHÔNG PHẢI trình kiểm ngữ pháp đầy đủ. Mỗi luật chỉ bắt một dạng lỗi mà dấu
 * hiệu RẤT RÕ, vì báo nhầm một câu đúng làm người học mất tin vào nhận xét còn
 * tệ hơn bỏ sót một lỗi. Lỗi nào không chắc thì hạ xuống mức `warn` ("có thể…").
 */

export type IssueKind = 'spelling' | 'grammar' | 'punctuation' | 'vietnamese' | 'style';
export type Severity = 'error' | 'warn' | 'info';

export type Issue = {
  id: string;
  kind: IssueKind;
  severity: Severity;
  /** Vị trí trong chuỗi người học gõ (để tô đỏ). */
  start: number;
  end: number;
  /** Đoạn gốc bị đánh dấu. */
  found: string;
  /** Gợi ý sửa, nếu có. */
  fix?: string;
  /** Giải thích tiếng Việt, một câu. */
  vi: string;
};

type Word = { text: string; lower: string; start: number; end: number };

export function wordsWithPositions(text: string): Word[] {
  const out: Word[] = [];
  const re = /[A-Za-z]+(?:['’][A-Za-z]+)?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    out.push({ text: m[0], lower: m[0].toLowerCase().replace(/’/g, "'"), start: m.index, end: m.index + m[0].length });
  }
  return out;
}

// ------------------------------------------------------------------ từ điển chính tả

let DICT: Set<string> | null = null;
let COMMON: Set<string> | null = null;

const NUMBER_WORDS = 'zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty thirty forty fifty sixty seventy eighty ninety hundred thousand million billion first second third fourth fifth sixth seventh eighth ninth tenth half quarter dozen once twice'.split(' ');

function dictionary(): Set<string> {
  if (DICT) return DICT;
  const d = new Set<string>();
  for (const w of commonWords as string[]) d.add(w.toLowerCase());
  for (const k of Object.keys(glossary as Record<string, unknown>)) {
    if (/^[a-z']+$/.test(k)) d.add(k);
  }
  for (const k of Object.keys(definitions as Record<string, unknown>)) {
    const head = k.split('|')[0]!.toLowerCase();
    for (const part of head.split(/\s+/)) if (/^[a-z']+$/.test(part)) d.add(part);
  }
  for (const w of NUMBER_WORDS) d.add(w);
  for (const v of IRREGULAR_VERBS) {
    d.add(v.base.toLowerCase());
    for (const f of [...v.past.split('/'), ...v.pp.split('/')]) d.add(f.trim().toLowerCase());
  }
  for (const v of VERB_BASE) d.add(v);
  for (const w of [...BE_FORMS, ...HAVE_FORMS, ...DO_FORMS, ...MODALS, ...PRONOUN_SUBJECT]) d.add(w);
  for (const k of Object.keys(CONTRACTIONS)) d.add(k);
  for (const k of Object.keys(NEGATIVE_AUX)) d.add(k);
  DICT = d;
  return d;
}

/** Thêm từ vào từ điển (từ khoá của đề bài, chủ đề…) để không bị báo sai chính tả. */
export function extendDictionary(words: Iterable<string>): void {
  const d = dictionary();
  for (const w of words) d.add(w.toLowerCase().replace(/’/g, "'"));
}

const OK_EXTRA = new Set(['dong', 'latte', 'ache', 'aches', 'lied', 'ought', 'lying', 'lies', 'dongs', 'lattes']);

export function isKnownWord(word: string, extra?: ReadonlySet<string>): boolean {
  const w = word.toLowerCase().replace(/’/g, "'");
  const d = dictionary();
  if (d.has(w) || extra?.has(w)) return true;
  if (OK_EXTRA.has(w)) return true;
  if (w.length <= 2) return true;
  if (/'s$/.test(w) && (d.has(w.slice(0, -2)) || extra?.has(w.slice(0, -2)))) return true;
  if (/n't$/.test(w) || /'(ll|re|ve|d|m)$/.test(w)) return true;
  for (const c of lemmaCandidates(w)) if (d.has(c) || extra?.has(c)) return true;
  // Số nhiều/quá khứ của từ đã biết có quy tắc đặc biệt (-ies, -ied, gấp đôi phụ âm) đã nằm ở lemmaCandidates.
  return false;
}

export function editDistance(a: string, b: string, max = 3): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    let cur = i;
    let rowMin = cur;
    let diag = prev[0]!;
    prev[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const tmp = prev[j]!;
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur = Math.min(prev[j]! + 1, prev[j - 1]! + 1, diag + cost);
      // chuyển vị hai chữ liền nhau (teh → the) tính một lỗi
      diag = tmp;
      prev[j] = cur;
      rowMin = Math.min(rowMin, cur);
    }
    if (rowMin > max) return max + 1;
  }
  return prev[b.length]!;
}

function commonSet(): Set<string> {
  if (!COMMON) COMMON = new Set((commonWords as string[]).map((w) => w.toLowerCase()));
  return COMMON;
}

/**
 * Gõ nhầm CHẮC CHẮN, không phải từ hiếm bị thiếu trong từ điển. Chỉ ba dạng:
 *   - hai chữ liền nhau bị đảo mà ra từ có thật (freind → friend, recieve → receive);
 *   - thiếu đúng một chữ của từ thông dụng dài ≥ 5 chữ (mesage → message, wuld → would);
 *   - gần (≤ 2 ký tự) một từ nằm trong chính đề bài.
 */
function strongCorrection(typed: string, extra?: ReadonlySet<string>): string | null {
  const d = dictionary();
  const common = commonSet();
  for (let i = 0; i < typed.length - 1; i += 1) {
    const swapped = typed.slice(0, i) + typed[i + 1] + typed[i] + typed.slice(i + 2);
    if (swapped !== typed && (d.has(swapped) || extra?.has(swapped))) return swapped;
  }
  if (typed.length >= 4) {
    for (let i = 0; i <= typed.length; i += 1) {
      for (const c of 'abcdefghijklmnopqrstuvwxyz') {
        const cand = typed.slice(0, i) + c + typed.slice(i);
        if (common.has(cand) || extra?.has(cand)) return cand;
      }
    }
  }
  if (extra) {
    let best: string | null = null;
    let bestD = 3;
    for (const e of extra) {
      if (e.length < 3 || Math.abs(e.length - typed.length) > 2) continue;
      const dist = editDistance(typed, e, 2);
      if (dist < bestD) {
        bestD = dist;
        best = e;
      }
    }
    if (best && bestD <= (typed.length <= 4 ? 1 : 2)) return best;
  }
  return null;
}

// ----------------------------------------------------------- lỗi người Việt hay mắc

type Pattern = { re: RegExp; fix: string; vi: string; kind?: IssueKind };

const VIET_PATTERNS: Pattern[] = [
  { re: /\bam agree\b/i, fix: 'agree', vi: 'Agree là động từ, không cần am: I agree (không nói I am agree).' },
  { re: /\b(?:is|are) agree\b/i, fix: 'agrees / agree', vi: 'Agree là động từ thường, không đi với be.' },
  { re: /\bdiscuss about\b/i, fix: 'discuss', vi: 'Discuss đã có nghĩa "bàn về", không thêm about.' },
  { re: /\bmarry with\b/i, fix: 'marry', vi: 'Marry đi thẳng với người: marry her (không có with).' },
  { re: /\blisten (?:the |a )?(?:music|radio|song|news)\b/i, fix: 'listen to …', vi: 'Listen luôn đi với to: listen to music.' },
  { re: /\bexplain me\b/i, fix: 'explain to me', vi: 'Explain đi với to + người: explain it to me.' },
  { re: /\bvery (?:like|love|want|enjoy|hate)\b/i, fix: 'like … very much', vi: 'Very không đứng trước động từ: nói I like it very much / I really like it.' },
  { re: /\bdepend of\b/i, fix: 'depend on', vi: 'Depend đi với on: depend on.' },
  { re: /\binterested about\b/i, fix: 'interested in', vi: 'Interested đi với in: interested in.' },
  { re: /\b(?:good|bad|excellent) in (?!the\b|a\b)\w+/i, fix: 'good at …', vi: 'Giỏi về môn/việc gì dùng good at: good at maths.' },
  { re: /\bafraid from\b/i, fix: 'afraid of', vi: 'Afraid đi với of: afraid of dogs.' },
  { re: /\b(?:peoples)\b/i, fix: 'people', vi: 'People đã là số nhiều, không thêm s.' },
  { re: /\b(?:informations|advices|knowledges|furnitures|homeworks|equipments|researches|luggages|evidences)\b/i, fix: 'dạng không đếm được (bỏ s)', vi: 'Danh từ không đếm được, không có số nhiều: information, advice, homework…' },
  { re: /\b(?:he|she|it) don't\b/i, fix: "doesn't", vi: "He/she/it đi với doesn't, không phải don't." },
  { re: /\bdoes(?:n't| not) [a-z]+(?:s|es)\b/i, fix: 'does not + V nguyên mẫu', vi: 'Sau does/doesn’t động từ về nguyên mẫu (không thêm s).' },
  { re: /\b(?:can|could|must|should|will|would|may|might) to [a-z]+/i, fix: 'bỏ "to"', vi: 'Sau can/could/must/should/will… động từ nguyên mẫu KHÔNG có to.' },
  { re: /\bi am (?:boring|interesting|exciting|confusing|surprising|annoying|tiring)\b/i, fix: 'bored / interested / excited / confused / surprised / annoyed / tired', vi: 'Nói cảm xúc của mình dùng -ed (I am bored); -ing là tính chất của vật/việc.' },
  { re: /\bmuch (?:people|friends|books|students|cars|things|children|problems)\b/i, fix: 'many …', vi: 'Danh từ đếm được số nhiều dùng many, không dùng much.' },
  { re: /\bmany (?:water|money|time|information|traffic|advice|food|rice|homework)\b/i, fix: 'much …', vi: 'Danh từ không đếm được dùng much, không dùng many.' },
  { re: /\bat (?:the )?(?:morning|afternoon|evening)\b/i, fix: 'in the morning / afternoon / evening', vi: 'Buổi trong ngày dùng in the…: in the morning.' },
  { re: /\bin the night\b/i, fix: 'at night', vi: 'Ban đêm nói at night.' },
  { re: /\bin (?:the )?weekends?\b/i, fix: 'at / on the weekend', vi: 'Cuối tuần dùng at the weekend (Anh) hoặc on the weekend (Mỹ).' },
  { re: /\bin (?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i, fix: 'on + thứ', vi: 'Thứ trong tuần dùng on: on Monday.' },
  { re: /\bgo to home\b/i, fix: 'go home', vi: 'Home đứng sau go không cần to: go home.' },
  { re: /\barrive to\b/i, fix: 'arrive at / in', vi: 'Arrive đi với at (nơi nhỏ) hoặc in (thành phố): arrive at the station.' },
  { re: /\breach to\b/i, fix: 'reach', vi: 'Reach đi thẳng với nơi đến: reach the city.' },
  { re: /\breturn back\b/i, fix: 'return', vi: 'Return đã có nghĩa "quay lại"; back là thừa.' },
  { re: /\b(?:i|you|we|they) have \d+ years old\b|\b(?:he|she) has \d+ years old\b/i, fix: 'am/is/are + số + years old', vi: 'Tuổi dùng be: I am twenty years old (không dùng have).' },
  { re: /\b(?:more|most) [a-z]+(?:er|est)\b(?<!\bmore (?:other|water|offer|father|mother|number|order|never|power|paper|user|answer|per|newspaper|pepper|computer|teacher|member|customer|winter|summer|dinner|river|silver|center|centre|layer|player|worker|manager|driver|speaker|reader|writer|leader|farmer|owner|partner|officer|researcher|traveller|traveler|border|corner|powder|forest|interest|request|contest|harvest|guest|protest|chest|quest|test|rest|west|east|best)\b)/i, fix: 'bỏ more/most', vi: 'Không dùng cả more/most lẫn -er/-est: chỉ faster (không phải more faster).', kind: 'grammar' },
  { re: /\bdiscuss on\b/i, fix: 'discuss', vi: 'Discuss đi thẳng với chủ đề: discuss the plan.' },
  { re: /\bthe (?:life|nature|health|education|society|happiness)\b(?= is| are| can| has)/i, fix: 'bỏ the (khi nói chung)', vi: 'Nói chung về một khái niệm thì không dùng the: Life is short.', kind: 'style' },
  { re: /\bbecause of (?:i|you|he|she|it|we|they) (?:am|is|are|was|were|have|has|had|can|will)\b/i, fix: 'because + mệnh đề', vi: 'Because of + danh từ; trước một mệnh đề (có chủ ngữ + động từ) dùng because.' },
  { re: /\balthough [^.]*\bbut\b/i, fix: 'chỉ dùng although HOẶC but', vi: 'Although … but … thừa một từ nối: chỉ dùng một trong hai.' },
  { re: /\bthough [^.]*\bbut\b/i, fix: 'chỉ dùng though HOẶC but', vi: 'Though … but … thừa một từ nối: chỉ dùng một trong hai.' },
];

// ------------------------------------------------------------------ quy tắc theo từ

const VOWEL_SOUND_EXCEPT_AN = /^(?:hour|honest|honor|honour|heir)/;
const CONSONANT_SOUND_EXCEPT_A = /^(?:uni|use|usu|eur|one|once|ubiq|util)/;
const COMMON_NOUN_VERBS = new Set(
  'work study plan change increase help need walk rest drink cause care answer test use love look talk play call phone move start end control cut set shop face park dance'.split(' '),
);
/** Động từ bất quy tắc phổ biến, hầu như không có nghĩa danh từ/tính từ dạng gốc. */
const SAFE_IRREGULAR = new Set('go eat see buy take make give know write speak choose begin drive tell think get say do bring forget grow hear leave lose meet pay sell send sit sleep stand teach understand wear win'.split(' '));
const NOUN_SUBJECT_VERBS = new Set('wake like want live go eat drink think know love hate enjoy come give prefer feel speak teach begin understand forget'.split(' '));
const IRREGULAR_PLURAL_NOUNS = new Set(['people', 'children', 'men', 'women', 'police', 'friends', 'parents', 'family', 'staff', 'team', 'class', 'group', 'sheep', 'fish']);
const NO_AGREEMENT_PREV = new Set(['to', 'will', 'would', 'can', 'could', 'should', 'must', 'may', 'might', 'shall', 'do', 'does', 'did', "don't", "doesn't", "didn't", "won't", "can't", 'not', 'let', 'let’s', "let's", 'help', 'make', 'made', 'and', 'or', 'but']);

function irregularBaseFromPast(w: string): { base: string } | null {
  if (!/ed$/.test(w) || w.length < 4) return null;
  const stem = w.slice(0, -2);
  const cands = [stem, `${stem}e`, stem.endsWith('i') ? `${stem.slice(0, -1)}y` : stem];
  for (const v of IRREGULAR_VERBS) {
    const base = v.base.toLowerCase();
    if (base === 'be' || base === 'do') continue;
    if (cands.includes(base) && !v.past.split('/').some((p) => p.trim().toLowerCase() === w)) return { base };
  }
  return null;
}

function addIssue(list: Issue[], issue: Omit<Issue, 'id'>) {
  // Tránh báo trùng hai luật cùng một đoạn.
  if (list.some((x) => x.start < issue.end && issue.start < x.end && x.kind === issue.kind)) return;
  list.push({ ...issue, id: `${issue.kind}-${issue.start}-${list.length}` });
}

/**
 * Tìm lỗi trong một CÂU (hoặc một đoạn ngắn). `extraWords`: từ của đề bài/chủ đề
 * để không báo sai chính tả những từ chuyên ngành hợp lệ.
 */
export function findIssues(text: string, options: { extraWords?: ReadonlySet<string>; requireEndPunct?: boolean; checkCapital?: boolean } = {}): Issue[] {
  const issues: Issue[] = [];
  const raw = text;
  const trimmed = raw.trim();
  if (!trimmed) return issues;
  const words = wordsWithPositions(raw);
  const { extraWords } = options;

  // 1. Hoa đầu câu, dấu cuối câu, từ "i".
  if (options.checkCapital !== false) {
    const first = words[0];
    if (first && /^[a-z]/.test(first.text) && first.start === raw.indexOf(trimmed[0]!)) {
      addIssue(issues, { kind: 'punctuation', severity: 'warn', start: first.start, end: first.end, found: first.text, fix: first.text[0]!.toUpperCase() + first.text.slice(1), vi: 'Chữ đầu câu cần viết hoa.' });
    }
  }
  if (options.requireEndPunct !== false && !/[.!?]["”’']?$/.test(trimmed)) {
    addIssue(issues, { kind: 'punctuation', severity: 'warn', start: raw.length - 1 - (raw.length - raw.trimEnd().length), end: raw.trimEnd().length, found: trimmed.slice(-1), fix: `${trimmed.slice(-1)}.`, vi: 'Câu chưa có dấu chấm (hoặc ? !) ở cuối.' });
  }
  for (const w of words) {
    if (w.lower === 'i' && w.text === 'i') addIssue(issues, { kind: 'punctuation', severity: 'warn', start: w.start, end: w.end, found: 'i', fix: 'I', vi: 'Đại từ "I" luôn viết hoa.' });
    if (/^i['’](?:m|ll|ve|d)$/.test(w.text)) addIssue(issues, { kind: 'punctuation', severity: 'warn', start: w.start, end: w.end, found: w.text, fix: `I${w.text.slice(1)}`, vi: 'Đại từ "I" luôn viết hoa.' });
  }

  // 2. Từ lặp liền nhau.
  for (let i = 1; i < words.length; i += 1) {
    const a = words[i - 1]!;
    const b = words[i]!;
    if (a.lower === b.lower && !['that', 'had', 'very', 'so'].includes(a.lower)) {
      addIssue(issues, { kind: 'grammar', severity: 'error', start: b.start, end: b.end, found: b.text, fix: '(bỏ từ lặp)', vi: `Từ "${a.text}" bị viết lặp hai lần liền nhau.` });
    }
  }

  // 3. Chính tả. Lỗi CỨNG chỉ khi có bằng chứng mạnh (`strongCorrection`); từ lạ còn lại im lặng —
  // từ điển nhỏ nên từ hợp lệ nhưng hiếm (toast, vet, mint…) không được phạt oan. Chuỗi vô nghĩa thì cảnh báo.
  words.forEach((w, i) => {
    if (isKnownWord(w.lower, extraWords)) return;
    if (i > 0 && /^[A-Z]/.test(w.text)) return;
    const guess = strongCorrection(w.lower, extraWords);
    if (guess) {
      addIssue(issues, { kind: 'spelling', severity: 'error', start: w.start, end: w.end, found: w.text, fix: guess, vi: `Có thể sai chính tả: "${w.text}" → "${guess}".` });
    } else if (w.lower.length > 3 && (!/[aeiouy]/.test(w.lower) || /[^aeiouy\s'-]{5,}/.test(w.lower))) {
      addIssue(issues, { kind: 'spelling', severity: 'warn', start: w.start, end: w.end, found: w.text, vi: `Không nhận ra từ "${w.text}" — kiểm tra lại chính tả.` });
    }
  });

  // 4. Mạo từ a/an.
  for (let i = 0; i < words.length - 1; i += 1) {
    const a = words[i]!;
    const n = words[i + 1]!;
    if (i > 0 && /^[A-Z]/.test(a.text)) continue;
    if (a.lower === 'a' && /^[aeiou]/.test(n.lower) && !CONSONANT_SOUND_EXCEPT_A.test(n.lower)) {
      addIssue(issues, { kind: 'grammar', severity: 'error', start: a.start, end: n.end, found: `${a.text} ${n.text}`, fix: `an ${n.text}`, vi: `Trước âm nguyên âm dùng "an": an ${n.lower}.` });
    } else if (a.lower === 'an' && (!/^[aeiou]/.test(n.lower) || CONSONANT_SOUND_EXCEPT_A.test(n.lower)) && !VOWEL_SOUND_EXCEPT_AN.test(n.lower)) {
      addIssue(issues, { kind: 'grammar', severity: 'error', start: a.start, end: n.end, found: `${a.text} ${n.text}`, fix: `a ${n.text}`, vi: `Trước âm phụ âm dùng "a": a ${n.lower}.` });
    }
  }

  // 5. Hoà hợp chủ–vị đơn giản và dạng động từ sau trợ động từ.
  for (let i = 0; i < words.length - 1; i += 1) {
    const w = words[i]!;
    const n = words[i + 1]!;
    const prev = words[i - 1];
    // Đại từ + động từ sai ngôi.
    if (['he', 'she', 'it'].includes(w.lower)) {
      const afterAux = !!prev && (MODALS.has(prev.lower) || DO_FORMS.has(prev.lower) || ['to', 'let', 'make', 'made', 'if', 'that', 'wish'].includes(prev.lower));
      const rd = verbReadings(n.lower);
      const isBase = rd.some((r) => r.form === 'base') && !rd.some((r) => r.form !== 'base') && VERB_BASE.has(n.lower);
      if (isBase && !afterAux && !MODALS.has(n.lower) && !BE_FORMS.has(n.lower) && !DO_FORMS.has(n.lower) && !HAVE_FORMS.has(n.lower) && !isAdjectiveLike(n.lower)) {
        addIssue(issues, { kind: 'grammar', severity: 'error', start: n.start, end: n.end, found: n.text, fix: `${n.text}s`, vi: `Chủ ngữ ${w.text} (ngôi thứ ba số ít) → động từ thêm -s/-es: ${n.lower}s.` });
      }
      if (n.lower === 'have') addIssue(issues, { kind: 'grammar', severity: 'error', start: n.start, end: n.end, found: n.text, fix: 'has', vi: `Với ${w.text} dùng "has", không phải "have".` });
      if (n.lower === 'do') addIssue(issues, { kind: 'grammar', severity: 'error', start: n.start, end: n.end, found: n.text, fix: 'does', vi: `Với ${w.text} dùng "does", không phải "do".` });
      if ((n.lower === 'are' || (n.lower === 'were' && !(prev && ['if', 'wish', 'as', 'though', 'whether', 'suppose'].includes(prev.lower)))) ) addIssue(issues, { kind: 'grammar', severity: 'error', start: n.start, end: n.end, found: n.text, fix: n.lower === 'are' ? 'is' : 'was', vi: `Với ${w.text} dùng ${n.lower === 'are' ? 'is' : 'was'}.` });
    }
    if (['i', 'you', 'we', 'they'].includes(w.lower)) {
      const rd = verbReadings(n.lower);
      const third = rd.length > 0 && rd.every((r) => r.form === 'third') && !VERB_BASE.has(n.lower);
      if (third && n.lower !== 'is' && n.lower !== 'has' && n.lower !== 'does') {
        const base = rd[0]!.base;
        addIssue(issues, { kind: 'grammar', severity: 'error', start: n.start, end: n.end, found: n.text, fix: base, vi: `Chủ ngữ ${w.text} đi với động từ nguyên mẫu: ${base} (không thêm -s).` });
      }
      if (n.lower === 'is' && w.lower !== 'i') addIssue(issues, { kind: 'grammar', severity: 'error', start: n.start, end: n.end, found: n.text, fix: 'are', vi: `Với ${w.text} dùng "are".` });
      if (n.lower === 'is' && w.lower === 'i') addIssue(issues, { kind: 'grammar', severity: 'error', start: n.start, end: n.end, found: n.text, fix: 'am', vi: 'Với I dùng "am".' });
      if (n.lower === 'has') addIssue(issues, { kind: 'grammar', severity: 'error', start: n.start, end: n.end, found: n.text, fix: 'have', vi: `Với ${w.text} dùng "have", không phải "has".` });
      if (n.lower === 'does') addIssue(issues, { kind: 'grammar', severity: 'error', start: n.start, end: n.end, found: n.text, fix: 'do', vi: `Với ${w.text} dùng "do", không phải "does".` });
      if (n.lower === 'am' && w.lower !== 'i') addIssue(issues, { kind: 'grammar', severity: 'error', start: n.start, end: n.end, found: n.text, fix: 'are', vi: `Với ${w.text} dùng "are", không phải "am".` });
      if (n.lower === 'was' && (w.lower === 'you' || w.lower === 'we' || w.lower === 'they')) addIssue(issues, { kind: 'grammar', severity: 'error', start: n.start, end: n.end, found: n.text, fix: 'were', vi: `Với ${w.text} dùng "were".` });
    }
    // "my sister wake" — danh từ số ít (có từ sở hữu đứng trước) + động từ nguyên mẫu. Chỉ với động từ
    // ít khi là danh từ, vì "my phone call" hay "the school play" là cụm danh từ hợp lệ.
    if (prev && ['my', 'your', 'his', 'her', 'our', 'their'].includes(prev.lower) && NOUN_SUBJECT_VERBS.has(n.lower)) {
      const noun = w.lower;
      const looksSingular = !/s$/.test(noun) && !IRREGULAR_PLURAL_NOUNS.has(noun) && !isAdjectiveLike(noun) && !BE_FORMS.has(noun) && !MODALS.has(noun) && !DO_FORMS.has(noun) && !HAVE_FORMS.has(noun) && !verbReadings(noun).some((r) => r.form !== 'base') && !VERB_BASE.has(noun);
      if (looksSingular) {
        addIssue(issues, { kind: 'grammar', severity: 'error', start: n.start, end: n.end, found: n.text, fix: `${thirdPerson(n.lower)}`, vi: `Chủ ngữ "${prev.text} ${w.text}" là số ít (ngôi thứ ba) → động từ thêm -s/-es: ${thirdPerson(n.lower)}.` });
      }
    }
    // Sau trợ động từ khuyết thiếu / do / to: động từ nguyên mẫu.
    if (MODALS.has(w.lower) || ['do', 'does', 'did', "don't", "doesn't", "didn't"].includes(w.lower) || w.lower === 'to') {
      if (w.lower === 'to' && !(prev && /^(?:want|wants|wanted|need|needs|needed|decide|decided|plan|planned|hope|hoped|try|tried|like|liked|love|loved|going|have|has|had|able|used|ought|how|what|where|when|why|who|enough|too|order|so|not|refuse|refused|promise|promised|learn|learned|manage|managed|afford|agree|agreed|expect|expected|prefer|preferred|begin|began|start|started|continue|continued|forget|forgot|remember|remembered|seem|seems|seemed|appear|appeared|choose|chose|allow|allowed|ask|asked|tell|told|help|helped|encourage|encouraged|require|required|invite|invited|teach|taught|advise|advised|important|necessary|essential|easy|hard|difficult|possible|impossible|nice|good|better|best|ready|likely|unlikely|happy|glad|sorry|sure|time|way|chance|opportunity|ability|right|reason|something|nothing|anything|everything|first|last|next|one|two|only|lots|a|an|the|his|her|their|my|our|your|its|used|look|looking|forward|talk|talking|listen|listening|due|according|thanks|compared|close|next|key|contribute|contributes|contributed|lead|leads|led|react|reacts|reacted|respond|responded|belong|belongs|apply|applies|applied|refer|refers|referred|prior|similar|related|opposed|devoted|dedicated|committed|addicted|exposed|object|objected|go|goes|went|come|comes|came|get|gets|got|move|moved|walk|walked|travel|travelled|traveled|return|returned|drive|drove|fly|flew|send|sent|give|gave|show|showed|bring|brought|take|took|say|said|speak|spoke|write|wrote|reply|replied|point|pointed|turn|turned|add|added|pay|paid|owe|owed|set|run|ran|lie|lay|open|opened|stay|stayed|wait|waited|rush|rushed|escape|escaped|connect|connected|link|linked|attach|attached|join|joined|face|faced|offer|offered|attend|attended|sing|sang|vote|voted|swear|swore)$/i.test(prev.lower))) {
        // "to" + danh từ/địa điểm là giới từ — không kiểm.
        continue;
      }
      const rd = verbReadings(n.lower);
      if (rd.length > 0 && !rd.some((r) => r.form === 'base') && !VERB_BASE.has(n.lower) && !isAdjectiveLike(n.lower) && n.lower !== 'be' && !BE_FORMS.has(n.lower)) {
        const base = rd[0]!.base;
        // "to + V-ing" là hợp lệ (look forward to doing, used to doing): bỏ qua nếu là -ing.
        if (rd.every((r) => r.form === 'ing') && w.lower === 'to') continue;
        if (w.lower === 'to' && rd.every((r) => r.form === 'pp' || r.form === 'past')) continue;
        if (w.lower !== 'to' && rd.every((r) => r.form === 'ing') && words[i + 2] && VERB_BASE.has(words[i + 2]!.lower)) continue;
        if (rd.every((r) => r.form === 'ing') || rd.every((r) => r.form === 'pp' || r.form === 'past') || rd.every((r) => r.form === 'third')) {
          addIssue(issues, { kind: 'grammar', severity: 'error', start: n.start, end: n.end, found: n.text, fix: base, vi: `Sau "${w.text}" động từ về nguyên mẫu: ${base}.` });
        }
      }
    }
    // have/has/had + động từ bất quy tắc ở dạng gốc ("have go" → "have gone").
    if (['have', 'has', 'had'].includes(w.lower) && SAFE_IRREGULAR.has(n.lower)) {
      const v = IRREGULAR_VERBS.find((x) => x.base.toLowerCase() === n.lower);
      const pp = v?.pp.split('/')[0]?.trim();
      if (v && pp && pp !== n.lower && !(prev && ['a', 'an', 'the'].includes(prev.lower))) {
        addIssue(issues, { kind: 'grammar', severity: 'error', start: n.start, end: n.end, found: n.text, fix: pp, vi: `Sau ${w.text} dùng phân từ V3: ${pp}.` });
      }
    }
    // be + động từ bất quy tắc ở dạng gốc ("is go" → "is going").
    if (['am', 'is', 'are', 'was', 'were'].includes(w.lower) && SAFE_IRREGULAR.has(n.lower)) {
      const v = IRREGULAR_VERBS.find((x) => x.base.toLowerCase() === n.lower);
      const pp = v?.pp.split('/')[0]?.trim();
      if (v && pp) {
        addIssue(issues, { kind: 'grammar', severity: 'error', start: n.start, end: n.end, found: n.text, fix: `${gerund(n.lower)} / ${pp}`, vi: `Sau ${w.text} cần V-ing (tiếp diễn) hoặc V3 (bị động), không dùng "${n.text}" nguyên mẫu.` });
      }
    }
    // Quá khứ sai kiểu "goed", "eated".
    const over = irregularBaseFromPast(w.lower);
    if (over) {
      const v = IRREGULAR_VERBS.find((x) => x.base.toLowerCase() === over.base)!;
      addIssue(issues, { kind: 'grammar', severity: 'error', start: w.start, end: w.end, found: w.text, fix: v.past.split('/')[0]!.trim(), vi: `"${over.base}" là động từ bất quy tắc: quá khứ là ${v.past.split('/')[0]!.trim()}, không phải ${w.lower}.` });
    }
  }

  // 6. Mẫu lỗi người Việt.
  for (const p of VIET_PATTERNS) {
    const m = p.re.exec(raw);
    if (m) {
      addIssue(issues, { kind: p.kind ?? 'vietnamese', severity: 'error', start: m.index, end: m.index + m[0].length, found: m[0], fix: p.fix, vi: p.vi });
    }
  }

  return issues.sort((a, b) => a.start - b.start);
}

/** Câu có dấu hiệu thiếu động từ chia (cụm danh từ trơ trọi) — dùng ở bài Tự diễn đạt. */
export function hasFiniteVerbHint(text: string): boolean {
  const ws = wordsWithPositions(text).map((w) => w.lower);
  if (ws.some((w) => BE_FORMS.has(w) || HAVE_FORMS.has(w) || DO_FORMS.has(w) || MODALS.has(w) || CONTRACTIONS[w] || NEGATIVE_AUX[w])) return true;
  return ws.some((w) => verbReadings(w).length > 0);
}
