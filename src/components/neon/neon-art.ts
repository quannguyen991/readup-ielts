import type { ImageSourcePropType } from 'react-native';

/**
 * Chữ và họa tiết pixel 3D phát sáng, do ChatGPT vẽ theo ảnh mẫu "Portfolio" rồi tách nền đen thành nền trong suốt
 * bằng `scripts/art/neon_key.py`. Mỗi ảnh là một PNG riêng (kích thước thật ghi kèm để giữ đúng tỉ lệ).
 */
type Art = { src: ImageSourcePropType; w: number; h: number };

export type NeonTitleId = 'hom-nay' | 'dua-top' | 'lo-trinh' | 'tien-do';

export const NEON_TITLES = {
  'hom-nay': { src: require('../../../assets/neon/title-hom-nay.png'), w: 900, h: 262 },
  'dua-top': { src: require('../../../assets/neon/title-dua-top.png'), w: 900, h: 274 },
  'lo-trinh': { src: require('../../../assets/neon/title-lo-trinh.png'), w: 900, h: 280 },
  'tien-do': { src: require('../../../assets/neon/title-tien-do.png'), w: 900, h: 326 },
} satisfies Record<NeonTitleId, Art>;

/** Bản chữ tiếng Anh của cùng ba tiêu đề, dùng khi giao diện đang ở tiếng Anh. */
export const NEON_TITLES_EN = {
  'hom-nay': { src: require('../../../assets/neon/title-en-today.png'), w: 900, h: 307 },
  'dua-top': { src: require('../../../assets/neon/title-en-top-race.png'), w: 900, h: 236 },
  'lo-trinh': { src: require('../../../assets/neon/title-en-my-path.png'), w: 900, h: 267 },
  'tien-do': { src: require('../../../assets/neon/title-en-progress.png'), w: 900, h: 250 },
} satisfies Record<NeonTitleId, Art>;

export const NEON_ICONS = {
  star4: { src: require('../../../assets/neon/star4.png'), w: 223, h: 256 },
  sparkle: { src: require('../../../assets/neon/sparkle.png'), w: 256, h: 247 },
  speaker: { src: require('../../../assets/neon/speaker.png'), w: 256, h: 197 },
  clock: { src: require('../../../assets/neon/clock.png'), w: 237, h: 256 },
  flame: { src: require('../../../assets/neon/flame.png'), w: 211, h: 256 },
  trophy: { src: require('../../../assets/neon/trophy.png'), w: 256, h: 241 },
  crown: { src: require('../../../assets/neon/crown.png'), w: 256, h: 192 },
  star5: { src: require('../../../assets/neon/star5.png'), w: 232, h: 256 },
  check: { src: require('../../../assets/neon/check.png'), w: 256, h: 221 },
  heart: { src: require('../../../assets/neon/heart.png'), w: 256, h: 231 },
  book: { src: require('../../../assets/neon/book.png'), w: 256, h: 199 },
  next: { src: require('../../../assets/neon/next.png'), w: 256, h: 250 },
  cloud: { src: require('../../../assets/neon/cloud.png'), w: 256, h: 186 },
  planet: { src: require('../../../assets/neon/planet.png'), w: 256, h: 185 },
  moon: { src: require('../../../assets/neon/moon.png'), w: 256, h: 252 },
  rocket: { src: require('../../../assets/neon/rocket.png'), w: 236, h: 256 },
  gem: { src: require('../../../assets/neon/gem.png'), w: 256, h: 245 },
  coin: { src: require('../../../assets/neon/coin.png'), w: 256, h: 251 },
  bolt: { src: require('../../../assets/neon/bolt.png'), w: 213, h: 256 },
  gift: { src: require('../../../assets/neon/gift.png'), w: 234, h: 256 },
  medal: { src: require('../../../assets/neon/medal.png'), w: 208, h: 256 },
  gamepad: { src: require('../../../assets/neon/gamepad.png'), w: 256, h: 181 },
  note: { src: require('../../../assets/neon/note.png'), w: 249, h: 256 },
  cursor: { src: require('../../../assets/neon/cursor.png'), w: 231, h: 256 },
} satisfies Record<string, Art>;

export type NeonIconId = keyof typeof NEON_ICONS;
