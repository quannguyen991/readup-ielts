import {
  PLANS,
  PLAN_ORDER,
  TRIAL_AI_PLAN,
  TRIAL_DAYS,
  TRIAL_PLAN,
  formatVnd,
} from '@/lib/billing/plans';
import { BOOK_TOTALS } from '@/services/books/catalog';
import { BOOK_BUNDLE_RULE } from '@/services/books/entitlement';
import { ACTIVATION_SLA_HOURS } from '@/services/payment/refund';
import {
  MAX_REWARD_PLAN,
  MAX_TIER_REFERRALS,
  REFERRALS_PER_REWARD,
  REWARD_MONTHS,
  REWARD_PLAN,
} from '@/services/referral/rewards';

import { LEGAL_UPDATED_AT, contactVia, operatorClause, type LegalContext, type LegalDoc } from './shared';

/**
 * Điều khoản sử dụng.
 *
 * Mỗi lời hứa ở đây ứng với một chỗ trong code: đổi gói thì tính lại từ hôm nay
 * (`/api/admin/payments`, nhánh `samePlan`), lượt mời hợp lệ là người được mời
 * đã có ít nhất một phiên học (`/api/referrals`), sách chỉ kèm đơn trả tiền thật
 * (`services/books/entitlement`). Sửa hành vi ở đó thì sửa câu chữ ở đây.
 */
