/**
 * So khớp câu tìm với chỉ mục — chạy ngay trên máy người học, mỗi phím gõ.
 *
 * Cách chấm, cố ý đơn giản để đoán được:
 *
 *   1. Câu tìm được bỏ dấu và tách từ (`normalize.ts`), rồi gom thành NHÓM: mỗi
 *      nhóm là một ý ("môi trường", "nghe", "task", "2"). Cụm có trong bảng
 *      đồng nghĩa ("từ vựng", "hàm số") thành một nhóm với các cách nói khác.
 *   2. Một nhóm khớp một mục khi MỌI từ của một cách nói khớp (trùng hẳn, hoặc
 *      là đầu của một từ — để "moi tru" đã ra "Môi trường").
 *   3. Điểm: khớp ở tiêu đề > từ khoá > dòng phụ. Cách nói gốc của người học
 *      ăn điểm hơn từ đồng nghĩa. Cả câu nằm liền trong tiêu đề thì cộng thêm.
 *   4. Mặc định đòi MỌI nhóm đều khớp ("task 2" không được ra đề Task 1). Câu
 *      dài kiểu hỏi chuyện ("mình yếu nghe…") thì bỏ qua hư từ, và chế độ
 *      `loose` nhận cả mục khớp một phần — dùng để lọc danh sách gửi AI.
 */
import { fold, foldPhrase, tokenize, tokenizeRaw } from './normalize';
import type { SearchEntry, SearchKind } from './types';

// ---------------------------------------------------------------------------
// Đồng nghĩa và hư từ
// ---------------------------------------------------------------------------

/**
 * Cụm (đã bỏ dấu) → các cách nói khác. Đi hai chiều theo nghĩa: người gõ tiếng
 * Việt tìm ra mục tiếng Anh và ngược lại (mục nào cũng mang từ khoá cả hai thứ
 * tiếng, nên chiều Anh → Việt phần lớn đã tự khớp).
 */
export const SYNONYMS: Record<string, string[]> = {
  nghe: ['listening', 'dictation'],
  'nghe chep': ['dictation', 'listening'],
  'chinh ta': ['dictation'],
  'chep chinh ta': ['dictation'],
  doc: ['reading'],
  'doc hieu': ['reading'],
  viet: ['writing'],
  noi: ['speaking'],
  'phat am': ['pronunciation', 'shadowing'],
  'tu vung': ['vocabulary', 'vocab'],
  vocab: ['vocabulary', 'tu vung'],
  toan: ['math'],
  'ngu phap': ['grammar', 'conventions'],
  grammar: ['ngu phap', 'conventions'],
  dich: ['translation', 'translate'],
  'thi thu': ['mock', 'full test'],
  mock: ['thi thu'],
  'lo trinh': ['roadmap', 'path'],
  'ly thuyet': ['lesson', 'theory'],
  'ham so': ['function', 'functions'],
  'bac hai': ['quadratic', 'quadratics'],
  'bac nhat': ['linear'],
  'phuong trinh': ['equation', 'equations'],
  'bat phuong trinh': ['inequality', 'inequalities'],
  'he phuong trinh': ['systems', 'system'],
  'luy thua': ['exponent', 'exponents'],
  'so mu': ['exponent', 'exponential'],
  'hinh hoc': ['geometry'],
  'luong giac': ['trigonometry', 'trig'],
  'tam giac': ['triangle', 'triangles'],
  'duong tron': ['circle', 'circles'],
  'xac suat': ['probability'],
  'thong ke': ['statistics', 'data'],
  'phan tram': ['percent', 'percentages'],
  'ti le': ['ratio', 'ratios', 'proportion'],
  'ty le': ['ratio', 'ratios', 'proportion'],
  'dien tich': ['area'],
  'the tich': ['volume'],
  'moi truong': ['environment'],
  environment: ['moi truong'],
  'cong nghe': ['technology'],
  'giao duc': ['education'],
  'suc khoe': ['health'],
  'khoa hoc': ['science'],
  'kinh doanh': ['business'],
  'kinh te': ['economy', 'economics'],
  'xa hoi': ['society'],
  'van hoa': ['culture'],
  'lich su': ['history'],
  'tam ly': ['psychology'],
  'van hoc': ['literature'],
  'du lich': ['travel'],
  'gia dinh': ['family'],
  'cong viec': ['work', 'career'],
  'bieu do': ['chart', 'graph'],
  'tu noi': ['transitions', 'transition'],
  'dai tu': ['pronoun', 'pronouns'],
  'dien tu': ['gap fill', 'completion'],
  'dien so': ['numbers', 'dictation'],
  'luyen noi': ['speaking'],
  essay: ['bai luan', 'task 2'],
};

