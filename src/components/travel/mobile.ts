/**
 * LOGIC THUẦN cho Du ngoạn trên điện thoại (không DOM, không React): giới hạn DPR, phân loại bố cục theo cỡ khung,
 * cỡ ngăn kéo dạng "bottom sheet", nhận biết "đang rảnh" để hạ tốc độ vẽ, và chuyển cần điều khiển ảo thành hướng đi.
 */

/** Trần devicePixelRatio cho canvas: màn 3× vẫn vẽ ở 2× (nhẹ hơn ~55% điểm ảnh) mà pixel-art không thấy khác. */
export const DPR_CAP = 2;

export function capDpr(dpr: number, cap: number = DPR_CAP): number {
  if (!Number.isFinite(dpr) || dpr < 1) return 1;
  return Math.min(dpr, cap);
}

// ---------------------------------------------------------------------------------------------- bố cục

export const TOUCH_MIN = 44;

export type ViewportKind = {
  /** Màn nhỏ (điện thoại dọc hoặc ngang): HUD gọn, nút xếp cột ở mép phải. */
  compact: boolean;
  /** Điện thoại ngang (thấp). */
  landscape: boolean;
  /** Ngăn kéo dạng tờ trượt từ đáy (chỉ điện thoại dọc); ngang/máy tính dùng ngăn cạnh phải. */
  sheet: boolean;
};

export function viewportKind(width: number, height: number): ViewportKind {
  const landscape = height < 500 && width > height;
  const compact = width < 700 || landscape;
  return { compact, landscape, sheet: width < 600 && !landscape };
}

/** Số nút tối đa mỗi cột ở mép phải để không tràn chiều cao (cột thừa chuyển sang cột bên cạnh). */
export function buttonsPerColumn(availHeight: number, size = TOUCH_MIN, gap = 8): number {
  return Math.max(1, Math.floor((availHeight + gap) / (size + gap)));
}

/** Chiều cao tối đa của tờ trượt: ~80% khung nhìn nhưng chừa lề trên (đầu trang/tai thỏ) và không dưới 240. */
export function sheetMaxHeight(viewH: number, safeTop = 0, minGap = 16): number {
  const byRatio = Math.round(viewH * 0.8);
  const byRoom = Math.round(viewH - safeTop - minGap);
  return Math.max(Math.min(240, viewH), Math.min(byRatio, byRoom));
}

/** Vuốt xuống đủ xa hoặc đủ nhanh thì đóng tờ trượt. `dy` px, `vy` px/ms. */
export function shouldDismissSheet(dy: number, vy: number, sheetH: number): boolean {
  return dy > Math.min(120, sheetH * 0.3) || (dy > 24 && vy > 0.6);
}

// ---------------------------------------------------------------------------------------------- nhịp vẽ

export const IDLE_AFTER_MS = 5000;
/** Khoảng cách giữa hai khung khi rảnh: 20 khung/giây (vẫn thấy nước/người đi lại mượt vừa đủ); giảm chuyển động: 4 khung/giây. */
export const IDLE_INTERVAL_MS = 50;
export const IDLE_CALM_INTERVAL_MS = 250;

export type FrameGate = {
  hidden: boolean;
  offscreen: boolean;
  now: number;
  lastActiveAt: number;
  /** Có thứ đang chuyển động do người chơi (đi, giữ phím, chuyển cảnh). */
  busy: boolean;
  reducedMotion: boolean;
  /** Khoảng tối thiểu do bộ tự hạ tải (máy yếu) yêu cầu. */
  adaptiveInterval: number;
};

export function isIdle(now: number, lastActiveAt: number, busy: boolean, afterMs: number = IDLE_AFTER_MS): boolean {
  return !busy && now - lastActiveAt >= afterMs;
}

/** Số ms tối thiểu giữa hai khung; `Infinity` = tạm dừng hẳn (tab ẩn / ngoài màn hình). */
export function frameInterval(g: FrameGate): number {
  if (g.hidden || g.offscreen) return Infinity;
  let min = g.adaptiveInterval;
  if (isIdle(g.now, g.lastActiveAt, g.busy)) min = Math.max(min, g.reducedMotion ? IDLE_CALM_INTERVAL_MS : IDLE_INTERVAL_MS);
  return min;
}

// ---------------------------------------------------------------------------------------------- cần điều khiển ảo

export type StickDir = 'up' | 'down' | 'left' | 'right';

/** Vùng chết (tỉ lệ bán kính) và ngưỡng bật hướng phụ khi đi chéo. */
export const STICK_DEAD = 0.28;
export const STICK_DIAG = 0.38;

/**
 * Vector lệch (đơn vị: tỉ lệ bán kính, −1..1) → tập hướng đang bật. Trục chính luôn bật khi vượt vùng chết;
 * trục phụ chỉ bật khi đủ lớn (đi chéo). Ghi vào `out` để không cấp phát mỗi lần chạm.
 */
export function stickToDirs(nx: number, ny: number, out: StickDir[] = []): StickDir[] {
  out.length = 0;
  const ax = Math.abs(nx);
  const ay = Math.abs(ny);
  const len = Math.hypot(nx, ny);
  if (len < STICK_DEAD) return out;
  const major = ax >= ay ? 'x' : 'y';
  const on = (a: number, isMajor: boolean) => (isMajor ? a >= STICK_DEAD * 0.6 : a >= STICK_DIAG);
  if (on(ax, major === 'x')) out.push(nx > 0 ? 'right' : 'left');
  if (on(ay, major === 'y')) out.push(ny > 0 ? 'down' : 'up');
  return out;
}

/** Kẹp vector lệch của ngón tay vào bán kính cần: trả về toạ độ chuẩn hoá (−1..1). */
export function normaliseStick(dx: number, dy: number, radius: number): { x: number; y: number } {
  if (radius <= 0) return { x: 0, y: 0 };
  const len = Math.hypot(dx, dy);
  const k = len > radius ? radius / len : 1;
  return { x: (dx * k) / radius, y: (dy * k) / radius };
}
