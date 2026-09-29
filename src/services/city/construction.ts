/**
 * XÂY DỰNG THEO CÔNG ĐOẠN — logic thuần, có test (`construction.test.ts`).
 *
 * Một công trình đi qua các công đoạn trong catalog (tối đa 9: khảo sát → cảnh
 * quan). Mỗi BƯỚC cần:
 *   1. vật liệu của bước được GIAO tới công trường (trừ kho lúc giao — không trừ
 *      cả công trình lúc đặt bản thiết kế);
 *   2. một TỔ ĐỘI được phân công;
 *   3. đủ số CA làm việc — ca chỉ sinh ra từ việc học (`economy.ts`);
 *   4. riêng móng: đủ thời gian đông cứng (~1 giờ). Hết giờ mà thiếu ca / vật
 *      liệu thì vẫn đứng yên.
 * Không có nút bỏ qua bước, không có đường trả tiền để nhanh hơn.
 *
 * Cao ốc: công đoạn 4 chia thành dựng cần cẩu rồi CHU KỲ TỪNG TẦNG (khung →
 * sàn → mặt dựng → mép tầng). Không xong 20 tầng sau một ca.
 */
import { catalogItem, isTower, type CatalogBuilding, type CrewId, type Era } from '@/data/city/catalog';
import { add, EMPTY_MATERIALS, hasMaterials, isEmptyCost, MATERIAL_KINDS, subtract, type Materials } from './materials';

export type StageInfo = { vi: string; en: string; glyph: string; detailVi: string; detailEn: string };

/** Chín công đoạn chung (chỉ số 0..8). */
export const STAGES: readonly StageInfo[] = [
  { vi: 'Khảo sát', en: 'Survey', glyph: '📐', detailVi: 'Cắm cọc mốc, căng dây, dựng biển dự án.', detailEn: 'Stakes, string lines and a project sign.' },
  { vi: 'Dọn mặt bằng', en: 'Site clearing', glyph: '🪓', detailVi: 'Dọn cây bụi, lộ nền đất, tập kết dụng cụ.', detailEn: 'Clear shrubs, expose the soil, stage tools.' },
  { vi: 'Đào móng', en: 'Excavation', glyph: '⛏️', detailVi: 'Đào hố móng, đất đổ đống bên cạnh.', detailEn: 'Dig the foundation pit, pile the soil.' },
  { vi: 'Làm móng', en: 'Foundation', glyph: '🧱', detailVi: 'Móng lên theo lớp, cốt thép, mặt nền. Cần ~1 giờ đông cứng.', detailEn: 'Layered footing, rebar, slab. Needs ~1 hour to cure.' },
  { vi: 'Dựng khung', en: 'Framing', glyph: '🏗️', detailVi: 'Cột, dầm, giàn giáo. Cao ốc: cần cẩu và từng tầng.', detailEn: 'Posts, beams, scaffolding. Towers: crane and floor by floor.' },
  { vi: 'Xây tường', en: 'Walls', glyph: '🧱', detailVi: 'Tường lên theo từng hàng, chừa lỗ cửa.', detailEn: 'Walls rise row by row, openings left for doors.' },
  { vi: 'Lợp mái / cất nóc', en: 'Roofing / topping out', glyph: '🏠', detailVi: 'Vì kèo và mái lắp từng phần; cao ốc làm tầng kỹ thuật và đỉnh.', detailEn: 'Trusses and roof in sections; towers get a plant floor and crown.' },
  { vi: 'Hoàn thiện', en: 'Finishing', glyph: '🎨', detailVi: 'Cửa, cửa sổ, ban công, sơn, đèn, biển tên.', detailEn: 'Doors, windows, balconies, paint, lights, sign.' },
  { vi: 'Cảnh quan, nghiệm thu', en: 'Landscaping & handover', glyph: '🌳', detailVi: 'Đường vào, cây, sân; tháo giàn giáo, dọn vật liệu thừa.', detailEn: 'Path, trees, yard; scaffolding comes down.' },
];

