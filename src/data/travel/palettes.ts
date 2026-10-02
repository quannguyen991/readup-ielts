/**
 * BẢNG MÀU TỪNG THÀNH PHỐ của "Du ngoạn Band 9" — đúng 32 vai màu mỗi bảng
 * (kế hoạch §7.1: ≤ 32 màu). Hình vẽ (`sprites/`) chỉ ghi VAI MÀU bằng một ký tự,
 * nên một khuôn đổi màu theo thành phố mà không phải vẽ lại.
 *
 * Nền chung là Band 9: kem, navy làm nét viền, vàng kim làm điểm nhấn; mỗi
 * thành phố thêm một màu đặc trưng (đỏ London, xanh lơ Paris, ngọc Singapore,
 * cam gạch Rome, nâu-đỏ gạch Amsterdam, vàng son Hà Nội).
 *
 * Vai màu:
 *   o viền navy   k bóng sâu    w trắng     W kem
 *   g cỏ sáng     G cỏ vừa      h tán lá tối l lá sáng   L lá vừa
 *   s đường sáng  S đường vừa   t đường tối
 *   b đá sáng     B đá vừa      n đá tối
 *   a nước sáng   A nước vừa    d nước sâu
 *   r mái sáng    R mái tối     y tường sáng Y tường tối
 *   p màu nhấn    P nhấn tối    u vàng  U vàng tối  e vàng nhạt
 *   c da          C da tối      x gỗ    X gỗ tối    z kính
 */
export const ROLE_CHARS = 'okwWgGhlLsStbBnaAdrRyYpPuUecCxXz'.split('');

export type Palette = Record<string, string>;

export type Ambient = { dawn: string; day: string; dusk: string; night: string };

export type CityPalette = { colors: Palette; ambient: Ambient };

const BASE: Palette = {
  o: '#1c2438',
  k: '#0f1d33',
  w: '#fbf7ee',
  W: '#efe6d2',
  g: '#a7c46e',
  G: '#8fb25f',
  h: '#3f7440',
  l: '#6faa52',
  L: '#4d8a45',
  s: '#ecd9ab',
  S: '#d8c08c',
  t: '#b99f6e',
  b: '#d2cfc6',
  B: '#aeb0ae',
  n: '#7f8590',
  a: '#7fc8d8',
  A: '#4fa6c4',
  d: '#2f7aa3',
  r: '#d9694a',
  R: '#a8472f',
  y: '#f2e4c6',
  Y: '#d9c39a',
  p: '#3d7fb5',
  P: '#265785',
  u: '#d4a94f',
  U: '#a8843f',
  e: '#f0d68e',
  c: '#f1c9a0',
  C: '#c99573',
  x: '#b07a46',
  X: '#7a4c2b',
  z: '#bfe6f0',
};

const AMB: Ambient = { dawn: '#f2c9b0', day: '#ffffff', dusk: '#f0a77c', night: '#34457a' };

const mk = (over: Palette, ambient: Partial<Ambient> = {}): CityPalette => ({
  colors: { ...BASE, ...over },
  ambient: { ...AMB, ...ambient },
});

