/**
 * HẠT: một bể cố định ≤ 150 hạt, mảng phẳng (không cấp phát trong vòng lặp nóng).
 * Mưa vẽ theo toạ độ MÀN HÌNH (lặp quanh khung nhìn), mọi loại khác theo toạ độ thế giới.
 */
export const MAX_PARTICLES = 150;

export const PK = { Rain: 1, Splash: 2, Dust: 3, Sparkle: 4, Coin: 5, Spark: 6, Leaf: 7, Ring: 8 } as const;
export type PKind = (typeof PK)[keyof typeof PK];

export class Particles {
  readonly x = new Float32Array(MAX_PARTICLES);
  readonly y = new Float32Array(MAX_PARTICLES);
  readonly vx = new Float32Array(MAX_PARTICLES);
  readonly vy = new Float32Array(MAX_PARTICLES);
  readonly life = new Float32Array(MAX_PARTICLES);
  readonly max = new Float32Array(MAX_PARTICLES);
  readonly kind = new Uint8Array(MAX_PARTICLES);
  readonly tint = new Uint8Array(MAX_PARTICLES);
  n = 0;
  /** Số hạt mưa đang sống, để giới hạn riêng (mưa ≤ 90). */
  rain = 0;

  clear() {
    this.n = 0;
    this.rain = 0;
  }

  emit(kind: PKind, x: number, y: number, vx: number, vy: number, life: number, tint = 0): boolean {
    if (this.n >= MAX_PARTICLES) return false;
    if (kind === PK.Rain && this.rain >= 90) return false;
    const i = this.n++;
    this.x[i] = x;
    this.y[i] = y;
    this.vx[i] = vx;
    this.vy[i] = vy;
    this.life[i] = life;
    this.max[i] = life;
    this.kind[i] = kind;
    this.tint[i] = tint;
    if (kind === PK.Rain) this.rain++;
    return true;
  }

  update(dt: number, gravity = 0) {
    let i = 0;
    while (i < this.n) {
      this.life[i]! -= dt;
      if (this.life[i]! <= 0) {
        this.remove(i);
        continue;
      }
      this.x[i]! += this.vx[i]! * dt;
      this.y[i]! += this.vy[i]! * dt;
      const k = this.kind[i]!;
      if (k === PK.Spark) this.vy[i]! += (gravity || 60) * dt;
      else if (k === PK.Dust) {
        this.vx[i]! *= 0.9;
        this.vy[i]! *= 0.9;
      } else if (k === PK.Coin) this.vy[i]! += 120 * dt;
      i++;
    }
  }

  private remove(i: number) {
    if (this.kind[i] === PK.Rain) this.rain--;
    const last = --this.n;
    if (i !== last) {
      this.x[i] = this.x[last]!;
      this.y[i] = this.y[last]!;
      this.vx[i] = this.vx[last]!;
      this.vy[i] = this.vy[last]!;
      this.life[i] = this.life[last]!;
      this.max[i] = this.max[last]!;
      this.kind[i] = this.kind[last]!;
      this.tint[i] = this.tint[last]!;
    }
  }
}
