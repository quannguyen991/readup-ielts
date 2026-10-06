/**
 * KHUNG NHÌN & MÁY QUAY — thuần số học, không DOM.
 *
 * Độ nét (yêu cầu cứng): bộ đệm canvas hiển thị = đúng số điểm ảnh thiết bị
 * (css × devicePixelRatio). Cảnh vẽ vào bộ đệm thấp W×H (1 điểm = 1 pixel art) rồi
 * phóng lên bằng HỆ SỐ NGUYÊN `k` điểm thiết bị / điểm nguồn, không lẻ, không làm mờ.
 * Phần dư (< k điểm) chia đều hai bên. Máy quay luôn nằm trên toạ độ nguyên.
 */
export type View = {
  /** Điểm thiết bị cho mỗi điểm nguồn (nguyên ≥ 1). */
  k: number;
  /** Cỡ bộ đệm cảnh (điểm nguồn). */
  W: number;
  H: number;
  /** Cỡ canvas hiển thị (điểm thiết bị). */
  devW: number;
  devH: number;
  /** Lề căn giữa (điểm thiết bị, nguyên). */
  offX: number;
  offY: number;
  dpr: number;
  /** Số pixel CSS cho mỗi điểm nguồn = k / dpr. */
  cssPerPx: number;
};

/** Số ô muốn thấy theo bề ngang, tuỳ cỡ màn hình (điện thoại thấy ít ô hơn nhưng to hơn). */
export function tilesAcross(cssW: number): number {
  if (cssW < 480) return 10.5;
  if (cssW < 800) return 14;
  if (cssW < 1200) return 18;
  return 22;
}

export function computeView(cssW: number, cssH: number, dpr: number): View {
  const devW = Math.max(1, Math.round(cssW * dpr));
  const devH = Math.max(1, Math.round(cssH * dpr));
  const k = Math.max(1, Math.round(devW / (16 * tilesAcross(cssW))));
  const W = Math.max(16, Math.floor(devW / k));
  const H = Math.max(16, Math.floor(devH / k));
  return {
    k,
    W,
    H,
    devW,
    devH,
    offX: Math.max(0, Math.floor((devW - W * k) / 2)),
    offY: Math.max(0, Math.floor((devH - H * k) / 2)),
    dpr,
    cssPerPx: k / dpr,
  };
}

/** Máy quay bám mục tiêu có làm trơn, kẹp trong bản đồ, vị trí vẽ luôn nguyên. */
export class Camera {
  x = 0;
  y = 0;
  /** Vị trí nguyên dùng để vẽ. */
  ix = 0;
  iy = 0;
  private inited = false;
  /** Cho máy quay trượt ra ngoài mép bản đồ tối đa chừng này (điểm nguồn, theo trục dọc) — để đặt hai nhân vật ở đâu cũng được khi nói chuyện. */
  padY = 0;

  snapTo(tx: number, ty: number, view: View, mapW: number, mapH: number) {
    this.x = this.clampAxis(tx - view.W / 2, view.W, mapW);
    this.y = this.clampAxis(ty - view.H / 2, view.H, mapH, this.padY);
    this.round();
    this.inited = true;
  }

  update(dt: number, tx: number, ty: number, view: View, mapW: number, mapH: number) {
    if (!this.inited) return this.snapTo(tx, ty, view, mapW, mapH);
    const gx = this.clampAxis(tx - view.W / 2, view.W, mapW);
    const gy = this.clampAxis(ty - view.H / 2, view.H, mapH, this.padY);
    const a = 1 - Math.exp(-dt * 7);
    this.x += (gx - this.x) * a;
    this.y += (gy - this.y) * a;
    // Dừng hẳn khi đã sát (tránh rung 1 điểm do làm tròn).
    if (Math.abs(gx - this.x) < 0.25) this.x = gx;
    if (Math.abs(gy - this.y) < 0.25) this.y = gy;
    this.round();
  }