/** Cấu hình nhịp xây — cân chỉnh ở đây. */
export const BUILD = {
  /** Móng đông cứng tối thiểu (phút) trước khi xong công đoạn 3. */
  curingMinutes: 60,
  /** Trọng số chia số ca cho từng công đoạn. */
  shiftWeight: [0.6, 0.6, 0.9, 1, 1.6, 1.6, 1.1, 1, 0.6],
  /** Trọng số chia vật liệu cho từng công đoạn, theo loại vật liệu. */
  stageWeight: {
    wood: [0, 0.1, 0.05, 0.05, 0.4, 0.15, 0.15, 0.1, 0],
    stone: [0, 0, 0.1, 0.45, 0.05, 0.15, 0.05, 0.05, 0.15],
    brick: [0, 0, 0, 0.1, 0.05, 0.6, 0.1, 0.1, 0.05],
    steel: [0, 0, 0, 0.2, 0.45, 0, 0.2, 0.15, 0],
    glass: [0, 0, 0, 0, 0, 0.1, 0.2, 0.7, 0],
  } as Record<keyof Materials, number[]>,
} as const;

/** Cao ốc: chu kỳ mỗi tầng. */
export const TOWER = {
  steps: ['frame', 'slab', 'facade', 'edge'] as const,
  /** Một ca tiến bao nhiêu bước tầng (2 → 2 ca / tầng; 20 tầng ≈ 40 ca). */
  stepsPerShift: 2,
  /** Số ca dựng cần cẩu tháp (đầu công đoạn 4). */
  craneShifts: 1,
} as const;
export type FloorStep = (typeof TOWER.steps)[number];

export type Site = {
  id: string;
  type: string;
  seed: number;
  x: number;
  y: number;
  rot: 0 | 1 | 2 | 3;
  /** Chỉ số trong `item.stages`; bằng `stages.length` là đã xong. */
  stageIdx: number;
  /** Ca đã làm trong bước hiện tại. */
  shifts: number;
  /** Vật liệu bước hiện tại đã giao chưa. */
  delivered: boolean;
  /** Lúc bắt đầu bước hiện tại (ISO) — tính giờ đông cứng. */
  startedAt: string;
  crew: CrewId | null;
  /** Cao ốc: tổng số tầng (từ seed), cần cẩu đã dựng chưa, số tầng xong, bước trong tầng đang xây. */
  floors?: number;
  craneUp?: boolean;
  floor?: number;
  floorStep?: number;
  createdAt: string;
  doneAt?: string;
};

export function stageOf(site: Site, item: CatalogBuilding): number {
  return site.stageIdx >= item.stages.length ? 9 : item.stages[site.stageIdx]!;
}

export function isDone(site: Site, item?: CatalogBuilding): boolean {
  const it = item ?? catalogItem(site.type);
  return !!it && site.stageIdx >= it.stages.length;
}

/** Tổng trọng số của những công đoạn công trình thật sự đi qua. */
function weightSum(weights: readonly number[], stages: readonly number[]): number {
  return stages.reduce((s, st) => s + (weights[st] ?? 0), 0);
}

/**
 * Vật liệu của một công đoạn: chia tổng chi phí theo trọng số. Làm tròn lên,
 * phần dư dồn vào công đoạn nặng nhất để tổng các công đoạn = tổng chi phí.
 */
export function stageCost(item: CatalogBuilding, stage: number): Partial<Materials> {
  const out: Partial<Materials> = {};
  for (const k of MATERIAL_KINDS) {
    const total = item.cost[k] ?? 0;
    if (total <= 0) continue;
    const w = BUILD.stageWeight[k];
    const sum = weightSum(w, item.stages);
    if (sum <= 0) {
      // Công trình không đi qua công đoạn nào dùng loại này: dồn vào công đoạn đầu.
      if (stage === item.stages[0]) out[k] = total;
      continue;
    }
    const shares = item.stages.map((st) => Math.floor((total * (w[st] ?? 0)) / sum));
    const rest = total - shares.reduce((a, b) => a + b, 0);
    let heavy = 0;
    item.stages.forEach((st, i) => {
      if ((w[st] ?? 0) > (w[item.stages[heavy]!] ?? 0)) heavy = i;
    });
    shares[heavy]! += rest;
    const idx = item.stages.indexOf(stage);
    if (idx >= 0 && shares[idx]! > 0) out[k] = shares[idx]!;
  }
  return out;
}

/** Số ca của một công đoạn (ít nhất 1). */
export function stageShifts(item: CatalogBuilding, stage: number): number {
  const w = BUILD.shiftWeight;
  const sum = weightSum(w, item.stages);
  const raw = (item.shifts * (w[stage] ?? 1)) / sum;
  return Math.max(1, Math.round(raw));
}

