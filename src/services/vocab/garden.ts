/**
 * VƯỜN TỪ — mỗi từ trong sổ từ là một cái cây; cây khoẻ hay héo đúng bằng độ
 * NHỚ hiện tại của từ đó theo FSRS (retrievability: xác suất bạn còn nhớ nếu bị
 * hỏi ngay bây giờ). Không ôn thì cây héo dần theo đúng đường cong quên.
 *
 * Biến một con số khô (độ nhớ 64%) thành thứ nhìn là thấy: "12 cây sắp héo".
 * Hàm thuần — cảnh 3D (`components/three/garden-scene.ts`) chỉ vẽ theo dữ liệu này.
 */
import { fsrs, generatorParameters, State } from 'ts-fsrs';

import { CARD_KINDS, cardKey, fromStored, type StoredCard } from './schedule';

const scheduler = fsrs(generatorParameters());

export type PlantState = 'seed' | 'thriving' | 'ok' | 'wilting' | 'dying';

export type Plant = {
  id: string;
  word: string;
  meaningVi: string;
  /** Độ nhớ trung bình của các thẻ ĐÃ ÔN, 0–1. Hạt giống (chưa ôn lần nào) = 0. */
  memory: number;
  /** Độ bền trí nhớ lớn nhất (ngày) — cây cao theo nó. */
  stability: number;
  state: PlantState;
  /** 0.25 (mầm) → 1.6 (cây lớn). */
  height: number;
  /** Có hoa: đã nhớ bền (≥ 21 ngày) và đang khoẻ. */
  flower: boolean;
  /** Thẻ tới hạn ôn sớm nhất (ISO). */
  nextDue: string | null;
};

/**
 * Ngưỡng theo mức nhớ MỤC TIÊU 90% của FSRS: dưới 90% là thẻ đã tới hạn ôn.
 * Đường quên của FSRS-6 thoải — bỏ 70 ngày một từ mới học vẫn còn ~64% — nên
 * ngưỡng "héo" phải đặt cao, không thì gần như không cây nào héo cả.
 */
export function stateOf(memory: number, reviewed: boolean): PlantState {
  if (!reviewed) return 'seed';
  if (memory >= 0.9) return 'thriving';
  if (memory >= 0.82) return 'ok';
  if (memory >= 0.7) return 'wilting';
  return 'dying';
}

export function plantHeight(stability: number, reviewed: boolean): number {
  if (!reviewed) return 0.25;
  // Tăng theo log: 1 ngày → ~0.5, 7 ngày → ~0.95, 30 ngày → ~1.3, 90+ ngày → 1.6.
  return Math.min(1.6, 0.35 + 0.28 * Math.log(1 + stability));
}

export type GardenEntry = { id: string; word: string; definitionVi: string | null };

export function plantsFrom(
  entries: readonly GardenEntry[],
  cards: Readonly<Record<string, StoredCard>>,
  now: Date,
): Plant[] {
  return entries.map((e) => {
    const own = CARD_KINDS.map((k) => cards[cardKey(e.id, k)]).filter((c): c is StoredCard => !!c);
    const reviewed = own.filter((c) => c.state !== State.New && c.last_review);
    const memory = reviewed.length
      ? reviewed.reduce((s, c) => s + scheduler.get_retrievability(fromStored(c), now, false), 0) / reviewed.length
      : 0;
    const stability = reviewed.reduce((m, c) => Math.max(m, c.stability), 0);
    const state = stateOf(memory, reviewed.length > 0);
    const dues = own.map((c) => c.due).sort();
    return {
      id: e.id,
      word: e.word,
      meaningVi: e.definitionVi ?? '',
      memory,
      stability,
      state,
      height: plantHeight(stability, reviewed.length > 0),
      flower: stability >= 21 && (state === 'thriving' || state === 'ok'),
      nextDue: dues[0] ?? null,
    };
  });
}

export type GardenSummary = Record<PlantState, number> & { total: number; needWater: number };

export function gardenSummary(plants: readonly Plant[]): GardenSummary {
  const out: GardenSummary = { seed: 0, thriving: 0, ok: 0, wilting: 0, dying: 0, total: plants.length, needWater: 0 };
  for (const p of plants) out[p.state] += 1;
  out.needWater = out.wilting + out.dying;
  return out;
}

/**
 * Vị trí cây trên đảo: xoắn ốc hướng dương (góc vàng) — đều, không chồng nhau,
 * cây mới gieo nằm ở rìa. `radius` là bán kính đảo.
 */
export function spiralLayout(n: number, radius = 4.2): { x: number; z: number }[] {
  const golden = Math.PI * (3 - Math.sqrt(5));
  return Array.from({ length: n }, (_, i) => {
    const r = radius * Math.sqrt((i + 0.5) / Math.max(n, 1));
    const a = i * golden;
    return { x: Math.cos(a) * r, z: Math.sin(a) * r };
  });
}
