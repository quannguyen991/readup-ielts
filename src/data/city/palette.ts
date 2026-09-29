/**
 * Bảng màu của Thành Phố Tri Thức — phong cách isometric cartoon: màu sạch,
 * ấm, khối rõ. Mọi bộ sinh công trình và vật phẩm lấy màu ở đây; model tải về
 * cũng được đổi sang các màu này để cùng một thế giới (xem `process.mjs` và
 * `decor-toon.ts`).
 *
 * Kính KHÔNG dùng phản chiếu như ảnh chụp: tông xanh lam / ngọc / tím nhạt
 * phẳng, để cao ốc đứng cạnh nhà gỗ mái đỏ không lạc quẻ.
 */
export const PALETTE = {
  terrain: {
    grass: ['#8DC35B', '#86BD55', '#93C962', '#7FB54F'],
    grassDark: '#6FA444',
    meadow: '#A6D26E',
    sand: '#EED9A4',
    sandWet: '#DCC58E',
    dirt: '#C8A06A',
    soil: '#9B6B43',
    soilDark: '#7A5233',
    rock: '#A7A29A',
    rockDark: '#8A857D',
    cliff: '#B08A5E',
    cliffDark: '#94714A',
    snow: '#F4F6F8',
    waterDeep: '#3F9FD8',
    waterShallow: '#6CCBE3',
    waterFoam: '#DDF4FA',
    locked: '#6B7280',
  },
  foliage: {
    leaf: ['#5DAA45', '#6BB352', '#4E9F3D', '#7AB648'],
    pine: ['#3F8F4A', '#4A9A52', '#357F40'],
    palm: ['#62B04A', '#56A342'],
    trunk: '#8B5E3C',
    bush: '#5A9E3E',
    flower: ['#F472B6', '#FACC15', '#F87171', '#A78BFA', '#FFFFFF', '#FB923C'],
  },
  wood: { light: '#D9A86C', mid: '#B9844D', dark: '#8A5A33', plank: '#C9955C', trim: '#F3E3C3' },
  brick: { red: '#C0583A', warm: '#CF6B45', dark: '#9C4430', mortar: '#E8D8C4' },
  stone: { light: '#D8D2C4', mid: '#BDB5A5', dark: '#9C9384', paving: '#E2DACB' },
  wall: ['#F6EAD7', '#F2DCC3', '#DCE8EE', '#E3EFD9', '#F4E1E6', '#EFE6CF'],
  roof: { red: '#D4553D', terracotta: '#C8653E', blue: '#4F79B7', teal: '#3C9C97', green: '#5E9E4E', brown: '#8A5A3B', slate: '#5B6474' },
  glass: { blue: '#8EC5EA', teal: '#7FD1CB', lilac: '#B7B2E8', deep: '#5E9CCB', night: '#4B6F99' },
  steel: { warm: '#9C958C', grey: '#8D949C', navy: '#35506E', light: '#C9CDD2', dark: '#4A5360' },
  concrete: { light: '#E4E1DA', mid: '#CFCAC0', dark: '#A9A398' },
  accent: { sign: '#2F5D8C', signText: '#FFF6E0', awning: ['#E0533D', '#3E7CC4', '#3AA65D', '#F2A33A'], flag: '#E0533D', gold: '#F2B33D' },
  construction: {
    stake: '#E0B04C',
    rope: '#F4EBD0',
    blueprint: '#3E7CC4',
    scaffold: '#E0A33A',
    scaffoldPole: '#B9B2A6',
    rebar: '#8A6E5A',
    concrete: '#C9C4BA',
    formwork: '#C18A4E',
    tarp: '#3E7CC4',
    toolbox: '#D9443A',
    sign: '#F2C53D',
  },
  worker: { vest: '#F08A24', shirt: '#3E6FB0', pants: '#39414D', skin: ['#F2C9A0', '#DDA87D', '#B97E56'], hat: '#F7C531' },
  crane: { mast: '#F2B33D', jib: '#F2B33D', weight: '#6B7280', cable: '#374151', hook: '#374151', cab: '#E0533D' },
} as const;

/** Màu ngẫu nhiên có kiểm soát trong một nhóm. */
export function pick<T>(list: readonly T[], r: () => number): T {
  return list[Math.floor(r() * list.length) % list.length]!;
}
