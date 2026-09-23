/**
 * Phân tích VÌ SAO một câu trả lời sai — gọi đúng tên lỗi thay vì chỉ báo "sai".
 *
 * Chạy bằng luật trên chính chữ người học gõ, không gọi mô hình AI nào: so
 * chuỗi gõ với đáp án bằng khoảng cách chỉnh sửa (có tính đổi chỗ hai chữ liền
 * nhau), rồi xếp lỗi vào những kiểu người Việt học tiếng Anh hay mắc:
 *
 * - nhầm sang MỘT TỪ KHÁC trong cùng bộ (lỗi nghĩa, không phải chính tả);
 * - đúng từ nhưng sai DẠNG (thêm/thiếu -s, -ed, -ing);
 * - thiếu hoặc thừa PHỤ ÂM ĐÔI (accommodate, occurrence);
 * - lẫn cặp đuôi dễ nhầm (-ance/-ence, -able/-ible, -ise/-ize, -er/-or…);
 * - ĐẢO hai chữ liền nhau, THIẾU / THỪA / SAI một chữ;
 * - khác hẳn — chưa nhớ từ này.
 */

export type MistakeKind =
  | 'blank'
  | 'other_word'
  | 'inflection'
  | 'double_letter'
  | 'suffix'
  | 'transposition'
  | 'missing_letter'
  | 'extra_letter'
  | 'wrong_letter'
  | 'spelling'
  | 'unknown';

export type Mistake = {
  kind: MistakeKind;
  /** Tên lỗi ngắn, tiếng Việt. */
  title: string;
  /** Giải thích cụ thể cho đúng câu này. */
  detail: string;
};

export const MISTAKE_TITLE: Record<MistakeKind, string> = {
  blank: 'Bỏ trống',
  other_word: 'Nhầm sang từ khác',
  inflection: 'Sai dạng của từ',
  double_letter: 'Phụ âm đôi',
  suffix: 'Nhầm đuôi từ',
  transposition: 'Đảo chữ',
  missing_letter: 'Thiếu chữ',
  extra_letter: 'Thừa chữ',
  wrong_letter: 'Sai một chữ',
  spelling: 'Sai chính tả',
  unknown: 'Chưa nhớ từ',
};

const clean = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

/** Khoảng cách Damerau–Levenshtein (bản đổi chỗ liền kề). */
export function editDistance(a: string, b: string): number {
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j += 1) d[0]![j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i]![j] = Math.min(d[i - 1]![j]! + 1, d[i]![j - 1]! + 1, d[i - 1]![j - 1]! + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i]![j] = Math.min(d[i]![j]!, d[i - 2]![j - 2]! + 1);
      }
    }
  }
  return d[a.length]![b.length]!;
}

const SUFFIX_PAIRS: [string, string][] = [
  ['ance', 'ence'],
  ['ant', 'ent'],
  ['able', 'ible'],
  ['ise', 'ize'],
  ['isation', 'ization'],
  ['er', 'or'],
  ['ary', 'ery'],
  ['ery', 'ory'],
  ['ous', 'us'],
  ['tion', 'sion'],
  ['cy', 'sy'],
  ['ly', 'ley'],
];

/** Bỏ một chữ ở vị trí i. */
const drop = (s: string, i: number) => s.slice(0, i) + s.slice(i + 1);

/**
 * Phân tích một câu gõ sai. Trả null nếu thật ra là đúng (khác mỗi hoa thường
 * hoặc khoảng trắng). `others` là các từ khác trong bộ kèm nghĩa, để nhận ra
 * trường hợp nhầm sang từ khác.
 */
