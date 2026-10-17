import wikiSeed from './seed/wiki-news/index.json';
import nasaSeed from './seed/nasa-news/index.json';
import ytNewsSeed from './seed/yt-news/index.json';
import voaSeed from './seed/voa-video/index.json';
import librivoxSeed from './seed/librivox/index.json';

/**
 * Dữ liệu cho mục Luyện đọc: tin tiếng Anh theo ngày (Wikipedia, NASA), video tin
 * (Vietnam Today, BBC News), video VOA lưu trữ, sách nói LibriVox.
 *
 * Mọi tệp seed do script làm mới sinh ra (xem docs/luyen-doc-ke-hoach.md). File này
 * chỉ đọc seed, nhóm và định dạng; không gọi mạng.
 */

export type NewsSource = 'wiki' | 'nasa';

/** Một tin để luyện đọc, dù lấy từ nguồn nào. Mọi tin đều có nguồn và giấy phép. */
export type NewsItem = {
  id: string;
  date: string;
  section: string;
  headline: string;
  details: string[];
  sourceUrl: string;
  license: string;
  source: NewsSource;
};

export type VideoNews = {
  id: string;
  title: string;
  channel: string;
  source: string;
  publishedAt: string;
  durationSeconds: number | null;
};

export type VoaVideo = {
  id: string;
  title: string;
  channel: string;
  publishedAt: string;
  durationSeconds: number | null;
};

export type Chapter = {
  n: number;
  title: string;
  seconds: number;
  url: string;
  reader: string;
};

export type Book = {
  id: string;
  title: string;
  author: string;
  language: string;
  level: string;
  topic: string;
  totalSeconds: number;
  readers: string[];
  sourceUrl: string;
  chapters: Chapter[];
};

/** Tin từ Wikipedia (CC BY-SA) và NASA (phạm vi công cộng), gộp và sắp mới nhất trước. */
export const NEWS: NewsItem[] = [
  ...(wikiSeed as Omit<NewsItem, 'source'>[]).map((i) => ({ ...i, source: 'wiki' as const })),
  ...(nasaSeed as NewsItem[]),
].sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));

/** Chỉ tin Wikipedia (CC BY-SA), để kiểm và hiển thị riêng khi cần. */
export const WIKI_NEWS: NewsItem[] = NEWS.filter((i) => i.source === 'wiki');

