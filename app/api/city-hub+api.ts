import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { identify, localizeDistricts, readHubBase, shortId, type Admin, type HubBase } from '@/lib/city-server';
import { ECONOMY } from '@/services/city/economy';
import {
  addHubNote,
  applyContribution,
  cleanHubUser,
  EMPTY_HUB_USER,
  HUB,
  hubRoom,
  rankOf,
  type HubSnapshot,
  type HubUser,
} from '@/services/city/hub';
import { MATERIAL_KINDS } from '@/services/city/materials';
import { vnToday } from '@/services/gamification/golden';
import { errorText, msg } from '@/lib/server-locale';

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
 * Chống lạm dụng: trần 600 đơn vị / người / ngày (giờ VN, `HUB.dailyUnitCap`; đổi sao cũng nằm trong số này), mã lượt góp chống
 * cộng trùng khi gửi lại, và mỗi loại không được vượt kho đã đồng bộ của người
 * đó + phần có thể kiếm/đổi trong một ngày (kho trên máy có thể chưa kịp đồng bộ).
 * Tên người theo cùng luật với /api/city-visit; không lộ id đầy đủ hay email.
 */

const TTL_MS = 20_000;
type Base = HubBase & { at: number };
let cache: Base | null = null;

async function loadBase(admin: Admin): Promise<Base> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache;
  cache = { at: Date.now(), ...(await readHubBase(admin)) };
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

async function snapshotFor(admin: Admin, viewer: string | null, request: Request): Promise<HubSnapshot> {
  const base = await loadBase(admin);
  return {
    ...base.snapshot,
    districts: localizeDistricts(base.snapshot.districts, request),
    me: viewer ? meOf(base.rows, viewer, vnToday(new Date()).key) : null,
  };
}

export async function GET(request: Request): Promise<Response> {
  try {
    const admin = getSupabaseAdmin();
    const viewer = await identify(request, admin);
    return Response.json(await snapshotFor(admin, viewer, request));
  } catch (err) {
    return Response.json({ error: errorText(request, err, 'Không đọc được Trung tâm.', 'Could not load the Hub.') }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const admin = getSupabaseAdmin();
    const viewer = await identify(request, admin);
    if (!viewer) return Response.json({ error: msg(request, 'Cần đăng nhập để góp vật liệu hoặc ghi bảng tin.', 'Sign in to contribute materials or post on the board.'), code: 'auth' }, { status: 401 });
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
          return Response.json({
              error: msg(
                request,
                'Kho vật liệu trên máy chủ chưa khớp số bạn góp — mở lại thành phố để đồng bộ rồi thử lại.',
                "The server's material stock doesn't match what you're contributing — reopen your city to sync, then try again.",
              ),
              code: 'materials',
            }, { status: 409 });
        }
      }
      const r = applyContribution(cur, body.materials, String(body.id ?? ''), at, day);
      if (!r.ok) {
        const text =
          r.reason === 'daily'
            ? msg(
                request,
                `Mỗi ngày mỗi người góp tối đa ${HUB.dailyUnitCap} đơn vị. Hôm nay bạn còn góp được ${r.room}.`,
                `Each person can contribute up to ${HUB.dailyUnitCap} units a day. You can still contribute ${r.room} today.`,
              )
            : r.reason === 'empty'
              ? msg(request, 'Chọn ít nhất một vật liệu để góp.', 'Pick at least one material to contribute.')
              : msg(request, 'Lượt góp không hợp lệ.', 'Invalid contribution.');
        return Response.json({ error: text, code: r.reason, room: r.room }, { status: 400 });
      }
      if (r.duplicate) return Response.json({ ok: true, duplicate: true, given: r.given, units: r.units, hub: await snapshotFor(admin, viewer, request) });
      next = r.user;
      extra = { given: r.given, units: r.units };
    } else if (body.action === 'note') {
      const r = addHubNote(cur, body.text, at, day);
      if (!r.ok) {
        return Response.json({
            error:
              r.reason === 'daily'
                ? msg(request, 'Mỗi ngày bạn ghi được 3 lời trên bảng tin.', 'You can post 3 notes on the board each day.')
                : msg(request, 'Lời nhắn đang trống.', 'Your note is empty.'),
            code: r.reason,
          }, { status: 400 });
      }
      next = r.user;
    } else {
      return Response.json({ error: msg(request, 'Thao tác không hợp lệ.', 'Invalid action.'), code: 'invalid' }, { status: 400 });
    }

    const { error } = await admin
      .from('user_state')
      .upsert([{ user_id: viewer, store_key: 'city_hub', payload: next as never, updated_at: at }], { onConflict: 'user_id,store_key' });
    if (error) return Response.json({ error: error.message }, { status: 500 });
    cache = null;
    return Response.json({ ok: true, ...extra, hub: await snapshotFor(admin, viewer, request) });
  } catch (err) {
    return Response.json({ error: errorText(request, err, 'Không ghi được.', 'Could not save.') }, { status: 500 });
  }
}
