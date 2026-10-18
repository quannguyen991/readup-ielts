import type { ImageSourcePropType } from 'react-native';

/**
 * Icon Chiikawa pixel cho các mục điều hướng bên trái, theo khoá mục trong nav-items.ts.
 *
 * `w` và `h` là điểm ảnh thật của file (lưới 16 ô × 2), nên hiển thị không bị co giãn
 * và các ô pixel vẫn đều. Sinh bằng scripts/pixel/pixelize-chiikawa.mjs.
 */
export const PIXEL_NAV_ICON: Record<string, { src: ImageSourcePropType; w: number; h: number }> = {
  home: { src: require('../../../assets/pixel-chiikawa/nav-home.png'), w: 40, h: 36 },
  dashboard: { src: require('../../../assets/pixel-chiikawa/nav-dashboard.png'), w: 40, h: 36 },
  ielts: { src: require('../../../assets/pixel-chiikawa/nav-ielts.png'), w: 40, h: 40 },
  sat: { src: require('../../../assets/pixel-chiikawa/nav-sat.png'), w: 40, h: 26 },
  vocabulary: { src: require('../../../assets/pixel-chiikawa/nav-vocabulary.png'), w: 40, h: 34 },
  quest: { src: require('../../../assets/pixel-chiikawa/nav-quest.png'), w: 40, h: 24 },
  me: { src: require('../../../assets/pixel-chiikawa/nav-profile.png'), w: 40, h: 36 },
};
