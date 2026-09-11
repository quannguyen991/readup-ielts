import { hashString, mulberry32 } from '@/services/questions/rng';

/**
 * Bìa của thẻ bài đọc: ảnh thật khi có ảnh riêng, bìa vẽ bằng code khi không.
 *
 * VÌ SAO CẦN. Đo trên kho thật: 1.408 bài, chỉ 353 bài có ảnh riêng. 1.055 bài
 * còn lại rơi về ẢNH CHỦ ĐỀ — mà cả kho chỉ có 10 ảnh chủ đề, và riêng mảng
 * văn học (315 bài) còn không có ảnh nào nên hiện một ô icon quyển sách giống
 * hệt nhau. Mở thư viện ra, màn đầu 9 ảnh thì 5 ảnh là cùng một tấm
 * `topic/science.png`. Ảnh thật cũng không sạch: 92 bài Wikipedia dùng chung
 * 33 ảnh — sáu bài tâm lý học mang cùng một biểu tượng chữ psi.
 *
 * HAI LUẬT, và cả hai đều để KHÔNG TẤM ẢNH NÀO HIỆN Ở HAI BÀI KHÁC NHAU:
 *
 * 1. Ảnh dùng chung thì chỉ bài ĐẦU TIÊN (theo thứ tự kho) được giữ. Các bài
 *    sau chuyển sang bìa vẽ. Giữ lại cho một bài chứ không bỏ hết: ảnh thật
 *    vẫn hơn bìa vẽ, cái cần bỏ là SỰ LẶP LẠI chứ không phải tấm ảnh.
 * 2. Bài không có ảnh riêng thì vẽ bìa từ chính mã bài: dải màu theo chủ đề
 *    có lệch màu riêng, hoạ tiết riêng, hướng riêng. Không dùng ảnh chủ đề nữa
 *    — ảnh chủ đề là một tấm cho cả trăm bài, tức là chính nguồn lặp.
 *
 * KHÔNG GỌI API, KHÔNG TẢI GÌ. Sinh ảnh riêng cho 1.055 bài là khoảng 18 tiếng
 * gọi API và tốn tiền (ghi chú cũ trong `ArticleCard` đã tính), mà dự án đã
 * chốt không gọi API cho nội dung. Bìa vẽ bằng SVG thì nặng không byte nào.
 *
 * TẤT ĐỊNH: cùng một bài luôn ra cùng một bìa, ở mọi máy, mọi lần mở. Bìa đổi
 * mỗi lần tải trang thì người học mất đúng cái mốc thị giác giúp họ nhận ra
 * "bài hôm qua đang đọc dở".
 *
 * Hàm thuần, không chạm tới React hay kho bài — nhận danh sách từ ngoài, nên
 * test được bằng bộ test của Node trên chính 1.408 bài thật.
 */

export type CoverPattern = 'dots' | 'rings' | 'stripes' | 'blobs';

export type GeneratedCover = {
  kind: 'generated';
  /** Hai đầu dải màu, dạng #rrggbb. */
  from: string;
  to: string;
  pattern: CoverPattern;
  /** Hướng dải màu, độ: 0 · 45 · 90 · 135. */
  angle: number;
  /** Vị trí hoạ tiết, 0–1 — cùng một hoạ tiết mà lệch chỗ thì vẫn khác nhau. */
  offset: number;
  topic: string;
};

export type CoverSource = { kind: 'photo'; uri: string } | GeneratedCover;

type ArticleLike = {
  id: string;
  topic?: string | null;
  thumbnailUrl?: string | null;
};

const PATTERNS: readonly CoverPattern[] = ['dots', 'rings', 'stripes', 'blobs'];

/**
 * Sắc độ gốc của từng chủ đề.
 *
 * Mỗi chủ đề MỘT VÙNG MÀU, và các vùng cách nhau đủ xa để lưới thẻ trộn nhiều
 * chủ đề vẫn đọc ra được mảng nào với mảng nào. Trong cùng một vùng thì từng
 * bài lệch thêm ±18° — đủ để hai thẻ đứng cạnh nhau không giống hệt, chưa đủ
 * để một bài khoa học trông như bài môi trường.
 */
const TOPIC_HUE: Record<string, number> = {
  environment: 145,
  science: 190,
  technology: 215,
  literature: 238,
  education: 262,
  psychology: 285,
  culture: 318,
  health: 350,
  society: 12,
  business: 32,
  history: 48,
};