/** Tổng số tầng của một cao ốc theo seed (cùng seed luôn cùng số tầng). */
export function floorsFor(item: CatalogBuilding, seed: number): number {
  if (!item.floors) return 0;
  const [lo, hi] = item.floors;
  return lo + (Math.abs(seed) % (hi - lo + 1));
}

/** Bước hiện tại của công trình là gì. */
export type Step =
  | { kind: 'stage'; stage: number }
  | { kind: 'crane' }
  | { kind: 'floor'; floor: number; step: number }
  | { kind: 'done' };

export function currentStep(site: Site, item: CatalogBuilding): Step {
  if (site.stageIdx >= item.stages.length) return { kind: 'done' };
  const stage = item.stages[site.stageIdx]!;
  if (isTower(item) && stage === 4) {
    if (!site.craneUp) return { kind: 'crane' };
    return { kind: 'floor', floor: site.floor ?? 0, step: site.floorStep ?? 0 };
  }
  return { kind: 'stage', stage };
}

/** Vật liệu cần giao cho bước hiện tại. */
export function stepCost(site: Site, item: CatalogBuilding): Partial<Materials> {
  const s = currentStep(site, item);
  if (s.kind === 'stage') return stageCost(item, s.stage);
  if (s.kind === 'crane') return stageCost(item, 4);
  if (s.kind === 'floor') return s.step === 0 ? { ...(item.floorCost ?? {}) } : {};
  return {};
}

/** Số ca cần cho bước hiện tại. */
export function stepShifts(site: Site, item: CatalogBuilding): number {
  const s = currentStep(site, item);
  if (s.kind === 'stage') return stageShifts(item, s.stage);
  if (s.kind === 'crane') return TOWER.craneShifts;
  if (s.kind === 'floor') return 1;
  return 0;
}

export function newSite(args: { id: string; type: string; seed: number; x: number; y: number; rot: 0 | 1 | 2 | 3; now: string }): Site {
  const { now, ...where } = args;
  const item = catalogItem(args.type)!;
  const site: Site = {
    ...where,
    stageIdx: 0,
    shifts: 0,
    delivered: false,
    startedAt: now,
    crew: null,
    createdAt: now,
  };
  if (isTower(item)) {
    site.floors = floorsFor(item, args.seed);
    site.floor = 0;
    site.floorStep = 0;
    site.craneUp = false;
  }
  site.delivered = isEmptyCost(stepCost(site, item));
  return site;
}

/** Giao vật liệu cho bước hiện tại. */
export function deliver(site: Site, inventory: Materials, now: string): { ok: true; site: Site; inventory: Materials } | { ok: false; reason: 'done' | 'already' | 'materials' } {
  const item = catalogItem(site.type)!;
  if (isDone(site, item)) return { ok: false, reason: 'done' };
  if (site.delivered) return { ok: false, reason: 'already' };
  const cost = stepCost(site, item);
  if (!hasMaterials(inventory, cost)) return { ok: false, reason: 'materials' };
  return { ok: true, site: { ...site, delivered: true, startedAt: now }, inventory: subtract(inventory, cost) };
}

/** Bước hiện tại có đang chờ đông cứng không; trả số phút còn lại. */
export function curingLeft(site: Site, item: CatalogBuilding, now: Date): number {
  const s = currentStep(site, item);
  if (s.kind !== 'stage' || s.stage !== 3 || !site.delivered) return 0;
  const end = Date.parse(site.startedAt) + BUILD.curingMinutes * 60_000;
  return Math.max(0, Math.ceil((end - now.getTime()) / 60_000));
}

/** Chuyển sang bước sau (gọi khi bước hiện tại đủ ca + vật liệu + hết giờ chờ). */
function advance(site: Site, item: CatalogBuilding, now: string): Site {
  const s = currentStep(site, item);
  let next: Site = { ...site, shifts: 0, startedAt: now };
  if (s.kind === 'crane') next.craneUp = true;
  else if (s.kind === 'floor') {
    const step = (site.floorStep ?? 0) + 1;
    if (step >= TOWER.steps.length) {
      next.floor = (site.floor ?? 0) + 1;
      next.floorStep = 0;
      if ((next.floor ?? 0) >= (site.floors ?? 0)) next.stageIdx = site.stageIdx + 1;
    } else next.floorStep = step;
  } else next.stageIdx = site.stageIdx + 1;
  if (next.stageIdx >= item.stages.length) {
    next = { ...next, doneAt: now, crew: null, delivered: true };
    return next;
  }
  next.delivered = isEmptyCost(stepCost(next, item));
  return next;
}

