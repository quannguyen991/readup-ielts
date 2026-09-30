/**
 * BỘ VẼ CẢNH PIXEL của "Chuyến tàu chậm" — vẽ ở độ phân giải thấp (W×H điểm),
 * trình duyệt phóng to bằng `image-rendering: pixelated` để ra nét pixel-art.
 *
 * Mọi thứ sinh bằng code từ công thức ga (`stations.ts`) + hạt giống cố định:
 * trời chuyển màu có hoà sắc (dither), núi, phố, công trình biểu tượng, mặt
 * nước phản chiếu, cây cối, cột điện, đoàn tàu. Không dùng ảnh ngoài.
 *
 * Chia hai phần để nhẹ:
 *  - Nền TĨNH (trời → phố → mặt nước) vẽ một lần mỗi khi đổi ga / buổi / thời tiết.
 *  - Lớp ĐỘNG vẽ mỗi khung: mây trôi, nước lấp lánh, dải cây gần + cột điện +
 *    đường ray trôi theo tốc độ tàu (thị sai), đoàn tàu nhún nhẹ, mưa / tuyết.
 */
import type { LandmarkKind, Station, Vegetation } from './stations';
import type { TimeOfDay } from './stations';

export type Weather = 'clear' | 'rain' | 'snow';

export const W = 384;
export const H = 176;
/** Chân phố / mép nước. */
const BASE = 116;
/** Mặt ray. */
const RAIL = 152;

// ------------------------------------------------------------------ màu

type RGB = [number, number, number];
const cache = new Map<string, RGB>();
function rgb(hex: string): RGB {
  let c = cache.get(hex);
  if (!c) {
    const h = hex.replace('#', '');
    c = [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    cache.set(hex, c);
  }
  return c;
}
const hx = (c: RGB) => '#' + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
export function mix(a: string, b: string, t: number): string {
  const x = rgb(a);
  const y = rgb(b);
  return hx([x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t]);
}

type Mood = { sky: string[]; ambient: string; amb: number; horizon: string; lit: number; glow: string };

function mood(time: TimeOfDay, weather: Weather): Mood {
  const base: Record<TimeOfDay, Mood> = {
    day: { sky: ['#3F86D4', '#6DAAE4', '#9CCBEF', '#CDE7F6', '#E8F4FA'], ambient: '#FFFFFF', amb: 0, horizon: '#D8EDF7', lit: 0, glow: '#FFF6D0' },
    sunset: { sky: ['#2E2759', '#6B3F80', '#B85A88', '#EC8A86', '#F9B77E', '#FCD89C'], ambient: '#B8577A', amb: 0.33, horizon: '#F6B488', lit: 0.3, glow: '#FFD08A' },
    night: { sky: ['#050821', '#0B1236', '#16204C', '#243264', '#34467A'], ambient: '#0A1234', amb: 0.6, horizon: '#2E3E72', lit: 0.55, glow: '#FFD27A' },
  };
  const m = { ...base[time], sky: [...base[time].sky] };
  if (weather === 'rain') {
    m.sky = m.sky.map((c) => mix(c, time === 'night' ? '#1B2130' : '#7C8594', 0.5));
    m.horizon = mix(m.horizon, '#8A93A0', 0.5);
    m.ambient = mix(m.ambient, '#5A6272', 0.6);
    m.amb = Math.min(0.7, m.amb + 0.18);
    m.lit = Math.min(0.7, m.lit + 0.15);
  } else if (weather === 'snow') {
    m.sky = m.sky.map((c) => mix(c, time === 'night' ? '#2A3350' : '#C9D2DE', 0.45));
    m.horizon = mix(m.horizon, '#DCE3EC', 0.45);
    m.ambient = mix(m.ambient, '#B8C4D6', 0.5);
    m.amb = Math.min(0.66, m.amb + 0.12);
  }
  return m;
}

/** Đổ bóng theo buổi + sương xa (càng xa càng hoà vào màu chân trời). */
function shade(m: Mood, c: string, haze = 0): string {
  const lit = m.amb > 0 ? mix(c, m.ambient, m.amb) : c;
  return haze > 0 ? mix(lit, m.horizon, haze) : lit;
}

// ------------------------------------------------------------------ ngẫu nhiên có hạt giống

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

// ------------------------------------------------------------------ bút vẽ pixel

type Ctx = CanvasRenderingContext2D;
function R(g: Ctx, x: number, y: number, w: number, h: number, c: string) {
  g.fillStyle = c;
  g.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
}
/** Tam giác cân đáy nằm ngang (mái, tháp nhọn). */
function tri(g: Ctx, cx: number, top: number, bottom: number, half: number, c: string) {
  const h = bottom - top;
  for (let y = 0; y <= h; y++) {
    const w = Math.round((half * y) / Math.max(1, h));
    R(g, cx - w, top + y, w * 2 + 1, 1, c);
  }
}
/** Nửa elip trên (vòm). */
function dome(g: Ctx, cx: number, base: number, rx: number, ry: number, c: string) {
  for (let y = 0; y < ry; y++) {
    const w = Math.round(rx * Math.sqrt(1 - ((ry - y) / ry) ** 2));
    R(g, cx - w, base - ry + y, w * 2 + 1, 1, c);
  }
}
function disc(g: Ctx, cx: number, cy: number, r: number, c: string) {
  for (let y = -r; y <= r; y++) {
    const w = Math.round(Math.sqrt(r * r - y * y));
    R(g, cx - w, cy + y, w * 2 + 1, 1, c);
  }
}

// ------------------------------------------------------------------ trời

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);

