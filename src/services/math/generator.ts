import { MATH_TEMPLATES, getTemplate } from './templates';
import { MATH_SKILL_DOMAIN } from '@/lib/math/types';
import type { MathItem, MathSkill, MathTemplate } from '@/lib/math/types';
import { hashString, mulberry32, shuffle } from '@/services/questions/rng';

/**
 * Sinh câu hỏi Math từ template.
 *
 * Hạt lấy từ CHÍNH ID CÂU, nên `id` vừa là tên vừa là công thức tái lập: mở lại
 * một câu đã làm là dựng lại đúng câu ấy, không cần lưu gì. Đây cũng là lý do
 * bảng `math_items` chỉ là bộ nhớ đệm — mất bảng thì sinh lại y hệt.
 *
 * Tuyệt đối không `Math.random()` ở đây, cùng lý do đã ghi trong
 * `src/services/questions/rng.ts`: làm lại lần hai mà ra đề khác thì mọi so
 * sánh tiến bộ đều vô nghĩa.
 */

export function makeItemId(templateSlug: string, seed: string | number): string {
  return `${templateSlug}:${seed}`;
}

/**
 * Tách id ngược lại thành slug và hạt.
 *
 * Cắt ở dấu HAI CHẤM ĐẦU TIÊN: slug không bao giờ chứa dấu hai chấm (chúng dùng
 * gạch nối), còn hạt thì có — hạt của bài chẩn đoán là `diagnostic:<seed>#<i>`.
 * Cắt ở dấu cuối cùng là hỏng đúng những câu ấy.
 */
export function parseItemId(id: string): { templateSlug: string; seed: string } | null {
  const at = id.indexOf(':');
  if (at <= 0 || at === id.length - 1) return null;
  return { templateSlug: id.slice(0, at), seed: id.slice(at + 1) };
}

/**
 * Dựng lại một câu đã gặp, chỉ từ id của nó.
 *
 * Đây là lý do lịch sử làm bài chỉ cần lưu id: mở màn Review là dựng lại đúng
 * câu ấy, đúng thứ tự lựa chọn, đúng lời giải. Trả về null khi template đã bị
 * xoá khỏi danh bạ — màn hình phải chịu được chuyện đó thay vì nổ.
 */
export function regenerateMathItem(id: string): MathItem | null {
  const parsed = parseItemId(id);
  if (!parsed || !getTemplate(parsed.templateSlug)) return null;
  return generateMathItem(parsed.templateSlug, parsed.seed);
}

export function generateMathItem(templateSlug: string, seed: string | number): MathItem {
  const template = getTemplate(templateSlug);
  if (!template) {
    // Lỗi lập trình, không phải lỗi dữ liệu người dùng: slug do code truyền vào.
    throw new Error(`Không có template nào mang slug "${templateSlug}".`);
  }

  const id = makeItemId(templateSlug, seed);
  const rng = mulberry32(hashString(id));
  const draft = template.build(rng);

  const base = {
    id,
    templateSlug,
    skill: template.skill,
    domain: MATH_SKILL_DOMAIN[template.skill],
    difficulty: template.difficulty,
    stem: draft.stem,
    figure: draft.figure ?? null,
    steps: draft.steps,
  };

  if (draft.format === 'mcq') {
    return {
      ...base,
      format: 'mcq',
      choices: draft.choices,
      correctIndex: draft.correctIndex,
      answerValue: null,
    };
  }

  return {
    ...base,
    format: 'grid_in',
    choices: null,
    correctIndex: null,
    answerValue: draft.answer,
  };
}

export type MathSetOptions = {
  /** Chỉ lấy template của những kỹ năng này. Bỏ trống là lấy mọi kỹ năng đã phủ. */
  skills?: MathSkill[];
  count: number;
  /** Hạt của cả bộ đề. Cùng hạt ra đúng cùng một bộ, theo đúng thứ tự. */
  seed: string;
};

/**
 * Dựng một bộ đề.
 *
 * Đi VÒNG TRÒN qua danh sách template đã trộn chứ không bốc ngẫu nhiên từng
 * câu: bốc ngẫu nhiên thì bộ 20 câu rất dễ ra 5 câu cùng một kỹ năng và bỏ
 * trắng kỹ năng khác, mà bài chẩn đoán thì cần trải đều mới đọc được kết quả.
 */
export function generateMathSet(options: MathSetOptions): MathItem[] {
  const { skills, count, seed } = options;

  const pool: MathTemplate[] = skills
    ? MATH_TEMPLATES.filter((t) => skills.includes(t.skill))
    : [...MATH_TEMPLATES];

  if (pool.length === 0) {
    throw new Error('Không có template nào khớp bộ kỹ năng yêu cầu.');
  }

  const rng = mulberry32(hashString(`set:${seed}`));
  const ordered = shuffle(pool, rng);

  const items: MathItem[] = [];
  for (let i = 0; i < count; i += 1) {
    const template = ordered[i % ordered.length];
    if (!template) break;
    items.push(generateMathItem(template.slug, `${seed}#${i}`));
  }

  return items;
}
