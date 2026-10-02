/**
 * Nền tranh pixel cho màn ĐỌC BÁO (không dùng ở chế độ làm đề tính giờ).
 *
 * Mỗi bức là tranh nổi tiếng đã hết bản quyền, vẽ lại thành pixel 2D trên lưới 418×235:
 *   public/backdrops/<id>.small.png  (418×235 — nguồn hiển thị, phóng nguyên số lần)
 *   public/backdrops/<id>.png        (×4, dùng khi cần bản lớn)
 * File có thể chưa có (đang sinh dần): `needs` liệt kê file bắt buộc, chạy thật thì
 * dò bằng Image onload và bỏ mục thiếu. Module này KHÔNG import react-native để test được bằng tsx.
 */

export const GRID_W = 418;
export const GRID_H = 235;

export type BackdropTone = 'dark' | 'light';

export type Backdrop = {
  id: string;
  vi: string;
  en: string;
  artist: string;
  year: string;
  /** Tranh sáng hay tối quyết định màu chữ nằm TRỰC TIẾP trên nền (thanh trên) và màu phủ. */
  tone: BackdropTone;
  /** Màu phủ (rgb) — lấy từ tông tranh để chữ đọc rõ mà tranh vẫn có hồn. */
  scrim: string;
  /** Các file phải có thì mới hiện mục này. */
  needs: string[];
  /** Vị trí sao (lưới 418×235) để gắn chấm nhấp nháy — tìm bằng scripts/art/star-points.py. Tối đa ~16. */
  stars?: [number, number][];
};

const BASE = '/backdrops';

export function backdropUrl(id: string, size: 'small' | 'full' = 'small'): string {
  return size === 'small' ? `${BASE}/${id}.small.png` : `${BASE}/${id}.png`;
}

function entry(id: string, vi: string, en: string, artist: string, year: string, tone: BackdropTone, scrim: string, stars?: [number, number][]): Backdrop {
  return { id, vi, en, artist, year, tone, scrim, needs: [backdropUrl(id, 'small')], ...(stars ? { stars } : {}) };
}