function sky(g: Ctx, m: Mood, bottom: number) {
  const img = g.createImageData(W, bottom);
  // Nội suy các điểm màu thành 24 bậc mịn, rồi hoà sắc giữa hai bậc kề nhau.
  const base = m.sky.map(rgb);
  const STEPS = 24;
  const stops: RGB[] = Array.from({ length: STEPS + 1 }, (_, k) => {
    const u = (k / STEPS) * (base.length - 1);
    const i = Math.min(base.length - 2, Math.floor(u));
    const f = u - i;
    const a = base[i]!;
    const b = base[i + 1]!;
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
  });
  const n = stops.length - 1;
  for (let y = 0; y < bottom; y++) {
    const t = (y / bottom) * n;
    const i = Math.min(n - 1, Math.floor(t));
    const f = t - i;
    for (let x = 0; x < W; x++) {
      // Hoà sắc theo ma trận Bayer: dải màu có "hạt" như pixel-art vẽ tay.
      const q = f > BAYER[(y & 3) * 4 + (x & 3)]! ? stops[i + 1]! : stops[i]!;
      const o = (y * W + x) * 4;
      img.data[o] = q[0];
      img.data[o + 1] = q[1];
      img.data[o + 2] = q[2];
      img.data[o + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
}

function celestial(g: Ctx, m: Mood, time: TimeOfDay, weather: Weather, r: () => number) {
  if (weather !== 'clear' && time !== 'night') return;
  if (time === 'night') {
    for (let i = 0; i < 90; i++) {
      const x = Math.floor(r() * W);
      const y = Math.floor(r() * (BASE - 30));
      R(g, x, y, 1, 1, r() > 0.8 ? '#FFFFFF' : '#AFC0EA');
    }
    if (weather === 'clear') {
      disc(g, W * 0.82, 26, 9, '#F4EFD6');
      disc(g, W * 0.82 + 4, 23, 8, mix(m.sky[0]!, m.sky[1]!, 0.5));
    }
  } else if (time === 'sunset') {
    const cx = W * 0.62;
    const cy = BASE - 34;
    for (let k = 3; k >= 1; k--) disc(g, cx, cy, 14 + k * 6, mix(m.sky[4]!, '#FFE2A8', 0.22 * (4 - k)));
    disc(g, cx, cy, 13, '#FFD27E');
    disc(g, cx, cy, 10, '#FFE7A8');
  } else {
    disc(g, W * 0.85, 22, 8, '#FFF4C4');
    disc(g, W * 0.85, 22, 6, '#FFFBE6');
  }
}

/** Mây pixel: vài elip chồng nhau, mặt dưới tối hơn. */
function cloudSprite(m: Mood, time: TimeOfDay, seed: number): HTMLCanvasElement {
  const r = rng(seed);
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 18;
  const g = c.getContext('2d')!;
  const top = time === 'sunset' ? '#F6C2B8' : time === 'night' ? '#2F3C66' : '#FFFFFF';
  const bottom = time === 'sunset' ? '#B8708F' : time === 'night' ? '#222C52' : '#D5E3F0';
  const blobs = 4 + Math.floor(r() * 3);
  for (let i = 0; i < blobs; i++) {
    const cx = 10 + r() * 44;
    const ry = 3 + r() * 5;
    const rx = 6 + r() * 9;
    for (let y = -ry; y <= ry; y++) {
      const w = Math.round(rx * Math.sqrt(1 - (y / ry) ** 2));
      g.fillStyle = y > ry * 0.25 ? mix(bottom, m.sky[m.sky.length - 2]!, 0.15) : top;
      g.fillRect(Math.round(cx - w), Math.round(12 + y), w * 2, 1);
    }
  }
  return c;
}

// ------------------------------------------------------------------ núi

function ridge(r: () => number, amp: number, rough: number): number[] {
  const out: number[] = [];
  let v = r() * amp;
  let d = 0;
  for (let x = 0; x < W; x++) {
    d += (r() - 0.5) * rough;
    d *= 0.92;
    v = Math.max(0, Math.min(amp, v + d));
    out.push(v);
  }
  return out;
}

function mountains(g: Ctx, st: Station, m: Mood, weather: Weather, r: () => number) {
  const kind = st.mountains;
  if (!kind) return;
  const far = shade(m, '#6B7FA8', 0.5);
  const near = shade(m, '#51658C', 0.3);
  if (kind === 'fuji') {
    const cx = W * 0.55;
    const peak = BASE - 74;
    const body = shade(m, '#4E5E96', 0.22);
    const lit = shade(m, '#6A7AB2', 0.2);
    const snow = shade(m, '#FFFFFF', 0.08);
    for (let y = peak; y < BASE; y++) {
      const t = (y - peak) / (BASE - peak);
      const half = Math.round(7 + t * t * 118 + t * 22);
      // Sườn trái sáng, sườn phải tối; tuyết phủ chóp với mép răng cưa.
      const snowLine = 0.3 + (Math.sin(y * 1.7) > 0.3 ? 0.03 : 0);
      if (t < snowLine) {
        R(g, cx - half, y, half * 2, 1, snow);
        R(g, cx + half * 0.35, y, half * 0.65, 1, shade(m, '#D8DEEE', 0.1));
      } else {
        R(g, cx - half, y, half, 1, lit);
        R(g, cx, y, half, 1, body);
        // Vệt tuyết chảy xuống sườn.
        for (let k = -3; k <= 3; k++) if (t < snowLine + 0.1 + ((k * 7) % 5) * 0.02 && Math.abs(k) * 5 < half) R(g, cx + k * half * 0.28, y, 2, 1, snow);
      }
    }
    const back = ridge(r, 18, 1.2);
    back.forEach((v, x) => R(g, x, BASE - v - 2, 1, v + 2, near));
    return;
  }
  if (kind === 'karst') {
    // Núi đá vôi: khối đá dựng đứng, sườn lởm chởm, vách có khe nứt dọc, đỉnh phủ cây.
    for (const [layer, count, hmin, hmax] of [
      [0, 10, 24, 44],
      [1, 7, 34, 66],
    ] as const) {
      const rock = shade(m, layer ? '#6F7F76' : '#8C9CA4', layer ? 0.18 : 0.48);
      const rockDark = shade(m, layer ? '#4F5E58' : '#74848E', layer ? 0.18 : 0.48);
      const moss = shade(m, layer ? '#3F6B45' : '#6C8F86', layer ? 0.15 : 0.45);
      for (let i = 0; i < count; i++) {
        const cx = ((i + 0.2 + r() * 0.6) / count) * W;
        const h = hmin + r() * (hmax - hmin);
        const rx = 7 + r() * (layer ? 13 : 9);
        const lean = (r() - 0.5) * 0.3;
        let jag = 0;
        for (let y = 0; y < h; y++) {
          const t = y / h;
          jag += (r() - 0.5) * 1.6;
          jag *= 0.8;
          const w = Math.max(2, rx * (t < 0.18 ? 0.35 + (t / 0.18) * 0.55 : 0.9 + t * 0.12) + jag);
          const x0 = cx - w + lean * (h - y);
          R(g, x0, BASE - h + y, w * 2, 1, rock);
          R(g, x0 + w * 1.25, BASE - h + y, w * 0.75, 1, rockDark);
          if (t < 0.22 || (r() < 0.25 && t < 0.7)) R(g, x0 + r() * w, BASE - h + y, 2 + r() * w * 0.6, 1, moss);
        }
        for (let k = 0; k < 3; k++) {
          const x = cx - rx * 0.5 + r() * rx;
          const y0 = BASE - h * (0.2 + r() * 0.4);
          R(g, x, y0, 1, h * 0.25, rockDark);
        }
      }
    }
    return;
  }
  const amp = kind === 'snowy' ? 62 : kind === 'range' ? 44 : kind === 'dunes' ? 18 : kind === 'terraces' ? 50 : 26;
  const rough = kind === 'snowy' ? 3.4 : kind === 'range' ? 2.2 : kind === 'dunes' ? 0.35 : 1.1;
  const layers: [number, string, number][] =
    kind === 'dunes'
      ? [
          [amp, shade(m, '#E0B878', 0.35), 0],
          [amp * 0.6, shade(m, '#C99A5A', 0.15), 0],
        ]
      : [
          [amp, far, 0],
          [amp * 0.7, near, 1],
        ];
  for (const [a, col, li] of layers) {
    const line = ridge(r, a, rough);
    line.forEach((v, x) => {
      R(g, x, BASE - v, 1, v, col);
      if (kind === 'snowy' && li === 0 && v > a * 0.62) R(g, x, BASE - v, 1, Math.max(1, (v - a * 0.62) * 0.8), shade(m, '#EEF2F8', 0.25));
      if (kind === 'terraces' && li === 1) for (let y = BASE - v + 3; y < BASE; y += 3) R(g, x, y, 1, 1, shade(m, (x >> 3) % 2 ? '#8DB255' : '#6E9A43', 0.15));
      if (weather === 'snow' && v > 2) R(g, x, BASE - v, 1, 2, shade(m, '#F4F7FB', 0.2));
    });
  }
}

// ------------------------------------------------------------------ phố

type Pal = { walls: string[]; roof: string[]; glass: string };
const PALETTES: Record<string, Pal> = {
  modern: { walls: ['#8FA3B8', '#6E86A0', '#A9B7C6', '#5C7390', '#B7A48E', '#7C8FA8', '#4E6485'], roof: ['#3E4D63'], glass: '#BFD7EA' },
  european: { walls: ['#E9D8B8', '#D9B99B', '#F1E3C8', '#C9A98A', '#E4C7A5', '#D7C3A4'], roof: ['#5F6B7A', '#8A4B3A', '#4E5B6B'], glass: '#9FB4C8' },
  asian: { walls: ['#D8CDBB', '#C9BBA4', '#E4DACA', '#BCAE98'], roof: ['#3A4252', '#2F3645', '#4A3A36'], glass: '#A6B8C6' },
  vn: { walls: ['#F2D27A', '#E8B86B', '#F0E0B0', '#E9A7A0', '#A8CFA0', '#F4C98A', '#DCC7A0'], roof: ['#A0503A', '#8E4632', '#6E4A3A'], glass: '#8FA9B8' },
  old: { walls: ['#E6D6B8', '#D8C39C', '#EDE3CF', '#CDB590'], roof: ['#B0674A', '#9A5A40'], glass: '#8C9AA8' },
  nordic: { walls: ['#C0473A', '#E0A23A', '#E8D9B8', '#3F6E8C', '#A64234'], roof: ['#3A3F48', '#2E343C'], glass: '#9FB4C8' },
  desert: { walls: ['#E6CFA2', '#D8BC88'], roof: ['#C4A06A'], glass: '#9AA4AE' },
  tropical: { walls: ['#EFE6D2', '#F2D8B0'], roof: ['#B0674A'], glass: '#9FB4C8' },
};

function windows(g: Ctx, m: Mood, x: number, y: number, w: number, h: number, r: () => number, glass: string, cell = 3) {
  for (let yy = y + 2; yy < y + h - 2; yy += cell) {
    for (let xx = x + 1; xx < x + w - 1; xx += cell - 1 + (cell > 3 ? 1 : 0)) {
      const on = r() < m.lit;
      R(g, xx, yy, 1, 1, on ? (r() < 0.8 ? '#FFD27A' : '#FFF2C8') : shade(m, glass, 0.05));
    }
  }
}

function skyline(g: Ctx, st: Station, m: Mood, weather: Weather, r: () => number, layer: 0 | 1) {
  const sk = st.skyline;
  if (!sk) return;
  const pal = PALETTES[sk.style] ?? PALETTES.modern!;
  const haze = layer === 0 ? 0.38 : 0.1;
  const scale = layer === 0 ? 1 : 0.62;
  let x = -4;
  while (x < W) {
    const gap = r() > sk.density ? 4 + r() * 14 : 0;
    x += gap;
    const w = sk.style === 'modern' ? 8 + r() * 14 : sk.style === 'vn' ? 5 + r() * 6 : 7 + r() * 10;
    const hh = (sk.min + r() ** 1.6 * (sk.max - sk.min)) * scale;
    const top = BASE - hh;
    const wall = shade(m, pal.walls[Math.floor(r() * pal.walls.length)]!, haze);
    const roof = shade(m, pal.roof[Math.floor(r() * pal.roof.length)]!, haze);
    R(g, x, top, w, hh, wall);
    // Mặt tối bên phải: khối có chiều sâu.
    R(g, x + w - 2, top, 2, hh, shade(m, mix(pal.walls[0]!, '#000000', 0.25), haze));
    if (sk.style === 'modern') {
      if (r() < 0.35) R(g, x + w / 2, top - 5, 1, 5, roof);
      if (r() < 0.3) R(g, x + 2, top - 3, w - 4, 3, wall);
      windows(g, m, x, top, w - 2, hh, r, pal.glass, 3);
    } else if (sk.style === 'european' || sk.style === 'nordic') {
      if (r() < 0.6) tri(g, x + w / 2, top - (sk.style === 'nordic' ? 7 : 4), top, w / 2 + 1, roof);
      else R(g, x - 1, top - 2, w + 2, 2, roof);
      if (r() < 0.4) R(g, x + 2, top - 6, 2, 4, roof);
      windows(g, m, x, top, w - 2, hh, r, pal.glass, 4);
    } else if (sk.style === 'asian') {
      // Mái cong: vành mái rộng, hai đầu hất lên.
      R(g, x - 2, top - 2, w + 4, 2, roof);
      R(g, x - 3, top - 3, 1, 1, roof);
      R(g, x + w + 2, top - 3, 1, 1, roof);
      tri(g, x + w / 2, top - 5, top - 2, w / 2, roof);
      windows(g, m, x, top, w - 2, hh, r, pal.glass, 4);
    } else if (sk.style === 'vn') {
      // Nhà ống: hẹp, cao, ban công, mái ngói đỏ hoặc sân thượng.
      if (r() < 0.55) tri(g, x + w / 2, top - 3, top, w / 2 + 1, roof);
      for (let yy = top + 5; yy < BASE - 2; yy += 6) R(g, x, yy, w, 1, shade(m, '#FFFFFF', haze + 0.3));
      windows(g, m, x, top, w - 1, hh, r, pal.glass, 3);
      if (weather !== 'snow' && r() < 0.3) R(g, x + 1, top - 2, 2, 2, shade(m, '#4E8A3E', haze));
    } else {
      R(g, x - 1, top - 1, w + 2, 1, roof);
      windows(g, m, x, top, w - 2, hh, r, pal.glass, 4);
    }
    if (weather === 'snow') R(g, x - 1, top - 1, w + 2, 1, shade(m, '#F4F7FB', 0.1));
    x += w + (sk.style === 'vn' ? 0 : 1);
  }
}

// ------------------------------------------------------------------ công trình biểu tượng

function landmark(g: Ctx, kind: LandmarkKind, cx: number, s: number, m: Mood, t: TimeOfDay) {
  const b = BASE;
  const dark = shade(m, '#4A5568', 0.08);
  const mid = shade(m, '#8A95A8', 0.08);
  const light = shade(m, '#C9D1DC', 0.05);
  const warm = t === 'day' ? shade(m, '#E7E0CF') : '#FFD27A';
  const red = shade(m, '#C0392B', 0.05);
  const S = (v: number) => Math.round(v * s);
  switch (kind) {
    case 'needle': {
      // Tháp truyền hình: thân thon, hai đài quan sát, cần ăng-ten.
      const h = S(92);
      for (let y = 0; y < h; y++) {
        const w = Math.max(1, Math.round((y / h) * S(5)));
        R(g, cx - w, b - h + y, w * 2 + 1, 1, y % 6 === 0 ? mid : light);
      }
      R(g, cx - S(5), b - S(52), S(10) + 1, S(4), mid);
      R(g, cx - S(3), b - S(70), S(6) + 1, S(3), mid);
      R(g, cx, b - h - S(14), 1, S(14), dark);
      if (t !== 'day') {
        R(g, cx - S(5), b - S(50), S(10) + 1, 1, '#9CD6FF');
        R(g, cx, b - h - S(14), 1, 1, '#FF5A5A');
      }
      break;
    }
    case 'eiffel': {
      const h = S(80);
      for (let y = 0; y < h; y++) {
        const k = y / h;
        const w = Math.round(S(2) + k * k * S(22));
        const col = t === 'night' ? mix('#8C6A3A', '#FFC766', 0.6) : shade(m, '#7A5C3E');
        R(g, cx - w, b - h + y, 2, 1, col);
        R(g, cx + w - 1, b - h + y, 2, 1, col);
        if (y % 5 === 0) R(g, cx - w, b - h + y, w * 2, 1, col);
      }
      R(g, cx - S(14), b - S(24), S(28), 2, shade(m, '#6A4E34'));
      R(g, cx - S(8), b - S(48), S(16), 2, shade(m, '#6A4E34'));
      R(g, cx, b - h - S(6), 1, S(6), shade(m, '#6A4E34'));
      break;
    }
    case 'pagoda': {
      const tiers = 5;
      let y = b;
      for (let i = 0; i < tiers; i++) {
        const w = S(16 - i * 2.2);
        const hh = S(8);
        R(g, cx - w / 2, y - hh, w, hh, shade(m, '#8A3A2E', 0.05));
        R(g, cx - w / 2 - S(4), y - hh - 1, w + S(8), 2, dark);
        R(g, cx - w / 2 - S(5), y - hh - 2, 1, 1, dark);
        R(g, cx + w / 2 + S(4), y - hh - 2, 1, 1, dark);
        if (t !== 'day') R(g, cx - 1, y - hh + 3, 2, 2, warm);
        y -= hh + 1;
      }
      R(g, cx, y - S(10), 1, S(10), dark);
      break;
    }
    case 'pearl': {
      const h = S(96);
      R(g, cx - 1, b - h, 3, h, light);
      R(g, cx - S(8), b - S(34), 2, S(34), light);
      R(g, cx + S(7), b - S(34), 2, S(34), light);
      disc(g, cx + 1, b - S(34), S(9), t === 'day' ? shade(m, '#D9468F') : '#FF4FA8');
      disc(g, cx + 1, b - S(70), S(6), t === 'day' ? shade(m, '#D9468F') : '#FF4FA8');
      disc(g, cx + 1, b - S(86), S(3), shade(m, '#D9468F'));
      R(g, cx, b - h - S(12), 1, S(12), mid);
      break;
    }
    case 'spire':
    case 'tallspire': {
      const tall = kind === 'tallspire';
      const h = S(tall ? 100 : 70);
      const w0 = S(tall ? 14 : 10);
      for (let y = 0; y < h; y++) {
        const k = y / h;
        const w = Math.max(2, Math.round(w0 * (tall ? 0.35 + k * 0.65 : k < 0.2 ? 0.45 : k < 0.5 ? 0.75 : 1)));
        R(g, cx - w / 2, b - h + y, w, 1, (y >> 1) % 3 === 0 ? mid : tall ? shade(m, '#7F9BB8', 0.05) : shade(m, '#9AA3AE', 0.05));
      }
      R(g, cx, b - h - S(16), 1, S(16), mid);
      if (t !== 'day') for (let y = b - h + 6; y < b - 4; y += 4) R(g, cx - 2, y, 1, 1, '#FFD27A');
      break;
    }
    case 'clocktower': {
      const h = S(72);
      R(g, cx - S(5), b - h, S(10), h, shade(m, '#C8A86E', 0.05));
      R(g, cx - S(6), b - h + S(8), S(12), S(12), shade(m, '#B8985E', 0.05));
      disc(g, cx, b - h + S(14), S(4), t === 'day' ? '#F4EFD6' : '#FFE9A8');
      tri(g, cx, b - h - S(18), b - h, S(6), shade(m, '#5E6B6A', 0.05));
      break;
    }
    case 'dome': {
      R(g, cx - S(18), b - S(22), S(36), S(22), shade(m, '#E7E0CF', 0.08));
      for (let i = -3; i <= 3; i++) R(g, cx + i * S(5), b - S(20), 1, S(18), shade(m, '#BFB6A2', 0.08));
      R(g, cx - S(10), b - S(30), S(20), S(8), shade(m, '#D9D1BE', 0.08));
      dome(g, cx, b - S(30), S(11), S(14), shade(m, '#8FA8A0', 0.08));
      R(g, cx - 1, b - S(50), 3, S(6), shade(m, '#D9D1BE', 0.08));
      break;
    }
    case 'onion': {
      R(g, cx - S(9), b - S(30), S(18), S(30), shade(m, '#C0463A', 0.05));
      R(g, cx - S(3), b - S(48), S(6), S(18), shade(m, '#E8DCC0', 0.05));
      for (let y = 0; y < S(14); y++) {
        const k = y / S(14);
        const w = Math.round(S(7) * Math.sin(Math.PI * (0.15 + k * 0.85)) * (k > 0.8 ? 0.8 : 1));
        R(g, cx - w, b - S(62) + y, w * 2 + 1, 1, (y >> 1) % 2 ? shade(m, '#2E8B57') : shade(m, '#E0B040'));
      }
      R(g, cx, b - S(68), 1, S(6), shade(m, '#E0B040'));
      break;
    }
    case 'mosque': {
      R(g, cx - S(16), b - S(18), S(32), S(18), shade(m, '#D9CDB4', 0.08));
      dome(g, cx, b - S(18), S(13), S(15), shade(m, '#8FA0B0', 0.08));
      for (const dx of [-S(22), S(22)]) {
        R(g, cx + dx - 1, b - S(54), 3, S(54), shade(m, '#E4D9C2', 0.08));
        tri(g, cx + dx, b - S(62), b - S(54), 2, shade(m, '#7A8894', 0.08));
      }
      if (t !== 'day') R(g, cx - S(12), b - S(8), S(24), 1, '#FFD27A');
      break;
    }
    case 'pyramid': {
      const h = S(58);
      for (let y = 0; y < h; y++) {
        const w = Math.round((y / h) * S(64));
        R(g, cx - w, b - h + y, w, 1, shade(m, '#D8B070', 0.1));
        R(g, cx, b - h + y, w, 1, shade(m, '#B38A50', 0.1));
      }
      break;
    }
    case 'opera': {
      R(g, cx - S(26), b - S(8), S(52), S(8), shade(m, '#D8C8A8', 0.05));
      for (const [dx, hh, ww] of [
        [-S(16), S(26), S(10)],
        [-S(4), S(34), S(12)],
        [S(10), S(28), S(11)],
        [S(20), S(18), S(8)],
      ] as const) {
        for (let y = 0; y < hh; y++) {
          const w = Math.round(ww * Math.sqrt(y / hh));
          R(g, cx + dx - w + Math.round((1 - y / hh) * 5), b - S(8) - hh + y, w, 1, shade(m, '#F6F3EA', 0.05));
        }
      }
      break;
    }
    case 'suspension': {
      const span = S(150);
      const top = S(64);
      const deck = b - S(14);
      const col = shade(m, st_bridgeRed(kind), 0.05);
      for (const dx of [-span / 3, span / 3]) {
        R(g, cx + dx - 2, deck - top + S(14), 4, top, col);
        R(g, cx + dx - 3, deck - top + S(20), 6, 2, col);
      }
      R(g, cx - span / 2, deck, span, 2, col);
      for (let x = -span / 2; x < span / 2; x++) {
        const k = Math.abs(x) - span / 3;
        const y = k < 0 ? deck - top + S(16) + ((span / 3) ** 2 - k * k) / (span / 3) / 3.2 : deck - top + S(16) + (k / (span / 6)) * (top - S(18));
        R(g, cx + x, Math.min(deck, y), 1, 1, col);
        if (Math.round(x) % 6 === 0) R(g, cx + x, Math.min(deck, y), 1, deck - Math.min(deck, y), mix(col, m.horizon, 0.4));
      }
      if (t !== 'day') for (let x = -span / 2; x < span / 2; x += 5) R(g, cx + x, deck - 1, 1, 1, '#FFD27A');
      break;
    }
    case 'archbridge': {
      const span = S(120);
      const deck = b - S(10);
      const col = kind === 'archbridge' && t !== 'day' ? '#FFB84A' : shade(m, '#C9A43A', 0.05);
      R(g, cx - span / 2, deck, span, 2, shade(m, '#6B7280', 0.05));
      for (let x = -span / 2; x < span / 2; x++) {
        const y = deck - Math.round(S(22) * (1 - (x / (span / 2)) ** 2));
        R(g, cx + x, y, 1, 2, col);
        if (Math.round(x) % 8 === 0) R(g, cx + x, y, 1, deck - y, mix(col, m.horizon, 0.5));
      }
      break;
    }
    case 'torii': {
      const col = shade(m, '#D2412E', 0.05);
      R(g, cx - S(10), b - S(26), 2, S(26), col);
      R(g, cx + S(8), b - S(26), 2, S(26), col);
      R(g, cx - S(14), b - S(28), S(28), 2, col);
      R(g, cx - S(11), b - S(22), S(22), 1, col);
      break;
    }
    case 'colosseum': {
      R(g, cx - S(34), b - S(26), S(68), S(26), shade(m, '#CFA877', 0.08));
      for (let row = 0; row < 3; row++)
        for (let i = -6; i <= 6; i++) R(g, cx + i * S(5) - 1, b - S(23) + row * S(8), 2, S(4), t === 'day' ? shade(m, '#8A6A45', 0.08) : '#FFC766');
      R(g, cx + S(14), b - S(32), S(20), S(6), shade(m, '#CFA877', 0.08));
      break;
    }
    case 'lighthouse': {
      for (let y = 0; y < S(44); y++) {
        const w = Math.round(S(4) + (y / S(44)) * S(3));
        R(g, cx - w, b - S(44) + y, w * 2, 1, (y >> 2) % 2 ? shade(m, '#F2F0EA') : shade(m, '#C0392B'));
      }
      R(g, cx - S(4), b - S(52), S(8), S(8), shade(m, '#3A4252'));
      R(g, cx - S(3), b - S(50), S(6), S(4), t === 'day' ? '#DDEAF2' : '#FFF2A8');
      break;
    }
    case 'angkor': {
      R(g, cx - S(50), b - S(12), S(100), S(12), shade(m, '#8C8468', 0.1));
      for (const [dx, hh] of [
        [-S(36), S(30)],
        [-S(18), S(40)],
        [0, S(54)],
        [S(18), S(40)],
        [S(36), S(30)],
      ] as const) {
        for (let y = 0; y < hh; y++) {
          const k = y / hh;
          const w = Math.round(S(7) * (0.2 + k * 0.8) * (1 - 0.15 * Math.sin(y)));
          R(g, cx + dx - w, b - S(12) - hh + y, w * 2 + 1, 1, (y >> 1) % 3 ? shade(m, '#7E7658', 0.1) : shade(m, '#6A634A', 0.1));
        }
      }
      break;
    }
    case 'stupa': {
      R(g, cx - S(14), b - S(10), S(28), S(10), shade(m, '#E8DEC8', 0.05));
      dome(g, cx, b - S(10), S(10), S(12), shade(m, '#F2E6C8', 0.05));
      for (let y = 0; y < S(26); y++) {
        const w = Math.max(1, Math.round(S(4) * (1 - y / S(26))));
        R(g, cx - w, b - S(22) - y, w * 2 + 1, 1, t === 'day' ? shade(m, '#E0B040') : '#FFD27A');
      }
      break;
    }
    case 'turtletower': {
      // Tháp Rùa giữa hồ: ba tầng nhỏ, mái cong, ô cửa vòm.
      R(g, cx - S(12), b - 2, S(24), 2, shade(m, '#5E7A4A', 0.05));
      R(g, cx - S(8), b - S(12), S(16), S(10), shade(m, '#E8DCC0', 0.05));
      R(g, cx - S(6), b - S(20), S(12), S(8), shade(m, '#E8DCC0', 0.05));
      R(g, cx - S(4), b - S(26), S(8), S(6), shade(m, '#E8DCC0', 0.05));
      for (const [y, w] of [
        [S(12), S(10)],
        [S(20), S(8)],
        [S(26), S(6)],
      ] as const)
        R(g, cx - w, b - y - 1, w * 2, 2, shade(m, '#7A4A36', 0.05));
      R(g, cx - 1, b - S(9), 2, S(4), t === 'day' ? dark : '#FFD27A');
      R(g, cx, b - S(32), 1, S(5), dark);
      break;
    }
    case 'onepillar': {
      R(g, cx - 1, b - S(12), 3, S(12), shade(m, '#9A8E78', 0.05));
      R(g, cx - S(8), b - S(18), S(16), S(6), shade(m, '#C8A070', 0.05));
      R(g, cx - S(11), b - S(21), S(22), 2, shade(m, '#7A4A36', 0.05));
      tri(g, cx, b - S(26), b - S(21), S(8), shade(m, '#7A4A36', 0.05));
      break;
    }
    case 'lotustower': {
      for (let y = 0; y < S(46); y++) {
        const k = y / S(46);
        const w = Math.round(S(6) * (0.55 + 0.45 * Math.sin(k * Math.PI)));
        R(g, cx - w, b - S(46) + y, w * 2 + 1, 1, (y >> 1) % 3 ? shade(m, '#9FB8CC', 0.05) : mid);
      }
      R(g, cx - S(9), b - S(34), S(18), 2, shade(m, '#6A7A8A', 0.05));
      R(g, cx, b - S(54), 1, S(8), mid);
      break;
    }
    case 'coveredbridge': {
      R(g, cx - S(18), b - S(6), S(36), S(6), shade(m, '#8A5A3A', 0.05));
      R(g, cx - S(14), b - S(14), S(28), S(8), shade(m, '#E8B860', 0.05));
      R(g, cx - S(17), b - S(17), S(34), 3, shade(m, '#7A3E2E', 0.05));
      tri(g, cx, b - S(22), b - S(17), S(10), shade(m, '#7A3E2E', 0.05));
      if (t !== 'day') R(g, cx - S(10), b - S(11), S(20), 1, '#FFB84A');
      break;
    }
    case 'citadel': {
      R(g, cx - S(40), b - S(16), S(80), S(16), shade(m, '#8C7E68', 0.08));
      R(g, cx - S(10), b - S(8), S(20), S(8), shade(m, '#3A3428', 0.08));
      R(g, cx - S(18), b - S(26), S(36), S(10), shade(m, '#C8A070', 0.08));
      R(g, cx - S(22), b - S(29), S(44), 3, shade(m, '#B8862E', 0.08));
      R(g, cx - S(12), b - S(36), S(24), S(7), shade(m, '#C8A070', 0.08));
      R(g, cx - S(15), b - S(38), S(30), 2, shade(m, '#B8862E', 0.08));
      R(g, cx + S(34), b - S(46), 1, S(30), dark);
      R(g, cx + S(35), b - S(46), S(8), S(5), shade(m, '#D63A2E'));
      break;
    }
    case 'windmill': {
      R(g, cx - S(5), b - S(26), S(10), S(26), shade(m, '#6B4A3A', 0.05));
      tri(g, cx, b - S(32), b - S(26), S(6), shade(m, '#3A3F48', 0.05));
      const hub = [cx, b - S(28)] as const;
      for (const [dx, dy] of [
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
      ] as const)
        for (let i = 2; i < S(18); i++) R(g, hub[0] + dx * i, hub[1] + dy * i, 2, 2, shade(m, '#E8E0D0', 0.05));
      break;
    }
    case 'castle': {
      R(g, cx - S(26), b - S(20), S(52), S(20), shade(m, '#E8E4DA', 0.08));
      for (let i = -3; i <= 3; i++) R(g, cx + i * S(7) - 1, b - S(22), 3, 2, shade(m, '#E8E4DA', 0.08));
      R(g, cx - S(10), b - S(40), S(20), S(20), shade(m, '#F2EEE4', 0.08));
      R(g, cx - S(14), b - S(42), S(28), 3, shade(m, '#3F6E6A', 0.08));
      tri(g, cx, b - S(52), b - S(42), S(10), shade(m, '#3F6E6A', 0.08));
      for (const dx of [-S(22), S(22)]) tri(g, cx + dx, b - S(34), b - S(20), S(5), shade(m, '#3F6E6A', 0.08));
      break;
    }
    case 'greatwall': {
      let y = b - S(20);
      for (let x = -S(120); x < S(120); x++) {
        y += Math.sin(x / S(18)) * 0.6;
        R(g, cx + x, y, 1, S(5), shade(m, '#A89070', 0.12));
        if (Math.round(x) % 4 === 0) R(g, cx + x, y - 2, 1, 2, shade(m, '#A89070', 0.12));
        if (Math.round(x) % 48 === 0) R(g, cx + x - 3, y - S(8), 7, S(8), shade(m, '#988060', 0.12));
      }
      break;
    }
    case 'burj': {
      const h = S(110);
      for (let y = 0; y < h; y++) {
        const k = y / h;
        const w = Math.max(1, Math.round(S(12) * k ** 1.6));
        R(g, cx - w, b - h + y, w * 2 + 1, 1, (y >> 1) % 5 === 0 ? mid : shade(m, '#A8B8C8', 0.05));
      }
      R(g, cx, b - h - S(10), 1, S(10), mid);
      if (t !== 'day') for (let y = b - h + 10; y < b; y += 5) R(g, cx, y, 1, 1, '#FFE9B0');
      break;
    }
    case 'marina': {
      for (const dx of [-S(16), 0, S(16)]) R(g, cx + dx - S(4), b - S(48), S(8), S(48), shade(m, '#B8C4CE', 0.05));
      R(g, cx - S(26), b - S(52), S(52), S(4), shade(m, '#8C9AA6', 0.05));
      R(g, cx + S(24), b - S(54), S(6), S(2), shade(m, '#8C9AA6', 0.05));
      if (t !== 'day') for (let y = b - S(44); y < b; y += 4) for (const dx of [-S(16), 0, S(16)]) R(g, cx + dx - 2, y, 4, 1, '#FFD27A');
      break;
    }
    case 'ferris': {
      const rr = S(20);
      const cy = b - rr - S(4);
      for (let a = 0; a < 64; a++) {
        const th = (a / 64) * Math.PI * 2;
        R(g, cx + Math.cos(th) * rr, cy + Math.sin(th) * rr, 1, 1, t === 'day' ? mid : '#9CD6FF');
        if (a % 8 === 0) {
          for (let k = 0; k < rr; k += 2) R(g, cx + Math.cos(th) * k, cy + Math.sin(th) * k, 1, 1, mix(mid, m.horizon, 0.3));
          R(g, cx + Math.cos(th) * rr - 1, cy + Math.sin(th) * rr, 3, 2, t === 'day' ? light : '#FFD27A');
        }
      }
      R(g, cx - S(6), cy, 1, b - cy, dark);
      R(g, cx + S(6), cy, 1, b - cy, dark);
      break;
    }
    case 'statue': {
      R(g, cx - S(5), b - S(20), S(10), S(20), shade(m, '#8C8C84', 0.08));
      R(g, cx - S(2), b - S(38), S(4), S(18), shade(m, '#7FB8A8', 0.05));
      R(g, cx - S(9), b - S(34), S(18), 2, shade(m, '#7FB8A8', 0.05));
      disc(g, cx, b - S(40), S(2), shade(m, '#7FB8A8', 0.05));
      break;
    }
    case 'lantern': {
      for (let i = 0; i < 5; i++) {
        const x = cx + (i - 2) * S(7);
        const y = b - S(28) + (i % 2) * 3;
        R(g, x, y - 4, 1, 4, dark);
        disc(g, x, y + 2, S(2.5), ['#E84A3A', '#F2B03A', '#E86A9A', '#3AA86A', '#F2D03A'][i]!);
      }
      break;
    }
  }
}
function st_bridgeRed(kind: LandmarkKind) {
  return kind === 'suspension' ? '#C0452E' : '#8A95A8';
}

// ------------------------------------------------------------------ nước + cây

function waterBand(g: Ctx, src: HTMLCanvasElement, m: Mood, top: number, bottom: number) {
  // Phản chiếu: lật phần phố ngay trên mép nước, tối và nhoè theo dòng.
  for (let y = top; y < bottom; y++) {
    const srcY = top - (y - top) * 1.4 - 1;
    if (srcY < 0) break;
    const off = Math.round(Math.sin(y * 1.3) * 1.5);
    g.globalAlpha = 0.55;
    g.drawImage(src, 0, Math.floor(srcY), W, 1, off, y, W, 1);
  }
  g.globalAlpha = 1;
  g.fillStyle = shade(m, '#2E5E8A', 0);
  g.globalAlpha = 0.5;
  g.fillRect(0, top, W, bottom - top);
  g.globalAlpha = 1;
  for (let y = top; y < bottom; y += 3) R(g, 0, y, W, 1, mix(shade(m, '#3F78A8'), m.horizon, 0.35));
}

function tree(g: Ctx, veg: Vegetation, x: number, base: number, sz: number, m: Mood, r: () => number, snow: boolean) {
  const trunk = shade(m, '#5A3E2E');
  if (veg === 'palm') {
    for (let y = 0; y < sz * 1.6; y++) R(g, x + Math.round(Math.sin(y / 6) * 1.5), base - y, 1, 1, trunk);
    const top = [x + Math.round(Math.sin((sz * 1.6) / 6) * 1.5), base - sz * 1.6] as const;
    for (const [dx, dy] of [
      [-1, 0],
      [1, 0],
      [-1, 1],
      [1, 1],
      [0, -1],
    ] as const)
      for (let i = 0; i < sz * 0.7; i++) R(g, top[0] + dx * i, top[1] + dy * i * 0.5 + (dx ? i * i * 0.04 : 0), 1, 1, shade(m, '#3F8A4A'));
    return;
  }
  if (veg === 'pine' || veg === 'snowpine') {
    R(g, x, base - 3, 1, 3, trunk);
    tri(g, x, base - sz * 1.4, base - 2, sz * 0.45, shade(m, '#2F5E44'));
    if (snow || veg === 'snowpine') for (let y = base - sz * 1.4; y < base - 3; y += 3) R(g, x - 1, y, 2, 1, shade(m, '#F2F6FA'));
    return;
  }
  if (veg === 'bamboo') {
    for (let i = 0; i < 3; i++) R(g, x + i * 2, base - sz * 1.5, 1, sz * 1.5, shade(m, '#5E9A4A'));
    return;
  }
  if (veg === 'desert') {
    R(g, x, base - sz, 2, sz, shade(m, '#5E8A4A'));
    R(g, x - 2, base - sz * 0.6, 2, 1, shade(m, '#5E8A4A'));
    return;
  }
  const leaf =
    veg === 'sakura' ? ['#F4A8C8', '#E98AB4', '#FBC8DC'] : veg === 'autumn' ? ['#D9782E', '#C65A2A', '#E8A040'] : veg === 'flowers' ? ['#4E8A4A', '#3E7A3E', '#5E9A52'] : ['#3E7A44', '#2F6A3A', '#4E8A4E'];
  R(g, x, base - sz * 0.6, 1, sz * 0.6, trunk);
  const cx = x;
  const cy = base - sz * 0.8;
  for (let i = 0; i < 6; i++) {
    const ox = (r() - 0.5) * sz;
    const oy = (r() - 0.5) * sz * 0.6;
    disc(g, cx + ox, cy + oy, Math.max(2, Math.round(sz * (0.28 + r() * 0.15))), shade(m, leaf[i % 3]!));
  }
  if (snow) R(g, cx - sz / 2, cy - sz * 0.45, sz, 1, shade(m, '#F2F6FA'));
}

function ground(g: Ctx, st: Station, m: Mood, weather: Weather, top: number, r: () => number) {
  const grass = st.veg === 'desert' ? '#C9A868' : st.veg === 'rice' ? '#8DB255' : weather === 'snow' ? '#E4EAF2' : '#5E8F4A';
  R(g, 0, top, W, H - top, shade(m, grass, 0.05));
  if (st.veg === 'rice' || st.veg === 'flowers')
    for (let y = top + 2; y < H; y += 3)
      for (let x = 0; x < W; x += 2) if (r() < 0.35) R(g, x, y, 1, 1, shade(m, st.veg === 'flowers' ? ['#F2D03A', '#E86A9A', '#FFFFFF'][Math.floor(r() * 3)]! : '#B8D06A'));
}

// ------------------------------------------------------------------ lớp động: dải cây gần, cột điện, ray, tàu

function nearStrip(st: Station, m: Mood, weather: Weather, seed: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = W * 2;
  c.height = 40;
  const g = c.getContext('2d')!;
  const r = rng(seed);
  const snow = weather === 'snow';
  const base = 32;
  // Bờ đất dưới chân cây.
  R(g, 0, base, W * 2, 8, shade(m, st.veg === 'desert' ? '#B8925A' : snow ? '#DCE4EE' : '#4E7A3E', 0.02));
  const veg: Vegetation = st.veg === 'rice' ? 'green' : st.veg === 'flowers' ? 'green' : st.veg;
  const waterfront = !!st.water;
  if (waterfront) {
    // Tàu chạy ven sông / biển: kè đá thấp + lan can, để mặt nước phía sau lộ ra.
    R(g, 0, base - 3, W * 2, 3, shade(m, '#8A8F98'));
    for (let x = 0; x < W * 2; x += 6) R(g, x, base - 7, 1, 4, shade(m, '#5A606C'));
    R(g, 0, base - 7, W * 2, 1, shade(m, '#5A606C'));
  }
  for (let x = 4; x < W * 2 - 8; x += waterfront ? 50 + Math.floor(r() * 70) : 10 + Math.floor(r() * 26)) {
    if (!waterfront && r() < 0.22 && st.skyline && st.skyline.style !== 'modern') {
      // Nhà thấp ven đường ray, đèn cửa sổ ấm.
      const w = 14 + Math.floor(r() * 10);
      const h = 10 + Math.floor(r() * 6);
      const pal = PALETTES[st.skyline.style] ?? PALETTES.old!;
      R(g, x, base - h, w, h, shade(m, pal.walls[Math.floor(r() * pal.walls.length)]!));
      tri(g, x + w / 2, base - h - 5, base - h, w / 2 + 2, shade(m, pal.roof[0]!));
      if (snow) R(g, x - 1, base - h - 1, w + 2, 1, shade(m, '#F4F7FB'));
      R(g, x + 3, base - h + 4, 3, 3, r() < m.lit + 0.1 ? '#FFD27A' : shade(m, pal.glass));
      R(g, x + w - 7, base - h + 4, 3, 3, r() < m.lit + 0.1 ? '#FFD27A' : shade(m, pal.glass));
      x += w;
      continue;
    }
    tree(g, veg, x, base, 12 + Math.floor(r() * 12), m, r, snow);
  }
  // Nối liền mép trái / phải để cuộn vòng không lộ đường nối.
  g.drawImage(c, 0, 0, W, 40, W, 0, W, 40);
  return c;
}

function trainSprite(m: Mood, time: TimeOfDay, weather: Weather): HTMLCanvasElement {
  const cars = 3;
  const carW = 86;
  const c = document.createElement('canvas');
  c.width = cars * (carW + 2) + 8;
  c.height = 30;
  const g = c.getContext('2d')!;
  const body = shade(m, '#EDE6D6', 0.02);
  const band = shade(m, '#4A7FE8', 0.02);
  const dark = shade(m, '#3A4252');
  const lit = time !== 'day' || weather === 'rain';
  for (let i = 0; i < cars; i++) {
    const x = 4 + i * (carW + 2);
    R(g, x + 2, 6, carW - 4, 1, shade(m, '#C9C2B2'));
    R(g, x, 7, carW, 17, body);
    R(g, x, 7, carW, 2, shade(m, '#D8D0BE'));
    R(g, x, 19, carW, 2, band);
    for (let wx = x + 5; wx < x + carW - 8; wx += 9) {
      R(g, wx, 11, 7, 6, dark);
      R(g, wx + 1, 12, 5, 4, lit ? (wx % 3 ? '#FFD98A' : '#FFE9B8') : shade(m, '#9FC0DA'));
      R(g, wx + 1, 12, 5, 1, lit ? '#FFF0C8' : shade(m, '#C9DDEC'));
    }
    R(g, x + carW - 6, 10, 4, 12, shade(m, '#BFB8A8'));
    for (const wx of [x + 10, x + 22, x + carW - 24, x + carW - 12]) {
      R(g, wx, 24, 7, 3, dark);
      R(g, wx + 1, 27, 2, 2, shade(m, '#1E2330'));
      R(g, wx + 4, 27, 2, 2, shade(m, '#1E2330'));
    }
    if (i < cars - 1) R(g, x + carW, 12, 2, 8, dark);
  }
  // Cần lấy điện trên toa đầu.
  R(g, 20, 1, 1, 5, dark);
  R(g, 14, 1, 14, 1, dark);
  // Đèn pha đầu tàu (bên phải — tàu chạy sang phải).
  const front = 4 + (cars - 1) * (carW + 2) + carW;
  R(g, front - 3, 20, 3, 2, lit ? '#FFF2B0' : shade(m, '#E8E0D0'));
  return c;
}

// ------------------------------------------------------------------ cảnh

type Particle = { x: number; y: number; v: number; s: number };

const PHOTOS = new Map<string, HTMLImageElement | Promise<HTMLImageElement | null> | null>();

/** Đường dẫn ảnh nền của ga theo buổi (cực quang chỉ có ảnh đêm). */
export function photoSrc(stationId: string, time: TimeOfDay): string {
  return `/rail/${stationId}-${stationId === 'aurora' ? 'night' : time}.webp`;
}

function loadPhoto(src: string): Promise<HTMLImageElement | null> {
  const hit = PHOTOS.get(src);
  if (hit instanceof HTMLImageElement) return Promise.resolve(hit);
  if (hit === null) return Promise.resolve(null);
  if (hit) return hit;
  const p = new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      PHOTOS.set(src, img);
      resolve(img);
    };
    img.onerror = () => {
      PHOTOS.set(src, null);
      resolve(null);
    };
    img.src = src;
  });
  PHOTOS.set(src, p);
  return p;
}

