import { BOOK_TOTALS } from '@/services/books/catalog';
import {
  ACTIVATION_SLA_HOURS,
  OUTAGE_CREDIT_AFTER_HOURS,
  REFUND_PROCESS_WORKDAYS,
  REFUND_REPLY_WORKDAYS,
  REFUND_WINDOW_DAYS,
} from '@/services/payment/refund';

import { LEGAL_UPDATED_AT, contactVia, type LegalContext, type LegalDoc } from './shared';

export function refundDoc(ctx: LegalContext): LegalDoc {
  return {
    id: 'refund',
    title: 'Chính sách hoàn tiền',
    lead: `Khi nào được hoàn, hoàn bao nhiêu và làm thế nào. Gọn lại: chuyển nhầm thì luôn được hoàn; đổi ý thì được hoàn đủ trong ${REFUND_WINDOW_DAYS} ngày đầu, nếu chưa tải sách tặng kèm.`,
    updatedAt: LEGAL_UPDATED_AT,
    sections: [
      {
        id: 'always',
        heading: 'Luôn được hoàn đủ',
        blocks: [
          {
            kind: 'list',
            items: [
              'Chuyển trùng — cùng một đơn mà chuyển hai lần: hoàn nguyên khoản thừa.',
              'Chuyển nhiều hơn giá đơn: hoàn phần chênh.',
              `Chuyển đúng số tiền, đúng nội dung, mà sau ${ACTIVATION_SLA_HOURS} giờ gói vẫn chưa được bật: hoàn toàn bộ nếu bạn không muốn chờ tiếp.`,
              'Khoản chuyển không khớp được với đơn nào (thiếu hoặc sai mã) và bạn không muốn dùng nó cho một đơn mới: hoàn lại sau khi đối chiếu được giao dịch.',
            ],
          },
        ],
      },
      {
        id: 'change-of-mind',
        heading: `Đổi ý trong ${REFUND_WINDOW_DAYS} ngày`,
        blocks: [
          { kind: 'p', text: `Với đơn trả phí đầu tiên của tài khoản, trong ${REFUND_WINDOW_DAYS} ngày kể từ lúc gói được bật, bạn được hoàn toàn bộ nếu thấy app không hợp — không cần nêu lý do.` },
          {
            kind: 'list',
            items: [
              `Điều kiện: chưa tải cuốn nào trong bộ ${BOOK_TOTALS.count} sách PDF tặng kèm, nếu đơn có quà sách.`,
              'Gói được tắt ngay khi chúng tôi xác nhận hoàn.',
              'Mỗi tài khoản được hoàn kiểu đổi ý một lần.',
            ],
          },
        ],
      },
      {
        id: 'no-refund',
        heading: 'Không hoàn',
        blocks: [
          {
            kind: 'list',
            items: [
              `Quá ${REFUND_WINDOW_DAYS} ngày kể từ lúc gói được bật, hoặc từ đơn thứ hai trở đi: gói chạy tới hết hạn rồi về Free.`,
              'Đơn có quà sách mà bạn đã tải ít nhất một cuốn. Sách số không trả lại được như sách giấy, nên từ lúc tải, đơn đó không hoàn kiểu đổi ý nữa — trừ các trường hợp ở mục “Luôn được hoàn đủ”.',
              'Phần chênh lệch khi nhóm mua chung không đủ người: bù bằng ngày dùng, không bằng tiền, theo luật ở trang Mua theo nhóm.',
              'Gói bị khoá do vi phạm Điều khoản sử dụng.',
              'Dùng thử và tháng gói nhờ mời bạn: miễn phí, nên không có gì để hoàn.',
            ],
          },
        ],
      },
      {
        id: 'outage',
        heading: 'Khi app gặp sự cố',
        blocks: [
          { kind: 'p', text: `Nếu app ngừng hoạt động liên tục hơn ${OUTAGE_CREDIT_AFTER_HOURS} giờ vì lỗi phía chúng tôi, mọi gói đang chạy được cộng bù đúng số ngày bị gián đoạn, làm tròn lên.` },
        ],
      },
      {
        id: 'how',
        heading: 'Cách yêu cầu hoàn tiền',
        blocks: [
          {
            kind: 'list',
            items: [
              `Gửi yêu cầu qua ${contactVia(ctx.contact)}, kèm mã đơn (bắt đầu bằng RU, nằm trong nội dung chuyển khoản) và ảnh chụp giao dịch.`,
              `Chúng tôi đối chiếu và trả lời chậm nhất sau ${REFUND_REPLY_WORKDAYS} ngày làm việc.`,
              `Tiền hoàn về đúng tài khoản đã chuyển đi, trong ${REFUND_PROCESS_WORKDAYS} ngày làm việc kể từ khi xác nhận. Phí chuyển khoản, nếu có, do ReadUp chịu.`,
            ],
          },
        ],
      },
    ],
  };
}
