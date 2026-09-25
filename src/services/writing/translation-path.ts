import { TRANSLATION_SETS, type TranslationSet } from '@/data/translation-sets';
import type { TranslationItem } from '@/data/sentence-drills';

/**
 * Lộ trình luyện dịch Việt → Anh, năm bước siết dần.
 *
 * VÌ SAO CÓ LỘ TRÌNH CHỨ KHÔNG CHỈ CÓ 40 BỘ ĐỀ. Bốn mươi bộ xếp cạnh nhau là một
 * cái kho, và người mới mở kho ra không biết bốc bộ nào. Bốn mươi bộ ấy cũng đang
 * trộn lẫn hai trục hoàn toàn khác nhau: CẤU TRÚC CÂU (thì, bị động, so sánh) và
 * CHỦ ĐỀ (giáo dục, môi trường). Học sinh vướng thì hiện tại hoàn thành thì vướng
 * ở mọi chủ đề, còn người thiếu từ vựng môi trường thì chỉ vướng ở một chỗ — hai
 * chỗ vướng ấy cần hai cách luyện khác nhau, và một cái kho phẳng thì không tách
 * được chúng ra.
 *
 * MỌI THỨ Ở ĐÂY DẪN XUẤT TỪ DỮ LIỆU ĐÃ CÓ, KHÔNG VIẾT NỘI DUNG MỚI. Bốn mươi bộ
 * câu đều đã có đáp án mẫu, gợi ý cấu trúc và bảng "cách diễn đạt khác" soạn
 * riêng. Bịa thêm một kho câu thứ hai để lấp cho đủ năm bước là đổi toàn bộ phần
 * đó lấy đúng một thứ: con số trên màn hình.
 *
 * BƯỚC 3, 4, 5 KHÔNG PHẢI KHO KHÁC — CÙNG CÂU, KHÁC ĐỘ DÀI MỘT LƯỢT. Dịch ba câu
 * liền một lượt khó hơn hẳn dịch ba câu rời, vì phải giữ mạch giữa các câu và
 * không được quên câu trước lúc gõ câu sau. Đó là một bậc năng lực thật, không
 * phải một nhãn dán.
 */

export type StepId = 'structure' | 'topic' | 'para-65' | 'para-80' | 'essay';

export type PathStep = {
  id: StepId;
  order: number;
  title: string;
  /** Nhãn nhỏ cạnh tên bước; `null` nghĩa là không có nhãn. */
  badge: string | null;
  blurb: string;
  /** Số câu người học phải dịch trong MỘT lượt. */
  chunk: number;
};

export const PATH_STEPS: readonly PathStep[] = Object.freeze([
  {
    id: 'structure',
    order: 1,
    title: 'Cấu trúc câu cơ bản',
    badge: null,
    blurb:
      'Luyện theo CẤU TRÚC chứ không theo chủ đề: mỗi mục gom những câu cùng dùng một thì hoặc một dạng câu, lấy từ khắp các chủ đề.',
    chunk: 1,
  },
  {
    id: 'topic',
    order: 2,
    title: 'Từ vựng theo chủ đề',
    badge: 'VOCAB',
    blurb:
      'Cùng một cấu trúc nhưng đổi sang từ vựng của từng lĩnh vực. Vướng ở đây là vướng từ, không phải vướng ngữ pháp.',
    chunk: 1,
  },
  {
    id: 'para-65',
    order: 3,
    title: 'Dịch đoạn ngắn',
    badge: 'BAND 6.5',
    blurb: 'Ba câu liền một lượt. Phải giữ mạch giữa các câu, không được quên câu trước lúc gõ câu sau.',
    chunk: 3,
  },
  {
    id: 'para-80',
    order: 4,
    title: 'Dịch đoạn dài',
    badge: 'BAND 8.0',
    blurb: 'Bốn câu liền, lấy từ những bộ khó nhất — câu nhiều mệnh đề và từ vựng ít gặp.',
    chunk: 4,
  },
  {
    id: 'essay',
    order: 5,
    title: 'Dịch trọn đoạn văn',
    badge: 'DÀI NHẤT',
    blurb: 'Sáu câu liền một lượt, đúng khổ một đoạn thân bài. Đây là bậc gần nhất với việc viết thật.',
    chunk: 6,
  },
]);