export const PALETTES: Record<string, CityPalette> = {
  // Hà Nội / Nội Bài: sảnh sân bay ấm, vàng son và đỏ cờ.
  hanoi: mk(
    { p: '#cf4a3a', P: '#8f2a22', r: '#d98a52', R: '#a4522f', y: '#f3dc9a', Y: '#d9bc78', b: '#e0d8c4', B: '#bdb49c', n: '#857f78', z: '#cfe9ee' },
    { dusk: '#f2a070', night: '#3a3f78' },
  ),
  // Singapore: cỏ rậm, ngọc lam, trắng; nắng gắt, mưa chiều.
  singapore: mk(
    {
      g: '#92d06c', G: '#6dbb55', h: '#1e6b46', l: '#4fb85b', L: '#2f9b55',
      s: '#efe0b8', S: '#dcc593', t: '#b6a074',
      p: '#14a398', P: '#0d6b69', r: '#e0674f', R: '#a8432e', y: '#f7f2e6', Y: '#d8d0b8',
      a: '#7ed6dc', A: '#44b4cf', d: '#217fa8',
    },
    { dusk: '#f08a6a', night: '#2d3f78' },
  ),
  // London: gạch đỏ, đá xám, nước sông xám xanh; trời hay nhiều mây.
  london: mk(
    {
      g: '#8fb06b', G: '#789c5c', l: '#5f9650', L: '#47794a', h: '#335f3d',
      s: '#d6cbb0', S: '#bdb293', t: '#9a9078',
      b: '#c6c8c8', B: '#9fa5ab', n: '#6c737f',
      a: '#9ab9c8', A: '#6c8ea0', d: '#3d7ea6',
      r: '#8b5a4a', R: '#5e3a34', y: '#cf8f6d', Y: '#a96547',
      p: '#c8322f', P: '#8a1f26',
    },
    { dawn: '#d7c3bc', day: '#eef0f4', dusk: '#d69a86', night: '#2a3566' },
  ),
  // Paris: đá vôi kem, mái kẽm xanh xám, nhấn xanh lơ.
  paris: mk(
    {
      g: '#9bbf74', G: '#82a962',
      s: '#e8d9b8', S: '#d1bf98', t: '#aa9972',
      p: '#5b8fc9', P: '#3a5f9a', r: '#7d93ad', R: '#566b87', y: '#f3e8d2', Y: '#d7c6a2',
      a: '#86c3d8', A: '#5a9bc2', d: '#3a6e9c',
    },
    { dusk: '#ee9c86', night: '#2f3a78' },
  ),
  // Amsterdam: gạch nâu-đỏ, kênh xanh rêu, nhấn cam.
  amsterdam: mk(
    {
      g: '#9ec26a', G: '#85ab58',
      s: '#e2cfa8', S: '#c9b186', t: '#a6906a',
      p: '#e0802a', P: '#a85516', r: '#6e7d8c', R: '#4b5866', y: '#c46f50', Y: '#9a4a35',
      a: '#7fb8b5', A: '#559a9c', d: '#38737c',
    },
    { dusk: '#f09a70', night: '#313f6e' },
  ),
  // Rome: travertin, ngói cam, ô liu.
  rome: mk(
    {
      g: '#a8b862', G: '#8fa24f', l: '#7a9a4a', L: '#5d8040', h: '#43602f',
      s: '#ecd9a8', S: '#d6bd86', t: '#b09a68',
      b: '#e6d9bb', B: '#c9b78d', n: '#8f805f',
      r: '#d4693f', R: '#a8482a', y: '#eac27a', Y: '#cc9a56',
      p: '#c9602f', P: '#8d3d1b', a: '#82c0cc', A: '#559fb8', d: '#336f93',
    },
    { day: '#fff6e0', dusk: '#f2905a', night: '#363c72' },
  ),
  // TP. Hồ Chí Minh: nắng gắt, xanh cây, đỏ cờ, ngói cam.
  hochiminh: mk(
    {
      g: '#9ccf66', G: '#78b94f', h: '#2a7041', l: '#56b556', L: '#36994f',
      s: '#eedcae', S: '#d9c28a', t: '#b49c6c',
      p: '#d8342c', P: '#9a2220', r: '#d8683c', R: '#a4442a', y: '#f5e3b0', Y: '#dcc085',
      a: '#80cfd6', A: '#4aa9c6', d: '#2a7aa3',
    },
    { day: '#fff8e4', dusk: '#f08a60', night: '#323c78' },
  ),
  // Đà Nẵng: biển xanh ngọc, cát trắng, cầu Rồng vàng.
  danang: mk(
    {
      g: '#8fcf6e', G: '#6db857', h: '#245f4a', l: '#4ab05f', L: '#2f9658',
      s: '#f2e6c0', S: '#e0cc98', t: '#b8a478',
      p: '#1fa6c8', P: '#12708f', r: '#e6a23a', R: '#b3742a', y: '#f8f1dc', Y: '#e0d2a8',
      a: '#7fe0e0', A: '#3fb8d2', d: '#1f84b0', u: '#e8b83c', U: '#b88a2a',
    },
    { dusk: '#f09a70', night: '#2c4278' },
  ),
};

export function getPalette(id: string): CityPalette {
  return PALETTES[id] ?? PALETTES.hanoi!;
}

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
