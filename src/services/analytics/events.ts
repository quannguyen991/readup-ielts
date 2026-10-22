import type { PlanId } from '@/lib/billing/plans';
import type { BillingCycle } from '@/services/payment/order';

/**
 * Sự kiện đo lường của ReadUp, và bản dịch sang Meta Pixel và Google Analytics 4.
 *
 * TÁCH KHỎI PHẦN TẢI SCRIPT để test được. Gõ sai tên một sự kiện chuẩn của Meta
 * ("Purchased" thay vì "Purchase") thì chiến dịch mất tín hiệu tối ưu mà không có
 * lỗi nào hiện ra: Meta không báo "không nhận ra", nó chỉ lặng lẽ không đếm.
 *
 * NĂM SỰ KIỆN, đúng năm bậc của phễu bán hàng: xem trang → tạo tài khoản → xem
 * bảng giá → tạo đơn → trả tiền. Không đo từng cú bấm trong bài học — đó là dữ
 * liệu học của người dùng, không phải thứ đem cho nền tảng quảng cáo.
 *
 * KHÔNG SỰ KIỆN NÀO MANG EMAIL HAY TÊN. Đường dẫn trang cũng bỏ phần query: mã
 * mời và mã nhóm mua chung nằm ở đó, và chúng không có lý do gì để đi ra ngoài.
 */

export type AppEvent =
  | { name: 'page_view'; path: string; url: string }
  | { name: 'start_lesson'; lessonId?: string; type?: string }
  | { name: 'complete_lesson'; lessonId?: string; score?: number }
  | { name: 'sign_up' }
  | { name: 'upgrade'; plan?: string }
  | { name: 'view_pricing' }
  | { name: 'begin_checkout'; plan: PlanId; cycle: BillingCycle; valueVnd: number; orderId: string }
  | { name: 'purchase'; plan: PlanId; cycle: BillingCycle; valueVnd: number; orderId: string };

export type MetaCall = { event: string; params?: Record<string, unknown>; eventId?: string };
export type GaCall = { event: string; params: Record<string, unknown> };

const CURRENCY = 'VND';

/** Bỏ query và phần sau dấu # khỏi một đường dẫn hay URL. */
export function stripQuery(pathOrUrl: string): string {
  const cut = pathOrUrl.search(/[?#]/);
  return cut === -1 ? pathOrUrl : pathOrUrl.slice(0, cut);
}

function itemId(plan: PlanId, cycle: BillingCycle): string {
  return `${plan}-${cycle}`;
}

function gaItem(event: { plan: PlanId; cycle: BillingCycle; valueVnd: number }) {
  return {
    item_id: itemId(event.plan, event.cycle),
    item_name: `ReadUp ${event.plan} ${event.cycle}`,
    price: event.valueVnd,
    quantity: 1,
  };
}

export function toMeta(event: AppEvent): MetaCall {
  switch (event.name) {
    case 'page_view':
      return { event: 'PageView' };
    case 'start_lesson':
      return { event: 'StartTrial', params: { content_name: event.lessonId || 'lesson', content_category: event.type } };
    case 'complete_lesson':
      return { event: 'SubmitApplication', params: { content_name: event.lessonId || 'lesson', score: event.score } };
    case 'sign_up':
      return { event: 'CompleteRegistration', params: { status: true } };
    case 'upgrade':
      return { event: 'InitiateCheckout', params: { content_name: 'upgrade', plan: event.plan } };
    case 'view_pricing':
      return { event: 'ViewContent', params: { content_name: 'pricing', content_category: 'plans' } };
    case 'begin_checkout':
    case 'purchase': {
      const purchase = event.name === 'purchase';
      return {
        event: purchase ? 'Purchase' : 'InitiateCheckout',
        params: {
          value: event.valueVnd,
          currency: CURRENCY,
          content_ids: [itemId(event.plan, event.cycle)],
          content_type: 'product',
          num_items: 1,
        },
        // Mã theo đơn: cùng một đơn bị gửi hai lần thì Meta tự bỏ bản trùng.
        eventId: `${purchase ? 'purchase' : 'checkout'}-${event.orderId}`,
      };
    }
  }
}

export function toGa(event: AppEvent): GaCall {
  switch (event.name) {
    case 'page_view':
      return {
        event: 'page_view',
        params: { page_location: stripQuery(event.url), page_path: stripQuery(event.path) },
      };
    case 'start_lesson':
      return { event: 'level_start', params: { level_name: event.lessonId || 'lesson', character: event.type } };
    case 'complete_lesson':
      return { event: 'level_end', params: { level_name: event.lessonId || 'lesson', success: true, score: event.score } };
    case 'sign_up':
      return { event: 'sign_up', params: { method: 'email' } };
    case 'upgrade':
      return { event: 'upgrade', params: { plan: event.plan ?? 'plus' } };
    case 'view_pricing':
      return { event: 'view_item_list', params: { item_list_id: 'pricing', item_list_name: 'pricing' } };
    case 'begin_checkout':
      return {
        event: 'begin_checkout',
        params: { currency: CURRENCY, value: event.valueVnd, items: [gaItem(event)] },
      };
    case 'purchase':
      return {
        event: 'purchase',
        params: {
          transaction_id: event.orderId,
          currency: CURRENCY,
          value: event.valueVnd,
          items: [gaItem(event)],
        },
      };
  }
}
