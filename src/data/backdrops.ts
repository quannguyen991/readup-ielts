/**
 * Nền TRANH NỔI TIẾNG cho màn đọc báo và màn học từ vựng (không dùng ở chế độ làm đề tính giờ).
 *
 * Ảnh gốc (public domain, Wikimedia Commons), đã nén JPEG:
 *   public/backdrops/art/<id>.jpg        (≤ 1920px — nền)
 *   public/backdrops/art/<id>.thumb.jpg  (≤ 520px — ô chọn trong cài đặt)
 * `needs` liệt kê file bắt buộc; chạy thật thì dò bằng Image onload và bỏ mục thiếu.
 * Module này KHÔNG import react-native để test được bằng tsx.
 */

export type BackdropTone = 'dark' | 'light';

export type Backdrop = {
  id: string;
  vi: string;
  en: string;
  artist: string;
  year: string;
  /** Tông sau khi phủ lớp màu: 'dark' → chữ sáng trên nền; 'light' → chữ tối. */
  tone: BackdropTone;
  /** Màu phủ (rgb) lấy từ tông tranh. */
  scrim: string;
  /** Độ đậm lớp phủ trên máy tính (điện thoại cộng thêm). Đo từ độ sáng thật của ảnh. */
  scrimA: number;
  /** object-position — tiêu điểm khi ảnh bị cắt cho vừa khung (tranh dọc/vuông). */
  pos: string;
  /** Các file phải có thì mới hiện mục này. */
  needs: string[];
};

const BASE = '/backdrops/art';

export function backdropUrl(id: string): string {
  return `${BASE}/${id}.jpg`;
}
export function backdropThumb(id: string): string {
  return `${BASE}/${id}.thumb.jpg`;
}

function entry(id: string, vi: string, en: string, artist: string, year: string, tone: BackdropTone, scrim: string, scrimA: number, pos = 'center'): Backdrop {
  return { id, vi, en, artist, year, tone, scrim, scrimA, pos, needs: [backdropUrl(id), backdropThumb(id)] };
}

export const BACKDROPS: readonly Backdrop[] = [
  entry('starry', 'Đêm đầy sao', 'The Starry Night', 'Vincent van Gogh', '1889', 'dark', '10,16,44', 0.42, 'center 38%'),
  entry('sunflowers', 'Hoa hướng dương', 'Sunflowers', 'Vincent van Gogh', '1888', 'light', '252,246,226', 0.6, 'center 30%'),
  entry('wheatcrows', 'Cánh đồng lúa mì và đàn quạ', 'Wheatfield with Crows', 'Vincent van Gogh', '1890', 'dark', '14,20,40', 0.46),
  entry('cafe', 'Hiên quán cà phê ban đêm', 'Café Terrace at Night', 'Vincent van Gogh', '1888', 'dark', '12,16,36', 0.58, 'center 42%'),
  entry('rhone', 'Đêm đầy sao trên sông Rhône', 'Starry Night Over the Rhône', 'Vincent van Gogh', '1888', 'dark', '8,18,40', 0.4),
  entry('irises', 'Hoa diên vĩ', 'Irises', 'Vincent van Gogh', '1889', 'dark', '12,24,28', 0.55),
  entry('wave', 'Cơn sóng lớn ngoài khơi Kanagawa', 'The Great Wave off Kanagawa', 'Hokusai', 'c. 1831', 'light', '246,242,230', 0.55),
  entry('waterlilies', 'Hoa súng', 'Water Lilies', 'Claude Monet', '1906', 'dark', '8,26,32', 0.5),
  entry('wanderer', 'Người lữ hành trên biển mây', 'Wanderer above the Sea of Fog', 'Caspar David Friedrich', '1818', 'dark', '14,18,28', 0.6, 'center 28%'),
  entry('kiss', 'Nụ hôn', 'The Kiss', 'Gustav Klimt', '1908', 'dark', '30,20,8', 0.62, 'center 30%'),
  entry('lagrande', 'Chiều Chủ nhật ở đảo La Grande Jatte', 'A Sunday Afternoon on La Grande Jatte', 'Georges Seurat', '1886', 'dark', '14,22,16', 0.6),
  entry('pearl', 'Cô gái đeo hoa tai ngọc trai', 'Girl with a Pearl Earring', 'Johannes Vermeer', 'c. 1665', 'dark', '6,6,10', 0.35, 'center 22%'),
];

