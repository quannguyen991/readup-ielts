/** LONDON, chiều mưa: Big Ben có đồng hồ chạy, London Eye quay chậm, xe buýt hai tầng qua cầu, sông Thames, ô che mưa. Vẽ hoàn toàn bằng mã. */
import { Gfx, rng } from './gfx';
import { Clouds, Rain, Win, drawWalker, drawWindows, makeWalkers, moveWalkers, reflect, shimmer, windowGrid } from './parts';
import { SCENE_H, SCENE_W, type PxScene } from './scene';

const DECK = 134; // mặt cầu
const BEN_X = 58;
const EYE = { x: 268, y: 84, r: 42 };

type Veh = { x: number; v: number; lane: number; kind: 'bus' | 'cab' | 'car'; color: string };

export function makeLondon(): PxScene {
  const winParl: Win[] = windowGrid(88, 104, 24, 3, 2, 3, 3, 6, ['#FFD98A', '#FFE9B0'], 0.55, 61).filter((w) => w.x < 168);
  const winBen: Win[] = windowGrid(BEN_X - 4, 64, 3, 6, 2, 3, 3, 6, ['#FFD98A'], 0.8, 62);
  const clouds = new Clouds(7, 14, 56, '#1B2236', 0.7, 3.8, 3);
  const rain = new Rain(200, DECK + 4, 23, '#B8CCEA', 0.28);
  const walkers = makeWalkers(6, 143, 146, ['#D9374A', '#2E6BD9', '#2EA66B', '#E8B23A', '#8F5CD9', '#444C60'], ['#202A40', '#3a2f3a', '#2a3a4a'], true, 17);
  const veh: Veh[] = [
    { x: 330, v: -30, lane: 0, kind: 'bus', color: '#D12B35' },
    { x: -50, v: 26, lane: 1, kind: 'cab', color: '#14161F' },
    { x: 180, v: -22, lane: 0, kind: 'car', color: '#2E4A7A' },
    { x: 20, v: 34, lane: 1, kind: 'bus', color: '#D12B35' },
  ];
  const pods = 16;

  const buildBack = (g: Gfx) => {
    g.vgrad(0, DECK, ['#151C33', '#27355A', '#566A8E', '#A3AEBF'], 12);
    // nhà xa mờ
    const rr = rng(8);
    let x = 150;
    while (x < SCENE_W) {
      const w = 10 + Math.floor(rr() * 12);
      const h = 12 + Math.floor(rr() * 18);
      g.rect(x, DECK - h, w, h, '#3A4666', 0.8);
      x += w + 1;
    }
    // Cung điện Westminster
    g.rect(84, 98, 90, DECK - 98, '#6B6076');
    g.rect(84, 98, 90, 2, '#8B8096');
    for (let i = 0; i < 18; i += 1) {
      g.rect(88 + i * 5, 92, 3, 7, '#625770');
      g.px(89 + i * 5, 90, '#625770');
    }
    g.rect(84, 120, 90, 2, '#5A4F66');
    for (let i = 0; i < 9; i += 1) g.rect(90 + i * 10, 124, 4, 8, '#4A4058');
    // tháp Big Ben
    const bx = BEN_X;
    g.rect(bx - 8, 58, 17, DECK - 58, '#7A6E82');
    g.rect(bx - 8, 58, 2, DECK - 58, '#9A8EA2');
    g.rect(bx + 7, 58, 2, DECK - 58, '#5A4F66');
    g.rect(bx - 9, 44, 19, 18, '#8A7E92');
    g.rect(bx - 7, 38, 15, 6, '#6B6076');
    for (let k = 0; k < 14; k += 1) g.rect(bx - 6 + Math.floor(k * 0.5), 30 + k * 0, 0, 0, '#000');
    for (let y = 18; y < 38; y += 1) {
      const w = Math.max(0, Math.floor((y - 18) / 2.4));
      g.rect(bx - w, y, w * 2 + 1, 1, y % 6 < 3 ? '#4F5E72' : '#5E6E84');
    }
    g.rect(bx, 8, 1, 10, '#C8A850');
    g.px(bx, 7, '#E8CC70');
    g.disc(bx, 52, 7, '#2A2236');
    // chân London Eye
    for (const s of [-1, 1]) g.line(EYE.x, EYE.y, EYE.x + s * 22, DECK, '#B8C2D6', 0.9);
    g.line(EYE.x - 22, DECK, EYE.x + 22, DECK, '#6C768C');
    // sông Thames
    g.vgrad(DECK, SCENE_H, ['#2A3552', '#1C243D', '#111729'], 8);
    reflect(g, DECK, 40, 0.5, '#18203A', 0.4);
  };

  const buildFront = (g: Gfx) => {
    // mặt cầu + lan can
    g.rect(0, DECK, SCENE_W, 8, '#3A3F52');
    g.rect(0, DECK, SCENE_W, 1, '#5E6478');
    g.rect(0, DECK + 8, SCENE_W, 3, '#242838');
    for (let x = 0; x < SCENE_W; x += 6) g.rect(x, DECK + 8, 2, 3, '#4A5068');
    for (let x = 20; x < SCENE_W; x += 52) {
      g.rect(x, DECK - 12, 1, 12, '#10131F');
      g.rect(x - 2, DECK - 14, 5, 2, '#10131F');
    }
    // vòm cầu
    for (let x = 0; x < SCENE_W; x += 52) {
      for (let a = 0; a <= 20; a += 1) {
        const ang = (a / 20) * Math.PI;
        g.px(x + 26 - Math.cos(ang) * 22, DECK + 20 - Math.sin(ang) * 9, '#181C2E');
      }
    }
    // bờ kè + hàng rào
    g.rect(0, 166, SCENE_W, 14, '#1D2236');
    g.rect(0, 166, SCENE_W, 2, '#4A5068');
    g.vgrad(168, SCENE_H, ['#262C44', '#161A2C'], 4);
    for (let x = 0; x < SCENE_W; x += 8) g.rect(x, 160, 1, 6, '#0C0F1C');
    g.rect(0, 160, SCENE_W, 1, '#0C0F1C');
    // hộp điện thoại đỏ
    g.rect(14, 148, 16, 22, '#C8232C');
    g.rect(14, 148, 16, 2, '#8A141C');
    for (let j = 0; j < 3; j += 1) for (let i = 0; i < 2; i += 1) g.rect(16 + i * 7, 152 + j * 5, 6, 4, '#FFE9B0');
    g.rect(13, 146, 18, 2, '#C8232C');
    // ghế băng
    g.rect(200, 158, 24, 2, '#3A2E26');
    g.rect(202, 160, 2, 5, '#1A1410');
    g.rect(220, 160, 2, 5, '#1A1410');
  };

  const mid = (g: Gfx, t: number, dt: number) => {
    clouds.update(g, dt);
    drawWindows(g, winParl, t, null);
    drawWindows(g, winBen, t, null);
    // đồng hồ Big Ben
    g.disc(BEN_X, 52, 6, '#FFF0C8');
    g.glow(BEN_X, 52, 22, '#FFE7A0', 1.2);
    const mAng = t * 0.5 - Math.PI / 2;
    const hAng = t * 0.04 - Math.PI / 2;
    g.line(BEN_X, 52, BEN_X + Math.cos(mAng) * 5, 52 + Math.sin(mAng) * 5, '#2A2236');
    g.line(BEN_X, 52, BEN_X + Math.cos(hAng) * 3, 52 + Math.sin(hAng) * 3, '#2A2236');
    for (let k = 0; k < 12; k += 1) g.px(BEN_X + Math.cos((k / 12) * Math.PI * 2) * 6, 52 + Math.sin((k / 12) * Math.PI * 2) * 6, '#2A2236', 0.6);
    // London Eye: vành, nan hoa, cabin
    const rot = t * 0.07;
    for (let k = 0; k < 120; k += 1) {
      const a = (k / 120) * Math.PI * 2;
      g.px(EYE.x + Math.cos(a) * EYE.r, EYE.y + Math.sin(a) * EYE.r, '#D6DEEE', 0.85);
      g.px(EYE.x + Math.cos(a) * (EYE.r - 3), EYE.y + Math.sin(a) * (EYE.r - 3), '#A8B4CC', 0.4);
    }
    for (let k = 0; k < pods; k += 1) {
      const a = rot + (k / pods) * Math.PI * 2;
      g.line(EYE.x, EYE.y, EYE.x + Math.cos(a) * EYE.r, EYE.y + Math.sin(a) * EYE.r, '#9AA6BE', 0.3);
      const px = EYE.x + Math.cos(a) * (EYE.r + 2);
      const py = EYE.y + Math.sin(a) * (EYE.r + 2);
      g.rect(px - 1, py - 1, 3, 3, '#FFF2C0');
      g.glow(px, py, 7, '#FFE9A8', 0.5);
    }
    g.disc(EYE.x, EYE.y, 2, '#D6DEEE');
    g.glow(EYE.x, EYE.y, 54, '#8FA8E8', 0.35);
    shimmer(g, t, DECK + 12, 164, '#9FB4E8', '#0B0F20', 4, 50);
    g.rect(BEN_X - 3 + Math.sin(t * 1.5) * 1.5, DECK + 12, 6, 30, '#FFE7A0', 0.1);
  };

  const top = (g: Gfx, t: number, dt: number) => {
    for (const v of veh) {
      v.x += v.v * dt;
      if (v.v > 0 && v.x > SCENE_W + 50) v.x = -60;
      if (v.v < 0 && v.x < -60) v.x = SCENE_W + 50;
      const y = DECK + 2 + v.lane * 4;
      const x = Math.round(v.x);
      const dir = v.v > 0 ? 1 : -1;
      if (v.kind === 'bus') {
        g.rect(x - 18, y - 20, 36, 20, v.color);
        g.rect(x - 18, y - 11, 36, 1, '#7A1219');
        for (let i = 0; i < 6; i += 1) {
          g.rect(x - 16 + i * 6, y - 18, 4, 4, '#FFE9A8');
          g.rect(x - 16 + i * 6, y - 9, 4, 4, '#FFE9A8');
        }
        g.rect(x - 18, y - 2, 36, 2, '#10131F');
        g.disc(x - 11, y, 2, '#05060C');
        g.disc(x + 11, y, 2, '#05060C');
        g.glow(x, y - 12, 26, '#FFE9A8', 0.5, 0.7);
      } else {
        g.rect(x - 11, y - 7, 22, 7, v.color);
        g.rect(x - 6, y - 12, 12, 5, v.color);
        g.rect(x - 5, y - 11, 4, 3, '#BFD6F0', 0.9);
        g.rect(x + 1, y - 11, 4, 3, '#BFD6F0', 0.9);
        g.disc(x - 7, y, 2, '#05060C');
        g.disc(x + 7, y, 2, '#05060C');
        if (v.kind === 'cab') g.rect(x - 2, y - 14, 4, 2, '#FFE060');
      }
      const hx = x + dir * (v.kind === 'bus' ? 18 : 11);
      g.px(hx, y - 4, '#FFFFFF');
      g.glow(hx + dir * 10, y - 3, 14, '#FFF5C0', 0.8, 0.5);
      g.px(x - dir * (v.kind === 'bus' ? 18 : 11), y - 4, '#FF3030');
      g.rect(x - 14, y + 2, 28, 2, '#C8232C', v.kind === 'bus' ? 0.12 : 0.0);
    }
    for (const w of walkers) w.y = 146;
    moveWalkers(walkers, dt);
    for (const w of walkers) drawWalker(g, w, t);
    for (const lx of [20, 72, 124, 176, 228, 280]) {
      const k = 0.9 + 0.1 * Math.sin(t * 2.7 + lx);
      g.glow(lx + 0.5, DECK - 14, 18, '#FFD98A', 1.1 * k);
      g.px(lx, DECK - 15, '#FFF0C0');
    }
    g.glow(22, 156, 22, '#FF6A5A', 0.7);
    // vũng nước phản chiếu
    g.rect(120 + Math.sin(t) * 2, 172, 40, 1, '#8FA8E8', 0.3);
    rain.update(g, dt);
    void SCENE_H;
  };

  return { id: 'london', vi: 'London — chiều mưa', en: 'London — rainy evening', buildBack, buildFront, mid, top };
}
