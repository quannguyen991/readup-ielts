/**
 * LỚP HOẠT HÌNH BẢN ĐỒ THẾ GIỚI — vẽ HOÀN TOÀN bằng mã, không video, không ảnh động:
 * sóng lấp lánh, mây trôi kèm bóng trên biển, thuyền buồm có vệt nước, cá voi trồi lên phun nước,
 * hải âu vỗ cánh, sao nháy ở các thành phố, chấm sáng chạy dọc đường bay và chiếc máy bay "học tới đâu bay tới đó"
 * có vệt khói. Mọi thứ nằm trên một canvas 418×235 (đúng lưới pixel của ảnh nền), phóng nguyên số nguyên.
 *
 * Engine thuần (chỉ cần ctx.fillRect): chạy được trong Node để kiểm thử, không đụng DOM.
 */
import { WORLD_ART, WORLD_SRC_H, WORLD_SRC_W, routePoint } from '@/services/travel/worldGeometry';
import { positionAt } from '@/services/travel/flightProgress';
import { ROUTES } from '@/services/travel/world';
import type { CityId } from '@/services/travel/types';
import { rng, type SeaMask } from './sea';

export type Ctx = { fillStyle: string | CanvasGradient | CanvasPattern; globalAlpha: number; fillRect(x: number, y: number, w: number, h: number): void };

const W = WORLD_SRC_W;
const H = WORLD_SRC_H;

/* ----------------------------------------------------------------------------- vẽ pixel */

const px = (c: Ctx, x: number, y: number, color: string, a = 1) => {
  c.globalAlpha = a;
  c.fillStyle = color;
  c.fillRect(Math.round(x), Math.round(y), 1, 1);
};

type Sprite = { rows: string[]; pal: Record<string, string> };

function blit(c: Ctx, s: Sprite, x: number, y: number, flip = false, a = 1) {
  c.globalAlpha = a;
  const h = s.rows.length;
  const w = s.rows[0]!.length;
  const ox = Math.round(x - w / 2);
  const oy = Math.round(y - h / 2);
  for (let j = 0; j < h; j += 1) {
    const row = s.rows[j]!;
    for (let i = 0; i < w; i += 1) {
      const ch = row[flip ? w - 1 - i : i]!;
      if (ch === '.') continue;
      c.fillStyle = s.pal[ch]!;
      c.fillRect(ox + i, oy + j, 1, 1);
    }
  }
}

/* ------------------------------------------------------------------------------ hình mẫu */

const SAILBOAT: Sprite = {
  rows: ['....w....', '....ww...', '...www...', '...wwww..', '..wwwww..', '..wwwwww.', '....m....', '.hhhhhhh.', '..hhhhh..'],
  pal: { w: '#F6EBD2', m: '#5A3A1E', h: '#8A5226' },
};
const JUNK: Sprite = {
  rows: ['...r....', '..rr.r..', '.rrrrrr.', '.rrrrrr.', '..rrrr..', '...m....', 'hhhhhhhh', '.hhhhhh.'],
  pal: { r: '#C65A3A', m: '#4A2E18', h: '#6B3E1E' },
};
const GULL: Sprite[] = [
  { rows: ['x...x', '.x.x.', '..x..'], pal: { x: '#FFFFFF' } },
  { rows: ['..x..', '.xxx.', 'x...x'], pal: { x: '#EAF2F7' } },
];

/** Mây: tạo từ vài hình tròn → mặt nạ điểm ảnh (một lần). */
type CloudShape = { w: number; h: number; cells: Uint8Array };
function makeCloud(r: () => number, size: number): CloudShape {
  const w = size * 4 + 6;
  const h = size * 2 + 4;
  const cells = new Uint8Array(w * h);
  const n = 4 + Math.floor(r() * 2);
  const blobs = Array.from({ length: n }, (_, i) => {
    const mid = 1 - Math.abs(i - (n - 1) / 2) / ((n - 1) / 2 + 0.01);
    const rad = size * (0.55 + 0.55 * mid) * (0.85 + r() * 0.3);
    return { cx: 3 + rad + (i * (w - 6 - rad * 2)) / (n - 1), cy: h - 2 - rad * 0.8, rad };
  });
  for (let y = 0; y < h - 1; y += 1)
    for (let x = 0; x < w; x += 1) if (blobs.some((b) => (x - b.cx) ** 2 + (y - b.cy) ** 2 <= b.rad * b.rad)) cells[y * w + x] = 1;
  return { w, h, cells };
}

