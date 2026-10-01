import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_PREFIX, storage, todayKey } from './persist';
import { useRewardStore } from './useRewardStore';
import { getPoiContent } from '@/data/travel/pois';
import {
  TRAVEL_ECONOMY,
  earnTicketFromCustoms,
  earnTicketsFromReview,
  exchangeStarsForTicket,
  ledgerAdd,
  spendCoins,
  spendTickets,
  ticketsOf,
  type EarnResult,
  type ExchangeResult,
} from '@/services/travel/economy';
import { applyVisit, type VisitResult } from '@/services/travel/rewards';
import { emptyTravel, normalizeTravel, POS_UNSET, pruneSeen, withDerived, type TravelPayload } from '@/services/travel/sync';
import type { CityId, Level, Tile } from '@/services/travel/types';
import { canFly, type FlyCheck } from '@/services/travel/world';

/**
 * Kho "Du ngoạn Band 9". Vé và xu LUÔN tính lại từ sổ cái (`ledger`) — không cộng
 * trực tiếp vào con số — nên đồng bộ nhiều máy không cộng đôi. Đồng bộ lên tài
 * khoản bằng khoá `travel` (xem `services/sync/stores.ts`).
 */
type Actions = {
  setPos: (tile: Tile) => void;
  setPrefs: (p: Partial<TravelPayload['prefs']>) => void;
  /** Xong màn giới thiệu: lưu tên + áo, tặng vé chào mừng, đánh dấu đã tới Hà Nội. */
  finishOnboarding: (p: { name: string; outfit: number }) => void;
  /** Ghi một lượt hải quan (5 câu). Tính vào hạn mức 6 lượt/ngày. */
  earnCustoms: (correct: number, total: number) => EarnResult;
  /** Ghi `n` từ đã ôn đúng; cứ 10 từ ra một vé (tối đa 3 vé/ngày). */
  earnReview: (n: number) => EarnResult;
  /** Đổi 150 sao lấy 1 vé. `starBalance` là số sao đang có (lấy từ `useStarBalance`). */
  exchange: (starBalance: number) => ExchangeResult;
  /** Bay tới `to`: trừ vé, đổi thành phố. `spawn` là điểm xuất phát của bản đồ đích (nếu biết). */
  fly: (to: CityId, spawn?: Tile) => FlyCheck;
  /** Chi vé / xu cho việc khác (mã khoản `id` duy nhất). */
  spend: (kind: 'tickets' | 'coins', id: string, amount: number) => boolean;
  /** Ghi kết quả một lượt tham quan; `keys` là khoá các câu / từ đã hỏi (để không hỏi lại trong 24 giờ). */
  completeVisit: (p: { poiId: string; correct: number; total: number; playedLevel?: Level; keys?: string[] }) => VisitResult | null;
  markSeen: (keys: string[]) => void;
  reset: () => void;
};

export type TravelStore = TravelPayload & Actions;

const nowIso = () => new Date().toISOString();

const DATA_KEYS: (keyof TravelPayload)[] = [
  'tickets',
  'coins',
  'city',
  'pos',
  'visited',
  'poi',
  'souvenirs',
  'ledger',
  'passportLevel',
  'dailyCaps',
  'prefs',
  'onboarded',
  'updatedAt',
  'seen',
];

/** Phần dữ liệu của store — đúng thứ được lưu và đồng bộ. */
export function travelPayload(): TravelPayload {
  const s = useTravelStore.getState();
  const out: Record<string, unknown> = {};
  for (const k of DATA_KEYS) out[k] = s[k];
  return out as TravelPayload;
}

