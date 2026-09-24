/**
 * SPRITE PIXEL 16×16 của game khi học — tự vẽ từng ô, không mượn ảnh của ai.
 *
 * Mỗi sprite là 16 dòng chữ; mỗi chữ là một ô màu theo bảng dưới (`.` là trong
 * suốt). Quái chỉ dùng m/d/l cho thân nên một khuôn tô được nhiều màu.
 */

export type SpriteName = 'hero' | 'slime' | 'bug' | 'ghost' | 'golem' | 'bat' | 'mimic' | 'dragon' | 'owl' | 'fox' | 'cat';

export const SPRITES: Record<SpriteName, string[]> = {
  hero: [
    '................',
    '....oooooooo..w.',
    '...ohhhhhhhho.w.',
    '...ohhhhhhhho.w.',
    '...ohhsssssso.w.',
    '...ohsspsspso.w.',
    '...ohssssssso.w.',
    '....osssssso..w.',
    '..cooaaaaaoo.gwg',
    '.ccoaaaaaaaaoss.',
    '.ccoaAaaaaAaoo..',
    '.ccollllllllo...',
    '..coaaaaaaaao...',
    '...oaaaooaaao...',
    '...obbbo.obbbo..',
    '...ooooo.ooooo..',
  ],
  slime: [
    '................',
    '................',
    '................',
    '................',
    '......oooo......',
    '....oolllmoo....',
    '...olllmmmmmo...',
    '..olmmmmmmmmmo..',
    '..olmeemmmeemo..',
    '.olmmepmmmepmmo.',
    '.ommmmmmmmmmmmo.',
    '.ommmmdoodmmmmo.',
    '.odmmmmmmmmmmdo.',
    '..oddmmmmmmddo..',
    '...oooooooooo...',
    '................',
  ],
  bug: [
    '................',
    '...o........o...',
    '....o......o....',
    '.....oooooo.....',
    '....oddddddo....',
    '....odeddedo....',
    '..o.oddddddo.o..',
    '...oommmdmmmoo..',
    '..o.olmmdmmmo.o.',
    '...olmmmdmmmmo..',
    '..o.olmmdmmmo.o.',
    '...ommmmdmmmmo..',
    '....ommmdmmmo...',
    '.....oooooo.....',
    '................',
    '................',
  ],
  ghost: [
    '................',
    '.....oooooo.....',
    '....ollllllo....',
    '...olllmmmmmo...',
    '..ollmmmmmmmmo..',
    '..olmeemmeemmo..',
    '..olmpemmpemmo..',
    '..ommmmmmmmmmo..',
    '..ommmmoommmmo..',
    '..ommmmoommmmo..',
    '..ommmmmmmmmmo..',
    '..odmmmmmmmmdo..',
    '..oddmmmmmmddo..',
    '..odmodmmodmdo..',
    '..oo.oo..oo.oo..',
    '................',
  ],
  golem: [
    '................',
    '....oooooooo....',
    '...ollllllllo...',
    '...olkkmmkklo...',
    '...ommmmmmmmo...',
    '...odmooooodo...',
    '.oooooooooooooo.',
    'olllmmmmmmmmlllo',
    'olmmmottttommmlo',
    'odmmmmmmmmmmmmdo',
    'odmmmottttommmdo',
    'oddmmmmmmmmmmddo',
    '.oooommmmmmoooo.',
    '...odmmo.odmmo..',
    '...oddo..oddo...',
    '...oooo..oooo...',
  ],
  bat: [
    '................',
    '................',
    '......o..o......',
    'oo...ommmmo...oo',
    'odo.ommmmmmo.odo',
    'oddomeemmeemoddo',
    'oddmmpemmpemmddo',
    'odmmmmmmmmmmmmdo',
    'odmmmmtmmtmmmmdo',
    'odmmmmmmmmmmmmdo',
    'od.odmmmmmmdo.do',
    'o...odmmmmdo...o',
    '......oddo......',
    '.......oo.......',
    '................',
    '................',
  ],
  mimic: [
    '................',
    '................',
    '...oooooooooo...',
    '..ollllllllllo..',
    '.olmmmmyymmmmlo.',
    '.odddddyydddddo.',
    '.oeeoddddddoeeo.',
    '.opeottttttoepo.',
    '.o.rrrrrrrrrr.o.',
    '.otttttttttttto.',
    '.olmmmmmmmmmmlo.',
    '.ommmmmmmmmmmmo.',
    '.odmmmmyymmmmdo.',
    '.oddddddddddddo.',
    '..oooooooooooo..',
    '................',
  ],
  dragon: [
    '................',
    '...y........y...',
    '...yo......oy...',
    '....oooooooo....',
    'o..ommmmmmmmo..o',
    'oo.omyymmyymo.oo',
    'odoommmmmmmmoodo',
    'oddommtmmtmmoddo',
    'odddommmmmmodddo',
    '.odooommmmooodo.',
    '..o.ommllmmo.o..',
    '....ommllmmo....',
    '....ommllmmo....',
    '....odmmmmdo....',
    '....oo.oo.oo....',
    '................',
  ],
  owl: [
    '................',
    '...oo......oo...',
    '...omo....omo...',
    '...ommoooommo...',
    '..ommmmmmmmmmo..',
    '..oeeemmmmeeeo..',
    '..oepemmmmepeo..',
    '..oeeemyymeeeo..',
    '..ommmmyymmmmo..',
    '..omllllllllmo..',
    '..omlmllllmlmo..',
    '..omllllllllmo..',
    '..odmllllllmdo..',
    '...oddmmmmddo...',
    '....oyyooyyo....',
    '................',
  ],
  fox: [
    '................',
    '..oo........oo..',
    '..odo......odo..',
    '..oddo....oddo..',
    '..ommmoooommmo..',
    '.ommmmmmmmmmmmo.',
    '.ommeemmmmeemmo.',
    '.ommepmmmmepmmo.',
    '.ommmmmmmmmmmmo.',
    '.otttmmmmmmttto.',
    '..otttttttttto..',
    '...ottpptttto...',
    '....otttttto....',
    '.....oooooo.....',
    '................',
    '................',
  ],
  cat: [
    '................',
    '.oo..........oo.',
    '.olo........olo.',
    '.omlo......olmo.',
    '.ommmoooooommmo.',
    '.ommmmmmmmmmmmo.',
    '.ommeemmmmeemmo.',
    '.omepemmmmepemo.',
    '.ommeemmmmeemmo.',
    'ommmmmmrrmmmmmmo',
    'ommmmmmoommmmmmo',
    '.ommmmmmmmmmmmo.',
    '..ommmmmmmmmmo..',
    '...oooooooooo...',
    '................',
    '................',
  ],
};