export class RailScene {
  private g: Ctx;
  private bg: HTMLCanvasElement | null = null;
  private near: HTMLCanvasElement | null = null;
  private train: HTMLCanvasElement | null = null;
  private clouds: { img: HTMLCanvasElement; x: number; y: number; v: number }[] = [];
  private stars: { x: number; y: number; p: number }[] = [];
  private drops: Particle[] = [];
  private scroll = 0;
  private t = 0;
  private mood: Mood | null = null;
  private waterTop = 0;
  private waterBottom = 0;
  private aurora = false;
  private key = '';
  /** Chuyển ga: 0 → 1 (tối dần rồi sáng dần), đổi nền ở giữa. */
  private trans: { p: number; next: (() => void) | null } | null = null;
  /** Tốc độ tàu 0..1 (0: dừng ở ga, 1: chạy đều). */
  speed = 1;
  /** Góc nhìn: ngồi trong toa nhìn ra cửa sổ (không thấy tàu, có giọt mưa trên kính) hay đứng ngoài nhìn tàu chạy. */
  view: 'window' | 'outside' = 'window';
  /** Giọt nước đọng trên kính (chỉ góc nhìn cửa sổ, khi mưa). */
  private beads: { x: number; y: number; v: number; len: number }[] = [];

  /**
   * Ảnh nền vẽ sẵn của ga (pixel-art do model ảnh vẽ, `public/rail/<ga>-<buổi>.webp`).
   * Có ảnh thì dùng ảnh làm nền (đúng cảnh thật của thành phố); chưa tải xong hoặc
   * không có thì dùng nền dựng bằng code ở trên.
   */
  private photo: HTMLImageElement | null = null;
  private photoAlpha = 0;
  /**
   * Ga này CÓ ảnh nhưng ảnh đang tải. Trong lúc chờ KHÔNG vẽ nền pixel dựng
   * bằng code (người dùng 30/09/2026: nền pixel hiện ra rồi bị ảnh đè lên) — giữ
   * màn tối của đường hầm / nền trời trơn, ảnh về thì hiện dần. Ảnh lỗi mới dùng
   * nền dựng bằng code.
   */
  private photoPending = false;
  private pendingSince = 0;
  /** Quãng ảnh nền đã trôi (điểm ảnh khung hiển thị) — ảnh chạy liên tục theo tốc độ tàu. */
  private photoScroll = 0;
  /** Ảnh nền lật ngang, ghép xen kẽ với ảnh gốc để cảnh trôi mãi không có đường nối gắt. */
  private photoFlip: HTMLCanvasElement | null = null;
  private photoFlipOf: HTMLImageElement | null = null;
  private out: Ctx;
  private dyn: HTMLCanvasElement;

