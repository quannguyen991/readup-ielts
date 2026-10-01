/**
 * TRUNG TÂM TƯƠNG LAI — khu cao ốc CHUNG của mọi người học (logic thuần, có
 * test `hub.test.ts`). Không thời gian thực: mỗi người góp vật liệu qua
 * `/api/city-hub`, máy chủ cộng dồn, ai mở cũng thấy cùng một tiến độ.
 *
 * Lưu trữ không đổi schema: mỗi người một dòng `user_state` khoá `city_hub`
 * (chỉ API ghi, KHÔNG nằm trong danh sách đồng bộ của app) giữ phần mình đã
 * góp, số đã góp hôm nay (trần chống lạm dụng), vài lượt góp gần nhất và vài
 * lời nhắn. Tiến độ tháp TÍNH LẠI từ tổng đã góp — không lưu thành một con số
 * riêng dễ lệch: đổ đầy tháp 1 từng tầng, xong mới sang tháp 2…
 */
import { EMPTY_MATERIALS, MATERIAL_KINDS, type MaterialKind, type Materials } from './materials';

export type HubTower = { id: string; vi: string; en: string; type: string; floors: number; floorCost: Partial<Materials>; glyph: string };

/**
 * Năm tòa, xây theo thứ tự. `type` là loại cao ốc trong catalog để sinh hình
 * (số tầng phải nằm trong khoảng `floors` của loại đó — `hub.test.ts` canh).
 */
export const HUB_TOWERS: readonly HubTower[] = [
  { id: 'tri-thuc', vi: 'Tháp Tri Thức', en: 'Tower of Knowledge', type: 'tower_glass', floors: 12, floorCost: { wood: 8, stone: 12, brick: 12, steel: 4, glass: 4 }, glyph: '🏢' },
  { id: 'ngon-ngu', vi: 'Tháp Ngôn Ngữ', en: 'Language Tower', type: 'tower_office', floors: 14, floorCost: { wood: 8, stone: 14, brick: 16, steel: 6, glass: 6 }, glyph: '🏬' },
  { id: 'dong-hanh', vi: 'Tháp Đôi Đồng Hành', en: 'Twin Towers of Friendship', type: 'tower_twin', floors: 16, floorCost: { wood: 10, stone: 16, brick: 18, steel: 8, glass: 8 }, glyph: '🏨' },
  { id: 'tuong-lai', vi: 'Đài Tương Lai', en: 'Future Observatory', type: 'tower_observation', floors: 18, floorCost: { wood: 10, stone: 18, brick: 20, steel: 10, glass: 12 }, glyph: '🗼' },
  { id: 'uoc-mo', vi: 'Tháp Ước Mơ', en: 'Tower of Dreams', type: 'tower_glass', floors: 20, floorCost: { wood: 12, stone: 20, brick: 22, steel: 12, glass: 14 }, glyph: '🌟' },
];

export const HUB = {
  /** Mỗi người góp tối đa bao nhiêu đơn vị vật liệu một ngày (giờ VN). */
  dailyUnitCap: 300,
  /** Một lần góp tối đa bao nhiêu đơn vị một loại (chặn số vô lý). */
  maxPerKind: 300,
  notesPerDay: 3,
  notesKept: 5,
  recentKept: 10,
  idsKept: 60,
  noteMax: 140,
} as const;

// ------------------------------------------------------------------ tiến độ

export type TowerProgress = {
  id: string;
  floorsBuilt: number;
  floors: number;
  done: boolean;
  /** Tháp đang xây (chỉ một tháp). */
  active: boolean;
  /** Tầng đang xây: vật liệu đã có / cần (chỉ tháp đang xây). */
  floor: { have: Partial<Materials>; need: Partial<Materials>; fraction: number } | null;
};

export type HubProgress = {
  towers: TowerProgress[];
  /** Chỉ số tháp đang xây; -1 khi đã xong cả năm. */
  current: number;
  /** Tổng số tầng đã xong / tổng số tầng cả khu. */
  floorsBuilt: number;
  floorsTotal: number;
};

function units(m: Partial<Materials>): number {
  return MATERIAL_KINDS.reduce((s, k) => s + Math.max(0, m[k] ?? 0), 0);
}

/**
 * Tiến độ từ TỔNG đã góp: tháp theo thứ tự, mỗi tầng trừ đúng gói vật liệu của
 * tầng đó. Tầng đang xây hiện phần đã có của từng loại — thiếu loại nào thì cả
 * cộng đồng thấy ngay cần góp loại đó. Tất định: cùng tổng → cùng kết quả.
 */