/** Màu cố định (viền, mắt, răng…) và màu riêng của nhân vật. */
const FIXED: Record<string, string> = {
  o: '#1B1330',
  e: '#FFFFFF',
  p: '#1B1330',
  t: '#FFF7ED',
  r: '#E11D48',
  y: '#FACC15',
  k: '#22D3EE',
  h: '#5B3A1E',
  s: '#F5C6A0',
  a: '#2563EB',
  A: '#1E3A8A',
  c: '#DC2626',
  w: '#E2E8F0',
  g: '#FACC15',
  b: '#3F2A1A',
  l: '#78350F',
};

function mixHex(a: string, b: string, t: number): string {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `#${pa.map((v, i) => Math.round(v + (pb[i]! - v) * t).toString(16).padStart(2, '0')).join('')}`;
}

export type SkinId = 'knight' | 'ninja' | 'mage' | 'samurai' | 'astronaut' | 'gold';

/**
 * Skin nhân vật = đổi màu từng phần của cùng một hình (tóc/mũ, áo, áo choàng,
 * kiếm, chuôi, giày, thắt lưng). Mua bằng sao ở trang Đổi sao.
 */
export const HERO_SKINS: Record<SkinId, { name: string; colors: Partial<Record<string, string>> }> = {
  knight: { name: 'Hiệp sĩ xanh', colors: {} },
  ninja: { name: 'Ninja bóng đêm', colors: { h: '#111827', a: '#1F2937', A: '#111827', c: '#DC2626', w: '#CBD5E1', g: '#9CA3AF', b: '#111827', l: '#DC2626' } },
  mage: { name: 'Pháp sư tím', colors: { h: '#E5E7EB', a: '#7C3AED', A: '#4C1D95', c: '#FACC15', w: '#F0ABFC', g: '#FDE68A', b: '#4C1D95', l: '#FACC15' } },
  samurai: { name: 'Samurai đỏ', colors: { h: '#0F172A', a: '#B91C1C', A: '#7F1D1D', c: '#0F172A', w: '#F1F5F9', g: '#F59E0B', b: '#1F2937', l: '#F59E0B' } },
  astronaut: { name: 'Phi hành gia', colors: { h: '#E2E8F0', a: '#F8FAFC', A: '#CBD5E1', c: '#38BDF8', w: '#67E8F9', g: '#0EA5E9', b: '#94A3B8', l: '#0EA5E9' } },
  gold: { name: 'Hiệp sĩ vàng', colors: { h: '#FDE68A', a: '#EAB308', A: '#A16207', c: '#7C3AED', w: '#FEF9C3', g: '#F59E0B', b: '#713F12', l: '#92400E' } },
};

/** Bảng màu của một sprite: quái lấy `main` cho thân, tối/sáng suy từ đó; nhân vật lấy màu theo `skin`. */
export function paletteFor(name: SpriteName, main?: string, skin?: SkinId): Record<string, string> {
  if (name === 'hero') return skin && skin !== 'knight' ? { ...FIXED, ...(HERO_SKINS[skin].colors as Record<string, string>) } : FIXED;
  if (!main) return FIXED;
  return { ...FIXED, m: main, d: mixHex(main, '#000000', 0.35), l: mixHex(main, '#FFFFFF', 0.45) };
}

export type Run = { x: number; y: number; w: number; fill: string };

/** Gộp các ô cùng màu nằm liền nhau trên một dòng thành một hình chữ nhật — ít nút SVG hơn. */
export function spriteRuns(rows: string[], palette: Record<string, string>): Run[] {
  const runs: Run[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x]!;
      let end = x + 1;
      while (end < row.length && row[end] === ch) end += 1;
      const fill = palette[ch];
      if (ch !== '.' && fill) runs.push({ x, y, w: end - x, fill });
      x = end;
    }
  });
  return runs;
}

/** Quái nào mặc sprite nào (id theo `ENEMIES` trong services/game/rules). */
export const ENEMY_SPRITE: Record<string, SpriteName> = {
  'typo-bug': 'bug',
  'comma-slime': 'slime',
  'tense-ghost': 'ghost',
  'math-golem': 'golem',
  'idiom-bat': 'bat',
  'false-friend': 'mimic',
  'blank-dragon': 'dragon',
};
