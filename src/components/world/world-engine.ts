/**
 * BỘ MÁY VẼ BẢN ĐỒ READUP — canvas 2D độ phân giải thấp, phóng to bằng CSS
 * `image-rendering: pixelated` nên nét pixel sắc ở mọi cỡ màn. CHỈ CHẠY TRÊN WEB.
 *
 * Mọi hình (đảo, công trình, nhân vật, con cú) vẽ bằng từng ô vuông trong code —
 * không có ảnh ngoài. Chữ (tên đảo, nhiệm vụ) KHÔNG vẽ ở đây: phông pixel không
 * có dấu tiếng Việt, nên chữ nằm ở lớp React phía trên, đặt theo cùng toạ độ
 * `islandPosition`.
 *
 * Di chuyển: nhân vật chỉ đi trên các sợi tơ (trạm ↔ từng đảo). Giữ phím mũi
 * tên / WASD thì đi theo sợi gần hướng bấm nhất; bấm vào đảo thì tự đi tới.
 */
import { islandPosition, type IslandId } from '@/services/world/islands';
import { drawHero, mixHex, rgba, rng } from './pixel-kit';

export type IslandVisual = { id: IslandId; color: string; progress: number };

export type WorldHandle = {
  update: (islands: IslandVisual[]) => void;
  goTo: (index: number | 'hub') => void;
  dispose: () => void;
};

type Pt = { x: number; y: number };
const HUB = -1;

