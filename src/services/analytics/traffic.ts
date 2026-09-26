/**
 * Lượt truy cập web — phần xử lý thuần (không đụng mạng, không đụng DOM).
 *
 * Dùng ở hai đầu: `/api/track` gọi `classifyUserAgent` để quy chuỗi User-Agent
 * về nhóm thô rồi BỎ chuỗi gốc; `/api/admin/traffic` gọi `summarizeTraffic` để
 * gom các dòng `page_views` thành số cho trang quản trị.
 *
 * Người dùng muốn đếm được người truy cập và các thiết bị ngay trong trang quản
 * trị (26/09/2026), không phải mở Vercel.
 */

export type Device = 'mobile' | 'tablet' | 'desktop';

export type PageViewRow = {
  at: string;
  visitor: string;
  session: string | null;
  path: string;
  device: Device;
  os: string | null;
  browser: string | null;
  referrer: string | null;
  country: string | null;
  signed_in: boolean;
};

/** Bot, trình thu thập, trình duyệt không đầu — không phải người thật, không đếm. */
export function isBot(ua: string): boolean {
  return /bot|crawl|spider|slurp|headless|lighthouse|pingdom|preview|facebookexternalhit|embedly|curl|wget|python|node-fetch|axios/i.test(ua);
}

/**
 * Nhóm thô từ User-Agent. Thứ tự dò quan trọng: trình duyệt nhúng trong app
 * (Zalo, Facebook, Messenger, Instagram, TikTok) phải dò TRƯỚC Chrome/Safari,
 * vì chuỗi của chúng chứa cả "Chrome" lẫn "Safari" — mà với ReadUp, biết người
 * xem mở link từ trong Zalo hay Facebook mới là thông tin cần.
 */
