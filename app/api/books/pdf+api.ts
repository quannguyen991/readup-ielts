import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { msg } from '@/lib/server-locale';
import { bookById, downloadName } from '@/services/books/catalog';
import { bookGrant, type PaymentForBooks } from '@/services/books/entitlement';
import { stampPdf } from '@/services/books/stamp';
import {
  BOOKS_BUCKET,
  DAILY_DOWNLOAD_CAP,
  SIGNED_URL_SECONDS,
  appendDownload,
  dayKey,
  downloadedBooks,
  downloadsOn,
  logPath,
  masterPath,
  parseLog,
  staleDays,
  stampedPath,
  type DownloadLog,
} from '@/services/books/storage';

/**
 * GET  /api/books/pdf             → { granted, order, downloaded } — có quyền tải bản đầy đủ không, đã tải cuốn nào
 * POST /api/books/pdf { bookId }  → { url } — link ký 10 phút tới bản đã in email + mã đơn ở chân từng trang
 *
 * Luật quyền: `services/books/entitlement` (đơn ĐÃ TRẢ TIỀN của gói Max hoặc gói năm).
 * Bố cục kho, sổ tải, trần lượt/ngày và lịch dọn: `services/books/storage`.
 * Bản gốc đẩy lên bằng `scripts/books/upload-books.mjs`.
 *
 * Không trả thẳng file qua hàm: sách tới 10 MB, vượt trần 4,5 MB mỗi phản hồi của Vercel.
 */

type Admin = ReturnType<typeof getSupabaseAdmin>;
type Who = { ok: true; userId: string; email: string } | { ok: false; error: Response };

async function identify(request: Request): Promise<Who> {
  const header = request.headers.get('authorization') ?? '';
  const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
  if (!token) return { ok: false, error: Response.json({ error: msg(request, 'Cần đăng nhập để tải sách.', 'Sign in to download books.') }, { status: 401 }) };
  const { data, error } = await getSupabaseAdmin().auth.getUser(token);
  if (error || !data.user) {
    return { ok: false, error: Response.json({ error: msg(request, 'Phiên đăng nhập không hợp lệ.', 'Invalid session. Please sign in again.') }, { status: 401 }) };
  }
  return { ok: true, userId: data.user.id, email: data.user.email ?? data.user.id };
}

async function grantFor(admin: Admin, userId: string) {
  const { data, error } = await admin
    .from('payments')
    .select('id, plan, billing_cycle, status, amount_vnd, reference, confirmed_at, created_at')
    .eq('user_id', userId);
  if (error) throw error;
  const rows: PaymentForBooks[] = (data ?? []).map((p) => ({
    id: String(p.id),
    plan: String(p.plan),
    billing_cycle: String(p.billing_cycle),
    status: String(p.status),
    amount_vnd: Number(p.amount_vnd),
    reference: (p.reference as string | null) ?? null,
    // bảng payments ghi giờ xác nhận chuyển khoản ở confirmed_at
    paid_at: (p.confirmed_at as string | null) ?? null,
    created_at: String(p.created_at),
  }));
  return bookGrant(rows);
}

/** Mã đơn in lên sách: mã chuyển khoản nếu có, không thì 8 ký tự đầu của id đơn. */
function orderRef(p: PaymentForBooks): string {
  return p.reference?.trim() || p.id.slice(0, 8).toUpperCase();
}

async function readLog(admin: Admin, userId: string): Promise<DownloadLog> {
  const { data } = await admin.storage.from(BOOKS_BUCKET).download(logPath(userId));
  return parseLog(data ? await data.text() : null);
}

/** Dọn bản in tên của những ngày trước hôm qua. Lỗi dọn không được làm hỏng lượt tải. */
async function sweepStale(admin: Admin, today: string) {
  const storage = admin.storage.from(BOOKS_BUCKET);
  const { data: days } = await storage.list('stamped', { limit: 100 });
  for (const day of staleDays((days ?? []).map((d) => d.name), today)) {
    const { data: users } = await storage.list(`stamped/${day}`, { limit: 1000 });
    const paths: string[] = [];
    for (const u of users ?? []) {
      const { data: files } = await storage.list(`stamped/${day}/${u.name}`, { limit: 100 });
      for (const f of files ?? []) paths.push(`stamped/${day}/${u.name}/${f.name}`);
    }
    if (paths.length) await storage.remove(paths);
  }
}