export function getStep(id: string): PathStep | undefined {
  return PATH_STEPS.find((s) => s.id === id);
}

/** Một mục luyện trong một bước. */
export type PathTopic = {
  id: string;
  /** Số thứ tự hiện trên thẻ. */
  index: number;
  title: string;
  /** Dòng phụ dưới tên; `null` thì thẻ chỉ có tên. */
  subtitle: string | null;
  /** Số LƯỢT phải làm, không phải số câu. */
  units: number;
  /** Đường dẫn màn luyện, kèm tham số đã dựng sẵn. */
  href: string;
  /** Độ khó của bộ gốc; `null` với nhóm cấu trúc (gom từ mọi độ khó). */
  level: TranslationSet['level'] | null;
  /** Một câu nói mục này luyện gì. */
  blurb: string;
  /** Ba lượt đầu (đã gộp câu theo bước) — để thẻ vẽ dấu vân Việt–Anh thật. */
  sample: { vi: string; en: string }[];
  /** Mã bộ gốc, để đếm số lần đã luyện; `null` với nhóm cấu trúc. */
  setId: string | null;
};

function sampleOf(items: readonly TranslationItem[]): { vi: string; en: string }[] {
  return items.slice(0, 3).map((it) => ({ vi: it.vi, en: it.en }));
}

/**
 * Tám nhóm cấu trúc của Bước 1.
 *
 * Nhận diện bằng trường `hint` mà mỗi câu đã mang sẵn — đó là nhãn ngữ pháp do
 * chính bộ đề ghi, nên không phải tôi đoán. Từ khoá viết thường không dấu để so
 * cho khỏi vướng chuyện gõ dấu.
 *
 * Thứ tự QUAN TRỌNG: một câu có thể khớp nhiều nhóm ("câu bị động ở thì hiện tại
 * hoàn thành"), và nhóm đứng trước thắng. Xếp thì đơn giản lên đầu, dạng câu
 * phức tạp xuống dưới, để câu bị động không bị hút hết về nhóm "hiện tại đơn".
 */
const STRUCTURE_GROUPS: readonly { id: string; title: string; match: readonly string[] }[] =
  Object.freeze([
    { id: 'passive', title: 'Câu bị động', match: ['bi dong', 'passive'] },
    { id: 'conditional', title: 'Câu điều kiện', match: ['dieu kien', 'conditional'] },
    { id: 'relative', title: 'Mệnh đề quan hệ', match: ['quan he', 'relative'] },
    { id: 'comparison', title: 'So sánh', match: ['so sanh', 'comparison', 'comparative'] },
    { id: 'perfect', title: 'Thì hoàn thành', match: ['hoan thanh', 'perfect'] },
    { id: 'continuous', title: 'Thì tiếp diễn', match: ['tiep dien', 'continuous'] },
    { id: 'past', title: 'Thì quá khứ', match: ['qua khu', 'past'] },
    { id: 'present', title: 'Thì hiện tại đơn', match: ['hien tai don', 'present simple'] },
  ]);

