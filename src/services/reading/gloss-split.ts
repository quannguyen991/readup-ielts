import type { BilingualGloss } from '@/data/bilingual-repository';

/**
 * Cắt một đoạn văn thành các mảnh, đánh dấu mảnh nào là từ có chú giải.
 *
 * Màn đọc song ngữ gạch chân đúng những từ đã có chú giải lề, bấm vào thì hiện
 * nghĩa. Muốn làm được vậy thì phải biết CHÍNH XÁC vị trí từng từ trong đoạn —
 * đó là việc của hàm này, tách hẳn khỏi phần vẽ để kiểm được bằng test.
 *
 * Ba chỗ dễ sai, xử lý ngay ở đây:
 *
 *   1. Chú giải hay ghi kèm phần trong ngoặc: "thin (out)", "lie in". Phần
 *      trong ngoặc là gợi ý cách dùng, không phải chữ có trong bài, nên phải bỏ
 *      trước khi đi tìm.
 *   2. Cụm dài phải được ưu tiên hơn từ ngắn nằm trong nó. Có cả "heat" và
 *      "heat island" thì tìm "heat" trước sẽ cắt vụn mất cụm dài.
 *   3. Phải khớp trọn từ. Không có ranh giới từ thì "art" sẽ gạch chân cả chữ
 *      "start", và cả đoạn văn biến thành một bãi gạch chân vô nghĩa.
 */

export type GlossSegment = {
  text: string;
  /** Có chú giải thì đây là mục chú giải tương ứng; không thì null. */
  gloss: BilingualGloss | null;
};

/** "thin (out)" → "thin"; "lie in" → "lie in". */
function searchable(word: string): string {
  return word.replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function splitByGloss(text: string, gloss: BilingualGloss[]): GlossSegment[] {
  const terms = gloss
    .map((entry) => ({ entry, term: searchable(entry.word) }))
    .filter((t) => t.term.length > 0)
    // Cụm dài trước: regex xen kẽ chọn nhánh khớp ĐẦU TIÊN, nên nếu "heat"
    // đứng trước "heat island" thì cụm dài không bao giờ tới lượt.
    .sort((a, b) => b.term.length - a.term.length);

  if (terms.length === 0) return [{ text, gloss: null }];

  const byTerm = new Map<string, BilingualGloss>();
  for (const { entry, term } of terms) {
    const key = term.toLowerCase();
    if (!byTerm.has(key)) byTerm.set(key, entry);
  }

  const pattern = new RegExp(
    `\\b(${terms.map((t) => escapeRegex(t.term)).join('|')})\\b`,
    'gi',
  );

  const segments: GlossSegment[] = [];
  let cursor = 0;

  for (const match of text.matchAll(pattern)) {
    const start = match.index ?? 0;
    if (start > cursor) segments.push({ text: text.slice(cursor, start), gloss: null });
    segments.push({
      text: match[0],
      gloss: byTerm.get(match[0].toLowerCase().replace(/\s+/g, ' ')) ?? null,
    });
    cursor = start + match[0].length;
  }

  if (cursor < text.length) segments.push({ text: text.slice(cursor), gloss: null });

  return segments;
}
