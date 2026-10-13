import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { msg } from '@/lib/server-locale';
import { chatWithFallback, extractJson } from '@/services/ai/fallback';
import {
  PRONOUNCE_TIP_LIMIT_PER_MONTH,
  buildPronounceTipCall,
  cleanTipInput,
  parsePronounceTip,
  pronounceTipPeriod,
} from '@/services/vocab/pronounce-tip';

/**
 * POST /api/vocab/pronounce-tip
 * body: { word, ipa, pos, meaningVi, heard: string[], correct }
 *
 * Giải thích vì sao máy nghe lệch và cách sửa. Giữ đúng bốn điểm của các route AI khác:
 * 1. Phải đăng nhập, và hạn mức đếm ở MÁY CHỦ.
 * 2. Trừ lượt TRƯỚC khi gọi AI. Trừ sau thì bấm rồi huỷ liên tục là cách khai thác dễ nhất.
 * 3. AI hỏng, hoặc trả về không đúng khuôn, thì trả lại lượt.
 * 4. Không có phương án nào của máy nghe thì không gọi AI.
 *
 * Hạn mức đếm RIÊNG theo kỳ `pronounce:YYYY-MM`: không dùng chung với chấm bài hay tìm bài.
 */
export async function POST(request: Request): Promise<Response> {
  const admin = getSupabaseAdmin();
  let userId = '';
  let period = '';
  let charged = false;
  try {
    const header = request.headers.get('authorization') ?? '';
    const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
    if (!token) {
      return Response.json(
        { error: msg(request, 'Đăng nhập để nhận giải thích phát âm từ AI.', 'Sign in to get an AI pronunciation tip.') },
        { status: 401 },
      );
    }
    const { data: auth, error: authError } = await admin.auth.getUser(token);
    if (authError || !auth.user) {
      return Response.json({ error: msg(request, 'Phiên đăng nhập không hợp lệ.', 'Invalid session. Please sign in again.') }, { status: 401 });
    }
    userId = auth.user.id;

    const input = cleanTipInput(await request.json().catch(() => null));
    if (!input) {
      return Response.json({ error: msg(request, 'Dữ liệu lượt đọc không hợp lệ.', 'The attempt data is not valid.') }, { status: 400 });
    }

    period = pronounceTipPeriod();
    const { data, error } = await admin.rpc('bump_ai_usage', { p_user: userId, p_period: period });
    if (error) {
      return Response.json(
        { error: msg(request, 'Không đọc được hạn mức AI. Thử lại sau ít phút.', 'Could not read your AI quota. Please try again in a few minutes.') },
        { status: 503 },
      );
    }
    const used = typeof data === 'number' ? data : 0;
    if (used > PRONOUNCE_TIP_LIMIT_PER_MONTH) {
      return Response.json(
        {
          error: msg(
            request,
            `Bạn đã dùng hết ${PRONOUNCE_TIP_LIMIT_PER_MONTH} lượt giải thích phát âm trong tháng này. Vẫn còn lời nhận xét thường.`,
            `You've used all ${PRONOUNCE_TIP_LIMIT_PER_MONTH} pronunciation tips this month. Regular feedback still works.`,
          ),
          used,
          limit: PRONOUNCE_TIP_LIMIT_PER_MONTH,
        },
        { status: 429 },
      );
    }
    charged = true;

    const call = buildPronounceTipCall(input);
    const result = await chatWithFallback({ purpose: 'coach', temperature: 0.2, system: call.system, user: call.user });
    const tip = parsePronounceTip(extractJson<unknown>(result.text), input.word);
    if (!tip) throw new Error('AI trả về không đúng khuôn');

    return Response.json({ tip, usage: { used, limit: PRONOUNCE_TIP_LIMIT_PER_MONTH } });
  } catch {
    if (charged) await refundPronounceTip(admin, userId, period);
    return Response.json(
      {
        error: msg(
          request,
          'Huấn luyện viên AI chưa trả lời được lúc này. Bạn vẫn có lời nhận xét thường.',
          'The AI coach could not answer right now. You still get the regular feedback.',
        ),
      },
      { status: 502 },
    );
  }
}

/** Trả lại một lượt khi lỗi thuộc về ta (AI hỏng hoặc trả rác), không trả khi người dùng gửi sai dữ liệu. */
async function refundPronounceTip(admin: ReturnType<typeof getSupabaseAdmin>, userId: string, period: string): Promise<void> {
  const { data } = await admin.from('ai_usage').select('calls').eq('user_id', userId).eq('period_key', period).maybeSingle();
  const current = (data as { calls?: number } | null)?.calls ?? 0;
  if (current <= 0) return;
  await admin.from('ai_usage').update({ calls: current - 1 }).eq('user_id', userId).eq('period_key', period);
}