/* ------------------------------------------------------------------------------- đối tượng */

type Cloud = { x: number; y: number; v: number; shape: CloudShape; alpha: number };
type Ship = { x0: number; y0: number; x1: number; y1: number; u: number; dir: 1 | -1; speed: number; type: Sprite; ph: number; wake: { x: number; y: number; t: number }[]; acc: number };
type Gull = { x: number; y: number; vx: number; ph: number; amp: number; fr: number };
type Whale = { x: number; y: number; t: number; period: number; flip: boolean };
type Glint = { x: number; y: number; ph: number; period: number; kind: 0 | 1 };
type Comet = { a: CityId; b: CityId; t: number; speed: number; wait: number };
type Twinkle = { x: number; y: number; ph: number; period: number };

export type AmbientOptions = {
  seed?: number;
  /** Có vẽ máy bay chuyến bay học tập không. */
  plane?: boolean;
  /** Mức "đông đúc": 1 = chuẩn; 0.5 cho máy yếu. */
  density?: number;
};

export type AmbientWorld = {
  /** Đặt tiến độ chuyến bay P (0..1). `instant` = nhảy ngay, không lướt. */
  setProgress(p: number, instant?: boolean): void;
  /** Tiến độ máy bay đang hiển thị (đã lướt). */
  shown(): number;
  /** Bật/tắt vẽ máy bay (khi máy bay vé đang bay). */
  setPlaneVisible(v: boolean): void;
  /** Máy bay có đang lướt (chưa tới đích) không. */
  gliding(): boolean;
  update(dt: number): void;
  draw(c: Ctx): void;
  /** Một khung tĩnh cho người chọn "giảm chuyển động": không có chuyển động, vẫn đủ tàu/mây/máy bay. */
  drawStill(c: Ctx): void;
  /** Vị trí máy bay trong ảnh nguồn (px), để nền cuộn theo. */
  planeAt(): { x: number; y: number };
};

const SEA_GLINT = ['#8EDCE0', '#CFF3F2'];

