import type { ArticleMeta } from '@/data/articles';

/**
 * Chọn BÀI KHÁC để chạy phép thử chuyển giao.
 *
 * VÌ SAO HÀM NÀY PHẢI CÓ. Sổ bằng chứng chỉ công nhận một kỹ năng khi người học
 * làm được nó trên một NGUỒN KHÁC — lặp lại trên đúng bài cũ không tách nổi "đã
 * hiểu" khỏi "nhớ bài này", và tách hai thứ đó là toàn bộ lý do phép thử chuyển
 * giao tồn tại. Nhưng cho tới trước hàm này, màn xem lại gửi lên đúng bài vừa
 * làm, còn lời dặn thì bảo model dựng câu mới "trong cùng bài đọc này". Điều
 * kiện công nhận vì thế chưa bao giờ được thoả một cách thật.
 *
 * CHỌN PHẢI TẤT ĐỊNH. Cùng một bài gốc thì luôn ra cùng một bài chuyển giao. Bốc
 * ngẫu nhiên nghe công bằng hơn, nhưng nó làm hỏng hai thứ: lượt làm bài không
 * dựng lại được khi cần soi lại một ca lạ, và trong một nghiên cứu hai tuần thì
 * "mỗi em gặp một bài khác nhau" là một biến không kiểm soát nằm ngay giữa phép
 * đo. Băm id ra chỉ số là đủ tản đều mà vẫn dựng lại được.
 */

/**
 * Băm chuỗi thành số không âm (FNV-1a 32 bit).
 *
 * Không dùng `Math.random`: xem chú thích trên. Không dùng độ dài chuỗi hay mã
 * ký tự đầu: id sinh theo cùng một khuôn nên hai cách đó dồn phần lớn bài vào
 * vài chỉ số, và "bài khác" sẽ luôn là một trong dăm bài.
 */
export function hashId(id: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < id.length; i += 1) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

export type TransferCandidate = Pick<
  ArticleMeta,
  'id' | 'exam' | 'passageTier' | 'licenseType' | 'wordCount'
>;

/** Bài chỉ có tiêu đề thì không dựng được phép thử — không có toàn văn để trích. */
function usable(a: TransferCandidate): boolean {
  return a.licenseType !== 'headline_only';
}

/**
 * Bài chuyển giao cho `current`, hoặc `null` nếu kho không có bài nào hợp.
 *
 * Ưu tiên hai bậc, và bậc nào cũng có lý do đo lường chứ không phải cho đẹp:
 *
 *   1. cùng kỳ thi VÀ cùng khổ passage — đổi khổ bài là đổi độ khó, mà đổi độ
 *      khó thì trượt phép thử không còn nói lên điều gì về kỹ năng nữa;
 *   2. cùng kỳ thi — vẫn hơn là không chạy được phép thử nào.
 *
 * KHÔNG có bậc ba "lấy bừa bài nào cũng được". Đưa một passage SAT cho người
 * đang luyện IELTS rồi ghi nhận họ trượt là ghi nhận sai, và một dòng sai trong
 * sổ bằng chứng đắt hơn một dòng trống.
 */
export function pickTransferSource(
  current: TransferCandidate,
  pool: readonly TransferCandidate[],
): TransferCandidate | null {
  const others = pool.filter((a) => a.id !== current.id && usable(a) && a.exam === current.exam);
  if (others.length === 0) return null;

  const sameTier = others.filter((a) => a.passageTier === current.passageTier);
  const tier = sameTier.length > 0 ? sameTier : others;

  // Sắp theo id trước khi băm: thứ tự trong kho đổi theo mỗi lần cào lại, và một
  // phép chọn "tất định" mà đổi kết quả sau mỗi lần ingest thì không tất định.
  const ordered = [...tier].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const picked = ordered[hashId(current.id) % ordered.length];
  return picked ?? null;
}
