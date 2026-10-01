/**
 * ÁNH SÁNG: nhân (multiply) một màu môi trường theo giờ địa phương lên cảnh, kèm mặt nạ
 * quầng sáng quanh đèn / cửa. Làm ở độ phân giải thấp (bằng bộ đệm cảnh) nên rẻ; không blur.
 * Ban ngày không có gì để làm → bỏ qua hoàn toàn.
 */
import { hexToRgb, type Ambient } from '@/data/travel/palettes';
import { daylight } from '@/services/travel/clock';
import type { WeatherPlan } from '@/services/travel/types';
import { ctx2d, makeCanvas, type Atlas } from './Atlas';

export type RGB = [number, number, number];

const cacheRgb = new Map<string, RGB>();
function rgb(hex: string): RGB {
  let v = cacheRgb.get(hex);
  if (!v) {
    v = hexToRgb(hex);
    cacheRgb.set(hex, v);
  }
  return v;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
function mixRgb(a: RGB, b: RGB, t: number, out: RGB): RGB {
  out[0] = lerp(a[0], b[0], t);
  out[1] = lerp(a[1], b[1], t);
  out[2] = lerp(a[2], b[2], t);
  return out;
}

const tmpA: RGB = [255, 255, 255];

/** Màu môi trường tại giờ `hour` (0..24). Ghi vào `out`, không cấp phát. */
export function ambientAt(hour: number, amb: Ambient, weather: WeatherPlan | undefined, out: RGB): RGB {
  const l = daylight(hour);
  const twilight = rgb(hour < 12 ? amb.dawn : amb.dusk);
  const day = rgb(amb.day);
  const night = rgb(amb.night);
  // 0..0.5: đêm → hoàng hôn/bình minh; 0.5..1: → ban ngày
  if (l < 0.5) mixRgb(night, twilight, l * 2, tmpA);
  else mixRgb(twilight, day, (l - 0.5) * 2, tmpA);
  out[0] = tmpA[0];
  out[1] = tmpA[1];
  out[2] = tmpA[2];
  if (weather && weather.intensity > 0) {
    const k = weather.kind;
    if (k === 'rain' || k === 'drizzle' || k === 'shower-evening') {
      const t = Math.min(0.5, weather.intensity * 0.55);
      out[0] = lerp(out[0], out[0] * 0.8, t);
      out[1] = lerp(out[1], out[1] * 0.86, t);
      out[2] = lerp(out[2], out[2] * 0.96, t);
    } else if (k === 'fog') {
      out[0] = lerp(out[0], 215, 0.25);
      out[1] = lerp(out[1], 222, 0.25);
      out[2] = lerp(out[2], 228, 0.25);
    }
  }
  return out;
}

export type Light = { x: number; y: number; r: number; warm: number };

export class Lighting {
  private canvas: ReturnType<typeof makeCanvas> | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private w = 0;
  private h = 0;

  resize(w: number, h: number) {
    if (w === this.w && h === this.h && this.canvas) return;
    this.w = w;
    this.h = h;
    this.canvas = makeCanvas(w, h);
    this.ctx = ctx2d(this.canvas);
  }

  /**
   * `lights` đã tính theo toạ độ MÀN HÌNH (điểm nguồn). `strength` 0..1: độ mạnh quầng sáng
   * (thường = độ tối). Trả về true nếu đã làm gì đó.
   */
  apply(target: CanvasRenderingContext2D, amb: RGB, lights: readonly Light[], nLights: number, strength: number, atlas: Atlas): boolean {
    const bright = amb[0] > 249 && amb[1] > 249 && amb[2] > 249;
    if (bright) return false;
    const lc = this.ctx!;
    lc.globalCompositeOperation = 'source-over';
    lc.globalAlpha = 1;
    lc.fillStyle = `rgb(${amb[0] | 0},${amb[1] | 0},${amb[2] | 0})`;
    lc.fillRect(0, 0, this.w, this.h);
    if (strength > 0.05 && nLights > 0) {
      lc.globalCompositeOperation = 'lighter';
      lc.globalAlpha = Math.min(1, strength * 1.3);
      for (let i = 0; i < nLights; i++) {
        const L = lights[i]!;
        const g = atlas.glow(L.r, L.warm > 0);
        lc.drawImage(g.src as CanvasImageSource, (L.x - L.r) | 0, (L.y - L.r) | 0);
      }
      lc.globalAlpha = 1;
    }
    target.globalCompositeOperation = 'multiply';
    target.drawImage(this.canvas as CanvasImageSource, 0, 0);
    target.globalCompositeOperation = 'source-over';
    return true;
  }

  /** Quầng sáng cộng lên cảnh sau khi nhân (bloom nhẹ ở đèn). */
  bloom(target: CanvasRenderingContext2D, lights: readonly Light[], nLights: number, strength: number, atlas: Atlas) {
    if (strength < 0.2 || nLights === 0) return;
    target.globalCompositeOperation = 'lighter';
    target.globalAlpha = Math.min(0.28, strength * 0.3);
    for (let i = 0; i < nLights; i++) {
      const L = lights[i]!;
      const r = Math.max(6, (L.r * 0.45) | 0);
      const g = atlas.glow(r, L.warm > 0);
      target.drawImage(g.src as CanvasImageSource, (L.x - r) | 0, (L.y - r) | 0);
    }
    target.globalAlpha = 1;
    target.globalCompositeOperation = 'source-over';
  }
}
