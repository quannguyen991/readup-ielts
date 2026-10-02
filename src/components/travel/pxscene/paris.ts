/** PARIS, hoàng hôn: tháp Eiffel lấp lánh, sông Seine có tàu du lịch, quán cà phê, đèn đường, lá thu rơi. Vẽ hoàn toàn bằng mã. */
import { Gfx, rng } from './gfx';
import { Birds, Clouds, Win, drawNeon, drawWalker, drawWindows, makeWalkers, moveWalkers, reflect, shimmer, windowGrid, type Neon } from './parts';
import { SCENE_H, SCENE_W, type PxScene } from './scene';

const T = 206; // trục tháp
const BASE = 140;
const TOP = 24;
const WATER = 140;
const QUAY = 160;

const halfW = (h: number) => 2 + 27 * (1 - h) ** 2.3;
const yOf = (h: number) => BASE - h * (BASE - TOP);

const CAFE: Neon = { x: 252, y: 150, text: 'CAFE', color: '#FF5C6E', scale: 2, flicker: 1, seed: 3, frame: '#2a0f1a' };

export function makeParis(): PxScene {
  const r0 = rng(14);
  const stars = Array.from({ length: 36 }, () => ({ x: r0() * SCENE_W, y: r0() * 48, ph: r0() * 6, p: 1.5 + r0() * 3 }));
  const clouds = new Clouds(5, 24, 70, '#E58AA8', 0.45, 2.6, 4);
  const birds = new Birds(7, 20, 80, '#2A1B3C', 8);
  const lights = (() => {
    const out: { x: number; y: number; ph: number }[] = [];
    for (let i = 0; i < 90; i += 1) {
      const h = r0();
      const hh = 0.04 + h * 0.94;
      const w = halfW(hh);
      const side = r0() < 0.5 ? -1 : 1;
      out.push({ x: T + side * (w - r0() * 3), y: yOf(hh), ph: r0() * 6 });
    }
    return out;
  })();
  const winRoofs: Win[] = windowGrid(0, 112, 54, 2, 3, 3, 3, 6, ['#FFD98A', '#FFB86A'], 0.35, 22).filter((w) => w.x > 0 && !(w.x > 168 && w.x < 250 && w.y < 140));
  const walkers = makeWalkers(5, 168, 176, ['#E34A5A'], ['#3a2a4e', '#5a3a3a', '#2a3a5a', '#6a4a3a', '#2a2a40'], false, 6);
  const leaves = Array.from({ length: 26 }, () => ({ x: r0() * SCENE_W, y: r0() * SCENE_H, vy: 8 + r0() * 8, ph: r0() * 6, c: ['#D9822B', '#E8B23A', '#B8502A'][Math.floor(r0() * 3)]! }));
  const boat = { x: -60, v: 14 };
  let sparkleAt = 5;

  const buildBack = (g: Gfx) => {
    g.vgrad(0, 134, ['#171048', '#3F2478', '#A44A86', '#F0866E', '#FFD08A'], 14);
    // mặt trời thấp, quầng
    g.disc(60, 118, 16, '#FFE7A8', 0.28);
    g.disc(60, 118, 9, '#FFF0C0');
    g.rect(0, 116, SCENE_W, 22, '#FFB070', 0.18);
    // đường chân trời mái nhà
    const rr = rng(9);
    let x = -4;
    while (x < SCENE_W) {
      const w = 14 + Math.floor(rr() * 12);
      const h = 18 + Math.floor(rr() * 8);
      g.rect(x, WATER - h, w, h, '#3B2F5E');
      g.rect(x, WATER - h, w, 1, '#5A4A80');
      // mái mansard xanh
      g.rect(x - 1, WATER - h - 5, w + 2, 5, '#2A2650');
      g.rect(x + 1, WATER - h - 6, w - 2, 1, '#2A2650');
      if (rr() < 0.55) g.rect(x + 3 + Math.floor(rr() * (w - 8)), WATER - h - 10, 2, 5, '#2A2650');
      x += w;
    }
    // Sacré-Cœur xa
    g.rect(26, 106, 26, 8, '#C9AECC');
    g.disc(39, 106, 6, '#D8BFD8');
    g.disc(30, 108, 2, '#D8BFD8');
    g.disc(48, 108, 2, '#D8BFD8');
    g.rect(38, 97, 2, 3, '#BFA3C2');
    g.rect(26, 112, 26, 2, '#8F7AA6');
    // tháp Eiffel
    const dark = '#26182E';
    for (let y = BASE; y >= TOP; y -= 1) {
      const h = (BASE - y) / (BASE - TOP);
      const w = halfW(h);
      const thick = Math.max(2, 8 * (1 - h) ** 1.2);
      if (h < 0.27) {
        for (let k = 0; k < thick; k += 1) {
          g.px(T - w + k, y, dark);
          g.px(T + w - k, y, dark);
        }
      } else {
        for (let x2 = Math.round(T - w); x2 <= Math.round(T + w); x2 += 1) {
          if (w > 5 && (x2 + y) % 5 === 0 && Math.abs(x2 - T) < w - 1) continue; // lỗ lưới
          g.px(x2, y, dark);
        }
      }
    }
    // vòm dưới tầng một
    const y1 = yOf(0.27);
    for (let a = 0; a < 40; a += 1) {
      const ang = (a / 39) * Math.PI;
      g.px(T - Math.cos(ang) * (halfW(0.12) - 3), y1 + 4 - Math.sin(ang) * 11, dark);
      g.px(T - Math.cos(ang) * (halfW(0.12) - 4), y1 + 5 - Math.sin(ang) * 11, dark);
    }
    g.rect(T - halfW(0.27) - 2, y1, halfW(0.27) * 2 + 5, 3, '#3A2A44');
    g.rect(T - halfW(0.55) - 1, yOf(0.55), halfW(0.55) * 2 + 3, 2, '#3A2A44');
    g.rect(T, TOP - 6, 1, 8, dark);
    // sông + phản chiếu
    g.vgrad(WATER, QUAY, ['#6A4A8A', '#3B2D6B', '#1F1A4A'], 8);
    reflect(g, WATER, QUAY - WATER, 0.55, '#2B2260', 0.35);
    // cầu đá phía trái
    g.rect(0, 126, 150, 7, '#6B5A7E');
    g.rect(0, 126, 150, 1, '#9A86AE');
    g.rect(0, 133, 150, 7, '#4A3B63');
    for (let i = 0; i < 3; i += 1) {
      const cx = 25 + i * 50;
      for (let a = 0; a <= 24; a += 1) {
        const ang = (a / 24) * Math.PI;
        for (let d = 0; d < 9; d += 1) g.px(cx - Math.cos(ang) * 22, 140 - Math.sin(ang) * d * 0.9, '#1F1A4A');
      }
      g.rect(cx - 21, 133, 42, 7, '#4A3B63', 0.0);
    }
    for (let x2 = 0; x2 < 150; x2 += 50) g.rect(x2, 133, 6, 7, '#6B5A7E');
    for (let x2 = 6; x2 < 150; x2 += 24) {
      g.rect(x2, 120, 1, 7, '#1A1236');
      g.rect(x2 - 1, 119, 3, 1, '#1A1236');
    }
  };

  const buildFront = (g: Gfx) => {
    // bờ kè đá + vỉa lát đá cuội
    g.rect(0, QUAY - 3, SCENE_W, 3, '#6B5A7E');
    g.rect(0, QUAY - 3, SCENE_W, 1, '#9A86AE');
    g.vgrad(QUAY, SCENE_H, ['#4A3B63', '#2F2548', '#221A3A'], 6);
    const rr = rng(5);
    for (let i = 0; i < 260; i += 1) g.rect(rr() * SCENE_W, QUAY + 2 + rr() * (SCENE_H - QUAY - 3), 3, 1, '#6B5A7E', 0.4);
    // quán cà phê
    g.rect(232, 146, 80, 14, '#2C203F');
    g.rect(236, 150, 72, 10, '#FFD98A', 0.35);
    for (let i = 0; i < 12; i += 1) g.rect(232 + i * 7, 144, 7, 6, i % 2 ? '#F4ECE0' : '#D9374A');
    g.rect(232, 150, 80, 1, '#8A1F2E');
    for (let i = 0; i < 4; i += 1) {
      const tx = 240 + i * 18;
      g.rect(tx, 168, 8, 1, '#E8DCC8');
      g.rect(tx + 3, 169, 2, 5, '#3A2A44');
      g.rect(tx - 2, 172, 2, 4, '#5A4468');
      g.rect(tx + 8, 172, 2, 4, '#5A4468');
    }
    // cột đèn
    for (const lx of [24, 118, 176, 296]) {
      g.rect(lx, 132, 1, 28, '#150F2A');
      g.rect(lx - 1, 130, 3, 2, '#150F2A');
      g.rect(lx - 2, 126, 5, 4, '#FFE0A0');
      g.rect(lx - 2, 126, 5, 1, '#150F2A');
    }
  };

  const mid = (g: Gfx, t: number, dt: number) => {
    for (const s of stars) g.px(s.x, s.y, '#FFFFFF', 0.2 + 0.7 * Math.max(0, Math.sin(t / s.p + s.ph)));
    clouds.update(g, dt);
    birds.update(g, t, dt);
    drawWindows(g, winRoofs, t, null);
    // đèn tháp: ánh vàng + lấp lánh định kỳ
    const sparkle = ((t - sparkleAt) % 16 + 16) % 16 < 4;
    for (const l of lights) {
      const tw = Math.max(0, Math.sin(t * 2 + l.ph));
      g.px(l.x, l.y, sparkle ? '#FFFFFF' : '#FFC85A', sparkle ? (Math.sin(t * 24 + l.ph * 9) > 0 ? 1 : 0.1) : 0.35 + 0.5 * tw);
    }
    g.glow(T, 96, 46, '#FFB45A', sparkle ? 0.8 : 0.45, 1.4);
    // đèn hiệu quay trên đỉnh
    const ang = Math.sin(t * 0.6) * 1.1;
    for (let k = 4; k < 70; k += 2) g.px(T + Math.sin(ang) * k, TOP - 6 - Math.cos(ang) * k * 0.35, '#FFF4C8', 0.16 * (1 - k / 80));
    g.glow(T, TOP - 6, 8, '#FFF4C8', 1.1);
    // tàu du lịch
    boat.x += boat.v * dt;
    if (boat.x > SCENE_W + 60) boat.x = -70;
    const bx = Math.round(boat.x);
    g.rect(bx, 150, 44, 4, '#F2ECE6');
    g.rect(bx + 2, 154, 40, 2, '#3a2a55');
    g.rect(bx + 6, 145, 30, 5, '#F2ECE6');
    for (let i = 0; i < 7; i += 1) g.rect(bx + 8 + i * 4, 147, 3, 2, '#FFE9A8');
    g.rect(bx + 14, 142, 14, 3, '#D9374A');
    g.glow(bx + 22, 148, 30, '#FFD98A', 0.6, 0.45);
    for (let i = 0; i < 6; i += 1) g.rect(bx - 2 - i * 4, 154 + (i % 2), 3, 1, '#FFFFFF', 0.4 - i * 0.05);
    // nước lăn tăn + ánh đèn vàng
    shimmer(g, t, WATER + 1, QUAY - 3, '#FFD9A0', '#1A1236', 6, 54);
    g.rect(T - 3 + Math.sin(t * 2) * 2, WATER + 2, 6, 18, '#FFB45A', 0.12);
  };

  const top = (g: Gfx, t: number, dt: number) => {
    drawNeon(g, CAFE, t);
    // đèn đường nhấp nháy nhẹ
    for (const lx of [24, 118, 176, 296]) {
      const k = 0.85 + 0.15 * Math.sin(t * 3 + lx);
      g.glow(lx, 128, 20, '#FFC870', 1.2 * k);
      g.glow(lx, 150, 6, '#FFC870', 0.5 * k, 2);
    }
    for (let i = 0; i < 6; i += 1) g.px(6 + i * 24, 119, '#FFD890', 0.8);
    g.glow(270, 156, 34, '#FFCF80', 0.8, 0.5);
    for (let i = 0; i < 4; i += 1) g.px(244 + i * 18, 167, '#FFE9A8', 0.6 + 0.4 * Math.sin(t * 2 + i));
    moveWalkers(walkers, dt);
    for (const w of walkers) drawWalker(g, w, t);
    // lá thu rơi
    for (const l of leaves) {
      l.y += l.vy * dt;
      l.x += Math.sin(t * 1.5 + l.ph) * 8 * dt + 3 * dt;
      if (l.y > SCENE_H + 4) {
        l.y = -4;
        l.x = Math.random() * SCENE_W;
      }
      if (l.x > SCENE_W + 4) l.x = -4;
      g.px(l.x, l.y, l.c, 0.9);
      if (Math.sin(t * 4 + l.ph) > 0) g.px(l.x + 1, l.y, l.c, 0.7);
    }
    void SCENE_H;
  };

  sparkleAt = 3;
  return { id: 'paris', vi: 'Paris — hoàng hôn', en: 'Paris — dusk', buildBack, buildFront, mid, top };
}
