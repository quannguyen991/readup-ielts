import { useIsPhone } from '@/components/layout/PhoneBackdrop';
import { useCuteAppearanceStore } from '@/store/useCuteAppearanceStore';
import { useRewardStore } from '@/store/useRewardStore';

/**
 * Giao diện vàng kim của Band 9 (điện thoại, hoặc máy tính với bảng màu gốc, không theo Chiikawa):
 * linh vật là sư tử Leo (public/mascot/lion) thay cho mèo. Bảng màu khác và chủ đề Chiikawa giữ nguyên.
 */
export function useLionSkin(): boolean {
  const phone = useIsPhone();
  const paletteKey = useCuteAppearanceStore((s) => s.palette);
  const chiikawa = useRewardStore((s) => s.theme === 'theme-chiikawa');
  return !chiikawa && (phone || paletteKey === 'original');
}
