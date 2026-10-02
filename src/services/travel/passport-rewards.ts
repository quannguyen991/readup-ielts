/**
 * PHẦN THƯỞNG CỦA HỘ CHIẾU — mọi con số ở MỘT chỗ, chỉnh ở đây, test canh theo đây.
 *
 * ĐIỂM HỘ CHIẾU kiếm từ: con dấu thành phố, địa điểm đạt 2–3 sao, quà lưu niệm,
 * ngày có đi du ngoạn (kèm chuỗi ngày), câu trả lời đúng (có trần mỗi ngày).
 * Điểm ghi vào sổ cái (`pp:`), xem `passport.ts`.
 *
 * "PRO MAX": app CÓ gói Max thật (`lib/billing/plans.ts`) nhưng nó mở thêm chứng
 * chỉ ký số và gấp sáu lượt AI — những thứ máy chủ kiểm theo `profiles.plan`, mà
 * vé nhận ở máy chỉ ghi `source: 'local'`. Nên quà "Pro Max" ở đây là MỘT KỲ HẠN
 * GÓI CÓ HẠN qua đúng cơ chế vé gói bằng sao (`lib/billing/star-pass.ts`), mở
 * nội dung, KHÔNG cộng lượt AI. Gói được cấp là `PRO_MAX_GRANT.plan`; đổi 'pro'
 * thành 'max' để cấp hẳn gói Max (khi đã có chỗ máy chủ xác nhận).
 */
import type { PlanId } from '@/lib/billing/plans';

export const PASSPORT_POINTS = {
  /** Đóng dấu một thành phố (một lần cho mỗi thành phố). */
  stamp: 50,
  /** Địa điểm lần đầu đạt 2 sao / lần đầu đạt 3 sao (mỗi mốc một lần). */
  poiTwoStars: 10,
  poiThreeStars: 8,
  /** Quà lưu niệm lần đầu có. */
  souvenir: 5,
  /** Ngày đầu tiên trong ngày có đi du ngoạn (làm xong một lượt). */
  dailyTravel: 3,
  /** Thưởng thêm theo chuỗi ngày: (số ngày liền − 1) × `streakPerDay`, tối đa `streakMax`. */
  streakPerDay: 1,
  streakMax: 7,
  /** Mỗi câu đúng; trần mỗi ngày. */
  perCorrect: 1,
  correctDailyCap: 20,
} as const;

export type RewardGrant =
  | { kind: 'stars'; amount: number }
  | { kind: 'tickets'; amount: number }
  | { kind: 'coins'; amount: number }
  | { kind: 'avatar'; itemId: string }
  | { kind: 'pro'; days: number }
  | { kind: 'promax' };

export type Tier = {
  id: string;
  /** Điểm hộ chiếu cần có. */
  points: number;
  grants: RewardGrant[];
  /** Mốc đỉnh: hiện nổi bật. */
  top?: boolean;
};

/** Gói cấp cho quà "Pro Max" và số ngày. Xem ghi chú đầu tệp. */
export const PRO_MAX_GRANT: { plan: Extract<PlanId, 'plus' | 'pro' | 'max'>; days: number; label: { vi: string; en: string } } = {
  plan: 'pro',
  days: 30,
  label: { vi: 'Pro Max (30 ngày)', en: 'Pro Max (30 days)' },
};

export const TIERS: readonly Tier[] = [
  { id: 'p040', points: 40, grants: [{ kind: 'stars', amount: 100 }] },
  { id: 'p120', points: 120, grants: [{ kind: 'tickets', amount: 2 }] },
  { id: 'p250', points: 250, grants: [{ kind: 'coins', amount: 150 }, { kind: 'avatar', itemId: 'avatar-lion' }] },
  { id: 'p450', points: 450, grants: [{ kind: 'pro', days: 7 }] },
  { id: 'p800', points: 800, grants: [{ kind: 'stars', amount: 500 }, { kind: 'tickets', amount: 3 }] },
  { id: 'p1400', points: 1400, grants: [{ kind: 'promax' }, { kind: 'avatar', itemId: 'avatar-crown' }], top: true },
];

/** "Giải tháng này" của bảng Ai đi nhiều nhất. Phát giải do quản trị làm tay — app không tự trao. */
export const MONTHLY_PRIZES: readonly { upTo: number; label: { vi: string; en: string } }[] = [
  { upTo: 1, label: { vi: 'Gói Pro Max', en: 'Pro Max plan' } },
  { upTo: 3, label: { vi: 'Pro 30 ngày', en: '30 days of Pro' } },
  { upTo: 10, label: { vi: 'Pro 7 ngày', en: '7 days of Pro' } },
];

export function prizeLabelForRank(rank: number): { vi: string; en: string } | null {
  if (!Number.isInteger(rank) || rank < 1) return null;
  return MONTHLY_PRIZES.find((p) => rank <= p.upTo)?.label ?? null;
}
