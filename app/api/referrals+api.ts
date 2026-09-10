import { generateInviteCode, isValidInviteCode } from '@/lib/payment/reference';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { settleReferralRewards, type PlanState } from '@/services/referral/rewards';

/**
 * GET  /api/referrals            → mã mời, tiến độ, và kích hoạt thưởng nếu đủ mốc
 * POST /api/referrals { code }   → khai người đã giới thiệu mình
 *
 * ĐIỀU KIỆN "HỢP LỆ" là phần đáng bàn nhất. Mọi cơ chế thưởng đều bị lợi dụng,
 * nên "đã bấm link" hay "đã tạo tài khoản" là quá dễ: mười email dùng một lần
 * làm xong trong mười phút.
 *
 * Ở đây một lượt chỉ tính khi NGƯỜI ĐƯỢC MỜI ĐÃ HỌC THẬT — có ít nhất một lượt
 * làm bài đã đồng bộ lên `user_state`. Nó không chống được người thật sự quyết
 * tâm gian lận (họ vẫn phải mở app và làm xong một bài trong từng tài khoản),
 * nhưng nó chuyển chi phí gian lận từ "mười phút" sang "một buổi chiều" — và
 * quan trọng hơn, nó khiến phần thưởng hướng đúng vào thứ ta muốn: người học
 * thật, không phải số đăng ký.
 *
 * Điều đó được NÓI THẲNG trên trang mời. Giấu điều kiện rồi để người dùng mời
 * mười người xong mới biết không được tính là cách nhanh nhất mất niềm tin.
 */

type Identity =
  | { ok: true; admin: ReturnType<typeof getSupabaseAdmin>; userId: string; createdAt: string }
  | { ok: false; error: Response };

async function identify(request: Request): Promise<Identity> {
  const header = request.headers.get('authorization') ?? '';
  const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
  if (!token) {
    return { ok: false, error: Response.json({ error: 'Thiếu access token.' }, { status: 401 }) };
  }
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) {
    return {
      ok: false,
      error: Response.json({ error: 'Phiên đăng nhập không hợp lệ.' }, { status: 401 }),
    };
  }
  return { ok: true, admin, userId: data.user.id, createdAt: data.user.created_at };
}

/** Người được mời đã học thật chưa: có ít nhất một lượt làm bài đã đồng bộ. */
async function hasStudied(
  admin: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
): Promise<boolean> {
  const { data } = await admin
    .from('user_state')
    .select('store_key, payload')
    .eq('user_id', userId)
    .in('store_key', ['study', 'math']);

  for (const row of (data ?? []) as Array<{ payload: unknown }>) {
    const sessions = (row.payload as { sessions?: unknown[] } | null)?.sessions;
    if (Array.isArray(sessions) && sessions.length > 0) return true;
  }
  return false;
}

