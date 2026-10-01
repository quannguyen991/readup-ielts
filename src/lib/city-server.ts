/**
 * Phần dùng chung của các API Thành Phố Tri Thức (`/api/city-visit`,
 * `/api/city-hub`) — CHỈ phía máy chủ (dùng khoá service qua `supabase-admin`).
 *
 * Quy tắc lộ dữ liệu giữ nguyên như khi còn nằm trong city-visit: tên người chỉ
 * hiện khi họ tự đặt tên trông như tên người (`displayableName`), còn lại
 * "Học viên ####"; mã người dùng rút gọn 12 ký tự, id đầy đủ và email không
 * rời máy chủ.
 */
import { msg, type LocaleSource } from '@/lib/server-locale';
import type { getSupabaseAdmin } from '@/lib/supabase-admin';
import { fetchAllPages } from '@/services/admin/fetch-all';
import { anonymousName, displayableName } from '@/services/gamification/display-name';
import { aggregateHub, cleanHubUser, displayedKeys, hubProgress, withNames, type HubDistrict, type HubRow, type HubSnapshot } from '@/services/city/hub';

export type Admin = ReturnType<typeof getSupabaseAdmin>;

const SHORT = 12;
export const shortId = (userId: string) => userId.replace(/-/g, '').slice(0, SHORT);

export function safeName(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const s = raw.trim().slice(0, 60);
  return s && !s.includes('@') ? s : null;
}

/** Số id tối đa trong một truy vấn `.in()` — URL của PostgREST có hạn độ dài (~8 KB ≈ 200 uuid). */
const IN_CHUNK = 100;

/** Tên hiển thị được của từng người (thiếu thì người gọi dùng `anonymousName`). Chia lô để danh sách dài không làm hỏng URL. */
export async function namesOf(admin: Admin, ids: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const uniq = [...new Set(ids)];
  for (let i = 0; i < uniq.length; i += IN_CHUNK) {
    const { data } = await admin.from('profiles').select('id, display_name').in('id', uniq.slice(i, i + IN_CHUNK));
    for (const p of (data ?? []) as { id: string; display_name: string | null }[]) {
      const n = displayableName(p.display_name);
      if (n) out.set(p.id, n);
    }
  }
  return out;
}

/**
 * Khoảng uuid chứa mọi người có mã rút gọn `short` (12 ký tự hex = 8 + 4 đầu của
 * uuid). Tra đúng một khoảng thay vì đọc cả bảng (PostgREST cắt im lặng ở 1.000 dòng).
 */
export function userIdRange(short: string): { lo: string; hi: string } | null {
  if (!/^[0-9a-f]{12}$/.test(short)) return null;
  const head = `${short.slice(0, 8)}-${short.slice(8, 12)}`;
  return { lo: `${head}-0000-0000-000000000000`, hi: `${head}-ffff-ffff-ffffffffffff` };
}

/** Tìm chủ thành phố theo mã rút gọn, trong những người đã có dòng `city`. */
export async function findCityOwner(admin: Admin, short: string): Promise<string | null> {
  const range = userIdRange(short);
  if (!range) return null;
  const { data } = await admin.from('user_state').select('user_id').eq('store_key', 'city').gte('user_id', range.lo).lte('user_id', range.hi);
  const hit = ((data ?? []) as { user_id: string }[]).find((r) => shortId(r.user_id) === short);
  return hit?.user_id ?? null;
}

export function nameOrAnon(names: Map<string, string>, userId: string): string {
  return names.get(userId) ?? anonymousName(userId);
}

/** Người gọi (từ `Authorization: Bearer <token>`), hoặc null. */
export async function identify(request: Request, admin: Admin): Promise<string | null> {
  const header = request.headers.get('authorization') ?? '';
  const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
  if (!token) return null;
  const { data, error } = await admin.auth.getUser(token);
  return error || !data.user ? null : data.user.id;
}

/** Lượt thích của thành phố từng người (khoá `city_social`). */
export async function likesOf(admin: Admin, userIds: string[]): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (userIds.length === 0) return out;
  const { data } = await admin.from('user_state').select('user_id, payload').eq('store_key', 'city_social').in('user_id', userIds);
  for (const r of (data ?? []) as unknown as { user_id: string; payload: { likes?: unknown } | null }[]) {
    const likes = Array.isArray(r.payload?.likes) ? r.payload!.likes.filter((x) => typeof x === 'string').length : 0;
    out.set(r.user_id, likes);
  }
  return out;
}

