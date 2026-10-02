/** Bộ phận dùng chung của các cảnh: mưa, người đi bộ, cửa sổ nhấp nháy, biển neon, hạt khói, mây. */
import { Gfx, rng } from './gfx';
import { SCENE_H, SCENE_W } from './scene';

/* ---------------------------------------------------------------------------------- mưa */

export class Rain {
  private drops: { x: number; y: number; vy: number; land: number; len: number }[] = [];
  private splashes: { x: number; y: number; t: number }[] = [];
  private r: () => number;
  constructor(
    count: number,
    private groundY: number,
    seed = 11,
    private color = '#9EC5FF',
    private slant = 0.22,
  ) {
    this.r = rng(seed);
    for (let i = 0; i < count; i += 1) this.drops.push(this.spawn(true));
  }
  private spawn(anywhere: boolean) {
    const r = this.r;
    const land = r() < 0.55 ? this.groundY + 2 + r() * (SCENE_H - this.groundY - 4) : 6 + r() * (SCENE_H - 8);
    return { x: r() * (SCENE_W + 40), y: anywhere ? r() * land : -4, vy: 110 + r() * 70, land, len: 2 + Math.floor(r() * 3) };
  }
  update(g: Gfx, dt: number, alpha = 0.55) {
    for (let i = 0; i < this.drops.length; i += 1) {
      const d = this.drops[i]!;
      d.y += d.vy * dt;
      d.x -= d.vy * dt * this.slant;
      if (d.y >= d.land) {
        if (d.land >= this.groundY && this.splashes.length < 80) this.splashes.push({ x: d.x, y: d.land, t: 0 });
        this.drops[i] = this.spawn(false);
        continue;
      }
      for (let k = 0; k < d.len; k += 1) g.px(d.x + k * this.slant, d.y - k, this.color, alpha * (1 - k / (d.len + 1)));
    }
    for (let i = this.splashes.length - 1; i >= 0; i -= 1) {
      const s = this.splashes[i]!;
      s.t += dt;
      if (s.t > 0.4) {
        this.splashes.splice(i, 1);
        continue;
      }
      const a = (1 - s.t / 0.4) * 0.6;
      const rad = 1 + Math.floor(s.t * 8);
      g.px(s.x - rad, s.y, '#CFE3FF', a);
      g.px(s.x + rad, s.y, '#CFE3FF', a);
      if (rad > 1) g.px(s.x, s.y - 1, '#CFE3FF', a * 0.6);
    }
  }
}

/* ------------------------------------------------------------------------ người đi bộ */

export type Walker = { x: number; y: number; dir: 1 | -1; speed: number; color: string; umbrella: boolean; ph: number; skin: string; coat: string };

export function makeWalkers(n: number, y0: number, y1: number, palette: string[], coats: string[], umbrella: boolean, seed = 5): Walker[] {
  const r = rng(seed);
  return Array.from({ length: n }, (_, i) => ({
    x: r() * SCENE_W,
    y: y0 + r() * (y1 - y0),
    dir: (r() < 0.5 ? 1 : -1) as 1 | -1,
    speed: 7 + r() * 8,
    color: palette[i % palette.length]!,
    umbrella,
    ph: r() * 6,
    skin: r() < 0.5 ? '#E8B98F' : '#C98E65',
    coat: coats[Math.floor(r() * coats.length)]!,
  }));
}

export function drawWalker(g: Gfx, w: Walker, t: number) {
  const step = Math.floor((t + w.ph) * 5) % 2;
  const x = Math.round(w.x);
  const y = Math.round(w.y);
  // bóng
  g.rect(x - 2, y, 5, 1, '#000000', 0.25);
  // chân
  g.rect(x - 1, y - 3, 1, 3, '#1c1b2e');
  g.rect(x + 1, y - 3, 1, 3, '#1c1b2e');
  if (step) {
    g.px(x - 1, y, '#1c1b2e');
    g.px(x + 2, y, '#1c1b2e');
  }
  // thân + đầu
  g.rect(x - 1, y - 8, 3, 5, w.coat);
  g.rect(x - 1, y - 11, 3, 3, w.skin);
  g.px(x - 1, y - 11, '#1a1a24');
  g.px(x, y - 11, '#1a1a24');
  g.px(x + 1, y - 11, '#1a1a24');
  if (w.umbrella) {
    g.rect(x - 4, y - 14, 9, 1, w.color);
    g.rect(x - 3, y - 15, 7, 1, w.color);
    g.rect(x - 2, y - 16, 5, 1, w.color);
    g.px(x, y - 13, '#2a2a3a');
    g.px(x, y - 12, '#2a2a3a');
  }
}

