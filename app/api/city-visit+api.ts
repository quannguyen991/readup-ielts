import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { anonymousName, displayableName } from '@/services/gamification/display-name';
import { addNote, cleanNote, EMPTY_HOME, EMPTY_SOCIAL, toggleLike, type CitySocial, type HomeLayout } from '@/services/city/life';
import { furnitureById } from '@/data/city/furniture';

/**
 * THĂM THÀNH PHỐ BẠN BÈ (kiểu Play Together).
 *
 *   GET  /api/city-visit              → danh sách thành phố để đi thăm (xếp theo công học)
 *   GET  /api/city-visit?id=<mã>      → một thành phố: bản đồ, công trình, phòng khách, lượt thích, sổ lưu bút
 *   POST /api/city-visit { id, action: 'like' | 'note', text? }   (cần đăng nhập)
 *
 * CHỈ LỘ PHẦN ĐỂ NGẮM. Từ payload `city` chỉ trả địa hình (kiểu + seed), vùng
 * đã mở, đường, phân khu, công trình và kỷ — không trả kho vật liệu, đội thợ,
 * mã sự kiện đã thưởng. Tên người: chỉ khi họ tự đặt một cái tên trông như tên
 * người (cùng luật với bảng xếp hạng), còn lại "Học viên ####". Mã thành phố là
 * 12 ký tự đầu của id — id đầy đủ và email không rời máy chủ.
 *
 * Lượt thích và sổ lưu bút lưu ở khoá `city_social` của CHỦ thành phố trong
 * bảng `user_state` sẵn có (không đổi schema). Khoá này không nằm trong danh
 * sách đồng bộ của app, nên máy của chủ không ghi đè lên nó; chỉ API này ghi.
 */

type CityRow = { user_id: string; payload: Record<string, unknown> | null };
type Admin = ReturnType<typeof getSupabaseAdmin>;

const SHORT = 12;
const shortId = (userId: string) => userId.replace(/-/g, '').slice(0, SHORT);

function safeName(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const s = raw.trim().slice(0, 60);
  return s && !s.includes('@') ? s : null;
}

async function namesOf(admin: Admin, ids: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (ids.length === 0) return out;
  const { data } = await admin.from('profiles').select('id, display_name').in('id', ids);
  for (const p of (data ?? []) as { id: string; display_name: string | null }[]) {
    const n = displayableName(p.display_name);
    if (n) out.set(p.id, n);
  }
  return out;
}

async function socialOf(admin: Admin, userIds: string[]): Promise<Map<string, CitySocial>> {
  const out = new Map<string, CitySocial>();
  if (userIds.length === 0) return out;
  const { data } = await admin.from('user_state').select('user_id, payload').eq('store_key', 'city_social').in('user_id', userIds);
  for (const r of (data ?? []) as unknown as CityRow[]) {
    const p = (r.payload ?? {}) as Partial<CitySocial>;
    out.set(r.user_id, { likes: Array.isArray(p.likes) ? p.likes.filter((x) => typeof x === 'string') : [], notes: Array.isArray(p.notes) ? p.notes : [] });
  }
  return out;
}

/** Tìm chủ thành phố theo mã rút gọn (chỉ trong những người đã có thành phố). */
async function findOwner(admin: Admin, id: string): Promise<string | null> {
  if (!/^[0-9a-f]{12}$/.test(id)) return null;
  const { data } = await admin.from('user_state').select('user_id').eq('store_key', 'city');
  const hit = ((data ?? []) as { user_id: string }[]).find((r) => shortId(r.user_id) === id);
  return hit?.user_id ?? null;
}