export const VIDEO_NEWS: VideoNews[] =[...(ytNewsSeed as VideoNews[])].sort(
  (a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.title.localeCompare(b.title),
);

export const VOA_VIDEOS: VoaVideo[] = [...(voaSeed as VoaVideo[])].sort(
  (a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.title.localeCompare(b.title),
);

export const LIBRIVOX_BOOKS: Book[] = librivoxSeed as Book[];

/**
 * Độ khó của tin là ƯỚC LƯỢNG: câu dài, từ chuyên ngành và tên riêng nhiều hơn bài
 * dành cho người mới. Ghi rõ là ước lượng để người học không tin quá mức.
 */
export const NEWS_LEVEL_LABEL = 'B2–C1 (ước lượng)';

/** Ghi nguồn bắt buộc — hiện ngay trên mọi trang dùng dữ liệu này. */
export const WIKI_NGUON = {
  ten: 'Wikipedia — Portal:Current events',
  giay_phep: 'CC BY-SA 4.0',
};

export const NASA_NGUON = {
  ten: 'NASA',
  giay_phep: 'Phạm vi công cộng (NASA)',
};

export const VOA_NGUON = {
  ten: 'VOA Learning English',
  giay_phep: 'Phạm vi công cộng (tác phẩm của cơ quan liên bang Hoa Kỳ)',
};

export const VIDEO_NEWS_NGUON = {
  ten: 'Vietnam Today, BBC News (YouTube)',
  giay_phep: 'Bản quyền thuộc chủ kênh; chỉ nhúng qua trình nhúng chính thức',
};

export const LIBRIVOX_NGUON = {
  ten: 'LibriVox',
  giay_phep: 'Phạm vi công cộng; tên người đọc ghi theo từng chương',
};

/** Tên mục tiếng Việt. Mục chưa có trong bảng thì giữ nguyên tiếng Anh. */
const SECTION_VI: Record<string, string> = {
  'Armed conflicts and attacks': 'Xung đột và tấn công',
  'Arts and culture': 'Nghệ thuật và văn hoá',
  'Business and economy': 'Kinh doanh và kinh tế',
  'Disasters and accidents': 'Thiên tai và tai nạn',
  'Health and environment': 'Sức khoẻ và môi trường',
  'International relations': 'Quan hệ quốc tế',
  'Law and crime': 'Pháp luật và tội phạm',
  'Law and crimes': 'Pháp luật và tội phạm',
  'Politics and elections': 'Chính trị và bầu cử',
  'Science and technology': 'Khoa học và công nghệ',
  Sport: 'Thể thao',
  Sports: 'Thể thao',
  'NASA news': 'Tin NASA',
};

export function sectionLabel(en: string): string {
  return SECTION_VI[en] ?? en;
}

/** Các mục có tin, theo thứ tự xuất hiện lần đầu. */
export function newsSections(items: readonly NewsItem[]): string[] {
  return [...new Set(items.map((i) => i.section))];
}

function utcDay(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

/** Số ngày từ `a` đến `b` (dương nếu `b` sau `a`). */
export function daysBetween(a: string, b: string): number {
  return Math.round((utcDay(b) - utcDay(a)) / 86_400_000);
}

/** Nhãn ngày: "Hôm nay", "Hôm qua", hoặc dd/mm/yyyy. */
export function dayLabel(date: string, todayIso: string): string {
  const diff = daysBetween(date, todayIso);
  if (diff === 0) return 'Hôm nay';
  if (diff === 1) return 'Hôm qua';
  const [y, m, d] = date.split('-');
  return `${d}/${m}/${y}`;
}

export type NewsDay<T extends NewsItem = NewsItem> = { date: string; label: string; items: T[] };

/**
 * Nhóm tin theo ngày, ngày mới nhất trước. `section` lọc theo mục tiếng Anh gốc;
 * bỏ qua hoặc để `all` thì lấy mọi mục.
 */
export function groupNewsByDay<T extends NewsItem>(items: readonly T[], todayIso: string, section: string = 'all'): NewsDay<T>[] {
  const picked = section === 'all' ? items : items.filter((i) => i.section === section);
  const byDate = new Map<string, T[]>();
  for (const it of picked) {
    const list = byDate.get(it.date) ?? [];
    list.push(it);
    byDate.set(it.date, list);
  }
  return [...byDate.keys()]
    .sort((a, b) => b.localeCompare(a))
    .map((date) => ({ date, label: dayLabel(date, todayIso), items: byDate.get(date) ?? [] }));
}

/**
 * Thời lượng dạng người đọc: "45 giây", "12 phút", "1 giờ", "2 giờ 03 phút".
 * Làm tròn theo phút, không để một bài 59 giây thành "1 phút" rồi lại thành "60 giây".
 */
export function formatSeconds(sec: number): string {
  if (sec < 60) return `${Math.max(0, Math.round(sec))} giây`;
  const minutes = Math.round(sec / 60);
  if (minutes < 60) return `${minutes} phút`;
  const h = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${h} giờ ${String(rest).padStart(2, '0')} phút` : `${h} giờ`;
}

/** Ngày hôm nay theo giờ Việt Nam (UTC+7), dạng YYYY-MM-DD. Tính tay để chạy giống nhau trên mọi thiết bị. */
export function vnTodayIso(now: Date = new Date()): string {
  return new Date(now.getTime() + 7 * 3_600_000).toISOString().slice(0, 10);
}

/** dd/mm/yyyy từ YYYY-MM-DD. */
export function isoToVi(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}