/** Bước hiện tại đủ điều kiện hoàn tất chưa. */
function ready(site: Site, item: CatalogBuilding, now: Date): boolean {
  return site.delivered && site.shifts >= stepShifts(site, item) && curingLeft(site, item, now) === 0;
}

/** Có nhận thêm ca được không. */
export function canWork(site: Site, item: CatalogBuilding): boolean {
  return !isDone(site, item) && site.crew !== null && site.delivered && site.shifts < stepShifts(site, item);
}

/**
 * Hoàn tất các bước đã đủ điều kiện (vd. móng vừa hết giờ đông cứng). Gọi khi
 * mở thành phố — chỉ chuyển bước khi ĐÃ đủ ca và vật liệu, thời gian không tự
 * sinh tiến độ.
 */
export function settle(site: Site, now: Date): Site {
  const item = catalogItem(site.type);
  if (!item) return site;
  let s = site;
  for (let guard = 0; guard < 200 && !isDone(s, item) && ready(s, item, now); guard++) s = advance(s, item, now.toISOString());
  return s;
}

/** Áp MỘT ca vào một công trình. Cao ốc đang dựng thân: một ca tiến `stepsPerShift` bước tầng. */
export function applyShift(site: Site, now: Date): Site {
  const item = catalogItem(site.type);
  if (!item || !canWork(site, item)) return site;
  let s: Site = { ...site, shifts: site.shifts + 1 };
  s = settle(s, now);
  const step = currentStep(site, item);
  if (step.kind === 'floor') {
    // Bước tầng thứ hai trong cùng ca (nếu còn đủ điều kiện: cùng tầng đã giao vật liệu).
    for (let extra = 1; extra < TOWER.stepsPerShift; extra++) {
      const cur = currentStep(s, item);
      if (cur.kind !== 'floor' || !canWork(s, item)) break;
      s = settle({ ...s, shifts: s.shifts + 1 }, now);
    }
  }
  return s;
}

// --------------------------------------------------------------- tổ đội thi công

export const CREW_ORDER: readonly CrewId[] = ['pioneer', 'builder', 'tower'];

export const CREWS: Record<
  CrewId,
  { vi: string; en: string; glyph: string; era: Era; capacity: number; hireCost: Partial<Materials>; minLevel: number; needsBuilding?: string; workers: number }
> = {
  pioneer: { vi: 'Đội khai hoang', en: 'Pioneer crew', glyph: '🪓', era: 1, capacity: 1, hireCost: { wood: 3 }, minLevel: 1, workers: 2 },
  builder: { vi: 'Đội xây nhà', en: 'House builders', glyph: '🔨', era: 3, capacity: 2, hireCost: { wood: 6, brick: 6 }, minLevel: 4, needsBuilding: 'warehouse', workers: 3 },
  tower: { vi: 'Đội xây cao tầng', en: 'High-rise crew', glyph: '🏗️', era: 5, capacity: 1, hireCost: { steel: 4, stone: 10 }, minLevel: 9, needsBuilding: 'power_station', workers: 4 },
};

/** Đội nào đã mở: đủ kỷ, đủ cấp học, có công trình nền đã hoàn thành. */
export function crewUnlocked(crew: CrewId, era: number, level: number, sites: readonly Site[]): boolean {
  const c = CREWS[crew];
  if (era < c.era || level < c.minLevel) return false;
  if (c.needsBuilding && !sites.some((s) => s.type === c.needsBuilding && isDone(s))) return false;
  return true;
}

/** Đội `crew` làm được công trình cần đội `need` (đội cao hơn làm được việc thấp hơn). */
export function crewFits(crew: CrewId, need: CrewId): boolean {
  return CREW_ORDER.indexOf(crew) >= CREW_ORDER.indexOf(need);
}

export function crewLoad(crew: CrewId, sites: readonly Site[]): number {
  return sites.filter((s) => s.crew === crew && !isDone(s)).length;
}

export type HireCheck = { ok: true } | { ok: false; reason: 'locked' | 'unfit' | 'busy' | 'materials' | 'done' | 'assigned' };

