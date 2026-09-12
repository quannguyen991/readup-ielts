/**
 * Các con số của chính sách hoàn tiền — đặt ở MỘT CHỖ.
 *
 * Trang Chính sách hoàn tiền, trang Điều khoản, trang thanh toán và dòng nhắc ở
 * trang quản trị đều đọc từ đây. Gõ số tay ở từng trang thì sớm muộn có ngày
 * trang chính sách nói 7 ngày còn người duyệt hoàn tiền thấy 3 — và người mua cầm
 * ảnh chụp trang chính sách đi khiếu nại là họ đúng.
 *
 * ĐÂY LÀ QUYẾT ĐỊNH KINH DOANH, không phải hằng số kỹ thuật: đổi con số nào ở đây
 * là đổi lời hứa với người mua. Ai đã mua theo chính sách cũ vẫn được hưởng chính
 * sách cũ.
 */

/** Hoàn toàn bộ kiểu "đổi ý" trong ngần này ngày kể từ lúc gói được bật — chỉ đơn đầu tiên. */
export const REFUND_WINDOW_DAYS = 7;

/** Chuyển đúng mà quá ngần này giờ gói vẫn chưa bật thì hoàn đủ nếu người mua không muốn chờ. */
export const ACTIVATION_SLA_HOURS = 48;

/** Tiền hoàn về tài khoản người mua trong ngần này ngày làm việc kể từ khi xác nhận hoàn. */
export const REFUND_PROCESS_WORKDAYS = 5;

/** App ngừng liên tục quá ngần này giờ vì lỗi phía ReadUp thì mọi gói đang chạy được cộng bù ngày. */
export const OUTAGE_CREDIT_AFTER_HOURS = 24;

/** Trả lời một yêu cầu hoàn tiền chậm nhất sau ngần này ngày làm việc. */
export const REFUND_REPLY_WORKDAYS = 2;

const DAY_MS = 86_400_000;

export type RefundCheck =
  | { kind: 'eligible'; daysLeft: number }
  | { kind: 'books_downloaded'; count: number }
  | { kind: 'expired' };

/**
 * Đơn đã trả còn hoàn kiểu "đổi ý" được không — dòng nhắc cho người duyệt.
 *
 * KHÔNG kiểm "đơn đầu tiên của tài khoản": người duyệt thấy mọi đơn của cùng một
 * email ngay trên danh sách, còn hàm này thì không. Đã tải sách thì xét trước cả
 * hạn ngày: tải xong một giờ cũng không hoàn được, vì sách số không trả lại được.
 */
export function changeOfMindRefund(opts: {
  paidAt: string | null;
  now: Date;
  booksDownloaded: number;
}): RefundCheck | null {
  if (!opts.paidAt) return null;
  const paid = Date.parse(opts.paidAt);
  if (!Number.isFinite(paid)) return null;
  if (opts.booksDownloaded > 0) return { kind: 'books_downloaded', count: opts.booksDownloaded };
  const left = paid + REFUND_WINDOW_DAYS * DAY_MS - opts.now.getTime();
  if (left <= 0) return { kind: 'expired' };
  return { kind: 'eligible', daysLeft: Math.ceil(left / DAY_MS) };
}
