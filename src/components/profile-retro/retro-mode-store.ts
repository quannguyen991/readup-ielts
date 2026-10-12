import { useRewardStore } from '@/store/useRewardStore';

/**
 * Giao diện retro là một chủ đề mua bằng sao ở Đổi quà (như Chiikawa). Đang đeo chủ đề
 * này thì toàn app dùng retro; tháo ra thì về Band 9. Không có cờ riêng để tránh hai nguồn sự thật.
 */
export const RETRO_THEME_ID = 'theme-retro';

/** Giao diện retro đang bật. */
export function useRetroOn(): boolean {
  return useRewardStore((s) => s.theme === RETRO_THEME_ID);
}

/** Bật hoặc tắt retro bằng cách đeo/tháo chủ đề. Chỉ dùng khi đã sở hữu chủ đề. */
export function setRetroOn(on: boolean): void {
  useRewardStore.getState().equip('theme', on ? RETRO_THEME_ID : null);
}
