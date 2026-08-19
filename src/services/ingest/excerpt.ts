import { accumulate, countWords, truncateBySentence, type SizeBounds } from './tiers';

/**
 * Cắt một tác phẩm dài thành các trích đoạn đúng khổ passage.
 *
 * Vì sao cần: nguồn SAT là sách nguyên bản (Gutenberg 400KB một cuốn) chứ không
 * phải bài báo. Không thể lưu cả cuốn thành "một bài đọc" — phải lấy ra vài
 * đoạn liền mạch đúng khổ đề thi, giống hệt cách đề thi thật trích sách.
 *
 * Toàn bộ file là hàm thuần, không gọi mạng, nên test được không cần fixture tải về.
 */

/** Đủ dài để là một đoạn văn thật, không phải tiêu đề hay dòng mục lục. */
const MIN_PROSE_WORDS = 8;
/** Đoạn mở đầu trích đoạn phải đủ dày, nếu không người đọc rơi vào giữa hội thoại. */
const MIN_OPENING_WORDS = 20;
/** Tỉ lệ ký tự chữ cái tối thiểu — chặn mục lục, bảng số, danh sách năm. */
const MIN_LETTER_RATIO = 0.7;

export type ExcerptSpec = {
  /** Số trích đoạn muốn lấy từ tác phẩm này. */
  count: number;
  /** Khổ mong muốn; dừng gom đoạn khi đã đạt. */
  targetWords: number;
  /** Dưới mức này thì bỏ trích đoạn, không lưu bài quá ngắn. */
  minWords: number;
  /** Trần cứng, không bao giờ được vượt. */
  maxWords: number;
  /** Bỏ qua phần đầu tác phẩm (bìa, mục lục, lời tựa). Mặc định 12%. */
  skipHeadRatio?: number;
  /** Bỏ qua phần cuối (phụ lục, ghi chú, quảng cáo nhà in). Mặc định 8%. */
  skipTailRatio?: number;
  /**
   * Khoảng đoạn đã dùng cho lượt cắt khác (`end` không tính vào). Cắt khổ ngắn
   * và khổ dài trên cùng một cuốn sách mà không khai chỗ này thì bài ngắn sẽ
   * nằm gọn trong bài dài — hai bài đọc khác nhau, cùng một nội dung.
   */
  avoid?: ReadonlyArray<{ start: number; end: number }>;
};

export type Excerpt = {
  paragraphs: string[];
  wordCount: number;
  /** Chỉ số đoạn đầu trong mảng đầu vào — dùng làm externalId ổn định. */
  startIndex: number;
};

/**
 * Bóc phần giấy phép của Project Gutenberg ở đầu và cuối file.
 *
 * Không tìm thấy mốc thì trả nguyên văn: thà giữ thừa vài dòng còn hơn ném đi
 * cả cuốn sách, và bộ lọc prose phía sau sẽ dọn phần lớn phần thừa đó.
 */
export function stripGutenbergBoilerplate(raw: string): string {
  const start = raw.match(/\*\*\*\s*START OF (?:THE|THIS) PROJECT GUTENBERG EBOOK[\s\S]{0,300}?\*\*\*/i);
  const end = raw.match(/\*\*\*\s*END OF (?:THE|THIS) PROJECT GUTENBERG EBOOK/i);

  const from = start ? start.index! + start[0].length : 0;
  const to = end?.index !== undefined && end.index > from ? end.index : raw.length;

  return raw.slice(from, to);
}

/**
 * Đổi văn bản thô thành mảng đoạn văn xuôi.
 *
 * Gutenberg xuống dòng cứng ở khoảng cột 70, đoạn cách nhau bằng một dòng
 * trống — nên phải nối dòng trong cùng đoạn lại trước, rồi mới lọc.
 */
export function toProseParagraphs(text: string): string[] {
  return text
    .replace(/\r\n?/g, '\n')
    .split(/\n[ \t]*\n+/)
    .map(cleanBlock)
    .filter(isProse);
}

