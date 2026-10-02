/** TOKYO, 2 giờ sáng, mưa: tháp đỏ, tàu điện trên cao, biển neon, phố ướt phản chiếu, người che ô. Vẽ hoàn toàn bằng mã. */
import { Gfx, rng } from './gfx';
import { Clouds, Neon, Rain, Steam, Win, drawNeon, drawWalker, drawWindows, makeWalkers, moveWalkers, windowGrid } from './parts';
import { SCENE_H, SCENE_W, type PxScene } from './scene';

const GROUND = 134; // mép trên vỉa hè
const ROAD = 141;
const TOWER_X = 206;

const NEONS: Neon[] = [
  { x: 74, y: 46, text: 'RAMEN', vertical: true, color: '#FF5C93', flicker: 1, seed: 1, frame: '#2a0f2e' },
  { x: 244, y: 60, text: 'HOTEL', color: '#FF4FD8', scale: 2, flicker: 1, seed: 2, frame: '#220b2b' },
  { x: 236, y: 92, text: 'SUSHI BAR', color: '#4FE3FF', flicker: 1, seed: 3, frame: '#0b2030' },
  { x: 297, y: 78, text: 'BAR', color: '#8F7CFF', vertical: true, flicker: 1, seed: 4, frame: '#160f33' },
  { x: 104, y: 74, text: '24H', color: '#6BFF9A', scale: 1, flicker: 1, seed: 5, frame: '#0a2a1a' },
  { x: 24, y: 100, text: 'KARAOKE', color: '#FFD84F', flicker: 1, seed: 6, frame: '#2a2208' },
];

type Train = { x: number; cars: number; speed: number; wait: number };