export function moveWalkers(list: Walker[], dt: number, x0 = -10, x1 = SCENE_W + 10) {
  for (const w of list) {
    w.x += w.dir * w.speed * dt;
    if (w.dir > 0 && w.x > x1) w.x = x0;
    if (w.dir < 0 && w.x < x0) w.x = x1;
  }
}

/* ------------------------------------------------------------------ cửa sổ nhấp nháy */

export type Win = { x: number; y: number; w: number; h: number; on: boolean; color: string; next: number };

/** Lưới cửa sổ trong một khối nhà; `lit` = tỉ lệ đang sáng. */
export function windowGrid(x: number, y: number, cols: number, rows: number, cw: number, ch: number, gx: number, gy: number, colors: string[], lit: number, seed: number): Win[] {
  const r = rng(seed);
  const out: Win[] = [];
  for (let j = 0; j < rows; j += 1)
    for (let i = 0; i < cols; i += 1) out.push({ x: x + i * (cw + gx), y: y + j * (ch + gy), w: cw, h: ch, on: r() < lit, color: colors[Math.floor(r() * colors.length)]!, next: 2 + r() * 14 });
  return out;
}

export function drawWindows(g: Gfx, list: Win[], t: number, offColor: string | null, offAlpha = 0.9) {
  for (const w of list) {
    if (t > w.next) {
      w.next = t + 3 + Math.abs(Math.sin(w.x * 12.9898 + w.y * 78.233 + t)) * 18;
      if (Math.abs(Math.sin(w.x * 3.1 + w.y * 1.7 + Math.floor(t))) > 0.7) w.on = !w.on;
    }
    if (w.on) g.rect(w.x, w.y, w.w, w.h, w.color);
    else if (offColor) g.rect(w.x, w.y, w.w, w.h, offColor, offAlpha);
  }
}

/* ------------------------------------------------------------------------------ biển neon */

export type Neon = { x: number; y: number; text: string; color: string; vertical?: boolean; scale?: number; flicker?: number; seed?: number; frame?: string };

/** Sáng/tắt kiểu đèn neon hỏng nhẹ: phần lớn thời gian sáng, thỉnh thoảng giật. */
export function neonOn(n: Neon, t: number): number {
  const f = n.flicker ?? 0;
  if (!f) return 1;
  const s = n.seed ?? 1;
  const slow = Math.sin(t * 0.7 + s * 3.3) + Math.sin(t * 1.9 + s);
  const burst = Math.sin(t * 23 + s * 7) > 0.3 && Math.sin(t * 0.37 + s) > 0.82 ? 0 : 1;
  return Math.min(1, Math.max(0.45, 0.85 + slow * 0.05 * f)) * burst;
}

export function drawNeon(g: Gfx, n: Neon, t: number) {
  const k = neonOn(n, t);
  const sc = n.scale ?? 1;
  const [tw, th] = n.vertical ? [4 * sc, n.text.length * 6 * sc] : [g.textW(n.text, sc), 5 * sc];
  if (n.frame) g.rect(n.x - 2, n.y - 2, tw + 4, th + 4, n.frame, 0.9 * (k > 0.5 ? 1 : 0.5));
  if (n.vertical) {
    for (let i = 0; i < n.text.length; i += 1) g.text(n.text[i]!, n.x, n.y + i * 6 * sc, n.color, k, sc);
  } else g.text(n.text, n.x, n.y, n.color, k, sc);
  g.glow(n.x + tw / 2, n.y + th / 2, Math.max(tw, th) * 0.55 + 5, n.color, k * 1.1, n.vertical ? 1 : 0.6);
}

/* ---------------------------------------------------------------------- khói / hơi nước */

