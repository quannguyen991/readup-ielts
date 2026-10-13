import React from 'react';
import { Platform, View, type ViewProps } from 'react-native';

import { useRetroStyle } from '@/components/profile-retro/retro-scope';
import { RINK, RPAPER } from '@/components/profile-retro/retro-art';
import { shadow } from '@/theme/tokens';
import { useDesktopGold } from '@/components/layout/gold-skin';
import { GLASS } from '@/components/layout/phone-theme';

/**
 * Thẻ giấy kem nổi trên nền xanh tím.
 *
 * Khác `Card` ở chỗ nào và vì sao không gộp: `Card` là thẻ trắng viền xám của
 * các màn duyệt, nơi nền trang đã sáng nên thẻ chỉ cần một đường viền mảnh để
 * tách ra. `PaperCard` sống trên nền TỐI, nên nó cần màu giấy ấm và bóng đổ sâu
 * hơn để trông như một tờ giấy đặt lên mặt bàn. Nhồi hai vai này vào một
 * component qua cờ `variant` thì mọi chỗ gọi đều phải nhớ chọn đúng cờ, mà
 * chọn sai thì thẻ chìm nghỉm vào nền.
 *
 * Trong khung duyệt của giao diện retro: thẻ kem có viền mực và bóng lệch đặc.
 */
export function PaperCard({
  children,
  className = '',
  padded = true,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
  /** Ghi đè sau bóng đổ, giống `Card` — dùng cho bề ngang tối đa, đệm riêng. */
  style?: ViewProps['style'];
}) {
  const retro = useRetroStyle();
  // Máy tính giữ bảng màu mặc định: thẻ kính ngà như điện thoại, thay cho tờ giấy kem.
  const gold = useDesktopGold();
  return (
    <View
      className={['rounded-card', retro || gold ? '' : 'bg-paper', padded ? 'p-5' : '', className].join(' ')}
      style={[
        retro ? retroPaper : gold ? (GLASS as never) : Platform.OS === 'web' ? webShadow : shadow.card,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const webShadow = { boxShadow: '0 10px 30px rgba(20, 30, 10, 0.18)' } as const;

const retroPaper = {
  borderRadius: 20,
  borderWidth: 3,
  borderColor: RINK,
  backgroundColor: RPAPER,
  ...(Platform.OS === 'web' ? { boxShadow: '4px 4px 0 #1F1A1D' } : {}),
} as never;