export function hubProgress(total: Partial<Materials>, towers: readonly HubTower[] = HUB_TOWERS): HubProgress {
  const pool: Materials = { ...EMPTY_MATERIALS };
  for (const k of MATERIAL_KINDS) pool[k] = Math.max(0, Math.floor(total[k] ?? 0));
  const out: TowerProgress[] = [];
  let current = -1;
  let blocked = false;
  let floorsBuilt = 0;
  for (const t of towers) {
    if (blocked) {
      out.push({ id: t.id, floorsBuilt: 0, floors: t.floors, done: false, active: false, floor: null });
      continue;
    }
    let built = 0;
    while (built < t.floors && MATERIAL_KINDS.every((k) => (t.floorCost[k] ?? 0) <= pool[k])) {
      for (const k of MATERIAL_KINDS) pool[k] -= t.floorCost[k] ?? 0;
      built++;
    }
    floorsBuilt += built;
    if (built >= t.floors) {
      out.push({ id: t.id, floorsBuilt: built, floors: t.floors, done: true, active: false, floor: null });
      continue;
    }
    const have: Partial<Materials> = {};
    let got = 0;
    for (const k of MATERIAL_KINDS) {
      const need = t.floorCost[k] ?? 0;
      if (need <= 0) continue;
      have[k] = Math.min(need, pool[k]);
      got += have[k]!;
    }
    const need = units(t.floorCost);
    out.push({ id: t.id, floorsBuilt: built, floors: t.floors, done: false, active: true, floor: { have, need: { ...t.floorCost }, fraction: need ? got / need : 0 } });
    current = out.length - 1;
    blocked = true;
  }
  return { towers: out, current, floorsBuilt, floorsTotal: towers.reduce((s, t) => s + t.floors, 0) };
}

/** Vật liệu tầng đang xây còn thiếu (để gợi ý góp đúng loại). */
export function floorShortfall(p: TowerProgress | undefined): Partial<Materials> {
  const out: Partial<Materials> = {};
  if (!p?.floor) return out;
  for (const k of MATERIAL_KINDS) {
    const miss = (p.floor.need[k] ?? 0) - (p.floor.have[k] ?? 0);
    if (miss > 0) out[k] = miss;
  }
  return out;
}

// ------------------------------------------------------------------ dữ liệu một người

export type HubContribution = { id: string; at: string; m: Partial<Materials> };
export type HubNote = { text: string; at: string };
export type HubUser = {
  total: Materials;
  /** Ngày (giờ VN) của `dayUnits`. */
  day: string;
  dayUnits: number;
  recent: HubContribution[];
  notes: HubNote[];
  /** Mã lượt góp đã nhận gần đây — gửi lại cùng mã (mạng chập chờn) không cộng hai lần. */
  ids: string[];
};

export const EMPTY_HUB_USER: HubUser = { total: { ...EMPTY_MATERIALS }, day: '', dayUnits: 0, recent: [], notes: [], ids: [] };

const int = (v: unknown, max = 1e9) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(max, Math.floor(v))) : 0);
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '');

function cleanMaterials(raw: unknown, max = 1e9): Partial<Materials> {
  const o = (raw ?? {}) as Record<string, unknown>;
  const out: Partial<Materials> = {};
  for (const k of MATERIAL_KINDS) {
    const n = int(o[k], max);
    if (n > 0) out[k] = n;
  }
  return out;
}

/** Làm sạch dòng `city_hub` đọc từ cơ sở dữ liệu (không tin dữ liệu cũ / hỏng). */
export function cleanHubUser(raw: unknown): HubUser {
  const r = (raw ?? {}) as Record<string, unknown>;
  const total = { ...EMPTY_MATERIALS, ...cleanMaterials(r.total) };
  const recent = (Array.isArray(r.recent) ? r.recent : [])
    .map((x) => x as Record<string, unknown>)
    .filter((x) => typeof x.at === 'string')
    .slice(0, HUB.recentKept)
    .map((x) => ({ id: str(x.id, 64), at: str(x.at, 40), m: cleanMaterials(x.m) }));
  const notes = (Array.isArray(r.notes) ? r.notes : [])
    .map((x) => x as Record<string, unknown>)
    .filter((x) => typeof x.text === 'string' && typeof x.at === 'string')
    .slice(0, HUB.notesKept)
    .map((x) => ({ text: cleanHubNote(x.text), at: str(x.at, 40) }))
    .filter((x) => x.text);
  const ids = (Array.isArray(r.ids) ? r.ids : []).filter((x): x is string => typeof x === 'string').slice(0, HUB.idsKept);
  return { total, day: str(r.day, 10), dayUnits: int(r.dayUnits), recent, notes, ids };
}

/** Còn góp được bao nhiêu đơn vị hôm nay. */
export function hubRoom(user: HubUser, day: string): number {
  return Math.max(0, HUB.dailyUnitCap - (user.day === day ? user.dayUnits : 0));
}

export type ContributeResult =
  | { ok: true; user: HubUser; given: Partial<Materials>; units: number; duplicate?: boolean }
  | { ok: false; reason: 'invalid' | 'empty' | 'daily'; room: number };

/**
 * Nhận một lượt góp. Tất cả hoặc không: vượt trần ngày thì từ chối cả lượt và
 * báo còn góp được bao nhiêu. Mã đã nhận → trả `duplicate` (thành công, không cộng).
 */
