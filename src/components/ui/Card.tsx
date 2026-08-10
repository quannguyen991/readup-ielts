import React from 'react';
import { Platform, View, type ViewProps } from 'react-native';

import { shadow } from '@/theme/tokens';

type CardProps = ViewProps & {
  /** 'flat' bỏ đổ bóng, dùng cho card lồng trong card. */
  variant?: 'raised' | 'flat';
  padded?: boolean;
};

/**
 * Card trắng, bo 16px, viền mảnh + đổ bóng rất nhẹ — khối cơ bản của mọi màn hình
 * trong ảnh tham chiếu.
 */
export function Card({
  variant = 'raised',
  padded = true,
  className,
  style,
  children,
  ...rest
}: CardProps) {
  return (
    <View
      className={[
        'rounded-card border border-border bg-surface',
        padded ? 'p-4' : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={[
        variant === 'raised' && Platform.OS !== 'web' ? shadow.card : null,
        variant === 'raised' && Platform.OS === 'web'
          ? ({ boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.05)' } as never)
          : null,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}
