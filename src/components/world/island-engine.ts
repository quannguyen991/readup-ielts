/**
 * MAP TRONG ĐẢO — màn cuộn ngang pixel, nhiệm vụ là các bệ đá dọc một con đường.
 * CHỈ CHẠY TRÊN WEB; canvas độ phân giải thấp phóng bằng `image-rendering: pixelated`.
 *
 * Mỗi đảo một chủ đề vẽ bằng code, nhiều lớp nền trôi lệch tốc độ (parallax):
 *   math      thành phố số: tháp đèn, ký hiệu toán bay lơ lửng
 *   verbal    thư viện hoàng hôn: kệ sách, chữ cái bay
 *   vocab     rừng đêm: rặng thông, đom đóm, hoa
 *   listen    đồi sóng radio: cột ăng-ten, vòng sóng lan
 *   translate bờ biển: sóng nước, hải đăng quét đèn, cầu tàu
 *   arena     vùng núi lửa: đỉnh phun, tàn lửa bay, đuốc
 *
 * Bệ đã xong có ngôi sao vàng; bệ nên làm tiếp có mũi tên nhún. Phím ←/→ (A/D)
 * sang bệ bên cạnh, bấm vào bệ thì tự đi tới.
 */
import type { IslandId } from '@/services/world/islands';
import { drawHero, drawNumber, mixHex, rgba, rng } from './pixel-kit';

export type IslandHandle = {
  update: (done: boolean[]) => void;
  goTo: (index: number) => void;
  dispose: () => void;
};

type Theme = {
  sky: [string, string];
  far: string;
  near: string;
  ground: string;
  groundTop: string;
  accent: string;
};

const THEMES: Record<IslandId, Theme> = {
  math: { sky: ['#0b1030', '#2a2a78'], far: '#1c1f55', near: '#2d2f7a', ground: '#23245e', groundTop: '#6366f1', accent: '#a5b4fc' },
  verbal: { sky: ['#2b0f2e', '#b84a62'], far: '#4a1d3f', near: '#6e2a4f', ground: '#2B2350', groundTop: '#c0845a', accent: '#fda4af' },
  vocab: { sky: ['#06170f', '#14432c'], far: '#0c2a1c', near: '#123d27', ground: '#1f3d1a', groundTop: '#4ade80', accent: '#fde047' },
  listen: { sky: ['#06202e', '#1b6f8c'], far: '#0e3b4f', near: '#15546e', ground: '#1d3b3a', groundTop: '#5eead4', accent: '#7dd3fc' },
  translate: { sky: ['#0a1433', '#3b4f9a'], far: '#1b2a5c', near: '#243a78', ground: '#6b4a2f', groundTop: '#c9a36b', accent: '#fde68a' },
  arena: { sky: ['#1a0610', '#5a1426'], far: '#2e0a18', near: '#4a1020', ground: '#2a1414', groundTop: '#f97316', accent: '#fb923c' },
};

const GAP = 62;
const START = 70;

