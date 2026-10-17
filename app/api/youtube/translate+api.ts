import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { msg } from '@/lib/server-locale';
import { translateParagraphs } from '@/services/ai/translator';
import { consumeAiCall, refundAiCall } from '@/services/ai/usage';

/**
 * POST /api/youtube/translate  { lines: string[] }  → { lines: string[] }
 *
 * Dịch phụ đề của MỘT video do chính người học dán vào.
 *
 * KHÁC BÀI ĐỌC: bản dịch KHÔNG lưu dùng chung trên máy chủ. Phụ đề là nội dung của
 * chủ kênh, và app không gom chúng thành kho chung (xem `useVideoTranscriptStore`).
 * Vì thế route chỉ dịch rồi trả về; máy người học mới giữ bản dịch. Hệ quả là chi
 * phí tính theo người dùng — nên có đăng nhập và trừ hạn mức AI như các lượt khác.
 */

/** Một lượt gọi chỉ nhận một lô; client tự chia lô (xem `chunkLines`). */
const MAX_LINES = 10;
/** Một câu phụ đề thường dưới 200 ký tự; cắt bớt để một dòng lạ không đốt tiền. */
const MAX_CHARS = 400;

export async function POST(request: Request): Promise<Response> {
  try {
    const header = request.headers.get('authorization') ?? '';
    const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
    if (!token) {
      return Response.json(
        { error: msg(request, 'Đăng nhập để dịch phụ đề.', 'Sign in to translate the transcript.') },
        { status: 401 },
      );
    }

    const admin = getSupabaseAdmin();
    const { data: auth, error: authError } = await admin.auth.getUser(token);
    if (authError || !auth.user) {
      return Response.json({ error: msg(request, 'Phiên đăng nhập không hợp lệ.', 'Invalid session. Please sign in again.') }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as { lines?: unknown };
    const lines = Array.isArray(body.lines)
      ? body.lines
          .filter((l): l is string => typeof l === 'string')
          .map((l) => l.trim().slice(0, MAX_CHARS))
      : [];
    if (lines.length === 0 || lines.length > MAX_LINES || lines.some((l) => l.length === 0)) {
      return Response.json(
        { error: msg(request, `Gửi từ 1 đến ${MAX_LINES} câu, mỗi câu không rỗng.`, `Send 1 to ${MAX_LINES} non-empty lines.`) },
        { status: 400 },
      );
    }

    const verdict = await consumeAiCall(admin, auth.user.id, request);
    if (!verdict.allowed) {
      return Response.json(
        { error: verdict.message, code: 'quota_exceeded', used: verdict.used, limit: verdict.limit, plan: verdict.plan },
        { status: 429 },
      );
    }

    try {
      const out = await translateParagraphs(lines);
      return Response.json({ lines: out.paragraphs });
    } catch {
      // Dịch hỏng thì trả lại lượt đã trừ — lỗi của máy chủ không phải lỗi của người học.
      await refundAiCall(admin, auth.user.id);
      return Response.json({ error: msg(request, 'Dịch chưa được, thử lại sau.', 'Translation failed, try again.') }, { status: 502 });
    }
  } catch {
    return Response.json({ error: msg(request, 'Có lỗi, thử lại sau.', 'Something went wrong. Try again.') }, { status: 500 });
  }
}
