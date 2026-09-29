/**
 * Hoạ tiết vẽ bằng canvas cho Thành phố Tri thức — không tải ảnh ngoài, nên
 * cả thành phố chỉ nặng bằng mã. Mỗi hoạ tiết được CACHE theo khoá: hai tòa
 * cùng kiểu dùng chung một ảnh, không tốn thêm bộ nhớ đồ hoạ.
 *
 * Mặt tiền có HAI ảnh: `map` (tường + cửa kính ban ngày) và `emissive` (ô cửa
 * sáng đèn). Cường độ ảnh sáng đèn do cảnh chỉnh theo giờ: ngày 0, đêm đầy.
 */
import * as THREE from 'three';

const cache = new Map<string, THREE.Texture>();

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')!];
}

function finish(c: HTMLCanvasElement, srgb = true): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  t.needsUpdate = true;
  return t;
}

/** Số giả ngẫu nhiên lặp lại được theo hạt — cùng khoá luôn ra cùng một mặt tiền. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export type Facade = { map: THREE.Texture; emissive: THREE.Texture };

/**
 * Mặt tiền tường có ô cửa: `cols × rows` ô, mỗi ô 48px. `glass` là màu kính,
 * `frame` màu khung. `lit` = tỉ lệ ô sáng đèn ban đêm.
 */
export function windowFacade(opts: {
  cols: number;
  rows: number;
  wall: string;
  glass: string;
  frame: string;
  lit?: number;
  /** Tầng trệt là cửa hàng kính lớn (nhà phố, chung cư). */
  shopFront?: boolean;
  /** Ô cửa hẹp theo chiều ngang (nhà ở) hay rộng (văn phòng). */
  windowW?: number;
  seed?: number;
}): Facade {
  const key = `win|${JSON.stringify(opts)}`;
  const hit = cache.get(key);
  if (hit) return { map: hit, emissive: cache.get(`${key}|e`)! };
  const cell = 48;
  const W = opts.cols * cell;
  const H = opts.rows * cell;
  const [c, g] = canvas(W, H);
  const [ce, ge] = canvas(W, H);
  const r = rng(opts.seed ?? hash(key));
  g.fillStyle = opts.wall;
  g.fillRect(0, 0, W, H);
  // nhiễu nhẹ cho tường khỏi phẳng lì
  for (let i = 0; i < (W * H) / 90; i++) {
    g.fillStyle = `rgba(0,0,0,${r() * 0.035})`;
    g.fillRect(r() * W, r() * H, 2, 2);
  }
  ge.fillStyle = '#000';
  ge.fillRect(0, 0, W, H);
  const ww = cell * (opts.windowW ?? 0.56);
  const wh = cell * 0.62;
  for (let row = 0; row < opts.rows; row++) {
    const ground = opts.shopFront && row === opts.rows - 1;
    // vạch sàn giữa các tầng
    g.fillStyle = 'rgba(0,0,0,0.07)';
    g.fillRect(0, row * cell, W, 2);
    for (let col = 0; col < opts.cols; col++) {
      const x = col * cell + (cell - ww) / 2;
      const y = row * cell + (cell - wh) / 2 - 2;
      const w = ground ? cell - 6 : ww;
      const h = ground ? cell - 8 : wh;
      const gx = ground ? col * cell + 3 : x;
      const gy = ground ? row * cell + 6 : y;
      g.fillStyle = opts.frame;
      g.fillRect(gx - 3, gy - 3, w + 6, h + 6);
      const grad = g.createLinearGradient(gx, gy, gx + w, gy + h);
      grad.addColorStop(0, opts.glass);
      grad.addColorStop(1, shade(opts.glass, -0.28));
      g.fillStyle = grad;
      g.fillRect(gx, gy, w, h);
      // vệt phản chiếu chéo
      g.fillStyle = 'rgba(255,255,255,0.22)';
      g.beginPath();
      g.moveTo(gx + w * 0.15, gy + h);
      g.lineTo(gx + w * 0.45, gy);
      g.lineTo(gx + w * 0.6, gy);
      g.lineTo(gx + w * 0.3, gy + h);
      g.fill();
      if (!ground) {
        g.fillStyle = opts.frame;
        g.fillRect(gx + w / 2 - 1, gy, 2, h);
      }
      if (ground || r() < (opts.lit ?? 0.4)) {
        const warm = r() < 0.8;
        ge.fillStyle = warm ? `rgba(255,${200 + Math.floor(r() * 30)},${130 + Math.floor(r() * 50)},1)` : 'rgba(190,220,255,1)';
        ge.fillRect(gx, gy, w, h);
      }
    }
  }
  const map = finish(c);
  const emissive = finish(ce);
  cache.set(key, map);
  cache.set(`${key}|e`, emissive);
  return { map, emissive };
}