export class Steam {
  private p: { x: number; y: number; t: number; life: number; dx: number }[] = [];
  private r: () => number;
  private acc = 0;
  constructor(
    private x: number,
    private y: number,
    seed = 3,
    private color = '#C9D2EE',
    private rate = 0.25,
  ) {
    this.r = rng(seed);
  }
  update(g: Gfx, dt: number) {
    this.acc += dt;
    while (this.acc > this.rate) {
      this.acc -= this.rate;
      this.p.push({ x: this.x + (this.r() - 0.5) * 3, y: this.y, t: 0, life: 2 + this.r() * 1.5, dx: (this.r() - 0.5) * 3 });
    }
    for (let i = this.p.length - 1; i >= 0; i -= 1) {
      const s = this.p[i]!;
      s.t += dt;
      if (s.t > s.life) {
        this.p.splice(i, 1);
        continue;
      }
      const k = s.t / s.life;
      g.px(s.x + s.dx * k * 4 + Math.sin(s.t * 3) * 1.2, s.y - k * 18, this.color, (1 - k) * 0.5);
      if (k < 0.7) g.px(s.x + s.dx * k * 4 + Math.sin(s.t * 3) * 1.2 + 1, s.y - k * 18, this.color, (1 - k) * 0.3);
    }
  }
}

/* ------------------------------------------------------------------------------- mây trôi */

export class Clouds {
  private c: { x: number; y: number; v: number; w: number; blobs: { dx: number; dy: number; r: number }[] }[];
  constructor(
    n: number,
    yMin: number,
    yMax: number,
    private color: string,
    private alpha: number,
    speed = 3,
    seed = 21,
    private lightColor?: string,
  ) {
    const r = rng(seed);
    this.c = Array.from({ length: n }, () => {
      const w = 40 + r() * 50;
      const k = 5 + Math.floor(r() * 3);
      const blobs = Array.from({ length: k }, (_, i) => {
        const mid = 1 - Math.abs(i - (k - 1) / 2) / (k / 2);
        return { dx: (i / (k - 1) - 0.5) * w, dy: -mid * 3 + r() * 2, r: 4 + mid * 6 + r() * 3 };
      });
      return { x: r() * SCENE_W, y: yMin + r() * (yMax - yMin), v: speed * (0.6 + r() * 0.8), w, blobs };
    });
  }
  update(g: Gfx, dt: number) {
    for (const c of this.c) {
      c.x += c.v * dt;
      if (c.x - c.w > SCENE_W) c.x = -c.w;
      // hợp các hình tròn theo từng hàng để mỗi điểm chỉ vẽ một lần (alpha không chồng)
      for (let dy = -14; dy <= 6; dy += 1) {
        const spans: [number, number][] = [];
        for (const b of c.blobs) {
          const yy = dy - b.dy;
          if (Math.abs(yy) > b.r) continue;
          const half = Math.sqrt(b.r * b.r - yy * yy);
          spans.push([c.x + b.dx - half, c.x + b.dx + half]);
        }
        if (!spans.length) continue;
        spans.sort((a, b) => a[0] - b[0]);
        let [s, e] = spans[0]!;
        const flush = () => g.rect(s, c.y + dy, e - s, 1, this.lightColor && dy < -4 ? this.lightColor : this.color, this.alpha);
        for (let i = 1; i < spans.length; i += 1) {
          const sp = spans[i]!;
          if (sp[0] <= e) e = Math.max(e, sp[1]);
          else {
            flush();
            [s, e] = sp;
          }
        }
        flush();
      }
    }
  }
}

/* ----------------------------------------------------------------- phản chiếu mặt nước */

/** Sao chép ngược các hàng phía trên `waterY` xuống mặt nước (tĩnh, gọi sau khi vẽ xong phần trên), phủ màu nước. */
export function reflect(g: Gfx, waterY: number, depth: number, alpha: number, tint: string, tintAlpha: number) {
  const cv = g.ctx.canvas as HTMLCanvasElement;
  g.ctx.globalAlpha = alpha;
  for (let i = 0; i < depth; i += 1) {
    const src = waterY - 1 - Math.floor(i * 0.9);
    if (src < 0) break;
    g.ctx.drawImage(cv, 0, src, g.w, 1, 0, waterY + i, g.w, 1);
  }
  g.rect(0, waterY, g.w, depth, tint, tintAlpha);
  g.ctx.globalAlpha = 1;
}

