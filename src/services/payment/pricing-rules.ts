import { PLANS, type PlanId } from '@/lib/billing/plans';

/**
 * Mọi cách một đơn hàng có thể được GIẢM GIÁ so với giá niêm yết — bốn nguồn,
 * và LUẬT DUY NHẤT khi nhiều nguồn cùng áp dụng: LẤY GIÁ THẤP NHẤT.
 *
 * VÌ SAO "LẤY THẤP NHẤT" CHỨ KHÔNG PHẢI "CỘNG DỒN %": bốn nguồn giảm giá này
 * được ba đề xuất độc lập và hai giám khảo thiết kế riêng lẻ, không ai tính tới
 * việc chúng chồng lên nhau. Cộng dồn % (vd giá đã giảm nhóm 30% rồi giảm thêm
 * 20% mùa cao điểm) ra một con số không ai kiểm chứng được là có hợp lý không —
 * và với tiền thật thì "không ai kiểm chứng được" là rủi ro, không phải tiện
 * ích. "Lấy thấp nhất" luôn RÕ RÀNG, luôn TEST ĐƯỢC bằng cách so bốn số, và
 * không bao giờ ra một mức giảm sâu hơn dự tính của TỪNG cơ chế riêng lẻ.
 *
 * File này CHỈ có hàm thuần — không đọc DB. Phần cần đọc DB (lịch sử thanh
 * toán để xét ưu đãi giữ giá cũ và gia hạn sớm, bảng payment_groups để xét mã
 * nhóm) nằm ở `app/api/payments/order+api.ts`, nơi có quyền truy cập Supabase.
 */

// --------------------------------------------------------------- mua theo nhóm

export type GroupSize = 3 | 5 | 10;

export const GROUP_BUY_SIZES: GroupSize[] = [3, 5, 10];

/**
 * Bậc giảm giá theo GÓI và SỐ NGƯỜI, LỆCH SÂU DẦN theo gói — không đều nhau.
 *
 * Đây là điểm cả hai giám khảo độc lập cùng chọn ghép vào bản cuối: Max có bậc
 * giảm SÂU NHẤT (tới 30%, so với Plus 20% và Pro 25%) để "rủ bạn mua Max theo
 * nhóm" trở thành đường tắt rẻ nhất lên gói cao nhất — đúng mục tiêu đẩy Max
 * mà không phải hạ giá niêm yết Max xuống thấp.
 *
 * CHỈ áp dụng gói trả tiền (không có `free`) và CHỈ chu kỳ NĂM — đối chiếu QR
 * thủ công theo nhóm mỗi THÁNG là quá tải cho một người vận hành một mình.
 */
export const GROUP_BUY_TIERS: Record<Exclude<PlanId, 'free'>, Record<GroupSize, number>> = {
  plus: { 3: 10, 5: 15, 10: 20 },
  pro: { 3: 12, 5: 18, 10: 25 },
  max: { 3: 15, 5: 22, 10: 30 },
};

export function isGroupBuyPlan(plan: PlanId): plan is Exclude<PlanId, 'free'> {
  return plan !== 'free';
}

export function groupBuyDiscountPercent(plan: PlanId, targetSize: GroupSize): number {
  return isGroupBuyPlan(plan) ? GROUP_BUY_TIERS[plan][targetSize] : 0;
}

/**
 * Giá NĂM đã giảm cho một mốc nhóm cụ thể — luôn tính từ giá niêm yết HIỆN TẠI
 * trong `plans.ts`, không lưu số tiền cứng ở đâu khác. Tăng giá niêm yết thì
 * giá nhóm tự đúng theo, không phải sửa hai chỗ.
 */
export function groupBuyYearlyPrice(plan: PlanId, targetSize: GroupSize): number {
  const percent = groupBuyDiscountPercent(plan, targetSize);
  return applyPercentDiscount(PLANS[plan].yearlyVnd, percent);
}

// ----------------------------------------------------------- flash sale theo mùa

export type FlashSaleWindow = {
  label: string;
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
  percent: number;
};

/**
 * Ba đợt cố định mỗi năm, bám lịch thi thật — không phải ngày chọn ngẫu nhiên.
 * Cả ba đều nằm gọn trong MỘT tháng nên không cần xử lý vắt qua giao thừa năm.
 */