  constructor(private canvas: HTMLCanvasElement) {
    // Khung hiển thị gấp đôi độ phân giải lớp động: ảnh nền giữ được chi tiết,
    // lớp động (tàu, cột, mưa) vẫn là pixel to đúng chất.
    canvas.width = W * 2;
    canvas.height = H * 2;
    this.out = canvas.getContext('2d')!;
    this.dyn = document.createElement('canvas');
    this.dyn.width = W;
    this.dyn.height = H;
    this.g = this.dyn.getContext('2d')!;
    this.g.imageSmoothingEnabled = false;
  }

  /** Nạp trước ảnh nền của một ga (gọi cho ga kế để chuyển ga không bị chờ). */
  static preload(stationId: string, time: TimeOfDay): void {
    void loadPhoto(photoSrc(stationId, time));
  }

  set(st: Station, time: TimeOfDay, weather: Weather, animate = false) {
    const key = `${st.id}|${time}|${weather}`;
    if (key === this.key) return;
    const apply = () => this.build(st, time, weather, key);
    if (animate && this.bg) this.trans = { p: 0, next: apply };
    else apply();
  }

  private build(st: Station, time: TimeOfDay, weather: Weather, key: string) {
    this.key = key;
    const src = photoSrc(st.id, time);
    const cached = PHOTOS.get(src);
    this.photo = cached instanceof HTMLImageElement ? cached : null;
    this.photoAlpha = this.photo ? 1 : 0;
    this.photoPending = !this.photo && cached !== null;
    this.pendingSince = this.t;
    if (this.photoPending)
      void loadPhoto(src).then((img) => {
        if (this.key !== key) return;
        this.photo = img;
        this.photoAlpha = 0;
        this.photoPending = false;
      });
    const m = mood(time, weather);
    this.mood = m;
    const seed = hashStr(st.id);
    const r = rng(seed);
    const bg = document.createElement('canvas');
    bg.width = W;
    bg.height = H;
    const g = bg.getContext('2d')!;
    g.imageSmoothingEnabled = false;
    sky(g, m, BASE + 30);
    celestial(g, m, time, weather, rng(seed + 1));
    this.aurora = st.id === 'aurora' && time !== 'day' && weather !== 'rain';
    mountains(g, st, m, weather, rng(seed + 2));
    // Phố hai lớp (xa nhạt, gần đậm) rồi công trình biểu tượng.
    skyline(g, st, m, weather, rng(seed + 3), 0);
    for (const lm of st.landmarks) landmark(g, lm.kind, Math.round(lm.x * W), lm.s ?? 1, m, time);
    skyline(g, st, m, weather, rng(seed + 4), 1);
    // Mặt đất / mặt nước dưới chân phố.
    if (st.water) {
      this.waterTop = BASE;
      this.waterBottom = BASE + 22;
      const snap = document.createElement('canvas');
      snap.width = W;
      snap.height = H;
      snap.getContext('2d')!.drawImage(bg, 0, 0);
      waterBand(g, snap, m, BASE, BASE + 22);
      ground(g, st, m, weather, BASE + 22, r);
    } else {
      this.waterTop = this.waterBottom = 0;
      ground(g, st, m, weather, BASE, r);
      // Hàng cây xa trên đồng.
      const rr = rng(seed + 5);
      for (let x = 2; x < W; x += 6 + Math.floor(rr() * 12)) tree(g, st.veg === 'rice' || st.veg === 'flowers' ? 'green' : st.veg, x, BASE + 6, 7 + Math.floor(rr() * 5), { ...m, amb: Math.min(0.8, m.amb + 0.1) }, rr, weather === 'snow');
    }
    this.bg = bg;
    this.near = nearStrip(st, m, weather, seed + 6);
    this.train = trainSprite(m, time, weather);
    const cr = rng(seed + 7);
    this.clouds = Array.from({ length: weather === 'clear' ? 5 : 9 }, (_, i) => ({ img: cloudSprite(m, time, seed + 20 + i), x: cr() * (W + 64) - 64, y: 6 + cr() * 44, v: 0.6 + cr() * 1.4 }));
    const sr = rng(seed + 8);
    this.stars = time === 'night' && weather === 'clear' ? Array.from({ length: 24 }, () => ({ x: Math.floor(sr() * W), y: Math.floor(sr() * 70), p: sr() * 6 })) : [];
    const pr = rng(seed + 9);
    this.drops = weather === 'clear' ? [] : Array.from({ length: weather === 'rain' ? 160 : 110 }, () => ({ x: pr() * W, y: pr() * H, v: 0.6 + pr() * 0.8, s: pr() < 0.3 ? 2 : 1 }));
  }

