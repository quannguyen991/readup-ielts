/**
 * ĐỌC THEO (shadowing) — so câu người học đọc to với câu gốc, từng từ một.
 *
 * Máy nhận giọng của trình duyệt trả về MỘT CHUỖI CHỮ nó nghe được. Việc ở đây
 * là xếp chuỗi ấy thẳng hàng với câu gốc (quy hoạch động kiểu LCS có trọng số)
 * rồi tô từng từ của câu gốc:
 *
 *   hit   nghe ra đúng từ đó (hoặc một từ đồng âm — máy nghe "their" thay cho
 *         "there" không phải lỗi phát âm của người học)
 *   near  nghe ra một từ gần giống (lệch một chữ, thiếu đuôi -s/-ed): có thể
 *         là nuốt âm cuối, tính nửa điểm
 *   miss  không nghe ra gì khớp
 *   skip  TÊN RIÊNG không nghe ra (Rohullah, Kyiv…): bộ nhận giọng hay viết
 *         sai tên hiếm dù người học đọc đúng, nên không tính vào điểm
 *
 * Tất cả là luật — không gọi AI nào.
 */

export type WordMark = 'hit' | 'near' | 'miss' | 'skip' | 'pending';

export type Token = {
  /** Chữ đúng như trong câu (để hiển thị). */
  text: string;
  /** Dạng đã chuẩn hoá để so. */
  norm: string;
  /** Vị trí ký tự trong câu — để khớp với sự kiện "đang đọc tới chữ thứ n" của giọng máy. */
  start: number;
  end: number;
  /** Viết hoa giữa câu (không phải từ đầu câu, không phải "I") — coi là tên riêng. */
  proper: boolean;
};

const SMALL_NUMBERS = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty',
];

/** Nhóm đồng âm: máy nghe ra từ nào trong nhóm cũng coi như đúng. */
const HOMOPHONES: readonly string[][] = [
  ['there', 'their', 'theyre'],
  ['to', 'too', 'two'],
  ['for', 'four', 'fore'],
  ['no', 'know'],
  ['new', 'knew'],
  ['right', 'write', 'rite'],
  ['hear', 'here'],
  ['your', 'youre'],
  ['by', 'buy', 'bye'],
  ['one', 'won'],
  ['see', 'sea'],
  ['be', 'bee'],
  ['weather', 'whether'],
  ['week', 'weak'],
  ['which', 'witch'],
  ['our', 'hour'],
  ['would', 'wood'],
  ['made', 'maid'],
  ['peace', 'piece'],
  ['plane', 'plain'],
  ['whole', 'hole'],
  ['meet', 'meat'],
  ['road', 'rode'],
  ['sun', 'son'],
  ['eight', 'ate'],
  ['flour', 'flower'],
  ['allowed', 'aloud'],
  ['passed', 'past'],
  ['than', 'then'],
  ['okay', 'ok'],
];

const HOMOPHONE_OF = new Map<string, number>();
HOMOPHONES.forEach((group, i) => group.forEach((w) => HOMOPHONE_OF.set(w, i)));

