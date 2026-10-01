import { ARTICLES } from '@/data/articles';
import { getArticleBody } from '@/data/article-repository';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { TRANSLATE_BATCH, sourceHash, translateParagraphs } from '@/services/ai/translator';
import { errorText, msg } from '@/lib/server-locale';

/**
 * GET  /api/translate?articleId=…   → bản dịch đã có trong bộ nhớ đệm (ai cũng đọc được)
 * POST /api/translate { articleId }  → dịch nếu chưa có (cần đăng nhập)
 *
 * TÁCH ĐỌC VÀ TẠO là quyết định trung tâm.
 *
 * ĐỌC không cần tài khoản: bản dịch dùng chung, và bắt đăng nhập để xem một thứ
 * đã dịch xong rồi thì chỉ là dựng rào cho vui.
 *
 * TẠO thì cần, vì nó tốn tiền thật. Nhưng KHÔNG cần hạn mức theo người dùng, và
 * đây là chỗ đáng nói rõ: bản dịch được lưu DÙNG CHUNG, nên chi phí có trần
 * cứng bằng SỐ BÀI TRONG KHO (1.401), không phải số người × số bài. Kẻ xấu nhất
 * có thể làm là dịch trước toàn bộ kho — tức là trả tiền hộ cho mọi người dùng
 * sau. Dựng thêm hạn mức ở đây là chống một mối đe doạ không tồn tại, đổi lại
 * làm hỏng tính năng cho người dùng thật.
 *
 * Bài `headline_only` không có toàn văn nên không bao giờ dịch được — và cũng
 * không nên: đó là những bài app chỉ giữ tiêu đề vì lý do bản quyền.
 */

const LANG = 'vi';

type Cached = { paragraphs: string[]; source_hash: string; model: string; created_at: string };

function loadParagraphs(articleId: string): string[] | null {
  const meta = ARTICLES.find((a) => a.id === articleId);
  if (!meta) return null;
  const body = getArticleBody(meta);
  if (!body || !Array.isArray(body.paragraphs) || body.paragraphs.length === 0) return null;
  return body.paragraphs;
}

async function readCache(articleId: string, hash: string) {
  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from('article_translations')
    .select('paragraphs, source_hash, model, created_at')
    .eq('article_id', articleId)
    .eq('lang', LANG)
    .maybeSingle();

  const row = data as Cached | null;
  // Bản dịch của một phiên bản bài khác thì coi như không có. Phục vụ nó ra là
  // tiếng Anh một đằng tiếng Việt một nẻo, mà người đọc không hiểu vì sao.
  if (!row || row.source_hash !== hash) return null;
  return row;
}

/** Đoạn nào còn thiếu bản dịch. Rỗng = xong cả bài. */
function missingIndexes(translated: string[], total: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < total; i += 1) {
    if (!translated[i]) out.push(i);
  }
  return out;
}

export async function GET(request: Request): Promise<Response> {
  try {
    const articleId = new URL(request.url).searchParams.get('articleId') ?? '';
    const paragraphs = loadParagraphs(articleId);
    if (!paragraphs) {
      return Response.json({ error: msg(request, 'Bài này không có toàn văn để dịch.', 'This article has no full text to translate.') }, { status: 404 });
    }

    const cached = await readCache(articleId, sourceHash(paragraphs));
    if (!cached) {
      return Response.json({ paragraphs: null, done: false, total: paragraphs.length });
    }

    const filled = paragraphs.map((_, i) => cached.paragraphs[i] ?? '');
    return Response.json({
      paragraphs: filled,
      done: missingIndexes(filled, paragraphs.length).length === 0,
      total: paragraphs.length,
      model: cached.model,
    });
  } catch (err) {
    return Response.json({ error: message(request, err) }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const header = request.headers.get('authorization') ?? '';
    const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
    if (!token) {
      return Response.json(
        {
          error: msg(
            request,
            'Đăng nhập để dịch bài này. Bài đã dịch rồi thì ai cũng đọc được.',
            'Sign in to translate this article. Once translated, anyone can read it.',
          ),
        },
        { status: 401 },
      );
    }

    const admin = getSupabaseAdmin();
    const { data: auth, error: authError } = await admin.auth.getUser(token);
    if (authError || !auth.user) {
      return Response.json({ error: msg(request, 'Phiên đăng nhập không hợp lệ.', 'Invalid session. Please sign in again.') }, { status: 401 });
    }

    const body = (await request.json()) as { articleId?: unknown };
    const articleId = typeof body.articleId === 'string' ? body.articleId : '';
    const paragraphs = loadParagraphs(articleId);
    if (!paragraphs) {
      return Response.json({ error: msg(request, 'Bài này không có toàn văn để dịch.', 'This article has no full text to translate.') }, { status: 404 });
    }

    const hash = sourceHash(paragraphs);

    const cached = await readCache(articleId, hash);
    const current: string[] = cached
      ? paragraphs.map((_, i) => cached.paragraphs[i] ?? '')
      : paragraphs.map(() => '');

    const missing = missingIndexes(current, paragraphs.length);
    if (missing.length === 0) {
      return Response.json({ paragraphs: current, done: true, translated: 0 });
    }

    /*
      Dịch ĐÚNG MỘT LÁT rồi trả về, thay vì dịch hết bài.

      Hàm serverless của Vercel có trần thời gian chạy, và một bài 27 đoạn không
      bao giờ kịp. Client gọi lại cho tới khi `done` — mỗi lần một lát, và người
      đọc thấy bản dịch hiện dần thay vì chờ một cục.

      Lấy các đoạn CÒN THIẾU chứ không phải một khoảng cố định: hai người cùng
      mở một bài thì mỗi người dịch phần người kia chưa làm, không giẫm lên nhau.
    */
    const slice = missing.slice(0, TRANSLATE_BATCH);
    const result = await translateParagraphs(slice.map((i) => paragraphs[i]!));
    if (result.paragraphs.length !== slice.length) {
      return Response.json(
        { error: msg(request, 'Bản dịch trả về không khớp số đoạn. Thử lại.', "The translation doesn't match the paragraph count. Please try again.") },
        { status: 502 },
      );
    }
    slice.forEach((paragraphIndex, k) => {
      current[paragraphIndex] = result.paragraphs[k] ?? '';
    });

    const stillMissing = missingIndexes(current, paragraphs.length);

    const { error: writeError } = await admin.from('article_translations').upsert(
      {
        article_id: articleId,
        lang: LANG,
        paragraphs: current,
        source_hash: hash,
        model: result.model,
      },
      { onConflict: 'article_id,lang' },
    );
    // Ghi hỏng thì VẪN trả phần vừa dịch cho người đang chờ — họ không có lỗi gì.
    // Chỉ là người tiếp theo sẽ phải dịch lại đoạn đó.
    return Response.json({
      paragraphs: current,
      done: stillMissing.length === 0,
      translated: slice.length,
      remaining: stillMissing.length,
      model: result.model,
      ...(writeError ? { cacheWarning: writeError.message } : {}),
    });
  } catch (err) {
    return Response.json({ error: message(request, err) }, { status: 500 });
  }
}

function message(request: Request, err: unknown): string {
  return errorText(request, err, 'Lỗi không xác định', 'Unknown error');
}
