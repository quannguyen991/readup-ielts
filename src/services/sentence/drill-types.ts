/**
 * BA DẠNG BÀI MỚI dựng từ kho câu sẵn có (không gọi AI, đáp án tính bằng code):
 *   - SẮP XẾP TỪ: các từ của câu bị xáo, bấm lần lượt để ghép lại đúng thứ tự;
 *   - ĐIỀN TỪ: câu bị đục 1–2 từ nội dung, gõ lại từ còn thiếu;
 *   - TÌM LỖI SAI: một từ bị thay bằng từ dễ nhầm (their/there, than/then…), bấm đúng từ sai.
 */

export type DrillKind = 'scramble' | 'cloze' | 'spot';

/** Bộ sinh số giả ngẫu nhiên có hạt giống, để cùng một câu luôn ra cùng một đề. */
export function rng(seed: number): () => number {
  let s = (seed >>> 0) || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function hashText(t: string): number {
  let h = 2166136261;
  for (let i = 0; i < t.length; i += 1) h = Math.imul(h ^ t.charCodeAt(i), 16777619) >>> 0;
  return h;
}

const strip = (w: string) => w.toLowerCase().replace(/[^a-z0-9'’-]/g, '');

// ------------------------------------------------------------------ sắp xếp từ

export type Scramble = { tokens: string[]; order: number[] };

/** `tokens` là từ theo thứ tự đúng; `order` là thứ tự xáo (chỉ số vào `tokens`), luôn khác thứ tự đúng. */
export function buildScramble(en: string, seed = hashText(en)): Scramble {
  const tokens = en.trim().split(/\s+/).filter(Boolean);
  const order = tokens.map((_, i) => i);
  if (tokens.length < 2) return { tokens, order };
  const r = rng(seed);
  for (let tries = 0; tries < 8; tries += 1) {
    for (let i = order.length - 1; i > 0; i -= 1) {
      const j = Math.floor(r() * (i + 1));
      [order[i], order[j]] = [order[j]!, order[i]!];
    }
    if (order.some((v, i) => strip(tokens[v]!) !== strip(tokens[i]!))) break;
  }
  return { tokens, order };
}

/** Đúng khi chuỗi từ người học ghép ra trùng câu gốc (bỏ qua hoa/thường và dấu câu). */
export function checkScramble(tokens: readonly string[], picked: readonly number[]): boolean {
  if (picked.length !== tokens.length) return false;
  return picked.every((v, i) => strip(tokens[v]!) === strip(tokens[i]!));
}

// -------------------------------------------------------------------- điền từ

const STOP = new Set(
  'about after again also always because before being between could doing during every first from have having into just more most much never other should since still than that their them then there these they this those through under until very want were what when where which while whose will with would your'.split(' '),
);

export type Cloze = { parts: { text: string; blank?: number }[]; answers: string[] };

/** Đục 1 từ (câu < 10 từ) hoặc 2 từ (câu dài hơn): từ nội dung dài ≥ 5 chữ, không phải từ đầu câu. */
export function buildCloze(en: string, seed = hashText(en)): Cloze | null {
  const raw = en.trim().split(/\s+/);
  const cand: number[] = [];
  raw.forEach((w, i) => {
    const core = w.replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, '');
    if (i > 0 && core.length >= 5 && /^[a-z]+$/.test(core) && !STOP.has(core)) cand.push(i);
  });
  if (cand.length === 0) return null;
  const want = raw.length >= 10 && cand.length >= 4 ? 2 : 1;
  const r = rng(seed);
  const chosen: number[] = [];
  const pool = [...cand];
  while (chosen.length < want && pool.length) {
    const k = Math.floor(r() * pool.length);
    const pick = pool.splice(k, 1)[0]!;
    if (chosen.every((c) => Math.abs(c - pick) > 1)) chosen.push(pick);
  }
  chosen.sort((a, b) => a - b);
  const answers: string[] = [];
  const parts: Cloze['parts'] = [];
  let buf = '';
  raw.forEach((w, i) => {
    const at = chosen.indexOf(i);
    if (at < 0) {
      buf += (buf ? ' ' : '') + w;
      return;
    }
    const m = /^([^A-Za-z]*)([A-Za-z]+)([^A-Za-z]*)$/.exec(w)!;
    parts.push({ text: buf + (buf ? ' ' : '') + m[1] });
    parts.push({ text: '', blank: answers.length });
    answers.push(m[2]!);
    buf = m[3]!;
  });
  parts.push({ text: buf ? buf : '' });
  return { parts, answers };
}

export function checkCloze(answers: readonly string[], typed: readonly string[]): boolean[] {
  return answers.map((a, i) => strip(typed[i] ?? '') === strip(a));
}

// ---------------------------------------------------------------- tìm lỗi sai

/** Cặp từ người học hay nhầm: thay một từ bằng từ kia thì câu sai. */
const CONFUSABLE: Record<string, { to: string; why: string }> = {
  their: { to: 'there', why: 'their = của họ; there = ở đó / có.' },
  there: { to: 'their', why: 'there = ở đó / có; their = của họ.' },
  than: { to: 'then', why: 'than dùng để so sánh; then = sau đó.' },
  then: { to: 'than', why: 'then = sau đó; than dùng để so sánh.' },
  its: { to: "it's", why: "its = của nó; it's = it is." },
  affect: { to: 'effect', why: 'affect là động từ (ảnh hưởng); effect là danh từ (tác động).' },
  effect: { to: 'affect', why: 'effect là danh từ (tác động); affect là động từ (ảnh hưởng).' },
  quite: { to: 'quiet', why: 'quite = khá; quiet = yên tĩnh.' },
  weather: { to: 'whether', why: 'weather = thời tiết; whether = liệu có.' },
  whether: { to: 'weather', why: 'whether = liệu có; weather = thời tiết.' },
  lose: { to: 'loose', why: 'lose = mất; loose = lỏng.' },
  advice: { to: 'advise', why: 'advice là danh từ (lời khuyên); advise là động từ.' },
  breath: { to: 'breathe', why: 'breath là danh từ (hơi thở); breathe là động từ (thở).' },
  fewer: { to: 'less', why: 'fewer đi với danh từ đếm được.' },
  many: { to: 'much', why: 'many đi với danh từ đếm được số nhiều.' },
  much: { to: 'many', why: 'much đi với danh từ không đếm được.' },
  was: { to: 'were', why: 'chủ ngữ số ít dùng was.' },
  were: { to: 'was', why: 'chủ ngữ số nhiều dùng were.' },
  has: { to: 'have', why: 'chủ ngữ ngôi ba số ít dùng has.' },
  have: { to: 'has', why: 'chủ ngữ số nhiều / I / you dùng have.' },
  an: { to: 'a', why: 'an đứng trước nguyên âm; a đứng trước phụ âm.' },
};

export type Spot = { words: string[]; wrongIndex: number; original: string; why: string };

/**
 * Chọn một từ trong câu có trong bảng nhầm lẫn và thay bằng từ kia. Trả `null` nếu câu không có
 * từ nào thay được mà vẫn chắc chắn là sai (vd "was/were", "has/have" chỉ dùng khi đứng sau chủ ngữ rõ ràng).
 */
export function buildSpot(en: string, seed = hashText(en)): Spot | null {
  const words = en.trim().split(/\s+/);
  const cand: number[] = [];
  words.forEach((w, i) => {
    const core = strip(w);
    const rule = CONFUSABLE[core];
    if (!rule) return;
    // Thế was↔were, has↔have, a↔an, many↔much chỉ chắc chắn sai khi hợp với chủ ngữ — bỏ qua cho an toàn.
    if (['was', 'were', 'has', 'have', 'an', 'many', 'much', 'fewer'].includes(core)) return;
    cand.push(i);
  });
  if (cand.length === 0) return null;
  const idx = cand[Math.floor(rng(seed)() * cand.length)]!;
  const w = words[idx]!;
  const m = /^([^A-Za-z']*)([A-Za-z']+)([^A-Za-z']*)$/.exec(w);
  if (!m) return null;
  const rule = CONFUSABLE[m[2]!.toLowerCase()]!;
  const repl = /^[A-Z]/.test(m[2]!) ? rule.to[0]!.toUpperCase() + rule.to.slice(1) : rule.to;
  const out = [...words];
  out[idx] = m[1]! + repl + m[3]!;
  return { words: out, wrongIndex: idx, original: w, why: rule.why };
}