export async function GET(request: Request): Promise<Response> {
  try {
    const who = await identify(request);
    if (!who.ok) return who.error;
    const { admin, userId } = who;

    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('referral_code, plan, plan_expires_at, plus_credit_months, referral_rewards_granted')
      .eq('id', userId)
      .maybeSingle();
    if (profileError) return Response.json({ error: profileError.message }, { status: 500 });
    if (!profile) return Response.json({ error: 'Không có hồ sơ.' }, { status: 404 });

    // Cấp mã mời khi người dùng mở trang lần đầu, không cấp sẵn cho mọi tài
    // khoản — phần lớn người dùng không bao giờ mở trang này.
    let code = profile.referral_code;
    if (!code) {
      for (let attempt = 0; attempt < 5 && !code; attempt += 1) {
        const candidate = generateInviteCode();
        const { error } = await admin
          .from('profiles')
          .update({ referral_code: candidate })
          .eq('id', userId);
        if (!error) code = candidate;
        else if (error.code !== '23505') {
          return Response.json({ error: error.message }, { status: 500 });
        }
      }
      if (!code) {
        return Response.json({ error: 'Không sinh được mã mời. Thử lại sau.' }, { status: 503 });
      }
    }

    const { data: rows, error: rowsError } = await admin
      .from('referrals')
      .select('invited_id, created_at, qualified_at')
      .eq('referrer_id', userId)
      .order('created_at', { ascending: false });
    if (rowsError) return Response.json({ error: rowsError.message }, { status: 500 });

    /*
      Chấm lại điều kiện hợp lệ cho những lượt CHƯA hợp lệ.

      Chấm lúc đọc chứ không chấm lúc đăng ký, vì người được mời thường học vài
      ngày sau khi tạo tài khoản. Chỉ chấm lại những dòng còn thiếu nên chi phí
      không tăng theo thời gian.
    */
    const pending = (rows ?? []).filter((r) => !r.qualified_at);
    for (const row of pending) {
      if (await hasStudied(admin, row.invited_id)) {
        await admin
          .from('referrals')
          .update({ qualified_at: new Date().toISOString() })
          .eq('invited_id', row.invited_id)
          .is('qualified_at', null);
        row.qualified_at = new Date().toISOString();
      }
    }

    const invited = rows?.length ?? 0;
    const qualified = (rows ?? []).filter((r) => r.qualified_at).length;

    const state: PlanState = {
      plan: profile.plan,
      expiresAt: profile.plan_expires_at,
      // Cot CSDL giu ten lich su `plus_credit_months` — xem chu thich o PlanState.
      rewardCreditMonths: profile.plus_credit_months ?? 0,
      rewardsGranted: profile.referral_rewards_granted ?? 0,
    };
    const settled = settleReferralRewards(state, qualified);

    // Chỉ ghi khi thật sự có gì đổi — tránh một lệnh UPDATE ở mỗi lần mở trang.
    const changed =
      settled.plan !== state.plan ||
      settled.expiresAt !== state.expiresAt ||
      settled.rewardCreditMonths !== state.rewardCreditMonths ||
      settled.rewardsGranted !== state.rewardsGranted;

    if (changed) {
      const { error } = await admin
        .from('profiles')
        .update({
          plan: settled.plan,
          plan_expires_at: settled.expiresAt,
          plan_started_at: settled.appliedMonths > 0 ? new Date().toISOString() : undefined,
          plus_credit_months: settled.rewardCreditMonths,
          referral_rewards_granted: settled.rewardsGranted,
        })
        .eq('id', userId);
      if (error) return Response.json({ error: error.message }, { status: 500 });

      await admin.from('admin_audit').insert({
        actor_id: null,
        target_id: userId,
        action: 'referral_reward',
        before: state,
        after: settled,
        note: `${qualified} lượt mời hợp lệ`,
      });
    }

    return Response.json({
      code,
      invited,
      qualified,
      plan: settled.plan,
      planExpiresAt: settled.expiresAt,
      creditMonths: settled.rewardCreditMonths,
      justApplied: settled.appliedMonths,
      recent: (rows ?? []).slice(0, 20).map((r) => ({
        createdAt: r.created_at,
        qualified: !!r.qualified_at,
      })),
    });
  } catch (err) {
    return Response.json({ error: message(err) }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const who = await identify(request);
    if (!who.ok) return who.error;
    const { admin, userId, createdAt } = who;

    const body = (await request.json()) as { code?: unknown };
    const code = String(body.code ?? '')
      .trim()
      .toUpperCase();
    if (!isValidInviteCode(code)) {
      return Response.json({ error: 'Mã mời không đúng. Kiểm lại từng ký tự.' }, { status: 400 });
    }

    const { data: owner, error: ownerError } = await admin
      .from('profiles')
      .select('id')
      .eq('referral_code', code)
      .maybeSingle();
    if (ownerError) return Response.json({ error: ownerError.message }, { status: 500 });
    if (!owner) return Response.json({ error: 'Không có ai dùng mã này.' }, { status: 404 });
    if (owner.id === userId) {
      return Response.json({ error: 'Không tự giới thiệu chính mình được.' }, { status: 400 });
    }

    /*
      Chỉ tài khoản MỚI mới khai được người giới thiệu.

      Không có mốc thời gian này thì người dùng cũ khai chéo cho nhau — hai người
      dùng lâu năm khai mã của nhau là mỗi bên +1 mà không ai mới vào cả.
    */
    const ageDays = (Date.now() - new Date(createdAt).getTime()) / 864e5;
    if (ageDays > 30) {
      return Response.json(
        { error: 'Chỉ khai được mã mời trong 30 ngày đầu kể từ khi tạo tài khoản.' },
        { status: 400 },
      );
    }

    const { error } = await admin
      .from('referrals')
      .insert({ referrer_id: owner.id, invited_id: userId });

    if (error) {
      // 23505 = đã có dòng cho `invited_id` này. Một người chỉ thuộc về một
      // người giới thiệu, mãi mãi — nói rõ thay vì trả lỗi database thô.
      if (error.code === '23505') {
        return Response.json({ error: 'Bạn đã khai mã mời rồi.' }, { status: 409 });
      }
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: message(err) }, { status: 500 });
  }
}

function message(err: unknown): string {
  return err instanceof Error ? err.message : 'Lỗi không xác định';
}
