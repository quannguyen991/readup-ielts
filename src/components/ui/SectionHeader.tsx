import React from 'react';
import { CuteFor, SealIcon } from '@/components/illust/HeroArt';
import { Pressable, Text, View } from 'react-native';

import { Icon, type IconName } from './Icon';
import { type IconTone } from './IconCircle';
import { color } from '@/theme/tokens';
import { useRetroStyle } from '@/components/profile-retro/retro-scope';
import { RFONT, RINK } from '@/components/profile-retro/retro-art';

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
  /** Sticker dễ thương ở cuối hàng tiêu đề (theo `icon`); mặc định bật. */
  sticker?: boolean;
};

/** Màu huy hiệu răng cưa theo tông của tiêu đề mục. */
const SEAL_COLOR: Record<IconTone, string> = {
  primary: '#A8843F',
  accent: '#F2B632',
  success: '#22A06B',
  warning: '#F0703F',
  danger: '#E0533D',
  info: '#B07A3A',
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
  sticker = true,
}: SectionHeaderProps) {
  const retro = useRetroStyle();
  return (
    <View
      className={['flex-row items-center justify-between gap-3', className ?? '']
        .filter(Boolean)
        .join(' ')}
    >
      <View className="min-w-0 flex-1 flex-row items-center gap-2.5">
        {icon ? <SealIcon name={icon} color={SEAL_COLOR[iconTone]} size={42} /> : null}
        <View className="min-w-0 flex-1">
          <View className="flex-row items-center gap-1.5">
            <Text className={retro ? 'text-cardTitle' : 'font-strong text-cardTitle text-ink'} style={retro ? { fontFamily: RFONT.heavy, color: RINK } : undefined} numberOfLines={1}>
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

      {sticker && icon && !right && !action ? <CuteFor icon={icon} size={40} /> : null}
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
