/**
 * Sinh bộ biểu tượng Band 9 (01/10/2026) từ MỘT nguồn SVG — logo người dùng gửi:
 * khối vuông xanh đậm, chữ B kem, ô vàng kim, nét "9" kem.
 *
 *   node scripts/brand/band9-icons.mjs
 *
 * Ghi đè: assets/icon.png, favicon.png, splash-icon.png, android-icon-*.png,
 * assets/brand/logo-mark.svg, logo-lockup.svg, band9-logo-mark.png.
 */
import { writeFileSync } from 'node:fs';
import sharp from 'sharp';

const NAVY = '#0F1D33';
const CREAM = '#F3EDE1';
const GOLD = '#B8955A';

/** Hình chữ (không nền) trong khung 0..100 — dùng chung cho mọi bản. */
const glyph = (fill = CREAM, gold = GOLD) => `
  <rect x="14" y="12" width="19" height="74" fill="${fill}"/>
  <path d="M37 12 H45 A15 16 0 0 1 45 44 H37 Z" fill="${fill}"/>
  <path d="M37 47 H46 A15 19.5 0 0 1 46 86 H37 Z" fill="${fill}"/>
  <rect x="64" y="12" width="25" height="32" fill="${gold}"/>
  <path d="M64 47 H89 V86 H82 A18 18 0 0 1 64 68 Z" fill="${fill}"/>`;

const mark = (rx = 6) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Band 9">
  <rect width="100" height="100" rx="${rx}" fill="${NAVY}"/>${glyph()}
</svg>`;

/** Bản có lề (icon app, splash): khối logo nằm giữa nền kem. */
const padded = (bg, scale) => {
  const off = (100 - 100 * scale) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  ${bg ? `<rect width="100" height="100" fill="${bg}"/>` : ''}
  <g transform="translate(${off} ${off}) scale(${scale})"><rect width="100" height="100" rx="6" fill="${NAVY}"/>${glyph()}</g>
</svg>`;
};

const lockup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 96" width="320" height="96" role="img" aria-label="Band 9">
  <!-- Bộ ghép ngang Band 9: dấu hiệu + chữ (font hệ thống, dễ sửa). -->
  <g transform="translate(8 8) scale(0.8)"><rect width="100" height="100" rx="6" fill="${NAVY}"/>${glyph()}</g>
  <text x="108" y="62" font-family="'Plus Jakarta Sans', 'Segoe UI', Arial, sans-serif" font-size="40" font-weight="800" fill="${NAVY}">Band 9</text>
</svg>`;

const png = (svg, size, file) => sharp(Buffer.from(svg), { density: 1200 }).resize(size, size).png().toFile(file);

writeFileSync('assets/brand/logo-mark.svg', mark());
writeFileSync('assets/brand/logo-lockup.svg', lockup);
await png(mark(), 1254, 'assets/brand/band9-logo-mark.png');
await png(padded('#FBF8F1', 0.78), 1024, 'assets/icon.png');
await png(mark(14), 64, 'assets/favicon.png');
await png(padded(null, 0.62), 1024, 'assets/splash-icon.png');
await png(padded(null, 0.6), 1024, 'assets/android-icon-foreground.png');
await png(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#FBF8F1"/></svg>`, 1024, 'assets/android-icon-background.png');
await png(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><g transform="translate(20 20) scale(0.6)">${glyph('#FFF', '#FFF')}</g></svg>`,
  1024,
  'assets/android-icon-monochrome.png',
);
console.log('Đã sinh bộ biểu tượng Band 9.');
