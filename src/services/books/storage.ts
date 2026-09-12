import type { BookId } from './catalog';

/**
 * Bố cục kho sách trên Supabase Storage, và sổ ghi lượt tải.
 *
 *   books/                                 bucket RIÊNG TƯ: không policy đọc cho ai,
 *     masters/<file>.pdf                   chỉ service key ở máy chủ chạm được
 *     stamped/<ngày>/<user>/<sách>.pdf     bản đã in tên, sống tới hết hôm sau
 *     log/<user>.json                      sổ ghi lượt tải của từng người
 *
 * VÌ SAO BẢN IN TÊN KHÔNG GIỮ LÂU. Gói free của Supabase có 1 GB lưu trữ, bộ sách
 * gốc chiếm 58 MB, và mỗi người mua tải đủ bộ là thêm 58 MB nữa. Giữ mãi thì
 * chừng mười lăm người mua là đầy kho. In lại chỉ mất khoảng một giây, nên bản
 * in tên chỉ giữ tới hết hôm sau — đủ để tải lại khi rớt mạng — rồi dọn.
 *
 * VÌ SAO SỔ TẢI LÀ FILE JSON CHỨ KHÔNG PHẢI BẢNG. Thêm bảng phải chạy migration
 * bằng access token của chủ dự án Supabase; kho file thì service key tạo và ghi
 * được. Sổ này chỉ có một bên ghi (máy chủ, theo từng người dùng) và một bên đọc
 * (trang quản trị lúc xét hoàn tiền), nên mỗi người một file là đủ. Nó phải tồn
 * tại vì CHÍNH SÁCH HOÀN TIỀN dựa vào nó: đơn đã tải sách thì không hoàn kiểu
 * đổi ý nữa.
 *
 * Mốc ngày tính theo UTC: hạn mức tải mỗi ngày làm mới lúc 7 giờ sáng giờ Việt
 * Nam chứ không phải nửa đêm. Không đáng kéo thêm múi giờ vào đây.
 */

export const BOOKS_BUCKET = 'books';

/** Link tải sống 10 phút: đủ để bắt đầu tải, không đủ để đem đi chia sẻ. */
export const SIGNED_URL_SECONDS = 10 * 60;

/** Trần lượt tải mỗi ngày của một tài khoản: tải đủ bộ hai lần vẫn còn dư, máy cào thì bị chặn. */
export const DAILY_DOWNLOAD_CAP = 30;

const DAY_MS = 86_400_000;
const LOG_CAP = 500;

export function masterPath(file: string): string {
  return `masters/${file}`;
}

export function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function stampedPath(day: string, userId: string, book: BookId): string {
  return `stamped/${day}/${userId}/${book}.pdf`;
}

export function logPath(userId: string): string {
  return `log/${userId}.json`;
}

/**
 * Thư mục ngày nào dọn được: mọi ngày TRƯỚC hôm qua.
 *
 * Giữ cả hôm qua vì link ký lúc 23:59 vẫn phải tải được lúc 00:05.
 */
export function staleDays(folders: readonly string[], today: string): string[] {
  const yesterday = dayKey(new Date(Date.parse(`${today}T00:00:00.000Z`) - DAY_MS));
  return folders.filter((name) => /^\d{4}-\d{2}-\d{2}$/.test(name) && name < yesterday);
}

export type DownloadEntry = { book: BookId; at: string; paymentId: string };
export type DownloadLog = { v: 1; downloads: DownloadEntry[] };

export function emptyLog(): DownloadLog {
  return { v: 1, downloads: [] };
}

/** Đọc sổ tải. File hỏng hay sai phiên bản thì coi như sổ trống — không làm hỏng lượt tải. */
export function parseLog(raw: string | null | undefined): DownloadLog {
  if (!raw) return emptyLog();
  try {
    const data = JSON.parse(raw) as Partial<DownloadLog> | null;
    if (!data || data.v !== 1 || !Array.isArray(data.downloads)) return emptyLog();
    const downloads = data.downloads.filter(
      (d): d is DownloadEntry =>
        !!d && typeof d.book === 'string' && typeof d.at === 'string' && typeof d.paymentId === 'string',
    );
    return { v: 1, downloads };
  } catch {
    return emptyLog();
  }
}

/** Ghi thêm một lượt. Sổ giữ 500 lượt gần nhất — đủ cho mọi lần xét hoàn tiền, không phình mãi. */
export function appendDownload(log: DownloadLog, entry: DownloadEntry): DownloadLog {
  return { v: 1, downloads: [...log.downloads, entry].slice(-LOG_CAP) };
}

export function downloadsOn(log: DownloadLog, day: string): number {
  return log.downloads.filter((d) => d.at.startsWith(day)).length;
}

/** Những cuốn đã tải ít nhất một lần, theo thứ tự tải lần đầu. */
export function downloadedBooks(log: DownloadLog): BookId[] {
  return [...new Set(log.downloads.map((d) => d.book))];
}