/** Vệt sóng lăn tăn chạy trên mặt nước (động): các gạch ngang sáng/tối trôi chậm. */
export function shimmer(g: Gfx, t: number, y0: number, y1: number, light: string, dark: string, seed = 2, density = 40) {
  const r = rng(seed);
  for (let i = 0; i < density; i += 1) {
    const y = y0 + r() * (y1 - y0);
    const x = ((r() * g.w + t * (3 + r() * 6) * (r() < 0.5 ? 1 : -1)) % (g.w + 20) + g.w + 20) % (g.w + 20) - 10;
    const w = 3 + Math.floor(r() * 9);
    const a = 0.14 + 0.2 * Math.max(0, Math.sin(t * (0.8 + r()) + r() * 6));
    g.rect(x, y, w, 1, r() < 0.55 ? light : dark, a);
  }
}

/** Đàn chim bay ngang (động). */
export class Birds {
  private b: { x: number; y: number; vx: number; ph: number }[];
  constructor(n: number, y0: number, y1: number, private color = '#1a1230', seed = 31) {
    const r = rng(seed);
    this.b = Array.from({ length: n }, () => ({ x: r() * SCENE_W, y: y0 + r() * (y1 - y0), vx: (r() < 0.5 ? -1 : 1) * (8 + r() * 10), ph: r() * 6 }));
  }
  update(g: Gfx, t: number, dt: number) {
    for (const b of this.b) {
      b.x += b.vx * dt;
      if (b.vx > 0 && b.x > SCENE_W + 6) b.x = -6;
      if (b.vx < 0 && b.x < -6) b.x = SCENE_W + 6;
      const up = Math.floor((t + b.ph) * 6) % 2;
      const y = b.y + Math.sin(t * 0.8 + b.ph) * 2;
      g.px(b.x - 2, y + (up ? 0 : 1), this.color);
      g.px(b.x - 1, y + (up ? 1 : 0), this.color);
      g.px(b.x, y + 1, this.color);
      g.px(b.x + 1, y + (up ? 1 : 0), this.color);
      g.px(b.x + 2, y + (up ? 0 : 1), this.color);
    }
  }
}

/** Pháo hoa: bùng nổ mỗi vài giây tại điểm ngẫu nhiên (động). */
export class Fireworks {
  private bursts: { x: number; y: number; t: number; color: string; n: number }[] = [];
  private next = 1.5;
  private r = rng(91);
  constructor(private colors: string[], private x0: number, private x1: number, private y0: number, private y1: number, private gap = 5) {}
  update(g: Gfx, t: number, dt: number) {
    this.next -= dt;
    if (this.next <= 0) {
      this.next = this.gap * (0.6 + this.r() * 0.9);
      this.bursts.push({ x: this.x0 + this.r() * (this.x1 - this.x0), y: this.y0 + this.r() * (this.y1 - this.y0), t: 0, color: this.colors[Math.floor(this.r() * this.colors.length)]!, n: 18 + Math.floor(this.r() * 8) });
    }
    for (let i = this.bursts.length - 1; i >= 0; i -= 1) {
      const b = this.bursts[i]!;
      b.t += dt;
      if (b.t > 1.8) {
        this.bursts.splice(i, 1);
        continue;
      }
      const rise = Math.min(1, b.t / 0.35);
      if (b.t < 0.35) {
        g.px(b.x, b.y + (1 - rise) * 40, '#FFFFFF', 0.9);
        g.px(b.x, b.y + (1 - rise) * 40 + 1, '#FFE9A8', 0.5);
        continue;
      }
      const k = (b.t - 0.35) / 1.45;
      const rad = 5 + k * 24;
      for (let j = 0; j < b.n; j += 1) {
        const a = (j / b.n) * Math.PI * 2;
        g.px(b.x + Math.cos(a) * rad, b.y + Math.sin(a) * rad + k * k * 14, b.color, (1 - k) * 0.95);
        if (k < 0.6) g.px(b.x + Math.cos(a) * rad * 0.8, b.y + Math.sin(a) * rad * 0.8 + k * k * 12, '#FFFFFF', (1 - k) * 0.5);
      }
      g.glow(b.x, b.y, 22 * (1 - k * 0.5), b.color, (1 - k) * 0.9);
    }
    void t;
  }
}
