import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { msg } from '@/lib/server-locale';
import { cueCardSpoken, getSpeakingQuestion } from '@/services/speaking/bank';
import { createAoedeGenerator } from '@/services/speaking/voice-server';

const keys = [...new Set((process.env.GEMINI_TTS_API_KEYS ?? process.env.GEMINI_API_KEY ?? '').split(/[\s,]+/).filter(Boolean))];
const generate = createAoedeGenerator(keys);
const requests = new Map<string, { start: number; count: number }>();

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json() as { questionId?: unknown; text?: unknown };
    let text = '';
    let identity = request.headers.get('x-real-ip') ?? 'guest';
    if (typeof body.questionId === 'string') {
      const question = getSpeakingQuestion(body.questionId);
      if (!question) return Response.json({ error: msg(request, 'Không tìm thấy câu hỏi.', 'Question not found.') }, { status: 400 });
      text = question.part === 2 ? cueCardSpoken(question) : question.text;
    } else {
      const token = (request.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
      if (!token) return Response.json({ error: msg(request, 'Đăng nhập để nghe bài mẫu bằng Aoede.', 'Sign in to hear the model answer in Aoede.') }, { status: 401 });
      const { data, error } = await getSupabaseAdmin().auth.getUser(token);
      if (error || !data.user) return Response.json({ error: msg(request, 'Phiên đăng nhập không hợp lệ.', 'Invalid session.') }, { status: 401 });
      identity = data.user.id;
      text = typeof body.text === 'string' ? body.text.trim() : '';
      if (!text || text.length > 1800) return Response.json({ error: msg(request, 'Bài mẫu quá dài hoặc chưa có nội dung.', 'The sample is empty or too long.') }, { status: 400 });
    }
    if (!keys.length) return Response.json({ error: msg(request, 'Aoede chưa sẵn sàng. Bạn vẫn có thể đọc câu hỏi và luyện trả lời.', 'Aoede is not ready. You can still read the question and practise.') }, { status: 503 });
    const now = Date.now();
    for (const [id, item] of requests) if (now - item.start >= 60_000) requests.delete(id);
    const item = requests.get(identity) ?? { start: now, count: 0 };
    if (item.count >= 12 || requests.size >= 1000 && !requests.has(identity)) return Response.json({ error: msg(request, 'Hãy đợi một phút rồi nghe lại.', 'Please wait a minute before listening again.') }, { status: 429 });
    item.count++; requests.set(identity, item);
    const wav = await generate(text);
    return new Response(Uint8Array.from(wav), { headers: { 'Content-Type': 'audio/wav', 'Cache-Control': 'private, max-age=86400', 'X-Speaking-Voice': 'Aoede' } });
  } catch {
    return Response.json({ error: msg(request, 'Aoede đang bận. Bấm nghe lại sau ít phút, hoặc đọc câu hỏi để trả lời luôn.', 'Aoede is busy. Try again shortly, or read the question and answer now.') }, { status: 503 });
  }
}
