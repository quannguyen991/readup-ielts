import { useCuteAppearanceStore } from '@/store/useCuteAppearanceStore';
import { useRewardStore } from '@/store/useRewardStore';
import { useIsPhone } from './PhoneBackdrop';

/**
 * Thẻ kính vàng trên máy tính, cùng kiểu với điện thoại (phone-theme GLASS).
 *
 * Chỉ bật trên máy tính khi người học giữ bảng màu mặc định và không bật theme Chiikawa: đúng điều
 * kiện nền vàng của AppShell. Điện thoại đã có kiểu riêng nên không đổi ở đó, và bảng màu khác vẫn
 * giữ kiểu cũ.
 */
export function useDesktopGold(): boolean {
  const phone = useIsPhone();
  const paletteKey = useCuteAppearanceStore((s) => s.palette);
  const chiikawa = useRewardStore((s) => s.theme === 'theme-chiikawa');
  return !phone && !chiikawa && paletteKey === 'original';
}
