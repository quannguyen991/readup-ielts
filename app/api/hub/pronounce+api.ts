import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { msg } from '@/lib/server-locale';
import { consumeAiCall, refundAiCall } from '@/services/ai/usage';
import { assessPronunciation, isConfigured } from '@/services/hub/pronunciation-service';

/**
 * POST /api/hub/pronounce  { referenceText, wavBase64 }
 *
 * Chấm phát âm chi tiết một câu/từ. Cần đăng nhập và trừ hạn mức như các route chấm khác;
 * lỗi phía dịch vụ thì hoàn lượt. Chưa có khoá dịch vụ thì trả 503 kèm mã `not_configured`
 * để app quay về chấm theo chữ.
 */

const MAX_REF_CHARS = 200;
const MAX_WAV_BASE64 = 2_000_000; // ~1,5 MB âm thanh 16 kHz 16-bit: khoảng 45 giây.

export async function POST(request: Request): Promise<Response> {
  if (!isConfigured()) {
    return Response.json(
      { code: 'not_configured', error: msg(request, 'Chấm phát âm chi tiết chưa được bật trên máy chủ.', 'Detailed pronunciation scoring is not enabled on the server.') },
      { status: 503 },
    );
  }

  const header = request.headers.get('authorization') ?? '';
  const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
  if (!token) return Response.json({ error: msg(request, 'Đăng nhập để chấm chi tiết.', 'Sign in for detailed scoring.') }, { status: 401 });

  const admin = getSupabaseAdmin();
  const { data: auth, error: authError } = await admin.auth.getUser(token);
  if (authError || !auth.user) return Response.json({ error: msg(request, 'Phiên đăng nhập không hợp lệ.', 'Invalid session. Please sign in again.') }, { status: 401 });
  const userId = auth.user.id;

  let body: { referenceText?: unknown; wavBase64?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: msg(request, 'Yêu cầu không hợp lệ.', 'Invalid request.') }, { status: 400 });
  }
  const referenceText = typeof body.referenceText === 'string' ? body.referenceText.trim().slice(0, MAX_REF_CHARS) : '';
  const wavBase64 = typeof body.wavBase64 === 'string' ? body.wavBase64 : '';
  if (!referenceText || !wavBase64) return Response.json({ error: msg(request, 'Thiếu câu mẫu hoặc âm thanh.', 'Missing text or audio.') }, { status: 400 });
  if (wavBase64.length > MAX_WAV_BASE64) return Response.json({ error: msg(request, 'Đoạn ghi âm quá dài, hãy nói ngắn hơn.', 'The recording is too long. Please keep it shorter.') }, { status: 413 });

  const verdict = await consumeAiCall(admin, userId, request);
  if (!verdict.allowed) {
    return Response.json({ error: verdict.message, code: 'quota_exceeded', used: verdict.used, limit: verdict.limit, plan: verdict.plan }, { status: 429 });
  }

  try {
    const wav = Uint8Array.from(Buffer.from(wavBase64, 'base64'));
    const assessment = await assessPronunciation(wav, referenceText);
    return Response.json({ assessment });
  } catch (err) {
    await refundAiCall(admin, userId);
    console.warn('[hub/pronounce] dịch vụ lỗi:', err instanceof Error ? err.message : err);
    return Response.json({ error: msg(request, 'Dịch vụ chấm đang bận, thử lại sau.', 'The scoring service is busy. Try again shortly.') }, { status: 502 });
  }
}
