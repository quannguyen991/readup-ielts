import { articleThumbnailSpec, ASSET_CATALOG } from '@/services/ai/asset-catalog';
import { ensureAsset, listCachedAssets } from '@/services/ai/assets';
import { AiError } from '@/services/ai/errors';
import { errorText, msg } from '@/lib/server-locale';

/**
 * API route chạy server-side — nơi duy nhất trong app có quyền gọi OpenAI.
 * Key không bao giờ đi xuống client.
 *
 *   GET  /api/assets              → danh sách tài nguyên đã cache
 *   POST /api/assets              → sinh theo yêu cầu (cần header x-asset-secret)
 *        body: { key } | { articleId, subject }
 */

export async function GET(request: Request): Promise<Response> {
  try {
    const assets = await listCachedAssets();
    return Response.json({
      assets: assets.map((a) => ({ key: a.cache_key, url: a.public_url, kind: a.kind })),
    });
  } catch (err) {
    return errorResponse(request, err);
  }
}

export async function POST(request: Request): Promise<Response> {
  const secret = process.env.ASSET_ADMIN_SECRET;
  if (!secret || request.headers.get('x-asset-secret') !== secret) {
    return Response.json({ error: msg(request, 'Không có quyền sinh tài nguyên.', 'Not allowed to generate assets.') }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      key?: string;
      articleId?: string;
      subject?: string;
      force?: boolean;
    };

    const spec = body.articleId
      ? articleThumbnailSpec(body.articleId, body.subject ?? 'an abstract editorial scene')
      : ASSET_CATALOG.find((a) => a.key === body.key);

    if (!spec) {
      return Response.json({ error: msg(request, `Không tìm thấy tài nguyên '${body.key}'.`, `Asset '${body.key}' not found.`) }, { status: 400 });
    }

    const result = await ensureAsset(spec, { force: body.force ?? false });

    return Response.json({
      key: result.asset.cache_key,
      url: result.asset.public_url,
      cached: result.cached,
    });
  } catch (err) {
    return errorResponse(request, err);
  }
}

function errorResponse(request: Request, err: unknown): Response {
  if (err instanceof AiError) {
    const status = err.code === 'missing_config' ? 500 : (err.status ?? 502);
    return Response.json({ error: errorText(request, err, err.message, 'AI service error.'), code: err.code }, { status });
  }

  const message = errorText(request, err, 'Lỗi không xác định', 'Unknown error');
  return Response.json({ error: message }, { status: 500 });
}
