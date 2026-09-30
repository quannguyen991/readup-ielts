import React from 'react';
import { View } from 'react-native';

import { Icon, type IconName } from './Icon';
import { SealIcon } from '@/components/illust/HeroArt';
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

/** Màu huy hiệu răng cưa (không dùng tím). */
const SEAL: Record<IconTone, string> = {
  primary: '#4A7FE8',
  accent: '#F2B632',
  success: '#22A06B',
  warning: '#F0703F',
  danger: '#E0533D',
  info: '#0EA5E9',
};

/** Icon đặt trong hình tròn nền pastel cùng tông — mô-típ lặp lại ở mọi stat card. */
export function IconCircle({
  name,
  tone = 'primary',
  size = 44,
  className,
  seal = true,
}: {
  /** false = vòng tròn nền nhạt kiểu cũ. */
  seal?: boolean;
  name: IconName;
  tone?: IconTone;
  size?: number;
  className?: string;
}) {
  // Từ 30/09/2026: huy hiệu răng cưa màu đặc, biểu tượng trắng (kiểu các thẻ số của The IELTS Dictionary).
  if (seal)
    return (
      <View className={className}>
        <SealIcon name={name} color={SEAL[tone]} size={size} />
      </View>
    );
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
