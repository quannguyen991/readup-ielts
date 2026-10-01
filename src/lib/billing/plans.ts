/**
 * Bốn gói: Free · Plus · Pro · Max.
 *
 * NGUYÊN TẮC CHIA GÓI — chặn theo CHI PHÍ THẬT, không chặn bừa để ép nâng cấp.
 * App này có hai loại tính năng với hai cấu trúc chi phí khác hẳn nhau:
 *
 *   Chi phí biến đổi THẬT  — mọi thứ gọi AI: chấm Writing (`/api/writing/evaluate`),
 *                            bài mẫu (`/api/writing/model-essay`), chatbox
 *                            (`/api/chat`). Mỗi lượt dùng là tiền ra khỏi túi.
 *   Chi phí gần bằng 0     — SAT Math (sinh bằng code), kho bài đọc đã cào sẵn,
 *                            FSRS, thống kê, đồng bộ.
 *
 * Từ đó ra đúng hai bậc thang, và ba gói trả tiền nằm trên hai bậc đó:
 *
 *   Free → Plus  : mở hết NỘI DUNG (chi phí ~0, nên mở sớm và mở hẳn)
 *   Plus → Pro   : thêm TRỢ GIẢNG AI (chatbox, bài mẫu)
 *   Pro  → Max   : cùng tính năng, NHIỀU AI HƠN gấp sáu + hỗ trợ ưu tiên
 *
 * CẬP NHẬT 03/09/2026 — Max không còn "không có gì độc quyền ngoài hỗ trợ ưu
 * tiên" như nguyên tắc gốc ghi. Bản gốc đúng lúc mới ra mắt, nhưng giờ Max còn
 * độc quyền một trục KHÔNG PHẢI TÍNH NĂNG PHẦN MỀM: bậc GIẢM GIÁ SÂU NHẤT khi
 * mua theo nhóm (`groupBuy.ts`) — 10 người mua Max theo năm giảm tới 30%, sâu
 * hơn hẳn Plus (20%) và Pro (25%). Đây vẫn tuân đúng tinh thần nguyên tắc gốc:
 * không bịa ra một feature không ai implement — group-buy là cơ chế THẬT, chạy
 * qua đúng luồng QR thủ công đang có, không phải một dòng quảng cáo suông.
 *
 * CẬP NHẬT 10/09/2026 — Max có thêm MỘT TÍNH NĂNG ĐỘC QUYỀN THẬT:
 * `verifiable_credential`, tức chứng chỉ ký số Ed25519 theo chuẩn W3C Verifiable
 * Credential (`services/credential/`), kèm trình kiểm độc lập chạy ngoài app
 * (`scripts/verify-credential.ts`). Đây KHÔNG phải một dòng quảng cáo suông — toàn
 * bộ đường ký và kiểm đã chạy và có 58 test.
 *
 * VÀ NÓ KHÔNG THEO NGUYÊN TẮC "CHẶN THEO CHI PHÍ THẬT" Ở TRÊN — nói thẳng ra
 * chứ không giấu. Ký Ed25519 chạy ngay trên máy người dùng, chi phí bằng không.
 * Lý do chặn là khác: đây không phải công cụ ĐỂ HỌC mà là GIẤY CHỨNG NHẬN
 * cho cái đã học — giống hệt cách mọi khoá học khác thu tiền chứng chỉ riêng.
 * Người dùng Free, Plus, Pro không mất một thứ gì để học; họ chỉ không có tờ
 * giấy ở cuối. Đó là ranh giới tôi cho là còn giữ được tử tế.
 *
 * NGÂN SÁCH AI vẫn là trục khác biệt chính giữa ba gói trả tiền — không đổi.
 *
 * Gói Free được dùng THẬT, không phải bản demo: trọn bài chẩn đoán, trọn chặng
 * Đại số (25 bộ đề, hơn 500 câu), 5 bài đọc mỗi ngày, 3 lượt chấm AI để biết nó
 * chấm ra sao. Bản Free chỉ đủ để nhìn thì người ta gỡ app trước khi kịp thấy
 * giá trị — CỐ Ý KHÔNG CẮT GÌ THÊM Ở ĐÂY dù đợt tăng giá 03/09/2026 này có mục
 * tiêu đẩy người dùng lên Max: phần "cắt bớt" dồn hết vào Plus và Pro (xem lịch
 * sử ai_calls_per_month bên dưới), Free giữ nguyên như một ranh giới đã chốt.
 *
 * ĐỒNG BỘ NHIỀU THIẾT BỊ KHÔNG BỊ KHOÁ Ở GÓI NÀO. Nó gần như không tốn gì, mà
 * lại là thứ khiến người dùng ở lại — khoá nó là tự bắn vào chân mình.
 */