  /** Bản đồ nhỏ hơn khung nhìn thì căn giữa; ngược lại kẹp mép. */
  private clampAxis(v: number, view: number, map: number, pad = 0): number {
    if (map <= view) return (map - view) / 2;
    return Math.max(pad > 0 ? -pad : 0, Math.min(map - view + pad, v));
  }

  private round() {
    this.ix = Math.round(this.x);
    this.iy = Math.round(this.y);
  }
}

/** Toạ độ con trỏ (CSS, tương đối canvas) → điểm nguồn trong thế giới. */
export function pointerToWorld(cssX: number, cssY: number, view: View, camIx: number, camIy: number): { x: number; y: number } {
  const dx = cssX * view.dpr - view.offX;
  const dy = cssY * view.dpr - view.offY;
  return { x: Math.floor(dx / view.k) + camIx, y: Math.floor(dy / view.k) + camIy };
}

/**
 * Toạ độ chạm của trình duyệt (clientX/Y + khung canvas) → điểm nguồn trong thế giới. Chia theo tỉ lệ THỰC của
 * bộ đệm / khung hiển thị (không giả định devW = css × dpr), trừ lề căn giữa, rồi chia hệ số nguyên `k`.
 */
export function clientToWorld(clientX: number, clientY: number, rect: { left: number; top: number; width: number; height: number }, view: View, camIx: number, camIy: number): { x: number; y: number } {
  const sx = rect.width > 0 ? view.devW / rect.width : view.dpr;
  const sy = rect.height > 0 ? view.devH / rect.height : view.dpr;
  const dx = (clientX - rect.left) * sx - view.offX;
  const dy = (clientY - rect.top) * sy - view.offY;
  return { x: Math.floor(dx / view.k) + camIx, y: Math.floor(dy / view.k) + camIy };
}

/**
 * Khung nhìn CHẾ ĐỘ ẢNH: ưu tiên thấy trọn tranh bằng hệ số nguyên lớn nhất vừa khung; nếu như vậy mỗi
 * điểm nguồn nhỏ hơn 2 pixel CSS (điện thoại) thì dùng k nhỏ nhất cho ≥ 2 px CSS/điểm và để máy quay
 * đi theo người chơi — không bao giờ thu nhỏ lẻ.
 */
export function computeImageView(cssW: number, cssH: number, dpr: number, imgW: number, imgH: number): View {
  const devW = Math.max(1, Math.round(cssW * dpr));
  const devH = Math.max(1, Math.round(cssH * dpr));
  const fit = Math.floor(Math.min(devW / imgW, devH / imgH));
  const minK = Math.ceil(2 * dpr - 1e-6);
  const k = Math.max(1, fit >= minK ? fit : minK);
  const W = Math.max(16, Math.floor(devW / k));
  const H = Math.max(16, Math.floor(devH / k));
  return {
    k,
    W,
    H,
    devW,
    devH,
    offX: Math.max(0, Math.floor((devW - W * k) / 2)),
    offY: Math.max(0, Math.floor((devH - H * k) / 2)),
    dpr,
    cssPerPx: k / dpr,
  };
}

/** Khung nhìn với hệ số phóng `k` do người dùng chọn (nguyên, ≥ 1) — dùng cho nút +/− phóng to. */
export function viewForK(cssW: number, cssH: number, dpr: number, k: number): View {
  const devW = Math.max(1, Math.round(cssW * dpr));
  const devH = Math.max(1, Math.round(cssH * dpr));
  const kk = Math.max(1, Math.round(k));
  const W = Math.max(16, Math.floor(devW / kk));
  const H = Math.max(16, Math.floor(devH / kk));
  return {
    k: kk,
    W,
    H,
    devW,
    devH,
    offX: Math.max(0, Math.floor((devW - W * kk) / 2)),
    offY: Math.max(0, Math.floor((devH - H * kk) / 2)),
    dpr,
    cssPerPx: kk / dpr,
  };
}

/** Mức phóng được phép quanh hệ số gốc `base`: từ thu nhỏ tới k=1 đến phóng thêm 3 bậc. */
export function zoomBounds(base: number): { min: number; max: number } {
  return { min: 1 - Math.max(1, base), max: 3 };
}
