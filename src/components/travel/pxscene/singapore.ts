/** SINGAPORE, đêm: Marina Bay Sands, Merlion phun nước, rừng Supertree đổi màu, pháo hoa trên vịnh, thuyền chạy. Vẽ hoàn toàn bằng mã. */
import { Gfx, rng } from './gfx';
import { Fireworks, Win, drawWalker, drawWindows, makeWalkers, moveWalkers, reflect, shimmer, windowGrid } from './parts';
import { SCENE_H, SCENE_W, type PxScene } from './scene';

const WATER = 128;
const PROM = 156;
const TREES = [262, 290, 236];

export function makeSingapore(): PxScene {
  const r0 = rng(40);
  const stars = Array.from({ length: 40 }, () => ({ x: r0() * SCENE_W, y: r0() * 50, ph: r0() * 6, p: 1.5 + r0() * 3 }));
  const winCbdL: Win[] = windowGrid(0, 80, 26, 8, 3, 3, 2, 3, ['#7FE3FF', '#FFE9A8', '#BFD6FF'], 0.4, 71).filter((w) => w.x < 106);
  const winCbdR: Win[] = windowGrid(206, 86, 28, 7, 3, 3, 2, 3, ['#7FE3FF', '#FFE9A8', '#BFD6FF'], 0.35, 72).filter((w) => w.x > 210 && w.x < 318);
  const winMbs: Win[] = [
    ...windowGrid(132, 52, 5, 18, 2, 2, 1, 2, ['#FFE9A8', '#FFF4D0'], 0.7, 73),
    ...windowGrid(152, 52, 5, 18, 2, 2, 1, 2, ['#FFE9A8', '#FFF4D0'], 0.7, 74),
    ...windowGrid(172, 52, 5, 18, 2, 2, 1, 2, ['#FFE9A8', '#FFF4D0'], 0.7, 75),
  ];
  const fire = new Fireworks(['#FF5C93', '#FFD84F', '#4FE3FF', '#6BFF9A', '#B28CFF'], 60, 250, 16, 48, 5.5);
  const walkers = makeWalkers(5, 164, 174, ['#fff'], ['#2a3a5a', '#5a2a4a', '#2a5a4a', '#4a4a6a', '#6a3a2a'], false, 14);
  const jets: { x: number; y: number; vx: number; vy: number; life: number }[] = [];
  let jetAcc = 0;
  const boats = [
    { x: 20, y: 140, v: 9, w: 24, color: '#F2ECE6' },
    { x: 280, y: 148, v: -6, w: 14, color: '#E8B23A' },
  ];
  const plane = { x: -20, y: 20, v: 22 };

  const buildBack = (g: Gfx) => {
    g.vgrad(0, WATER, ['#05071F', '#10164A', '#27256E', '#5A357E', '#8A4A86'], 12);
    // CBD hai bên
    const rr = rng(6);
    let x = 0;
    while (x < 110) {
      const w = 10 + Math.floor(rr() * 10);
      const h = 36 + Math.floor(rr() * 40);
      g.rect(x, WATER - h, w, h, '#14184A');
      g.rect(x, WATER - h, w, 1, '#2A3180');
      x += w + 1;
    }
    x = 204;
    while (x < SCENE_W) {
      const w = 10 + Math.floor(rr() * 10);
      const h = 30 + Math.floor(rr() * 44);
      g.rect(x, WATER - h, w, h, '#14184A');
      g.rect(x, WATER - h, w, 1, '#2A3180');
      x += w + 1;
    }
    // Marina Bay Sands
    for (let k = 0; k < 3; k += 1) {
      const bx = 132 + k * 20;
      for (let y = WATER; y > 50; y -= 1) {
        const lean = k === 0 ? (WATER - y) * 0.05 : k === 2 ? -(WATER - y) * 0.05 : 0;
        g.rect(bx + lean, y, 17, 1, '#20266E');
        g.px(bx + lean, y, '#3C48B0');
      }
    }
    // SkyPark hình con thuyền
    g.rect(122, 46, 78, 6, '#2A3180');
    g.rect(122, 46, 78, 1, '#6B78E0');
    g.line(200, 46, 214, 42, '#2A3180');
    g.rect(200, 44, 14, 2, '#2A3180');
    g.rect(138, 44, 40, 2, '#4FE3FF', 0.7); // hồ bơi vô cực
    // Supertree
    for (const tx of TREES) {
      const h = tx === 236 ? 52 : 68;
      g.rect(tx - 1, WATER - h, 3, h, '#2A3A2E');
      g.rect(tx - 1, WATER - h, 1, h, '#4A6A48');
      const cw = tx === 236 ? 12 : 17;
      for (let y = 0; y < 12; y += 1) {
        const w = Math.round(cw * Math.sin(((y + 2) / 14) * Math.PI * 0.9 + 0.2));
        g.rect(tx - w, WATER - h - 6 + y, w * 2 + 1, 1, '#1F4A34');
      }
      for (let i = -cw; i <= cw; i += 4) g.px(tx + i, WATER - h - 4 + Math.abs(i) * 0.15, '#4AAA6A', 0.7);
    }
    // vịnh + phản chiếu
    g.vgrad(WATER, PROM, ['#26256E', '#14164A', '#0A0C2C'], 8);
    reflect(g, WATER, PROM - WATER, 0.55, '#12154A', 0.38);
  };

  const buildFront = (g: Gfx) => {
    // lối đi ven vịnh + lan can
    g.rect(0, PROM, SCENE_W, 3, '#3A3E7A');
    g.rect(0, PROM, SCENE_W, 1, '#6A70B8');
    g.vgrad(PROM + 3, SCENE_H, ['#252A5E', '#171A3E', '#0E1028'], 6);
    for (let x = 0; x < SCENE_W; x += 5) g.rect(x, PROM - 7, 1, 7, '#0E1028');
    g.rect(0, PROM - 7, SCENE_W, 1, '#0E1028');
    for (let i = 0; i < 90; i += 1) g.rect((i * 53) % SCENE_W, PROM + 6 + ((i * 29) % 18), 4, 1, '#3A3E7A', 0.4);
    // Merlion trên bệ đá
    g.rect(20, 140, 40, 16, '#8890B8');
    g.rect(20, 140, 40, 2, '#B8C0E0');
    g.rect(24, 134, 32, 6, '#A0A8CC');
    // thân cá thon dần
    for (let y = 108; y < 134; y += 1) {
      const w = Math.round(8 + (y - 108) * 0.16);
      g.rect(38 - w, y, w * 2 + 1, 1, '#C9D2F0');
      g.px(38 - w, y, '#E8EEFF');
      g.px(38 + w, y, '#8F98BC');
      if ((y + 1) % 3 === 0) for (let k = -w + 2; k < w - 1; k += 3) g.px(38 + k, y, '#9AA4C8');
    }
    // đầu sư tử + bờm
    g.disc(37, 99, 10, '#B2BCDE');
    for (let k = 0; k < 18; k += 1) {
      const a2 = (k / 18) * Math.PI * 2;
      g.disc(37 + Math.cos(a2) * 11, 99 + Math.sin(a2) * 11, 2, k % 2 ? '#C9D2F0' : '#9AA4C8');
    }
    g.disc(37, 99, 8, '#DDE4FA');
    g.px(33, 96, '#14164A');
    g.px(41, 96, '#14164A');
    g.rect(28, 100, 8, 3, '#14164A'); // miệng há hướng trái
    g.rect(36, 102, 4, 2, '#B2BCDE');
    // đuôi cá cong lên bên phải
    for (let i = 0; i < 16; i += 1) {
      const tx2 = 46 + i;
      const ty2 = 128 - Math.round(Math.sin(i * 0.28) * 16);
      g.rect(tx2, ty2, 3, 4, '#C9D2F0');
      g.px(tx2, ty2, '#E8EEFF');
    }
    g.rect(58, 104, 4, 8, '#C9D2F0');
    g.rect(61, 100, 3, 6, '#C9D2F0');
    g.rect(55, 104, 3, 4, '#9AA4C8');
    // cột đèn
    for (const lx of [96, 208, 316]) {
      g.rect(lx, 134, 1, 24, '#0A0B1E');
      g.rect(lx - 2, 131, 5, 3, '#0A0B1E');
    }
  };

  const mid = (g: Gfx, t: number, dt: number) => {
    for (const s of stars) g.px(s.x, s.y, '#FFFFFF', 0.2 + 0.7 * Math.max(0, Math.sin(t / s.p + s.ph)));
    // máy bay chớp đèn
    plane.x += plane.v * dt;
    if (plane.x > SCENE_W + 20) {
      plane.x = -30;
      plane.y = 10 + Math.random() * 30;
    }
    if (Math.sin(t * 5) > 0) g.px(plane.x, plane.y, '#FF3030');
    g.px(plane.x + 3, plane.y, Math.sin(t * 5 + 2) > 0 ? '#FFFFFF' : '#667');
    // cửa sổ
    drawWindows(g, winCbdL, t, null);
    drawWindows(g, winCbdR, t, null);
    drawWindows(g, winMbs, t, null);
    // đèn báo trên nóc
    for (const [x, y] of [[40, 46], [90, 52], [260, 50], [302, 56]] as const) g.px(x, y, '#FF3030', Math.sin(t * 2 + x) > 0.2 ? 1 : 0.15);
    // Supertree đổi màu
    TREES.forEach((tx, i) => {
      const h = tx === 236 ? 52 : 68;
      const hue = (t * 25 + i * 70) % 360;
      const col = `hsl(${hue},95%,62%)`;
      const cw = tx === 236 ? 12 : 17;
      for (let k = -cw; k <= cw; k += 3) g.px(tx + k, WATER - h - 2 + Math.abs(k) * 0.1 + Math.sin(t * 3 + k) * 0.8, col, 0.95);
      g.glow(tx, WATER - h - 2, cw * 0.6, col, 0.45, 0.45);
      g.rect(tx, WATER - h + 4, 1, h - 6, col, 0.15 + 0.1 * Math.sin(t * 2 + i));
    });
    // SkyPark lấp lánh
    g.glow(160, 46, 22, '#4FE3FF', 0.35, 0.25);
    for (let k = 0; k < 6; k += 1) g.px(126 + ((t * 20 + k * 13) % 72), 46, '#FFFFFF', 0.7);
    fire.update(g, t, dt);
    // thuyền
    for (const b of boats) {
      b.x += b.v * dt;
      if (b.v > 0 && b.x > SCENE_W + 30) b.x = -40;
      if (b.v < 0 && b.x < -40) b.x = SCENE_W + 30;
      const x = Math.round(b.x);
      g.rect(x, b.y, b.w, 3, b.color);
      g.rect(x + 3, b.y - 3, b.w - 8, 3, b.color);
      for (let i = 0; i < Math.floor(b.w / 4) - 1; i += 1) g.rect(x + 5 + i * 4, b.y - 2, 2, 1, '#FFE9A8');
      g.glow(x + b.w / 2, b.y, b.w + 8, '#FFD98A', 0.5, 0.4);
      for (let i = 1; i < 6; i += 1) g.rect(x - Math.sign(b.v) * i * 4 + (b.v > 0 ? 0 : b.w), b.y + 3, 3, 1, '#FFFFFF', 0.35 - i * 0.05);
    }
    shimmer(g, t, WATER + 1, PROM - 2, '#BFD0FF', '#05071F', 8, 60);
  };

  const top = (g: Gfx, t: number, dt: number) => {
    // vòi nước Merlion
    jetAcc += dt;
    while (jetAcc > 0.03) {
      jetAcc -= 0.03;
      jets.push({ x: 28, y: 101, vx: -(34 + Math.random() * 6), vy: -4 + Math.random() * 3, life: 0 });
    }
    for (let i = jets.length - 1; i >= 0; i -= 1) {
      const j = jets[i]!;
      j.life += dt;
      j.vy += 70 * dt;
      j.x += j.vx * dt;
      j.y += j.vy * dt;
      if (j.y > PROM + 2 || j.life > 2) {
        jets.splice(i, 1);
        continue;
      }
      g.px(j.x, j.y, '#DDEBFF', 0.85);
    }
    g.glow(30, 101, 14, '#8FB8FF', 0.3);
    g.glow(40, 150, 40, '#8FB8FF', 0.35, 0.4);
    for (const lx of [96, 208, 316]) g.glow(lx, 131, 18, '#FFE0A0', 1.1 * (0.9 + 0.1 * Math.sin(t * 3 + lx)));
    moveWalkers(walkers, dt);
    for (const w of walkers) drawWalker(g, w, t);
    void SCENE_H;
  };

  return { id: 'singapore', vi: 'Singapore — đêm pháo hoa', en: 'Singapore — fireworks night', buildBack, buildFront, mid, top };
}