/** Bỏ dấu tiếng Việt để so khớp nhãn ngữ pháp mà không phụ thuộc cách gõ dấu. */
export function stripTone(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

/** Nhóm cấu trúc của một câu, hoặc `null` nếu nhãn không khớp nhóm nào. */
export function structureOf(item: TranslationItem): string | null {
  const hint = stripTone(item.hint ?? '');
  if (hint === '') return null;
  for (const group of STRUCTURE_GROUPS) {
    if (group.match.some((k) => hint.includes(k))) return group.id;
  }
  return null;
}

/** Mọi câu của mọi bộ, phẳng ra — dùng cho Bước 1, vốn cắt ngang chủ đề. */
function allItems(): TranslationItem[] {
  return TRANSLATION_SETS.flatMap((s) => s.items);
}

export function structureTopics(): PathTopic[] {
  const items = allItems();
  return STRUCTURE_GROUPS.map((group, i) => {
    const mine = items.filter((it) => structureOf(it) === group.id);
    return {
      id: group.id,
      index: i + 1,
      title: group.title,
      subtitle: 'Gom từ mọi chủ đề',
      units: mine.length,
      href: `/sentence/translate?structure=${group.id}`,
      level: null,
      blurb: `Mọi câu ${group.title.toLowerCase()} trong kho, gom từ tất cả các chủ đề.`,
      sample: sampleOf(mine),
      setId: null,
    };
  }).filter((t) => t.units > 0);
}

function topicTopics(): PathTopic[] {
  return TRANSLATION_SETS.map((set, i) => ({
    id: set.id,
    index: i + 1,
    title: set.title,
    subtitle: null,
    units: set.items.length,
    href: `/sentence/translate?set=${set.id}`,
    level: set.level,
    blurb: set.blurb,
    sample: sampleOf(set.items),
    setId: set.id,
  }));
}

/**
 * Bộ nào hợp với bước dịch nhiều câu.
 *
 * Bậc khó của Bước 3 → 4 → 5 tăng theo HAI trục cùng lúc: số câu phải giữ trong
 * đầu một lượt, và độ khó của chính những câu ấy. Chỉ tăng số câu mà giữ nguyên
 * câu dễ thì bước sau chỉ dài hơn chứ không khó hơn.
 */
function setsForStep(step: StepId): TranslationSet[] {
  if (step === 'para-65') return TRANSLATION_SETS.filter((s) => s.level !== 'hard');
  if (step === 'para-80') return TRANSLATION_SETS.filter((s) => s.level === 'hard');
  return TRANSLATION_SETS.filter((s) => s.level !== 'easy');
}

function chunkTopics(step: PathStep): PathTopic[] {
  return setsForStep(step.id)
    .map((set, i) => {
      const units = Math.floor(set.items.length / step.chunk);
      return {
        id: set.id,
        index: i + 1,
        title: set.title,
        subtitle: `${step.chunk} câu mỗi lượt`,
        units,
        href: `/sentence/translate?set=${set.id}&chunk=${step.chunk}`,
        level: set.level,
        blurb: set.blurb,
        sample: sampleOf(chunkItems(set.items, step.chunk)),
        setId: set.id,
      };
    })
    // Bộ không đủ câu cho một lượt thì không hiện: một thẻ mở ra rỗng tệ hơn
    // một thẻ không có.
    .filter((t) => t.units > 0);
}

export function topicsForStep(step: PathStep): PathTopic[] {
  if (step.id === 'structure') return structureTopics();
  if (step.id === 'topic') return topicTopics();
  return chunkTopics(step);
}

/** Tổng số lượt của một bước — con số hiện trên thẻ ở màn danh sách bước. */
export function stepUnits(step: PathStep): number {
  return topicsForStep(step).reduce((sum, t) => sum + t.units, 0);
}

/**
 * Gộp nhiều câu liền nhau thành MỘT lượt dịch.
 *
 * Đề bài là mấy câu tiếng Việt nối lại, đáp án là mấy câu tiếng Anh tương ứng
 * nối lại. Người học gõ liền một mạch, và bộ mở khoá theo từng từ vẫn chạy y
 * nguyên vì nó vốn chỉ nhìn vào một chuỗi.
 *
 * `id` mang cả chỉ số lượt để hai lượt trong cùng một bộ không trùng khoá — sổ
 * lượt làm bài lưu theo `itemId`, trùng khoá là ghi đè mất lượt trước.
 *
 * Phần dư ở cuối bị BỎ, không gộp thành một lượt ngắn hơn: bước này định nghĩa
 * bằng "mấy câu một lượt", và một lượt hai câu nằm trong bước bốn câu thì con số
 * trên thẻ không còn đúng nữa.
 */
export function chunkItems(items: readonly TranslationItem[], chunk: number): TranslationItem[] {
  if (chunk <= 1) return [...items];

  const out: TranslationItem[] = [];
  for (let i = 0; i + chunk <= items.length; i += chunk) {
    const group = items.slice(i, i + chunk);
    const first = group[0] as TranslationItem;
    out.push({
      ...first,
      id: `${first.id}-x${chunk}-${out.length + 1}`,
      vi: group.map((g) => g.vi).join(' '),
      en: group.map((g) => g.en).join(' '),
      // Gợi ý của câu đầu không nói gì về ba câu sau, nên gom hết lại; trùng thì bỏ.
      hint: [...new Set(group.map((g) => g.hint).filter(Boolean))].join(' · '),
    });
  }
  return out;
}

/** Mọi câu thuộc một nhóm cấu trúc, gom từ khắp các bộ. */
export function itemsForStructure(structureId: string): TranslationItem[] {
  return allItems().filter((it) => structureOf(it) === structureId);
}
