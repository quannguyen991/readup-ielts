import React from 'react';
import { View } from 'react-native';

import { Icon, type IconName } from './Icon';
import { color } from '@/theme/tokens';

export type IconTone = 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'info';

const bgClass: Record<IconTone, string> = {
  primary: 'bg-primary-50',
  accent: 'bg-accent-50',
  success: 'bg-success-soft',
  warning: 'bg-warning-soft',
  danger: 'bg-danger-soft',
  info: 'bg-info-soft',
};

const strokeColor: Record<IconTone, string> = {
  primary: color.primary,
  accent: color.accent,
  success: color.success,
  warning: color.warning,
  danger: color.danger,
  info: color.info,
};

/** Icon đặt trong hình tròn nền pastel cùng tông — mô-típ lặp lại ở mọi stat card. */
export function IconCircle({
  name,
  tone = 'primary',
  size = 44,
  className,
}: {
  name: IconName;
  tone?: IconTone;
  size?: number;
  className?: string;
}) {
  return (
    <View
      className={['items-center justify-center rounded-pill', bgClass[tone], className ?? '']
        .filter(Boolean)
        .join(' ')}
      style={{ width: size, height: size }}
    >
      <Icon name={name} size={size * 0.48} color={strokeColor[tone]} strokeWidth={1.8} />
    </View>
  );
}
