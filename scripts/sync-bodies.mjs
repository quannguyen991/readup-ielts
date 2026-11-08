// Chép toàn văn bài đọc (src/data/seed/bodies/chunk-*.json) sang public/data/bodies/
// để trình duyệt tải lười từng chunk thay vì nhét 13 MB vào bundle JS chung.
// Chạy trước `expo export`: node scripts/sync-bodies.mjs
// Thư mục đích nằm trong .gitignore — nguồn thật vẫn là src/data/seed/bodies.
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'src', 'data', 'seed', 'bodies');
const dest = join(root, 'public', 'data', 'bodies');

if (!existsSync(src)) {
  console.error(`Không thấy ${src}`);
  process.exit(1);
}

rmSync(dest, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });

let count = 0;
for (const name of readdirSync(src)) {
  if (!/^chunk-\d+\.json$/.test(name)) continue;
  copyFileSync(join(src, name), join(dest, name));
  count++;
}
console.log(`Đã chép ${count} chunk bài đọc vào public/data/bodies`);