export function classifyUserAgent(ua: string, width?: number): { device: Device; os: string; browser: string } {
  const s = ua || '';
  const ipad = /iPad/.test(s) || (/Macintosh/.test(s) && /Mobile\//.test(s));
  const tablet = ipad || /Tablet|PlayBook|Silk/i.test(s) || (/Android/.test(s) && !/Mobile/.test(s));
  const mobile = !tablet && /Mobi|iPhone|iPod|Android.*Mobile|Windows Phone/i.test(s);
  let device: Device = tablet ? 'tablet' : mobile ? 'mobile' : 'desktop';
  // Máy tính bảng giả danh máy tính (iPadOS gửi UA của Mac): màn hẹp thì không phải máy tính.
  if (device === 'desktop' && width !== undefined && width > 0 && width < 820 && /Macintosh|Linux/.test(s)) device = width < 600 ? 'mobile' : 'tablet';

  const os = /iPhone|iPad|iPod/.test(s) || ipad
    ? 'iOS'
    : /Android/.test(s)
      ? 'Android'
      : /Windows/.test(s)
        ? 'Windows'
        : /CrOS/.test(s)
          ? 'ChromeOS'
          : /Mac OS X|Macintosh/.test(s)
            ? 'macOS'
            : /Linux/.test(s)
              ? 'Linux'
              : 'Khác';

  const browser = /Zalo/i.test(s)
    ? 'Zalo'
    : /FBAN|FBAV|FB_IAB|FBIOS/.test(s)
      ? /Messenger|Orca-Android/i.test(s) ? 'Messenger' : 'Facebook'
      : /Instagram/.test(s)
        ? 'Instagram'
        : /musical_ly|TikTok|BytedanceWebview/i.test(s)
          ? 'TikTok'
          : /coc_coc|CocCoc/i.test(s)
            ? 'Cốc Cốc'
            : /Edg\//.test(s)
              ? 'Edge'
              : /OPR\/|Opera/.test(s)
                ? 'Opera'
                : /SamsungBrowser/.test(s)
                  ? 'Samsung'
                  : /Firefox|FxiOS/.test(s)
                    ? 'Firefox'
                    : /Chrome|CriOS/.test(s)
                      ? 'Chrome'
                      : /Safari/.test(s)
                        ? 'Safari'
                        : 'Khác';

  return { device, os, browser };
}

/**
 * Đường dẫn gom nhóm: mã bài (uuid, số dài) thay bằng ":id" để "Trang xem nhiều"
 * đếm theo LOẠI trang (/read/:id) chứ không vỡ thành trăm dòng một lượt.
 */
export function normalizePath(path: string): string {
  const clean = (path || '/').split(/[?#]/)[0]!.slice(0, 200) || '/';
  return clean
    .split('/')
    .map((seg) => (/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(seg) || /^\d{4,}$/.test(seg) ? ':id' : seg))
    .join('/');
}

/** Chỉ tên miền của trang giới thiệu, bỏ "www." và "m." — không lưu đường dẫn đầy đủ. */
export function referrerHost(ref: string | null | undefined, ownHost?: string): string | null {
  if (!ref) return null;
  try {
    const host = new URL(ref).hostname.replace(/^(www|m|l|lm)\./, '').toLowerCase();
    if (!host || (ownHost && host === ownHost.replace(/^www\./, ''))) return null;
    return host.slice(0, 80);
  } catch {
    return null;
  }
}

/** Ngày theo giờ Việt Nam (UTC+7) — cùng lối chốt ngày với Bảng vàng. */
export function vnDay(iso: string): string {
  return new Date(Date.parse(iso) + 7 * 3_600_000).toISOString().slice(0, 10);
}

export type TrafficSummary = {
  days: number;
  visitors: number;
  views: number;
  sessions: number;
  signedInVisitors: number;
  today: { visitors: number; views: number };
  /** Mỗi ngày trong khoảng, kể cả ngày 0 lượt, cũ → mới. */
  daily: { day: string; visitors: number; views: number }[];
  /** Chia theo NGƯỜI (mã khách), không theo lượt xem — một người mở 30 trang vẫn là một. */
  devices: [string, number][];
  os: [string, number][];
  browsers: [string, number][];
  countries: [string, number][];
  pages: [string, number][];
  referrers: [string, number][];
};

function countBy(rows: PageViewRow[], key: (r: PageViewRow) => string | null, unique: boolean, limit = 8): [string, number][] {
  const map = new Map<string, Set<string> | number>();
  for (const r of rows) {
    const k = key(r) ?? 'Không rõ';
    if (unique) {
      const set = (map.get(k) as Set<string> | undefined) ?? new Set<string>();
      set.add(r.visitor);
      map.set(k, set);
    } else {
      map.set(k, ((map.get(k) as number | undefined) ?? 0) + 1);
    }
  }
  return [...map.entries()]
    .map(([k, v]): [string, number] => [k, typeof v === 'number' ? v : v.size])
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
}

export function summarizeTraffic(rows: PageViewRow[], now: Date, days: number): TrafficSummary {
  const todayKey = vnDay(now.toISOString());
  const dayKeys: string[] = [];
  for (let i = days - 1; i >= 0; i--) dayKeys.push(vnDay(new Date(now.getTime() - i * 86_400_000).toISOString()));
  const inRange = rows.filter((r) => dayKeys.includes(vnDay(r.at)));

  const perDay = new Map<string, { v: Set<string>; n: number }>();
  for (const d of dayKeys) perDay.set(d, { v: new Set(), n: 0 });
  for (const r of inRange) {
    const b = perDay.get(vnDay(r.at))!;
    b.v.add(r.visitor);
    b.n++;
  }
  const today = perDay.get(todayKey) ?? { v: new Set<string>(), n: 0 };

  return {
    days,
    visitors: new Set(inRange.map((r) => r.visitor)).size,
    views: inRange.length,
    sessions: new Set(inRange.map((r) => r.session ?? r.visitor)).size,
    signedInVisitors: new Set(inRange.filter((r) => r.signed_in).map((r) => r.visitor)).size,
    today: { visitors: today.v.size, views: today.n },
    daily: dayKeys.map((day) => ({ day, visitors: perDay.get(day)!.v.size, views: perDay.get(day)!.n })),
    devices: countBy(inRange, (r) => r.device, true),
    os: countBy(inRange, (r) => r.os, true),
    browsers: countBy(inRange, (r) => r.browser, true),
    countries: countBy(inRange, (r) => r.country, true),
    pages: countBy(inRange, (r) => r.path, false, 10),
    referrers: countBy(inRange.filter((r) => r.referrer), (r) => r.referrer, true, 8),
  };
}
