import type { AnnotationCategory } from '@/lib/writing/types';

/**
 * Phép thử chuyển giao cho mảng Viết.
 *
 * VÌ SAO VIẾT CẦN MỘT HÌNH DẠNG RIÊNG. Ở Đọc và Nghe, chuyển giao là "làm lại
 * cùng kỹ năng trên một bài khác" — có bài khác sẵn để lấy. Bài viết thì không:
 * mỗi bài là của riêng người học, không có "bài viết khác cùng lỗi" nằm chờ.
 *
 * Nên chuyển giao ở đây đổi hình: cho một CÂU MỚI mang đúng loại lỗi vừa được
 * chỉ ra trong bài của họ, và bảo họ sửa. Đọc xong lời giải thích rồi gật đầu là
 * một chuyện; nhận ra cùng lỗi ấy trong một câu chưa từng thấy và sửa được là
 * chuyện khác — và đó mới là thứ dùng được ở bài viết sau.
 *
 * CÂU MỚI DO AI SOẠN, NHƯNG ĐÁP ÁN THÌ KHÔNG DO AI CHẤM một mình. Model trả về
 * cả câu sai lẫn bản sửa của chính nó; phần chấm so bản của người học với bản
 * sửa ấy theo luật nới ở dưới. Model có thể soạn câu dở, nhưng nó không có
 * đường nào tự tuyên bố người học đã hiểu — quyền đó nằm ở `services/mastery`.
 */

export type TransferProbe = {
  /** Câu có lỗi, người học phải sửa. */
  sentence: string;
  /** Bản sửa mẫu do model đưa ra. */
  fixed: string;
  /** Loại lỗi đang được kiểm — phải trùng loại lỗi trong bài gốc. */
  category: AnnotationCategory;
  /** Một câu tiếng Việt nói rõ chỗ sai, chỉ hiện SAU khi người học đã sửa. */
  hintVi: string;
};

export const TRANSFER_SYSTEM = [
  'Bạn soạn một câu luyện sửa lỗi cho người Việt học IELTS Writing.',
  'Chỉ trả về MỘT đối tượng JSON, không lời dẫn, không bọc trong ```.',
  'Câu phải mang ĐÚNG loại lỗi được yêu cầu, và KHÔNG mang loại lỗi nào khác —',
  'lẫn thêm lỗi khác thì người học sửa đúng vẫn bị coi là sai.',
  'Câu phải MỚI, khác hẳn câu ví dụ được đưa vào, và về một chủ đề khác.',
].join(' ');

export function buildTransferPrompt(input: {
  category: AnnotationCategory;
  /** Câu sai lấy từ chính bài của người học, làm mẫu loại lỗi. */
  originalQuote: string;
  whyVi: string;
}): string {
  return [
    `Loại lỗi cần kiểm: ${input.category}.`,
    `Trong bài của người học, lỗi này xuất hiện ở câu: "${input.originalQuote}"`,
    `Nhận xét đã đưa: ${input.whyVi}`,
    '',
    'Soạn MỘT câu tiếng Anh MỚI mang đúng loại lỗi đó, về một chủ đề khác hẳn.',
    'Trả về JSON: {"sentence":"...","fixed":"...","hintVi":"..."}',
    '- "sentence": câu có lỗi, 12-22 từ, chỉ chứa ĐÚNG một lỗi thuộc loại trên.',
    '- "fixed": chính câu đó đã sửa, giữ nguyên mọi thứ khác.',
    '- "hintVi": một câu tiếng Việt nói rõ chỗ sai nằm ở đâu và sửa thế nào.',
  ].join('\n');
}

/**
 * Đọc câu trả lời của model, và TỪ CHỐI những bản không dùng được.
 *
 * Ba lối từ chối, mỗi lối chặn một kiểu hỏng đã lường trước:
 *
 *  · thiếu trường  → không có gì để chấm;
 *  · sentence trùng fixed → model quên gài lỗi, người học sửa gì cũng thành sai;
 *  · sentence trùng câu gốc → không phải câu mới, nên không tách được "đã hiểu"
 *    khỏi "nhớ câu vừa đọc" — đúng thứ mà phép thử chuyển giao sinh ra để tách.
 */
export function parseTransferProbe(
  raw: unknown,
  ctx: { category: AnnotationCategory; originalQuote: string },
): TransferProbe | { rejected: string } {
  const o = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const sentence = typeof o.sentence === 'string' ? o.sentence.trim() : '';
  const fixed = typeof o.fixed === 'string' ? o.fixed.trim() : '';
  const hintVi = typeof o.hintVi === 'string' ? o.hintVi.trim() : '';

  if (!sentence || !fixed || !hintVi) return { rejected: 'thiếu trường' };
  if (normalise(sentence) === normalise(fixed)) return { rejected: 'câu sai trùng câu sửa' };
  if (normalise(sentence) === normalise(ctx.originalQuote)) {
    return { rejected: 'không phải câu mới' };
  }
  if (sentence.split(/\s+/).length < 6) return { rejected: 'câu quá ngắn' };

  return { sentence, fixed, category: ctx.category, hintVi };
}

/**
 * Chấm bản sửa của người học.
 *
 * NỚI TAY CÓ CHỦ ĐÍCH. Đang kiểm việc họ có nhận ra và sửa được LOẠI LỖI ấy hay
 * không, chứ không kiểm họ có viết trùng từng chữ với bản mẫu hay không. Một bản
 * sửa đúng ngữ pháp nhưng chọn từ khác vẫn là sửa được; bắt khớp nguyên văn sẽ
 * đánh trượt đúng những người viết tốt nhất.
 *
 * Nhưng cũng KHÔNG nới tới mức chép lại câu sai là qua: chỗ đó là ranh giới, và
 * nó được canh bằng test.
 */
export function gradeTransfer(
  learner: string,
  probe: TransferProbe,
): { passed: boolean; reason: 'khớp bản sửa' | 'không đổi gì' | 'khác bản sửa' } {
  const a = normalise(learner);
  const fixed = normalise(probe.fixed);
  const broken = normalise(probe.sentence);

  if (a === broken) return { passed: false, reason: 'không đổi gì' };
  if (a === fixed) return { passed: true, reason: 'khớp bản sửa' };

  /*
    Chấp nhận sai khác nhỏ: bỏ dấu câu và hoa thường rồi so số từ khác nhau.
    Một hai từ khác là cách diễn đạt riêng; khác nhiều hơn thì nhiều khả năng họ
    viết sang chuyện khác chứ không phải sửa lỗi.
  */
  const diff = wordDiff(a, fixed);
  if (diff <= 2) return { passed: true, reason: 'khớp bản sửa' };
  return { passed: false, reason: 'khác bản sửa' };
}

function normalise(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Số từ có ở bản này mà không có ở bản kia, tính cả hai chiều. */
function wordDiff(a: string, b: string): number {
  const wa = a.split(' ').filter(Boolean);
  const wb = b.split(' ').filter(Boolean);
  const bagB = new Map<string, number>();
  for (const w of wb) bagB.set(w, (bagB.get(w) ?? 0) + 1);

  let onlyA = 0;
  for (const w of wa) {
    const left = bagB.get(w) ?? 0;
    if (left > 0) bagB.set(w, left - 1);
    else onlyA += 1;
  }
  let onlyB = 0;
  for (const left of bagB.values()) onlyB += left;
  return onlyA + onlyB;
}