export const useTravelStore = create<TravelStore>()(
  persist(
    (set, get) => ({
      ...emptyTravel(todayKey()),

      setPos: (tile) => set({ pos: tile, updatedAt: nowIso() }),

      setPrefs: (p) => set((s) => ({ prefs: { ...s.prefs, ...p }, updatedAt: nowIso() })),

      finishOnboarding: ({ name, outfit }) =>
        set((s) => {
          const ledger = ledgerAdd(s.ledger, 'tk:welcome', TRAVEL_ECONOMY.welcomeTickets);
          const at = nowIso();
          return withDerived({
            ...s,
            ledger,
            onboarded: true,
            prefs: { ...s.prefs, name: name.trim().slice(0, 24), outfit },
            visited: { ...s.visited, hanoi: s.visited.hanoi ?? { stamp: false, firstAt: at } },
            updatedAt: at,
          });
        }),

      earnCustoms: (correct, total) => {
        const s = get();
        const r = earnTicketFromCustoms({ ledger: s.ledger, dailyCaps: s.dailyCaps }, correct, total, todayKey());
        set({ ledger: r.ledger, dailyCaps: r.dailyCaps, tickets: ticketsOf(r.ledger) });
        return r;
      },

      earnReview: (n) => {
        const s = get();
        const r = earnTicketsFromReview({ ledger: s.ledger, dailyCaps: s.dailyCaps }, n, todayKey());
        set({ ledger: r.ledger, dailyCaps: r.dailyCaps, tickets: ticketsOf(r.ledger) });
        return r;
      },

      exchange: (starBalance) => {
        const s = get();
        const r = exchangeStarsForTicket({ ledger: s.ledger, dailyCaps: s.dailyCaps }, starBalance, todayKey());
        if (!r.ok) return r;
        // Trừ sao ở kho phần thưởng TRƯỚC; thất bại thì không ghi vé.
        if (r.starsSpent > 0 && !useRewardStore.getState().spendStars(r.starsSpent, starBalance)) {
          return { ...r, ok: false, tickets: 0, reason: 'not-enough-stars', starsSpent: 0, ledger: s.ledger, dailyCaps: s.dailyCaps };
        }
        set({ ledger: r.ledger, dailyCaps: r.dailyCaps, tickets: ticketsOf(r.ledger) });
        return r;
      },

      fly: (to, spawn) => {
        const s = get();
        const check = canFly(s, to);
        if (!check.ok) return check;
        let ledger = s.ledger;
        if (check.cost > 0) {
          const spent = spendTickets(ledger, `fly:${s.city}>${to}:${Date.now()}`, check.cost);
          if (!spent.ok) return { ok: false, reason: 'tickets', cost: check.cost };
          ledger = spent.ledger;
        }
        const at = nowIso();
        set({
          ledger,
          tickets: ticketsOf(ledger),
          city: to,
          pos: spawn ?? { ...POS_UNSET },
          visited: { ...s.visited, [to]: s.visited[to] ?? { stamp: false, firstAt: at } },
          updatedAt: at,
        });
        return check;
      },

      spend: (kind, id, amount) => {
        const s = get();
        const r = kind === 'tickets' ? spendTickets(s.ledger, id, amount) : spendCoins(s.ledger, id, amount);
        if (!r.ok) return false;
        set(withDerived({ ledger: r.ledger, visited: s.visited, souvenirs: s.souvenirs }));
        return true;
      },

      completeVisit: ({ poiId, correct, total, playedLevel, keys }) => {
        const poi = getPoiContent(poiId);
        if (!poi) return null;
        const s = get();
        const at = nowIso();
        const { patch, result } = applyVisit(s, { poi, correct, total, playedLevel, nowIso: at });
        const seen = { ...s.seen };
        for (const k of keys ?? []) seen[k] = at;
        set({ ...patch, seen: pruneSeen(seen, Date.now()), updatedAt: at });
        return result;
      },

      markSeen: (keys) => {
        const at = nowIso();
        const seen = { ...get().seen };
        for (const k of keys) seen[k] = at;
        set({ seen: pruneSeen(seen, Date.now()) });
      },

      reset: () => set({ ...emptyTravel(todayKey()) }),
    }),
    {
      name: `${STORAGE_PREFIX}travel`,
      storage: storage<TravelStore>(),
      version: 1,
      partialize: (s) => {
        const out: Record<string, unknown> = {};
        for (const k of DATA_KEYS) out[k] = s[k];
        return out as unknown as TravelStore;
      },
      // Bản lưu cũ / hỏng thiếu trường → chuẩn hoá thay vì làm sập.
      merge: (persisted, current) => ({ ...current, ...normalizeTravel(persisted) }),
    },
  ),
);