/** Từ đệm của câu hỏi tự nhiên — không bắt buộc phải khớp. */
const STOPWORDS = new Set([
  // Việt (đã bỏ dấu)
  'minh', 'toi', 'em', 'muon', 'can', 'hoc', 'luyen', 've', 'cho', 'de', 'cac', 'nhung', 'bai', 'la', 'va', 'co',
  'khong', 'lam', 'sao', 'the', 'nao', 'gi', 'phan', 'yeu', 'kem', 'gioi', 'hon', 'tu', 'den', 'len', 'nen', 'mot',
  'nhieu', 'it', 'rat', 'qua', 'hay', 'thi', 'o', 'tai', 'voi', 'dang', 'da', 'se', 'chu', 'de', 'tim', 'giup', 'chi',
  'cach', 'nang', 'cao', 'dat', 'thien', 'cai',
  // Anh
  'how', 'to', 'the', 'a', 'an', 'i', 'my', 'me', 'want', 'improve', 'practice', 'practise', 'from', 'for', 'of', 'in',
  'on', 'and', 'or', 'is', 'am', 'are', 'with', 'about', 'get', 'need', 'help', 'better', 'some', 'what', 'which',
]);

// ---------------------------------------------------------------------------
// Chỉ mục đã tách từ (dựng một lần cho mỗi danh sách mục)
// ---------------------------------------------------------------------------

type Indexed = {
  entry: SearchEntry;
  title: string[];
  kw: string[];
  sub: string[];
  /** Tiêu đề đã bỏ dấu, cả hai thứ tiếng, để cộng điểm khớp cả cụm. */
  titlePhrases: string[];
  /** Mọi từ GIỮ DẤU của mục — để "nghe" gõ có dấu không ăn điểm đầy đủ ở "công nghệ". */
  raw: string[];
};

const indexCache = new WeakMap<readonly SearchEntry[], Indexed[]>();

function indexOf(entries: readonly SearchEntry[]): Indexed[] {
  const hit = indexCache.get(entries);
  if (hit) return hit;
  const built = entries.map((entry) => ({
    entry,
    title: unique([...tokenize(entry.title.vi), ...tokenize(entry.title.en)]),
    // Trình độ ("Band 6", "B2") cũng là từ khoá: "task 2 band 6" phải khớp được đề Band 6.
    kw: unique([...entry.keywords, entry.level ?? ''].flatMap(tokenize)),
    sub: unique(entry.subtitle ? [...tokenize(entry.subtitle.vi), ...tokenize(entry.subtitle.en)] : []),
    titlePhrases: unique([foldPhrase(entry.title.vi), foldPhrase(entry.title.en)]),
    raw: unique(
      [entry.title.vi, entry.title.en, entry.subtitle?.vi ?? '', entry.subtitle?.en ?? '', ...entry.keywords].flatMap(
        tokenizeRaw,
      ),
    ),
  }));
  indexCache.set(entries, built);
  return built;
}

function unique(list: string[]): string[] {
  return [...new Set(list)];
}

// ---------------------------------------------------------------------------
// Dựng nhóm từ câu tìm
// ---------------------------------------------------------------------------

export type QueryGroup = {
  /** Mỗi phần tử là MỘT cách nói; cách nói khớp khi mọi từ của nó khớp. */
  alts: string[][];
  /** Số cách nói đầu tiên là lời gốc của người học (không phải đồng nghĩa). */
  original: number;
  /** Hư từ: không bắt buộc khớp. */
  optional: boolean;
  /** Lời gốc GIỮ DẤU, cùng thứ tự với `alts[0]` (không có nếu tách lệch nhau). */
  raw?: string[];
};

const MAX_PHRASE = 3;

export function parseQuery(query: string): QueryGroup[] {
  const tokens = tokenize(query);
  const rawTokens = tokenizeRaw(query);
  const rawAt = (from: number, len: number) =>
    rawTokens.length === tokens.length ? rawTokens.slice(from, from + len) : undefined;
  const groups: QueryGroup[] = [];
  let i = 0;
  while (i < tokens.length) {
    let matched = false;
    for (let len = Math.min(MAX_PHRASE, tokens.length - i); len >= 2; len--) {
      const phrase = tokens.slice(i, i + len).join(' ');
      const syn = SYNONYMS[phrase];
      if (syn) {
        groups.push({
          alts: [tokens.slice(i, i + len), ...syn.map(tokenize)],
          original: 1,
          optional: false,
          raw: rawAt(i, len),
        });
        i += len;
        matched = true;
        break;
      }
    }
    if (matched) continue;
    const token = tokens[i]!;
    const syn = SYNONYMS[token] ?? [];
    groups.push({
      alts: [[token], ...syn.map(tokenize)],
      original: 1,
      optional: STOPWORDS.has(token) && syn.length === 0,
      raw: rawAt(i, 1),
    });
    i += 1;
  }
  // Toàn hư từ ("bài đọc" → "bai" + "doc" thì vẫn còn "doc"; nhưng "học gì") thì
  // đừng bỏ hết — coi tất cả là bắt buộc.
  if (groups.length > 0 && groups.every((g) => g.optional)) for (const g of groups) g.optional = false;
  return groups;
}

// ---------------------------------------------------------------------------
// Chấm điểm
// ---------------------------------------------------------------------------

const WEIGHT = { title: 10, kw: 6, sub: 3 } as const;
const SYNONYM_FACTOR = 0.75;
/** Người gõ CÓ dấu mà mục chỉ khớp khi bỏ dấu ("nghe" ↔ "nghệ"): vẫn nhận, nhưng xếp sau. */
const ACCENT_MISS_FACTOR = 0.45;

