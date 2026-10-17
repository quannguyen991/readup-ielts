/** Xuất ảnh tổng quan thế giới (địa hình + cây/đèn/ghế vẽ mã) để kiểm tra mối nối bằng mắt. */
import { writeFileSync } from 'node:fs';
import { masterBlueprint } from '../../src/world/master-blueprint';
import { World } from '../../src/world/raster';
import { renderWorld } from '../../src/world/chunks';
import { makePainter } from '../../src/world/tileart';
import { decorSprite } from '../../src/world/sprites';

const w = new World(masterBlueprint);
const painter = makePainter(masterBlueprint.palette, masterBlueprint.seed);
const img = renderWorld(w, painter);
// ghi đè vật thể trang trí (cây/đèn/ghế/đài) bằng sprite mã
for (const o of w.objects) {
  if (o.kind === 'building') continue;
  const sp = decorSprite(o.kind, o.variant);
  if (!sp) continue;
  const x0 = Math.round(o.px - sp.w / 2), y0 = Math.round(o.py - sp.h);
  for (let j = 0; j < sp.h; j++) for (let i = 0; i < sp.w; i++) {
    const a = sp.data[(j * sp.w + i) * 4 + 3]!;
    if (!a) continue;
    const X = x0 + i, Y = y0 + j;
    if (X < 0 || Y < 0 || X >= img.w || Y >= img.h) continue;
    const o2 = (Y * img.w + X) * 4;
    for (let k = 0; k < 3; k++) img.data[o2 + k] = sp.data[(j * sp.w + i) * 4 + k]!;
  }
}
// header PPM -> PNG qua python
const ppm = Buffer.alloc(img.w * img.h * 3);
for (let i = 0; i < img.w * img.h; i++) { ppm[i * 3] = img.data[i * 4]!; ppm[i * 3 + 1] = img.data[i * 4 + 1]!; ppm[i * 3 + 2] = img.data[i * 4 + 2]!; }
writeFileSync('scripts/world/_overview.ppm', Buffer.concat([Buffer.from(`P6\n${img.w} ${img.h}\n255\n`), ppm]));
console.log('wrote', img.w, img.h);
