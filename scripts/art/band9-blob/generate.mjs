// Sinh bộ mascot "giọt vàng" của Band 9 bằng SVG vẽ bằng mã (không dùng ảnh AI).
// Chạy: node scripts/art/band9-blob/generate.mjs
// Kết quả: assets/mascot/band9-blob/*.svg và preview.html để xem nhanh.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, '..', '..', '..', 'assets', 'mascot', 'band9-blob');

// Bảng màu Band 9: vàng kim + kem + xanh đêm. Đổi ở đây là đổi cả bộ.
const INK = '#1A1305';
const SCLERA = '#FFFBE6';
const GLOW = '#FFB64A';
const SPARK = '#FFE15C';
const HEART = '#FF5C8A';
const ZZZ = '#9BB4FF';

// Thân: tròn, có một chỏm nhọn bên phải và ba mép dưới như ảnh mẫu.
const BODY =
  'M120 30 C170 30 208 66 208 116 C208 150 196 172 186 186 L194 206 L172 196 L160 214 L142 200 L120 212 L98 200 L80 214 L68 196 L46 206 L54 186 C44 172 32 150 32 116 C32 66 70 30 120 30 Z';

const DEFS = `<defs>
  <radialGradient id="body" cx="38%" cy="30%" r="75%">
    <stop offset="0" stop-color="#FFF6C9"/>
    <stop offset="0.45" stop-color="#FFD54A"/>
    <stop offset="1" stop-color="#C77700"/>
  </radialGradient>
  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
    <feGaussianBlur stdDeviation="7" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
</defs>`;

const bodyEl = `<g filter="url(#glow)">
  <path d="${BODY}" fill="url(#body)"/>
  <ellipse cx="88" cy="70" rx="26" ry="13" fill="#fff" opacity="0.35" transform="rotate(-25 88 70)"/>
</g>`;

// Mắt mở: lòng trắng + con ngươi lệch theo hướng nhìn (dx, dy nhỏ).
const eye = (cx, cy, dx = 0, dy = 0) => {
  const px = cx + dx;
  const py = cy + dy;
  return `<ellipse cx="${cx}" cy="${cy}" rx="19" ry="25" fill="${SCLERA}"/>
  <ellipse cx="${px}" cy="${py}" rx="8" ry="19" fill="${INK}"/>
  <circle cx="${px - 3}" cy="${py - 9}" r="3" fill="#fff"/>`;
};
const arcUp = (cx, cy) => `<path d="M${cx - 16} ${cy + 4} Q${cx} ${cy - 12} ${cx + 16} ${cy + 4}" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>`;
const arcDown = (cx, cy) => `<path d="M${cx - 16} ${cy} Q${cx} ${cy + 12} ${cx + 16} ${cy}" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>`;
const line = (x1, y1, x2, y2, color = INK, w = 7) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>`;

const heart = (x, y, s) =>
  `<path d="M${x} ${y + s * 0.3} C${x - s * 0.55} ${y - s * 0.15} ${x - s * 0.5} ${y - s * 0.6} ${x} ${y - s * 0.22} C${x + s * 0.5} ${y - s * 0.6} ${x + s * 0.55} ${y - s * 0.15} ${x} ${y + s * 0.3} Z" fill="${HEART}" stroke="#fff" stroke-opacity="0.5" stroke-width="2"/>`;

const star = (x, y, r) => {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    pts.push(`${(x + rad * Math.cos(a)).toFixed(1)},${(y + rad * Math.sin(a)).toFixed(1)}`);
  }
  return `<polygon points="${pts.join(' ')}" fill="${SPARK}" stroke="#C77700" stroke-width="2" stroke-linejoin="round"/>`;
};

const triangle = (x, y, color = GLOW) => `<path d="M${x} ${y} l9 0 l-4.5 -8 z" fill="${color}"/>`;
const dot = (x, y, r = 3, color = GLOW) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`;

// Chữ Z vẽ bằng nét, không phụ thuộc phông chữ.
const zee = (x, y, s) =>
  `<path d="M${x} ${y} h${16 * s} l-${16 * s} ${16 * s} h${16 * s}" fill="none" stroke="${ZZZ}" stroke-width="${5 * s}" stroke-linejoin="round" stroke-linecap="round"/>`;

// Dấu hỏi vẽ bằng nét.
const question = (x, y, s = 1, color = GLOW) =>
  `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M0 14 C0 -6 26 -10 28 8 C29 22 12 26 12 40" fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round"/>
    <circle cx="12" cy="56" r="5.5" fill="${color}"/>
  </g>`;

const speedLines = (x0, ys, len, color = GLOW) =>
  ys
    .map((y, i) => `<path d="M${x0} ${y} Q${x0 + len / 2} ${y - 4} ${x0 + len} ${y}" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round" opacity="${0.9 - i * 0.2}"/>`)
    .join('\n  ');

