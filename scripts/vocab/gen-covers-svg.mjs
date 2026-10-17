// Vẽ ảnh bìa cho 50 chủ đề từ vựng bằng code (SVG, không gọi API).
// Chạy: node scripts/vocab/gen-covers-svg.mjs
// Ghi ra public/vocab-covers/<slug>.svg và cập nhật src/data/vocab-covers.ts.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
// Danh sách bộ từ: xuất bằng scripts/vocab/export-deck-manifest.ts (chạy lại khi thêm bộ).
const decks = JSON.parse(readFileSync(join(ROOT, 'scripts/vocab/deck-manifest.json'), 'utf8'));

// Mười bảng màu luân phiên theo thứ tự chủ đề, để các thẻ cạnh nhau khác màu.
const PALETTES = [
  ['#0E7490', '#67E8F9'], ['#312E81', '#A5B4FC'], ['#B45309', '#FCD34D'], ['#BE123C', '#FDA4AF'], ['#047857', '#6EE7B7'],
  ['#6D28D9', '#C4B5FD'], ['#0369A1', '#7DD3FC'], ['#C2410C', '#FDBA74'], ['#4D7C0F', '#BEF264'], ['#A21CAF', '#F5D0FE'],
];
const INK = '#2A1808';

// ---- màu -------------------------------------------------------------------
const hex = (h) => [0, 2, 4].map((i) => parseInt(h.slice(1 + i, 3 + i), 16));
const toHex = (a) => '#' + a.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
const mix = (c, to, t) => {
  const a = hex(c);
  const b = hex(to);
  return toHex(a.map((v, i) => v + (b[i] - v) * t));
};
const lite = (c, t = 0.35) => mix(c, '#FFFFFF', t);
const dark = (c, t = 0.25) => mix(c, '#000000', t);

// ---- hình trang trí --------------------------------------------------------
const sparkle = (x, y, s, fill, op = 1) =>
  `<path transform="translate(${x} ${y}) scale(${s})" d="M0 -22Q3 -3 22 0Q3 3 0 22Q-3 3 -22 0Q-3 -3 0 -22Z" fill="${fill}" opacity="${op}"/>`;

// ---- hình vẽ: mỗi hình vẽ trong khung ~200×200 quanh gốc (0,0). f = bộ tô màu. -------
// Người đơn giản (đầu + thân) dùng cho hình nhóm.
const person = (x, y, s, fill) =>
  `<circle cx="${x}" cy="${y - 40 * s}" r="${22 * s}" fill="${fill}"/><path d="M${x - 42 * s} ${y + 62 * s}Q${x - 42 * s} ${y - 8 * s} ${x} ${y - 8 * s}Q${x + 42 * s} ${y - 8 * s} ${x + 42 * s} ${y + 62 * s}Z" fill="${fill}"/>`;