export const DEFAULT_BACKDROP_ID = 'starry';
export type BackdropChoice = string; // id, hoặc 'random'
export const RANDOM = 'random';

export function findBackdrop(id: string | null | undefined): Backdrop | undefined {
  return BACKDROPS.find((b) => b.id === id);
}

/** Lọc theo tập id có file thật, giữ thứ tự của kho. */
export function availableBackdrops(ok: ReadonlySet<string>): Backdrop[] {
  return BACKDROPS.filter((b) => ok.has(b.id));
}

/** Dò từng mục: `probe(url)` trả true nếu file tồn tại. Bỏ mục thiếu BẤT KỲ file nào trong `needs`. */
export async function probeBackdrops(probe: (url: string) => Promise<boolean>): Promise<Set<string>> {
  const ok = new Set<string>();
  await Promise.all(
    BACKDROPS.map(async (b) => {
      const results = await Promise.all(b.needs.map((u) => probe(u).catch(() => false)));
      if (results.every(Boolean)) ok.add(b.id);
    }),
  );
  return ok;
}

/**
 * Chọn tranh để dựng. Chưa có tranh nào → null.
 * - 'random': bốc một bức trong số đang có (`rnd` ∈ [0,1) — truyền vào để test được).
 * - id cụ thể: dùng bức đó nếu có file; thiếu thì quay về 'starry', rồi bức đầu tiên có.
 */
export function chooseBackdrop(choice: BackdropChoice, available: readonly Backdrop[], rnd = Math.random()): Backdrop | null {
  if (available.length === 0) return null;
  if (choice === RANDOM) return available[Math.min(available.length - 1, Math.floor(rnd * available.length))] ?? null;
  return (
    available.find((b) => b.id === choice) ??
    available.find((b) => b.id === DEFAULT_BACKDROP_ID) ??
    available[0] ??
    null
  );
}

/** Độ đậm lớp phủ: màn hẹp (điện thoại) phủ đậm hơn vì chữ nằm sát tranh hơn. */
export function scrimAlpha(b: Backdrop, phone: boolean): number {
  return Math.min(0.85, b.scrimA + (phone ? 0.14 : 0));
}

/* ---------------- Tuỳ chọn lưu theo máy ---------------- */

/**
 * `on`: nền tranh ở màn đọc báo. `studyOn`: tranh làm "chủ đề" ở màn học từ vựng (còn phải bật
 * "Nền & hiệu ứng" ở đó). `choice` và `motion` DÙNG CHUNG hai nơi — một nguồn sự thật.
 */
export type BackdropPrefs = { on: boolean; studyOn: boolean; choice: BackdropChoice; motion: boolean };
export const DEFAULT_PREFS: BackdropPrefs = { on: false, studyOn: false, choice: DEFAULT_BACKDROP_ID, motion: true };

/** Đọc lại từ localStorage: dữ liệu hỏng/lạ → mặc định (TẮT). Id không còn trong kho → 'starry'. */
export function sanitizePrefs(raw: unknown): BackdropPrefs {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const c = typeof r.choice === 'string' ? r.choice : DEFAULT_PREFS.choice;
  const choice = c === RANDOM || findBackdrop(c) ? c : DEFAULT_PREFS.choice;
  return { on: r.on === true, studyOn: r.studyOn === true, choice, motion: r.motion !== false };
}

/* ---------------- Chuyển động nhẹ ---------------- */

export type MotionEnv = { cores?: number; memory?: number; saveData?: boolean; reducedMotion?: boolean };

/** Máy yếu / tiết kiệm dữ liệu / giảm chuyển động: chỉ GỢI Ý để tắt, không bao giờ tự bật tranh. */
export function lowEndHint(env: MotionEnv): boolean {
  return !!env.saveData || !!env.reducedMotion || (env.cores ?? 8) <= 4 || (env.memory ?? 8) <= 4;
}

/** Chuyển động chỉ chạy khi người dùng bật và máy không yếu / không xin giảm chuyển động. */
export function motionActive(pref: boolean, env: MotionEnv): boolean {
  return pref && !lowEndHint(env);
}

export function captionOf(b: Backdrop, en: boolean): string {
  return `${en ? b.en : b.vi} · ${b.artist}`;
}

/** Màu giấy có độ trong: hex 6 số + alpha (0–1). */
export function withAlpha(hex: string, a: number): string {
  const v = Math.round(Math.min(1, Math.max(0, a)) * 255);
  return `${hex}${v.toString(16).padStart(2, '0')}`;
}
