// Tạo icon pixel từ hình Chiikawa có sẵn trong dự án.
//
// Thu nhỏ bằng lanczos3 rồi làm nét lại để đường viền đậm không bị nhoè, giảm bảng màu
// xuống 24 màu, rồi phóng to nearest-neighbour đúng bội số để mỗi ô pixel sắc nét.
// Lưới càng lớn thì chi tiết (mắt, má, viền) càng rõ; kích thước hiển thị = lưới × scale.
//
// Chạy từ thư mục gốc dự án:  node scripts/pixel/pixelize-chiikawa.mjs

import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const SRC = 'assets/illustrations';
const OUT = 'assets/pixel-chiikawa';

const STICKER = (name) => `${SRC}/cute-home/task-stickers/${name}.png`;
const POSE = (name) => `${SRC}/chiikawa/${name}.png`;

/** `grid` là lưới ô pixel theo chiều lớn nhất; `scale` là số điểm ảnh mỗi ô. */
const SPRITES = [
  // Nhân vật lớn: khung sân khấu, chân trang.
  { name: 'wave', src: POSE('wave'), grid: 96, scale: 2 },
  { name: 'cheer', src: POSE('cheer'), grid: 96, scale: 2 },
  // Ô chọn màn chơi.
  { name: 'vocabulary', src: STICKER('vocabulary'), grid: 72, scale: 2 },
  { name: 'writing', src: STICKER('writing'), grid: 72, scale: 2 },
  { name: 'sat', src: STICKER('sat'), grid: 72, scale: 2 },
  { name: 'listening', src: STICKER('listening'), grid: 72, scale: 2 },
  { name: 'roadmap', src: STICKER('roadmap'), grid: 72, scale: 2 },
  { name: 'reading', src: STICKER('reading'), grid: 72, scale: 2 },
  // Icon nhiệm vụ.
  { name: 'tab-vocab', src: STICKER('vocabulary'), grid: 27, scale: 2 },
  { name: 'tab-plan', src: STICKER('roadmap'), grid: 27, scale: 2 },
  { name: 'tab-read', src: STICKER('reading'), grid: 27, scale: 2 },
  // Icon mục điều hướng bên trái.
  { name: 'nav-home', src: POSE('wave'), grid: 20, scale: 2, crisp: true, colours: 12 },
  { name: 'nav-dashboard', src: POSE('cheer'), grid: 20, scale: 2, crisp: true, colours: 12 },
  { name: 'nav-ielts', src: STICKER('reading'), grid: 20, scale: 2, crisp: true, colours: 12 },
  { name: 'nav-sat', src: STICKER('sat'), grid: 20, scale: 2, crisp: true, colours: 12 },
  { name: 'nav-vocabulary', src: STICKER('vocabulary'), grid: 20, scale: 2, crisp: true, colours: 12 },
  { name: 'nav-quest', src: POSE('peek'), grid: 20, scale: 2, crisp: true, colours: 12 },
  { name: 'nav-profile', src: POSE('sleep'), grid: 20, scale: 2, crisp: true, colours: 12 },
];

await mkdir(OUT, { recursive: true });

for (const sprite of SPRITES) {
  // Cắt viền trong suốt quanh hình để lưới không lãng phí ô.
  const trimmed = await sharp(sprite.src).trim({ threshold: 8 }).png().toBuffer();

  // Thu nhỏ có lọc (giữ được hình dáng), rồi làm nét lại để viền không nhoè.
  // Icon nhỏ (crisp): không làm nét thêm, mà ép alpha về hai mức (có/không) để không còn mép bán trong suốt lem.
  let small = await sharp(trimmed)
    .resize({ width: sprite.grid, height: sprite.grid, fit: 'inside', kernel: 'lanczos3' })
    .sharpen(sprite.crisp ? undefined : { sigma: 1, m1: 1.5, m2: 0 })
    .png()
    .toBuffer();
  if (sprite.crisp) {
    const { data, info } = await sharp(small).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    for (let i = 0; i < data.length; i += 4) data[i + 3] = data[i + 3] >= 128 ? 255 : 0;
    small = await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
  }

  // Giảm bảng màu để có cảm giác pixel art, không rắc nhiễu (dither: 0).
  const quantized = await sharp(small).png({ palette: true, colours: sprite.colours ?? 24, dither: 0 }).toBuffer();

  const { width, height } = await sharp(quantized).metadata();
  const out = path.join(OUT, `${sprite.name}.png`);
  await sharp(quantized)
    .resize({ width: width * sprite.scale, height: height * sprite.scale, kernel: 'nearest' })
    .png()
    .toFile(out);

  console.log(`${sprite.name}: ${width}x${height} ô -> ${width * sprite.scale}x${height * sprite.scale}px`);
}