export function applyContribution(user: HubUser, raw: unknown, id: string, at: string, day: string): ContributeResult {
  const room = hubRoom(user, day);
  if (!id || id.length > 64) return { ok: false, reason: 'invalid', room };
  if (user.ids.includes(id)) {
    const prev = user.recent.find((r) => r.id === id);
    return { ok: true, user, given: prev?.m ?? {}, units: units(prev?.m ?? {}), duplicate: true };
  }
  const o = (raw ?? {}) as Record<string, unknown>;
  for (const k of MATERIAL_KINDS) {
    const v = o[k];
    if (v === undefined || v === 0) continue;
    if (typeof v !== 'number' || !Number.isInteger(v) || v < 0 || v > HUB.maxPerKind) return { ok: false, reason: 'invalid', room };
  }
  const given = cleanMaterials(raw, HUB.maxPerKind);
  const n = units(given);
  if (n <= 0) return { ok: false, reason: 'empty', room };
  if (n > room) return { ok: false, reason: 'daily', room };
  const total = { ...user.total };
  for (const k of MATERIAL_KINDS) total[k] += given[k] ?? 0;
  return {
    ok: true,
    given,
    units: n,
    user: {
      ...user,
      total,
      day,
      dayUnits: (user.day === day ? user.dayUnits : 0) + n,
      recent: [{ id, at, m: given }, ...user.recent].slice(0, HUB.recentKept),
      ids: [id, ...user.ids].slice(0, HUB.idsKept),
    },
  };
}

/** Bỏ ký tự điều khiển / ký tự đảo chiều, gộp khoảng trắng, cắt độ dài. */
export function cleanHubNote(s: unknown): string {
  if (typeof s !== 'string') return '';
  return s
    .replace(/[\u0000-\u001F\u007F​-‏‪-‮⁦-⁩]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, HUB.noteMax);
}

export function addHubNote(user: HubUser, text: unknown, at: string, day: string): { ok: true; user: HubUser } | { ok: false; reason: 'empty' | 'daily' } {
  const clean = cleanHubNote(text);
  if (!clean) return { ok: false, reason: 'empty' };
  const today = user.notes.filter((n) => n.at.slice(0, 10) === day).length;
  if (today >= HUB.notesPerDay) return { ok: false, reason: 'daily' };
  return { ok: true, user: { ...user, notes: [{ text: clean, at }, ...user.notes].slice(0, HUB.notesKept) } };
}

// ------------------------------------------------------------------ gộp mọi người

export type HubRow = { key: string; name: string; user: HubUser };
export type HubContributor = { key: string; name: string; units: number };
export type HubActivity = { name: string; materials: Partial<Materials>; units: number; at: string };
export type HubBoardNote = { name: string; text: string; at: string };

export type HubAggregate = {
  total: Materials;
  people: number;
  contributors: HubContributor[];
  activity: HubActivity[];
  board: HubBoardNote[];
};

/** Cộng dồn mọi dòng `city_hub`: tổng vật liệu, bảng vàng, hoạt động gần đây, bảng tin. */
export function aggregateHub(rows: readonly HubRow[], limits = { contributors: 10, activity: 20, board: 30 }): HubAggregate {
  const total = { ...EMPTY_MATERIALS };
  const contributors: HubContributor[] = [];
  const activity: HubActivity[] = [];
  const board: HubBoardNote[] = [];
  for (const r of rows) {
    for (const k of MATERIAL_KINDS) total[k] += r.user.total[k];
    const u = units(r.user.total);
    if (u > 0) contributors.push({ key: r.key, name: r.name, units: u });
    for (const c of r.user.recent) activity.push({ name: r.name, materials: c.m, units: units(c.m), at: c.at });
    for (const n of r.user.notes) board.push({ name: r.name, text: n.text, at: n.at });
  }
  contributors.sort((a, b) => b.units - a.units || a.name.localeCompare(b.name));
  const byTime = (a: { at: string }, b: { at: string }) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0);
  activity.sort(byTime);
  board.sort(byTime);
  return {
    total,
    people: contributors.length,
    contributors: contributors.slice(0, limits.contributors),
    activity: activity.slice(0, limits.activity),
    board: board.slice(0, limits.board),
  };
}

/** Thứ hạng (1 = góp nhiều nhất) của một người trong mọi dòng; 0 khi chưa góp. */
export function rankOf(rows: readonly HubRow[], key: string): number {
  const mine = rows.find((r) => r.key === key);
  const u = mine ? units(mine.user.total) : 0;
  if (u <= 0) return 0;
  return 1 + rows.filter((r) => units(r.user.total) > u).length;
}

// ------------------------------------------------------------------ kiểu trả về của API

export type HubDistrict = { id: string; name: string; owner: string; era: number; buildings: number; likes: number };

export type HubSnapshot = HubAggregate & {
  progress: HubProgress;
  districts: HubDistrict[];
  /** Phần của người đang xem (khi đã đăng nhập). */
  me: { units: number; rank: number; today: number; room: number; notesToday: number } | null;
  updatedAt: string;
};

export function unitsOf(m: Partial<Materials>): number {
  return units(m);
}

export function materialList(m: Partial<Materials>): { kind: MaterialKind; n: number }[] {
  return MATERIAL_KINDS.filter((k) => (m[k] ?? 0) > 0).map((k) => ({ kind: k, n: m[k]! }));
}