/**
 * Khoá so trùng của một địa chỉ ảnh — HAI ĐỊA CHỈ KHÁC NHAU CÓ THỂ CÙNG MỘT ẢNH.
 *
 * Wikimedia phát cùng một tấm ở nhiều cỡ: bản gốc
 * `commons/9/9e/Tên.svg` và bản thu nhỏ `commons/thumb/9/9e/Tên.svg/960px-…`,
 * cộng thêm đuôi `?utm_source=…` tuỳ lần gọi. So nguyên chuỗi thì ba địa chỉ
 * ấy là ba ảnh khác nhau, và cùng một tấm vẫn hiện ở ba bài.
 */
export function photoKey(url: string): string {
  const noQuery = url.split(/[?#]/)[0] ?? url;
  let host = '';
  let path = noQuery;
  const m = /^[a-z]+:\/\/([^/]+)(\/.*)?$/i.exec(noQuery);
  if (m) {
    host = m[1]!.toLowerCase();
    path = m[2] ?? '/';
  }

  const thumb = /\/thumb\/[0-9a-f]\/[0-9a-f]{2}\/([^/]+)\//i.exec(path);
  const file = thumb ? thumb[1]! : (path.split('/').pop() ?? path);

  let decoded = file;
  try {
    decoded = decodeURIComponent(file);
  } catch {
    /* Địa chỉ mã hoá hỏng thì so nguyên dạng — thà so thô còn hơn nổ cả thẻ. */
  }
  return `${host}/${decoded.toLowerCase()}`;
}

/**
 * Ai là chủ của từng tấm ảnh: bài ĐẦU TIÊN mang nó, theo thứ tự danh sách.
 *
 * Tính một lần cho cả kho, rồi mỗi thẻ chỉ tra. Tính theo thứ tự KHO chứ không
 * theo thứ tự đang hiện trên màn: lọc hay sắp xếp lại lưới thì chủ của tấm ảnh
 * không được đổi, không thì cùng một bài lúc có ảnh lúc không.
 */
export function buildPhotoOwners(articles: readonly ArticleLike[]): Map<string, string> {
  const owners = new Map<string, string>();
  for (const a of articles) {
    const url = a.thumbnailUrl?.trim();
    if (!url) continue;
    const key = photoKey(url);
    if (!owners.has(key)) owners.set(key, a.id);
  }
  return owners;
}

/** Bìa vẽ cho một bài — tất định theo mã bài. */
export function generatedCover(article: ArticleLike): GeneratedCover {
  const rnd = mulberry32(hashString(article.id));
  const topic = article.topic ?? '';
  const base = TOPIC_HUE[topic] ?? hashString(topic || article.id) % 360;

  const hue = wrapHue(base + (rnd() * 36 - 18));
  const hue2 = wrapHue(hue + 18 + rnd() * 34);

  /*
    Đầu SÁNG hơn, đuôi TỐI hơn, và cả hai đủ đậm để icon trắng đặt lên vẫn đọc
    được. Độ sáng giữ trong khoảng hẹp: sáng quá thì icon trắng chìm, tối quá
    thì cả lưới thành một mảng u ám.
  */
  const from = hslToHex(hue, 68 + rnd() * 14, 54 + rnd() * 8);
  const to = hslToHex(hue2, 62 + rnd() * 14, 36 + rnd() * 8);

  return {
    kind: 'generated',
    from,
    to,
    pattern: PATTERNS[Math.floor(rnd() * PATTERNS.length)]!,
    angle: Math.floor(rnd() * 4) * 45,
    offset: rnd(),
    topic,
  };
}

/**
 * Bìa cho một bài: ảnh riêng nếu nó là chủ tấm ảnh, bìa vẽ trong mọi ca còn lại.
 *
 * Bài không có trong kho (bài người dùng tự thêm) thì không có trong bảng chủ
 * — ảnh của nó chắc chắn không ai dùng chung, nên được giữ.
 */
export function coverSource(article: ArticleLike, owners: Map<string, string>): CoverSource {
  const url = article.thumbnailUrl?.trim();
  if (url) {
    const owner = owners.get(photoKey(url));
    if (owner === undefined || owner === article.id) return { kind: 'photo', uri: url };
  }
  return generatedCover(article);
}

function wrapHue(h: number): number {
  return ((h % 360) + 360) % 360;
}

/** HSL (độ, %, %) → #rrggbb. Tự đổi để không phụ thuộc máy vẽ có hiểu hsl() hay không. */
export function hslToHex(h: number, s: number, l: number): string {
  const sat = Math.max(0, Math.min(100, s)) / 100;
  const lig = Math.max(0, Math.min(100, l)) / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sat * Math.min(lig, 1 - lig);
  const f = (n: number) => lig - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const hex = (x: number) =>
    Math.round(x * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${hex(f(0))}${hex(f(8))}${hex(f(4))}`;
}
