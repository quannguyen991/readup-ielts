/**
 * SỔ SPRITE: gom mọi hình vẽ bằng mã thành một bảng `id → SpriteDef`.
 * Atlas (`components/travel/engine/Atlas.ts`) tô màu theo bảng màu thành phố.
 * `fac:<loại>:<BIỂN>` là mặt tiền sinh theo kích thước ô (không nằm trong bảng).
 */
import { Paint } from './paint';
import { CREATURES } from './creatures';
import { DAY_NIGHT_SPRITES, LANDMARKS } from './landmarks';
import { PERSON_SPRITES } from './people';
import { PROPS, type SpriteDef } from './props';
import { FACADE_KINDS, type FacadeKind } from './facades';

export type { SpriteDef } from './props';
export { DAY_NIGHT_SPRITES } from './landmarks';
export { personFrame, DIRS, OUTFITS, NPC_STYLES, type Dir } from './people';
export { tileGrid, foamGrid, TILE_VARIANTS, type TileKind } from './tiles';
export { buildFacade, FACADE_KINDS, FACADE_VARIANTS, type FacadeKind } from './facades';

const one = (p: Paint): SpriteDef => ({ w: p.w, h: p.h, frames: [p.toRows()] });

function arrow(): Paint {
  const p = new Paint(10, 10);
  p.rect(3, 0, 4, 5, 'u').rect(3, 0, 1, 5, 'e').rect(0, 4, 10, 1, 'u');
  for (let i = 0; i < 5; i++) p.hline(i, 4 + i, 10 - i * 2, 'u');
  p.px(4, 8, 'U').px(5, 8, 'U');
  p.outline();
  return p;
}

function lock(): Paint {
  const p = new Paint(12, 14);
  p.frame(3, 1, 6, 6, 'B').rect(2, 6, 8, 7, 'u').hline(2, 6, 8, 'e').hline(2, 12, 8, 'U').rect(5, 8, 2, 3, 'o');
  p.outline();
  return p;
}

function coin(frame: number): Paint {
  const p = new Paint(9, 9);
  const w = [3, 4, 2, 4][frame % 4]!;
  p.ellipse(4, 4, w, 4, 'u').ellipse(4, 4, Math.max(0, w - 1), 3, 'e');
  if (w > 2) p.px(4, 4, 'U');
  p.outline();
  return p;
}

function sparkle(frame: number): Paint {
  const p = new Paint(9, 9);
  const r = [1, 2, 3, 2][frame % 4]!;
  p.px(4, 4, 'w').hline(4 - r, 4, r * 2 + 1, frame % 2 ? 'e' : 'w').vline(4, 4 - r, r * 2 + 1, frame % 2 ? 'w' : 'e');
  return p;
}

function exclaim(): Paint {
  const p = new Paint(9, 14);
  p.ellipse(4, 5, 4, 5, 'w').px(4, 11, 'w').px(3, 11, 'w').px(3, 10, 'w');
  p.rect(4, 2, 1, 4, 'P').px(4, 7, 'P');
  p.outline();
  return p;
}

const UI: Record<string, () => SpriteDef> = {
  ui_arrow: () => one(arrow()),
  ui_lock: () => one(lock()),
  ui_coin: () => ({ w: 9, h: 9, frames: [0, 1, 2, 3].map((f) => coin(f).toRows()) }),
  ui_sparkle: () => ({ w: 9, h: 9, frames: [0, 1, 2, 3].map((f) => sparkle(f).toRows()) }),
  ui_talk: () => one(exclaim()),
};

export const SPRITE_FACTORIES: Record<string, () => SpriteDef> = { ...PROPS, ...CREATURES, ...LANDMARKS, ...PERSON_SPRITES, ...UI };

const cache = new Map<string, SpriteDef>();
export function getSpriteDef(id: string): SpriteDef | undefined {
  let d = cache.get(id);
  if (!d) {
    const f = SPRITE_FACTORIES[id];
    if (!f) return undefined;
    d = f();
    cache.set(id, d);
  }
  return d;
}

/** Tách `fac:cafe:CAFE` → { kind, text }; không hợp lệ → null. */
export function parseFacadeId(id: string): { kind: FacadeKind; text: string } | null {
  if (!id.startsWith('fac:')) return null;
  const [, kind, ...rest] = id.split(':');
  if (!kind || !(FACADE_KINDS as string[]).includes(kind)) return null;
  return { kind: kind as FacadeKind, text: rest.join(':') };
}

export function hasSprite(id: string): boolean {
  return id in SPRITE_FACTORIES || parseFacadeId(id) !== null;
}

export const SPRITE_IDS = Object.keys(SPRITE_FACTORIES);
export const isDayNight = (id: string) => DAY_NIGHT_SPRITES.has(id);
