import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { decorSprite } from '../../src/world/sprites';
import { makePainter } from '../../src/world/tileart';
import { masterBlueprint } from '../../src/world/master-blueprint';
import { World } from '../../src/world/raster';
import { renderWorld } from '../../src/world/chunks';
import { TILE } from '../../src/world/constants';

async function main() {
  const root = process.cwd();
  const world = new World(masterBlueprint);
  const rendered = renderWorld(world, makePainter(masterBlueprint.palette, masterBlueprint.seed), 0);
  const raw = Buffer.from(rendered.data);
  const terrainDir = join(root, 'public', 'travel', 'terrain');
  const propsDir = join(root, 'public', 'travel', 'sprites', 'hanoi-world-props');
  mkdirSync(terrainDir, { recursive: true });
  mkdirSync(propsDir, { recursive: true });

  const small = join(terrainDir, 'hanoiband9.small.png');
  const full = join(terrainDir, 'hanoiband9.png');
  await sharp(raw, { raw: { width: rendered.w, height: rendered.h, channels: 4 } }).png().toFile(small);
  await sharp(raw, { raw: { width: rendered.w, height: rendered.h, channels: 4 } })
    .resize(rendered.w * 4, rendered.h * 4, { kernel: 'nearest' })
    .png()
    .toFile(full);

  const usedProps = new Set(world.objects.filter((item) => item.kind !== 'building').map((item) => `${item.kind}-${item.variant}`));
  for (const prop of usedProps) {
    const splitAt = prop.lastIndexOf('-');
    const kind = prop.slice(0, splitAt);
    const variant = Number(prop.slice(splitAt + 1));
    const sprite = decorSprite(kind, variant);
    if (!sprite) throw new Error(`Cannot export ${prop}`);
    await sharp(Buffer.from(sprite.data), { raw: { width: sprite.w, height: sprite.h, channels: 4 } })
      .png()
      .toFile(join(propsDir, `${prop}.png`));
  }

  console.log(`Live Hanoi ground: ${small} (${rendered.w}×${rendered.h}, ${TILE}px per tile)`);
  console.log(`High-resolution source: ${full}`);
  console.log(`Scene prop sprites exported: ${usedProps.size}`);
}

void main();

