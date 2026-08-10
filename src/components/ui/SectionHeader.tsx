import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { Icon, type IconName } from './Icon';
import { IconCircle, type IconTone } from './IconCircle';
import { color } from '@/theme/tokens';

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  icon?: IconName;
  iconTone?: IconTone;
  /** Link "View all" bên phải như trong ảnh 4, 5. */
  action?: { label: string; onPress: () => void };
  /** Nút chấm hỏi/thông tin nhỏ cạnh tiêu đề (ảnh 3). */
  hint?: boolean;
  right?: React.ReactNode;
  className?: string;
};

export function SectionHeader({
  title,
  subtitle,
  icon,
  iconTone = 'primary',
  action,
  hint = false,
  right,
  className,
}: SectionHeaderProps) {
  return (
    <View
      className={['flex-row items-center justify-between gap-3', className ?? '']
        .filter(Boolean)
        .join(' ')}
    >
      <View className="min-w-0 flex-1 flex-row items-center gap-2.5">
        {icon ? <IconCircle name={icon} tone={iconTone} size={32} /> : null}
        <View className="min-w-0 flex-1">
          <View className="flex-row items-center gap-1.5">
            <Text className="font-strong text-cardTitle text-ink" numberOfLines={1}>
              {title}
            </Text>
            {hint ? <Icon name="info" size={14} color={color.subtle} /> : null}
          </View>
          {subtitle ? (
            <Text className="mt-0.5 font-sans text-label text-muted" numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      {right}

      {action ? (
        <Pressable
          onPress={action.onPress}
          accessibilityRole="link"
          className="flex-row items-center gap-1"
        >
          <Text className="font-semi text-label text-primary-600">{action.label}</Text>
          <Icon name="chevron-right" size={14} color={color.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}