function cleanHome(raw: unknown): HomeLayout {
  const h = (raw ?? {}) as Partial<HomeLayout>;
  const items = Array.isArray(h.items) ? h.items.filter((p) => p && typeof p.item === 'string' && furnitureById(p.item) && Number.isInteger(p.x) && Number.isInteger(p.y)).slice(0, 80) : [];
  const hex = (c: unknown, d: string) => (typeof c === 'string' && /^#[0-9a-fA-F]{6}$/.test(c) ? c : d);
  return { items: items.map((p) => ({ uid: String(p.uid).slice(0, 16), item: p.item, x: p.x, y: p.y, rot: p.rot === 1 ? 1 : 0 })), floor: hex(h.floor, EMPTY_HOME.floor), wall: hex(h.wall, EMPTY_HOME.wall) };
}

async function identify(request: Request, admin: Admin): Promise<string | null> {
  const header = request.headers.get('authorization') ?? '';
  const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
  if (!token) return null;
  const { data, error } = await admin.auth.getUser(token);
  return error || !data.user ? null : data.user.id;
}

export async function GET(request: Request): Promise<Response> {
  try {
    const admin = getSupabaseAdmin();
    const id = new URL(request.url).searchParams.get('id');

    if (!id) {
      // Chỉ kéo vài trường nhỏ — `sites` có thể dài, ở danh sách chỉ cần đếm.
      const { data, error } = await admin
        .from('user_state')
        .select('user_id, name:payload->>name, era:payload->era, lifetime:payload->lifetime, terrain:payload->terrain, sites:payload->sites')
        .eq('store_key', 'city');
      if (error) return Response.json({ error: error.message }, { status: 500 });
      type Row = { user_id: string; name: string | null; era: number | null; lifetime: number | null; terrain: unknown; sites: unknown[] | null };
      const rows = ((data ?? []) as unknown as Row[]).filter((r) => r.terrain && Array.isArray(r.sites) && r.sites.length > 0);
      rows.sort((a, b) => (b.lifetime ?? 0) - (a.lifetime ?? 0));
      const top = rows.slice(0, 40);
      const ids = top.map((r) => r.user_id);
      const [names, social] = await Promise.all([namesOf(admin, ids), socialOf(admin, ids)]);
      return Response.json({
        cities: top.map((r) => {
          const owner = names.get(r.user_id) ?? anonymousName(r.user_id);
          return {
            id: shortId(r.user_id),
            name: safeName(r.name) ?? `Thành phố của ${owner}`,
            owner,
            era: typeof r.era === 'number' ? r.era : 1,
            buildings: r.sites!.length,
            likes: social.get(r.user_id)?.likes.length ?? 0,
          };
        }),
      });
    }

    const owner = await findOwner(admin, id);
    if (!owner) return Response.json({ error: 'Không tìm thấy thành phố.' }, { status: 404 });
    const { data } = await admin.from('user_state').select('store_key, payload').eq('user_id', owner).in('store_key', ['city', 'city_life', 'city_social']);
    const by = new Map(((data ?? []) as { store_key: string; payload: Record<string, unknown> | null }[]).map((r) => [r.store_key, r.payload ?? {}]));
    const city = by.get('city') ?? {};
    if (!city.terrain) return Response.json({ error: 'Thành phố chưa có.' }, { status: 404 });
    const names = await namesOf(admin, [owner]);
    const ownerName = names.get(owner) ?? anonymousName(owner);
    const soc = (by.get('city_social') ?? EMPTY_SOCIAL) as CitySocial;
    const viewer = await identify(request, admin);
    return Response.json({
      id,
      owner: ownerName,
      name: safeName(city.name) ?? `Thành phố của ${ownerName}`,
      city: { terrain: city.terrain, regions: city.regions ?? [], roads: city.roads ?? {}, zones: city.zones ?? {}, works: city.works ?? {}, sites: city.sites ?? [], era: city.era ?? 1 },
      home: cleanHome((by.get('city_life') as { home?: unknown } | undefined)?.home),
      likes: Array.isArray(soc.likes) ? soc.likes.length : 0,
      liked: viewer ? (soc.likes ?? []).includes(shortId(viewer)) : false,
      mine: viewer === owner,
      notes: (Array.isArray(soc.notes) ? soc.notes : []).slice(0, 20).map((n) => ({ name: n.name, text: n.text, at: n.at })),
    });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Không đọc được thành phố.' }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const admin = getSupabaseAdmin();
    const viewer = await identify(request, admin);
    if (!viewer) return Response.json({ error: 'Cần đăng nhập để thích hoặc ghi sổ lưu bút.' }, { status: 401 });
    const body = (await request.json().catch(() => ({}))) as { id?: string; action?: string; text?: unknown };
    const owner = await findOwner(admin, String(body.id ?? ''));
    if (!owner) return Response.json({ error: 'Không tìm thấy thành phố.' }, { status: 404 });
    if (owner === viewer) return Response.json({ error: 'Đây là thành phố của bạn.' }, { status: 400 });

    const { data } = await admin.from('user_state').select('payload').eq('user_id', owner).eq('store_key', 'city_social').maybeSingle();
    const cur = { ...EMPTY_SOCIAL, ...((data?.payload ?? {}) as Partial<CitySocial>) };
    const me = shortId(viewer);
    let next: CitySocial;
    let liked: boolean | undefined;
    if (body.action === 'like') {
      const r = toggleLike(cur, me);
      next = r.social;
      liked = r.liked;
    } else if (body.action === 'note') {
      const names = await namesOf(admin, [viewer]);
      const r = addNote(cur, { by: me, name: names.get(viewer) ?? anonymousName(viewer), text: cleanNote(body.text), at: new Date().toISOString() });
      if (!r.ok) return Response.json({ error: r.reason === 'daily' ? 'Mỗi ngày bạn ghi được một lời nhắn cho thành phố này.' : 'Lời nhắn đang trống.' }, { status: 400 });
      next = r.social;
    } else {
      return Response.json({ error: 'Thao tác không hợp lệ.' }, { status: 400 });
    }
    const { error } = await admin
      .from('user_state')
      .upsert([{ user_id: owner, store_key: 'city_social', payload: next as never, updated_at: new Date().toISOString() }], { onConflict: 'user_id,store_key' });
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ ok: true, likes: next.likes.length, liked, notes: next.notes.slice(0, 20).map((n) => ({ name: n.name, text: n.text, at: n.at })) });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Không ghi được.' }, { status: 500 });
  }
}