const M = {
  book: (f) => `
    <path d="M-100 -80Q-100 -94-88 -94L-8 -90V88L-88 86Q-100 86-100 72Z" fill="${f.A}"/>
    <path d="M100 -80Q100 -94 88 -94L8 -90V88L88 86Q100 86 100 72Z" fill="${f.B}"/>
    <path d="M-90 -76L-10 -72V80L-90 78Z" fill="${f.P}"/>
    <path d="M90 -76L10 -72V80L90 78Z" fill="${f.P}"/>
    <path d="M-74 -44H-26M-74 -18H-26M-74 8H-34M26 -44H74M26 -18H66" stroke="${f.c1}" stroke-width="6" stroke-linecap="round" opacity=".35"/>
    <rect x="-10" y="-90" width="20" height="178" fill="${f.I}" opacity=".14"/>
    <path d="M36 86V126L46 114L56 126V86Z" fill="${f.c2}"/>`,
  globe: (f) => `
    <circle r="96" fill="${f.S}"/>
    <path d="M-66-36C-44-64-8-60 8-38S30-14 56-22S86-2 86 16C70 48 40 72 4 78C-22 82-50 72-64 46C-72 22-74 0-66-36Z" fill="${f.S2}" opacity=".95"/>
    <path d="M-34 32C-16 20 6 34 16 56C2 72-24 68-34 32Z" fill="${f.S2}" opacity=".85"/>
    <ellipse rx="96" ry="32" fill="none" stroke="${f.W}" stroke-width="3" opacity=".5"/>
    <ellipse rx="42" ry="96" fill="none" stroke="${f.W}" stroke-width="3" opacity=".5"/>
    <circle cx="-40" cy="-44" r="18" fill="${f.W}" opacity=".5"/>`,
  leaf: (f) => `
    <path d="M-86 64C-96-40-12-98 96-88C98 24 22 88-86 64Z" fill="${f.A}"/>
    <path d="M-74 58Q-6 4 70-74" stroke="${f.B}" stroke-width="8" fill="none" stroke-linecap="round"/>
    <path d="M-36 24Q-18-2 6-10M-6 -4Q10-30 30-40M14 -28Q32-50 56-58" stroke="${f.B}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".7"/>
    <path d="M-86 64L-124 116" stroke="${f.c1}" stroke-width="11" stroke-linecap="round"/>
    <path d="M-40 -40Q-10-70 30-70" stroke="${f.W}" stroke-width="6" fill="none" stroke-linecap="round" opacity=".4"/>`,
  sun: (f) => {
    const rays = Array.from({ length: 12 }, (_, i) => {
      const a = (i * Math.PI) / 6;
      const w = 0.16;
      const p = (r, t) => `${(Math.cos(t) * r).toFixed(1)} ${(Math.sin(t) * r).toFixed(1)}`;
      return `<path d="M${p(72, a - w)}L${p(116, a)}L${p(72, a + w)}Z" fill="${f.B}"/>`;
    }).join('');
    return `<circle r="128" fill="${f.W}" opacity=".12"/>${rays}<circle r="66" fill="${f.S}"/><circle cx="-18" cy="-20" r="14" fill="${f.W}" opacity=".55"/>`;
  },
  building: (f) => {
    const lit = [-44, -12, 20].flatMap((x) => [-64, -30, 4, 38].map((y) => `<rect x="${x - 7}" y="${y}" width="18" height="18" rx="3" fill="#FFE49A"/>`)).join('');
    return `
    <rect x="-96" y="-88" width="100" height="176" rx="10" fill="${f.A}"/>
    <rect x="8" y="-44" width="88" height="132" rx="10" fill="${f.B}"/>
    <rect x="-96" y="-88" width="100" height="10" rx="5" fill="${f.W}" opacity=".3"/>
    ${lit}
    <rect x="22" y="36" width="20" height="40" rx="4" fill="${f.I}" opacity=".5"/>
    <path d="M-46 -88V-116" stroke="${f.I}" stroke-width="5" stroke-linecap="round" opacity=".5"/>
    <circle cx="-46" cy="-120" r="6" fill="#FF6B6B"/>
    <rect x="-112" y="88" width="224" height="12" rx="6" fill="${f.I}" opacity=".22"/>`;
  },
  car: (f) => `
    <path d="M-100 16Q-100-8-76-10L-40-14L-14-58Q-6-70 10-70H48Q62-70 72-58L96-14Q108-8 108 14V40Q108 52 96 52H-88Q-100 52-100 40Z" fill="${f.A}"/>
    <path d="M-12 -52L-2 -64H40Q50-64 58-54L76-14H-40Z" fill="#CDEBFF" opacity=".95"/>
    <path d="M-6 -50L4 -62H12V-14H-18Z" fill="${f.W}" opacity=".4"/>
    <rect x="-100" y="20" width="200" height="8" rx="4" fill="${f.I}" opacity=".15"/>
    <circle cx="-58" cy="52" r="26" fill="${f.I}"/><circle cx="-58" cy="52" r="12" fill="${f.W}"/>
    <circle cx="58" cy="52" r="26" fill="${f.I}"/><circle cx="58" cy="52" r="12" fill="${f.W}"/>
    <circle cx="98" cy="10" r="7" fill="#FFE49A"/>`,
  coin: (f) => `
    <ellipse cy="16" rx="88" ry="88" fill="${f.c2}" opacity=".9"/>
    <circle cy="8" r="88" fill="${f.S}"/>
    <circle cy="8" r="66" fill="none" stroke="${f.W}" stroke-width="7" opacity=".55"/>
    <path d="M0 -32L10 -10L34 -8L15 6L22 30L0 17L-22 30L-15 6L-34 -8L-10 -10Z" fill="${f.W}" opacity=".5" transform="translate(0 8)"/>
    <path d="M-52 -40Q-30 -66-6 -66" stroke="${f.W}" stroke-width="7" fill="none" stroke-linecap="round" opacity=".5"/>`,
  chart: (f) => `
    <path d="M-104 90H104M-104 90V-100" stroke="${f.I}" stroke-width="5" stroke-linecap="round" opacity=".35"/>
    <rect x="-86" y="34" width="40" height="56" rx="10" fill="${f.B}"/>
    <rect x="-34" y="-4" width="40" height="94" rx="10" fill="${f.A}"/>
    <rect x="18" y="-42" width="40" height="132" rx="10" fill="${f.B}"/>
    <rect x="70" y="-84" width="40" height="174" rx="10" fill="${f.A}"/>
    <rect x="-34" y="-4" width="40" height="12" rx="6" fill="${f.W}" opacity=".35"/>
    <rect x="70" y="-84" width="40" height="12" rx="6" fill="${f.W}" opacity=".35"/>
    <path d="M-92 -58L-30 -26L22 -62L86 -110" stroke="${f.I}" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".55"/>
    <path d="M86 -110L70 -108M86 -110L84 -94" stroke="${f.I}" stroke-width="7" stroke-linecap="round" opacity=".55"/>`,
  phone: (f) => `
    <rect x="-70" y="-116" width="140" height="232" rx="28" fill="${f.A}"/>
    <rect x="-58" y="-102" width="116" height="204" rx="18" fill="${f.P}"/>
    <rect x="-22" y="-108" width="44" height="8" rx="4" fill="${f.I}" opacity=".5"/>
    <rect x="-44" y="-84" width="36" height="36" rx="10" fill="${f.A}"/>
    <rect x="8" y="-84" width="36" height="36" rx="10" fill="${f.B}"/>
    <rect x="-44" y="-38" width="36" height="36" rx="10" fill="${f.B}"/>
    <rect x="8" y="-38" width="36" height="36" rx="10" fill="${f.A}"/>
    <rect x="-44" y="10" width="88" height="22" rx="10" fill="${f.A}" opacity=".5"/>
    <circle cy="88" r="10" fill="${f.I}" opacity=".3"/>`,
  heart: (f) => `
    <path d="M0 78C-108 8-100-84-46-84C-16-84 0-58 0-42C0-58 16-84 46-84C100-84 108 8 0 78Z" fill="${f.A}"/>
    <path d="M-62-46Q-54-70-30-72" stroke="${f.W}" stroke-width="8" fill="none" stroke-linecap="round" opacity=".55"/>
    <path d="M-40 -6Q-30 -26 -12 -30" stroke="${f.W}" stroke-width="5" fill="none" stroke-linecap="round" opacity=".3"/>`,
  star: (f) => {
    const pts = Array.from({ length: 10 }, (_, i) => {
      const r = i % 2 === 0 ? 100 : 46;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      return `${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`;
    }).join(' ');
    return `<polygon points="${pts}" fill="${f.A}" stroke="${f.B}" stroke-width="6" stroke-linejoin="round"/><circle r="26" fill="${f.W}" opacity=".35"/>`;
  },
  bulb: (f) => {
    const rays = Array.from({ length: 8 }, (_, i) => {
      const a = (i * Math.PI) / 4;
      return `<line x1="${(Math.cos(a) * 108).toFixed(1)}" y1="${(-18 + Math.sin(a) * 108).toFixed(1)}" x2="${(Math.cos(a) * 136).toFixed(1)}" y2="${(-18 + Math.sin(a) * 136).toFixed(1)}" stroke="${f.B}" stroke-width="9" stroke-linecap="round"/>`;
    }).join('');
    return `${rays}
    <circle cy="-18" r="74" fill="${f.S}" opacity=".96"/>
    <path d="M-30 -16L-14 -40L0 -6L14 -40L30 -16" stroke="#FFB020" stroke-width="6" fill="none" stroke-linejoin="round" stroke-linecap="round"/>
    <rect x="-36" y="50" width="72" height="38" rx="12" fill="${f.A}"/>
    <path d="M-36 62H36M-36 76H36" stroke="${f.W}" stroke-width="5" opacity=".5"/>
    <rect x="-24" y="92" width="48" height="16" rx="8" fill="${f.I}" opacity=".45"/>
    <path d="M-44-40Q-40-64-18-72" stroke="${f.W}" stroke-width="9" fill="none" stroke-linecap="round" opacity=".55"/>`;
  },
  cup: (f) => `
    <ellipse cy="82" rx="110" ry="22" fill="${f.B}"/>
    <path d="M-78-22H78V42C78 84 50 106 0 106C-50 106-78 84-78 42Z" fill="${f.S}"/>
    <path d="M78 6H104C126 6 126 62 100 62H78" stroke="${f.A}" stroke-width="16" fill="none"/>
    <ellipse cy="-22" rx="78" ry="16" fill="#F3D9A8"/>
    <path d="M-16-22C-16-30-6-30 0-24C6-30 16-30 16-22C16-14 0-8 0-8C0-8-16-14-16-22Z" fill="#B8733A" opacity=".75"/>
    <path d="M-38-60Q-52-84-36-106M4-62Q-10-86 6-108M44-60Q30-84 46-106" stroke="${f.B}" stroke-width="7" fill="none" stroke-linecap="round" opacity=".75"/>
    <path d="M-62 20Q-62 60-40 78" stroke="${f.W}" stroke-width="7" fill="none" stroke-linecap="round" opacity=".4"/>`,
  drop: (f) => `
    <ellipse cy="84" rx="100" ry="16" fill="${f.B}" opacity=".5"/>
    <ellipse cy="84" rx="62" ry="9" fill="${f.B}" opacity=".7"/>
    <path d="M0-98C58-26 84 12 84 46A84 84 0 0 1-84 46C-84 12-58-26 0-98Z" fill="${f.S}"/>
    <path d="M-36 30Q-36 2-8-12" stroke="${f.W}" stroke-width="9" fill="none" stroke-linecap="round" opacity=".6"/>
    <circle cx="26" cy="-4" r="9" fill="${f.W}" opacity=".35"/>`,
  tree: (f) => `
    <path d="M-16 6H16L22 96H-22Z" fill="${f.A}"/>
    <path d="M-8 20V90" stroke="${f.W}" stroke-width="4" opacity=".25"/>
    <circle cx="-44" cy="-18" r="58" fill="${f.S}"/>
    <circle cx="48" cy="-14" r="58" fill="${f.S2}"/>
    <circle cx="0" cy="-72" r="66" fill="${f.S}"/>
    <circle cx="-26" cy="-92" r="18" fill="${f.W}" opacity=".3"/>
    <circle cx="28" cy="-44" r="10" fill="#FFB8C6" opacity=".9"/>
    <circle cx="-62" cy="6" r="8" fill="#FFB8C6" opacity=".8"/>`,
  bubble: (f) => `
    <path d="M-100-74H50Q74-74 74-50V6Q74 30 50 30H-44L-70 56L-62 30H-100Q-124 30-124 6V-50Q-124-74-100-74Z" fill="${f.A}"/>
    <path d="M-40 18Q-40 0-22 0H96Q116 0 116 22V60Q116 80 96 80H72L98 106L84 80H-22Q-40 80-40 60Z" fill="${f.B}"/>
    <circle cx="-86" cy="-24" r="10" fill="${f.W}"/><circle cx="-54" cy="-24" r="10" fill="${f.W}"/><circle cx="-22" cy="-24" r="10" fill="${f.W}"/>
    <path d="M-20 42H86M-20 60H54" stroke="${f.W}" stroke-width="7" stroke-linecap="round" opacity=".6"/>`,
  planet: (f) => `
    <ellipse rx="128" ry="34" fill="none" stroke="${f.B}" stroke-width="14" transform="rotate(-18)"/>
    <circle r="70" fill="${f.S}"/>
    <path d="M-70-6Q-20-20 0-6T70-6" stroke="${f.B}" stroke-width="8" fill="none" opacity=".5"/>
    <path d="M-60 26Q-20 14 10 26T60 26" stroke="${f.W}" stroke-width="6" fill="none" opacity=".25"/>
    <circle cx="-30" cy="-34" r="16" fill="${f.W}" opacity=".4"/>
    <g clip-path="url(#front)"><ellipse rx="128" ry="34" fill="none" stroke="${f.B}" stroke-width="14" transform="rotate(-18)"/></g>`,
  plane: (f) => `
    <path d="M-120 -6C-120-18-112-22-104-18L100-12C124-10 136 0 136 4C136 8 124 14 100 12L-104 6C-112 8-120 4-120-6Z" fill="${f.A}" transform="rotate(-8)"/>
    <path d="M-16 0L-74-96L-44-100L36-6Z" fill="${f.B}"/>
    <path d="M-16 0L-74 96L-44 100L36 6Z" fill="${f.B}"/>
    <path d="M-100-14L-124-60L-108-62L-80-16Z" fill="${f.B}"/>
    <circle cx="70" cy="-2" r="7" fill="${f.W}" opacity=".7"/><circle cx="48" cy="-2" r="7" fill="${f.W}" opacity=".7"/><circle cx="26" cy="-2" r="7" fill="${f.W}" opacity=".7"/>
    <path d="M-150 14H-124" stroke="${f.W}" stroke-width="6" stroke-linecap="round" stroke-dasharray="2 12" opacity=".7"/>`,
  magnifier: (f) => `
    <line x1="40" y1="40" x2="104" y2="104" stroke="${f.B}" stroke-width="30" stroke-linecap="round"/>
    <circle cx="-12" cy="-12" r="72" fill="${f.W}" opacity=".5"/>
    <circle cx="-12" cy="-12" r="72" fill="none" stroke="${f.A}" stroke-width="22"/>
    <path d="M-50-36Q-36-62-8-66" stroke="${f.W}" stroke-width="9" fill="none" stroke-linecap="round" opacity=".7"/>
    <path d="M-4 -12L8 0" stroke="${f.W}" stroke-width="0"/>`,
  palette: (f) => `
    <path d="M0-100C64-100 104-60 104-14C104 28 72 42 50 32C30 22 28 46 38 70C46 92 32 100 0 100C-60 100-100 56-100 0C-100-60-58-100 0-100Z" fill="${f.A}"/>
    <path d="M0-100C64-100 104-60 104-14C104 28 72 42 50 32" fill="none" stroke="${f.W}" stroke-width="6" opacity=".25"/>
    <circle cx="-50" cy="-18" r="18" fill="#F25F5C"/>
    <circle cx="-8" cy="-52" r="18" fill="#FFE066"/>
    <circle cx="42" cy="-36" r="18" fill="#50C878"/>
    <circle cx="-38" cy="34" r="18" fill="#4FA3FF"/>
    <circle cx="-62" cy="-68" r="6" fill="${f.W}" opacity=".7"/>`,
  bowl: (f) => `
    <ellipse cy="-6" rx="108" ry="22" fill="#FFF6E6"/>
    <path d="M-104-6H104C104 80 56 110 0 110C-56 110-104 80-104-6Z" fill="url(#gP)"/>
    <path d="M-104-6H104" stroke="${f.A}" stroke-width="12" stroke-linecap="round"/>
    <ellipse cy="-6" rx="96" ry="14" fill="${f.B}" opacity=".9"/>
    <circle cx="-40" cy="-16" r="22" fill="#FF8A4C"/><circle cx="-40" cy="-16" r="8" fill="#FFD0B0" opacity=".7"/>
    <circle cx="18" cy="-24" r="18" fill="#7BD389"/>
    <circle cx="50" cy="-10" r="16" fill="#FFD966"/>
    <path d="M-80 36Q-80 70-46 84" stroke="${f.W}" stroke-width="8" fill="none" stroke-linecap="round" opacity=".45"/>`,
  paw: (f) => `
    <path d="M0 16C-58 16-72 56-62 76C-52 98 -22 100 0 92C22 100 52 98 62 76C72 56 58 16 0 16Z" fill="${f.A}"/>
    <ellipse cx="-66" cy="-34" rx="24" ry="30" fill="${f.B}" transform="rotate(-16 -66 -34)"/>
    <ellipse cx="-22" cy="-72" rx="24" ry="30" fill="${f.B}"/>
    <ellipse cx="22" cy="-72" rx="24" ry="30" fill="${f.B}"/>
    <ellipse cx="66" cy="-34" rx="24" ry="30" fill="${f.B}" transform="rotate(16 66 -34)"/>
    <path d="M-40 52Q0 30 40 52" stroke="${f.W}" stroke-width="7" fill="none" stroke-linecap="round" opacity=".35"/>`,
  face: (f) => `
    <circle r="100" fill="${f.S}"/>
    <ellipse cx="-38" cy="-16" rx="13" ry="20" fill="${f.I}"/>
    <ellipse cx="38" cy="-16" rx="13" ry="20" fill="${f.I}"/>
    <circle cx="-34" cy="-24" r="4.5" fill="${f.W}"/><circle cx="42" cy="-24" r="4.5" fill="${f.W}"/>
    <path d="M-48 30Q0 84 48 30" stroke="${f.I}" stroke-width="11" fill="none" stroke-linecap="round"/>
    <circle cx="-68" cy="26" r="16" fill="#FF9EB5" opacity=".7"/><circle cx="68" cy="26" r="16" fill="#FF9EB5" opacity=".7"/>
    <path d="M-62-52Q-44-76-16-80" stroke="${f.W}" stroke-width="9" fill="none" stroke-linecap="round" opacity=".5"/>`,
  shield: (f) => `
    <path d="M0-104L92-66V4C92 62 46 94 0 112C-46 94-92 62-92 4V-66Z" fill="${f.A}"/>
    <path d="M0-80L66-54V4C66 44 34 70 0 86C-34 70-66 44-66 4V-54Z" fill="${f.B}"/>
    <path d="M-32 2L-8 26L34-22" stroke="${f.W}" stroke-width="16" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M-60-42Q-46-70-16-80" stroke="${f.W}" stroke-width="7" fill="none" stroke-linecap="round" opacity=".45"/>`,
  bag: (f) => `
    <path d="M-44-44Q-44-100 0-100Q44-100 44-44" stroke="${f.B}" stroke-width="16" fill="none" stroke-linecap="round"/>
    <path d="M-92-44H92L100 86Q100 104 82 104H-82Q-100 104-100 86Z" fill="${f.A}"/>
    <path d="M-92-44H92L96-6H-96Z" fill="${f.W}" opacity=".18"/>
    <path d="M-62 30H62" stroke="${f.W}" stroke-width="5" stroke-dasharray="6 10" opacity=".6"/>
    <circle cx="0" cy="58" r="16" fill="${f.B}"/>
    <path d="M-72-30Q-60-50-36-54" stroke="${f.W}" stroke-width="7" fill="none" stroke-linecap="round" opacity=".45"/>`,
  ball: (f) => `
    <circle r="98" fill="${f.S}"/>
    <path d="M-98 0H98M0-98V98" stroke="${f.B}" stroke-width="8" opacity=".6"/>
    <path d="M-70-70Q0 0-70 70M70-70Q0 0 70 70" stroke="${f.B}" stroke-width="8" fill="none" opacity=".6"/>
    <circle cx="-40" cy="-44" r="18" fill="${f.W}" opacity=".45"/>`,
  note: (f) => `<ellipse cx="-46" cy="70" rx="46" ry="34" fill="${f.A}" transform="rotate(-20 -46 70)"/><ellipse cx="54" cy="52" rx="46" ry="34" fill="${f.B}" transform="rotate(-20 54 52)"/><rect x="-6" y="-80" width="16" height="142" rx="6" fill="${f.A}"/><rect x="94" y="-96" width="16" height="142" rx="6" fill="${f.B}"/><path d="M10-80L110-96V-66L10-50Z" fill="${f.B}"/>`,
  gear: (f) => {
    const pts = Array.from({ length: 24 }, (_, i) => {
      const a = (i * Math.PI) / 12;
      const r = i % 2 === 0 ? 98 : 78;
      return `${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`;
    }).join(' ');
    return `<polygon points="${pts}" fill="${f.A}" stroke="${f.B}" stroke-width="4" stroke-linejoin="round"/><circle r="38" fill="${f.S}"/><circle r="16" fill="${f.W}" opacity=".85"/>`;
  },
  scale: (f) => `<g transform="scale(1.32)"><rect x="-7" y="-96" width="14" height="168" rx="7" fill="${f.A}"/><rect x="-44" y="72" width="88" height="16" rx="8" fill="${f.A}"/><path d="M-120-46H120" stroke="${f.A}" stroke-width="12" stroke-linecap="round"/><circle cy="-96" r="14" fill="${f.W}"/><path d="M-90-40L-90-8M90-40L90-8" stroke="${f.I}" stroke-width="4" opacity=".5"/><path d="M-132-8H-48Q-66 34-90 34Q-114 34-132-8Z" fill="${f.B}"/><path d="M48-8H132Q114 34 90 34Q66 34 48-8Z" fill="${f.B}"/></g>`,
  flag: (f) => `<rect x="-88" y="-104" width="12" height="214" rx="6" fill="${f.I}" opacity=".55"/><path d="M-76-104Q-30-124 14-100T104-102V-26Q60-48 18-26T-76-40Z" fill="${f.A}"/><path d="M-76-104Q-30-124 14-100" stroke="${f.W}" stroke-width="5" fill="none" opacity=".45"/><circle cx="-6" cy="-62" r="14" fill="${f.W}" opacity=".7"/>`,
  people: (f) => `${person(-86, 22, 0.78, f.B)}${person(86, 22, 0.78, f.B)}${person(0, -4, 1.1, f.A)}`,
  thermo: (f) => `<rect x="-26" y="-102" width="52" height="152" rx="26" fill="${f.W}" stroke="${f.I}" stroke-opacity=".2" stroke-width="4"/><rect x="-12" y="-62" width="24" height="136" rx="12" fill="${f.A}"/><circle cy="72" r="42" fill="${f.B}"/><circle cy="72" r="26" fill="${f.A}"/><path d="M-6-40V0" stroke="${f.W}" stroke-width="5" stroke-linecap="round" opacity=".5"/>`,
  key: (f) => `<circle cx="-56" cy="-26" r="52" fill="none" stroke="${f.A}" stroke-width="22"/><rect x="-6" y="-14" width="124" height="24" rx="10" fill="${f.B}"/><rect x="70" y="8" width="18" height="34" rx="6" fill="${f.B}"/><rect x="100" y="8" width="18" height="24" rx="6" fill="${f.B}"/><circle cx="-56" cy="-26" r="14" fill="${f.W}" opacity=".6"/>`,
  robot: (f) => `<rect x="-6" y="-84" width="12" height="36" fill="${f.B}"/><circle cy="-92" r="12" fill="#FFB020"/><rect x="-70" y="-32" width="140" height="112" rx="26" fill="${f.A}"/><rect x="-52" y="-14" width="104" height="62" rx="16" fill="${f.P}"/><circle cx="-24" cy="16" r="12" fill="${f.I}"/><circle cx="24" cy="16" r="12" fill="${f.I}"/><path d="M-20 44H20" stroke="${f.I}" stroke-width="6" stroke-linecap="round"/><circle cx="-70" cy="22" r="10" fill="${f.B}"/><circle cx="70" cy="22" r="10" fill="${f.B}"/>`,
  briefcase: (f) => `<path d="M-40-50V-74Q-40-90-24-90H24Q40-90 40-74V-50" stroke="${f.B}" stroke-width="14" fill="none"/><rect x="-100" y="-50" width="200" height="140" rx="20" fill="${f.A}"/><rect x="-100" y="8" width="200" height="8" fill="${f.W}" opacity=".3"/><rect x="-14" y="-4" width="28" height="22" rx="6" fill="${f.W}" opacity=".85"/>`,
  wave: (f) => `
    <path d="M-124-10Q-62-86 0-10T124-10" stroke="${f.A}" stroke-width="22" fill="none" stroke-linecap="round"/>
    <path d="M-124 44Q-62-30 0 44T124 44" stroke="${f.B}" stroke-width="22" fill="none" stroke-linecap="round"/>
    <path d="M-124 98Q-62 24 0 98T124 98" stroke="${f.I}" stroke-width="12" fill="none" stroke-linecap="round" opacity=".22"/>`,
};

