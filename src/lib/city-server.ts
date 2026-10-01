/**
 * Phần dùng chung của các API Thành Phố Tri Thức (`/api/city-visit`,
 * `/api/city-hub`) — CHỈ phía máy chủ (dùng khoá service qua `supabase-admin`).
 *
 * Quy tắc lộ dữ liệu giữ nguyên như khi còn nằm trong city-visit: tên người chỉ
 * hiện khi họ tự đặt tên trông như tên người (`displayableName`), còn lại
 * "Học viên ####"; mã người dùng rút gọn 12 ký tự, id đầy đủ và email không
 * rời máy chủ.
 */
import type { getSupabaseAdmin } from '@/lib/supabase-admin';
import { anonymousName, displayableName } from '@/services/gamification/display-name';
import type { HubDistrict } from '@/services/city/hub';

export type Admin = ReturnType<typeof getSupabaseAdmin>;

const SHORT = 12;
export const shortId = (userId: string) => userId.replace(/-/g, '').slice(0, SHORT);

export function safeName(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const s = raw.trim().slice(0, 60);
  return s && !s.includes('@') ? s : null;
}

/** Tên hiển thị được của từng người (thiếu thì người gọi dùng `anonymousName`). */
export async function namesOf(admin: Admin, ids: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (ids.length === 0) return out;
  const { data } = await admin.from('profiles').select('id, display_name').in('id', ids);
  for (const p of (data ?? []) as { id: string; display_name: string | null }[]) {
    const n = displayableName(p.display_name);
    if (n) out.set(p.id, n);
  }
  return out;
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

/**
 * Danh sách thành phố để đi thăm ("Khu của mọi người"), xếp theo công học
 * (`lifetime`). Chỉ kéo vài trường nhỏ — `sites` có thể dài, ở đây chỉ đếm.
 */
export async function listCities(admin: Admin, limit = 40): Promise<HubDistrict[]> {
  const { data, error } = await admin
    .from('user_state')
    .select('user_id, name:payload->>name, era:payload->era, lifetime:payload->lifetime, terrain:payload->terrain, sites:payload->sites')
    .eq('store_key', 'city');
  if (error) throw new Error(error.message);
  type Row = { user_id: string; name: string | null; era: number | null; lifetime: number | null; terrain: unknown; sites: unknown[] | null };
  const rows = ((data ?? []) as unknown as Row[]).filter((r) => r.terrain && Array.isArray(r.sites) && r.sites.length > 0);
  rows.sort((a, b) => (b.lifetime ?? 0) - (a.lifetime ?? 0));
  const top = rows.slice(0, limit);
  const ids = top.map((r) => r.user_id);
  const [names, likes] = await Promise.all([namesOf(admin, ids), likesOf(admin, ids)]);
  return top.map((r) => {
    const owner = nameOrAnon(names, r.user_id);
    return {
      id: shortId(r.user_id),
      name: safeName(r.name) ?? `Thành phố của ${owner}`,
      owner,
      era: typeof r.era === 'number' ? r.era : 1,
      buildings: r.sites!.length,
      likes: likes.get(r.user_id) ?? 0,
    };
  });
}
