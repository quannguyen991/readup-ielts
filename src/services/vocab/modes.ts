import type { IconName } from '@/components/ui/Icon';
import type { VocabEntry } from '@/store/useVocabStore';

/**
 * Sáu chế độ ôn từ vựng, và ĐIỀU KIỆN để mỗi chế độ chạy được.
 *
 * VÌ SAO PHẢI CÓ ĐIỀU KIỆN. Một từ lưu từ bài đọc thì chắc chắn có câu gốc,
 * nhưng có thể chưa có nghĩa tiếng Việt, chưa có ví dụ, chưa gắn với bài nào.
 * Bày ra sáu nút rồi để người học bấm vào một nút và gặp màn trống là cách
 * nhanh nhất khiến họ không bấm lại lần thứ hai. Nên mỗi chế độ tự khai nó cần
 * gì, và cửa vào chỉ mở những chế độ đủ liệu.
 *
 * HAI CHẾ ĐỘ DỊCH LÀ TỰ CHẤM, và nói thẳng điều đó trên thẻ. App không lưu bản
 * dịch tiếng Việt của câu — chỉ lưu nghĩa tiếng Việt của TỪ — nên không có gì
 * để máy đối chiếu, và sinh bản dịch bằng AI thì vi phạm luật "không gọi API"
 * của chính dự án. Anki cũng chấm kiểu này cho thẻ production; cái sai là giả
 * vờ có chấm tự động rồi so chuỗi thô, vì mười bản dịch đúng sẽ bị báo sai chín.
 *
 * CHÉP CHÍNH TẢ THÌ CHẤM ĐƯỢC THẬT: câu gốc là tiếng Anh, người học gõ lại đúng
 * câu ấy, so từng chữ cái là hợp lệ. Đó là khác biệt giữa "tái tạo" và "dịch".
 */

export type VocabModeId =
  | 'flashcard'
  | 'context'
  | 'multiple_choice'
  | 'translate_sentence'
  | 'translate_paragraph'
  | 'dictation';

export type VocabMode = {
  id: VocabModeId;
  label: string;
  blurb: string;
  icon: IconName;
  /** Máy chấm được hay người học tự chấm. Hiện thẳng trên thẻ chọn chế độ. */
  grading: 'auto' | 'self';
  /** Từ này có đủ dữ liệu để chạy chế độ ấy không. */
  requires: (entry: VocabEntry) => boolean;
};

/** Nghĩa hiển thị được của một từ, ưu tiên tiếng Việt. */
export function meaningOf(entry: VocabEntry): string | null {
  return entry.definitionVi ?? entry.definitionContext ?? entry.definitionGeneral ?? null;
}

/** Câu dùng làm ngữ cảnh: câu gốc nơi gặp từ, hoặc câu ví dụ. */
export function contextSentenceOf(entry: VocabEntry): string | null {
  const source = entry.sourceSentence?.trim();
  if (source && source.length > 0) return source;
  const example = entry.exampleSentence?.trim();
  return example && example.length > 0 ? example : null;
}

/**
 * Câu có chứa từ ấy THẬT, để khoét chỗ trống.
 *
 * Kiểm bằng chính chuỗi chứ không tin `sourceSentence` luôn chứa từ: từ lưu ở
 * dạng nguyên mẫu (`lemma`) còn câu thì chia ở dạng khác — "ran" trong câu,
 * "run" trong sổ. Khoét một từ không có trong câu sẽ ra một câu y nguyên kèm
 * chỗ trống thừa ở cuối.
 */
export function clozeableSentence(entry: VocabEntry): string | null {
  const sentence = contextSentenceOf(entry);
  if (!sentence) return null;
  return findWordInSentence(sentence, entry) ? sentence : null;
}

/** Vị trí của từ trong câu, so không phân biệt hoa thường, theo BIÊN TỪ. */
export function findWordInSentence(
  sentence: string,
  entry: VocabEntry,
): { start: number; end: number } | null {
  for (const candidate of [entry.word, entry.lemma]) {
    const needle = candidate?.trim();
    if (!needle) continue;
    /*
      Biên từ (`\b`) chứ không phải `indexOf`: tìm "act" bằng `indexOf` sẽ trúng
      chữ "act" nằm trong "fact", và câu khoét ra thành "f______".
    */
    const re = new RegExp(`\\b${escapeRegExp(needle)}\\b`, 'i');
    const m = re.exec(sentence);
    if (m) return { start: m.index, end: m.index + m[0].length };
  }
  return null;
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const VOCAB_MODES: VocabMode[] = [
  {
    id: 'flashcard',
    label: 'Thẻ lật',
    blurb: 'Nhìn từ, nhớ nghĩa, lật thẻ rồi tự chấm. Nhanh nhất, hợp lúc ôn lại nhiều từ.',
    icon: 'refresh',
    grading: 'self',
    requires: (e) => meaningOf(e) !== null,
  },
  {
    id: 'context',
    label: 'Nghĩa qua ngữ cảnh',
    blurb:
      'Câu gốc nơi bạn gặp từ, khoét đúng chỗ từ đó. Đoán nghĩa từ câu trước, rồi mới xem đáp án.',
    icon: 'book',
    grading: 'self',
    requires: (e) => clozeableSentence(e) !== null,
  },
  {
    id: 'multiple_choice',
    label: 'Trắc nghiệm nghĩa',
    blurb: 'Bốn nghĩa, chọn một. Ba nghĩa nhiễu lấy từ chính sổ từ của bạn nên không đoán mò được.',
    icon: 'list',
    grading: 'auto',
    requires: (e) => meaningOf(e) !== null,
  },
  {
    id: 'translate_sentence',
    label: 'Dịch câu',
    blurb: 'Dịch nguyên câu gốc sang tiếng Việt, rồi tự đối chiếu. App không chấm hộ câu dịch.',
    icon: 'languages',
    grading: 'self',
    requires: (e) => contextSentenceOf(e) !== null,
  },
  {
    id: 'translate_paragraph',
    label: 'Dịch đoạn',
    blurb:
      'Cả đoạn văn chứa từ, không chỉ một câu. Dài hơn nên để dành cho từ đã thuộc mặt chữ.',
    icon: 'note',
    grading: 'self',
    requires: (e) => e.articleId !== null && e.paragraphIndex !== null,
  },
  {
    id: 'dictation',
    label: 'Nghe chép chính tả',
    blurb: 'Nghe câu gốc rồi gõ lại. Đây là chế độ duy nhất máy chấm được từng chữ cái.',
    icon: 'volume',
    grading: 'auto',
    requires: (e) => contextSentenceOf(e) !== null,
  },
];

export function getVocabMode(id: VocabModeId): VocabMode | undefined {
  return VOCAB_MODES.find((m) => m.id === id);
}

/** Những từ chạy được chế độ này. */
export function entriesForMode(entries: VocabEntry[], id: VocabModeId): VocabEntry[] {
  const mode = getVocabMode(id);
  if (!mode) return [];
  return entries.filter((e) => mode.requires(e));
}

/**
 * Đếm xem mỗi chế độ đang có bao nhiêu từ dùng được.
 *
 * Cửa vào hiện con số này ngay trên từng thẻ: "còn 0 từ" nói rõ vì sao nút mờ,
 * còn một nút mờ không kèm lý do thì người dùng tưởng app hỏng.
 */
export function modeAvailability(entries: VocabEntry[]): Record<VocabModeId, number> {
  const out = {} as Record<VocabModeId, number>;
  for (const mode of VOCAB_MODES) out[mode.id] = entries.filter((e) => mode.requires(e)).length;
  return out;
}
