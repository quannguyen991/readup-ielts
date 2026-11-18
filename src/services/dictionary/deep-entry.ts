import { lemmaCandidates } from './lemma-candidates';

/**
 * TỪ ĐIỂN CHUYÊN SÂU — phần logic thuần (không React, không mạng, không nạp JSON).
 *
 * Nhận một danh sách "từ thô" (đủ loại bộ từ của app) rồi dựng chỉ mục, từ đó ghép
 * ra MỘT mục từ đầy đủ: nghĩa đánh số, phiên âm Anh/Mỹ, cụm từ kết hợp, đồng/trái
 * nghĩa, họ từ. Mọi thứ lấy từ dữ liệu có sẵn; chỗ nào không có thì để trống chứ
 * không bịa. Nạp dữ liệu thật ở `deep-loader.ts`.
 */

export type RawWord = {
  word: string;
  pos?: string;
  ipa?: string;
  meaningVi?: string;
  definitionEn?: string;
  example?: string;
  collocation?: string;
  cefr?: string;
  band?: string;
  synonyms?: string[];
  antonyms?: string[];
  language?: string;
  /** Nguồn của dòng này: bộ chủ đề hay danh sách Oxford (chỉ có nghĩa Việt + ví dụ). */
  src?: 'deck' | 'oxford';
};

export type PosKey =
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'adverb'
  | 'preposition'
  | 'conjunction'
  | 'pronoun'
  | 'determiner'
  | 'interjection'
  | 'phrase'
  | 'other';

export type DeepExample = { en: string; vi?: string };
export type DeepSense = { pos: PosKey; definitionEn: string; meaningVi: string; examples: DeepExample[] };
export type DeepRelated = { word: string; meaningVi?: string };
export type DeepFamilyGroup = { pos: PosKey; words: Array<{ word: string; meaningVi?: string; current: boolean }> };

export type DeepEntry = {
  /** Từ hiển thị (dạng gốc nếu người dùng gõ dạng chia). */
  word: string;
  /** Người dùng gõ gì, khi khác `word` ("coastlines" → "coastline"). */
  matchedFrom?: string;
  pos: PosKey;
  posList: PosKey[];
  ipaUk: string | null;
  ipaUs: string | null;
  cefr: string | null;
  band: string | null;
  senses: DeepSense[];
  summaryVi: string;
  notes: string[];
  synonyms: DeepRelated[];
  antonyms: DeepRelated[];
  collocations: string[];
  family: DeepFamilyGroup[];
  source: 'deck' | 'oxford' | 'glossary' | 'network';
};

export type DeepIndex = {
  entries: Map<string, RawWord[]>;
  /** Khoá đã sắp xếp — để tìm theo tiền tố bằng chia đôi. */
  keys: string[];
  collocByToken: Map<string, string[]>;
  phrasesByToken: Map<string, string[]>;
  familyByStem: Map<string, string[]>;
};

/* ------------------------------------------------------------------ từ loại */

const POS_MAP: Record<string, PosKey> = {
  n: 'noun',
  noun: 'noun',
  v: 'verb',
  verb: 'verb',
  adj: 'adjective',
  adjective: 'adjective',
  adv: 'adverb',
  adverb: 'adverb',
  prep: 'preposition',
  preposition: 'preposition',
  conj: 'conjunction',
  conjunction: 'conjunction',
  pron: 'pronoun',
  pronoun: 'pronoun',
  det: 'determiner',
  determiner: 'determiner',
  interj: 'interjection',
  interjection: 'interjection',
  exclamation: 'interjection',
  name: 'noun',
  aux: 'verb',
  phr: 'phrase',
  phrase: 'phrase',
  'phrasal verb': 'phrase',
  idiom: 'phrase',
};

export function normalizePos(raw: string | undefined | null): PosKey {
  const k = (raw ?? '').trim().toLowerCase().replace(/\.$/, '');
  if (POS_MAP[k]) return POS_MAP[k] as PosKey;
  if (/^từ nối/.test(k)) return 'conjunction';
  if (/(phrase|idiom)/.test(k)) return 'phrase';
  // "verb, noun" / "noun / verb" / "noun · verb": lấy từ loại đầu.
  const head = k.split(/[,/·]/)[0]?.trim() ?? '';
  return POS_MAP[head] ?? 'other';
}