export function mountIsland(
  canvas: HTMLCanvasElement,
  id: IslandId,
  initialDone: boolean[],
  opts: { onSelect: (index: number | null) => void; start: number },
): IslandHandle {
  const ctx = canvas.getContext('2d')!;
  const theme = THEMES[id];
  let done = initialDone;
  let W = 400;
  let H = 232;

  const layout = () => {
    const box = canvas.parentElement!.getBoundingClientRect();
    const aspect = Math.max(0.45, box.width / Math.max(1, box.height));
    H = 232;
    W = Math.round(H * aspect);
    canvas.width = W;
    canvas.height = H;
    ctx.imageSmoothingEnabled = false;
  };
  layout();

  const groundY = () => Math.round(H * 0.74);
  const nodeX = (i: number) => START + i * GAP;
  const nodeY = (i: number) => groundY() - 16 + Math.round(Math.sin(i * 1.1) * 12);
  const worldW = () => nodeX(done.length - 1) + START;

  // ---------------------------------------------------------------- di chuyển
  let s = Math.max(0, Math.min(opts.start, done.length - 1));
  let target = s;
  let facing = 1;
  let walking = false;
  let selected: number | null = null;
  let camX = 0;

  const select = (v: number | null) => {
    if (v === selected) return;
    selected = v;
    opts.onSelect(v);
  };

  const step = (dt: number) => {
    walking = false;
    if (s !== target) {
      walking = true;
      const dir = Math.sign(target - s);
      facing = dir;
      s += dir * Math.min(Math.abs(target - s), dt * 2.4);
      select(null);
      if (Math.abs(target - s) < 1e-3) s = target;
    }
    if (s === target) select(target);
  };

  const pos = (f: number) => {
    const i = Math.floor(f);
    const k = f - i;
    const j = Math.min(done.length - 1, i + 1);
    return { x: nodeX(i) + (nodeX(j) - nodeX(i)) * k, y: nodeY(i) + (nodeY(j) - nodeY(i)) * k };
  };

  // ---------------------------------------------------------------- vẽ
  const px = (x: number, y: number, w: number, h: number, c: string) => {
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
  };

  const r0 = rng(id.length * 97 + 5);
  const particles = Array.from({ length: 46 }, () => ({ x: r0(), y: r0(), p: r0() * 6.28, v: 0.3 + r0() }));
  const glyphs = ['+', '-', 'x', '=', '%', '<'];

  /** Một lớp bóng dựng (tháp, cây, đồi…) lặp theo chu kỳ, trôi theo hệ số `f`. */
  const skyline = (f: number, color: string, base: number, seed: number, kind: 'tower' | 'pine' | 'hill' | 'shelf' | 'peak' | 'wave') => {
    const r = rng(seed);
    const period = 360;
    const shapes = Array.from({ length: 12 }, () => ({ x: r() * period, w: 14 + r() * 26, h: 20 + r() * 50, lit: r() }));
    const off = -((camX * f) % period);
    for (let rep = -1; rep <= Math.ceil(W / period) + 1; rep += 1) {
      for (const sh of shapes) {
        const x = Math.round(off + rep * period + sh.x);
        if (x > W + 40 || x + sh.w < -40) continue;
        const top = base - sh.h;
        if (kind === 'tower' || kind === 'shelf') {
          px(x, top, sh.w, sh.h, color);
          const win = kind === 'tower' ? '#fde68a' : mixHex(color, '#ffffff', 0.18);
          for (let yy = top + 4; yy < base - 4; yy += kind === 'tower' ? 6 : 8)
            for (let xx = x + 3; xx < x + sh.w - 3; xx += kind === 'tower' ? 5 : 4)
              if (kind === 'shelf' || ((xx * 7 + yy * 13) % 5 < 2 && sh.lit > 0.3)) px(xx, yy, kind === 'tower' ? 2 : 3, kind === 'tower' ? 2 : 5, kind === 'tower' ? rgba(win, 0.8) : win);
        } else if (kind === 'pine') {
          for (let k = 0; k < sh.h; k += 1) {
            const half = Math.round(((k / sh.h) * sh.w) / 2);
            px(x + sh.w / 2 - half, top + k, half * 2 + 1, 1, color);
          }
        } else if (kind === 'hill' || kind === 'wave') {
          for (let k = 0; k < sh.w * 2; k += 1) {
            const hgt = Math.round(Math.sin((k / (sh.w * 2)) * Math.PI) * sh.h * 0.5);
            px(x + k - sh.w / 2, base - hgt, 1, hgt, color);
          }
        } else if (kind === 'peak') {
          for (let k = 0; k < sh.h; k += 1) {
            const half = Math.round(((k / sh.h) * sh.w * 1.4) / 2);
            px(x + sh.w / 2 - half, top + k, half * 2 + 1, 1, color);
          }
          px(x + sh.w / 2 - 2, top, 4, 3, '#fb923c');
        }
      }
    }
  };

  /** Đĩa tròn màu nền — khoét trăng thành trăng khuyết. */
  const disc2 = (x: number, y: number, rad: number, c: string) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawBackground = (time: number) => {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, theme.sky[0]);
    g.addColorStop(1, theme.sky[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Hạt bay theo chủ đề.
    for (const p of particles) {
      const x = ((p.x * W * 2 - camX * 0.1) % (W * 1.2) + W * 1.2) % (W * 1.2) - W * 0.1;
      if (id === 'vocab' || id === 'arena') {
        const y = ((p.y * H - time * 8 * p.v) % H + H) % H;
        const a = 0.4 + 0.6 * Math.abs(Math.sin(time * 2 + p.p));
        px(x, y, 1, 1, rgba(id === 'vocab' ? '#fde047' : '#fb923c', a));
      } else if (id === 'math' || id === 'verbal') {
        const y = p.y * H * 0.6 + Math.sin(time + p.p) * 3;
        ctx.fillStyle = rgba(theme.accent, 0.35);
        ctx.font = '7px monospace';
        ctx.fillText(id === 'math' ? glyphs[Math.floor(p.p) % glyphs.length]! : String.fromCharCode(65 + (Math.floor(p.p * 4) % 26)), Math.round(x), Math.round(y));
      } else {
        const a = 0.3 + 0.7 * Math.abs(Math.sin(time * 0.8 + p.p));
        px(x, p.y * H * 0.55, 1, 1, `rgba(226,232,255,${a.toFixed(2)})`);
      }
    }

    // Thiên thể lớn của từng chủ đề, trôi rất chậm theo camera (xa nhất).
    const bx = W * 0.72 - camX * 0.04;
    const by = H * 0.24;
    const halo = (c: string, rad: number) => {
      const hg = ctx.createRadialGradient(bx, by, 0, bx, by, rad * 2.6);
      hg.addColorStop(0, rgba(c, 0.35));
      hg.addColorStop(1, rgba(c, 0));
      ctx.fillStyle = hg;
      ctx.fillRect(bx - rad * 3, by - rad * 3, rad * 6, rad * 6);
    };
    const disc = (c: string, rad: number) => {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(bx, by, rad, 0, Math.PI * 2);
      ctx.fill();
    };
    if (id === 'math') {
      halo('#818cf8', 16);
      disc('#6366f1', 16);
      px(bx - 12, by - 4, 10, 3, '#818cf8');
      ctx.strokeStyle = '#c7d2fe';
      ctx.beginPath();
      ctx.ellipse(bx, by, 28, 6, -0.3, 0, Math.PI * 2);
      ctx.stroke();
    } else if (id === 'verbal') {
      halo('#fb923c', 24);
      disc('#fdba74', 24);
      for (let k = 0; k < 4; k += 1) px(bx - 26, by + 4 + k * 5, 52, 2, theme.sky[1]);
    } else if (id === 'vocab' || id === 'listen') {
      halo('#e2e8f0', 12);
      disc('#f1f5f9', 12);
      if (id === 'vocab') disc2(bx + 5, by - 3, 11, mixHex(theme.sky[0], theme.sky[1], 0.22));
    } else if (id === 'arena') {
      halo('#ef4444', 18);
      disc('#b91c1c', 18);
      px(bx - 6, by - 5, 5, 4, '#991b1b');
      px(bx + 4, by + 3, 4, 3, '#991b1b');
    }

    if (id === 'translate') {
      // Trăng + tia hải đăng quét qua bầu trời.
      ctx.fillStyle = '#F3F0FB';
      ctx.beginPath();
      ctx.arc(W * 0.8, H * 0.18, 9, 0, Math.PI * 2);
      ctx.fill();
      const ang = Math.sin(time * 0.6) * 0.5;
      ctx.fillStyle = 'rgba(253,230,138,0.10)';
      ctx.beginPath();
      ctx.moveTo(W * 0.15, H * 0.34);
      ctx.lineTo(W * 0.15 + Math.cos(ang) * W, H * 0.34 + Math.sin(ang) * W * 0.4 - 30);
      ctx.lineTo(W * 0.15 + Math.cos(ang) * W, H * 0.34 + Math.sin(ang) * W * 0.4 + 30);
      ctx.fill();
    }
    if (id === 'listen') {
      for (let k = 0; k < 3; k += 1) {
        const rr = ((time * 20 + k * 30) % 90) + 4;
        ctx.strokeStyle = rgba('#7dd3fc', Math.max(0, 0.5 - rr / 180));
        ctx.beginPath();
        ctx.arc(W * 0.7 - camX * 0.2, H * 0.3, rr, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    const kinds: Record<IslandId, ['tower' | 'pine' | 'hill' | 'shelf' | 'peak' | 'wave', 'tower' | 'pine' | 'hill' | 'shelf' | 'peak' | 'wave']> = {
      math: ['tower', 'tower'],
      verbal: ['shelf', 'tower'],
      vocab: ['pine', 'pine'],
      listen: ['hill', 'hill'],
      translate: ['wave', 'hill'],
      arena: ['peak', 'peak'],
    };
    const [farKind, nearKind] = kinds[id];
    skyline(0.2, theme.far, groundY() - 20, 3, farKind);
    skyline(0.5, theme.near, groundY() - 6, 9, nearKind);
  };

  const drawGround = (time: number) => {
    const gy = groundY();
    if (id === 'translate') {
      // Mặt nước sóng lăn tăn + cầu tàu gỗ.
      for (let y = gy; y < H; y += 1) px(0, y, W, 1, mixHex('#1e3a8a', '#0b1a4a', (y - gy) / (H - gy)));
      for (let k = 0; k < W; k += 6) px(k + ((time * 10) % 6), gy + 6 + ((k / 6) % 3) * 5, 3, 1, 'rgba(191,219,254,0.6)');
      px(0, gy - 4, W, 4, theme.ground);
      px(0, gy - 4, W, 1, theme.groundTop);
      for (let k = -((camX % 24) + 24); k < W; k += 24) px(k, gy, 2, 12, '#2B2350');
      return;
    }
    px(0, gy, W, H - gy, theme.ground);
    px(0, gy, W, 2, theme.groundTop);
    px(0, gy + 2, W, 1, mixHex(theme.groundTop, theme.ground, 0.5));
    const r = rng(77);
    for (let k = 0; k < 60; k += 1) {
      const x = ((r() * 900 - camX) % 900 + 900) % 900;
      if (x > W) continue;
      px(x, gy + 4 + r() * (H - gy - 6), 2, 1, mixHex(theme.ground, '#000000', 0.25));
    }
    if (id === 'arena') {
      // Vệt dung nham phát sáng dưới mặt đất.
      const glow = 0.4 + 0.3 * Math.sin(time * 2);
      px(0, H - 6, W, 6, rgba('#f97316', glow));
    }
  };

  /** Đồ trang trí bám đường, theo chủ đề — trôi cùng mặt đất. */
  const drawProps = (time: number) => {
    const gy = groundY();
    for (let x0 = START - GAP / 2; x0 < worldW(); x0 += GAP) {
      const x = Math.round(x0 - camX);
      if (x < -20 || x > W + 20) continue;
      const k = Math.round(x0 / GAP);
      switch (id) {
        case 'vocab':
          px(x, gy - 3, 1, 3, '#15803d');
          px(x - 1, gy - 5, 3, 2, k % 2 ? '#f472b6' : '#fde047');
          break;
        case 'verbal':
          px(x, gy - 18, 1, 18, '#2B2350');
          px(x - 2, gy - 21, 5, 3, rgba('#fde68a', 0.6 + 0.4 * Math.sin(time * 3 + k)));
          break;
        case 'math':
          px(x - 2, gy - 4, 4, 4, rgba('#818cf8', 0.5 + 0.5 * Math.sin(time * 2 + k)));
          break;
        case 'listen':
          px(x, gy - 12, 1, 12, '#94a3b8');
          px(x - 1, gy - 13, 3, 1, Math.floor(time * 2 + k) % 2 ? '#f87171' : '#7f1d1d');
          break;
        case 'translate':
          px(x - 2, gy + 6 + Math.round(Math.sin(time * 2 + k) * 1.5), 4, 3, '#ef4444');
          break;
        case 'arena': {
          px(x, gy - 10, 2, 10, '#57534e');
          const fl = Math.floor(time * 8 + k) % 3;
          px(x - 1, gy - 13 - fl, 4, 3 + fl, fl ? '#f97316' : '#fde047');
          break;
        }
      }
    }
  };

  const drawPath = () => {
    for (let i = 0; i < done.length - 1; i += 1) {
      const a = { x: nodeX(i), y: nodeY(i) };
      const b = { x: nodeX(i + 1), y: nodeY(i + 1) };
      for (let t = 0.12; t < 0.9; t += 0.09) {
        const x = a.x + (b.x - a.x) * t - camX;
        if (x < -4 || x > W + 4) continue;
        px(x - 1, a.y + (b.y - a.y) * t + 2, 3, 2, done[i] ? rgba(theme.groundTop, 0.9) : 'rgba(226,232,240,0.35)');
      }
    }
  };

  const nextIdx = () => done.findIndex((d) => !d);

  const drawNodes = (time: number) => {
    const nx = nextIdx();
    done.forEach((isDone, i) => {
      const x = nodeX(i) - camX;
      if (x < -30 || x > W + 30) return;
      const y = nodeY(i);
      // Bệ đá.
      px(x - 9, y, 18, 5, isDone ? mixHex(theme.groundTop, '#ffffff', 0.15) : '#64748b');
      px(x - 8, y + 5, 16, 3, isDone ? mixHex(theme.groundTop, '#000000', 0.35) : '#334155');
      px(x - 9, y, 18, 1, 'rgba(255,255,255,0.35)');
      drawNumber(ctx, String(i + 1), x, y + 1, isDone ? '#1f1530' : '#e2e8f0');
      if (isDone) {
        // Sao vàng nhún nhẹ.
        const b = Math.round(Math.sin(time * 3 + i) * 1.5);
        const sy = y - 12 + b;
        px(x - 1, sy - 3, 2, 8, '#fde047');
        px(x - 4, sy, 8, 2, '#fde047');
        px(x - 2, sy - 1, 4, 4, '#facc15');
        px(x - 1, sy, 1, 1, '#ffffff');
      } else if (i === nx) {
        // Nhiệm vụ nên làm tiếp: quầng sáng + mũi tên nhún.
        ctx.fillStyle = rgba(theme.accent, 0.25 + 0.15 * Math.sin(time * 4));
        ctx.beginPath();
        ctx.ellipse(x, y + 3, 14, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        const b = Math.round(Math.abs(Math.sin(time * 4)) * 3);
        px(x - 3, y - 16 - b, 6, 2, theme.accent);
        px(x - 2, y - 14 - b, 4, 2, theme.accent);
        px(x - 1, y - 12 - b, 2, 2, theme.accent);
      } else {
        px(x, y - 9, 1, 9, '#94a3b8');
        px(x + 1, y - 9, 4, 3, rgba(theme.accent, 0.5));
      }
      if (selected === i) {
        ctx.strokeStyle = rgba('#fde047', 0.6 + 0.4 * Math.abs(Math.sin(time * 4)));
        ctx.strokeRect(Math.round(x) - 11.5, y - 1.5, 23, 10);
      }
    });
  };

  let raf = 0;
  let last = 0;
  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    if (document.hidden) return;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    const time = now / 1000;
    step(dt);
    const p = pos(s);
    const want = Math.max(0, Math.min(worldW() - W, p.x - W / 2));
    camX += (want - camX) * Math.min(1, dt * 6);

    drawBackground(time);
    drawGround(time);
    drawPath();
    drawProps(time);
    drawNodes(time);
    drawHero(ctx, p.x - camX, p.y, facing, walking, time);
  };
  // Camera đặt sẵn đúng chỗ, không trượt từ đầu map tới.
  camX = Math.max(0, Math.min(worldW() - W, pos(s).x - W / 2));
  raf = requestAnimationFrame(frame);

  // ---------------------------------------------------------------- điều khiển
  const onKey = (e: KeyboardEvent) => {
    const el = e.target as HTMLElement | null;
    if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (k === 'ArrowRight' || k === 'd') {
      e.preventDefault();
      target = Math.min(done.length - 1, Math.round(target) + 1);
    } else if (k === 'ArrowLeft' || k === 'a') {
      e.preventDefault();
      target = Math.max(0, Math.round(target) - 1);
    }
  };
  const onClick = (e: MouseEvent) => {
    const box = canvas.getBoundingClientRect();
    const x = ((e.clientX - box.left) / box.width) * W + camX;
    const y = ((e.clientY - box.top) / box.height) * H;
    const i = Math.round((x - START) / GAP);
    if (i >= 0 && i < done.length && Math.abs(x - nodeX(i)) < 16 && Math.abs(y - nodeY(i)) < 26) target = i;
  };
  window.addEventListener('keydown', onKey);
  canvas.addEventListener('click', onClick);
  const ro = new ResizeObserver(layout);
  ro.observe(canvas.parentElement!);

  return {
    update: (next) => {
      done = next;
    },
    goTo: (i) => {
      target = Math.max(0, Math.min(done.length - 1, i));
    },
    dispose: () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
      canvas.removeEventListener('click', onClick);
      ro.disconnect();
    },
  };
}