function cleanBlock(block: string): string {
  return (
    block
      // Khối chèn của người số hoá, không phải văn bản tác phẩm.
      .replace(/\[Illustration[^\]]*\]/gi, ' ')
      .replace(/\[Footnote[^\]]*\]/gi, ' ')
      .replace(/\[\d+\]/g, '')
      // Gutenberg đánh dấu chữ nghiêng bằng gạch dưới bao quanh từ.
      .replace(/_/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

/**
 * Ghi chú của người số hoá, không phải văn bản tác phẩm.
 *
 * `stripGutenbergBoilerplate` chỉ cắt phần giấy phép ngoài hai mốc START/END;
 * ghi chú kiểu "NOTE: This file contains…" hay "[RO, Aug 2025: …]" nằm BÊN
 * TRONG hai mốc đó nên lọt qua. Với sách dày thì `skipHeadRatio` che được,
 * nhưng văn kiện ngắn (Declaration of Independence chỉ ~40 đoạn) thì 12% đầu
 * không đủ — đã gặp thật: passage mở đầu bằng bốn đoạn ghi chú.
 *
 * Văn bản tác phẩm gần như không bao giờ tự nhắc tới Project Gutenberg hay
 * etext, nên lọc theo dấu hiệu này an toàn.
 */
const EDITORIAL_MARKERS = new RegExp(
  [
    // Dấu hiệu của chính dự án số hoá.
    'project gutenberg',
    'gutenberg[- ]tm',
    'etext',
    'e-text',
    'public domain',
    'copyright',
    // Từ vựng của công việc số hoá, không phải của tác phẩm.
    'transcriber',
    'proofread',
    'misspelling',
    'facsimile',
    'plain text version',
    'scanned',
    // Chỉ neo biên ở ĐẦU từ: bản gốc dùng dạng số nhiều ("misspellings",
    // "facsimiles", "Etexts") nên neo cả hai đầu là trượt hết.
  ].map((w) => `\\b${w}`).join('|'),
  'i',
);

function isEditorialNote(block: string): boolean {
  if (EDITORIAL_MARKERS.test(block)) return true;
  // Ghi chú biên tập hay đứng trong ngoặc vuông hoặc mở đầu bằng NOTE:.
  if (/^\[/.test(block)) return true;
  return /^note\s*[:.]/i.test(block);
}

function isProse(block: string): boolean {
  if (block.length === 0) return false;
  if (isEditorialNote(block)) return false;

  const words = countWords(block);
  if (words < MIN_PROSE_WORDS) return false;

  // Tiêu đề chương thường in hoa toàn bộ.
  if (block === block.toUpperCase()) return false;

  // "CHAPTER IV." hay "BOOK THE SECOND" — dòng đề mục, không phải văn.
  if (/^(chapter|book|part|act|scene|volume|canto|section|letter|preface|contents)\b/i.test(block) && words < 25) {
    return false;
  }

  // Dòng mục lục: chấm dẫn hoặc kết bằng số trang.
  if (/\.{3,}|(?:\.\s){3,}/.test(block)) return false;
  if (/\s\d{1,4}$/.test(block) && words < 20) return false;

  // Phải có ít nhất một dấu kết câu — loại danh sách và nhan đề.
  if (!/[.!?]["'”’)]?\s*$/.test(block) && !/[.!?]\s/.test(block)) return false;

  const nonSpace = block.replace(/\s/g, '').length;
  const letters = (block.match(/[A-Za-z]/g) ?? []).length;
  return nonSpace > 0 && letters / nonSpace >= MIN_LETTER_RATIO;
}

/** Đoạn mở đầu phải đủ dày và bắt đầu một ý mới, không phải câu nói dở dang. */
function canOpenExcerpt(paragraph: string): boolean {
  if (countWords(paragraph) < MIN_OPENING_WORDS) return false;
  return /^["'“‘(]?[A-Z]/.test(paragraph);
}

/**
 * Lấy `count` trích đoạn rải đều dọc tác phẩm.
 *
 * Rải đều chứ không lấy liên tiếp từ đầu: hai trích đoạn cạnh nhau trong cùng
 * một chương gần như trùng bối cảnh, làm bài luyện lặp ý. Mỗi ô được phép trượt
 * xuống vài đoạn để tìm chỗ mở đầu sạch, nên tác phẩm nhiều hội thoại vẫn ra đủ bài.
 */
export function pickExcerpts(paragraphs: string[], spec: ExcerptSpec): Excerpt[] {
  const { count, targetWords, minWords, maxWords } = spec;
  const skipHead = spec.skipHeadRatio ?? 0.12;
  const skipTail = spec.skipTailRatio ?? 0.08;

  const total = paragraphs.length;
  if (total === 0 || count <= 0) return [];

  // Tác phẩm ngắn (bài diễn văn, tiểu luận) không đủ chỗ để bỏ đầu bỏ đuôi.
  const trimmable = total >= 20;
  const head = trimmable ? Math.floor(total * skipHead) : 0;
  const tail = trimmable ? total - Math.floor(total * skipTail) : total;

  const usable = Math.max(0, tail - head);
  if (usable === 0) return [];

  const avoid = spec.avoid ?? [];
  const blocked = (index: number): boolean =>
    avoid.some((range) => index >= range.start && index < range.end);

  const stride = Math.max(1, Math.floor(usable / count));
  const excerpts: Excerpt[] = [];
  let cursor = head;

  for (let slot = 0; slot < count; slot += 1) {
    const nominal = head + slot * stride;
    const from = Math.max(nominal, cursor);
    const searchTo = Math.min(tail, from + stride);

    for (let start = from; start < searchTo; start += 1) {
      if (blocked(start)) continue;
      if (!canOpenExcerpt(paragraphs[start]!)) continue;

      const bounds = { targetWords, minWords, maxWords };
      const excerpt = buildExcerpt(paragraphs, start, tail, bounds, blocked);
      if (!excerpt) continue;

      excerpts.push(excerpt);
      cursor = start + excerpt.paragraphs.length;
      break;
    }
  }

  return excerpts;
}

function buildExcerpt(
  paragraphs: string[],
  start: number,
  tail: number,
  bounds: SizeBounds,
  blocked: (index: number) => boolean,
): Excerpt | null {
  const { targetWords, minWords, maxWords } = bounds;

  // Dừng ở đoạn đầu tiên đã thuộc trích đoạn khác — không lấy đè lên.
  let end = tail;
  for (let i = start; i < tail; i += 1) {
    if (blocked(i)) {
      end = i;
      break;
    }
  }

  const window = paragraphs.slice(start, end);
  if (window.length === 0) return null;

  const first = window[0]!;
  if (countWords(first) > maxWords) {
    // Đoạn đầu đã quá khổ — cắt theo ranh giới câu để trích đoạn vẫn trọn ý.
    const trimmed = truncateBySentence(first, targetWords);
    const trimmedWords = countWords(trimmed);
    // Một câu duy nhất dài hơn cả khổ thì bỏ, chứ không cắt giữa câu.
    if (trimmedWords > maxWords || trimmedWords < minWords) return null;
    return { paragraphs: [trimmed], wordCount: trimmedWords, startIndex: start };
  }

  // Cùng luật với truncateToTier trong pipeline, nếu không lần cắt thứ hai ở đó
  // sẽ xén ngắn lại chính trích đoạn này.
  const kept = accumulate(window, bounds, countWords);
  const words = kept.reduce((sum, p) => sum + countWords(p), 0);

  if (words < minWords) return null;
  return { paragraphs: kept, wordCount: words, startIndex: start };
}
