/**
 * ATLAS: sinh một lần, theo thành phố, mọi hình để vẽ (ô đất, sprite, mặt tiền, quầng đèn)
 * từ lưới ký tự + bảng màu thành phố; và nạp ảnh PNG/WebP ngoài (`registerImage`) đè lên
 * sprite cùng mã (tranh AI / hoạ sĩ) — khi KHÔNG có ảnh thì dùng hình vẽ bằng mã.
 *
 * Mọi bitmap là canvas (OffscreenCanvas nếu có) vẽ ở độ phân giải NGUỒN (1 điểm = 1 pixel
 * art). Việc phóng to số nguyên và `imageSmoothingEnabled=false` do bộ vẽ lo; Atlas không
 * bao giờ phóng/thu lẻ — trừ bước thu nhỏ ảnh ngoài về cỡ sprite (`registerImage`) ở đúng
 * một lần, lúc nạp, bằng trung bình khối rồi ép bảng màu.
 */
import { getPalette, hexToRgb, type CityPalette } from '@/data/travel/palettes';
import {
  buildFacade,
  FACADE_VARIANTS,
  foamGrid,
  getSpriteDef,
  isDayNight,
  parseFacadeId,
  tileGrid,
  TILE_VARIANTS,
  type SpriteDef,
  type TileKind,
} from '@/data/travel/sprites';
import type { Grid } from '@/data/travel/sprites/paint';
import { quantiseInPlace, type RGB } from './quantise';

type AnyCanvas = HTMLCanvasElement | OffscreenCanvas;
export type Bitmap = { src: AnyCanvas; w: number; h: number };

