import { ZH_V4 } from './v4';

/**
 * Mỗi cấp HSK có bộ riêng, cùng một phong cách vẽ (ChatGPT, gouache, không chữ):
 * nền trang, banner đầu bài, viền (medallion, góc, con dấu) và màu nhấn.
 * 1 đỏ son và hồng phấn; 2 ngọc lục bảo; 3 chàm và men xanh; 4 hổ phách và thu vàng; 5 tím oải hương;
 * 6 san hô và xanh ngọc; 7 mực đêm và vàng kim.
 */
export type LevelFrames = {
  /** Medallion đám mây giữ icon cách luyện. */
  cloud: number;
  /** Góc khung (một góc, lật để dùng bốn góc). */
  corner: number;
  /** Con dấu tròn đầu mục. */
  seal: number;
};

export type LevelTheme = {
  /** Nền trang phía sau cả màn (JPEG, không chữ). */
  pageBg: number;
  /** Banner đầu bài (JPEG, không chữ). */
  banner: number;
  /** Ba điểm của lớp phủ bên trái banner, từ đậm đến nhạt, để chữ đọc rõ. */
  wash: [string, string, string];
  /** Màu nhấn của tiêu đề và đầu mục trong trang. */
  accent: string;
  frames: LevelFrames;
};

const V4_LEVEL = (n: number, kind: 'cloud' | 'corner' | 'seal'): number =>
  ({
    2: { cloud: require('../../../../assets/chinese/v4/levels/hsk2-cloud.png') as number, corner: require('../../../../assets/chinese/v4/levels/hsk2-corner.png') as number, seal: require('../../../../assets/chinese/v4/levels/hsk2-seal.png') as number },
    3: { cloud: require('../../../../assets/chinese/v4/levels/hsk3-cloud.png') as number, corner: require('../../../../assets/chinese/v4/levels/hsk3-corner.png') as number, seal: require('../../../../assets/chinese/v4/levels/hsk3-seal.png') as number },
    4: { cloud: require('../../../../assets/chinese/v4/levels/hsk4-cloud.png') as number, corner: require('../../../../assets/chinese/v4/levels/hsk4-corner.png') as number, seal: require('../../../../assets/chinese/v4/levels/hsk4-seal.png') as number },
    5: { cloud: require('../../../../assets/chinese/v4/levels/hsk5-cloud.png') as number, corner: require('../../../../assets/chinese/v4/levels/hsk5-corner.png') as number, seal: require('../../../../assets/chinese/v4/levels/hsk5-seal.png') as number },
    6: { cloud: require('../../../../assets/chinese/v4/levels/hsk6-cloud.png') as number, corner: require('../../../../assets/chinese/v4/levels/hsk6-corner.png') as number, seal: require('../../../../assets/chinese/v4/levels/hsk6-seal.png') as number },
    7: { cloud: require('../../../../assets/chinese/v4/levels/hsk7-cloud.png') as number, corner: require('../../../../assets/chinese/v4/levels/hsk7-corner.png') as number, seal: require('../../../../assets/chinese/v4/levels/hsk7-seal.png') as number },
  } as Record<number, LevelFrames>)[n]![kind]!;

const V4_PAGE_BG: Record<number, number> = {
  2: require('../../../../assets/chinese/v4/backgrounds/page-bg-hsk2.jpg') as number,
  3: require('../../../../assets/chinese/v4/backgrounds/page-bg-hsk3.jpg') as number,
  4: require('../../../../assets/chinese/v4/backgrounds/page-bg-hsk4.jpg') as number,
  5: require('../../../../assets/chinese/v4/backgrounds/page-bg-hsk5.jpg') as number,
  6: require('../../../../assets/chinese/v4/backgrounds/page-bg-hsk6.jpg') as number,
  7: require('../../../../assets/chinese/v4/backgrounds/page-bg-hsk7.jpg') as number,
};

const framesOf = (n: number): LevelFrames => ({
  cloud: V4_LEVEL(n, 'cloud'),
  corner: V4_LEVEL(n, 'corner'),
  seal: V4_LEVEL(n, 'seal'),
});

export const LEVEL_THEME: Record<number, LevelTheme> = {
  1: {
    pageBg: ZH_V4.bg.street,
    banner: ZH_V4.bg.banner,
    wash: ['rgba(150,26,30,0.94)', 'rgba(170,40,44,0.62)', 'rgba(200,80,70,0.08)'],
    accent: '#B3262E',
    frames: {
      cloud: ZH_V4.frame.cloud,
      // Góc cấp 1 đã xoay về kiểu góc trên-trái, giống các cấp khác (xem ZhPracticeGrid và ZhLevelCorners).
      corner: require('../../../../assets/chinese/v4/levels/corner-level1.png') as number,
      seal: ZH_V4.frame.seal,
    },
  },
  2: {
    pageBg: V4_PAGE_BG[2]!,
    banner: ZH_V4.bg.level[2],
    wash: ['rgba(24,90,68,0.94)', 'rgba(34,116,88,0.62)', 'rgba(70,160,120,0.08)'],
    accent: '#2E7A5A',
    frames: framesOf(2),
  },
  3: {
    pageBg: V4_PAGE_BG[3]!,
    banner: ZH_V4.bg.level[3],
    wash: ['rgba(26,44,92,0.94)', 'rgba(38,66,126,0.62)', 'rgba(70,110,170,0.08)'],
    accent: '#2F4F8A',
    frames: framesOf(3),
  },
  4: {
    pageBg: V4_PAGE_BG[4]!,
    banner: ZH_V4.bg.level[4],
    wash: ['rgba(140,78,14,0.94)', 'rgba(178,104,28,0.62)', 'rgba(214,150,70,0.08)'],
    accent: '#A8641A',
    frames: framesOf(4),
  },
  5: {
    pageBg: V4_PAGE_BG[5]!,
    banner: ZH_V4.bg.level[5],
    wash: ['rgba(80,38,116,0.94)', 'rgba(106,58,146,0.62)', 'rgba(150,100,190,0.08)'],
    accent: '#6B3C94',
    frames: framesOf(5),
  },
  6: {
    pageBg: V4_PAGE_BG[6]!,
    banner: ZH_V4.bg.level[6],
    wash: ['rgba(18,92,106,0.94)', 'rgba(28,116,128,0.62)', 'rgba(230,110,100,0.08)'],
    accent: '#1E7A84',
    frames: framesOf(6),
  },
  7: {
    pageBg: V4_PAGE_BG[7]!,
    banner: ZH_V4.bg.level[7],
    wash: ['rgba(20,22,42,0.95)', 'rgba(38,38,68,0.66)', 'rgba(120,90,40,0.08)'],
    accent: '#3A3F6B',
    frames: framesOf(7),
  },
};

/** Theme của một cấp; không rõ cấp thì dùng cấp 1. */
export function themeForLevel(level: number | null): LevelTheme {
  return LEVEL_THEME[level ?? 1] ?? LEVEL_THEME[1]!;
}
