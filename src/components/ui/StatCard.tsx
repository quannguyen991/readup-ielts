import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { Badge, TrendBadge } from './Badge';
import { Card } from './Card';
import { Icon, type IconName } from './Icon';
import { IconCircle, type IconTone } from './IconCircle';
import { ProgressBar, type ProgressTone } from './ProgressBar';
import { color } from '@/theme/tokens';

type StatCardProps = {
  label: string;
  value: string;
  unit?: string;
  icon: IconName;
  tone?: IconTone;
  /** Dòng phụ dưới giá trị, ví dụ "vs last 30 days". */
  caption?: string;
  /** Chip xu hướng ↑/↓ bên cạnh caption. */
  trend?: { value: number; suffix?: string };
  /** Nhãn trạng thái kiểu "Good", "Excellent" (ảnh 1, 3). */
  status?: { label: string; tone: 'success' | 'primary' | 'warning' };
  progress?: { value: number; tone?: ProgressTone };
  /** Hiện mũi tên > góc phải, biến card thành nút bấm (ảnh 4). */
  onPress?: () => void;
  /** Vị trí icon: 'left' như ảnh 3, 'top' như ảnh 4. */
  iconPlacement?: 'left' | 'top';
  children?: React.ReactNode;
  className?: string;
};

/**
 * Ô thống kê dùng cho hàng 4–5 card ở đầu Dashboard / Progress / Test Review.
 */
export function StatCard({
  label,
  value,
  unit,
  icon,
  tone = 'primary',
  caption,
  trend,
  status,
  progress,
  onPress,
  iconPlacement = 'left',
  children,
  className,
}: StatCardProps) {
  const body = (
    <Card className={['flex-1', className ?? ''].filter(Boolean).join(' ')}>
      <View className={iconPlacement === 'left' ? 'flex-row items-start gap-3' : 'gap-3'}>
        <IconCircle name={icon} tone={tone} />

        <View className="min-w-0 flex-1">
          <View className="flex-row items-center justify-between">
            <Text className="font-mid text-label text-muted" numberOfLines={1}>
              {label}
            </Text>
            {onPress ? <Icon name="chevron-right" size={16} color={color.subtle} /> : null}
          </View>

          <View className="mt-1 flex-row items-baseline gap-1">
            <Text className="font-heavy text-stat text-ink">{value}</Text>
            {unit ? <Text className="font-mid text-body text-muted">{unit}</Text> : null}
          </View>

          {status ? (
            <Badge
              label={status.label}
              tone={status.tone === 'primary' ? 'primary' : status.tone}
              className="mt-1"
            />
          ) : null}

          {progress ? (
            <ProgressBar
              value={progress.value}
              tone={progress.tone ?? 'primary'}
              className="mt-2"
            />
          ) : null}

          {trend || caption ? (
            <View className="mt-2 flex-row items-center gap-2">
              {trend ? <TrendBadge value={trend.value} suffix={trend.suffix} /> : null}
              {caption ? (
                <Text className="flex-1 font-sans text-label text-subtle" numberOfLines={2}>
                  {caption}
                </Text>
              ) : null}
            </View>
          ) : null}

          {children}
        </View>
      </View>
    </Card>
  );

  if (!onPress) return body;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="flex-1"
      style={({ pressed }) => (pressed ? { opacity: 0.9 } : undefined)}
    >
      {body}
    </Pressable>
  );
}