export function makeCanvas(w: number, h: number): AnyCanvas {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

export function ctx2d(c: AnyCanvas): CanvasRenderingContext2D {
  const ctx = c.getContext('2d') as CanvasRenderingContext2D;
  ctx.imageSmoothingEnabled = false;
  return ctx;
}

export type ImageOptions = {
  /** Cỡ sprite đích (điểm); ảnh được thu về đúng cỡ này. Bỏ trống: giữ nguyên cỡ ảnh. */
  size?: { w: number; h: number };
  /** Ép về bảng màu thành phố. Mặc định bật khi có `size`. */
  quantise?: boolean;
  dither?: 'none' | 'bayer';
};

/** Alpha của bóng đổ (vai `k`). */
export const SHADOW_ALPHA = 0.3;

export class Atlas {
  readonly pal: CityPalette;
  private rgb: Record<string, RGB> = {};
  private paletteList: RGB[] = [];
  private cache = new Map<string, Bitmap>();
  private overrides = new Map<string, Bitmap[]>();
  /** Số bitmap đã sinh — để đo/kiểm. */
  generated = 0;

  constructor(readonly cityId: string) {
    this.pal = getPalette(cityId);
    for (const [ch, hex] of Object.entries(this.pal.colors)) this.rgb[ch] = hexToRgb(hex);
    this.paletteList = Object.entries(this.rgb)
      .filter(([ch]) => ch !== 'k')
      .map(([, v]) => v);
  }

  private raster(grid: Grid, w = grid[0]?.length ?? 0, h = grid.length): Bitmap {
    const c = makeCanvas(w, h);
    const ctx = ctx2d(c);
    const img = ctx.createImageData(w, h);
    const d = img.data;
    for (let y = 0; y < h; y++) {
      const row = grid[y]!;
      for (let x = 0; x < w; x++) {
        const ch = row[x] ?? '.';
        if (ch === '.') continue;
        const rgb = this.rgb[ch];
        if (!rgb) continue;
        const i = (y * w + x) * 4;
        d[i] = rgb[0];
        d[i + 1] = rgb[1];
        d[i + 2] = rgb[2];
        d[i + 3] = ch === 'k' ? Math.round(255 * SHADOW_ALPHA) : 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    this.generated++;
    return { src: c, w, h };
  }

  private memo(key: string, make: () => Bitmap): Bitmap {
    let b = this.cache.get(key);
    if (!b) {
      b = make();
      this.cache.set(key, b);
    }
    return b;
  }

  tile(kind: TileKind, variant: number): Bitmap {
    const n = TILE_VARIANTS[kind];
    const v = ((variant % n) + n) % n;
    return this.memo(`t:${kind}:${v}`, () => this.raster(tileGrid(kind, v)));
  }

  foam(side: 'n' | 'e' | 's' | 'w', frame: 0 | 1): Bitmap {
    return this.memo(`f:${side}:${frame}`, () => this.raster(foamGrid(side, frame)));
  }

  /** Khung `frame` của sprite `id` (với biểu tượng ngày/đêm: 0 = ngày, 1 = đêm). */
  sprite(id: string, frame = 0): Bitmap | undefined {
    const ov = this.overrides.get(id);
    if (ov) return ov[Math.min(frame, ov.length - 1)];
    const def = getSpriteDef(id);
    if (!def) return undefined;
    const f = Math.max(0, Math.min(def.frames.length - 1, frame));
    return this.memo(`s:${id}:${f}`, () => this.raster(def.frames[f]!, def.w, def.h));
  }

  spriteDef(id: string): SpriteDef | undefined {
    return getSpriteDef(id);
  }

  frameCount(id: string): number {
    return this.overrides.get(id)?.length ?? getSpriteDef(id)?.frames.length ?? 0;
  }

  hasDayNight(id: string): boolean {
    return isDayNight(id) || (this.overrides.get(id)?.length ?? 0) > 1;
  }

  facade(kind: string, text: string, w: number, h: number, doorCol: number, variant: number, night: boolean): Bitmap {
    const key = `fac:${kind}:${text}:${w}x${h}:${doorCol}:${variant}:${night ? 1 : 0}`;
    return this.memo(key, () => {
      const parsed = parseFacadeId(`fac:${kind}:${text}`);
      if (!parsed) throw new Error(`mặt tiền lạ: ${kind}`);
      const p = buildFacade(parsed.kind, w, h, doorCol, parsed.text, night);
      const vm = FACADE_VARIANTS[variant % FACADE_VARIANTS.length];
      if (vm && Object.keys(vm).length) p.replace(vm);
      return this.raster(p.toRows());
    });
  }

  /** Quầng sáng đèn: vòng tròn pixel chia bậc (không dải mờ), cho lớp ánh sáng cộng. */
  glow(r: number, warm: boolean): Bitmap {
    return this.memo(`g:${r}:${warm ? 1 : 0}`, () => {
      const s = r * 2 + 1;
      const c = makeCanvas(s, s);
      const ctx = ctx2d(c);
      const img = ctx.createImageData(s, s);
      const col: RGB = warm ? [255, 214, 140] : [190, 225, 255];
      for (let y = 0; y < s; y++)
        for (let x = 0; x < s; x++) {
          const d = Math.hypot(x - r, y - r) / r;
          if (d >= 1) continue;
          // 4 bậc sáng, hoà sắc caro ở ranh giới
          const t = 1 - d;
          let lvl = t > 0.66 ? 1 : t > 0.4 ? 0.62 : t > 0.18 ? 0.34 : 0.14;
          const edge = Math.abs(t - 0.66) < 0.05 || Math.abs(t - 0.4) < 0.05 || Math.abs(t - 0.18) < 0.05;
          if (edge && (x + y) % 2 === 0) lvl *= 0.55;
          const i = (y * s + x) * 4;
          img.data[i] = col[0] * lvl;
          img.data[i + 1] = col[1] * lvl;
          img.data[i + 2] = col[2] * lvl;
          img.data[i + 3] = 255;
        }
      ctx.putImageData(img, 0, 0);
      return { src: c, w: s, h: s };
    });
  }

  /**
   * Nạp ảnh PNG/WebP làm sprite `id` (đè hình vẽ bằng mã). Nhiều khung: truyền nhiều URL. Với
   * `size`, ảnh được thu về đúng cỡ (trung bình khối) rồi ép bảng màu + hoà sắc Bayer.
   * Trả về false nếu không tải được — khi đó hình vẽ bằng mã vẫn dùng.
   */
  async registerImage(id: string, urls: string | string[], opts: ImageOptions = {}): Promise<boolean> {
    const list = Array.isArray(urls) ? urls : [urls];
    try {
      const frames: Bitmap[] = [];
      for (const url of list) {
        const img = await loadImage(url);
        const w = opts.size?.w ?? img.naturalWidth;
        const h = opts.size?.h ?? img.naturalHeight;
        const c = makeCanvas(w, h);
        const ctx = ctx2d(c);
        if (opts.size && (img.naturalWidth !== w || img.naturalHeight !== h)) {
          // Thu về cỡ sprite bằng trung bình khối: vẽ vào canvas trung gian cao hơn bội số nguyên rồi lấy mẫu.
          const f = Math.max(1, Math.round(Math.min(img.naturalWidth / w, img.naturalHeight / h)));
          const big = makeCanvas(w * f, h * f);
          const bctx = big.getContext('2d') as CanvasRenderingContext2D;
          bctx.imageSmoothingEnabled = true;
          bctx.imageSmoothingQuality = 'high';
          bctx.drawImage(img, 0, 0, w * f, h * f);
          const bd = bctx.getImageData(0, 0, w * f, h * f).data;
          const out = ctx.createImageData(w, h);
          for (let y = 0; y < h; y++)
            for (let x = 0; x < w; x++) {
              let r = 0;
              let g = 0;
              let b = 0;
              let a = 0;
              for (let j = 0; j < f; j++)
                for (let i = 0; i < f; i++) {
                  const k = ((y * f + j) * w * f + x * f + i) * 4;
                  const al = bd[k + 3]!;
                  r += bd[k]! * al;
                  g += bd[k + 1]! * al;
                  b += bd[k + 2]! * al;
                  a += al;
                }
              const o = (y * w + x) * 4;
              const n = f * f;
              out.data[o] = a ? r / a : 0;
              out.data[o + 1] = a ? g / a : 0;
              out.data[o + 2] = a ? b / a : 0;
              out.data[o + 3] = a / n;
            }
          ctx.putImageData(out, 0, 0);
        } else ctx.drawImage(img, 0, 0);
        if (opts.quantise ?? !!opts.size) {
          const data = ctx.getImageData(0, 0, w, h);
          quantiseInPlace(data.data, w, h, this.paletteList, opts.dither ?? 'bayer');
          ctx.putImageData(data, 0, 0);
        }
        frames.push({ src: c, w, h });
      }
      this.overrides.set(id, frames);
      return true;
    } catch {
      return false;
    }
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => rej(new Error(`không tải được ${url}`));
    img.src = url;
  });
}

const atlases = new Map<string, Atlas>();
/** Atlas theo thành phố, tạo lười, giữ lại để dùng lại khi quay về. */
export function atlasFor(city: string): Atlas {
  let a = atlases.get(city);
  if (!a) {
    a = new Atlas(city);
    atlases.set(city, a);
  }
  return a;
}
