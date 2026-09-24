import { create } from 'zustand';

import type { ItemKind } from '@/services/game/rules';

/**
 * Sự kiện để GIAO DIỆN DIỄN — không lưu, không đồng bộ. `useGameStore` bắn vào,
 * thanh trận đấu và lớp hiệu ứng toàn app lắng nghe rồi tự dọn.
 */
export type FxEvent = (
  | { id: number; kind: 'hit'; xp: number; damage: number; crit: boolean; combo: number }
  | { id: number; kind: 'hurt' }
  | { id: number; kind: 'blocked' }
  | { id: number; kind: 'knockout' }
  | { id: number; kind: 'defeat'; enemyIndex: number; name: string; loot: ItemKind | null; bonusXp: number }
  | { id: number; kind: 'levelup'; level: number }
  | { id: number; kind: 'achievement'; title: string; glyph: string }
  | { id: number; kind: 'quest'; title: string }
  | { id: number; kind: 'batch'; xp: number; correct: number; total: number; defeated: number }
  | { id: number; kind: 'item'; item: ItemKind; title: string }
) & {
  /** Lúc xảy ra KHÔNG có thanh trận đấu nào trong khung nhìn — lớp toàn app diễn thay. Chốt một lần, không tính lại. */
  global?: boolean;
};

type Without<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never;
export type FxInput = Without<FxEvent, 'id' | 'global'>;

/** Lúc từng sự kiện xảy ra — để thanh vừa dựng lại (sang câu mới) vẫn diễn nốt đòn vừa đánh. */
const bornAt = new Map<number, number>();

/**
 * Mốc "đã cũ" cho một thanh trận đấu vừa hiện: bỏ qua sự kiện xảy ra trước đó
 * hơn 1,5 giây. Màn nào dựng lại thanh ngay sau khi chấm câu (sang câu mới) vẫn
 * thấy đòn vừa đánh; mở một màn khác lúc sau thì không chiếu lại trận cũ.
 */
export function staleBefore(): number {
  const now = Date.now();
  let since = 0;
  for (const e of useGameFx.getState().events) if ((bornAt.get(e.id) ?? 0) < now - 1500) since = e.id;
  return since;
}

type FxState = {
  events: FxEvent[];
  push: (e: FxInput) => void;
  dismiss: (id: number) => void;
  /** Gợi ý của Cú cho câu đang mở; màn nào nhận gợi ý thì đăng ký qua `useOwlHint`. */
  hint: (() => boolean) | null;
  setHint: (fn: (() => boolean) | null) => void;
  /** Số thanh trận đấu đang NẰM TRONG KHUNG NHÌN — có thì số XP bay ở thanh, không thì bay ở góc màn. */
  strips: number;
  mountStrip: () => () => void;
};

let seq = 0;

export const useGameFx = create<FxState>()((set, get) => ({
  events: [],
  push: (e) => {
    seq += 1;
    bornAt.set(seq, Date.now());
    bornAt.delete(seq - 64);
    // Giữ 16 sự kiện gần nhất là đủ cho mọi hiệu ứng đang chạy.
    set({ events: [...get().events.slice(-15), { ...e, id: seq, global: get().strips === 0 } as FxEvent] });
  },
  dismiss: (id) => set({ events: get().events.filter((e) => e.id !== id) }),
  hint: null,
  setHint: (fn) => set({ hint: fn }),
  strips: 0,
  mountStrip: () => {
    set({ strips: get().strips + 1 });
    return () => set({ strips: Math.max(0, get().strips - 1) });
  },
}));