// Mỗi chủ đề: hình chính + hình phụ nhỏ ở góc.
const SCENE = {
  education: ['book', 'star'], environment: ['leaf', 'globe'], technology: ['phone', 'bulb'], health: ['heart', 'leaf'],
  work: ['building', 'chart'], society: ['bubble', 'heart'], government: ['building', 'shield'], economy: ['chart', 'coin'],
  media: ['phone', 'bubble'], culture: ['cup', 'star'], family: ['heart', 'building'], transport: ['car', 'globe'],
  tourism: ['plane', 'globe'], 'city-life': ['building', 'car'], crime: ['magnifier', 'shield'], science: ['magnifier', 'planet'],
  art: ['palette', 'star'], sport: ['ball', 'star'], food: ['bowl', 'leaf'], housing: ['building', 'tree'],
  money: ['coin', 'chart'], globalisation: ['globe', 'plane'], language: ['bubble', 'book'], children: ['ball', 'star'],
  elderly: ['cup', 'tree'], animals: ['paw', 'tree'], space: ['planet', 'star'], happiness: ['sun', 'heart'],
  history: ['book', 'building'], energy: ['bulb', 'sun'], personality: ['face', 'star'], emotions: ['face', 'heart'],
  places: ['globe', 'tree'], memories: ['book', 'heart'], 'success-failure': ['star', 'chart'], 'risk-safety': ['shield', 'bulb'],
  ethics: ['book', 'shield'], change: ['leaf', 'wave'], comparison: ['chart', 'bubble'], 'cause-effect': ['wave', 'bulb'],
  agriculture: ['leaf', 'sun'], 'animals-nature': ['paw', 'tree'], 'weather-climate': ['sun', 'drop'], architecture: ['building', 'tree'],
  fashion: ['bag', 'heart'], festivals: ['star', 'sun'], shopping: ['bag', 'coin'], leisure: ['cup', 'ball'],
  communication: ['bubble', 'phone'], 'ai-future': ['bulb', 'planet'],
};