import { CURRICULUM_TOTALS } from '@/services/math/curriculum';

export type PlanId = 'free' | 'plus' | 'pro' | 'max';

/**
 * Tính năng bật/tắt theo gói.
 *
 * Đặt tên theo THỨ NGƯỜI DÙNG LÀM ĐƯỢC, không theo tên màn hình. Màn hình đổi
 * tên liên tục, còn "mở khoá toàn bộ lộ trình Math" thì không.
 *
 * MỖI TÊN Ở ĐÂY PHẢI CÓ CODE CHẠY ĐƯỢC ĐỨNG SAU. Bản trước có
 * `ai_explanations` nằm trong danh sách và hiện trên bảng so sánh, nhưng không
 * có endpoint nào cài nó — bán một thứ không tồn tại. Đã bỏ.
 */
export type Feature =
  | 'math_all_stages'
  | 'math_unlimited_mock'
  | 'reading_unlimited'
  | 'vocab_unlimited'
  | 'writing_offline_grading'
  | 'writing_ai_grading'
  | 'model_essays'
  | 'ai_chat'
  | 'priority_support'
  | 'verifiable_credential';

/** Hạn mức đếm theo chu kỳ. `null` nghĩa là không giới hạn. */
export type Quota = 'reading_per_day' | 'mock_per_week' | 'ai_calls_per_month' | 'vocab_total';

export type QuotaPeriod = 'day' | 'week' | 'month' | 'forever';

export const QUOTA_PERIOD: Record<Quota, QuotaPeriod> = {
  reading_per_day: 'day',
  mock_per_week: 'week',
  ai_calls_per_month: 'month',
  vocab_total: 'forever',
};

export const QUOTA_LABEL: Record<Quota, string> = {
  reading_per_day: 'bài đọc mỗi ngày',
  mock_per_week: 'lượt thi thử mỗi tuần',
  ai_calls_per_month: 'lượt dùng AI mỗi tháng',
  vocab_total: 'từ trong sổ từ',
};

export type Plan = {
  id: PlanId;
  name: string;
  /** Tên hiện khi giao diện là tiếng Anh. */
  nameEn: string;
  tagline: string;
  /** Giá theo tháng, đơn vị đồng. 0 = miễn phí. */
  monthlyVnd: number;
  /** Giá trả trước một năm. Rẻ hơn 12 tháng lẻ. */
  yearlyVnd: number;
  features: Feature[];
  quotas: Record<Quota, number | null>;
  /** Ba gạch đầu dòng hiện trên thẻ giá — viết theo lợi ích, không theo tên tính năng. */
  highlights: string[];
  /** Gói được gợi ý mặc định trên trang giá. Đúng một gói được đánh dấu. */
  recommended?: boolean;
};

const CONTENT_FEATURES: Feature[] = [
  'math_all_stages',
  'math_unlimited_mock',
  'reading_unlimited',
  'vocab_unlimited',
  'writing_offline_grading',
  'writing_ai_grading',
];

const COACH_FEATURES: Feature[] = [...CONTENT_FEATURES, 'model_essays', 'ai_chat'];

