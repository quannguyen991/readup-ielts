import { requireAdmin } from '@/services/admin/guard';
import { fetchAllPages } from '@/services/admin/fetch-all';
import { applyGift, checkGiftAmount, GIFT_MAX, newGiftId } from '@/services/admin/gift-stars';
import { errorText, msg } from '@/lib/server-locale';

/**
 * POST /api/admin/stars   (chỉ quản trị viên)
 *   { userId: string, stars: number, note?: string }   → tặng một người
 *   { all: true,      stars: number, note?: string }   → tặng TẤT CẢ tài khoản
 *
 * Sao tặng ghi thành một khoản riêng `prizes['gift:<mã đợt>']` trong payload
 * `reward` của người nhận (xem `services/admin/gift-stars.ts` — vì sao không
 * cộng vào `bonusStars`). Máy người dùng nhận khoản này ở lần đồng bộ kế tiếp.
 * Mọi lần tặng đều ghi `admin_audit`.
 */
// `payload` là jsonb — để `unknown`, kiểu Json của Supabase không gán thẳng vào Record được.
type RewardRow = { user_id: string; payload: unknown };

const UPSERT_CHUNK = 200;

export async function POST(request: Request): Promise<Response> {
  try {
    const guard = await requireAdmin(request);
    if (!guard.ok) return guard.response;
    const { admin, actor } = guard;

    const body = (await request.json().catch(() => ({}))) as { userId?: unknown; all?: unknown; stars?: unknown; note?: unknown };
    const amount = checkGiftAmount(body.stars);
    if (!amount.ok) {
      return Response.json(
        { error: msg(request, amount.error, `Stars must be a whole number from 1 to ${GIFT_MAX.toLocaleString('en-US')}.`) },
        { status: 400 },
      );
    }
    const note = typeof body.note === 'string' ? body.note.trim().slice(0, 200) : '';
    const all = body.all === true;
    const userId = typeof body.userId === 'string' ? body.userId : '';
    if (!all && !userId) return Response.json({ error: msg(request, 'Thiếu userId (hoặc all: true).', 'userId (or all: true) is required.') }, { status: 400 });

    // ----------------------------------------------------------- người nhận
    let targets: string[] = [];
    if (all) {
      for (let page = 1; page <= 100; page += 1) {
        const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
        if (error) return Response.json({ error: error.message }, { status: 500 });
        targets.push(...data.users.map((u) => u.id));
        if (data.users.length < 1000) break;
      }
    } else {
      targets = [userId];
    }
    if (targets.length === 0) return Response.json({ error: msg(request, 'Không có tài khoản nào để tặng.', 'No accounts to gift.') }, { status: 400 });

    // ------------------------------------------------- đọc payload reward hiện có
    const existing = new Map<string, unknown>();
    if (all) {
      const { rows, error } = await fetchAllPages<RewardRow>((from, to) =>
        admin.from('user_state').select('user_id, payload').eq('store_key', 'reward').order('user_id').range(from, to),
      );
      if (error) return Response.json({ error: error.message }, { status: 500 });
      for (const r of rows) existing.set(r.user_id, r.payload);
    } else {
      const { data, error } = await admin.from('user_state').select('user_id, payload').eq('store_key', 'reward').eq('user_id', userId).maybeSingle();
      if (error) return Response.json({ error: error.message }, { status: 500 });
      if (data) existing.set((data as RewardRow).user_id, (data as RewardRow).payload);
    }

    // ------------------------------------------------------------- ghi
    const giftId = newGiftId(new Date());
    const now = new Date().toISOString();
    const rows = targets.map((id) => ({ user_id: id, store_key: 'reward', payload: applyGift(existing.get(id) as Record<string, unknown> | null | undefined, giftId, amount.stars) as never, updated_at: now }));
    for (let i = 0; i < rows.length; i += UPSERT_CHUNK) {
      const { error } = await admin.from('user_state').upsert(rows.slice(i, i + UPSERT_CHUNK), { onConflict: 'user_id,store_key' });
      if (error) return Response.json({ error: msg(request, `Đã tặng ${i} / ${rows.length} tài khoản rồi dừng: ${error.message}`, `Gifted ${i} / ${rows.length} accounts, then stopped: ${error.message}`) }, { status: 500 });
    }

    // ------------------------------------------------------------- nhật ký
    const { error: auditError } = await admin.from('admin_audit').insert({
      actor_id: actor.userId,
      // Bảng nhật ký bắt buộc có người nhận: đợt tặng tất cả ghi MỘT dòng mang id người tặng, số người nhận nằm trong `after`.
      target_id: all ? actor.userId : userId,
      action: all ? 'gift_stars_all' : 'gift_stars',
      before: null,
      after: { giftId, stars: amount.stars, recipients: rows.length },
      note: note || (all ? `tặng ${amount.stars} sao cho tất cả` : `tặng ${amount.stars} sao`),
    });

    return Response.json({ ok: true, giftId, stars: amount.stars, recipients: rows.length, ...(auditError ? { auditWarning: auditError.message } : {}) });
  } catch (err) {
    return Response.json({ error: errorText(request, err, 'Lỗi không xác định.', 'Unknown error.') }, { status: 500 });
  }
}