  /**
   * Nhìn qua cửa sổ toa: không thấy đoàn tàu; bờ cỏ sát đường ray vụt qua (vệt
   * chuyển động), cột điện gần và cao lướt qua cả khung, mưa đọng thành giọt
   * trượt trên kính, tuyết bám viền kính.
   */
  private windowForeground(dt: number, m: Mood) {
    const g = this.g;
    const snow = this.key.endsWith('snow');
    const rain = this.key.endsWith('rain');
    // Hàng cây / bụi gần lướt qua dưới chân cửa sổ (thị sai nhanh hơn cảnh xa):
    // cho cảm giác đang chạy rõ ràng cả khi nền là ảnh.
    if (this.photo) {
      const nx = -((this.scroll * 2.4) % W);
      g.globalAlpha = 0.92;
      g.drawImage(this.near!, Math.floor(nx), 0, W, 40, 0, RAIL - 30, W, 40);
      g.drawImage(this.near!, Math.floor(nx) + W, 0, W, 40, 0, RAIL - 30, W, 40);
      g.globalAlpha = 1;
    }
    // Bờ đất sát toa: vệt ngang chạy rất nhanh.
    const ground = shade(m, snow ? '#D8E0EA' : '#4E6E3E');
    R(g, 0, RAIL - 2, W, H - RAIL + 2, ground);
    const fast = this.scroll * 4.5;
    for (let i = 0; i < 30; i++) {
      const y = RAIL + ((i * 5) % (H - RAIL));
      const x = (((i * 97 - fast) % (W + 60)) + W + 60) % (W + 60) - 30;
      R(g, x, y, 14 + (i % 5) * 6, 1, shade(m, snow ? '#F2F5FA' : i % 3 ? '#5E8248' : '#3E5A32'));
    }
    // Cột điện sát cửa sổ: cao hết khung, lướt qua nhanh.
    const gap = 340;
    const px = (((-this.scroll * 5) % gap) + gap) % gap - 20;
    for (let x = px; x < W + 20; x += gap) {
      R(g, x, 0, 6, H, shade(m, '#23262E'));
      R(g, x + 1, 0, 1, H, shade(m, '#3A3F4A'));
      R(g, x - 16, 30, 38, 3, shade(m, '#23262E'));
    }
    R(g, 0, 32, W, 1, shade(m, '#2A2F3A'));
    this.weatherAndTransitionGlass(dt, rain, snow);
  }

