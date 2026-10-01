import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { anonymousName } from '@/services/gamification/display-name';
import { addNote, cleanNote, EMPTY_HOME, EMPTY_SOCIAL, toggleLike, type CitySocial, type HomeLayout } from '@/services/city/life';
import { defaultCityName, identify, listCities, namesOf, safeName, shortId } from '@/lib/city-server';
import { furnitureById } from '@/data/city/furniture';
import { errorText, msg } from '@/lib/server-locale';

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

type Admin = ReturnType<typeof getSupabaseAdmin>;

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

export async function GET(request: Request): Promise<Response> {
  try {
    const admin = getSupabaseAdmin();
    const id = new URL(request.url).searchParams.get('id');

    if (!id) {
      // Danh sách dùng chung với "Khu của mọi người" ở Trung tâm Tương lai.
      return Response.json({ cities: await listCities(admin, 40, request) });
    }

    const owner = await findOwner(admin, id);
    if (!owner) return Response.json({ error: msg(request, 'Không tìm thấy thành phố.', 'City not found.') }, { status: 404 });
    const { data } = await admin.from('user_state').select('store_key, payload').eq('user_id', owner).in('store_key', ['city', 'city_life', 'city_social']);
    const by = new Map(((data ?? []) as { store_key: string; payload: Record<string, unknown> | null }[]).map((r) => [r.store_key, r.payload ?? {}]));
    const city = by.get('city') ?? {};
    if (!city.terrain) return Response.json({ error: msg(request, 'Thành phố chưa có.', "This city hasn't been built yet.") }, { status: 404 });
    const names = await namesOf(admin, [owner]);
    const ownerName = names.get(owner) ?? anonymousName(owner);
    const soc = (by.get('city_social') ?? EMPTY_SOCIAL) as CitySocial;
    const viewer = await identify(request, admin);
    return Response.json({
      id,
      owner: ownerName,
      name: safeName(city.name) ?? defaultCityName(ownerName, request),
      city: { terrain: city.terrain, regions: city.regions ?? [], roads: city.roads ?? {}, zones: city.zones ?? {}, works: city.works ?? {}, sites: city.sites ?? [], era: city.era ?? 1 },
      home: cleanHome((by.get('city_life') as { home?: unknown } | undefined)?.home),
      likes: Array.isArray(soc.likes) ? soc.likes.length : 0,
      liked: viewer ? (soc.likes ?? []).includes(shortId(viewer)) : false,
      mine: viewer === owner,
      notes: (Array.isArray(soc.notes) ? soc.notes : []).slice(0, 20).map((n) => ({ name: n.name, text: n.text, at: n.at })),
    });
  } catch (err) {
    return Response.json({ error: errorText(request, err, 'Không đọc được thành phố.', 'Could not load the city.') }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const admin = getSupabaseAdmin();
    const viewer = await identify(request, admin);
    if (!viewer) return Response.json({ error: msg(request, 'Cần đăng nhập để thích hoặc ghi sổ lưu bút.', 'Sign in to like or write in the guestbook.') }, { status: 401 });
    const body = (await request.json().catch(() => ({}))) as { id?: string; action?: string; text?: unknown };
    const owner = await findOwner(admin, String(body.id ?? ''));
    if (!owner) return Response.json({ error: msg(request, 'Không tìm thấy thành phố.', 'City not found.') }, { status: 404 });
    if (owner === viewer) return Response.json({ error: msg(request, 'Đây là thành phố của bạn.', 'This is your own city.') }, { status: 400 });

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
      if (!r.ok) return Response.json({
            error:
              r.reason === 'daily'
                ? msg(request, 'Mỗi ngày bạn ghi được một lời nhắn cho thành phố này.', 'You can leave one note for this city each day.')
                : msg(request, 'Lời nhắn đang trống.', 'Your note is empty.'),
          }, { status: 400 });
      next = r.social;
    } else {
      return Response.json({ error: msg(request, 'Thao tác không hợp lệ.', 'Invalid action.') }, { status: 400 });
    }
    const { error } = await admin
      .from('user_state')
      .upsert([{ user_id: owner, store_key: 'city_social', payload: next as never, updated_at: new Date().toISOString() }], { onConflict: 'user_id,store_key' });
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ ok: true, likes: next.likes.length, liked, notes: next.notes.slice(0, 20).map((n) => ({ name: n.name, text: n.text, at: n.at })) });
  } catch (err) {
    return Response.json({ error: errorText(request, err, 'Không ghi được.', 'Could not save.') }, { status: 500 });
  }
}