export function termsDoc(ctx: LegalContext): LegalDoc {
  const paid = PLAN_ORDER.map((id) => PLANS[id]).filter((plan) => plan.monthlyVnd > 0);
  const pages = BOOK_TOTALS.pages.toLocaleString('vi-VN');

  return {
    id: 'terms',
    title: 'Điều khoản sử dụng',
    lead: 'Thoả thuận giữa bạn và ReadUp khi bạn dùng app. Giá, số ngày dùng thử và các thời hạn trong trang này lấy thẳng từ cấu hình của app, nên luôn khớp với thứ bạn thấy lúc mua.',
    updatedAt: LEGAL_UPDATED_AT,
    sections: [
      {
        id: 'service',
        heading: 'ReadUp là gì',
        blocks: [
          {
            kind: 'p',
            text: `ReadUp là ứng dụng web luyện thi IELTS và SAT${operatorClause(ctx.contact)}. Khi tạo tài khoản, mua gói hoặc tiếp tục dùng app, bạn đồng ý với các điều khoản dưới đây, cùng Chính sách quyền riêng tư và Chính sách hoàn tiền.`,
          },
          {
            kind: 'p',
            text: 'Phần lớn app dùng được mà không cần tài khoản; khi đó tiến độ chỉ nằm trong trình duyệt của bạn. Tài khoản cần cho việc đồng bộ nhiều máy, mua gói và nhận quà.',
          },
        ],
      },
      {
        id: 'account',
        heading: 'Tài khoản',
        blocks: [
          {
            kind: 'list',
            items: [
              'Bạn đăng nhập bằng email và tự giữ an toàn hộp thư đó — ai mở được hộp thư là đăng nhập được tài khoản.',
              'Mỗi tài khoản dành cho một người. Không chia sẻ, cho thuê hay bán lại tài khoản.',
              'Nếu bạn dưới 16 tuổi, cần có sự đồng ý của cha mẹ hoặc người giám hộ trước khi tạo tài khoản và thanh toán.',
              'Bạn xoá được tài khoản bất cứ lúc nào ở trang Cài đặt. Xoá là xoá vĩnh viễn dữ liệu học và lịch sử đơn hàng trên máy chủ; gói đang chạy mất theo. Muốn hoàn tiền thì gửi yêu cầu trước khi xoá.',
            ],
          },
        ],
      },
      {
        id: 'plans',
        heading: 'Gói trả phí và thanh toán',
        blocks: [
          {
            kind: 'list',
            items: paid.map(
              (plan) => `${plan.name}: ${formatVnd(plan.monthlyVnd)}/tháng hoặc ${formatVnd(plan.yearlyVnd)}/năm.`,
            ),
          },
          {
            kind: 'list',
            items: [
              'Thanh toán bằng chuyển khoản ngân hàng qua mã QR, kèm một mã đối chiếu riêng cho từng đơn. ReadUp không nhận thẻ và không bao giờ hỏi mật khẩu hay mã OTP ngân hàng của bạn.',
              `Gói được bật sau khi chúng tôi đối chiếu khoản tiền với mã đơn — thường trong vài giờ, chậm nhất là sang ngày hôm sau. Quá ${ACTIVATION_SLA_HOURS} giờ mà chưa bật, bạn được hoàn đủ nếu không muốn chờ.`,
              'Gói không tự gia hạn và không tự trừ tiền. Hết hạn thì tài khoản về Free; dữ liệu học giữ nguyên.',
              'Mua thêm đúng gói đang dùng thì thời hạn được cộng nối tiếp. Mua một gói khác khi gói cũ còn hạn thì gói mới tính từ lúc được bật, phần còn lại của gói cũ không cộng sang.',
              'Giá có thể thay đổi về sau, nhưng không đổi với kỳ bạn đã trả tiền.',
              'Mua theo nhóm có luật riêng ở trang Mua theo nhóm: nhóm không đủ người thì phần chênh lệch được bù bằng ngày dùng, không bằng tiền.',
            ],
          },
        ],
      },
      {
        id: 'trial',
        heading: 'Dùng thử',
        blocks: [
          {
            kind: 'p',
            text: `Mỗi tài khoản được học thử ${TRIAL_DAYS} ngày gói ${PLANS[TRIAL_PLAN].name}, một lần. Trong thời gian học thử, số lượt dùng AI vẫn theo gói ${PLANS[TRIAL_AI_PLAN].name} (${PLANS[TRIAL_AI_PLAN].quotas.ai_calls_per_month} lượt mỗi tháng). Học thử không cần thẻ và không tự chuyển thành gói trả phí; hết hạn là về Free.`,
          },
        ],
      },
      {
        id: 'books',
        heading: 'Bộ sách PDF tặng kèm',
        blocks: [
          {
            kind: 'p',
            text: `Mỗi đơn đã thanh toán của ${BOOK_BUNDLE_RULE} được tặng quyền tải ${BOOK_TOTALS.count} cuốn sách PDF (${pages} trang) ở trang Tủ sách.`,
          },
          {
            kind: 'list',
            items: [
              'Quà gắn với đơn đã trả tiền. Gói có được nhờ mời bạn, dùng thử hoặc do quản trị viên bật không kèm sách.',
              'Mỗi bản tải về được in email của bạn và mã đơn ở chân từng trang. Sách chỉ để bạn tự học: không chia sẻ, đăng lại hay bán lại, kể cả sau khi cắt bỏ dòng in.',
              'Quyền tải vẫn còn sau khi gói hết hạn, miễn là đơn không bị hoàn tiền.',
              'Đơn đã tải dù chỉ một cuốn thì không hoàn tiền kiểu đổi ý được nữa — xem Chính sách hoàn tiền.',
            ],
          },
        ],
      },
      {
        id: 'referral',
        heading: 'Mời bạn',
        blocks: [
          {
            kind: 'p',
            text: `Cứ ${REFERRALS_PER_REWARD} người bạn mời tạo tài khoản và học xong ít nhất một bài, bạn được cộng ${REWARD_MONTHS} tháng gói ${PLANS[REWARD_PLAN].name}. Từ ${MAX_TIER_REFERRALS} lượt mời hợp lệ trở đi, phần thưởng nâng lên gói ${PLANS[MAX_REWARD_PLAN].name}, và số tháng thưởng đang treo cũng được bật ở mức đó.`,
          },
          {
            kind: 'list',
            items: [
              'Phần thưởng không đổi được thành tiền và không chuyển cho người khác.',
              'Lượt mời gian lận — tự tạo nhiều tài khoản, mua bán lượt mời — bị huỷ cùng phần thưởng liên quan.',
              'Tháng gói có được nhờ mời bạn không kèm bộ sách PDF.',
            ],
          },
        ],
      },
      {
        id: 'content',
        heading: 'Nội dung, AI và nhãn hiệu',
        blocks: [
          {
            kind: 'list',
            items: [
              'Đề và bài tập trong app được dựng theo đúng dạng đề thi thật, nhưng không phải đề thi chính thức. Đề chính thức mà app dẫn tới đều mở ở trang của đơn vị ra đề.',
              'Điểm và nhận xét do AI đưa ra (chấm Writing, trợ giảng, chatbox) là ước lượng để luyện tập, không phải điểm thi chính thức, và có thể sai.',
              'Bài đọc lấy từ nguồn bên ngoài vẫn thuộc về tác giả và giữ giấy phép gốc; mỗi bài ghi tên nguồn.',
              'Giao diện, đề sinh bằng code, lời giải và bộ sách PDF thuộc về ReadUp. Bạn được dùng để tự học, không được sao chép hàng loạt hay dùng để làm sản phẩm khác.',
              'IELTS là nhãn hiệu của British Council, IDP: IELTS Australia và Cambridge University Press & Assessment. SAT là nhãn hiệu đã đăng ký của College Board. ReadUp không liên kết với và không được các tổ chức này bảo trợ.',
            ],
          },
        ],
      },
      {
        id: 'conduct',
        heading: 'Những việc không được làm',
        blocks: [
          {
            kind: 'list',
            items: [
              'Dùng công cụ tự động để tải hàng loạt bài đọc, đề hay lời giải.',
              'Tìm cách vượt giới hạn của gói hoặc hạn mức AI, hay truy cập dữ liệu của người khác.',
              'Dùng các tính năng AI để tạo nội dung trái pháp luật, hoặc cho việc không liên quan tới học với khối lượng lớn.',
              'Chia sẻ, đăng lại hay bán lại sách PDF và nội dung trả phí.',
            ],
          },
          {
            kind: 'p',
            text: 'Vi phạm thì chúng tôi có thể tạm khoá tính năng hoặc tài khoản. Nếu vi phạm liên quan tới gói trả phí, tiền của kỳ đó không được hoàn.',
          },
        ],
      },
      {
        id: 'liability',
        heading: 'Giới hạn trách nhiệm',
        blocks: [
          {
            kind: 'list',
            items: [
              'ReadUp là công cụ luyện tập; chúng tôi không cam kết một mức điểm thi cụ thể.',
              'App có thể tạm dừng để bảo trì hoặc khi nhà cung cấp hạ tầng gặp sự cố. Cách bù khi sự cố kéo dài nằm ở Chính sách hoàn tiền.',
              'Trong phạm vi pháp luật cho phép, trách nhiệm của chúng tôi với bạn không vượt quá số tiền bạn đã trả cho ReadUp trong 12 tháng gần nhất.',
            ],
          },
        ],
      },
      {
        id: 'changes',
        heading: 'Thay đổi điều khoản',
        blocks: [
          {
            kind: 'p',
            text: 'Khi đổi điều khoản, chúng tôi cập nhật ngày ở đầu trang, và báo trong app nếu thay đổi ảnh hưởng tới quyền lợi của bạn. Thay đổi không áp ngược lên kỳ bạn đã trả tiền.',
          },
        ],
      },
      {
        id: 'law',
        heading: 'Luật áp dụng',
        blocks: [
          {
            kind: 'p',
            text: 'Điều khoản này tuân theo pháp luật Việt Nam. Có tranh chấp thì hai bên thương lượng trước; không được thì đưa ra cơ quan có thẩm quyền tại Việt Nam giải quyết.',
          },
        ],
      },
      {
        id: 'contact',
        heading: 'Liên hệ',
        blocks: [{ kind: 'p', text: `Câu hỏi về điều khoản, gửi qua ${contactVia(ctx.contact)}.` }],
      },
    ],
  };
}