  private weatherAndTransitionGlass(dt: number, rain: boolean, snow: boolean) {
    const g = this.g;
    // Ngoài trời vẫn mưa / tuyết rơi.
    this.weatherAndTransition(dt);
    if (rain) {
      if (this.beads.length === 0) {
        const r = rng(99);
        this.beads = Array.from({ length: 70 }, () => ({ x: r() * W, y: r() * H, v: r(), len: 0 }));
      }
      for (const b of this.beads) {
        // Giọt nhỏ đứng yên, giọt to trượt xuống và bị gió tàu đẩy chéo về sau.
        if (b.v > 0.72) {
          b.y += dt * (6 + b.v * 14);
          b.x -= dt * this.speed * 10 * b.v;
          b.len = Math.min(10, b.len + dt * 6);
        }
        if (b.y > H + 4 || b.x < -4) {
          b.y = -3;
          b.x = Math.random() * W;
          b.len = 0;
        }
        g.fillStyle = 'rgba(210,225,245,0.18)';
        if (b.len > 1) g.fillRect(Math.round(b.x) + 1, Math.round(b.y - b.len), 1, Math.round(b.len));
        g.fillStyle = 'rgba(230,240,255,0.55)';
        const big = b.v > 0.72 ? 2 : 1;
        g.fillRect(Math.round(b.x), Math.round(b.y), big + 1, big + 1);
        g.fillStyle = 'rgba(255,255,255,0.9)';
        g.fillRect(Math.round(b.x), Math.round(b.y), 1, 1);
      }
    } else if (this.beads.length) this.beads = [];
    if (snow) {
      // Sương giá bám viền kính: dày ở góc, thưa dần vào giữa (hoà sắc cố định theo vị trí).
      g.fillStyle = 'rgba(236,244,255,0.55)';
      for (let y = 0; y < H; y += 2)
        for (let x = 0; x < W; x += 2) {
          const d = Math.min(x, W - x, y, H - y);
          if (d < 18 && BAYER[((y >> 1) & 3) * 4 + ((x >> 1) & 3)]! * 18 > d) g.fillRect(x, y, 2, 2);
        }
    }
  }