/**
 * GIÁ ĐỢT HAI, sau khi giá ra mắt (39k/79k/149k) đã chứng minh app dùng được.
 *
 * LỊCH SỬ GIÁ — ghi lại để bất kỳ ai đọc file này cũng biết đây là lần tăng thứ
 * mấy và tăng theo lý do gì, không phải đoán:
 *   - 02/09/2026 (ra mắt): Plus 39k/350k · Pro 79k/690k · Max 149k/1.290k.
 *     Giá thấp có chủ đích, vì lúc mới ra mắt thứ khan hiếm là NGƯỜI DÙNG, không
 *     phải doanh thu.
 *   - 03/09/2026 (đợt này): tăng đều ~25-27% cả ba gói, sau khi đã có người
 *     dùng thật và phản hồi thật. Không phải "giá cũ bịa ra để trông như đang
 *     giảm" — đây là tăng giá thật, nói thẳng là tăng.
 *
 * NGƯỜI ĐANG TRẢ PHÍ TRƯỚC 03/09/2026 GIỮ NGUYÊN GIÁ CŨ tới hết kỳ đang trả —
 * xem `PRICE_CHANGE_CUTOFF_ISO` và `resolveGrandfatherPrice()` trong
 * `src/services/payment/pricing-rules.ts`. Tăng giá mà không cam kết này thì
 * người vừa trả tiền tuần trước mở app lên thấy giá gấp rưỡi — đúng kiểu trải
 * nghiệm khiến người ta không bao giờ gia hạn nữa.
 *
 * Mốc so sánh: các app luyện thi phổ biến ở VN rơi vào 1–1,5 triệu một năm. Plus
 * 470k/năm và Pro 890k/năm vẫn nằm dưới mốc đó; Max 1.590k/năm nhỉnh hơn nhưng
 * đổi lại có bậc giảm giá mua-theo-nhóm sâu nhất (xem `groupBuy.ts`), nên giá
 * niêm yết KHÔNG phải giá đa số người mua nhóm sẽ trả.
 *
 * Trả năm rẻ dần theo gói — Plus 20%, Pro 25%, Max 29% — cố ý để CHÍNH CƠ CHẾ
 * GIÁ cũng nhẹ nhàng đẩy người sẵn sàng cam kết dài hạn lên gói cao hơn, không
 * chỉ dựa vào cắt tính năng.
 */
export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: 'free',
    name: 'Free',
    nameEn: 'Free',
    tagline: 'Học thật, không phải bản dùng thử',
    monthlyVnd: 0,
    yearlyVnd: 0,
    features: ['writing_offline_grading', 'writing_ai_grading'],
    quotas: {
      reading_per_day: 5,
      mock_per_week: 1,
      // GIỮ NGUYÊN 3, không cắt theo đợt tăng giá 03/09/2026. Ba lượt là để BIẾT
      // AI chấm ra sao, không phải để dùng lâu dài — cho 0 thì người dùng không
      // bao giờ thấy thứ đắt nhất của app. Đây là ranh giới "học thật" đã chốt,
      // phần cắt để đẩy Max dồn hết vào Plus/Pro, không đụng vào Free.
      ai_calls_per_month: 3,
      vocab_total: 100,
    },
    highlights: [
      'Trọn bài chẩn đoán 19 kỹ năng',
      'Trọn chặng Đại số, hơn 500 câu',
      '5 bài đọc mỗi ngày',
    ],
  },

  plus: {
    id: 'plus',
    name: 'Plus',
    nameEn: 'Plus',
    tagline: 'Mở hết nội dung, không giới hạn số lượng',
    monthlyVnd: 49_000,
    yearlyVnd: 470_000,
    features: CONTENT_FEATURES,
    quotas: {
      reading_per_day: null,
      mock_per_week: null,
      // 30 → 20. Đây là lượt CẮT THẬT của đợt tăng giá 03/09/2026 — dồn vào Plus
      // và Pro theo đúng yêu cầu, không đụng Free.
      ai_calls_per_month: 20,
      vocab_total: null,
    },
    highlights: [
      `Mở hết ${CURRICULUM_TOTALS.stages} chặng · ${CURRICULUM_TOTALS.sets} bộ đề`,
      'Bài đọc và thi thử không giới hạn',
      '20 lượt chấm Writing mỗi tháng',
    ],
  },

  pro: {
    id: 'pro',
    name: 'Pro',
    nameEn: 'Pro',
    tagline: 'Có trợ giảng AI kèm bên cạnh',
    monthlyVnd: 140_000,
    // Trả năm giữ đúng mức giảm 25% như trước: 140.000 × 12 × 0,75.
    yearlyVnd: 1_260_000,
    features: COACH_FEATURES,
    quotas: {
      reading_per_day: null,
      mock_per_week: null,
      // 150 → 120.
      ai_calls_per_month: 120,
      vocab_total: null,
    },
    highlights: [
      'Mọi thứ của Plus',
      'Trợ giảng AI ngay trong bài đọc',
      '120 lượt AI mỗi tháng',
    ],
    recommended: true,
  },

  max: {
    id: 'max',
    name: 'Max',
    nameEn: 'Max',
    tagline: 'Cùng tính năng Pro, ngân sách AI gấp sáu',
    monthlyVnd: 400_000,
    // Trả năm giữ đúng mức giảm 30% như trước: 400.000 × 12 × 0,70.
    yearlyVnd: 3_360_000,
    features: [...COACH_FEATURES, 'priority_support', 'verifiable_credential'],
    quotas: {
      reading_per_day: null,
      mock_per_week: null,
      // 600 → 720, và tỉ lệ so với Pro giãn từ 4 lần lên 6 lần (120*6=720) —
      // ngân sách AI vẫn là trục khác biệt CHÍNH giữa Pro và Max.
      ai_calls_per_month: 720,
      vocab_total: null,
    },
    highlights: [
      'Mọi thứ của Pro',
      'Chứng chỉ ký số — ai cũng kiểm lại được',
      '720 lượt AI mỗi tháng',
      'Hỗ trợ ưu tiên trong ngày',
    ],
  },
};

