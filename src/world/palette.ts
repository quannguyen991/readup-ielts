export type RGB = readonly [number, number, number];
export type Palette = {
  grass: RGB[]; park: RGB[]; sand: RGB[]; plaza: RGB[]; plazaJoint: RGB;
  asphalt: RGB[]; brick: RGB[]; mortar: RGB; sidewalk: RGB[]; sidewalkJoint: RGB;
  path: RGB[]; wood: RGB[]; woodDark: RGB; lot: RGB[]; lotJoint: RGB;
  water: RGB[]; waterHi: RGB; waterShallow: RGB; waterShadow: RGB;
  stone: RGB[]; stoneDark: RGB; stoneCap: RGB; mud: RGB[]; reed: RGB;
  edge: RGB; kerb: RGB; flowers: RGB[];
  laneYellow: RGB; laneWhite: RGB; zebra: RGB;
};

const base: Omit<Palette, 'water' | 'waterHi' | 'waterShallow' | 'waterShadow' | 'grass' | 'park' | 'brick' | 'mud'> = {
  sand: [[222, 200, 150], [210, 188, 138], [232, 214, 168]],
  plaza: [[188, 168, 153], [176, 156, 142], [200, 180, 164]], plazaJoint: [148, 130, 118],
  asphalt: [[88, 88, 100], [80, 80, 92], [98, 98, 110]],
  mortar: [150, 84, 66],
  sidewalk: [[198, 178, 162], [186, 166, 152], [208, 190, 174]], sidewalkJoint: [160, 140, 128],
  path: [[198, 166, 114], [184, 152, 102], [210, 180, 130]],
  wood: [[152, 102, 62], [132, 86, 52], [170, 118, 74]], woodDark: [86, 54, 34],
  lot: [[178, 166, 162], [168, 156, 152], [186, 174, 168]], lotJoint: [150, 138, 134],
  stone: [[170, 162, 150], [150, 142, 132], [190, 182, 168]], stoneDark: [96, 88, 82], stoneCap: [214, 206, 190],
  reed: [70, 110, 40],
  edge: [112, 92, 78], kerb: [226, 214, 196], flowers: [[236, 120, 150], [250, 240, 230], [244, 210, 80], [160, 130, 230]],
  laneYellow: [236, 196, 60], laneWhite: [236, 236, 228], zebra: [240, 238, 230],
};

export const PALETTES: Record<'hanoi' | 'saigon', Palette> = {
  hanoi: {
    ...base,
    grass: [[68, 132, 40], [90, 154, 44], [58, 116, 34], [112, 170, 50]],
    park: [[104, 166, 48], [86, 148, 42], [122, 180, 58]],
    brick: [[200, 120, 92], [186, 106, 82], [212, 136, 106]],
    mud: [[74, 96, 48], [88, 110, 56]],
    water: [[14, 128, 116], [10, 112, 104], [22, 146, 130]], waterHi: [132, 214, 196], waterShallow: [44, 168, 150], waterShadow: [6, 84, 80],
  },
  saigon: {
    ...base,
    grass: [[104, 140, 44], [118, 152, 46], [92, 126, 40], [134, 160, 56]],
    park: [[120, 160, 56], [106, 144, 48], [138, 172, 68]],
    brick: [[206, 140, 118], [192, 126, 106], [218, 156, 130]],
    mud: [[78, 84, 44], [90, 96, 52]],
    water: [[24, 112, 126], [18, 96, 112], [38, 132, 142]], waterHi: [126, 204, 196], waterShallow: [56, 158, 164], waterShadow: [10, 70, 82],
  },
};