/**
 * Cộng nhẹ theo loại khi điểm sát nhau: một trang / bài học tổng quát thường là
 * chỗ người tìm muốn tới hơn là một bài đọc lẻ trùng chữ.
 */
const KIND_PRIOR: Partial<Record<SearchKind, number>> = {
  page: 2,
  path: 1.5,
  lesson: 1.5,
  practice: 1,
  vocab: 1,
  test: 1,
};

/** 1 nếu trùng hẳn, 0,7 nếu là đầu của một từ, 0 nếu không. Số thì phải trùng hẳn. */
function tokenHit(q: string, list: readonly string[]): number {
  let best = 0;
  const numeric = /^\p{N}+$/u.test(q);
  for (const t of list) {
    if (t === q) return 1;
    if (!numeric && q.length >= 2 && t.startsWith(q)) best = 0.7;
  }
  return best;
}

function tokenScore(q: string, ix: Indexed): number {
  return Math.max(
    WEIGHT.title * tokenHit(q, ix.title),
    WEIGHT.kw * tokenHit(q, ix.kw),
    WEIGHT.sub * tokenHit(q, ix.sub),
  );
}

function groupScore(group: QueryGroup, ix: Indexed): number {
  let best = 0;
  group.alts.forEach((alt, at) => {
    if (alt.length === 0) return;
    let sum = 0;
    for (let k = 0; k < alt.length; k++) {
      const q = alt[k]!;
      let s = tokenScore(q, ix);
      if (s === 0) return;
      const raw = at === 0 ? group.raw?.[k] : undefined;
      if (raw && raw !== q && !ix.raw.some((t) => t.startsWith(raw))) {
        s *= ACCENT_MISS_FACTOR;
      }
      sum += s;
    }
    const score = (sum / alt.length) * (at < group.original ? 1 : SYNONYM_FACTOR);
    if (score > best) best = score;
  });
  return best;
}

export type SearchHit = { entry: SearchEntry; score: number; coverage: number };

export type SearchOptions = {
  limit?: number;
  /** `strict` (mặc định): mọi ý bắt buộc phải khớp. `loose`: nhận khớp một phần. */
  mode?: 'strict' | 'loose';
  kinds?: readonly SearchKind[];
};

export function searchEntries(
  query: string,
  entries: readonly SearchEntry[],
  options: SearchOptions = {},
): SearchHit[] {
  const { limit = 40, mode = 'strict', kinds } = options;
  const groups = parseQuery(query);
  if (groups.length === 0) return [];
  const required = groups.filter((g) => !g.optional);
  const whole = foldPhrase(query);

  const hits: SearchHit[] = [];
  for (const ix of indexOf(entries)) {
    if (kinds && !kinds.includes(ix.entry.kind)) continue;
    let score = 0;
    let matched = 0;
    for (const g of groups) {
      const s = groupScore(g, ix);
      if (s > 0) {
        score += g.optional ? s * 0.3 : s;
        if (!g.optional) matched += 1;
      }
    }
    if (matched === 0) continue;
    const coverage = required.length === 0 ? 1 : matched / required.length;
    if (whole.length >= 3) {
      for (const p of ix.titlePhrases) {
        if (p === whole) score += 20;
        else if (p.startsWith(whole) || p.includes(` ${whole}`)) score += 12;
        else continue;
        break;
      }
    }
    // Bài trong Lộ trình học (`lp:`) chỉ là lối vào nội dung đã có trong chỉ mục,
    // nên không được cộng điểm loại — kẻo chúng đè lên chính nội dung gốc.
    score += ix.entry.id.startsWith('lp:') ? 0 : (KIND_PRIOR[ix.entry.kind] ?? 0);
    hits.push({ entry: ix.entry, score: score * coverage * coverage, coverage });
  }

  const full = hits.filter((h) => h.coverage === 1);
  const pool = mode === 'strict' ? (full.length > 0 ? full : hits.filter((h) => h.coverage >= 0.5)) : hits;
  return pool
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.entry.title.vi.length - b.entry.title.vi.length ||
        a.entry.id.localeCompare(b.entry.id),
    )
    .slice(0, limit);
}

/** Gom kết quả theo loại, giữ thứ tự điểm trong từng nhóm; nhóm xếp theo điểm cao nhất. */
export function groupHits(hits: readonly SearchHit[], perGroup = 5): { kind: SearchKind; hits: SearchHit[] }[] {
  const map = new Map<SearchKind, SearchHit[]>();
  for (const h of hits) {
    const list = map.get(h.entry.kind) ?? [];
    if (list.length < perGroup) list.push(h);
    map.set(h.entry.kind, list);
  }
  return [...map.entries()]
    .map(([kind, list]) => ({ kind, hits: list }))
    .sort((a, b) => (b.hits[0]?.score ?? 0) - (a.hits[0]?.score ?? 0));
}

/** Có ít nhất một chữ cái/chữ số để tìm. */
export function isSearchable(query: string): boolean {
  return /[\p{L}\p{N}]/u.test(fold(query));
}
