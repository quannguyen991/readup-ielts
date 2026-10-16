import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { msg } from '@/lib/server-locale';
import { streamWithFallback } from '@/services/ai/fallback';
import { consumeAiCall, refundAiCall } from '@/services/ai/usage';
import { resolvePersona } from '@/services/hub/persona';
import { SHARED_RULE } from '@/services/hub/tutors';

/**
 * POST /api/hub/tutor  { tutorId, messages: [{ role, content }] }
 *
 * Trò chuyện với một gia sư AI của tab Gia sư. Cần đăng nhập và trừ hạn mức AI
 * như các route chấm khác; lỗi phía máy chủ thì hoàn lượt. Vai của gia sư lấy từ
 * `services/hub/tutors` trên máy chủ — client không gửi vai tuỳ ý.
 */

const MAX_TURNS = 12;
const MAX_CHARS = 800;

export async function POST(request: Request): Promise<Response> {
  const header = request.headers.get('authorization') ?? '';
  const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
  if (!token) return Response.json({ error: msg(request, 'Đăng nhập để trò chuyện với gia sư.', 'Sign in to talk with a tutor.') }, { status: 401 });

  const admin = getSupabaseAdmin();
  const { data: auth, error: authError } = await admin.auth.getUser(token);
  if (authError || !auth.user) return Response.json({ error: msg(request, 'Phiên đăng nhập không hợp lệ.', 'Invalid session. Please sign in again.') }, { status: 401 });
  const userId = auth.user.id;

  let body: { tutorId?: unknown; custom?: unknown; slides?: unknown; messages?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: msg(request, 'Yêu cầu không hợp lệ.', 'Invalid request.') }, { status: 400 });
  }

  const picked = resolvePersona(body, SHARED_RULE);
  if (!picked.ok) {
    return Response.json({ error: picked.error }, { status: 400 });
  }

  const raw = Array.isArray(body.messages) ? body.messages : [];
  const history = raw
    .filter((m): m is { role: 'user' | 'assistant'; content: string } => {
      if (!m || typeof m !== 'object') return false;
      const r = (m as { role?: unknown }).role;
      const c = (m as { content?: unknown }).content;
      return (r === 'user' || r === 'assistant') && typeof c === 'string' && c.trim().length > 0;
    })
    .slice(-MAX_TURNS)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));
  if (history.length === 0 || history[history.length - 1]!.role !== 'user') {
    return Response.json({ error: msg(request, 'Thiếu câu của bạn.', 'Missing your message.') }, { status: 400 });
  }

  const verdict = await consumeAiCall(admin, userId, request);
  if (!verdict.allowed) {
    return Response.json({ error: verdict.message, code: 'quota_exceeded', used: verdict.used, limit: verdict.limit, plan: verdict.plan }, { status: 429 });
  }

  const transcript = history.map((m) => `${m.role === 'user' ? 'Learner' : 'Tutor'}: ${m.content}`).join('\n\n');
  try {
    const result = await streamWithFallback({
      purpose: 'chat',
      system: picked.persona,
      user: `${transcript}\n\nTutor:`,
      temperature: 0.4,
    });
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const piece of result.stream) controller.enqueue(encoder.encode(piece));
        } catch {
          controller.enqueue(encoder.encode(msg(request, '\n\n[Mất kết nối giữa chừng, bấm gửi lại nhé.]', '\n\n[Connection lost midway. Send again.]')));
        } finally {
          controller.close();
        }
      },
    });
    return new Response(stream, { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-cache' } });
  } catch (err) {
    await refundAiCall(admin, userId);
    console.warn('[hub/tutor] AI lỗi:', err instanceof Error ? err.message : err);
    return Response.json({ error: msg(request, 'AI đang bận, thử lại sau ít phút.', 'The AI is busy. Try again shortly.') }, { status: 503 });
  }
}