export function canHire(
  crew: CrewId,
  site: Site,
  sites: readonly Site[],
  inventory: Materials,
  era: number,
  level: number,
): HireCheck {
  const item = catalogItem(site.type);
  if (!item || isDone(site, item)) return { ok: false, reason: 'done' };
  if (site.crew === crew) return { ok: false, reason: 'assigned' };
  if (!crewUnlocked(crew, era, level, sites)) return { ok: false, reason: 'locked' };
  if (!crewFits(crew, item.crew)) return { ok: false, reason: 'unfit' };
  if (crewLoad(crew, sites) >= CREWS[crew].capacity) return { ok: false, reason: 'busy' };
  if (!hasMaterials(inventory, CREWS[crew].hireCost)) return { ok: false, reason: 'materials' };
  return { ok: true };
}

/**
 * Phân các ca trong kho cho công trường: công trường ƯU TIÊN nhận trước, rồi tới
 * công trường đặt sớm nhất. Một ca = một đơn vị công việc cho MỘT công trường
 * (nhiều công trường cùng lúc thì tốn nhiều ca hơn — không có tiến độ miễn phí).
 */
export function distributeShifts(
  sites: readonly Site[],
  bank: number,
  priority: string | null,
  now: Date,
): { sites: Site[]; bank: number; worked: Record<string, number> } {
  let list = sites.map((s) => settle(s, now));
  let left = bank;
  const worked: Record<string, number> = {};
  const order = () =>
    [...list]
      .filter((s) => {
        const it = catalogItem(s.type);
        return !!it && canWork(s, it);
      })
      .sort((a, b) => (a.id === priority ? -1 : b.id === priority ? 1 : a.createdAt.localeCompare(b.createdAt)));
  for (let guard = 0; left > 0 && guard < 1000; guard++) {
    const target = order()[0];
    if (!target) break;
    const after = applyShift(target, now);
    list = list.map((s) => (s.id === target.id ? after : s));
    worked[target.id] = (worked[target.id] ?? 0) + 1;
    left -= 1;
  }
  return { sites: list, bank: left, worked };
}

/** Việc còn thiếu để công trình tiến tiếp — cho bảng công trường. */
export function blockers(
  site: Site,
  inventory: Materials,
  bank: number,
  now: Date,
): { materials: Partial<Materials>; crew: boolean; shiftsLeft: number; curingMin: number; needDelivery: boolean } {
  const item = catalogItem(site.type)!;
  const cost = site.delivered ? {} : stepCost(site, item);
  const miss: Partial<Materials> = {};
  for (const k of MATERIAL_KINDS) {
    const m = (cost[k] ?? 0) - inventory[k];
    if (m > 0) miss[k] = m;
  }
  return {
    materials: miss,
    crew: site.crew === null && !isDone(site, item),
    shiftsLeft: Math.max(0, stepShifts(site, item) - site.shifts - bank),
    curingMin: curingLeft(site, item, now),
    needDelivery: !site.delivered,
  };
}

/** Tiến độ hình ảnh: công đoạn, phần trăm bước, tầng. Cùng dữ liệu → cùng hình sau khi tải lại. */
export type VisualProgress = {
  stage: number;
  /** 0..1 trong công đoạn hiện tại (0 khi chưa giao vật liệu). */
  fraction: number;
  craneUp: boolean;
  floorsDone: number;
  floorStep: number;
  floors: number;
};

export function visualProgress(site: Site): VisualProgress {
  const item = catalogItem(site.type)!;
  const need = stepShifts(site, item);
  return {
    stage: stageOf(site, item),
    fraction: site.delivered && need > 0 ? Math.min(1, site.shifts / need) : 0,
    craneUp: !!site.craneUp,
    floorsDone: site.floor ?? 0,
    floorStep: site.floorStep ?? 0,
    floors: site.floors ?? 0,
  };
}

/** Tổng vật liệu cả công trình (để hiển thị dự toán). */
export function totalCost(item: CatalogBuilding, floors = 0): Materials {
  let out = { ...EMPTY_MATERIALS };
  out = add(out, item.cost);
  for (let i = 0; i < floors; i++) out = add(out, item.floorCost ?? {});
  return out;
}

export function populationOf(sites: readonly Site[]): number {
  return sites.reduce((sum, s) => {
    const it = catalogItem(s.type);
    return sum + (it && isDone(s, it) ? (it.population ?? 0) : 0);
  }, 0);
}