// Luật từ khoá cho các bộ không phải chủ đề chính: tên tiếng Anh + tiếng Việt, luật đứng trước thắng.
const SCENE_RULES = [
  [/weather|climate|thời tiết|khí hậu|rain|storm|mưa|bão/, ['sun', 'drop']],
  [/family|friend|relation|gia đình|bạn bè|quan hệ|dating|wedding|marriage|love/, ['heart', 'tree']],
  [/doctor|health|hospital|medic|bệnh|sức khoẻ|sức khỏe|body|fitness|diet|dinh dưỡng|thuốc|keeping fit/, ['heart', 'leaf']],
  [/food|restaurant|meal|cook|eat|drink|coffee|cafe|menu|nhà hàng|món|ăn|uống|nấu|cà phê|cuisine|dish/, ['bowl', 'cup']],
  [/hotel|travel|trip|airport|flight|plane|tour|vacation|du lịch|khách sạn|sân bay|vé máy bay|tourism|destination|booking/, ['plane', 'globe']],
  [/train|bus|car |cars|road|traffic|street|transport|driv|giao thông|đường|xe |ô tô|taxi|bicycle|city|thành phố|urban|đô thị/, ['car', 'building']],
  [/money|bank|price|pay|cost|coin|budget|tiền|ngân hàng|giá|chi tiêu|tài chính|finance|invest|economy|kinh tế|market/, ['coin', 'chart']],
  [/shop|buy|sell|purchase|store|mua|bán|cửa hàng|sale|retail|consumer|shipping/, ['bag', 'coin']],
  [/phone|internet|online|computer|digital|software|website|technology|công nghệ|máy tính|mạng|media|news|báo|truyền thông|television|radio/, ['phone', 'bulb']],
  [/music|song|art|paint|film|movie|theatre|dance|nghệ thuật|âm nhạc|phim|draw|design|photograph|fashion|style/, ['palette', 'star']],
  [/sport|game|play|team|ball|match|exercise|thể thao|trò chơi|chơi|fun/, ['ball', 'star']],
  [/animal|pet|dog|cat|wild|zoo|động vật|thú|bird|fish|farm/, ['paw', 'tree']],
  [/nature|forest|tree|plant|garden|green|environment|thiên nhiên|môi trường|land|water|ocean|sea/, ['leaf', 'sun']],
  [/space|planet|galaxy|astronom|vũ trụ|thiên văn|moon|rocket/, ['planet', 'star']],
  [/math|algebra|geometry|trigonometry|equation|số học|toán|ratio|statistic|data/, ['chart', 'bulb']],
  [/science|research|experiment|lab|analysis|nghiên cứu|khoa học|thí nghiệm|phân tích|scientist/, ['magnifier', 'planet']],
  [/communicat|speak|talk|conversation|chat|greet|giao tiếp|hội thoại|chào|tán gẫu|hỏi|question|say|talk/, ['bubble', 'heart']],
  [/school|student|lesson|learn|education|exam|class|book|read|literature|giáo dục|học|sách|trường|thi |language|ngôn ngữ|word|grammar|vocabulary|từ vựng|english/, ['book', 'star']],
  [/job|work|office|career|business|company|manag|employ|hire|interview|meeting|việc làm|công việc|văn phòng|công ty|nghề|phỏng vấn|nhân sự|project|contract|negotiat|đàm phán|hr /, ['building', 'chart']],
  [/law|government|politic|court|crime|police|justice|pháp luật|chính phủ|tội phạm|cảnh sát|ethic|đạo đức|rule/, ['shield', 'building']],
  [/festival|celebrat|party|holiday|lễ hội|ăn mừng|tết|event|sự kiện|ticket|show/, ['star', 'sun']],
  [/history|ancient|past|culture|tradition|heritage|lịch sử|văn hoá|văn hóa|truyền thống|cổ/, ['book', 'building']],
  [/house|home|room|rent|accommodation|housing|apartment|chỗ ở|nhà ở|thuê nhà|living|furniture|kitchen|nhà/, ['building', 'tree']],
  [/child|kid|youth|teen|trẻ em|thanh niên|toy/, ['ball', 'star']],
  [/elder|retire|người cao tuổi|old age/, ['cup', 'tree']],
  [/personality|emotion|feel|mood|character|happy|sad|tính cách|cảm xúc|hạnh phúc|mental|psych|stress|tâm lý/, ['face', 'heart']],
  [/risk|safety|danger|accident|safe|an toàn|rủi ro|nguy hiểm|protect|insurance/, ['shield', 'bulb']],
  [/energy|electric|power|solar|năng lượng|điện/, ['bulb', 'sun']],
  [/invent|discover|machine|phát minh|khám phá|máy móc|robot|ai |technolog/, ['bulb', 'planet']],
  [/success|fail|win|goal|achiev|thành công|thất bại|mục tiêu|improve/, ['star', 'chart']],
  [/compar|contrast|cause|effect|result|nguyên nhân|kết quả|so sánh/, ['chart', 'wave']],
  [/transition|connect|link|however|therefore|từ nối|conjunction|logic|verbal|sat verbal/, ['wave', 'bubble']],
  [/gender|equal|community|society|people|population|social|xã hội|cộng đồng|bình đẳng|conformity|group|minority/, ['face', 'building']],
  [/growing|develop|grow|time|change|thay đổi|phát triển|tuổi thơ/, ['wave', 'leaf']],
  [/memory|brain|trí nhớ|não|skill/, ['bulb', 'face']],
];
const FALLBACK_PAIRS = [['star', 'sun'], ['book', 'leaf'], ['bulb', 'heart'], ['globe', 'chart'], ['bubble', 'star'], ['ball', 'leaf'], ['coin', 'star'], ['cup', 'heart']];