export const POS_VI: Record<PosKey, string> = {
  noun: 'Danh từ',
  verb: 'Động từ',
  adjective: 'Tính từ',
  adverb: 'Trạng từ',
  preposition: 'Giới từ',
  conjunction: 'Liên từ',
  pronoun: 'Đại từ',
  determiner: 'Từ hạn định',
  interjection: 'Thán từ',
  phrase: 'Cụm từ',
  other: 'Từ',
};

const POS_ORDER: PosKey[] = ['noun', 'verb', 'adjective', 'adverb', 'preposition', 'conjunction', 'pronoun', 'determiner', 'interjection', 'phrase', 'other'];

/* ----------------------------------------------------------------- chuẩn hoá */

export function normalizeQuery(q: string): string {
  return q
    .normalize('NFC')
    .replace(/[’‘]/g, "'")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/^[^a-z]+|[^a-z]+$/g, '');
}

const LATIN_ONLY = /^[a-z][a-z'’\- .]*$/i;

function tokensOf(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .split(/[^a-z']+/)
    .filter((t) => t.length > 0);
}

const CEFR_RANK: Record<string, number> = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 };

/* -------------------------------------------------------------------- họ từ */

const SUFFIXES = [
  'ization', 'isation', 'ational', 'ations', 'ation', 'itions', 'ition', 'ements', 'ement', 'ments', 'ment', 'nesses', 'ness',
  'ities', 'ity', 'ives', 'ive', 'ously', 'ous', 'fully', 'ful', 'lessly', 'less', 'ables', 'able', 'ibles', 'ible', 'ably', 'ibly',
  'ically', 'ally', 'ical', 'ials', 'ial', 'ics', 'ic', 'als', 'al', 'ly', 'ers', 'er', 'ors', 'or', 'ings', 'ing', 'ed',
  'izes', 'ize', 'ises', 'ise', 'ifies', 'ify', 'ences', 'ence', 'encies', 'ency', 'ents', 'ent', 'ances', 'ance', 'ants', 'ant',
  'ures', 'ure', 'ists', 'ist', 'isms', 'ism', 'ions', 'ion', 'ies', 'es', 's', 'y',
].sort((a, b) => b.length - a.length);

/** Vài cặp trông cùng gốc nhưng nghĩa xa nhau — tách riêng cho khỏi gợi ý sai. */
const STEM_OVERRIDE: Record<string, string> = {
  university: 'universit#',
  universities: 'universit#',
  organ: 'organ#',
  organs: 'organ#',
  organize: 'organiz#',
  organise: 'organiz#',
  organized: 'organiz#',
  organised: 'organiz#',
  organizer: 'organiz#',
  organization: 'organiz#',
  organisation: 'organiz#',
  organizations: 'organiz#',
  organisations: 'organiz#',
  organic: 'organ#',
  organism: 'organ#',
  organisms: 'organ#',
  universal: 'universal#',
  universe: 'univers#',
  journey: 'journey#',
  journeys: 'journey#',
};

/**
 * Khoá họ từ: cắt hậu tố phái sinh (tối đa hai lượt, phần gốc còn ≥ 5 chữ), rồi gọt
 * nguyên âm cuối và phụ âm đôi cuối. Cố ý chặt — thà thiếu từ cùng gốc còn hơn
 * ghép nhầm hai từ không liên quan ("present" ≠ "press").
 */
export function familyKey(word: string): string | null {
  const w = word.toLowerCase();
  if (!/^[a-z]+$/.test(w) || w.length < 5) return null;
  const forced = STEM_OVERRIDE[w];
  if (forced) return forced;
  let stem = w;
  for (let pass = 0; pass < 2; pass += 1) {
    const suf = SUFFIXES.find((s) => stem.endsWith(s) && stem.length - s.length >= 5);
    if (!suf) break;
    stem = stem.slice(0, -suf.length);
  }
  stem = stem.replace(/[aeiouy]+$/, '').replace(/([^aeiou])\1$/, '$1');
  return stem.length >= 4 ? stem : null;
}

function isInflectionOf(a: string, b: string): boolean {
  return a === b || lemmaCandidates(a).includes(b) || lemmaCandidates(b).includes(a);
}

/* ------------------------------------------------------------------- chỉ mục */

export function buildDeepIndex(words: readonly RawWord[]): DeepIndex {
  const entries = new Map<string, RawWord[]>();
  for (const w of words) {
    const key = (w.word ?? '').trim().toLowerCase();
    if (!key || !LATIN_ONLY.test(key)) continue;
    if (w.language && w.language !== 'en') continue;
    const list = entries.get(key);
    if (list) list.push(w);
    else entries.set(key, [w]);
  }
  // Oxford chỉ để lấp chỗ trống: có dòng của bộ chủ đề thì bỏ dòng Oxford cùng từ.
  for (const [key, list] of entries) {
    if (list.some((x) => x.src !== 'oxford') && list.some((x) => x.src === 'oxford')) {
      entries.set(key, list.filter((x) => x.src !== 'oxford'));
    }
  }

  const keys = [...entries.keys()].sort();
  const collocByToken = new Map<string, string[]>();
  const phrasesByToken = new Map<string, string[]>();
  const familyByStem = new Map<string, string[]>();
  const push = (m: Map<string, string[]>, k: string, v: string) => {
    const list = m.get(k);
    if (!list) m.set(k, [v]);
    else if (!list.includes(v)) list.push(v);
  };

  for (const [key, list] of entries) {
    for (const w of list) {
      const c = (w.collocation ?? '').trim().toLowerCase();
      if (c && c.includes(' ')) for (const t of new Set(tokensOf(c))) if (t.length >= 3) push(collocByToken, t, c);
    }
    if (key.includes(' ')) {
      for (const t of new Set(tokensOf(key))) if (t.length >= 3) push(phrasesByToken, t, key);
    } else {
      const fk = familyKey(key);
      if (fk) push(familyByStem, fk, key);
    }
  }
  // Gốc chỉ 4 chữ ("conc" của conceive/conceal) dễ ghép nhầm: chỉ nhận khi có chính từ gốc (whol → whole, happ → happy).
  for (const [stem, list] of familyByStem) {
    if (stem.length <= 4 && !stem.includes('#') && !list.some((w) => w === `${stem}e` || w === `${stem}y`)) familyByStem.delete(stem);
  }
  return { entries, keys, collocByToken, phrasesByToken, familyByStem };
}

/* -------------------------------------------------------------- tìm / gợi ý */

function lowerBound(keys: string[], prefix: string): number {
  let lo = 0;
  let hi = keys.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if ((keys[mid] as string) < prefix) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

export type DeepSuggestion = { word: string; pos: PosKey; meaningVi: string; cefr: string | null };

function firstVi(s: string | undefined): string {
  return (s ?? '').split(/[,;]/)[0]?.trim() ?? '';
}

function brief(index: DeepIndex, key: string): DeepSuggestion {
  const list = index.entries.get(key) ?? [];
  const first = list.find((x) => x.meaningVi) ?? list[0];
  const cefr = list.map((x) => x.cefr).find((c): c is string => Boolean(c)) ?? null;
  return { word: key, pos: normalizePos(first?.pos), meaningVi: firstVi(first?.meaningVi), cefr };
}

/** Gợi ý tức thì theo tiền tố: từ ngắn, cấp thấp trước. */
export function suggestDeep(index: DeepIndex, input: string, limit = 8): DeepSuggestion[] {
  const p = normalizeQuery(input);
  if (!p) return [];
  const out: string[] = [];
  for (let i = lowerBound(index.keys, p); i < index.keys.length; i += 1) {
    const k = index.keys[i] as string;
    if (!k.startsWith(p)) break;
    if (k !== p) out.push(k);
    if (out.length >= 80) break;
  }
  const rank = (k: string) => {
    const cefr = index.entries.get(k)?.map((x) => CEFR_RANK[x.cefr ?? ''] ?? 9).sort()[0] ?? 9;
    return k.split(' ').length * 100 + k.length + cefr * 0.1;
  };
  out.sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
  const exact = index.entries.has(p) ? [p] : [];
  return [...exact, ...out].slice(0, limit).map((k) => brief(index, k));
}

function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j += 1) {
      const v = Math.min((prev[j] as number) + 1, (cur[j - 1] as number) + 1, (prev[j - 1] as number) + (a[i - 1] === b[j - 1] ? 0 : 1));
      cur.push(v);
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[b.length] as number;
}

/** Từ gần giống (sai chính tả nhẹ) trong kho cục bộ. */
export function nearbyWords(index: DeepIndex, input: string, limit = 5): DeepSuggestion[] {
  const q = normalizeQuery(input);
  if (q.length < 3) return [];
  const max = q.length <= 4 ? 1 : 2;
  const scored: Array<[string, number]> = [];
  for (const k of index.keys) {
    if (k[0] !== q[0] || k.includes(' ')) continue;
    const d = editDistance(q, k, max);
    if (d <= max) scored.push([k, d]);
  }
  scored.sort((a, b) => a[1] - b[1] || a[0].length - b[0].length || a[0].localeCompare(b[0]));
  const out = scored.slice(0, limit).map(([k]) => brief(index, k));
  if (out.length >= limit) return out;
  // Bổ sung các từ cùng tiền tố 3 chữ đầu nếu chưa đủ.
  const have = new Set(out.map((x) => x.word));
  for (const s of suggestDeep(index, q.slice(0, 3), 20)) {
    if (!have.has(s.word) && !s.word.includes(' ')) out.push(s);
    if (out.length >= limit) break;
  }
  return out;
}

/* ---------------------------------------------------------- phiên âm Mỹ */

/**
 * Quy đổi phiên âm Anh sang Mỹ (gần đúng): əʊ→oʊ, ɒ→ɑː, thêm /r/ khi chữ viết có r sau
 * nguyên âm. Dữ liệu của app chỉ có MỘT phiên âm (kiểu Anh); đây là cách có hai ô
 * UK/US mà không bịa ra âm. Không chắc thì để nguyên.
 */
export function usIpaFrom(ukIpa: string, word: string): string {
  const raw = ukIpa.trim().replace(/^\/|\/$/g, '');
  if (!raw) return '';
  let s = raw.replace(/əʊ/g, 'oʊ').replace(/ɒ/g, 'ɑː');

  const collapsed = word.toLowerCase().replace(/rr/g, 'r');
  const rCount = (collapsed.match(/r(?![aeiouy])/g) ?? []).length;
  if (rCount > 0) {
    const STRONG = /(ɑː|ɔː|ɜː|ɪə|eə|ʊə)(?!r)/g;
    const strongCount = (s.match(STRONG) ?? []).length;
    const finalSchwa = /ə$/.test(s) ? 1 : 0;
    const all = rCount === strongCount + finalSchwa;
    s = s.replace(STRONG, (m) => (m === 'ɪə' ? 'ɪr' : m === 'eə' ? 'er' : m === 'ʊə' ? 'ʊr' : `${m}r`));
    if (all && finalSchwa) s = s.replace(/ə$/, 'ər');
  }
  return `/${s}/`;
}

/* ------------------------------------------------------------ làm nổi từ */

export type TextPart = { text: string; hit: boolean };

/** Tách câu thành các đoạn, đánh dấu chỗ có từ cần học (cả dạng chia: -s, -ed, -ing, -ly…). */
export function highlightParts(sentence: string, word: string): TextPart[] {
  const w = word.trim().toLowerCase();
  if (!w || !sentence) return [{ text: sentence, hit: false }];
  const escape = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  let pattern: string;
  if (w.includes(' ')) {
    const [first, ...rest] = w.split(' ');
    const stem = (first as string).length > 4 ? (first as string).replace(/(e|y)$/, '') : (first as string);
    pattern = `${escape(stem)}[a-z]*${rest.length ? `\\s+${rest.map(escape).join('\\s+')}` : ''}`;
  } else {
    const stem = w.length > 4 ? w.replace(/(e|y)$/, '') : w;
    pattern = w.length > 4 ? `${escape(stem)}[a-z]{0,4}` : `${escape(stem)}(?:s|es|ed|ing|d)?`;
  }
  const re = new RegExp(`(^|[^A-Za-z])(${pattern})(?![A-Za-z])`, 'gi');
  const parts: TextPart[] = [];
  let last = 0;
  for (let m = re.exec(sentence); m; m = re.exec(sentence)) {
    const lead = m[1] ?? '';
    const start = m.index + lead.length;
    if (start > last) parts.push({ text: sentence.slice(last, start), hit: false });
    parts.push({ text: m[2] as string, hit: true });
    last = start + (m[2] as string).length;
  }
  if (last < sentence.length) parts.push({ text: sentence.slice(last), hit: false });
  return parts.length ? parts : [{ text: sentence, hit: false }];
}

/* ------------------------------------------------------------------ ghép mục */

const STOP = new Set(['the', 'a', 'an', 'of', 'to', 'and', 'or', 'in', 'on', 'for', 'is', 'are', 'be', 'that', 'it', 'by', 'with', 'as']);

function defTokens(s: string): Set<string> {
  return new Set(tokensOf(s).filter((t) => t.length > 2 && !STOP.has(t)));
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter += 1;
  return inter / (a.size + b.size - inter);
}

function sameSense(a: RawWord, b: RawWord): boolean {
  if (normalizePos(a.pos) !== normalizePos(b.pos)) return false;
  const da = a.definitionEn ?? '';
  const db = b.definitionEn ?? '';
  const ma = firstVi(a.meaningVi).toLowerCase();
  const mb = firstVi(b.meaningVi).toLowerCase();
  if (ma && ma === mb) return true;
  if (da && db) return jaccard(defTokens(da), defTokens(db)) >= 0.45;
  return false;
}

function mostCommon<T>(items: T[]): T | null {
  const count = new Map<T, number>();
  for (const x of items) count.set(x, (count.get(x) ?? 0) + 1);
  let best: T | null = null;
  let n = 0;
  for (const [k, c] of count) if (c > n) [best, n] = [k, c];
  return best;
}

function ucfirst(s: string): string {
  return s ? s[0]!.toUpperCase() + s.slice(1) : s;
}

/**
 * Nghĩa Việt ngắn cho một từ đồng/trái nghĩa. Từ nhiều nghĩa (file = tệp / hồ sơ) dễ gắn
 * nhầm nghĩa, nên chỉ ghi khi chắc: dòng của từ đó nhắc ngược lại từ đang tra, hoặc từ đó
 * chỉ có một nghĩa cùng từ loại.
 */
function glossOf(index: DeepIndex, word: string, self: string, selfPos: PosKey, strict: boolean): DeepRelated {
  const list = (index.entries.get(word.toLowerCase()) ?? []).map((x) => ({ ...x, meaningVi: (x.meaningVi ?? '').replace(/^Nghĩa SAT:\s*/i, '') }));
  const back = list.find((x) => x.meaningVi && [...(x.synonyms ?? []), ...(x.antonyms ?? [])].some((y) => y.toLowerCase() === self));
  const meanings = new Set(list.map((x) => firstVi(x.meaningVi).toLowerCase()).filter(Boolean));
  const samePos = list.filter((x) => x.meaningVi && normalizePos(x.pos) === selfPos);
  const pick = back ?? (!strict && meanings.size === 1 ? samePos[0] : undefined);
  const meaning = firstVi(pick?.meaningVi);
  return meaning ? { word, meaningVi: meaning } : { word };
}

function relatedOf(index: DeepIndex, lists: Array<string[] | undefined>, self: string, selfPos: PosKey, strict: boolean, cap = 8): DeepRelated[] {
  const count = new Map<string, number>();
  for (const l of lists) for (const w of l ?? []) {
    const k = w.trim();
    if (k && k.toLowerCase() !== self) count.set(k, (count.get(k) ?? 0) + 1);
  }
  return [...count.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, cap)
    .map(([w]) => glossOf(index, w, self, selfPos, strict));
}

export function collocationsFor(index: DeepIndex, key: string, own: RawWord[], cap = 12): string[] {
  const out: string[] = [];
  const seen = new Set<string>([key]);
  const add = (c: string, own = false) => {
    const t = c.trim().toLowerCase();
    if (!t || seen.has(t) || /[·/;()]/.test(t) || tokensOf(t).length > (own ? 5 : 4)) return;
    // "a criminal record" khi đã có "criminal record": giữ một.
    const bare = t.replace(/^(a|an|the|have a|have an|have the) /, '');
    if (bare !== t && seen.has(bare)) return;
    seen.add(t);
    seen.add(bare);
    out.push(t);
  };
  for (const w of own) if (w.collocation) add(w.collocation, true);
  const variants = new Set([key, `${key}s`, `${key}es`, `${key}ed`, `${key}ing`]);
  const keyHit = (phrase: string) => tokensOf(phrase).some((t) => variants.has(t));
  const others: string[] = [];
  for (const v of variants) {
    for (const c of index.collocByToken.get(v) ?? []) if (keyHit(c)) others.push(c);
    for (const c of index.phrasesByToken.get(v) ?? []) if (keyHit(c)) others.push(c);
  }
  others.sort((a, b) => tokensOf(a).length - tokensOf(b).length || a.length - b.length || a.localeCompare(b));
  for (const c of others) {
    add(c);
    if (out.length >= cap) break;
  }
  return out.slice(0, cap);
}

export function familyFor(index: DeepIndex, word: string, selfPos?: PosKey, cap = 10): DeepFamilyGroup[] {
  const key = word.toLowerCase();
  const fk = familyKey(key);
  if (!fk) return [];
  const members = (index.familyByStem.get(fk) ?? []).filter((m) => m === key || !isInflectionOf(m, key));
  // Bỏ dạng chia của chính các thành viên khác (số nhiều, quá khứ…): giữ dạng ngắn nhất.
  const kept = members.filter((m) => m === key || !members.some((o) => o !== m && o !== key && isInflectionOf(m, o) && o.length < m.length));
  const all = kept.includes(key) ? kept : [key, ...kept];
  if (all.length < 2) return [];

  const groups = new Map<PosKey, DeepFamilyGroup['words']>();
  for (const m of all.slice(0, cap)) {
    const list = index.entries.get(m);
    const pos = m === key && selfPos ? selfPos : normalizePos(list?.[0]?.pos);
    const gloss = firstVi(list?.find((x) => x.meaningVi)?.meaningVi);
    const g = groups.get(pos) ?? [];
    g.push({ word: m, meaningVi: gloss || undefined, current: m === key });
    groups.set(pos, g);
  }
  return POS_ORDER.filter((p) => groups.has(p)).map((p) => ({ pos: p, words: groups.get(p) as DeepFamilyGroup['words'] }));
}

/** Gỡ nhãn do bộ từ tự thêm ("Nghĩa SAT:", "Context:") và bỏ "định nghĩa" thực ra chỉ là một cụm chứa từ. */
function cleanRaw(w: RawWord, key: string): RawWord {
  const meaningVi = (w.meaningVi ?? '').replace(/^Nghĩa SAT:\s*/i, '').trim();
  let definitionEn = (w.definitionEn ?? '').replace(/^(SAT meaning|Rhetorical function):\s*/i, '').trim();
  const dt = tokensOf(definitionEn);
  if (definitionEn && dt.length <= 5 && dt.some((t) => t === key || t.startsWith(key))) definitionEn = '';
  const example = /^(Context|Use case):/i.test((w.example ?? '').trim()) ? '' : (w.example ?? '').trim();
  return { ...w, meaningVi, definitionEn, example };
}

function buildFromRaws(index: DeepIndex, key: string, rawsIn: RawWord[], matchedFrom?: string): DeepEntry {
  const raws = rawsIn.map((w) => cleanRaw(w, key));
  const posOf = (w: RawWord) => normalizePos(w.pos);
  const known = raws.map(posOf).filter((p) => p !== 'other');
  const pos = mostCommon(known.length ? known : raws.map(posOf)) ?? 'other';

  // Nghĩa: gộp các dòng cùng nghĩa (mỗi bộ từ viết lại một kiểu), giữ tối đa 2 câu ví dụ khác nhau.
  const groups: RawWord[][] = [];
  for (const r of raws) {
    const g = groups.find((x) => sameSense(x[0] as RawWord, r));
    if (g) g.push(r);
    else groups.push([r]);
  }
  groups.sort((a, b) => Number(posOf(b[0] as RawWord) === pos) - Number(posOf(a[0] as RawWord) === pos) || b.length - a.length);
  const senses: DeepSense[] = groups.slice(0, 4).map((g) => {
    const head = g.find((x) => x.definitionEn && x.meaningVi) ?? g.find((x) => x.meaningVi) ?? (g[0] as RawWord);
    const seenEx = new Set<string>();
    const examples: DeepExample[] = [];
    for (const r of [head, ...g]) {
      const ex = (r.example ?? '').trim();
      if (ex && !seenEx.has(ex.toLowerCase()) && examples.length < 2) {
        seenEx.add(ex.toLowerCase());
        examples.push({ en: ex });
      }
    }
    return { pos: posOf(head), definitionEn: (head.definitionEn ?? '').trim(), meaningVi: (head.meaningVi ?? '').trim(), examples };
  });

  const ipaRaw = raws.find((r) => r.ipa && posOf(r) === pos)?.ipa ?? raws.find((r) => r.ipa)?.ipa ?? '';
  const ipaUk = ipaRaw ? `/${ipaRaw.trim().replace(/^\/|\/$/g, '')}/` : null;
  const ipaUs = ipaUk ? usIpaFrom(ipaUk, key) : null;

  const cefr = mostCommon(raws.map((r) => r.cefr).filter((c): c is string => c !== undefined && c in CEFR_RANK));
  const band = cefr ? raws.find((r) => r.cefr === cefr && r.band)?.band ?? null : null;

  const synonyms = relatedOf(index, raws.map((r) => r.synonyms), key, pos, senses.length > 1);
  const antonyms = relatedOf(index, raws.map((r) => r.antonyms), key, pos, senses.length > 1);
  const collocations = collocationsFor(index, key, raws);
  const family = familyFor(index, key, pos);

  const posList: PosKey[] = [...new Set(senses.map((s) => s.pos).filter((p) => p !== 'other'))];
  if (!posList.length) posList.push(pos);
  const first = senses[0];
  const second = senses.find((s) => s.pos !== pos && s.pos !== 'other');
  let summaryVi = '';
  if (first && first.meaningVi) {
    const head = first.pos === 'other' ? 'nghĩa là' : `là ${POS_VI[first.pos].toLowerCase()}, nghĩa là`;
    summaryVi = `“${ucfirst(key)}” ${head} ${first.meaningVi}.`;
    if (second && second.meaningVi) summaryVi += ` Còn dùng như ${POS_VI[second.pos].toLowerCase()}: ${second.meaningVi}.`;
  }

  const notes: string[] = [];
  if (matchedFrom && matchedFrom !== key) notes.push(`“${matchedFrom}” là dạng chia của “${key}”.`);
  if (cefr) notes.push(`Mức ${cefr}${band ? `, hay gặp ở band IELTS ${band}` : ''}.`);
  if (synonyms.length) notes.push(`Cần tránh lặp từ khi viết: thay bằng ${synonyms.slice(0, 2).map((s) => `“${s.word}”`).join(' hoặc ')}.`);
  const ownColloc = raws.find((r) => r.collocation)?.collocation;
  if (ownColloc) notes.push(`Hay đi với: “${ownColloc}”.`);
  if (posList.length > 1) notes.push(`Dùng được như ${posList.map((p) => POS_VI[p].toLowerCase()).join(' và ')}; chú ý nghĩa đổi theo từ loại.`);

  const fromOxfordOnly = raws.every((r) => r.src === 'oxford');
  return {
    word: key,
    matchedFrom: matchedFrom && matchedFrom !== key ? matchedFrom : undefined,
    pos,
    posList,
    ipaUk,
    ipaUs: ipaUs || null,
    cefr,
    band,
    senses,
    summaryVi,
    notes: notes.slice(0, 4),
    synonyms,
    antonyms,
    collocations,
    family,
    source: fromOxfordOnly ? 'oxford' : 'deck',
  };
}

/** Tra một từ/cụm trong chỉ mục cục bộ: nguyên dạng, rồi các dạng gốc. */
export function lookupDeep(index: DeepIndex, input: string): DeepEntry | null {
  const q = normalizeQuery(input);
  if (!q) return null;
  const exact = index.entries.get(q);
  if (exact) return buildFromRaws(index, q, exact);
  if (q.includes(' ')) return null;
  for (const c of lemmaCandidates(q)) {
    const hit = index.entries.get(c);
    if (hit) return buildFromRaws(index, c, hit, q);
  }
  return null;
}

/** Mục dựng từ kết quả mạng (không có CEFR/đồng nghĩa), vẫn gắn họ từ và cụm kết hợp từ kho cục bộ. */
export function entryFromRemote(
  index: DeepIndex | null,
  q: string,
  r: { phonetic?: string | null; partOfSpeech?: string | null; definitionGeneral?: string | null; definitionVi?: string | null; examples?: string[] | null },
): DeepEntry {
  const key = normalizeQuery(q) || q.trim().toLowerCase();
  const pos = normalizePos(r.partOfSpeech);
  const ipaUk = r.phonetic ? `/${r.phonetic.trim().replace(/^\/|\/$/g, '')}/` : null;
  let meaningVi = (r.definitionVi ?? '').trim();
  // MyMemory hay viết hoa chữ đầu ("Mộc cầm"); hạ xuống cho khớp phần còn lại, trừ chữ viết tắt.
  if (/^\p{Lu}\p{Ll}/u.test(meaningVi)) meaningVi = meaningVi[0]!.toLowerCase() + meaningVi.slice(1);
  const sense: DeepSense = {
    pos,
    definitionEn: (r.definitionGeneral ?? '').trim(),
    meaningVi,
    examples: (r.examples ?? []).filter(Boolean).slice(0, 2).map((en) => ({ en })),
  };
  const notes = ['Mục này lấy từ từ điển trực tuyến, chưa nằm trong bộ từ của app.'];
  if (meaningVi) notes.push('Nghĩa tiếng Việt do máy dịch, nên đối chiếu thêm.');
  return {
    word: key,
    pos,
    posList: [pos],
    ipaUk,
    // Từ điển trực tuyến chỉ trả một phiên âm, không rõ Anh hay Mỹ: không quy đổi, chỉ hiện một ô.
    ipaUs: null,
    cefr: null,
    band: null,
    senses: [sense],
    summaryVi: meaningVi ? `“${ucfirst(key)}” ${pos === 'other' ? 'nghĩa là' : `là ${POS_VI[pos].toLowerCase()}, nghĩa là`} ${meaningVi}.` : '',
    notes,
    synonyms: [],
    antonyms: [],
    collocations: index ? collocationsFor(index, key, []) : [],
    family: index && !key.includes(' ') ? familyFor(index, key, pos) : [],
    source: 'network',
  };
}

/** Mục tối thiểu từ từ điển song ngữ dựng sẵn (chỉ có nghĩa Việt + từ loại). */
export function entryFromGloss(index: DeepIndex | null, q: string, g: { meaningVi: string; pos: string }): DeepEntry {
  const key = normalizeQuery(q);
  const pos = normalizePos(g.pos);
  return {
    word: key,
    pos,
    posList: [pos],
    ipaUk: null,
    ipaUs: null,
    cefr: null,
    band: null,
    senses: [{ pos, definitionEn: '', meaningVi: g.meaningVi, examples: [] }],
    summaryVi: `“${ucfirst(key)}” nghĩa là ${g.meaningVi}.`,
    notes: ['Chưa kết nối được từ điển trực tuyến, nên chỉ có nghĩa ngắn.'],
    synonyms: [],
    antonyms: [],
    collocations: index ? collocationsFor(index, key, []) : [],
    family: index && !key.includes(' ') ? familyFor(index, key, pos) : [],
    source: 'glossary',
  };
}