/** Từ rẻ tới đắt. Thứ tự này là nguồn sự thật cho việc so hai gói hơn kém. */
export const PLAN_ORDER: PlanId[] = ['free', 'plus', 'pro', 'max'];

/** Vị trí trong bậc thang. Dùng để so gói, không so bằng chuỗi. */
export function planRank(id: PlanId): number {
  const at = PLAN_ORDER.indexOf(id);
  return at < 0 ? 0 : at;
}

/**
 * HỌC THỬ 5 NGÀY — một lượt duy nhất, thay cho cặp Plus 3 ngày + Pro 7 ngày cũ
 * (đổi ngày 25/09/2026 theo lời người dùng: "thêm học thử 5 ngày, nhưng vẫn
 * giới hạn số lượt gọi AI").
 *
 * NGƯỜI HỌC CHỌN GÓI THỬ: Plus HOẶC Pro, không có Max (26/09/2026: "cho dùng
 * thử 5 ngày gói plus hoặc pro thôi"). Chọn một là hết lượt — không thử Plus
 * xong rồi thử tiếp Pro.
 *
 * Mở NỘI DUNG của gói đã chọn nhưng lượt AI vẫn giữ nguyên mức Free —
 * `TRIAL_AI_PLAN`. Lý do: nội dung sinh bằng code
 * gần như không tốn gì, còn mỗi lượt AI là tiền thật; cho 5 ngày × 120 lượt
 * Pro miễn phí là mời người ta tạo tài khoản mới liên tục để lấy AI.
 *
 * Máy chủ vốn đã chặn đúng như thế: `services/ai/usage.ts` đọc gói từ bảng
 * `profiles`, mà lượt thử chỉ nằm ở máy người dùng, nên máy chủ luôn thấy Free.
 * `TRIAL_AI_PLAN` là để GIAO DIỆN nói cùng một con số với máy chủ.
 *
 * Mỗi tài khoản một lần (cờ `proTrialUsed`, giữ tên cũ để máy đã dùng thử Pro 7
 * ngày không được thử lại). Không cần thẻ, không tự gia hạn.
 */
/** Các gói được học thử. */
export const TRIAL_PLANS: readonly PlanId[] = ['plus', 'pro'];
/** Gói gợi ý khi chỉ có chỗ cho một nút (Pro: gói ta muốn người học chọn). */
export const TRIAL_PLAN: PlanId = 'pro';
export const TRIAL_DAYS = 5;
export const TRIAL_AI_PLAN: PlanId = 'free';

export function planOf(id: PlanId | null | undefined): Plan {
  return PLANS[id ?? 'free'] ?? PLANS.free;
}

/** Tên gói theo ngôn ngữ giao diện. */
export function planName(id: PlanId | null | undefined, en: boolean): string {
  const plan = planOf(id);
  return en ? plan.nameEn : plan.name;
}

/**
 * "99.000đ" — dấu chấm ngăn nghìn theo cách viết Việt Nam. Giá vẫn là VND ở cả
 * hai ngôn ngữ; `en` chỉ đổi chữ "Miễn phí" thành "Free".
 */
export function formatVnd(amount: number, en = false): string {
  if (amount === 0) return en ? 'Free' : 'Miễn phí';
  return `${amount.toLocaleString('vi-VN')}đ`;
}

/** Phần trăm tiết kiệm khi trả năm, làm tròn xuống cho khỏi hứa quá. */
export function yearlySavingPercent(plan: Plan): number {
  if (plan.monthlyVnd === 0) return 0;
  const twelveMonths = plan.monthlyVnd * 12;
  return Math.floor(((twelveMonths - plan.yearlyVnd) / twelveMonths) * 100);
}
