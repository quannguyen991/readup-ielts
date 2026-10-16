import React from 'react';
import { Platform, View, type ViewProps } from 'react-native';

import { useRetroStyle } from '@/components/profile-retro/retro-scope';
import { RINK, RPAPER } from '@/components/profile-retro/retro-art';
import { shadow } from '@/theme/tokens';
import { useDesktopGold } from '@/components/layout/gold-skin';
import { GLASS } from '@/components/layout/phone-theme';
import { pixelCardStyle, usePixelTheme } from '@/components/pixel-theme/pixel-art';

type CardProps = ViewProps & {
  /** 'flat' bỏ đổ bóng, dùng cho card lồng trong card. */
  variant?: 'raised' | 'flat';
  padded?: boolean;
};

/**
 * Card trắng, bo 16px, viền mảnh + đổ bóng rất nhẹ — khối cơ bản của mọi màn hình
 * trong ảnh tham chiếu. Trong khung duyệt của giao diện retro: thẻ kem, viền mực,
 * bóng lệch đặc.
 */
export function Card({
  variant = 'raised',
  padded = true,
  className,
  style,
  children,
  ...rest
}: CardProps) {
  const retro = useRetroStyle();
  const px = usePixelTheme();
  const pixel = px !== null;
  // Máy tính giữ bảng màu mặc định: thẻ raised thành kính ngà như điện thoại; thẻ lồng (flat) giữ nguyên.
  const gold = useDesktopGold();
  return (
    <View
      className={[
        retro || pixel ? '' : gold && variant === 'raised' ? 'rounded-card' : 'rounded-card border border-border bg-surface',
        padded ? 'p-4' : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={[
        retro
          ? ({
              borderRadius: 20,
              borderWidth: 3,
              borderColor: RINK,
              backgroundColor: RPAPER,
              ...(Platform.OS === 'web' ? { boxShadow: '4px 4px 0 #1F1A1D' } : {}),
            } as never)
          : null,
        px ? pixelCardStyle(px) : null,
        !retro && !pixel && variant === 'raised' && Platform.OS !== 'web' ? shadow.card : null,
        !retro && !pixel && variant === 'raised' && Platform.OS === 'web'
          ? ({ boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.05)' } as never)
          : null,
        !retro && !pixel && gold && variant === 'raised' ? (GLASS as never) : null,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}
