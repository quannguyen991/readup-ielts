import type { WritingAnnotation } from '@/lib/writing/types';

/**
 * Dựng "bản đã sửa" bằng cách thay từng đoạn lỗi bằng bản sửa của nó.
 *
 * TÍNH BẰNG CODE, KHÔNG GỌI THÊM AI. Mỗi annotation đã mang sẵn `start`/`end`
 * (đã neo ở máy chủ, không chồng lấn, đã xếp theo vị trí) và `fix` là bản sửa
 * cho đúng đoạn ấy — nên bản đã sửa là thứ suy ra được, không phải thứ phải hỏi
 * lại model. Gọi thêm một lượt "viết lại bài này cho hay hơn" vừa tốn hạn mức,
 * vừa cho ra một bài KHÁC bài của người học, mà cái người học cần thấy là chính
 * câu mình viết sau khi vá đúng chỗ sai.
 *
 * Vì cùng lý do đó, hàm này KHÔNG hứa hẹn một bài band cao hơn. Nó chỉ nói được
 * một điều, và nói đúng: đây là bài của bạn với các lỗi đã được sửa.
 */
export function applyFixes(text: string, annotations: WritingAnnotation[]): string {
  const usable = annotations
    .filter((a) => a.fix.trim() !== '' && a.start >= 0 && a.end <= text.length && a.start < a.end)
    .sort((a, b) => a.start - b.start);

  let out = '';
  let cursor = 0;

  for (const annotation of usable) {
    // Bỏ qua annotation chồng lên đoạn vừa thay: neo ở máy chủ đã chặn chồng
    // lấn, nhưng dữ liệu cũ lưu trên máy người dùng thì không có gì bảo đảm.
    if (annotation.start < cursor) continue;
    out += text.slice(cursor, annotation.start) + annotation.fix;
    cursor = annotation.end;
  }

  return out + text.slice(cursor);
}

/** Số lỗi thực sự vá được — dùng để nói thẳng "đã sửa N chỗ". */
export function countApplicableFixes(text: string, annotations: WritingAnnotation[]): number {
  let count = 0;
  let cursor = 0;
  for (const a of [...annotations].sort((x, y) => x.start - y.start)) {
    if (a.fix.trim() === '' || a.start < cursor || a.start >= a.end || a.end > text.length) continue;
    count += 1;
    cursor = a.end;
  }
  return count;
}