/** Tên mặc định khi chủ thành phố chưa đặt tên — theo ngôn ngữ người xem. */
export function defaultCityName(owner: string, locale: LocaleSource = 'vi'): string {
  return msg(locale, `Thành phố của ${owner}`, `${owner}'s city`);
}

/**
 * Đổi tên mặc định của danh sách đã dựng sẵn (bản cache dùng chung, dựng bằng
 * tiếng Việt) sang ngôn ngữ người xem. Tên do người chơi tự đặt giữ nguyên.
 */
export function localizeDistricts(districts: HubDistrict[], locale: LocaleSource): HubDistrict[] {
  if (msg(locale, 'vi', 'en') === 'vi') return districts;
  return districts.map((d) => (d.name === defaultCityName(d.owner, 'vi') ? { ...d, name: defaultCityName(d.owner, locale) } : d));
}

/**
 * Danh sách thành phố để đi thăm ("Khu của mọi người"), xếp theo công học
 * (`lifetime`). Chỉ kéo vài trường nhỏ — `sites` có thể dài, ở đây chỉ đếm.
 */
export async function listCities(admin: Admin, limit = 40, locale: LocaleSource = 'vi'): Promise<HubDistrict[]> {
  type Row = { user_id: string; name: string | null; era: number | null; lifetime: number | null; terrain: unknown; sites: unknown[] | null };
  // Đọc theo trang (PostgREST cắt im lặng ở 1.000 dòng) với thứ tự cố định, rồi mới xếp theo công học.
  const { rows: all, error } = await fetchAllPages<Row>((from, to) =>
    admin
      .from('user_state')
      .select('user_id, name:payload->>name, era:payload->era, lifetime:payload->lifetime, terrain:payload->terrain, sites:payload->sites')
      .eq('store_key', 'city')
      .order('user_id', { ascending: true })
      .range(from, to) as never,
  );
  if (error) throw new Error(error.message);
  const rows = all.filter((r) => r.terrain && Array.isArray(r.sites) && r.sites.length > 0);
  rows.sort((a, b) => (b.lifetime ?? 0) - (a.lifetime ?? 0));
  const top = rows.slice(0, limit);
  const ids = top.map((r) => r.user_id);
  const [names, likes] = await Promise.all([namesOf(admin, ids), likesOf(admin, ids)]);
  return top.map((r) => {
    const owner = nameOrAnon(names, r.user_id);
    return {
      id: shortId(r.user_id),
      name: safeName(r.name) ?? defaultCityName(owner, locale),
      owner,
      era: typeof r.era === 'number' ? r.era : 1,
      buildings: r.sites!.length,
      likes: likes.get(r.user_id) ?? 0,
    };
  });
}

/** Đọc HẾT các dòng `city_hub` (mỗi người một dòng), theo trang. */
export async function fetchHubRows(admin: Admin): Promise<{ user_id: string; payload: unknown }[]> {
  const { rows, error } = await fetchAllPages<{ user_id: string; payload: unknown }>((from, to) =>
    admin.from('user_state').select('user_id, payload').eq('store_key', 'city_hub').order('user_id', { ascending: true }).range(from, to) as never,
  );
  if (error) throw new Error(error.message);
  return rows;
}

export type HubBase = { rows: (HubRow & { userId: string })[]; snapshot: Omit<HubSnapshot, 'me'> };

/**
 * Dựng bản tổng hợp Trung tâm: cộng dồn MỌI dòng góp (đọc theo trang), rồi chỉ tra
 * tên cho những người thực sự hiện ra (bảng vàng / hoạt động / bảng tin — tối đa
 * vài chục người), không tra cả nghìn người đã góp.
 */
export async function readHubBase(admin: Admin, now: Date = new Date()): Promise<HubBase> {
  const raw = await fetchHubRows(admin);
  const rows = raw.map((r) => ({ userId: r.user_id, key: shortId(r.user_id), name: '', user: cleanHubUser(r.payload) }));
  const draft = aggregateHub(rows);
  const keys = displayedKeys(draft);
  const idOf = new Map(rows.map((r) => [r.key, r.userId]));
  const names = await namesOf(admin, keys.map((k) => idOf.get(k)!).filter(Boolean));
  const agg = withNames(draft, (k) => {
    const id = idOf.get(k);
    return id ? nameOrAnon(names, id) : '';
  });
  const districts = await listCities(admin, 40).catch(() => []);
  return { rows, snapshot: { ...agg, progress: hubProgress(agg.total), districts, updatedAt: now.toISOString() } };
}