  /** Vẽ một khung. `dt` tính bằng giây. */
  frame(dt: number) {
    if (!this.bg || !this.near || !this.train || !this.mood) return;
    this.g.clearRect(0, 0, W, H);
    this.layers(dt);
    const o = this.out;
    if (this.photo) {
      this.photoAlpha = Math.min(1, this.photoAlpha + dt * 2.5);
      // Ảnh phủ kín khung, cắt bớt trời phía trên; trôi ngang rất chậm như cảnh xa.
      const iw = this.photo.naturalWidth;
      const ih = this.photo.naturalHeight;
      const scale = Math.max((W * 2 * 1.06) / iw, (H * 2) / ih);
      const dw = iw * scale;
      const dh = ih * scale;
      // CẢNH TRÔI THẬT (30/09/2026: "nó chỉ hiện ảnh, không phải hiệu ứng động"):
      // ảnh chạy ngang liên tục theo tốc độ tàu — ghép ảnh gốc với bản lật ngang
      // xen kẽ nên trôi mãi không hết ảnh, không có vết cắt. Toa nhún nhẹ khi chạy.
      this.photoScroll += dt * this.speed * 26;
      const sway = this.speed > 0.05 ? Math.sin(this.t * 7.3) * 1.4 * Math.min(1, this.speed) + Math.sin(this.t * 2.1) * 0.8 : 0;
      const dy = -(dh - H * 2) * 0.62 + sway;
      const rain = this.key.endsWith('rain');
      const snow = this.key.endsWith('snow');
      o.imageSmoothingEnabled = true;
      o.imageSmoothingQuality = 'high';
      if (this.photoAlpha < 1) {
        o.fillStyle = '#07080E';
        o.fillRect(0, 0, W * 2, H * 2);
      }
      o.globalAlpha = this.photoAlpha;
      o.filter = rain ? 'saturate(0.7) brightness(0.78) contrast(0.95)' : snow ? 'saturate(0.75) brightness(1.04)' : 'none';
      if (this.photoFlipOf !== this.photo) {
        const f = document.createElement('canvas');
        f.width = iw;
        f.height = ih;
        const fg = f.getContext('2d')!;
        fg.translate(iw, 0);
        fg.scale(-1, 1);
        fg.drawImage(this.photo, 0, 0);
        this.photoFlip = f;
        this.photoFlipOf = this.photo;
      }
      const period = dw * 2;
      const start = -(this.photoScroll % period) - (dw - W * 2) / 2;
      for (let x = start, k = 0; x < W * 2; x += dw, k++) {
        if (x + dw <= 0) continue;
        o.drawImage(k % 2 === 0 ? this.photo : this.photoFlip!, x, dy, dw, dh);
      }
      o.filter = 'none';
      o.globalAlpha = 1;
      if (rain) {
        o.fillStyle = 'rgba(40,52,72,0.28)';
        o.fillRect(0, 0, W * 2, H * 2);
      } else if (snow) {
        o.fillStyle = 'rgba(225,235,248,0.14)';
        o.fillRect(0, 0, W * 2, H * 2);
      }
    }
    o.imageSmoothingEnabled = false;
    if (!this.photo) {
      o.clearRect(0, 0, W * 2, H * 2);
      if (this.photoPending) {
        // Chờ ảnh: nền trời trơn theo buổi, không lộ cảnh pixel.
        const grad = o.createLinearGradient(0, 0, 0, H * 2);
        grad.addColorStop(0, this.mood!.sky[0] ?? '#0B1020');
        grad.addColorStop(1, this.mood!.horizon);
        o.fillStyle = grad;
        o.fillRect(0, 0, W * 2, H * 2);
      }
    }
    o.drawImage(this.dyn, 0, 0, W * 2, H * 2);
  }

