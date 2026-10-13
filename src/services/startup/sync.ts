import type { Bi } from '@/i18n/useL';
import type { Recipe } from '@/data/startup-menu';
import { mergeLedgers, type Ledger } from '@/services/travel/economy';

export type Shop = { city: string; name: Bi; color: string; openedAt: string };
export type StartupPayload = { shops: Record<string, Shop>; ledger: Ledger; customRecipes: Recipe[] };

const isBi = (x: unknown): x is Bi => !!x && typeof x === 'object' && typeof (x as Bi).vi === 'string' && typeof (x as Bi).en === 'string';

function normalizeShops(raw: unknown): Record<string, Shop> {
  if (!raw || typeof raw !== 'object') return {};
  const out: Record<string, Shop> = {};
  for (const [city, value] of Object.entries(raw)) {
    const s = value as Partial<Shop>;
    if (typeof s?.city !== 'string' || !isBi(s.name) || typeof s.color !== 'string' || typeof s.openedAt !== 'string') continue;
    out[city] = { city: s.city, name: s.name, color: s.color, openedAt: s.openedAt };
  }
  return out;
}

function normalizeLedger(raw: unknown): Ledger {
  if (!raw || typeof raw !== 'object') return {};
  const out: Ledger = {};
  for (const [id, amount] of Object.entries(raw)) {
    if (typeof amount === 'number' && Number.isFinite(amount)) out[id] = amount;
  }
  return out;
}

function normalizeRecipes(raw: unknown): Recipe[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((r): r is Recipe => {
    const x = r as Partial<Recipe>;
    return typeof x?.id === 'string' && isBi(x.name) && typeof x.price === 'number' && Array.isArray(x.ingredients) && Array.isArray(x.steps) && x.steps.length > 0 && x.custom === true;
  });
}

export function normalizeStartup(raw: unknown): StartupPayload {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<Record<keyof StartupPayload, unknown>>;
  return { shops: normalizeShops(r.shops), ledger: normalizeLedger(r.ledger), customRecipes: normalizeRecipes(r.customRecipes) };
}

/**
 * Gộp hai máy. Quán: mỗi thành phố giữ bản mở sớm hơn (theo `openedAt`). Sổ: hợp theo mã.
 * Món riêng: hợp theo mã món, bản trên máy này thắng nếu trùng.
 */
export function mergeStartup(local: unknown, remote: unknown | null): StartupPayload {
  const a = normalizeStartup(local);
  if (remote === null || remote === undefined) return a;
  const b = normalizeStartup(remote);
  const shops: Record<string, Shop> = { ...b.shops };
  for (const [city, shop] of Object.entries(a.shops)) {
    if (!shops[city] || shop.openedAt < shops[city]!.openedAt) shops[city] = shop;
  }
  const seen = new Set(a.customRecipes.map((recipe) => recipe.id));
  const customRecipes = [...a.customRecipes, ...b.customRecipes.filter((recipe) => !seen.has(recipe.id))];
  return { shops, ledger: mergeLedgers(a.ledger, b.ledger), customRecipes };
}