function sceneFor(d) {
  if (SCENE[d.slug]) return SCENE[d.slug];
  // Bỏ tên bộ sách ("Global Success", "SAT Verbal"…) để chữ "success" không khớp với mọi unit.
  const text = `${d.en} ${d.vi} ${d.slug}`.toLowerCase().replace(/global[ -]success[ -]\d+|sat[ -](math|verbal)|vocabulary[ -]for[ -]ielts([ -]advanced)?|destination[ -]b\d/g, ' ');
  for (const [re, pair] of SCENE_RULES) if (re.test(text)) return pair;
  let h = 0;
  for (const ch of d.slug) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return FALLBACK_PAIRS[h % FALLBACK_PAIRS.length];
}

// Global Success: mỗi unit có hình riêng theo đúng tên unit. Màu theo lớp (10, 11, 12) để nhận ra bộ sách.
const GS_PALETTE = { 10: ['#0E7490', '#67E8F9'], 11: ['#4338CA', '#A5B4FC'], 12: ['#047857', '#6EE7B7'], advanced: ['#B45309', '#FCD34D'] };
const GS_SCENE = {
  '10-unit-01': ['heart', 'tree'], '10-unit-02': ['globe', 'leaf'], '10-unit-03': ['note', 'star'], '10-unit-04': ['people', 'heart'],
  '10-unit-05': ['bulb', 'gear'], '10-unit-06': ['scale', 'people'], '10-unit-07': ['flag', 'globe'], '10-unit-08': ['phone', 'book'],
  '10-unit-09': ['shield', 'leaf'], '10-unit-10': ['leaf', 'plane'],
  '11-unit-01': ['heart', 'sun'], '11-unit-02': ['people', 'bubble'], '11-unit-03': ['building', 'car'], '11-unit-04': ['globe', 'flag'],
  '11-unit-05': ['thermo', 'sun'], '11-unit-06': ['building', 'book'], '11-unit-07': ['book', 'bag'], '11-unit-08': ['key', 'star'],
  '11-unit-09': ['people', 'chart'], '11-unit-10': ['tree', 'drop'],
  '12-unit-01': ['star', 'heart'], '12-unit-02': ['globe', 'people'], '12-unit-03': ['leaf', 'drop'], '12-unit-04': ['building', 'car'],
  '12-unit-05': ['briefcase', 'chart'], '12-unit-06': ['robot', 'bulb'], '12-unit-07': ['phone', 'bubble'], '12-unit-08': ['paw', 'leaf'],
  '12-unit-09': ['magnifier', 'star'], '12-unit-10': ['book', 'sun'],
  advanced: ['planet', 'star'],
};

