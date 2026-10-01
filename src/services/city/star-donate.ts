/**
 * ĐỔI SAO → VẬT LIỆU MỘT CHẠM — logic thuần (có test `star-donate.test.ts`).
 *
 * Người học chỉ nói "tôi dùng N sao"; hàm ở đây tự chia N sao thành đơn vật
 * liệu ("góp đều") rồi cả luồng đổi + góp đi qua luật có sẵn (`exchange`,
 * `applyContribution`) — không đường tắt nào mới:
 * - tầng đang thiếu loại nào thì mua loại đó trước, đều tay giữa các loại;
 * - còn sao thì mua tiếp theo đúng tỷ lệ gói vật liệu một tầng (`mix`);
 * - không vượt trần đổi hôm nay của từng loại, trần góp hôm nay, trần mỗi loại.
 */
import { ECONOMY, exchangeCost } from './economy';
import { MATERIAL_KINDS, type MaterialKind, type Materials } from './materials';

/** Tỷ lệ mặc định khi không biết cần gì (thành phố riêng chưa có công trường dang dở). */
export const DEFAULT_MIX: Materials = { wood: 4, stone: 3, brick: 3, steel: 1, glass: 1 };

export type StarPlan = {
  order: Materials;
  /** Sao sẽ tiêu. */
  cost: number;
  /** Số đơn vị vật liệu. */
  units: number;
  /** Sao còn dư (không đủ mua thêm gì). */
  left: number;
};

export type PlanOptions = {
  /** Phần cần LẤP TRƯỚC (vd: phần tầng đang thiếu). */
  first?: Partial<Materials>;
  /** Tỷ lệ cho phần sao còn lại. */
  mix?: Partial<Materials>;
  /** Trần đổi còn lại hôm nay, từng loại. */
  room: Materials;
  /** Trần tổng số đơn vị (vd: còn góp được hôm nay). Bỏ trống = không giới hạn. */
  maxUnits?: number;
  /** Trần mỗi loại cho cả đơn (vd: 300 mỗi lượt góp). */
  maxPerKind?: number;
};

const zero = (): Materials => ({ wood: 0, stone: 0, brick: 0, steel: 0, glass: 0 });
const price = (k: MaterialKind) => ECONOMY.exchange.price[k];

/**
 * Chia `stars` thành một đơn vật liệu, đều tay. Tất định: cùng đầu vào → cùng đơn.
 * Mỗi bước thêm 1 đơn vị cho loại mà SAU KHI thêm vẫn còn tụt lại nhất (đã có + 1 /
 * mục tiêu thấp nhất) — ít sao thì ưu tiên loại nhiều phần, rẻ trước; bỏ qua loại
 * hết trần hoặc không đủ sao.
 */
export function planStars(stars: number, opts: PlanOptions): StarPlan {
  const budget0 = Number.isFinite(stars) ? Math.max(0, Math.floor(stars)) : 0;
  const order = zero();
  let budget = budget0;
  let units = 0;
  const cap = (k: MaterialKind) => Math.max(0, Math.min(opts.room[k], opts.maxPerKind ?? Infinity));
  const canAdd = (k: MaterialKind) => order[k] < cap(k) && price(k) <= budget && units < (opts.maxUnits ?? Infinity);

  // Giai đoạn 1: lấp phần cần trước — mỗi loại không quá phần thiếu của nó.
  const first = opts.first ?? {};
  for (;;) {
    let pick: MaterialKind | null = null;
    let pickRatio = Infinity;
    for (const k of MATERIAL_KINDS) {
      const want = Math.max(0, Math.floor(first[k] ?? 0));
      if (want <= 0 || order[k] >= want || !canAdd(k)) continue;
      const ratio = (order[k] + 1) / want;
      if (ratio < pickRatio || (ratio === pickRatio && pick && price(k) < price(pick))) {
        pick = k;
        pickRatio = ratio;
      }
    }
    if (!pick) break;
    order[pick]++;
    units++;
    budget -= price(pick);
  }

  // Giai đoạn 2: sao còn lại theo tỷ lệ gói vật liệu (đếm riêng phần thêm vào).
  const mix = hasAny(opts.mix) ? opts.mix! : DEFAULT_MIX;
  const extra = zero();
  for (;;) {
    let pick: MaterialKind | null = null;
    let pickRatio = Infinity;
    for (const k of MATERIAL_KINDS) {
      const w = Math.max(0, mix[k] ?? 0);
      if (w <= 0 || !canAdd(k)) continue;
      const ratio = (extra[k] + 1) / w;
      if (ratio < pickRatio || (ratio === pickRatio && pick && price(k) < price(pick))) {
        pick = k;
        pickRatio = ratio;
      }
    }
    if (!pick) break;
    order[pick]++;
    extra[pick]++;
    units++;
    budget -= price(pick);
  }
  return { order, cost: budget0 - budget, units, left: budget };
}

function hasAny(m: Partial<Materials> | undefined): boolean {
  return !!m && MATERIAL_KINDS.some((k) => (m[k] ?? 0) > 0);
}

/**
 * Đơn tự chọn (từng loại): cắt về trần từng loại + trần tổng, cho đơn
 * không bao giờ bị luật từ chối vì vượt trần. Giữ thứ tự `MATERIAL_KINDS`.
 */
export function clampOrder(want: Partial<Materials> | undefined, opts: Pick<PlanOptions, 'room' | 'maxUnits' | 'maxPerKind'>): Materials {
  const out = zero();
  let left = opts.maxUnits ?? Infinity;
  for (const k of MATERIAL_KINDS) {
    const n = Math.max(0, Math.min(opts.room[k], opts.maxPerKind ?? Infinity, left, Math.floor(want?.[k] ?? 0)));
    out[k] = Number.isFinite(n) ? n : 0;
    left -= out[k];
  }
  return out;
}

/** Số sao nhiều nhất còn tiêu hết được (để nút "Tất cả" không đẩy người dùng vào đơn vượt trần). */
export function spendableStars(balance: number, opts: Pick<PlanOptions, 'room' | 'maxUnits' | 'maxPerKind'>): number {
  const max = clampOrder({ wood: Infinity, stone: Infinity, brick: Infinity, steel: Infinity, glass: Infinity }, opts);
  return Math.min(Math.max(0, Math.floor(balance)), exchangeCost(max));
}