export function createAmbientWorld(sea: SeaMask, opts: AmbientOptions = {}): AmbientWorld {
  const r = rng(opts.seed ?? 20261003);
  const dens = opts.density ?? 1;
  const havePlane = opts.plane !== false;

  /* --- điểm biển --- */
  const seaPoint = (cw = 1, ch = 1, tries = 400): { x: number; y: number } | null => {
    for (let i = 0; i < tries; i += 1) {
      const x = 4 + r() * (W - 8);
      const y = 4 + r() * (H - 8);
      if (sea.clear(x - cw / 2, y - ch / 2, cw, ch)) return { x, y };
    }
    return null;
  };

  /* --- sóng lấp lánh --- */
  const glints: Glint[] = [];
  for (let i = 0, n = Math.round(110 * dens); i < n; i += 1) {
    const p = seaPoint(3, 1);
    if (p) glints.push({ x: p.x, y: p.y, ph: r() * 10, period: 1.6 + r() * 2.6, kind: r() < 0.28 ? 1 : 0 });
  }

  /* --- mây --- */
  const clouds: Cloud[] = [];
  for (let i = 0, n = Math.round(8 * dens); i < n; i += 1) {
    clouds.push({ x: r() * W, y: 6 + r() * (H - 36), v: 1.6 + r() * 3.2, shape: makeCloud(r, 2 + Math.floor(r() * 3)), alpha: 0.92 });
  }

  /* --- thuyền: tìm "luồng" toàn nước --- */
  const ships: Ship[] = [];
  const findLane = (): { x0: number; y0: number; x1: number; y1: number } | null => {
    for (let k = 0; k < 600; k += 1) {
      const p = seaPoint(10, 8, 60);
      if (!p) continue;
      if (ships.some((s) => Math.hypot(s.x0 - p.x, s.y0 - p.y) < 85)) continue;
      const ang = r() * Math.PI * 2;
      const len = 48 + r() * 70;
      const dx = Math.cos(ang);
      const dy = Math.sin(ang) * 0.45;
      let ok = true;
      for (let s = 0; s <= len && ok; s += 2) if (!sea.clear(p.x + dx * s - 5, p.y + dy * s - 4, 10, 8)) ok = false;
      if (ok) return { x0: p.x, y0: p.y, x1: p.x + dx * len, y1: p.y + dy * len };
    }
    return null;
  };
  for (let i = 0, n = Math.round(4 * dens); i < n; i += 1) {
    const lane = findLane();
    if (lane) ships.push({ ...lane, u: r(), dir: r() < 0.5 ? 1 : -1, speed: 3 + r() * 2.2, type: i % 3 === 2 ? JUNK : SAILBOAT, ph: r() * 6, wake: [], acc: 0 });
  }

  /* --- cá voi --- */
  const whales: Whale[] = [];
  for (let i = 0, n = Math.round(2 * dens); i < n; i += 1) {
    const p = seaPoint(16, 8);
    if (p) whales.push({ x: p.x, y: p.y, t: -r() * 9, period: 11 + r() * 5, flip: r() < 0.5 });
  }

  /* --- hải âu --- */
  const gulls: Gull[] = [];
  for (let i = 0, n = Math.round(6 * dens); i < n; i += 1) gulls.push({ x: r() * W, y: 15 + r() * (H - 40), vx: (r() < 0.5 ? -1 : 1) * (9 + r() * 7), ph: r() * 6, amp: 2 + r() * 3, fr: r() });

  /* --- chấm sáng chạy dọc đường bay + sao nháy ở thành phố --- */
  const comets: Comet[] = ROUTES.map((rt, i) => ({ a: rt.a, b: rt.b, t: r(), speed: 0.13 + r() * 0.05, wait: i * 0.7 }));
  const twinkles: Twinkle[] = (Object.keys(WORLD_ART) as CityId[]).map((c, i) => ({ x: WORLD_ART[c].x, y: WORLD_ART[c].y, ph: i * 1.7, period: 2.4 + (i % 3) * 0.6 }));

  /* --- máy bay --- */
  let target = 0;
  let shown = 0;
  let glide = false;
  let showPlane = true;
  const trail: { x: number; y: number; a: number }[] = [];
  let trailAcc = 0;
  let t = 0;

  // Máy bay nhìn từ trên (mũi hướng ĐÔNG), cánh xuôi; xoay bằng lấy mẫu ngược nên không thủng lỗ.
  const PLANE = [
    '......ww.............',
    '......www............',
    '.......wwww..........',
    '........wwwww........',
    '.........wwwwww......',
    '..ww......wwwwwww....',
    '..www.wwwwwwwwwwwww..',
    '...wwwwwwwwwwwwwwwwBB',
    '..wwg.ggggggggggggg..',
    '..wgg.....gggggggg...',
    '.........gggggg......',
    '........ggggg........',
    '.......gggg..........',
    '......ggg............',
    '......gg.............',
  ];
  const PW = PLANE[0]!.length;
  const PH = PLANE.length;
  const PCOL: Record<string, string> = { w: '#FFFFFF', g: '#B7C7D6', B: '#3E86D0' };

  const drawPlane = (c: Ctx, x: number, y: number, angleDeg: number, hover: number) => {
    const rad = (angleDeg * Math.PI) / 180;
    const co = Math.cos(rad);
    const si = Math.sin(rad);
    const half = Math.ceil(Math.hypot(PW, PH) / 2) + 1;
    const cx = (PW - 1) / 2;
    const cy = (PH - 1) / 2;
    const cell = (u: number, v: number): string | null => {
      // (u, v) = vị trí đích so với tâm → quay ngược về hình mẫu
      const sx = Math.round(u * co + v * si + cx);
      const sy = Math.round(-u * si + v * co + cy);
      if (sx < 0 || sy < 0 || sx >= PW || sy >= PH) return null;
      const ch = PLANE[sy]![sx]!;
      return ch === '.' ? null : (PCOL[ch] ?? null);
    };
    c.globalAlpha = 0.24;
    c.fillStyle = '#012a3a';
    for (let v = -half; v <= half; v += 1) for (let u = -half; u <= half; u += 1) if (cell(u, v)) c.fillRect(Math.round(x) + u + 7, Math.round(y + hover) + v + 10, 1, 1);
    // viền tối để máy bay không chìm vào đỉnh núi tuyết
    c.globalAlpha = 0.85;
    c.fillStyle = '#17364D';
    for (let v = -half; v <= half; v += 1)
      for (let u = -half; u <= half; u += 1) {
        if (cell(u, v)) continue;
        if (cell(u - 1, v) || cell(u + 1, v) || cell(u, v - 1) || cell(u, v + 1)) c.fillRect(Math.round(x) + u, Math.round(y + hover) + v, 1, 1);
      }
    c.globalAlpha = 1;
    for (let v = -half; v <= half; v += 1)
      for (let u = -half; u <= half; u += 1) {
        const col = cell(u, v);
        if (!col) continue;
        c.fillStyle = col;
        c.fillRect(Math.round(x) + u, Math.round(y + hover) + v, 1, 1);
      }
  };

  const planePos = () => positionAt(shown);

  /* ------------------------------------------------------------------------------ cập nhật */
  const update = (dt: number) => {
    t += dt;
    for (const cl of clouds) {
      cl.x += cl.v * dt;
      if (cl.x - cl.shape.w > W) cl.x = -cl.shape.w - r() * 40;
    }
    for (const s of ships) {
      const len = Math.hypot(s.x1 - s.x0, s.y1 - s.y0) || 1;
      s.u += (s.dir * s.speed * dt) / len;
      if (s.u > 1) {
        s.u = 1;
        s.dir = -1;
      } else if (s.u < 0) {
        s.u = 0;
        s.dir = 1;
      }
      const x = s.x0 + (s.x1 - s.x0) * s.u;
      const y = s.y0 + (s.y1 - s.y0) * s.u;
      s.acc += dt;
      if (s.acc > 0.28) {
        s.acc = 0;
        s.wake.push({ x, y: y + 4, t: 0 });
      }
      for (const w of s.wake) w.t += dt;
      while (s.wake.length && s.wake[0]!.t > 2.4) s.wake.shift();
    }
    for (const w of whales) {
      w.t += dt;
      if (w.t > w.period) {
        const p = seaPoint(16, 8, 120);
        if (p) {
          w.x = p.x;
          w.y = p.y;
          w.flip = r() < 0.5;
        }
        w.t = 0;
      }
    }
    for (const g of gulls) {
      g.x += g.vx * dt;
      g.ph += dt * 1.3;
      g.fr += dt * 5;
      if (g.vx > 0 && g.x > W + 8) g.x = -8;
      if (g.vx < 0 && g.x < -8) g.x = W + 8;
    }
    for (const cm of comets) {
      if (cm.wait > 0) {
        cm.wait -= dt;
        continue;
      }
      cm.t += cm.speed * dt;
      if (cm.t > 1.35) {
        cm.t = -0.2;
        cm.wait = 3 + r() * 6;
      }
    }
    if (havePlane) {
      const diff = target - shown;
      if (Math.abs(diff) > 0.0005) {
        const rate = Math.max(0.04, Math.abs(diff) / 2.4);
        shown += Math.sign(diff) * Math.min(Math.abs(diff), rate * dt);
        glide = true;
        trailAcc += dt;
        if (trailAcc > 0.07) {
          trailAcc = 0;
          const p = planePos();
          trail.push({ x: p.x - Math.cos((p.angle * Math.PI) / 180) * 10, y: p.y - Math.sin((p.angle * Math.PI) / 180) * 10, a: 0.9 });
        }
      } else {
        shown = target;
        glide = false;
      }
      for (const tr of trail) tr.a -= dt * 0.32;
      while (trail.length && trail[0]!.a <= 0) trail.shift();
    }
  };

  /* --------------------------------------------------------------------------------- vẽ */
  const drawGlints = (c: Ctx, animated: boolean) => {
    for (const g of glints) {
      const k = animated ? (Math.sin(((t + g.ph) / g.period) * Math.PI * 2) + 1) / 2 : 0.5;
      if (k < 0.72) continue;
      const a = (k - 0.72) / 0.28;
      const col = SEA_GLINT[g.kind]!;
      px(c, g.x, g.y, col, 0.35 + 0.55 * a);
      px(c, g.x + 1, g.y, col, 0.25 + 0.5 * a);
      if (g.kind === 1) px(c, g.x + 2, g.y, col, 0.2 + 0.4 * a);
    }
  };

  const drawCloudShadow = (c: Ctx, cl: Cloud) => {
    c.globalAlpha = 0.2;
    c.fillStyle = '#001f33';
    for (let y = 0; y < cl.shape.h; y += 1)
      for (let x = 0; x < cl.shape.w; x += 1) {
        if (!cl.shape.cells[y * cl.shape.w + x]) continue;
        const sx = Math.round(cl.x + x + 6);
        const sy = Math.round(cl.y + y + 9);
        if (sea.isSea(sx, sy)) c.fillRect(sx, sy, 1, 1);
      }
  };

  const drawCloud = (c: Ctx, cl: Cloud) => {
    const { w, h, cells } = cl.shape;
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        if (!cells[y * w + x]) continue;
        const below = y + 1 < h && cells[(y + 1) * w + x];
        const above = y > 0 && cells[(y - 1) * w + x];
        c.globalAlpha = cl.alpha;
        c.fillStyle = !below ? '#C3D3E3' : !above ? '#FFFFFF' : '#F4F8FC';
        c.fillRect(Math.round(cl.x + x), Math.round(cl.y + y), 1, 1);
      }
    }
  };

  const drawShip = (c: Ctx, s: Ship, animated: boolean) => {
    for (const wk of s.wake) {
      const a = Math.max(0, 0.55 - wk.t * 0.23);
      px(c, wk.x - s.dir * wk.t * 0.8, wk.y, '#E8F6F8', a);
      px(c, wk.x - s.dir * wk.t * 0.8 - s.dir, wk.y + 1, '#CFF0F2', a * 0.7);
    }
    const x = s.x0 + (s.x1 - s.x0) * s.u;
    const y = s.y0 + (s.y1 - s.y0) * s.u + (animated ? Math.round(Math.sin(t * 1.6 + s.ph) * 0.8) : 0);
    blit(c, s.type, x, y, s.dir < 0);
  };

  const drawWhale = (c: Ctx, w: Whale) => {
    const u = w.t;
    if (u < 0 || u > 4.2) return;
    const dirx = w.flip ? -1 : 1;
    // vòng sóng loang
    if (u < 4) {
      const rad = 3 + u * 3.2;
      const a = Math.max(0, 0.6 - u * 0.15);
      for (let k = 0; k < 18; k += 1) {
        const th = (k / 18) * Math.PI * 2;
        px(c, w.x + Math.cos(th) * rad, w.y + 2 + Math.sin(th) * rad * 0.35, '#D9F3F4', a);
      }
    }
    // lưng nhô lên rồi chìm
    const up = u < 0.6 ? u / 0.6 : u < 2.3 ? 1 : Math.max(0, 1 - (u - 2.3) / 0.7);
    if (up > 0) {
      const rows = Math.max(1, Math.round(up * 3));
      for (let j = 0; j < rows; j += 1) for (let i = -4 + j; i <= 4 - j; i += 1) px(c, w.x + i * dirx, w.y - j + 1, j === 0 ? '#315F73' : '#1B4457');
      px(c, w.x + 3 * dirx, w.y - 1, '#7FB0C2', 0.9);
    }
    // vòi nước
    if (u > 0.7 && u < 1.9) {
      const s = (u - 0.7) / 1.2;
      const hgt = 8 * Math.sin(s * Math.PI);
      for (let j = 1; j <= hgt; j += 1) px(c, w.x + 2 * dirx, w.y - 2 - j, '#FFFFFF', 0.85 - j * 0.04);
      px(c, w.x + 2 * dirx - 2, w.y - 1 - hgt * 0.5, '#E6F6F8', 0.7 * (1 - s));
      px(c, w.x + 2 * dirx + 2, w.y - 1 - hgt * 0.5, '#E6F6F8', 0.7 * (1 - s));
    }
    // đuôi vẫy khi lặn
    if (u > 2.2 && u < 3.1) {
      const s = (u - 2.2) / 0.9;
      const lift = Math.sin(s * Math.PI) * 4;
      const tx = w.x - 5 * dirx;
      for (const o of [-2, -1, 0, 1, 2]) px(c, tx + o, w.y - lift - Math.abs(o) * 0.4, '#1B4457');
      px(c, tx, w.y - lift + 1, '#1B4457');
    }
  };

  const drawGull = (c: Ctx, g: Gull) => {
    const y = g.y + Math.sin(g.ph) * g.amp;
    blit(c, GULL[Math.floor(g.fr) % 2]!, g.x, y, g.vx < 0, 0.95);
  };

  const drawComets = (c: Ctx) => {
    for (const cm of comets) {
      if (cm.wait > 0 || cm.t < 0 || cm.t > 1) continue;
      for (let k = 0; k < 7; k += 1) {
        const tt = cm.t - k * 0.012;
        if (tt < 0) break;
        const p = routePoint(cm.a, cm.b, tt);
        px(c, p.x, p.y, k === 0 ? '#FFF6C8' : '#FFD66B', (1 - k / 7) * 0.9);
      }
    }
  };

  const drawTwinkles = (c: Ctx, animated: boolean) => {
    for (const tw of twinkles) {
      const k = animated ? (Math.sin(((t + tw.ph) / tw.period) * Math.PI * 2) + 1) / 2 : 0.6;
      if (k < 0.55) continue;
      const a = (k - 0.55) / 0.45;
      const col = '#FFF1B8';
      px(c, tw.x, tw.y, col, a);
      if (a > 0.45) {
        px(c, tw.x - 1, tw.y, col, a * 0.8);
        px(c, tw.x + 1, tw.y, col, a * 0.8);
        px(c, tw.x, tw.y - 1, col, a * 0.8);
        px(c, tw.x, tw.y + 1, col, a * 0.8);
      }
      if (a > 0.85) {
        px(c, tw.x - 2, tw.y, col, 0.5);
        px(c, tw.x + 2, tw.y, col, 0.5);
        px(c, tw.x, tw.y - 2, col, 0.5);
        px(c, tw.x, tw.y + 2, col, 0.5);
      }
    }
  };

  const drawAll = (c: Ctx, animated: boolean) => {
    drawGlints(c, animated);
    for (const cl of clouds) drawCloudShadow(c, cl);
    for (const s of ships) drawShip(c, s, animated);
    if (animated) for (const w of whales) drawWhale(c, w);
    drawComets(c);
    drawTwinkles(c, animated);
    for (const g of gulls) drawGull(c, g);
    if (havePlane && showPlane) {
      for (const tr of trail) px(c, tr.x, tr.y, '#FFFFFF', Math.max(0, tr.a) * 0.8);
      const p = planePos();
      drawPlane(c, p.x, p.y, p.angle, animated ? Math.sin(t * 2.2) * 0.6 : 0);
    }
    for (const cl of clouds) drawCloud(c, cl);
    c.globalAlpha = 1;
  };

  return {
    setProgress(p, instant) {
      target = Math.min(1, Math.max(0, p));
      if (instant) {
        shown = target;
        glide = false;
      }
    },
    setPlaneVisible(v) {
      showPlane = v;
    },
    shown: () => shown,
    gliding: () => glide,
    update,
    draw: (c) => drawAll(c, true),
    drawStill: (c) => drawAll(c, false),
    planeAt: () => {
      const p = planePos();
      return { x: p.x, y: p.y };
    },
  };
}