export function mountWorld(
  canvas: HTMLCanvasElement,
  initial: IslandVisual[],
  opts: { onArrive: (index: number | null) => void; start?: number | 'hub' },
): WorldHandle {
  const ctx = canvas.getContext('2d')!;
  let islands = initial;
  let W = 384;
  let H = 216;
  let aspect = 16 / 9;
  let pts: Pt[] = [];
  let hub: Pt = { x: 0, y: 0 };

  const layout = () => {
    const box = canvas.parentElement!.getBoundingClientRect();
    aspect = Math.max(0.4, box.width / Math.max(1, box.height));
    if (aspect >= 1) {
      H = 232;
      W = Math.round(H * aspect);
    } else {
      W = 232;
      H = Math.round(W / aspect);
    }
    canvas.width = W;
    canvas.height = H;
    pts = islands.map((_, i) => {
      const p = islandPosition(i, aspect);
      return { x: Math.round(p.x * W), y: Math.round(p.y * H) };
    });
    hub = { x: Math.round(0.5 * W), y: Math.round(0.52 * H) };
    ctx.imageSmoothingEnabled = false;
  };
  layout();

  // Sao nền: vị trí cố định (theo tỉ lệ), nhấp nháy lệch nhịp.
  const r = rng(11);
  const stars = Array.from({ length: 140 }, () => ({ x: r(), y: r(), p: r() * 6.28, s: r() < 0.12 ? 2 : 1 }));

  // ---------------------------------------------------------------- di chuyển
  const node = (i: number): Pt => (i === HUB ? hub : pts[i]!);
  let from = opts.start === undefined || opts.start === 'hub' ? HUB : opts.start;
  let to = from;
  let t = 1;
  let path: number[] = [];
  let arrived: number | null = from === HUB ? null : from;
  const keys = new Set<string>();
  let facing = 1;
  let walking = false;

  const setArrived = (v: number | null) => {
    if (v === arrived) return;
    arrived = v;
    opts.onArrive(v);
  };

  const startEdge = (a: number, b: number) => {
    from = a;
    to = b;
    t = 0;
    setArrived(null);
  };

  const reverse = () => {
    [from, to] = [to, from];
    t = 1 - t;
  };

  /** Tự đi tới `target`. Mọi sợi đều nối trạm với một đảo, nên đường đi dài nhất là đảo → trạm → đảo. */
  const planTo = (target: number) => {
    if (t < 1) {
      const isle = from === HUB ? to : from;
      if (target === isle) {
        if (to !== isle) reverse();
        path = [];
      } else {
        if (to !== HUB) reverse();
        path = target === HUB ? [] : [target];
      }
      return;
    }
    const here = to;
    if (here === target) return;
    path = here === HUB || target === HUB ? [target] : [HUB, target];
    startEdge(here, path.shift()!);
  };

  const dirs: Record<string, Pt> = {
    ArrowLeft: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 },
    ArrowUp: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 },
    a: { x: -1, y: 0 },
    d: { x: 1, y: 0 },
    w: { x: 0, y: -1 },
    s: { x: 0, y: 1 },
  };

  const step = (dt: number) => {
    walking = false;
    // Hướng từ bàn phím.
    let dx = 0;
    let dy = 0;
    for (const k of keys) {
      const v = dirs[k];
      if (v) {
        dx += v.x;
        dy += v.y;
      }
    }
    if (dx || dy) {
      path = [];
      const len = Math.hypot(dx, dy);
      dx /= len;
      dy /= len;
      if (t >= 1) {
        const here = to;
        const options = here === HUB ? pts.map((_, i) => i) : [HUB];
        let best: number | null = null;
        let bestDot = 0.35;
        for (const o of options) {
          const a = node(here);
          const b = node(o);
          const l = Math.hypot(b.x - a.x, b.y - a.y) || 1;
          const dot = ((b.x - a.x) * dx + (b.y - a.y) * dy) / l;
          if (dot > bestDot) {
            bestDot = dot;
            best = o;
          }
        }
        if (best !== null) startEdge(here, best);
      } else {
        const a = node(from);
        const b = node(to);
        if ((b.x - a.x) * dx + (b.y - a.y) * dy < 0) reverse();
      }
    }
    if (t < 1) {
      const a = node(from);
      const b = node(to);
      const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      t = Math.min(1, t + (dt * 70) / len);
      walking = true;
      facing = b.x >= a.x ? 1 : -1;
      if (t >= 1) {
        if (path.length) startEdge(to, path.shift()!);
        else setArrived(to === HUB ? null : to);
      }
    }
  };

  const player = (): Pt => {
    const a = node(from);
    const b = node(to);
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
  };

  // ---------------------------------------------------------------- vẽ
  const px = (x: number, y: number, w: number, h: number, c: string) => {
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
  };

  const drawRock = (cx: number, cy: number, top: string, id: IslandId, time: number, seed: number) => {
    const r2 = rng(seed);
    for (let row = 0; row < 15; row += 1) {
      const half = Math.round(18 * Math.pow(1 - row / 15, 0.75));
      const c = row < 2 ? '#6b4f3a' : mixHex('#2B2350', '#1f1530', row / 15);
      px(cx - half, cy + 2 + row, half * 2, 1, c);
      if (row > 2 && row % 3 === 0) px(cx - half + 3, cy + 2 + row, 2, 1, '#7a5a42');
      if (row > 4 && row % 4 === 1) px(cx + half - 5, cy + 2 + row, 2, 1, '#2a1d2e');
    }
    // Rễ và pha lê treo dưới đáy đảo.
    for (let k = 0; k < 3; k += 1) {
      const x = cx - 8 + Math.round(r2() * 16);
      const len = 3 + Math.round(r2() * 5);
      px(x, cy + 12, 1, len, '#2B2350');
    }
    px(cx - 1, cy + 16, 3, 3, rgba(top, 0.9));
    px(cx, cy + 19, 1, 2, rgba(top, 0.7));
    // Mặt cỏ + chỏm cỏ nhô.
    px(cx - 18, cy - 1, 36, 3, top);
    px(cx - 18, cy - 1, 36, 1, mixHex(top, '#ffffff', 0.35));
    for (let k = -16; k < 17; k += 5) px(cx + k, cy - 2, 1, 1, mixHex(top, '#ffffff', 0.5));
    // Thác nước đổ khỏi mép đảo (đảo Từ vựng và Nghe & chép).
    if (id === 'vocab' || id === 'listen') {
      for (let k = 0; k < 14; k += 1) {
        const shimmer = (Math.floor(time * 12) + k) % 3 === 0;
        px(cx + 14, cy + 1 + k, 2, 1, shimmer ? '#e0f2fe' : 'rgba(125,211,252,0.75)');
      }
      px(cx + 12, cy + 15, 6, 1, 'rgba(224,242,254,0.5)');
    }
  };

  const drawBuilding = (id: IslandId, cx: number, cy: number, color: string, time: number) => {
    const dark = mixHex(color, '#0b0b1f', 0.45);
    const light = mixHex(color, '#ffffff', 0.45);
    switch (id) {
      case 'math': {
        // Tháp máy tính: thân, màn hình, bàn phím ô vuông.
        px(cx - 7, cy - 20, 14, 19, dark);
        px(cx - 5, cy - 18, 10, 4, '#b8f5c9');
        for (let r2 = 0; r2 < 3; r2 += 1) for (let c2 = 0; c2 < 3; c2 += 1) px(cx - 5 + c2 * 4, cy - 12 + r2 * 3, 2, 2, light);
        px(cx - 1, cy - 24, 2, 4, light);
        break;
      }
      case 'verbal': {
        // Chồng sách + cuốn mở trên cùng.
        px(cx - 9, cy - 5, 18, 4, color);
        px(cx - 8, cy - 9, 16, 4, '#fbbf24');
        px(cx - 9, cy - 13, 18, 4, '#38bdf8');
        px(cx - 8, cy - 17, 7, 3, '#f8fafc');
        px(cx + 1, cy - 17, 7, 3, '#f8fafc');
        px(cx, cy - 17, 1, 3, dark);
        break;
      }
      case 'vocab': {
        // Cây: thân + tán, quả lấp lánh.
        px(cx - 1, cy - 9, 3, 8, '#7a5a42');
        px(cx - 8, cy - 18, 17, 9, color);
        px(cx - 6, cy - 22, 13, 4, color);
        px(cx - 4, cy - 24, 9, 2, light);
        const blink = Math.floor(time * 2) % 3;
        px(cx - 5 + blink * 4, cy - 15, 2, 2, '#fde047');
        break;
      }
      case 'listen': {
        // Tháp phát sóng: cột, đèn chớp, vòng sóng.
        px(cx - 1, cy - 24, 2, 23, '#cbd5e1');
        px(cx - 5, cy - 4, 10, 3, dark);
        px(cx - 1, cy - 26, 2, 2, Math.floor(time * 3) % 2 ? '#f87171' : '#7f1d1d');
        const ring = (time * 12) % 10;
        ctx.strokeStyle = rgba(color, 1 - ring / 10);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy - 24, 3 + ring, -2.6, -0.5);
        ctx.stroke();
        break;
      }
      case 'translate': {
        // Ngọn hải đăng với hai bong bóng lời thoại.
        px(cx - 4, cy - 18, 8, 17, '#f8fafc');
        px(cx - 4, cy - 12, 8, 3, color);
        px(cx - 5, cy - 21, 10, 3, dark);
        px(cx - 2, cy - 24, 4, 3, '#fde047');
        px(cx - 16, cy - 20, 8, 5, '#f8fafc');
        px(cx + 9, cy - 16, 8, 5, light);
        break;
      }
      case 'arena': {
        // Lâu đài: tường răng cưa, cổng, cờ bay.
        px(cx - 10, cy - 12, 20, 11, dark);
        for (let k = 0; k < 5; k += 1) px(cx - 10 + k * 4, cy - 14, 2, 2, dark);
        px(cx - 3, cy - 7, 6, 6, '#1f1530');
        px(cx - 1, cy - 22, 1, 10, '#cbd5e1');
        const wave = Math.floor(time * 4) % 2;
        px(cx, cy - 22, 5 + wave, 3, color);
        break;
      }
    }
  };

  const drawOwl = (cx: number, cy: number, time: number) => {
    px(cx - 4, cy - 9, 8, 8, '#8b5e3c');
    px(cx - 3, cy - 10, 2, 1, '#8b5e3c');
    px(cx + 1, cy - 10, 2, 1, '#8b5e3c');
    const blink = time % 4 > 3.85;
    px(cx - 3, cy - 7, 2, blink ? 1 : 2, '#F3F0FB');
    px(cx + 1, cy - 7, 2, blink ? 1 : 2, '#F3F0FB');
    if (!blink) {
      px(cx - 2, cy - 6, 1, 1, '#1f1530');
      px(cx + 2, cy - 6, 1, 1, '#1f1530');
    }
    px(cx, cy - 5, 1, 1, '#f59e0b');
    px(cx - 3, cy - 3, 6, 2, '#c08457');
  };

  const trail: { x: number; y: number; life: number }[] = [];
  const drawPlayer = (p: Pt, time: number, dt: number) => {
    if (walking && Math.random() < 0.6) trail.push({ x: p.x + (Math.random() - 0.5) * 4, y: p.y - 2, life: 1 });
    for (let k = trail.length - 1; k >= 0; k -= 1) {
      const d = trail[k]!;
      d.life -= dt * 1.6;
      d.y -= dt * 6;
      if (d.life <= 0) trail.splice(k, 1);
      else px(d.x, d.y, 1, 1, `rgba(253,224,71,${d.life.toFixed(2)})`);
    }
    drawHero(ctx, p.x, p.y, facing, walking, time);
  };

  // Tinh vân: ba đám mây màu mờ trôi rất chậm; sao băng thỉnh thoảng vụt qua.
  const nebulae = [
    { c: '#6366f1', x: 0.25, y: 0.3, r: 0.45 },
    { c: '#db2777', x: 0.78, y: 0.7, r: 0.4 },
    { c: '#0d9488', x: 0.6, y: 0.15, r: 0.3 },
  ];
  let meteor = { x: 0, y: 0, life: 0 };

  let raf = 0;
  let last = 0;
  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    if (document.hidden) return;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    const time = now / 1000;
    step(dt);

    // Nền đêm + sao.
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0b0b24');
    g.addColorStop(1, '#141436');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    for (const s of stars) {
      const a = 0.35 + 0.65 * Math.abs(Math.sin(time * 0.8 + s.p));
      ctx.fillStyle = `rgba(226,232,255,${a.toFixed(2)})`;
      ctx.fillRect(Math.round(s.x * W), Math.round(s.y * H), s.s, s.s);
    }

    for (const n of nebulae) {
      const cx = (n.x + Math.sin(time * 0.05 + n.r) * 0.03) * W;
      const cy = (n.y + Math.cos(time * 0.04 + n.x) * 0.03) * H;
      const rad = n.r * Math.max(W, H);
      const ng = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
      ng.addColorStop(0, rgba(n.c, 0.16));
      ng.addColorStop(1, rgba(n.c, 0));
      ctx.fillStyle = ng;
      ctx.fillRect(0, 0, W, H);
    }
    if (meteor.life <= 0 && Math.random() < dt / 5) meteor = { x: Math.random() * W * 0.6, y: Math.random() * H * 0.3, life: 1 };
    if (meteor.life > 0) {
      meteor.life -= dt * 1.4;
      meteor.x += dt * 160;
      meteor.y += dt * 60;
      for (let k = 0; k < 10; k += 1) px(meteor.x - k * 2.6, meteor.y - k, 1, 1, `rgba(255,255,255,${(meteor.life * (1 - k / 10)).toFixed(2)})`);
    }

    // Mạng tơ: hai vòng elip quanh trạm.
    ctx.strokeStyle = 'rgba(129,140,248,0.18)';
    ctx.lineWidth = 1;
    for (const k of [0.45, 0.8]) {
      ctx.beginPath();
      ctx.ellipse(hub.x, hub.y, W * 0.36 * k, H * 0.34 * k, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Sợi nối trạm ↔ đảo: phần sáng dài theo tiến độ, có hạt sáng chạy dọc.
    islands.forEach((isl, i) => {
      const p = pts[i]!;
      ctx.strokeStyle = 'rgba(129,140,248,0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(hub.x, hub.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      const lit = Math.max(0.04, isl.progress);
      const ex = hub.x + (p.x - hub.x) * lit;
      const ey = hub.y + (p.y - hub.y) * lit;
      ctx.strokeStyle = rgba(isl.color, 0.35);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(hub.x, hub.y);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      ctx.strokeStyle = isl.color;
      ctx.lineWidth = 1;
      ctx.stroke();
      const run = (time * 0.35 + i * 0.17) % 1;
      px(hub.x + (ex - hub.x) * run - 1, hub.y + (ey - hub.y) * run - 1, 2, 2, '#ffffff');
    });

    // Trạm xuất phát + con cú dẫn đường.
    const hg = ctx.createRadialGradient(hub.x, hub.y + 3, 0, hub.x, hub.y + 3, 22);
    hg.addColorStop(0, 'rgba(165,180,252,0.35)');
    hg.addColorStop(1, 'rgba(165,180,252,0)');
    ctx.fillStyle = hg;
    ctx.fillRect(hub.x - 24, hub.y - 20, 48, 44);
    px(hub.x - 12, hub.y + 2, 24, 3, '#475569');
    px(hub.x - 10, hub.y + 5, 20, 2, '#334155');
    for (let k = 0; k < 8; k += 1) {
      const a = time * 0.8 + (k * Math.PI) / 4;
      px(hub.x + Math.cos(a) * 16, hub.y + 3 + Math.sin(a) * 5, 2, 1, k % 2 ? '#a5b4fc' : '#fde047');
    }
    drawOwl(hub.x - 14, hub.y + 2, time);

    // Đảo.
    islands.forEach((isl, i) => {
      const p = pts[i]!;
      const float = Math.round(Math.sin(time * 1.2 + i) * 1.5);
      const cy = p.y + float;
      drawRock(p.x, cy, mixHex(isl.color, '#16a34a', 0.35), isl.id, time, i * 31 + 7);
      drawBuilding(isl.id, p.x, cy, isl.color, time + i);
      // Đèn hiệu: quả cầu màu đảo, càng nhiều nhiệm vụ xong càng sáng và quầng càng rộng.
      const glow = 0.3 + 0.7 * isl.progress;
      const pulse = 1 + Math.sin(time * 3 + i) * 0.5;
      const bg = ctx.createRadialGradient(p.x, cy - 32, 0, p.x, cy - 32, 8 + glow * 8 + pulse * 2);
      bg.addColorStop(0, rgba(isl.color, 0.55 * glow + 0.15));
      bg.addColorStop(1, rgba(isl.color, 0));
      ctx.fillStyle = bg;
      ctx.fillRect(p.x - 20, cy - 52, 40, 40);
      px(p.x - 2, cy - 34, 4, 4, mixHex(isl.color, '#ffffff', 0.2 + 0.4 * glow));
      px(p.x - 1, cy - 33, 1, 1, '#ffffff');
      if (isl.progress >= 1) {
        ctx.strokeStyle = 'rgba(253,224,71,0.9)';
        ctx.beginPath();
        ctx.arc(p.x, cy - 32, 7, 0, Math.PI * 2);
        ctx.stroke();
      }
      // Đang đứng ở cổng đảo này: vòng sáng dưới chân.
      if (arrived === i) {
        ctx.strokeStyle = rgba('#fde047', 0.5 + 0.5 * Math.abs(Math.sin(time * 4)));
        ctx.beginPath();
        ctx.ellipse(p.x, cy + 1, 10, 3, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    });

    drawPlayer(player(), time, dt);
  };
  raf = requestAnimationFrame(frame);

  // ---------------------------------------------------------------- điều khiển
  const typing = (e: KeyboardEvent) => {
    const el = e.target as HTMLElement | null;
    return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
  };
  const keyName = (e: KeyboardEvent) => (e.key.length === 1 ? e.key.toLowerCase() : e.key);
  const onDown = (e: KeyboardEvent) => {
    if (typing(e)) return;
    const k = keyName(e);
    if (dirs[k]) {
      e.preventDefault();
      keys.add(k);
    }
  };
  const onUp = (e: KeyboardEvent) => keys.delete(keyName(e));
  const onBlur = () => keys.clear();
  const onClick = (e: MouseEvent) => {
    const box = canvas.getBoundingClientRect();
    const x = ((e.clientX - box.left) / box.width) * W;
    const y = ((e.clientY - box.top) / box.height) * H;
    let hit: number | 'hub' | null = Math.hypot(x - hub.x, y - hub.y) < 16 ? 'hub' : null;
    pts.forEach((p, i) => {
      if (Math.abs(x - p.x) < 22 && y > p.y - 38 && y < p.y + 18) hit = i;
    });
    if (hit !== null) handle.goTo(hit);
  };
  window.addEventListener('keydown', onDown);
  window.addEventListener('keyup', onUp);
  window.addEventListener('blur', onBlur);
  canvas.addEventListener('click', onClick);
  const ro = new ResizeObserver(layout);
  ro.observe(canvas.parentElement!);

  const handle: WorldHandle = {
    update: (next) => {
      islands = next;
    },
    goTo: (target) => planTo(target === 'hub' ? HUB : target),
    dispose: () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      window.removeEventListener('blur', onBlur);
      canvas.removeEventListener('click', onClick);
      ro.disconnect();
    },
  };
  if (arrived !== null) opts.onArrive(arrived);
  return handle;
}