export const BACKDROPS: readonly Backdrop[] = [
  entry('starry', 'Đêm đầy sao', 'The Starry Night', 'Vincent van Gogh', '1889', 'dark', '10,16,44', [[39, 11], [231, 18], [297, 25], [129, 29], [111, 7], [57, 46], [127, 93], [195, 7], [82, 28], [20, 27], [404, 70], [84, 79], [26, 114], [338, 9], [315, 62], [150, 27]]),
  entry('sunflowers', 'Hoa hướng dương', 'Sunflowers', 'Vincent van Gogh', '1888', 'light', '250,244,226'),
  entry('wheatcrows', 'Cánh đồng lúa mì và đàn quạ', 'Wheatfield with Crows', 'Vincent van Gogh', '1890', 'dark', '14,20,48'),
  entry('cafe', 'Hiên quán cà phê ban đêm', 'Café Terrace at Night', 'Vincent van Gogh', '1888', 'dark', '12,18,46', [[273, 12], [171, 14], [260, 53], [293, 80], [247, 31], [314, 25], [228, 49], [314, 95], [307, 6], [60, 38], [355, 63], [240, 11]]),
  entry('rhone', 'Đêm đầy sao trên sông Rhône', 'Starry Night Over the Rhône', 'Vincent van Gogh', '1888', 'dark', '8,18,44', [[337, 11], [237, 5], [377, 24], [123, 15], [96, 70], [410, 95], [281, 91], [361, 94], [58, 15], [298, 31], [9, 18], [411, 22], [90, 26]]),
  entry('irises', 'Hoa diên vĩ', 'Irises', 'Vincent van Gogh', '1889', 'light', '244,244,250'),
  entry('wave', 'Cơn sóng lớn ngoài khơi Kanagawa', 'The Great Wave off Kanagawa', 'Hokusai', 'c. 1831', 'light', '246,242,230'),
  entry('waterlilies', 'Hoa súng', 'Water Lilies', 'Claude Monet', '1906', 'light', '240,246,244'),
  entry('wanderer', 'Người lữ hành trên biển mây', 'Wanderer above the Sea of Fog', 'Caspar David Friedrich', '1818', 'light', '240,242,244'),
  entry('kiss', 'Nụ hôn', 'The Kiss', 'Gustav Klimt', '1908', 'dark', '36,24,10'),
  entry('lagrande', 'Chiều Chủ nhật ở đảo La Grande Jatte', 'A Sunday Afternoon on La Grande Jatte', 'Georges Seurat', '1886', 'light', '244,246,236'),
  entry('pearl', 'Cô gái đeo hoa tai ngọc trai', 'Girl with a Pearl Earring', 'Johannes Vermeer', 'c. 1665', 'dark', '14,16,22'),
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
 * Chọn tranh để dựng. Chưa có tranh nào → null (không dựng gì).
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

/**
 * Hệ số phóng NGUYÊN để pixel nét: nhỏ nhất mà phủ kín khung (cover). Khung nhỏ hơn
 * lưới (k < 1) thì không có số nguyên hợp lệ — trả hệ số lẻ, trình duyệt tự cover.
 */
export function integerScale(viewW: number, viewH: number): number {
  const need = Math.max(viewW / GRID_W, viewH / GRID_H);
  if (!(need > 0)) return 1;
  return need <= 1 ? need : Math.ceil(need - 1e-6);
}

export function scaledSize(viewW: number, viewH: number): { w: number; h: number; k: number } {
  const k = integerScale(viewW, viewH);
  return { w: Math.round(GRID_W * k), h: Math.round(GRID_H * k), k };
}

/* ---------------- Tuỳ chọn lưu theo máy ---------------- */

export type BackdropPrefs = { on: boolean; choice: BackdropChoice; motion: boolean };
/** Tranh TẮT mặc định; khi đã bật tranh thì chuyển động nhẹ mặc định BẬT (tự tắt trên máy yếu / giảm chuyển động). */
export const DEFAULT_PREFS: BackdropPrefs = { on: false, choice: DEFAULT_BACKDROP_ID, motion: true };

/** Đọc lại từ localStorage: dữ liệu hỏng/lạ → mặc định (TẮT). Id không còn trong kho → 'starry'. */
export function sanitizePrefs(raw: unknown): BackdropPrefs {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const on = r.on === true;
  const c = typeof r.choice === 'string' ? r.choice : DEFAULT_PREFS.choice;
  const choice = c === RANDOM || findBackdrop(c) ? c : DEFAULT_PREFS.choice;
  return { on, choice, motion: r.motion !== false };
}

/** Máy yếu / tiết kiệm dữ liệu / giảm chuyển động: chỉ GỢI Ý để tắt, không bao giờ tự bật. */
export function lowEndHint(env: { cores?: number; memory?: number; saveData?: boolean; reducedMotion?: boolean }): boolean {
  return !!env.saveData || !!env.reducedMotion || (env.cores ?? 8) <= 4 || (env.memory ?? 8) <= 4;
}

export function captionOf(b: Backdrop, en: boolean): string {
  return `${en ? b.en : b.vi} · ${b.artist}`;
}

/** Màu giấy có độ trong: hex 6 số + 2 số alpha (0–1). */
export function withAlpha(hex: string, a: number): string {
  const v = Math.round(Math.min(1, Math.max(0, a)) * 255);
  return `${hex}${v.toString(16).padStart(2, '0')}`;
}

/* ---------------- Chuyển động nhẹ ---------------- */

export type MotionEnv = { cores?: number; memory?: number; saveData?: boolean; reducedMotion?: boolean };

/** Chuyển động chỉ chạy khi người dùng bật, máy không yếu, không xin giảm chuyển động, tab đang hiện. */
export function motionActive(pref: boolean, env: MotionEnv, tabVisible: boolean): boolean {
  return pref && tabVisible && !lowEndHint(env);
}

export const DRIFT_MAX = 24;
export const DRIFT_SECONDS = 80;

/**
 * Bố cục trôi: ảnh phóng NGUYÊN k lần, to hơn khung ít nhất 2×DRIFT_MAX mỗi chiều; `left/top` là số
 * nguyên px; ảnh trôi chéo ±d px (d nguyên, cùng biên độ hai trục) theo `steps` nấc 1px — mỗi nấc là
 * số nguyên px nên pixel không bao giờ bị lấy mẫu lẻ (không nhoè, không rung).
 */
export function driftLayout(viewW: number, viewH: number, motion: boolean) {
  const margin = motion ? DRIFT_MAX * 2 : 0;
  const { k } = scaledSize(viewW + margin, viewH + margin);
  const w = Math.round(GRID_W * k);
  const h = Math.round(GRID_H * k);
  const left = Math.round((viewW - w) / 2);
  const top = Math.round((viewH - h) / 2);
  const d = motion ? Math.max(0, Math.min(DRIFT_MAX, Math.floor((w - viewW) / 2), Math.floor((h - viewH) / 2))) : 0;
  return { k, w, h, left, top, d, steps: Math.max(1, d * 2) };
}

/** Chấm sao: vị trí px trong ảnh đã phóng + thời lượng/độ trễ rải đều (xác định, không random). */
export function twinkles(stars: readonly [number, number][] | undefined, k: number, cap = 18) {
  return (stars ?? []).slice(0, cap).map(([x, y], i) => ({
    x: x * k,
    y: y * k,
    size: Math.max(2, Math.round(k * 0.75)),
    dur: 2.6 + ((i * 7) % 5) * 0.55,
    delay: -((i * 13) % 11) * 0.37,
  }));
}