  /** Các lớp vẽ ở độ phân giải thấp (nền dựng bằng code chỉ vẽ khi chưa có ảnh). */
  private layers(dt: number) {
    const g = this.g;
    const m = this.mood!;
    this.t += dt;
    this.scroll += dt * 60 * this.speed;
    // Có ảnh (kể cả đang hiện dần) hoặc đang chờ ảnh: không vẽ nền pixel.
    const photo = !!this.photo || this.photoPending;
    if (!photo) this.drawBackdrop(dt, m);
    else if (this.view === 'window') {
      this.windowForeground(dt, m);
      return;
    }
    if (!photo) {
      // Dải cây gần (thị sai ~ nửa tốc độ ray).
      const nx = -((this.scroll * 0.55) % W);
      g.drawImage(this.near!, Math.floor(nx), 0, W, 40, 0, RAIL - 36, W, 40);
      g.drawImage(this.near!, Math.floor(nx) + W, 0, W, 40, 0, RAIL - 36, W, 40);
    }
    if (this.view === 'window') {
      this.windowForeground(dt, m);
      return;
    }
    this.outsideForeground(dt, m);
  }

  /** Nền dựng bằng code: trời, sao, cực quang, mây, nước lấp lánh. */
  private drawBackdrop(dt: number, m: Mood) {
    const g = this.g;
    g.drawImage(this.bg!, 0, 0);

    for (const s of this.stars) if (Math.sin(this.t * 2 + s.p) > 0.6) R(g, s.x, s.y, 1, 1, '#FFFFFF');
    if (this.aurora) {
      for (let x = 0; x < W; x += 2) {
        const y = 20 + Math.sin(x / 30 + this.t * 0.6) * 8 + Math.sin(x / 11 + this.t) * 3;
        g.globalAlpha = 0.28;
        R(g, x, y, 2, 26 + Math.sin(x / 17 + this.t * 0.8) * 8, x % 6 ? '#5CF2A8' : '#9C7CF2');
      }
      g.globalAlpha = 1;
    }
    for (const c of this.clouds) {
      c.x += dt * c.v * 3;
      if (c.x > W + 4) c.x = -70;
      g.drawImage(c.img, Math.round(c.x), Math.round(c.y));
    }
    // Nước lấp lánh: vài vệt sáng chạy ngang.
    if (this.waterBottom > this.waterTop) {
      for (let i = 0; i < 26; i++) {
        const y = this.waterTop + 2 + ((i * 7) % (this.waterBottom - this.waterTop - 2));
        const x = (i * 53 + Math.floor(this.t * 12 * (i % 2 ? 1 : -1))) % W;
        R(g, (x + W) % W, y, 3 + (i % 4), 1, m.lit > 0.2 ? (i % 3 ? '#FFD98A' : '#FFFFFF') : mix('#FFFFFF', m.horizon, 0.4));
      }
    }
  }

  /** Góc ngắm từ ngoài: dây điện, cột, ray và đoàn tàu. */
  private outsideForeground(dt: number, m: Mood) {
    const g = this.g;
    // Dây điện + cột (trôi nhanh, gần mắt nhất).
    const wire = shade(m, '#2A2F3A');
    R(g, 0, 92, W, 1, wire);
    const poleGap = 150;
    const px = -(this.scroll * 1.6) % poleGap;
    for (let x = px; x < W + 10; x += poleGap) {
      R(g, x, 88, 3, RAIL - 88, wire);
      R(g, x - 8, 91, 19, 2, wire);
      R(g, x - 8, 93, 1, 2, wire);
      R(g, x + 10, 93, 1, 2, wire);
    }
    // Nền đá + ray.
    R(g, 0, RAIL, W, H - RAIL, shade(m, '#3A3F4A'));
    R(g, 0, RAIL + 1, W, 2, shade(m, '#9AA3AE'));
    const sx = -(this.scroll * 2) % 8;
    for (let x = sx; x < W; x += 8) R(g, x, RAIL + 4, 5, 2, shade(m, '#5A4A3E'));
    for (let x = (-(this.scroll * 2) % 5) + 2; x < W; x += 5) R(g, x, RAIL + 9 + ((x | 0) % 3), 1, 1, shade(m, '#6A707C'));
    // Đoàn tàu: đứng giữa khung, nhún 1 điểm ảnh theo nhịp ray.
    const tx = Math.round((W - this.train!.width) / 2);
    const bob = this.speed > 0.05 && Math.sin(this.t * 9) > 0.7 ? 1 : 0;
    g.drawImage(this.train!, tx, RAIL - 28 + bob);
    this.weatherAndTransition(dt);
  }

  /** Mưa / tuyết rơi + màn tối chuyển ga (dùng cho cả hai góc nhìn). */
  private weatherAndTransition(dt: number) {
    const g = this.g;
    if (this.drops.length) {
      const rain = this.key.endsWith('rain');
      g.fillStyle = rain ? 'rgba(200,215,235,0.55)' : 'rgba(255,255,255,0.9)';
      for (const d of this.drops) {
        if (rain) {
          d.y += dt * 260 * d.v;
          d.x -= dt * 60 * d.v + this.speed * dt * 30;
          g.fillRect(Math.round(d.x), Math.round(d.y), 1, 4 + d.s);
        } else {
          d.y += dt * 22 * d.v;
          d.x += Math.sin(this.t + d.y / 20) * dt * 8 - this.speed * dt * 14;
          g.fillRect(Math.round(d.x), Math.round(d.y), d.s, d.s);
        }
        if (d.y > H) {
          d.y = -6;
          d.x = Math.random() * (W + 40);
        }
        if (d.x < -6) d.x += W + 6;
      }
    }
    // Chuyển ga: tàu chui hầm — tối dần, đổi cảnh, sáng dần.
    if (this.trans) {
      const waiting = !this.trans.next && this.photoPending && this.t - this.pendingSince < 3;
      this.trans.p = waiting ? Math.min(this.trans.p + dt / 1.4, 0.5) : this.trans.p + dt / 1.4;
      const p = this.trans.p;
      if (p >= 0.5 && this.trans.next) {
        const n = this.trans.next;
        this.trans.next = null;
        n();
      }
      const a = p < 0.5 ? p * 2 : Math.max(0, 2 - p * 2);
      g.globalAlpha = Math.min(1, a);
      R(g, 0, 0, W, H, '#07080E');
      g.globalAlpha = 1;
      if (p >= 1) this.trans = null;
    }
  }
}