export async function GET(request: Request) {
  if (!request.headers.get('authorization')) return Response.json({ granted: false, order: null, downloaded: [] });
  const who = await identify(request);
  if (!who.ok) return who.error;
  try {
    const admin = getSupabaseAdmin();
    const grant = await grantFor(admin, who.userId);
    const downloaded = grant ? downloadedBooks(await readLog(admin, who.userId)) : [];
    return Response.json({ granted: Boolean(grant), order: grant ? orderRef(grant) : null, downloaded });
  } catch {
    return Response.json({ error: msg(request, 'Không đọc được đơn hàng, thử lại sau.', 'Could not read your orders. Try again later.') }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const who = await identify(request);
  if (!who.ok) return who.error;

  let bookId = '';
  try {
    bookId = String(((await request.json()) as { bookId?: unknown }).bookId ?? '');
  } catch {
    /* thân rỗng → báo không có sách bên dưới */
  }
  const book = bookById(bookId);
  if (!book) return Response.json({ error: msg(request, 'Không có cuốn sách này.', 'Unknown book.') }, { status: 404 });

  const admin = getSupabaseAdmin();
  const grant = await grantFor(admin, who.userId).catch(() => null);
  if (!grant) {
    return Response.json(
      { error: msg(request, 'Bản đầy đủ kèm gói Max hoặc gói trả theo năm.', 'The full book comes with Max or any yearly plan.') },
      { status: 403 },
    );
  }

  const now = new Date();
  const today = dayKey(now);
  const log = await readLog(admin, who.userId);
  if (downloadsOn(log, today) >= DAILY_DOWNLOAD_CAP) {
    return Response.json(
      { error: msg(request, `Mỗi ngày tải tối đa ${DAILY_DOWNLOAD_CAP} lượt. Mai bạn tải tiếp nhé.`, `Up to ${DAILY_DOWNLOAD_CAP} downloads a day. Try again tomorrow.`) },
      { status: 429 },
    );
  }

  const storage = admin.storage.from(BOOKS_BUCKET);
  const path = stampedPath(today, who.userId, book.id);
  const { data: existing } = await storage.list(`stamped/${today}/${who.userId}`, { search: `${book.id}.pdf` });
  if (!existing?.some((f) => f.name === `${book.id}.pdf`)) {
    const { data: master, error: dlErr } = await storage.download(masterPath(book.file));
    if (dlErr || !master) {
      return Response.json({ error: msg(request, 'Kho sách đang lỗi, thử lại sau ít phút.', 'The book store is unavailable. Try again shortly.') }, { status: 502 });
    }
    const bytes = await stampPdf(new Uint8Array(await master.arrayBuffer()), who.email, orderRef(grant));
    const { error: upErr } = await storage.upload(path, bytes, { contentType: 'application/pdf', upsert: true });
    if (upErr) {
      return Response.json({ error: msg(request, 'Không chuẩn bị được bản tải, thử lại sau.', 'Could not prepare your copy. Try again later.') }, { status: 502 });
    }
    await sweepStale(admin, today).catch(() => undefined);
  }

  const { data: signed, error: signErr } = await storage.createSignedUrl(path, SIGNED_URL_SECONDS, { download: downloadName(book) });
  if (signErr || !signed) {
    return Response.json({ error: msg(request, 'Không tạo được link tải, thử lại sau.', 'Could not create the download link.') }, { status: 502 });
  }

  // Sổ tải là căn cứ của Chính sách hoàn tiền: ghi TRƯỚC khi trả link. Ghi hỏng thì không trả link.
  const next = appendDownload(log, { book: book.id, at: now.toISOString(), paymentId: grant.id });
  const { error: logErr } = await storage.upload(logPath(who.userId), JSON.stringify(next), { contentType: 'application/json', upsert: true });
  if (logErr) {
    return Response.json({ error: msg(request, 'Không ghi được lượt tải, thử lại sau.', 'Could not record the download. Try again.') }, { status: 502 });
  }
  return Response.json({ url: signed.signedUrl });
}
