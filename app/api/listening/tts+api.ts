import { getListeningTest } from '@/data/listening-tests';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { msg } from '@/lib/server-locale';
import { createAoedeGenerator } from '@/services/speaking/voice-server';

const keys = [...new Set((process.env.GEMINI_TTS_API_KEYS ?? process.env.GEMINI_API_KEY ?? '').split(/[\s,]+/).filter(Boolean))];
const generate = createAoedeGenerator(keys);
const requests = new Map<string, { start: number; count: number }>();

/** Giọng Aoede đọc transcript để luyện; tuyệt đối không ghi nhãn là audio đề gốc. */
export async function POST(request: Request): Promise<Response> {
  try {
    const token = (request.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
    let identity = request.headers.get('x-real-ip') ?? 'guest';
    if (token) {
      const { data: auth, error } = await getSupabaseAdmin().auth.getUser(token);
      if (error || !auth.user) return Response.json({ error: msg(request, 'Phiên đăng nhập không hợp lệ.', 'Invalid session.') }, { status: 401 });
      identity = auth.user.id;
    }
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
    const item = requests.get(identity) ?? { start: now, count: 0 };
    if (item.count >= 12 || (requests.size >= 1000 && !requests.has(identity))) {
      return Response.json({ error: msg(request, 'Bạn đã tạo nhiều bản đọc. Hãy thử lại sau một phút.', 'Too many generated readouts. Try again in a minute.') }, { status: 429 });
    }
    item.count++;
    requests.set(identity, item);

    const wav = await generate(text);
    return new Response(Uint8Array.from(wav), {
      headers: { 'content-type': 'audio/wav', 'cache-control': 'private, max-age=86400', 'x-listening-voice': 'Aoede', 'x-audio-kind': 'study-tts' },
    });
  } catch {
    return Response.json({ error: msg(request, 'Aoede đang bận. Thử lại sau hoặc dùng giọng máy của thiết bị.', 'Aoede is busy. Try again later or use the device voice.') }, { status: 503 });
  }
}
