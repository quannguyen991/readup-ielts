/** HÀ NỘI, rạng sáng ở Hồ Gươm: Tháp Rùa, cầu Thê Húc đỏ, liễu đung đưa, sương trôi, xe đạp chở hoa, người tập thể dục. Vẽ hoàn toàn bằng mã. */
import { Gfx, rng } from './gfx';
import { Birds, Clouds, drawWalker, makeWalkers, moveWalkers, reflect, shimmer } from './parts';
import { SCENE_H, SCENE_W, type PxScene } from './scene';

const LAKE = 120;
const PATH = 158;

type Rider = { x: number; v: number; y: number; flowers: boolean; ph: number; hat: string };

export function makeHanoi(): PxScene {
  const r0 = rng(23);
  const clouds = new Clouds(5, 22, 70, '#FFE6C8', 0.55, 2.2, 7);
  const mist = Array.from({ length: 5 }, () => ({ x: r0() * SCENE_W, y: LAKE - 6 + r0() * 30, w: 90 + r0() * 90, v: 1.5 + r0() * 2 }));
  const birds = new Birds(8, 14, 70, '#4A3A44', 5);
  const walkers = makeWalkers(5, 164, 174, ['#fff'], ['#6a5a3a', '#3a5a6a', '#6a3a4a', '#4a6a3a', '#7a6a5a'], false, 33);
  const riders: Rider[] = [
    { x: -30, v: 26, y: 166, flowers: true, ph: 0, hat: '#EBDCA0' },
    { x: 340, v: -18, y: 175, flowers: false, ph: 2, hat: '#EBDCA0' },
  ];
  const lotus = Array.from({ length: 14 }, () => ({ x: 130 + r0() * 90, y: LAKE + 12 + r0() * 18, ph: r0() * 6 }));
  const willowX = [20, 54, 300];

  const buildBack = (g: Gfx) => {
    g.vgrad(0, LAKE, ['#6C9CC4', '#B9C9D2', '#F7D9A8', '#FFB57A', '#FF9A6A'], 14);
    // mặt trời mọc
    g.disc(236, 100, 15, '#FFE7B0', 0.32);
    g.disc(236, 100, 9, '#FFF0C8');
    // phố cổ xa: nhà ống mái ngói
    const rr = rng(4);
    let x = -2;
    while (x < SCENE_W) {
      const w = 9 + Math.floor(rr() * 8);
      const h = 14 + Math.floor(rr() * 18);
      const body = ['#D9B578', '#C99A68', '#E6C890', '#B8886A'][Math.floor(rr() * 4)]!;
      g.rect(x, LAKE - h, w, h, body);
      g.rect(x, LAKE - h - 3, w, 3, '#8A4A3A');
      g.rect(x + 1, LAKE - h - 4, w - 2, 1, '#8A4A3A');
      for (let j = 0; j < Math.floor(h / 7); j += 1) g.rect(x + 2, LAKE - h + 3 + j * 7, 3, 3, '#3A2A2A', 0.7);
      x += w + (rr() < 0.3 ? 1 : 0);
    }
    // cây xa (phượng, bàng)
    for (let i = 0; i < 16; i += 1) {
      const tx = 10 + i * 20 + (i % 3) * 3;
      g.disc(tx, LAKE - 14 - (i % 4) * 3, 8 + (i % 3), i % 5 === 0 ? '#C8522A' : '#3F6A3A');
      g.disc(tx - 3, LAKE - 17 - (i % 4) * 3, 5, '#4F7A44');
    }
    // hồ
    g.vgrad(LAKE, PATH, ['#9CB4B8', '#6E9094', '#3F6A70'], 8);
    // Tháp Rùa
    const tx = 96;
    for (let k = 0; k < 3; k += 1) {
      const w = 18 - k * 4;
      const y = LAKE - 8 - k * 11;
      g.rect(tx - w / 2, y - 9, w, 9, '#9A9A80');
      g.rect(tx - w / 2 - 1, y - 11, w + 2, 2, '#7A7A62');
      g.rect(tx - w / 2 - 2, y - 12, w + 4, 1, '#7A7A62');
      g.rect(tx - 2, y - 7, 4, 6, '#2E3A3A');
      g.px(tx - 1, y - 8, '#2E3A3A');
      g.px(tx, y - 8, '#2E3A3A');
      for (let m = 0; m < w; m += 3) g.px(tx - w / 2 + m, y - 3 + (m % 2), '#6E8A58', 0.8);
    }
    g.rect(tx - 1, LAKE - 42, 2, 8, '#9A9A80');
    g.px(tx, LAKE - 43, '#7A7A62');
    reflect(g, LAKE, PATH - LAKE, 0.5, '#6E9094', 0.3);
    g.rect(96 - 20, LAKE - 2, 40, 6, '#4F7A44');
    g.rect(96 - 14, LAKE - 6, 28, 5, '#3F6A3A');
    // cầu Thê Húc đỏ + cổng Đài Nghiên
    for (let a = 0; a <= 60; a += 1) {
      const x2 = 196 + a * 1.8;
      const y2 = LAKE + 12 - Math.sin((a / 60) * Math.PI) * 4;
      g.rect(x2, y2, 3, 3, '#C8402A');
      g.rect(x2, y2 - 3, 1, 3, '#8A2A1A');
    }
    g.rect(196, LAKE + 6, 3, 10, '#8A2A1A');
    g.rect(300, LAKE + 6, 3, 10, '#8A2A1A');
    g.rect(300, LAKE - 4, 18, 14, '#7A6A5A');
    g.rect(298, LAKE - 8, 22, 4, '#8A4A3A');
    g.rect(306, LAKE - 2, 6, 10, '#2E2A28');
  };

  const buildFront = (g: Gfx) => {
    // bờ hồ + đường dạo lát gạch
    g.rect(0, PATH - 3, SCENE_W, 3, '#6A6A58');
    g.vgrad(PATH, SCENE_H, ['#A8947A', '#8A7A62', '#6E604E'], 5);
    for (let y = PATH + 3; y < SCENE_H; y += 6) for (let x = (y / 6) % 2 ? 0 : 5; x < SCENE_W; x += 10) g.rect(x, y, 9, 1, '#6E604E', 0.5);
    // gốc liễu
    for (const wx of willowX) {
      g.rect(wx - 2, 120, 4, PATH - 120, '#4A3A2E');
      g.rect(wx - 2, 120, 1, PATH - 120, '#6A5A48');
    }
    // ghế đá + đèn
    g.rect(118, 160, 26, 2, '#5A5A58');
    g.rect(120, 162, 2, 5, '#3A3A3A');
    g.rect(140, 162, 2, 5, '#3A3A3A');
    for (const lx of [174, 244]) {
      g.rect(lx, 136, 1, 24, '#2A2A2A');
      g.rect(lx - 2, 132, 5, 4, '#F8E0A0');
    }
  };

  const mid = (g: Gfx, t: number, dt: number) => {
    clouds.update(g, dt);
    birds.update(g, t, dt);
    // sen + gợn nước
    for (const l of lotus) {
      g.rect(l.x, l.y, 4, 1, '#3F7A4A');
      if (Math.sin(t * 0.7 + l.ph) > 0.2) g.px(l.x + 1, l.y - 1, '#F6A8C8');
    }
    shimmer(g, t, LAKE + 1, PATH - 4, '#FFF0D0', '#26484E', 3, 56);
    g.rect(236 - 3 + Math.sin(t) * 2, LAKE + 2, 6, 34, '#FFE7B0', 0.16);
    // sương trôi
    for (const m of mist) {
      m.x += m.v * dt;
      if (m.x - m.w / 2 > SCENE_W) m.x = -m.w / 2;
      g.rect(m.x - m.w / 2, m.y, m.w, 4, '#F4EEE0', 0.2);
      g.rect(m.x - m.w / 2 + 8, m.y - 2, m.w - 16, 2, '#F4EEE0', 0.14);
    }
  };

  const top = (g: Gfx, t: number, dt: number) => {
    // liễu đung đưa
    for (const wx of willowX) {
      for (let s = 0; s < 14; s += 1) {
        const bx = wx + (s - 7) * 3;
        const len = 22 + ((s * 7) % 9);
        for (let k = 0; k < len; k += 1) {
          const sway = Math.sin(t * 1.1 + s * 0.6 + k * 0.12) * (k * 0.07);
          g.px(bx + sway + (s - 7) * 0.4 * (k / len), 110 + k + Math.abs(s - 7) * 0.8, k % 5 === 0 ? '#9AC060' : '#5E8A44', 0.92);
        }
      }
      g.disc(wx, 108, 8, '#4F7A44');
      g.disc(wx - 6, 111, 5, '#5E8A44');
      g.disc(wx + 6, 111, 5, '#5E8A44');
    }
    for (const lx of [174, 244]) g.glow(lx + 0.5, 134, 14, '#FFE7B0', 0.7 * (0.9 + 0.1 * Math.sin(t * 2 + lx)));
    // xe đạp
    for (const r of riders) {
      r.x += r.v * dt;
      if (r.v > 0 && r.x > SCENE_W + 30) r.x = -30;
      if (r.v < 0 && r.x < -30) r.x = SCENE_W + 30;
      const x = Math.round(r.x);
      const y = r.y;
      const dir = r.v > 0 ? 1 : -1;
      const sp = Math.floor((t + r.ph) * 8) % 2;
      for (let k = 0; k < 10; k += 1) {
        const a2 = (k / 10) * Math.PI * 2;
        g.px(x - 5 + Math.cos(a2) * 3, y - 3 + Math.sin(a2) * 3, '#1A1A1A');
        g.px(x + 5 + Math.cos(a2) * 3, y - 3 + Math.sin(a2) * 3, '#1A1A1A');
      }
      g.px(x - 5, y - 3, sp ? '#888' : '#333');
      g.px(x + 5, y - 3, sp ? '#333' : '#888');
      g.line(x - 5, y - 3, x, y - 8, '#2A2A2A');
      g.line(x, y - 8, x + 5, y - 3, '#2A2A2A');
      g.rect(x - 1, y - 14, 3, 7, '#7A4A3A');
      g.rect(x - 1, y - 17, 3, 3, '#E0B088');
      g.rect(x - 3, y - 19, 7, 2, r.hat);
      g.rect(x - 1, y - 20, 3, 1, r.hat);
      g.px(x + dir * 2, y - 8 + (sp ? 1 : 0), '#2A2A2A');
      if (r.flowers) {
        g.rect(x - dir * 8, y - 9, 6, 6, '#3F7A3A');
        for (let i = 0; i < 5; i += 1) g.px(x - dir * 8 + i, y - 10 + (i % 2), ['#F6A8C8', '#FFD84F', '#E34A5A'][i % 3]!);
      }
    }
    moveWalkers(walkers, dt);
    for (const w of walkers) drawWalker(g, w, t);
    // sương thấp phía trước
    g.rect(0, PATH - 10, SCENE_W, 8, '#F4EEE0', 0.08);
    void SCENE_H;
  };

  return { id: 'hanoi', vi: 'Hà Nội — sáng sớm Hồ Gươm', en: 'Hanoi — dawn at Hoan Kiem Lake', buildBack, buildFront, mid, top };
}