/** Chữ thường, bỏ dấu nháy (don't → dont), số nhỏ đổi ra chữ (5 → five). */
export function normWord(raw: string): string {
  const w = raw.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[’']/g, '');
  if (/^\d+$/.test(w)) {
    const n = Number(w);
    return n <= 20 ? SMALL_NUMBERS[n]! : String(n);
  }
  return w.replace(/[^a-z0-9]/g, '');
}

/** Tách câu thành từ (gạch nối tách đôi: well-known → well, known — máy nghe cũng trả hai từ). */
export function tokenize(sentence: string): Token[] {
  const out: Token[] = [];
  const re = /[A-Za-z0-9À-ɏ]+(?:['’][A-Za-z]+)*/g;
  for (let m = re.exec(sentence); m; m = re.exec(sentence)) {
    const norm = normWord(m[0]);
    if (!norm) continue;
    const before = sentence.slice(0, m.index).trimEnd();
    const sentenceStart = before === '' || /[.!?:"“]$/.test(before);
    const proper = /^[A-Z]/.test(m[0]) && !sentenceStart && m[0] !== 'I' && !/^I['’]/.test(m[0]);
    out.push({ text: m[0], norm, start: m.index, end: m.index + m[0].length, proper });
  }
  // Đầu câu thì không nhìn chữ hoa mà biết tên riêng được — trừ khi ngay sau nó là
  // một tên riêng nữa ("Andrew Smith wrote…") và nó không phải từ chức năng ("The United…").
  out.forEach((t, i) => {
    const next = out[i + 1];
    if (!t.proper && next?.proper && /^[A-Z]/.test(t.text) && !FUNCTION_WORDS.has(t.norm)) t.proper = true;
  });
  return out;
}

const FUNCTION_WORDS = new Set(
  'the a an in on at of to for from by with as and but or so if when while after before this that these those it he she we they you i my our his her their its your there here what why how where who which many some most all every each one no not last next during since until'.split(
    ' ',
  ),
);

/** Chuẩn hoá chuỗi máy nghe được trước khi tách từ: 5% → 5 percent, $3 → 3 dollars, & → and. */
export function heardWords(heard: string): string[] {
  const text = heard
    .replace(/\$(\d[\d,]*)/g, '$1 dollars')
    .replace(/(\d)%/g, '$1 percent')
    .replace(/&/g, ' and ')
    .replace(/(\d),(\d)/g, '$1$2');
  return tokenize(text).map((t) => t.norm);
}

/** Khoảng cách sửa chữ Damerau (có tính đổi chỗ hai chữ liền nhau). */
function editDistance(a: string, b: string): number {
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j += 1) d[0]![j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(d[i - 1]![j]! + 1, d[i]![j - 1]! + 1, d[i - 1]![j - 1]! + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, d[i - 2]![j - 2]! + 1);
      d[i]![j] = v;
    }
  }
  return d[a.length]![b.length]!;
}

/** 1 = khớp, 0.5 = gần giống, 0 = khác hẳn. */
export function similarity(target: string, heard: string): number {
  if (target === heard) return 1;
  const g = HOMOPHONE_OF.get(target);
  if (g !== undefined && g === HOMOPHONE_OF.get(heard)) return 1;
  const short = Math.min(target.length, heard.length);
  if (short < 3) return 0;
  // Nuốt âm cuối: walk ↔ walked, cat ↔ cats.
  const [a, b] = target.length <= heard.length ? [target, heard] : [heard, target];
  if (b.startsWith(a) && b.length - a.length <= 2) return 0.5;
  const dist = editDistance(target, heard);
  if (dist <= 1 || (short >= 7 && dist <= 2)) return 0.5;
  return 0;
}

export type Alignment = { marks: WordMark[]; score: number; hits: number; nears: number; /** Số từ tính điểm (trừ tên riêng máy không nghe ra). */ counted: number };

/**
 * Xếp thẳng hàng câu gốc với các từ nghe được. `final = false` là đang nghe dở
 * (kết quả tạm): từ chưa khớp để `pending` chứ chưa tô đỏ.
 */
export function alignWords(target: readonly Token[], heard: readonly string[], final = true): Alignment {
  const n = target.length;
  const m = heard.length;
  const best: number[][] = Array.from({ length: n + 1 }, () => Array<number>(m + 1).fill(0));
  for (let i = 1; i <= n; i += 1) {
    for (let j = 1; j <= m; j += 1) {
      const s = similarity(target[i - 1]!.norm, heard[j - 1]!);
      best[i]![j] = Math.max(best[i - 1]![j]!, best[i]![j - 1]!, s > 0 ? best[i - 1]![j - 1]! + s : 0);
    }
  }
  const marks: WordMark[] = Array<WordMark>(n).fill(final ? 'miss' : 'pending');
  for (let i = n, j = m; i > 0 && j > 0; ) {
    const s = similarity(target[i - 1]!.norm, heard[j - 1]!);
    if (s > 0 && best[i]![j] === best[i - 1]![j - 1]! + s) {
      marks[i - 1] = s === 1 ? 'hit' : 'near';
      i -= 1;
      j -= 1;
    } else if (best[i - 1]![j] === best[i]![j]) i -= 1;
    else j -= 1;
  }
  if (final) target.forEach((t, i) => marks[i] === 'miss' && t.proper && (marks[i] = 'skip'));
  const hits = marks.filter((x) => x === 'hit').length;
  const nears = marks.filter((x) => x === 'near').length;
  const counted = n - marks.filter((x) => x === 'skip').length;
  const score = counted === 0 ? 0 : Math.round(((hits + nears * 0.5) / counted) * 100);
  return { marks, score, hits, nears, counted };
}

/** Đã đọc tới từ cuối của câu chưa — để tự dừng micro khi người học đọc xong. */
export function reachedEnd(marks: readonly WordMark[]): boolean {
  const heard = (m: WordMark | undefined) => m === 'hit' || m === 'near';
  const last = marks.length - 1;
  if (last < 0) return false;
  // Từ cuối hay là từ ngắn máy nuốt mất; câu dài thì khớp từ áp chót cũng tính là đọc xong.
  return heard(marks[last]) || (marks.length > 3 && heard(marks[last - 1]));
}

export function scoreBand(score: number): { label: string; tone: 'good' | 'ok' | 'low' } {
  if (score >= 85) return { label: 'Rất rõ', tone: 'good' };
  if (score >= 60) return { label: 'Khá rồi', tone: 'ok' };
  return { label: 'Đọc lại nhé', tone: 'low' };
}

/** Từ nào của sự kiện "giọng máy đang đọc tới ký tự thứ `charIndex`". */
export function wordAtChar(tokens: readonly Token[], charIndex: number): number {
  for (let i = tokens.length - 1; i >= 0; i -= 1) if (tokens[i]!.start <= charIndex) return i;
  return 0;
}

/** Viết tắt có dấu chấm không phải là hết câu: "Mr. Smith", "the U.S. government". */
const ABBREVIATION = /\b(?:Mr|Mrs|Ms|Dr|St|Jr|Sr|Prof|Gen|Gov|Sen|Rep|Lt|Col|No|vs|etc|U\.S|U\.K|U\.N|a\.m|p\.m)\.$/i;

/**
 * Tách một đoạn thành câu. Lời VOA chép từ trang web hay dính khoảng trắng
 * thừa trước dấu (`Teacher , we`, `knit. ” Besides`) — dọn trước rồi mới cắt,
 * không thì dấu đóng ngoặc bị lọt sang đầu câu sau.
 */
export function splitSentences(paragraph: string): string[] {
  const text = paragraph
    .replace(/\s+([”’,.;:!?])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
  const out: string[] = [];
  let from = 0;
  const re = /[.!?]["”’)]*\s+/g;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    const next = text[m.index + m[0].length] ?? '';
    // Sau dấu chấm mà là chữ thường thì chưa hết câu; viết tắt cũng vậy.
    if (!/[A-Z0-9"“‘([]/.test(next)) continue;
    if (ABBREVIATION.test(text.slice(from, m.index + 1))) continue;
    out.push(text.slice(from, m.index + m[0].trimEnd().length));
    from = m.index + m[0].length;
  }
  if (from < text.length) out.push(text.slice(from));
  // Dấu đóng ngoặc mồ côi ở đầu câu là rác của bản chép (`.” ”Soon they…`).
  return out.map((x) => x.replace(/^[”’]\s*/, '').trim()).filter(Boolean);
}

/**
 * Chọn câu để đọc theo từ lời bài VOA: bỏ câu quá ngắn (lời chào, tiêu đề) và
 * quá dài (khó giữ hơi, máy hay cắt giữa chừng).
 */
export function shadowSentences(paragraphs: readonly string[], minWords = 4, maxWords = 26): string[] {
  const out: string[] = [];
  for (const p of paragraphs) {
    for (const text of splitSentences(p)) {
      const n = tokenize(text).length;
      // Câu có email, đường dẫn thì không đọc theo được (learningenglish@voanews.com).
      if (/@|https?:|www\.|\.(?:com|org|gov|net)\b/i.test(text)) continue;
      if (n >= minWords && n <= maxWords && /[.!?"”’)]$/.test(text)) out.push(text);
    }
  }
  return out;
}

/**
 * Mã của một câu, tính từ CHÍNH NỘI DUNG câu (không phải số thứ tự): cách tách
 * câu mà đổi thì số thứ tự xô lệch, còn điểm đã lưu vẫn bám đúng câu của nó.
 */
export function sentenceKey(sentence: string): string {
  let h = 2166136261;
  const text = tokenize(sentence)
    .map((t) => t.norm)
    .join(' ');
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}