export function makeTokyo(): PxScene {
  const r = rng(77);
  const clearOfSigns = (w: Win) =>
    !NEONS.some((n) => {
      const sc = n.scale ?? 1;
      const nw = n.vertical ? 4 * sc : n.text.length * 4 * sc;
      const nh = n.vertical ? n.text.length * 6 * sc : 5 * sc;
      return w.x + w.w > n.x - 3 && w.x < n.x + nw + 3 && w.y + w.h > n.y - 3 && w.y < n.y + nh + 3;
    });
  const winL: Win[] = windowGrid(6, 46, 6, 6, 6, 5, 6, 5, ['#FFCF70', '#FFE9A8', '#7FE3FF'], 0.5, 31).filter(clearOfSigns);
  const winR: Win[] = windowGrid(236, 54, 7, 5, 6, 5, 5, 4, ['#FFCF70', '#FF8FD0', '#7FE3FF', '#FFE9A8'], 0.45, 41).filter(clearOfSigns);
  const winFar: Win[] = windowGrid(112, 74, 8, 5, 3, 3, 8, 7, ['#FFD27A', '#7AD7FF'], 0.25, 51);
  const stars = Array.from({ length: 46 }, () => ({ x: r() * SCENE_W, y: r() * 62, ph: r() * 6, p: 1.5 + r() * 3 }));
  const rain = new Rain(150, ROAD, 17);
  const clouds = new Clouds(4, 14, 44, '#2a1d52', 0.75, 3.2, 9);
  const steam = new Steam(52, 120, 4, '#D9DEF5', 0.3);
  const steam2 = new Steam(280, 118, 8, '#D9DEF5', 0.45);
  const walkers = makeWalkers(6, 136, 139, ['#FF5C93', '#4FE3FF', '#FFD84F', '#8F7CFF', '#6BFF9A', '#FF8A4F'], ['#2b2850', '#3a2a4e', '#233a4e', '#4e2a3a'], true, 13);
  const train: Train = { x: -140, cars: 3, speed: 85, wait: 3 };
  const cars = [
    { x: 40, y: 152, v: 34, color: '#F2C230', dir: 1 as 1 | -1, kind: 'taxi' },
    { x: 280, y: 166, v: 24, color: '#C93A4A', dir: -1 as 1 | -1, kind: 'car' },
  ];

  /* ------------------------------------------------------------------------- nền tĩnh phía sau */
  const buildBack = (g: Gfx) => {
    g.vgrad(0, 134, ['#05051A', '#120F38', '#2A1B55', '#55285F', '#8A416B'], 12);
    // mặt trăng + quầng
    g.disc(262, 26, 14, '#3a2a6a', 0.3);
    g.disc(262, 26, 10, '#F3E7B8');
    g.disc(258, 23, 2, '#D8C98F');
    g.disc(266, 30, 2, '#D8C98F');
    g.px(262, 20, '#D8C98F');
    // nhà xa (hai tầng)
    const rr = rng(5);
    for (let layer = 0; layer < 2; layer += 1) {
      let x = -4;
      while (x < SCENE_W) {
        const w = 12 + Math.floor(rr() * 14);
        const h = (layer === 0 ? 40 : 26) + Math.floor(rr() * (layer === 0 ? 40 : 30));
        g.rect(x, GROUND - h, w, h + 2, layer === 0 ? '#1A1642' : '#231C52');
        if (layer === 0) g.rect(x, GROUND - h, w, 1, '#2C2766');
        for (let j = 0; j < Math.floor(h / 8); j += 1)
          for (let i = 0; i < Math.floor(w / 5); i += 1) if (rr() < 0.16) g.rect(x + 2 + i * 5, GROUND - h + 4 + j * 8, 2, 2, rr() < 0.7 ? '#FFD27A' : '#7AD7FF', layer === 0 ? 0.8 : 0.55);
        x += w + Math.floor(rr() * 3);
      }
    }
    // tháp Tokyo
    const T = TOWER_X;
    const topY = 36;
    for (let y = GROUND; y >= 70; y -= 1) {
      const half = 3 + ((y - 70) / (GROUND - 70)) * 17;
      const band = Math.floor((GROUND - y) / 7) % 2 === 0;
      const c = band ? '#FF6A2A' : '#F4E9E0';
      g.px(T - half, y, c);
      g.px(T + half, y, c);
      if (Math.floor(y) % 9 === 0) g.rect(T - half, y, half * 2 + 1, 1, c, 0.7);
    }
    for (let k = 0; k < 6; k += 1) {
      const y0 = 70 + k * 10.6;
      const h0 = 3 + ((y0 - 70) / (GROUND - 70)) * 17;
      const y1 = y0 + 10.6;
      const h1 = 3 + ((y1 - 70) / (GROUND - 70)) * 17;
      g.line(T - h0, y0, T + h1, y1, '#FF6A2A', 0.8);
      g.line(T + h0, y0, T - h1, y1, '#F4E9E0', 0.8);
    }
    g.rect(T - 10, 86, 21, 5, '#FF6A2A');
    g.rect(T - 10, 90, 21, 1, '#9a3a14');
    g.rect(T - 6, 69, 13, 3, '#F4E9E0');
    for (let y = topY; y < 70; y += 1) g.rect(T - (y < 56 ? 0 : 1), y, y < 56 ? 1 : 3, 1, Math.floor(y / 5) % 2 ? '#F4E9E0' : '#FF6A2A');
    // đường ray trên cao
    g.rect(0, 100, SCENE_W, 5, '#14122E');
    g.rect(0, 100, SCENE_W, 1, '#3A3470');
    for (let x = 14; x < SCENE_W; x += 46) g.rect(x, 105, 5, GROUND - 105, '#100F26');
    g.rect(0, 96, SCENE_W, 1, '#2C2766');
  };

  /* ---------------------------------------------------------------------- nền tĩnh phía trước */
  const buildFront = (g: Gfx) => {
    // khối nhà trái
    g.rect(0, 38, 96, GROUND - 38, '#0E0D22');
    g.rect(0, 38, 96, 2, '#2A2650');
    g.rect(94, 38, 2, GROUND - 38, '#1D1A40');
    for (let j = 0; j < 6; j += 1) for (let i = 0; i < 6; i += 1) g.rect(6 + i * 11, 46 + j * 10, 6, 5, '#19173A');
    g.rect(2, 108, 94, 2, '#2A2650');
    // khối nhà phải
    g.rect(228, 48, 92, GROUND - 48, '#0E0D22');
    g.rect(228, 48, 92, 2, '#2A2650');
    g.rect(228, 48, 2, GROUND - 48, '#1D1A40');
    for (let j = 0; j < 5; j += 1) for (let i = 0; i < 7; i += 1) g.rect(236 + i * 11, 54 + j * 9, 6, 5, '#19173A');
    // cửa hàng tầng trệt
    g.rect(0, 112, 96, GROUND - 112, '#1A1230');
    g.rect(8, 116, 62, 18, '#3A1F1A'); // ô cửa ramen
    g.rect(8, 116, 62, 18, '#FFB55A', 0.18);
    for (let i = 0; i < 6; i += 1) g.rect(10 + i * 10, 116, 8, 8, '#B8252F'); // rèm noren
    for (let i = 0; i < 6; i += 1) g.rect(10 + i * 10, 124, 8, 1, '#7A151C');
    g.rect(76, 120, 14, 14, '#101A2E'); // máy bán hàng
    g.rect(77, 121, 12, 8, '#9FE7FF', 0.9);
    for (let j = 0; j < 2; j += 1) for (let i = 0; i < 4; i += 1) g.rect(78 + i * 3, 122 + j * 4, 2, 3, ['#FF5C5C', '#FFD84F', '#6BFF9A', '#6BD0FF'][(i + j) % 4]!);
    g.rect(77, 130, 12, 3, '#1B2A42');
    g.rect(228, 112, 92, GROUND - 112, '#13122A');
    g.rect(236, 116, 70, 18, '#E9F7E1', 0.92); // cửa hàng tiện lợi
    g.rect(236, 116, 70, 2, '#2EA66B');
    for (let i = 0; i < 6; i += 1) g.rect(240 + i * 11, 122, 8, 10, '#C9E7C0');
    g.rect(310, 118, 6, 16, '#1A1840');
    // vỉa hè + đường
    g.rect(0, GROUND, SCENE_W, ROAD - GROUND, '#2D2A4C');
    g.rect(0, GROUND, SCENE_W, 1, '#4A4580');
    g.rect(0, ROAD - 1, SCENE_W, 1, '#1A1836');
    g.vgrad(ROAD, SCENE_H, ['#1C1A3A', '#13122A', '#0C0B1C'], 6);
    for (let x = 0; x < SCENE_W; x += 24) g.rect(x, 163, 12, 1, '#7C6A2E', 0.7);
    for (let x = 0; x < SCENE_W; x += 5) g.px(x, GROUND + 1, '#3A3666');
    // cột điện + dây
    g.rect(190, 66, 2, GROUND - 66, '#0A0918');
    g.rect(184, 70, 14, 1, '#0A0918');
    g.line(0, 74, 190, 70, '#0A0918', 0.7);
    g.line(192, 70, 320, 76, '#0A0918', 0.7);
    // thùng xe đạp đỗ
    for (let i = 0; i < 3; i += 1) {
      const bx = 120 + i * 9;
      g.rect(bx, 126, 1, 8, '#3A3868');
      g.rect(bx - 2, 130, 5, 1, '#3A3868');
      g.px(bx - 2, 133, '#3A3868');
      g.px(bx + 2, 133, '#3A3868');
    }
  };

  /* -------------------------------------------------------------------------- động: giữa */
  const mid = (g: Gfx, t: number, dt: number) => {
    for (const s of stars) g.px(s.x, s.y, '#FFFFFF', 0.25 + 0.75 * Math.max(0, Math.sin(t / s.p + s.ph)));
    clouds.update(g, dt);
    // đèn đỏ trên đỉnh tháp
    const blink = Math.sin(t * 2.4) > 0 ? 1 : 0.25;
    g.px(TOWER_X, 35, '#FF3B3B', blink);
    g.px(TOWER_X, 36, '#FF3B3B', blink);
    g.glow(TOWER_X, 36, 9, '#FF3030', blink * 1.6);
    g.glow(TOWER_X, 88, 22, '#FF8A3A', 0.9);
    drawWindows(g, winFar, t, null);
    // tàu điện
    if (train.wait > 0) {
      train.wait -= dt;
      if (train.wait <= 0) {
        train.x = -140;
        train.speed = 80 + r() * 30;
      }
    } else {
      train.x += train.speed * dt;
      if (train.x > SCENE_W + 20) train.wait = 9 + r() * 8;
      for (let c = 0; c < train.cars; c += 1) {
        const x = train.x + c * 43;
        g.rect(x, 86, 41, 10, '#C9D3E6');
        g.rect(x, 86, 41, 1, '#EEF3FF');
        g.rect(x, 93, 41, 2, '#2EA66B');
        g.rect(x, 95, 41, 1, '#143a2a');
        for (let i = 0; i < 6; i += 1) g.rect(x + 3 + i * 6, 88, 4, 4, '#FFF2B8');
        g.rect(x + 41, 90, 2, 2, '#8896B0');
        g.glow(x + 20, 91, 24, '#FFE9A8', 0.45, 0.5);
      }
      // đèn pha đầu tàu
      g.glow(train.x + train.cars * 43, 92, 10, '#FFFFFF', 1.3, 0.8);
    }
  };

  /* ---------------------------------------------------------------------- động: phía trước */
  const top = (g: Gfx, t: number, dt: number) => {
    drawWindows(g, winL, t, null);
    drawWindows(g, winR, t, null);
    for (const n of NEONS) drawNeon(g, n, t);
    // hơi nước quán ramen + bếp
    steam.update(g, dt);
    steam2.update(g, dt);
    g.glow(40, 126, 26, '#FFB55A', 0.6, 0.7);
    g.glow(83, 125, 14, '#9FE7FF', 1.1);
    g.glow(270, 130, 40, '#DFFFD8', 0.5, 0.45);
    // lồng đèn đỏ đung đưa
    const sw = Math.round(Math.sin(t * 1.3) * 1);
    g.rect(14 + sw, 110, 5, 7, '#E3323E');
    g.rect(14 + sw, 110, 5, 1, '#8A1018');
    g.rect(14 + sw, 116, 5, 1, '#8A1018');
    g.glow(16 + sw, 114, 12, '#FF5A4A', 1.1);
    // xe
    for (const c of cars) {
      c.x += c.dir * c.v * dt;
      if (c.dir > 0 && c.x > SCENE_W + 30) c.x = -40;
      if (c.dir < 0 && c.x < -40) c.x = SCENE_W + 30;
      const x = Math.round(c.x);
      const y = c.y;
      g.rect(x - 14, y - 6, 28, 6, c.color);
      g.rect(x - 8, y - 11, 16, 5, c.color);
      g.rect(x - 7, y - 10, 6, 4, '#BFE3FF', 0.9);
      g.rect(x + 1, y - 10, 6, 4, '#BFE3FF', 0.9);
      g.rect(x - 14, y - 1, 28, 1, '#0b0a18');
      g.disc(x - 8, y, 2, '#0b0a18');
      g.disc(x + 8, y, 2, '#0b0a18');
      if (c.kind === 'taxi') {
        g.rect(x - 3, y - 13, 6, 2, '#FFF2B8');
      }
      const hx = c.dir > 0 ? x + 14 : x - 14;
      g.px(hx, y - 4, '#FFFFFF');
      g.glow(hx + c.dir * 8, y - 3, 14, '#FFF5C0', 0.9, 0.5);
      const bx = c.dir > 0 ? x - 14 : x + 14;
      g.px(bx, y - 4, '#FF3030');
      g.glow(bx, y - 4, 6, '#FF2020', 0.7);
      // phản chiếu xuống mặt đường
      g.rect(x - 12, y + 3, 24, 3, c.color, 0.18);
    }
    // người đi bộ
    moveWalkers(walkers, dt);
    for (const w of walkers) drawWalker(g, w, t);
    // phản chiếu neon trên đường ướt
    for (const n of NEONS) {
      const w = n.vertical ? 4 : g.textW(n.text, n.scale ?? 1);
      const cx = n.x + w / 2;
      for (let k = 0; k < 6; k += 1) {
        const wob = Math.sin(t * 2 + k * 1.7 + n.x) * 2;
        g.rect(cx - w / 2 + wob, ROAD + 6 + k * 6, w, 2, n.color, 0.1 * (1 - k / 7));
      }
    }
    rain.update(g, dt);
    // ánh sáng đèn đường lạnh phủ trên cùng
    g.glow(190, 70, 26, '#FFE9B0', 0.7);
    void SCENE_H;
  };

  return { id: 'tokyo', vi: 'Tokyo — đêm mưa', en: 'Tokyo — rainy night', buildBack, buildFront, mid, top };
}