const wrap = (inner, rotate = 0) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240">
${DEFS}
<g${rotate ? ` transform="rotate(${rotate} 120 120)"` : ''}>
  ${bodyEl}
  ${inner}
</g>
</svg>
`;

const decorIdle = [triangle(190, 48), triangle(206, 84, HEART), dot(40, 92, 3), triangle(18, 174)].join('\n  ');

const POSES = {
  // Mặc định: đứng yên, mắt nhìn thẳng.
  idle: () =>
    wrap(
      `${eye(90, 118)}\n  ${eye(150, 118)}\n  ${decorIdle}`,
    ),

  // Nháy mắt và tặng tim: dùng khi người học làm đúng, hoặc khi chào.
  'wink-heart': () =>
    wrap(
      `${arcUp(90, 118)}\n  ${eye(150, 118, 2, 0)}\n  ${heart(62, 186, 46)}\n  ${triangle(184, 178)}\n  ${dot(200, 150, 3)}`,
    ),

  // Giận dữ: lông mày chéo xuống vào trong, kèm vệt lao đi.
  angry: () =>
    wrap(
      `${eye(90, 118, 4, 2)}\n  ${eye(150, 118, -4, 2)}\n  ${line(66, 86, 104, 100)}\n  ${line(174, 86, 136, 100)}\n  ${speedLines(14, [104, 128, 152], 46)}\n  ${triangle(184, 196)}`,
    ),

  // Ngủ: mắt nhắm xuống, nghiêng nhẹ, có mây xanh và chữ Z.
  sleep: () =>
    wrap(
      `${arcDown(90, 124)}\n  ${arcDown(150, 124)}\n  <ellipse cx="62" cy="204" rx="34" ry="26" fill="${ZZZ}" opacity="0.45"/>\n  <ellipse cx="96" cy="216" rx="26" ry="20" fill="${ZZZ}" opacity="0.4"/>\n  ${zee(168, 40, 1)}\n  ${zee(186, 22, 0.75)}\n  ${triangle(196, 186)}`,
      -6,
    ),

  // Nghi ngờ: mắt nhìn lên, có dấu hỏi.
  question: () =>
    wrap(
      `${eye(90, 118, 4, -4)}\n  ${eye(150, 118, 4, -4)}\n  ${question(170, 26, 0.9)}\n  ${dot(206, 126, 3, HEART)}\n  ${triangle(200, 180)}`,
    ),

  // Mừng: mắt cười ^^, có ngôi sao.
  cheer: () =>
    wrap(
      `${arcUp(90, 118)}\n  ${arcUp(150, 118)}\n  ${star(60, 190, 26)}\n  ${triangle(196, 60)}\n  ${triangle(206, 132, HEART)}\n  ${star(196, 180, 10)}`,
    ),

  // Đang tải: lao sang phải, nhìn phía trước, có vệt chuyển động.
  loading: () =>
    wrap(
      `${eye(90, 118, 6, 0)}\n  ${eye(150, 118, 6, 0)}\n  ${speedLines(10, [96, 120, 144], 70, GLOW)}`,
    ),

  // Lỗi: mắt lo, lông mày vểnh, miệng méo, giọt mồ hôi.
  error: () =>
    wrap(
      `${eye(90, 118, 0, 4)}\n  ${eye(150, 118, 0, 4)}\n  ${line(70, 92, 104, 84)}\n  ${line(170, 92, 136, 84)}\n  <path d="M100 172 q10 -7 20 0 t20 0 t20 0" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>\n  <path d="M184 92 Q178 104 184 110 Q190 104 184 92 Z" fill="#7FD3FF"/>\n  ${question(186, 14, 0.5)}`,
    ),
};

mkdirSync(OUT, { recursive: true });
const names = Object.keys(POSES);
for (const name of names) {
  writeFileSync(join(OUT, `${name}.svg`), POSES[name]());
}

const cards = names
  .map((n) => `<figure><img src="${n}.svg" width="240" height="240" alt="${n}"><figcaption>${n}</figcaption></figure>`)
  .join('\n  ');
writeFileSync(
  join(OUT, 'preview.html'),
  `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Mascot giọt vàng Band 9</title>
<style>
body{margin:0;background:#0B1026;color:#FFE9A8;font-family:system-ui,sans-serif;padding:24px}
h1{font-size:18px;font-weight:600;margin:0 0 16px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:18px}
figure{margin:0;background:#101a3a;border-radius:18px;padding:12px;text-align:center}
img{display:block;margin:0 auto;max-width:100%;height:auto}
figcaption{margin-top:6px;font-size:13px;opacity:.8}
</style></head><body>
<h1>Mascot giọt vàng Band 9 — ${names.length} tư thế</h1>
<div class="grid">
  ${cards}
</div>
</body></html>
`,
);

console.log(`Đã ghi ${names.length} tư thế vào ${OUT}`);