/** Mặt kính của tòa chọc trời: đố dọc, vạch tầng, dải kính chuyển màu theo chiều cao. */
export function glassFacade(opts: { cols: number; rows: number; tint: string; mullion: string; lit?: number; seed?: number }): Facade {
  const key = `glass|${JSON.stringify(opts)}`;
  const hit = cache.get(key);
  if (hit) return { map: hit, emissive: cache.get(`${key}|e`)! };
  const cw = 28;
  const ch = 36;
  const W = opts.cols * cw;
  const H = opts.rows * ch;
  const [c, g] = canvas(W, H);
  const [ce, ge] = canvas(W, H);
  const r = rng(opts.seed ?? hash(key));
  const grad = g.createLinearGradient(0, 0, W * 0.3, H);
  grad.addColorStop(0, shade(opts.tint, 0.28));
  grad.addColorStop(0.5, opts.tint);
  grad.addColorStop(1, shade(opts.tint, -0.22));
  g.fillStyle = grad;
  g.fillRect(0, 0, W, H);
  ge.fillStyle = '#000';
  ge.fillRect(0, 0, W, H);
  for (let row = 0; row < opts.rows; row++) {
    for (let col = 0; col < opts.cols; col++) {
      // mỗi tấm kính lệch sắc một chút như kính thật
      g.fillStyle = `rgba(255,255,255,${r() * 0.08})`;
      g.fillRect(col * cw, row * ch, cw, ch);
      if (r() < (opts.lit ?? 0.3)) {
        ge.fillStyle = r() < 0.7 ? 'rgba(255,226,170,1)' : 'rgba(200,228,255,1)';
        ge.fillRect(col * cw + 3, row * ch + 5, cw - 6, ch - 10);
      }
    }
  }
  g.fillStyle = opts.mullion;
  for (let col = 0; col <= opts.cols; col++) g.fillRect(col * cw - 1.5, 0, 3, H);
  for (let row = 0; row <= opts.rows; row++) g.fillRect(0, row * ch - 2, W, 4);
  const map = finish(c);
  const emissive = finish(ce);
  cache.set(key, map);
  cache.set(`${key}|e`, emissive);
  return { map, emissive };
}

/** Mặt đường nhựa có vạch giữa đứt quãng — lặp theo chiều dài đường. */
export function roadTexture(): THREE.Texture {
  const key = 'road';
  const hit = cache.get(key);
  if (hit) return hit;
  const [c, g] = canvas(64, 256);
  g.fillStyle = '#4B5260';
  g.fillRect(0, 0, 64, 256);
  const r = rng(7);
  for (let i = 0; i < 900; i++) {
    g.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '255,255,255'},${r() * 0.07})`;
    g.fillRect(r() * 64, r() * 256, 2, 2);
  }
  g.fillStyle = '#F5F0E1';
  g.fillRect(30, 20, 4, 90);
  g.fillRect(30, 148, 4, 90);
  g.fillStyle = 'rgba(255,255,255,0.55)';
  g.fillRect(3, 0, 2, 256);
  g.fillRect(59, 0, 2, 256);
  const t = finish(c);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  cache.set(key, t);
  return t;
}

/** Cỏ có lốm đốm sáng tối. */
export function grassTexture(): THREE.Texture {
  const key = 'grass';
  const hit = cache.get(key);
  if (hit) return hit;
  const [c, g] = canvas(256, 256);
  g.fillStyle = '#8CC063';
  g.fillRect(0, 0, 256, 256);
  const r = rng(11);
  for (let i = 0; i < 2600; i++) {
    const v = r();
    g.fillStyle = v < 0.5 ? `rgba(60,110,40,${r() * 0.18})` : `rgba(210,240,150,${r() * 0.18})`;
    g.fillRect(r() * 256, r() * 256, 1 + r() * 3, 1 + r() * 3);
  }
  const t = finish(c);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  cache.set(key, t);
  return t;
}

/** Gạch lát vỉa hè / quảng trường. */
export function pavingTexture(color = '#E7E1D6'): THREE.Texture {
  const key = `pave|${color}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const [c, g] = canvas(128, 128);
  g.fillStyle = color;
  g.fillRect(0, 0, 128, 128);
  const r = rng(3);
  for (let y = 0; y < 128; y += 16) {
    for (let x = 0; x < 128; x += 32) {
      const off = (y / 16) % 2 ? 16 : 0;
      g.fillStyle = `rgba(0,0,0,${0.02 + r() * 0.05})`;
      g.fillRect(x + off, y, 31, 15);
    }
  }
  g.strokeStyle = 'rgba(0,0,0,0.12)';
  for (let y = 0; y <= 128; y += 16) {
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(128, y);
    g.stroke();
  }
  const t = finish(c);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  cache.set(key, t);
  return t;
}

/** Làm sáng (+) hoặc tối (−) một màu hex. */
export function shade(hex: string, amt: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(amt >= 0 ? v + (255 - v) * amt : v * (1 + amt))));
  const r = ch((n >> 16) & 255);
  const g = ch((n >> 8) & 255);
  const b = ch(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export function disposeTextures(): void {
  cache.forEach((t) => t.dispose());
  cache.clear();
}
