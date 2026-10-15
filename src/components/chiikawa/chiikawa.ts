import { usePathname } from 'expo-router';

import { useHydrated } from '@/components/layout/useHydrated';
import { isBreakExemptRoute, isStudyRoute } from '@/services/break/study-routes';
import { useRewardStore } from '@/store/useRewardStore';

/** Năm tư thế Chiikawa đã tách nền (assets/illustrations/chiikawa/). Mọi hiệu ứng Chiikawa lấy hình từ đây. */
export const CHIIKAWA_IMG = {
  wave: require('../../../assets/illustrations/chiikawa/wave.png'),
  lie: require('../../../assets/illustrations/chiikawa/lie.png'),
  peek: require('../../../assets/illustrations/chiikawa/peek.png'),
  sleep: require('../../../assets/illustrations/chiikawa/sleep.png'),
  cheer: require('../../../assets/illustrations/chiikawa/cheer.png'),
  /** Chiikawa nằm to trên đệm hồng, ôm tim: hình chính ở hero trang chủ. */
  hero: require('../../../assets/illustrations/chiikawa/hero-lie.png'),
} as const;

/** Đang bật chủ đề Chiikawa. Chờ hydrate để lượt đầu khớp HTML máy chủ (xem CatSticker). */
export function useChiikawaActive(): boolean {
  const hydrated = useHydrated();
  const on = useRewardStore((s) => s.theme === 'theme-chiikawa');
  return hydrated && on;
}

/**
 * Đang ở màn học hoặc làm bài (luyện đọc, luyện đề, thi thử, phòng nói…): Chiikawa lùi
 * xuống mờ và nhỏ để không đè lên chữ và đáp án.
 */
export function useChiikawaQuiet(): boolean {
  const pathname = usePathname();
  return isStudyRoute(pathname) || isBreakExemptRoute(pathname);
}