export const FLASH_SALE_WINDOWS: FlashSaleWindow[] = [
  { label: 'Mùa nộp hồ sơ ED/EA', startMonth: 1, startDay: 1, endMonth: 1, endDay: 2, percent: 20 },
  { label: 'Hè ôn SAT', startMonth: 6, startDay: 1, endMonth: 6, endDay: 2, percent: 20 },
  { label: 'Mùa IELTS cuối năm', startMonth: 9, startDay: 1, endMonth: 9, endDay: 2, percent: 20 },
];

function monthDayKey(month: number, day: number): number {
  return month * 100 + day;
}

/** Đợt flash sale đang chạy tại thời điểm `now`, hoặc `null` nếu không có. */
export function activeFlashSale(now: Date = new Date()): FlashSaleWindow | null {
  const key = monthDayKey(now.getMonth() + 1, now.getDate());
  return (
    FLASH_SALE_WINDOWS.find((w) => key >= monthDayKey(w.startMonth, w.startDay) && key <= monthDayKey(w.endMonth, w.endDay)) ??
    null
  );
}

// -------------------------------------------------------------- gia hạn sớm

export const EARLY_RENEWAL_WINDOW_DAYS = 7;
export const EARLY_RENEWAL_DISCOUNT_PERCENT = 5;

/**
 * Gia hạn sớm: gói HIỆN TẠI còn hạn (chưa hết), và còn ĐÚNG trong cửa sổ ngày
 * cho phép trước khi hết. Đã hết hạn rồi thì đó là "mua lại", không phải "gia
 * hạn sớm" — không áp ưu đãi này.
 */
export function isEligibleForEarlyRenewal(
  planExpiresAtIso: string | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!planExpiresAtIso) return false;
  const msLeft = new Date(planExpiresAtIso).getTime() - now.getTime();
  if (msLeft <= 0) return false;
  const daysLeft = msLeft / (24 * 3600 * 1000);
  return daysLeft <= EARLY_RENEWAL_WINDOW_DAYS;
}

// --------------------------------------------------------- giữ giá cũ (grandfather)

/**
 * Mốc tăng giá đợt này. Ai có đơn TRẢ TIỀN THÀNH CÔNG cho đúng gói+chu kỳ này
 * TRƯỚC mốc này thì đơn GIA HẠN TIẾP THEO của họ (chỉ một lần) vẫn tính theo
 * giá cũ — xem cách dùng ở `app/api/payments/order+api.ts`.
 */
export const PRICE_CHANGE_CUTOFF_ISO = '2026-09-03T00:00:00.000Z';

export function isBeforePriceCutoff(paidAtIso: string | null | undefined): boolean {
  if (!paidAtIso) return false;
  return new Date(paidAtIso).getTime() < new Date(PRICE_CHANGE_CUTOFF_ISO).getTime();
}

// --------------------------------------------------------------------- chọn giá

export type PriceSource = 'base' | 'grandfather' | 'group' | 'flash_sale' | 'early_renewal';

export type PriceCandidate = {
  source: PriceSource;
  amountVnd: number;
  /** Câu giải thích ngắn, hiện được thẳng cho người dùng ở trang thanh toán. */
  label: string;
};

/**
 * Chọn ứng viên RẺ NHẤT trong danh sách. Luôn có ít nhất một ứng viên (`base`),
 * nên hàm này không cần xử lý mảng rỗng.
 */
export function cheapestCandidate(candidates: PriceCandidate[]): PriceCandidate {
  return candidates.reduce((best, c) => (c.amountVnd < best.amountVnd ? c : best));
}

/**
 * Giảm `percent`% trên `amountVnd`, làm tròn về nghìn đồng gần nhất.
 *
 * Làm tròn về nghìn vì đây là số tiền phải KHỚP TUYỆT ĐỐI với một giao dịch
 * chuyển khoản ngân hàng thật — 399.500đ là số khó gõ và dễ gõ sai hơn 400.000đ,
 * mà sai một đồng thì đối chiếu tay không khớp được.
 */
export function applyPercentDiscount(amountVnd: number, percent: number): number {
  if (percent <= 0) return amountVnd;
  const discounted = (amountVnd * (100 - percent)) / 100;
  return Math.round(discounted / 1000) * 1000;
}
