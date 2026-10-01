import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { identify, listCities, nameOrAnon, namesOf, shortId, type Admin } from '@/lib/city-server';
import { ECONOMY } from '@/services/city/economy';
import {
  addHubNote,
  aggregateHub,
  applyContribution,
  cleanHubUser,
  EMPTY_HUB_USER,
  hubProgress,
  hubRoom,
  rankOf,
  type HubRow,
  type HubSnapshot,
  type HubUser,
} from '@/services/city/hub';
import { MATERIAL_KINDS } from '@/services/city/materials';
import { vnToday } from '@/services/gamification/golden';

/**
 * TRUNG TÂM TƯƠNG LAI — khu cao ốc chung, mọi người góp vật liệu cùng xây.
 *
 *   GET  /api/city-hub   → tiến độ năm tháp, bảng vàng, hoạt động gần đây, bảng tin,
 *                          "Khu của mọi người" (danh sách thành phố để thăm) và — khi
 *                          gửi kèm Bearer token — phần của người xem (`me`).
 *   POST /api/city-hub { action: 'contribute', materials: {wood?, stone?, …}, id }   (cần đăng nhập)
 *   POST /api/city-hub { action: 'note', text }                                       (cần đăng nhập)
 *
 * KHÔNG ĐỔI SCHEMA: mỗi người một dòng `user_state` khoá `city_hub` (chỉ API này
 * ghi; khoá không nằm trong danh sách đồng bộ của app nên máy người dùng không
 * ghi đè). GET cộng dồn mọi dòng `city_hub` — đủ nhanh ở quy mô hiện tại, có
 * bộ nhớ đệm 20 giây. Tiến độ tháp tính lại từ tổng đã góp (`hubProgress`).
 *
 * Chống lạm dụng: trần 300 đơn vị / người / ngày (giờ VN), mã lượt góp chống
 * cộng trùng khi gửi lại, và mỗi loại không được vượt kho đã đồng bộ của người
 * đó + phần có thể kiếm/đổi trong một ngày (kho trên máy có thể chưa kịp đồng bộ).
 * Tên người theo cùng luật với /api/city-visit; không lộ id đầy đủ hay email.
 */

const TTL_MS = 20_000;
type Base = { at: number; rows: (HubRow & { userId: string })[]; snapshot: Omit<HubSnapshot, 'me'> };
let cache: Base | null = null;

async function loadBase(admin: Admin): Promise<Base> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache;
  const { data, error } = await admin.from('user_state').select('user_id, payload').eq('store_key', 'city_hub');
  if (error) throw new Error(error.message);
  const raw = (data ?? []) as unknown as { user_id: string; payload: unknown }[];
  const names = await namesOf(admin, raw.map((r) => r.user_id));
  const rows = raw.map((r) => ({ userId: r.user_id, key: shortId(r.user_id), name: nameOrAnon(names, r.user_id), user: cleanHubUser(r.payload) }));
  const agg = aggregateHub(rows);
  const districts = await listCities(admin, 40).catch(() => []);
  cache = { at: Date.now(), rows, snapshot: { ...agg, progress: hubProgress(agg.total), districts, updatedAt: new Date().toISOString() } };
  return cache;
}

function meOf(rows: Base['rows'], viewer: string, day: string): NonNullable<HubSnapshot['me']> {
  const mine = rows.find((r) => r.userId === viewer)?.user ?? EMPTY_HUB_USER;
  const units = MATERIAL_KINDS.reduce((s, k) => s + mine.total[k], 0);
  return {
    units,
    rank: rankOf(rows, shortId(viewer)),
    today: mine.day === day ? mine.dayUnits : 0,
    room: hubRoom(mine, day),
    notesToday: mine.notes.filter((n) => n.at.slice(0, 10) === day).length,
  };
}

async function snapshotFor(admin: Admin, viewer: string | null): Promise<HubSnapshot> {
  const base = await loadBase(admin);
  return { ...base.snapshot, me: viewer ? meOf(base.rows, viewer, vnToday(new Date()).key) : null };
}

export async function GET(request: Request): Promise<Response> {
  try {
    const admin = getSupabaseAdmin();
    const viewer = await identify(request, admin);
    return Response.json(await snapshotFor(admin, viewer));
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Không đọc được Trung tâm.' }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const admin = getSupabaseAdmin();
    const viewer = await identify(request, admin);
    if (!viewer) return Response.json({ error: 'Cần đăng nhập để góp vật liệu hoặc ghi bảng tin.', code: 'auth' }, { status: 401 });
    const body = (await request.json().catch(() => ({}))) as { action?: string; materials?: unknown; id?: unknown; text?: unknown };
    const now = new Date();
    const day = vnToday(now).key;
    const at = now.toISOString();

    const { data } = await admin.from('user_state').select('store_key, payload').eq('user_id', viewer).in('store_key', ['city_hub', 'city']);
    const by = new Map(((data ?? []) as { store_key: string; payload: unknown }[]).map((r) => [r.store_key, r.payload]));
    const cur: HubUser = cleanHubUser(by.get('city_hub'));
    let next: HubUser;
    let extra: Record<string, unknown> = {};

    if (body.action === 'contribute') {
      // Không góp quá phần có thể có: kho đã đồng bộ + tối đa một ngày học + một ngày đổi sao.
      const inv = ((by.get('city') ?? {}) as { inventory?: Record<string, unknown> }).inventory ?? {};
      const m = (body.materials ?? {}) as Record<string, unknown>;
      for (const k of MATERIAL_KINDS) {
        const have = typeof inv[k] === 'number' ? (inv[k] as number) : 0;
        const ask = typeof m[k] === 'number' ? (m[k] as number) : 0;
        if (ask > have + ECONOMY.dailyCap[k] + ECONOMY.exchange.dailyCap[k]) {
          return Response.json({ error: 'Kho vật liệu trên máy chủ chưa khớp số bạn góp — mở lại thành phố để đồng bộ rồi thử lại.', code: 'materials' }, { status: 409 });
        }
      }
      const r = applyContribution(cur, body.materials, String(body.id ?? ''), at, day);
      if (!r.ok) {
        const msg =
          r.reason === 'daily'
            ? `Mỗi ngày mỗi người góp tối đa 300 đơn vị. Hôm nay bạn còn góp được ${r.room}.`
            : r.reason === 'empty'
              ? 'Chọn ít nhất một vật liệu để góp.'
              : 'Lượt góp không hợp lệ.';
        return Response.json({ error: msg, code: r.reason, room: r.room }, { status: 400 });
      }
      if (r.duplicate) return Response.json({ ok: true, duplicate: true, given: r.given, units: r.units, hub: await snapshotFor(admin, viewer) });
      next = r.user;
      extra = { given: r.given, units: r.units };
    } else if (body.action === 'note') {
      const r = addHubNote(cur, body.text, at, day);
      if (!r.ok) {
        return Response.json({ error: r.reason === 'daily' ? 'Mỗi ngày bạn ghi được 3 lời trên bảng tin.' : 'Lời nhắn đang trống.', code: r.reason }, { status: 400 });
      }
      next = r.user;
    } else {
      return Response.json({ error: 'Thao tác không hợp lệ.', code: 'invalid' }, { status: 400 });
    }

    const { error } = await admin
      .from('user_state')
      .upsert([{ user_id: viewer, store_key: 'city_hub', payload: next as never, updated_at: at }], { onConflict: 'user_id,store_key' });
    if (error) return Response.json({ error: error.message }, { status: 500 });
    cache = null;
    return Response.json({ ok: true, ...extra, hub: await snapshotFor(admin, viewer) });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Không ghi được.' }, { status: 500 });
  }
}