// Nhãn bộ sách ở góc trên trái: tên bộ, lớp và số unit (chữ ASCII để mọi máy đều hiện đúng).
function seriesBadge(grade, unit, c1) {
  const line2 = grade === 'advanced' ? 'ADVANCED' : `GRADE ${grade} · UNIT ${String(unit).padStart(2, '0')}`;
  return `<g filter="url(#soft)"><rect x="56" y="54" width="318" height="82" rx="24" fill="#FFFFFF" opacity=".94"/><rect x="56" y="54" width="10" height="82" rx="5" fill="${c1}"/><text x="90" y="92" font-family="Helvetica, Arial, sans-serif" font-size="23" font-weight="800" letter-spacing="2.4" fill="${INK}">GLOBAL SUCCESS</text><text x="90" y="120" font-family="Helvetica, Arial, sans-serif" font-size="17" font-weight="700" letter-spacing="2" fill="${c1}">${line2}</text></g>`;
}

function defs(c1, c2) {
  return `<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="0.35" y2="1"><stop offset="0" stop-color="${lite(c2, 0.3)}"/><stop offset="0.55" stop-color="${c2}"/><stop offset="1" stop-color="${c1}"/></linearGradient>
  <radialGradient id="glow" cx="0.5" cy="0.36" r="0.6"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.55"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>
  <radialGradient id="halo" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.28"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>
  <radialGradient id="ground" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="${dark(c1, 0.6)}" stop-opacity="0.45"/><stop offset="1" stop-color="${dark(c1, 0.6)}" stop-opacity="0"/></radialGradient>
  <linearGradient id="gA" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${lite(c1, 0.4)}"/><stop offset="0.6" stop-color="${c1}"/><stop offset="1" stop-color="${dark(c1, 0.2)}"/></linearGradient>
  <linearGradient id="gB" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${lite(c2, 0.45)}"/><stop offset="1" stop-color="${c2}"/></linearGradient>
  <radialGradient id="gS" cx="0.34" cy="0.3" r="0.85"><stop offset="0" stop-color="${lite(c1, 0.6)}"/><stop offset="0.55" stop-color="${c1}"/><stop offset="1" stop-color="${dark(c1, 0.32)}"/></radialGradient>
  <radialGradient id="gS2" cx="0.34" cy="0.3" r="0.85"><stop offset="0" stop-color="${lite(c2, 0.6)}"/><stop offset="0.6" stop-color="${c2}"/><stop offset="1" stop-color="${dark(c2, 0.2)}"/></radialGradient>
  <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFDF6"/><stop offset="1" stop-color="#F2E4C8"/></linearGradient>
  <filter id="drop" x="-40%" y="-40%" width="180%" height="190%"><feDropShadow dx="0" dy="18" stdDeviation="16" flood-color="${dark(c1, 0.55)}" flood-opacity="0.38"/></filter>
  <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#000000" flood-opacity="0.18"/></filter>
  <filter id="speck" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" seed="7" stitchTiles="stitch"/><feColorMatrix type="matrix" values="0 0 0 0 0.12  0 0 0 0 0.07  0 0 0 0 0.02  0 0 0 0.9 -0.42"/></filter>
  <clipPath id="front"><rect x="-240" y="0" width="480" height="240"/></clipPath>
</defs>`;
}

