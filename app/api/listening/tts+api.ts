import { getListeningTest } from '@/data/listening-tests';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { msg } from '@/lib/server-locale';
import { createAoedeGenerator } from '@/services/speaking/voice-server';
import { LISTENING_TTS_PER_DAY, listeningTtsPeriod } from '@/services/listening/tts-quota';

const keys = [...new Set((process.env.GEMINI_TTS_API_KEYS ?? process.env.GEMINI_API_KEY ?? '').split(/[\s,]+/).filter(Boolean))];
const generate = createAoedeGenerator(keys);
const requests = new Map<string, { start: number; count: number }>();

type Admin = ReturnType<typeof getSupabaseAdmin>;

/** Trả lại một lượt khi Aoede lỗi: lỗi do máy chủ thì người học không nên mất lượt. */
async function refundDay(admin: Admin, userId: string, period: string): Promise<void> {
  const { data } = await admin.from('ai_usage').select('calls').eq('user_id', userId).eq('period_key', period).maybeSingle();
  const current = (data as { calls?: number } | null)?.calls ?? 0;
  if (current <= 0) return;
  await admin.from('ai_usage').update({ calls: current - 1 }).eq('user_id', userId).eq('period_key', period);
}

/**
 * Giọng Aoede đọc transcript để luyện; tuyệt đối không ghi nhãn là audio đề gốc.
 *
 * Phải đăng nhập (mỗi lượt là tiền thật), đếm lượt theo ngày Ở MÁY CHỦ, và trừ lượt TRƯỚC
 * khi gọi Aoede. Chỉ những lượt đã qua kiểm tra đề mới bị trừ; lỗi từ Aoede thì trả lại lượt.
 */
export async function POST(request: Request): Promise<Response> {
  let admin: Admin | null = null;
  let userId = '';
  let period = '';
  let charged = false;
  try {
    const header = request.headers.get('authorization') ?? '';
    const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
    if (!token) {
      return Response.json({ error: msg(request, 'Đăng nhập để nghe bản đọc Aoede.', 'Sign in to listen to the Aoede readout.') }, { status: 401 });
    }
    admin = getSupabaseAdmin();
    const { data: auth, error } = await admin.auth.getUser(token);
    if (error || !auth.user) return Response.json({ error: msg(request, 'Phiên đăng nhập không hợp lệ.', 'Invalid session.') }, { status: 401 });
    userId = auth.user.id;

    if (!keys.length) return Response.json({ error: msg(request, 'Aoede chưa được cấu hình. Bạn vẫn có thể nạp audio riêng hoặc dùng giọng máy.', 'Aoede is not configured. You can load your own audio or use the device voice.') }, { status: 503 });

    const body = await request.json() as { testId?: unknown; section?: unknown };
    const testId = typeof body.testId === 'string' ? body.testId : '';
    const sectionNumber = typeof body.section === 'number' ? body.section : Number(body.section);
    const test = getListeningTest(testId);
    const section = test?.sections.find((item) => item.n === sectionNumber);
    if (!test || test.source !== 'Band 9 Original' || !section) {
      return Response.json({ error: msg(request, 'Không tìm thấy phần nghe gốc trong thư viện.', 'The original practice section was not found.') }, { status: 404 });
    }
    // Keep speaker turns in the synthesis input so dialogue sections sound like
    // a conversation instead of one uninterrupted block of narration.
    const text = section.transcript
      .map((line) => line.speaker ? `[${line.speaker}] ${line.text}` : line.text)
      .join('\n');
    if (!text || text.length > 12_000) return Response.json({ error: msg(request, 'Transcript quá dài để tạo bản đọc.', 'The transcript is too long to synthesize.') }, { status: 413 });

    const now = Date.now();
    for (const [id, item] of requests) if (now - item.start >= 60_000) requests.delete(id);
    const item = requests.get(userId) ?? { start: now, count: 0 };
    if (item.count >= 12 || (requests.size >= 1000 && !requests.has(userId))) {
      return Response.json({ error: msg(request, 'Bạn đã tạo nhiều bản đọc. Hãy thử lại sau một phút.', 'Too many generated readouts. Try again in a minute.') }, { status: 429 });
    }
    item.count++;
    requests.set(userId, item);

    period = listeningTtsPeriod();
    const { data: used, error: usageError } = await admin.rpc('bump_ai_usage', { p_user: userId, p_period: period });
    if (usageError) {
      return Response.json({ error: msg(request, 'Không đọc được hạn mức nghe hôm nay. Thử lại sau ít phút.', 'Could not read today’s listening quota. Please try again in a few minutes.') }, { status: 503 });
    }
    charged = true;
    if ((typeof used === 'number' ? used : 0) > LISTENING_TTS_PER_DAY) {
      // Đã vượt trần thì lượt vừa cộng không được dùng, nên trả lại ngay.
      await refundDay(admin, userId, period);
      charged = false;
      return Response.json(
        { error: msg(request, `Hôm nay bạn đã nghe ${LISTENING_TTS_PER_DAY} bản đọc Aoede. Ngày mai có lại; phần còn lại dùng giọng máy của thiết bị.`, `You have used all ${LISTENING_TTS_PER_DAY} Aoede readouts for today. They reset tomorrow; use the device voice meanwhile.`) },
        { status: 429 },
      );
    }

    const wav = await generate(text);
    return new Response(Uint8Array.from(wav), {
      headers: { 'content-type': 'audio/wav', 'cache-control': 'private, max-age=86400', 'x-listening-voice': 'Aoede', 'x-audio-kind': 'study-tts' },
    });
  } catch {
    if (charged && admin && userId && period) await refundDay(admin, userId, period).catch(() => undefined);
    return Response.json({ error: msg(request, 'Aoede đang bận. Thử lại sau hoặc dùng giọng máy của thiết bị.', 'Aoede is busy. Try again later or use the device voice.') }, { status: 503 });
  }
}