export function diagnoseTyped(
  input: string,
  target: string,
  others: readonly { word: string; meaningVi: string }[] = [],
): Mistake | null {
  const a = clean(input);
  const t = clean(target);
  const make = (kind: MistakeKind, detail: string): Mistake => ({ kind, title: MISTAKE_TITLE[kind], detail });

  if (a === t) return null;
  if (!a) return make('blank', `Đáp án là “${target}”.`);

  // 1. Nhầm sang một từ khác trong bộ — lỗi NGHĨA, chữa bằng cách phân biệt hai từ.
  const other = others.find((o) => clean(o.word) === a && clean(o.word) !== t);
  if (other) {
    return make('other_word', `“${other.word}” nghĩa là “${other.meaningVi}”. Từ cần tìm là “${target}”.`);
  }

  // 2. Đúng từ, sai dạng: habitats ↔ habitat, migrated ↔ migrate.
  const formsOf = (w: string) => {
    const base = w.replace(/e$/, '');
    const y = w.replace(/y$/, 'i');
    return new Set([`${w}s`, `${w}es`, `${w}d`, `${w}ed`, `${w}ing`, `${base}ing`, `${base}ed`, `${y}es`, `${y}ed`]);
  };
  if (formsOf(t).has(a) || formsOf(a).has(t)) {
    return make('inflection', `Bạn viết đúng gốc từ nhưng thêm/bớt đuôi. Dạng cần điền là “${target}”.`);
  }

  // 3. Phụ âm đôi: thiếu một chữ lặp, hoặc gấp đôi thừa.
  for (let i = 1; i < t.length; i += 1) {
    if (t[i] === t[i - 1] && drop(t, i) === a) {
      return make('double_letter', `Thiếu một chữ “${t[i]}”: “${target}” có phụ âm đôi “${t[i]}${t[i]}”.`);
    }
  }
  for (let i = 1; i < a.length; i += 1) {
    if (a[i] === a[i - 1] && drop(a, i) === t) {
      return make('double_letter', `Thừa một chữ “${a[i]}”: “${target}” chỉ có một “${a[i]}” ở chỗ đó.`);
    }
  }

  // 4. Cặp đuôi dễ nhầm.
  for (const [x, y] of SUFFIX_PAIRS) {
    for (const [from, to] of [
      [x, y],
      [y, x],
    ] as const) {
      if (t.endsWith(to) && a.endsWith(from) && a.slice(0, -from.length) === t.slice(0, -to.length)) {
        return make('suffix', `Đuôi của từ này là “-${to}”, không phải “-${from}”.`);
      }
    }
  }

  const dist = editDistance(a, t);
  if (dist === 1) {
    if (a.length === t.length) {
      for (let i = 0; i + 1 < t.length; i += 1) {
        if (a[i] === t[i + 1] && a[i + 1] === t[i] && a[i] !== t[i]) {
          return make('transposition', `Bạn đảo chỗ hai chữ “${t[i]}${t[i + 1]}” thành “${a[i]}${a[i + 1]}”.`);
        }
      }
      const i = [...t].findIndex((ch, k) => ch !== a[k]);
      return make('wrong_letter', `Chữ thứ ${i + 1} là “${t[i]}”, bạn gõ “${a[i]}”.`);
    }
    if (a.length < t.length) {
      const i = [...t].findIndex((ch, k) => ch !== a[k]);
      const at = i < 0 ? t.length - 1 : i;
      return make('missing_letter', `Thiếu chữ “${t[at]}” ở vị trí thứ ${at + 1}.`);
    }
    const i = [...a].findIndex((ch, k) => ch !== t[k]);
    const at = i < 0 ? a.length - 1 : i;
    return make('extra_letter', `Thừa chữ “${a[at]}” ở vị trí thứ ${at + 1}.`);
  }

  // Sai vài chữ nhưng vẫn gần: đã nhớ từ, chưa nhớ cách viết.
  if (dist <= Math.max(2, Math.floor(t.length / 4))) {
    return make('spelling', `Gần đúng rồi — sai ${dist} chữ. Nhìn kỹ cách viết: “${target}”.`);
  }
  return make('unknown', `Câu trả lời khác xa “${target}” — từ này cần học lại từ đầu.`);
}

/**
 * Phân tích một lựa chọn trắc nghiệm sai: người học chọn phương án của từ
 * nào, và từ đó nghĩa là gì — để thấy mình đang lẫn hai từ nào với nhau.
 */
export function diagnosePick(
  pickedText: string,
  target: { word: string; meaningVi: string },
  pool: readonly { word: string; meaningVi: string }[],
): Mistake {
  const hit = pool.find((w) => w.word === pickedText || w.meaningVi === pickedText);
  if (!hit || hit.word === target.word) {
    return { kind: 'unknown', title: MISTAKE_TITLE.unknown, detail: `Đáp án: “${target.word}” — ${target.meaningVi}.` };
  }
  return {
    kind: 'other_word',
    title: MISTAKE_TITLE.other_word,
    detail: `Bạn đang lẫn “${target.word}” (${target.meaningVi}) với “${hit.word}” (${hit.meaningVi}).`,
  };
}

/** Tổng hợp lỗi cuối vòng: kiểu lỗi nào nhiều nhất, và một lời khuyên theo đúng kiểu đó. */
export function summarizeMistakes(list: readonly Mistake[]): { kind: MistakeKind; count: number; title: string }[] {
  const counts = new Map<MistakeKind, number>();
  for (const m of list) counts.set(m.kind, (counts.get(m.kind) ?? 0) + 1);
  return [...counts.entries()]
    .sort((x, y) => y[1] - x[1])
    .map(([kind, count]) => ({ kind, count, title: MISTAKE_TITLE[kind] }));
}

export const MISTAKE_ADVICE: Record<MistakeKind, string> = {
  blank: 'Đoán vẫn hơn bỏ trống — gõ thử chữ cái đầu để kéo trí nhớ ra.',
  other_word: 'Bạn đang lẫn các từ gần nghĩa. Bật chiều “Việt → Anh” và đọc kỹ câu ví dụ của từng từ để phân biệt.',
  inflection: 'Bạn nhớ từ rồi, chỉ sai dạng. Để ý chủ ngữ số nhiều và thì của câu trước khi điền.',
  double_letter: 'Phụ âm đôi là lỗi chính tả hay gặp nhất. Đọc chậm từng âm tiết: ac-com-mo-date.',
  suffix: 'Các cặp đuôi -ance/-ence, -able/-ible phải học thuộc theo từng từ — không có quy tắc chắc chắn.',
  transposition: 'Gõ chậm lại một nhịp; đây thường là lỗi tay chứ không phải lỗi nhớ.',
  missing_letter: 'Đánh vần từ thành tiếng khi gõ để không rơi chữ.',
  extra_letter: 'Đánh vần từ thành tiếng khi gõ để không thêm chữ.',
  wrong_letter: 'Chỉ sai một chữ — xem lại chỗ khó của từ và gõ lại hai ba lần.',
  spelling: 'Bạn nhớ nghĩa nhưng chưa nhớ mặt chữ. Chế độ Nghe chép giúp luyện đúng phần này.',
  unknown: 'Những từ này chưa vào trí nhớ. Học lại bằng Lật thẻ trước rồi mới tới Điền từ.',
};
