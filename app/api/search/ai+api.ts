import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { chatWithFallback } from '@/services/ai/fallback';
import { consumeAiCall, refundAiCall } from '@/services/ai/usage';
import { localeOf, msg } from '@/lib/server-locale';
import { getCatalog, getEntry } from '@/services/search/catalog';
import {
  MAX_QUERY_LENGTH,
  buildAiSearchPrompt,
  mergeCandidates,
  parseAiPicks,
  shortlistIds,
} from '@/services/search/ai';

/**
 * POST /api/search/ai  { query: string, ids?: string[] }
 *
 * "Hỏi AI" trong ô tìm bài: người học tả nhu cầu bằng lời ("mình yếu nghe điền
 * số, muốn luyện chủ đề môi trường"), AI chọn 3–6 mục trong chỉ mục và nói ngắn
 * vì sao.
 *
 * Bốn điểm:
 *
 * 1. AI CHỈ CHỌN TRONG DANH SÁCH. Máy chủ tự dựng lại chỉ mục, tự lọc ứng viên
 *    từ câu hỏi, gộp với mã client gợi ý (chỉ giữ mã có thật) — tiêu đề, đường
 *    dẫn do client gửi đều bỏ qua. Câu trả lời của model được kiểm lại từng mã.
 * 2. CẦN ĐĂNG NHẬP và ĐẾM Ở MÁY CHỦ, như mọi route AI khác — nhưng đếm vào bộ
 *    đếm riêng `search` (xem `AiCallKind`), không ăn vào lượt chấm bài.
 * 3. KHÔNG BAO GIỜ ĐỂ TRẮNG MÀN. AI hỏng hoặc quá giờ thì trả 200 kèm
 *    `fallback: true` và một lời nhắn; giao diện vẫn đang hiện kết quả tìm
 *    thường. Lượt bị trả lại vì lỗi thuộc về ta.
 * 4. NHANH. Đi cửa `define` (model rẻ, nhanh nhất trong bộ ba cửa) và cắt ở
 *    `SEARCH_TIMEOUT_MS` — chờ lâu hơn thế thì người học đã tự bấm vào kết quả.
 */

const SEARCH_TIMEOUT_MS = 15_000;

class SearchTimeout extends Error {}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new SearchTimeout('timeout')), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}

export async function POST(request: Request): Promise<Response> {
  const locale = localeOf(request);
  let body: { query?: unknown; ids?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: msg(request, 'Yêu cầu không hợp lệ.', 'Invalid request.') }, { status: 400 });
  }

  const query = typeof body.query === 'string' ? body.query.trim().slice(0, MAX_QUERY_LENGTH) : '';
  if (query.length < 2) {
    return Response.json(
      { error: msg(request, 'Gõ điều bạn muốn luyện trước đã.', 'Type what you want to practise first.') },
      { status: 400 },
    );
  }

  const header = request.headers.get('authorization') ?? '';
  const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
  if (!token) {
    return Response.json(
      {
        error: msg(request, 'Đăng nhập để dùng Hỏi AI khi tìm bài.', 'Sign in to use AI search.'),
        signIn: true,
      },
      { status: 401 },
    );
  }

  let admin: ReturnType<typeof getSupabaseAdmin>;
  let userId: string;
  try {
    admin = getSupabaseAdmin();
    const { data: auth, error: authError } = await admin.auth.getUser(token);
    if (authError || !auth.user) {
      return Response.json(
        { error: msg(request, 'Phiên đăng nhập không hợp lệ.', 'Invalid session. Please sign in again.'), signIn: true },
        { status: 401 },
      );
    }
    userId = auth.user.id;
  } catch {
    return Response.json(
      {
        picks: [],
        tip: '',
        fallback: true,
        note: msg(request, 'Chưa kết nối được máy chủ. Đây là kết quả tìm thường.', 'Could not reach the server. Showing regular results.'),
      },
      { status: 200 },
    );
  }

  // Ứng viên: chỉ những mục có thật trong chỉ mục do CHÍNH máy chủ dựng.
  const catalog = getCatalog();
  const candidates = mergeCandidates(body.ids, shortlistIds(query, catalog), getEntry);
  if (candidates.length === 0) {
    return Response.json({ picks: [], tip: '', fallback: true, note: msg(request, 'Không có bài nào để chọn.', 'Nothing to choose from.') });
  }

  let verdict: Awaited<ReturnType<typeof consumeAiCall>>;
  try {
    verdict = await consumeAiCall(admin, userId, request, 'search');
  } catch {
    return Response.json({
      picks: [],
      tip: '',
      fallback: true,
      note: msg(request, 'Không đọc được hạn mức AI. Đây là kết quả tìm thường.', 'Could not read your AI quota. Showing regular results.'),
    });
  }
  if (!verdict.allowed) {
    return Response.json(
      { error: verdict.message, quota: true, used: verdict.used, limit: verdict.limit, plan: verdict.plan },
      { status: 429 },
    );
  }

  const prompt = buildAiSearchPrompt(query, candidates, locale);
  try {
    const result = await withTimeout(
      chatWithFallback({ purpose: 'define', system: prompt.system, user: prompt.user, temperature: 0.2 }),
      SEARCH_TIMEOUT_MS,
    );
    const parsed = parseAiPicks(result.text, prompt.aliases);
    if (!parsed) {
      await refundAiCall(admin, userId, 'search');
      return Response.json({
        picks: [],
        tip: '',
        fallback: true,
        note: msg(
          request,
          'AI trả lời không đọc được — lượt này không bị tính. Đây là kết quả tìm thường.',
          "The AI reply couldn't be read — this one wasn't counted. Showing regular results.",
        ),
      });
    }
    // Bài trong Lộ trình học trỏ về đúng nội dung gốc: hai mục cùng một đích chỉ giữ một.
    const seenHref = new Set<string>();
    const picks = parsed.picks.filter((p) => {
      const href = getEntry(p.id)?.href;
      if (!href || seenHref.has(href)) return false;
      seenHref.add(href);
      return true;
    });
    return Response.json({
      picks,
      tip: parsed.tip,
      usage: { used: verdict.used, limit: verdict.limit, plan: verdict.plan },
    });
  } catch (err) {
    await refundAiCall(admin, userId, 'search').catch(() => undefined);
    const timedOut = err instanceof SearchTimeout;
    return Response.json({
      picks: [],
      tip: '',
      fallback: true,
      note: timedOut
        ? msg(
            request,
            'AI trả lời quá lâu — lượt này không bị tính. Đây là kết quả tìm thường.',
            'The AI took too long — this one wasn’t counted. Showing regular results.',
          )
        : msg(
            request,
            'AI đang bận — lượt này không bị tính. Đây là kết quả tìm thường.',
            'The AI is unavailable right now — this one wasn’t counted. Showing regular results.',
          ),
    });
  }
}
