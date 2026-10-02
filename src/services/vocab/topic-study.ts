/**
 * Logic học một bộ từ theo chủ đề — hàm thuần, để các màn Học, Nghe chép, Điền
 * câu, Kiểm tra và Trò chơi dùng chung một luật chấm và một cách chọn câu.
 *
 * Không có gì ở đây gọi mạng hay AI: câu hỏi dựng từ chính dữ liệu của bộ từ
 * (nghĩa, phiên âm, câu ví dụ, cụm từ đi kèm).
 */

export type StudyWord = {
  word: string;
  pos: string;
  ipa: string;
  meaningVi: string;
  definitionEn: string;
  example: string;
  collocation: string;
  band: string;
  /** Chỉ bộ có dữ liệu viết tay (SAT Verbal): từ đồng nghĩa, trái nghĩa. */
  synonyms?: string[];
  antonyms?: string[];
};

/** RNG gieo hạt — cùng hạt ra cùng thứ tự, để test tái lập được. */
export function seededRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffled<T>(items: readonly T[], rng: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/**
 * Chuẩn hoá câu trả lời gõ tay: bỏ hoa thường, khoảng trắng thừa, dấu câu ở
 * hai đầu, và thống nhất dấu nháy. "Habitat." và " habitat" là cùng một đáp án.
 */
export function normalizeAnswer(text: string): string {
  return text
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
}

export function isTypedCorrect(input: string, target: string): boolean {
  return normalizeAnswer(input).length > 0 && normalizeAnswer(input) === normalizeAnswer(target);
}

/**
 * So từng chữ cái để tô màu chỗ sai trong Nghe chép. Căn theo vị trí — đủ cho
 * một từ đơn; lỗi thường gặp là sai một hai chữ, không phải lệch cả từ.
 */
export function letterDiff(input: string, target: string): { ch: string; ok: boolean }[] {
  const a = input.trim().toLowerCase();
  const b = target.trim();
  return [...b].map((ch, i) => ({ ch, ok: a[i] === ch.toLowerCase() }));
}

/**
 * Bốn lựa chọn cho một câu trắc nghiệm: đáp án đúng + ba từ khác trong bộ.
 * Lọc trùng theo NỘI DUNG hiển thị — hai từ khác nhau có thể dịch ra cùng một
 * nghĩa tiếng Việt, và hai lựa chọn giống hệt nhau thì câu hỏi hỏng.
 */
export function makeChoices(
  target: StudyWord,
  pool: readonly StudyWord[],
  show: (w: StudyWord) => string,
  rng: () => number,
): { options: string[]; correctIndex: number } {
  const correct = show(target);
  const seen = new Set([normalizeAnswer(correct)]);
  const distractors: string[] = [];
  for (const w of shuffled(pool, rng)) {
    if (distractors.length === 3) break;
    const text = show(w);
    const key = normalizeAnswer(text);
    if (seen.has(key)) continue;
    seen.add(key);
    distractors.push(text);
  }
  const options = shuffled([correct, ...distractors], rng);
  return { options, correctIndex: options.indexOf(correct) };
}

/**
 * Khoét từ ra khỏi câu ví dụ để làm câu điền.
 *
 * Câu ví dụ hay dùng dạng CHIA của từ ("habitats", "adapted", "migrating"),
 * nên thử cả dạng gốc lẫn gốc bỏ đuôi -e/-y cộng một hậu tố. Tìm theo biên chữ
 * cái Unicode chứ không `\b` (xem ghi chú bộ nhớ: `\b` của JS không hiểu chữ
 * có dấu).
 */
export function clozeOf(example: string, word: string): { before: string; answer: string; after: string } | null {
  const w = word.trim().toLowerCase();
  if (!w || w.includes(' ')) {
    const i = example.toLowerCase().indexOf(w);
    if (!w || i < 0) return null;
    return { before: example.slice(0, i), answer: example.slice(i, i + w.length), after: example.slice(i + w.length) };
  }
  const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const stem = escape(w.replace(/(e|y)$/, ''));
  const last = escape(w.slice(-1));
  // CHỈ đuôi chia từ, không đuôi phái sinh: "negotiate" không được khớp
  // "negotiators" — đó là một từ khác, khoét nó ra là hỏi sai từ.
  const forms = [
    `${escape(w)}(?:s|es|d|ed|ing)?`,
    `${stem}(?:ies|ied|ing|ed|es)`,
    `${escape(w)}${last}(?:ed|ing)`,
  ].join('|');
  const re = new RegExp(`(?<![\\p{L}])(${forms})(?![\\p{L}])`, 'iu');
  const m = re.exec(example);
  if (!m) return null;
  return { before: example.slice(0, m.index), answer: m[0], after: example.slice(m.index + m[0].length) };
}

/**
 * Các dạng câu của màn Học, từ dễ tới khó:
 * - LẬT THẺ: gặp từ, lật xem mặt sau, tự đánh giá (chỉ là lần gặp đầu);
 * - TRẮC NGHIỆM: nhận ra đúng giữa bốn lựa chọn;
 * - ĐIỀN CHỖ TRỐNG (kiểu đề THPT): chọn từ đúng cho chỗ trống trong câu ví dụ;
 * - GÕ TỪ: chỉ thấy nghĩa (hoặc chỉ nghe), gõ ra từ tiếng Anh.
 * Lịch gặp lại từng từ nằm ở `learn-loop.ts`.
 */
export type StageKind = 'flash' | 'mcq' | 'fill' | 'type';
export const STAGE_ORDER: readonly StageKind[] = ['flash', 'mcq', 'fill', 'type'];

/** Hỏi theo chiều nào: thấy từ chọn nghĩa, thấy nghĩa ra từ, hay chỉ NGHE giọng đọc. */
export type Direction = 'enToVi' | 'viToEn' | 'listen';

export type LearnSettings = {
  directions: Direction[];
  starredOnly: boolean;
  unmasteredOnly: boolean;
  /** Theo thứ tự trong bộ (bộ đã xếp dễ trước khó) hay xáo trộn. */
  ordered: boolean;
  autoAdvance: boolean;
  kinds: StageKind[];
  /** Học xen kẽ: trộn các dạng câu, từ đã đúng cũng quay lại (vòng phân phối). Tắt thì mỗi từ đi tuần tự. */
  interleave: boolean;
  /** Gõ đúng một từ đồng nghĩa của từ cần học cũng tính đúng. */
  acceptSynonyms: boolean;
  /** Câu gõ từ có nút micro: nói từ thay vì gõ. */
  speakAnswer: boolean;
  /** Tự đọc to từ tiếng Anh mỗi khi nó hiện ra. */
  autoPronounce: boolean;
  /** Giọng người thật ưu tiên: Anh–Mỹ hay Anh–Anh. */
  accent: 'us' | 'uk';
  /** Giọng đọc: một giọng nữ hoặc một giọng nam tốt nhất của máy. */
  voiceGender: 'f' | 'm';
};

export const DEFAULT_LEARN_SETTINGS: LearnSettings = {
  directions: ['enToVi', 'viToEn'],
  starredOnly: false,
  unmasteredOnly: false,
  ordered: true,
  autoAdvance: false,
  kinds: ['flash', 'mcq', 'fill', 'type'],
  interleave: true,
  acceptSynonyms: false,
  speakAnswer: false,
  autoPronounce: true,
  accent: 'us',
  voiceGender: 'f',
};

/** Các phần đang bật, đúng thứ tự học. Không bật phần nào thì dùng mặc định — không để vòng rỗng. */
export function activeKinds(kinds: readonly StageKind[]): StageKind[] {
  const k = STAGE_ORDER.filter((x) => kinds.includes(x));
  return k.length > 0 ? k : [...DEFAULT_LEARN_SETTINGS.kinds];
}

/** Mức thuộc của một từ trong bộ: 0 chưa học, 1 đang học, 2 đã nhớ (xong một vòng không sai). */
export type WordStage = 0 | 1 | 2;

/** Lọc từ theo cài đặt: chỉ từ gắn sao, chỉ từ chưa thuộc. */
export function filterWords<W extends StudyWord>(
  words: readonly W[],
  s: Pick<LearnSettings, 'starredOnly' | 'unmasteredOnly'>,
  stageOf: (w: string) => WordStage,
  starred: ReadonlySet<string>,
): W[] {
  return words.filter((w) => (!s.starredOnly || starred.has(w.word)) && (!s.unmasteredOnly || stageOf(w.word) < 2));
}

/**
 * Chọn từ cho một vòng Học: ưu tiên từ chưa thuộc. Học hết rồi thì ôn lại từ
 * đầu. `rng` có mặt thì xáo trộn trước khi cắt vòng.
 */
export function pickRound<W extends StudyWord>(
  words: readonly W[],
  stageOf: (w: string) => WordStage,
  size = 10,
  rng?: () => number,
  lapsesOf: (w: string) => number = () => 0,
): W[] {
  const open = words.filter((w) => stageOf(w.word) < 2);
  const source = open.length > 0 ? open : words;
  const ordered = rng ? shuffled(source, rng) : [...source];
  // Từ hay sai lên trước; sort ổn định nên các từ bằng nhau giữ thứ tự cũ.
  return ordered.sort((a, b) => lapsesOf(b.word) - lapsesOf(a.word)).slice(0, size);
}

/**
 * Chiều hỏi cho một câu. Đổi theo từ và theo số câu đã qua, để một từ không
 * luôn bị hỏi cùng một chiều.
 *
 * Phần ĐIỀN TỪ luôn gõ ra từ tiếng Anh — gõ nghĩa tiếng Việt thì không chấm
 * công bằng được (một từ có nhiều cách dịch) — nên chiều "thấy từ tiếng Anh"
 * không dùng cho phần này; chỉ bật mỗi chiều đó thì điền từ hỏi bằng nghĩa.
 */
export function directionFor(word: string, step: number, dirs: readonly Direction[], kind: StageKind): Direction {
  const allowed = kind === 'type' ? dirs.filter((d) => d !== 'enToVi') : [...dirs];
  const list: Direction[] = allowed.length > 0 ? allowed : kind === 'type' ? ['viToEn'] : ['enToVi'];
  return list[(word.length + step) % list.length]!;
}

/**
 * Bốn lựa chọn cho câu ĐIỀN CHỖ TRỐNG kiểu đề THPT: đáp án + ba từ khác trong
 * bộ, ưu tiên CÙNG TỪ LOẠI — chỗ trống cần danh từ mà ba phương án kia là động
 * từ thì nhìn ngữ pháp là loại được, câu hỏi không còn đo từ vựng nữa.
 */
export function makeWordChoices(
  target: StudyWord,
  pool: readonly StudyWord[],
  rng: () => number,
): { options: string[]; correctIndex: number } {
  const others = pool.filter((w) => w.word !== target.word);
  const same = others.filter((w) => w.pos && w.pos === target.pos);
  const rest = others.filter((w) => !(w.pos && w.pos === target.pos));
  const seen = new Set([normalizeAnswer(target.word)]);
  const distractors: string[] = [];
  for (const w of [...shuffled(same, rng), ...shuffled(rest, rng)]) {
    if (distractors.length === 3) break;
    const key = normalizeAnswer(w.word);
    if (seen.has(key)) continue;
    seen.add(key);
    distractors.push(w.word);
  }
  const options = shuffled([target.word, ...distractors], rng);
  return { options, correctIndex: options.indexOf(target.word) };
}

/** Từ đồng nghĩa người học vừa gõ (khi bật "Chấp nhận từ đồng nghĩa"), hoặc null. */
export function synonymMatch(input: string, word: Pick<StudyWord, 'synonyms'>): string | null {
  const key = normalizeAnswer(input);
  if (!key) return null;
  return (word.synonyms ?? []).find((s) => normalizeAnswer(s) === key) ?? null;
}
