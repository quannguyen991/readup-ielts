import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { AiError } from '@/services/ai/errors';
import { translateParagraphs } from '@/services/ai/translator';
import { errorText, msg } from '@/lib/server-locale';

/**
 * Translate only the current reader page. The page is not cached or persisted
 * by this endpoint; the client keeps its copy in the reader's local library.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const header = request.headers.get('authorization') ?? '';
    const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
    if (!token) {
      return Response.json({ error: msg(request, 'Đăng nhập để dùng dịch AI.', 'Sign in to use AI translation.') }, { status: 401 });
    }

    const admin = getSupabaseAdmin();
    const { data, error } = await admin.auth.getUser(token);
    if (error || !data.user) {
      return Response.json({ error: msg(request, 'Phiên đăng nhập không hợp lệ.', 'Invalid session. Please sign in again.') }, { status: 401 });
    }

    const body = (await request.json()) as { text?: unknown };
    const text = typeof body.text === 'string' ? body.text.trim() : '';
    if (!text) return Response.json({ error: msg(request, 'Không có nội dung để dịch.', 'There is no text to translate.') }, { status: 400 });
    if (text.length > 12_000) {
      return Response.json({ error: msg(request, 'Trang này quá dài để dịch một lần. Hãy chọn đoạn sách ngắn hơn.', 'This page is too long to translate in one request. Choose a shorter passage.') }, { status: 413 });
    }

    const result = await translateParagraphs([text]);
    if (!result.paragraphs[0]) {
      return Response.json({ error: msg(request, 'Chưa tạo được bản dịch. Thử lại sau.', 'The translation could not be generated. Please try again.') }, { status: 502 });
    }
    return Response.json({ text: result.paragraphs[0] });
  } catch (error) {
    if (error instanceof AiError) {
      return Response.json({ error: errorText(request, error, error.message, 'Translation is temporarily unavailable.') }, { status: 502 });
    }
    return Response.json({ error: errorText(request, error, 'Lỗi không xác định', 'Unknown error') }, { status: 500 });
  }
}