function cover(slug, index, pair, opts = {}) {
  const [c1, c2] = opts.palette ?? PALETTES[index % PALETTES.length];
  const f = { A: 'url(#gA)', B: 'url(#gB)', S: 'url(#gS)', S2: 'url(#gS2)', P: 'url(#gP)', W: '#FFFFFF', I: INK, c1, c2 };
  const [main, accent] = pair;
  const seed = (n) => ((n * 9301 + 49297) % 233280) / 233280;
  const stars = Array.from({ length: 26 }, (_, i) => {
    const x = 40 + seed(i + 1) * 1120;
    const y = 30 + seed(i + 17) * 740;
    const r = 1.5 + seed(i + 31) * 3.2;
    return `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${r.toFixed(1)}" fill="#FFFFFF" opacity="${(0.25 + seed(i + 5) * 0.4).toFixed(2)}"/>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="1200" height="800">
${defs(c1, c2)}
<rect width="1200" height="800" fill="url(#bg)"/>
<rect width="1200" height="800" fill="url(#glow)"/>
<circle cx="150" cy="140" r="260" fill="#FFFFFF" opacity="0.07"/>
<circle cx="1110" cy="720" r="300" fill="${dark(c1, 0.4)}" opacity="0.10"/>
${stars}
<circle cx="600" cy="392" r="300" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-dasharray="3 14" stroke-linecap="round" opacity="0.5"/>
<circle cx="600" cy="392" r="330" fill="url(#halo)"/>
<ellipse cx="600" cy="660" rx="300" ry="34" fill="url(#ground)"/>
<g transform="translate(600 392) scale(1.9)" filter="url(#drop)">${M[main](f)}</g>
<g transform="translate(1020 190) scale(0.62)" filter="url(#soft)">${M[accent](f)}</g>
${opts.badge ?? ''}${sparkle(190, 170, 1.1, '#FFFFFF', 0.85)}${sparkle(262, 292, 0.6, '#FFFFFF', 0.6)}${sparkle(980, 560, 0.8, '#FFFFFF', 0.7)}
<rect width="1200" height="800" filter="url(#speck)" opacity="0.16"/>
</svg>
`;
}

const outDir = join(ROOT, 'public/vocab-covers');
mkdirSync(outDir, { recursive: true });
const map = {};
decks.forEach((d, i) => {
  const gs = d.slug.match(/^global-success-(10|11|12)-unit-(\d+)$/);
  if (gs || d.slug === 'global-success-advanced') {
    const grade = gs ? gs[1] : 'advanced';
    const unit = gs ? Number(gs[2]) : 0;
    const key = gs ? `${grade}-unit-${gs[2]}` : 'advanced';
    const pal = GS_PALETTE[grade];
    writeFileSync(join(outDir, `${d.slug}.svg`), cover(d.slug, i, GS_SCENE[key], { palette: pal, badge: seriesBadge(grade, unit, pal[0]) }));
    map[d.slug] = `/vocab-covers/${d.slug}.svg`;
    return;
  }
  const pair = sceneFor(d);
  writeFileSync(join(outDir, `${d.slug}.svg`), cover(d.slug, i, pair));
  map[d.slug] = `/vocab-covers/${d.slug}.svg`;
});

const lines = Object.entries(map).map(([k, v]) => `  '${k}': '${v}',`).join('\n');
writeFileSync(
  join(ROOT, 'src/data/vocab-covers.ts'),
  `/**
 * Ảnh bìa của từng bộ từ vựng, theo id bộ (slug). Chưa có ảnh thì thẻ dùng nền màu theo nguồn.
 * File do scripts/vocab/gen-covers-svg.mjs vẽ bằng code; có thể thay bằng ảnh khác cùng tên.
 */
export const VOCAB_COVERS: Record<string, string> = {
${lines}
};
`,
);
console.log(`ok: ${Object.keys(map).length} bìa`);
