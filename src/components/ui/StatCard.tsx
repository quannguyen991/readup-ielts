import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { Badge, TrendBadge } from './Badge';
import { Card } from './Card';
import { Icon, type IconName } from './Icon';
import { IconCircle, type IconTone } from './IconCircle';
import { ProgressBar, type ProgressTone } from './ProgressBar';
import { StickerCard } from './StickerCard';
import { color, stickerGradient } from '@/theme/tokens';

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
  /**
   * 'sticker' = viền đen dày + bóng lệch cứng + nền gradient rực màu theo
   * `tone` (xem `StickerCard`). CHỈ bật ở nơi gọi cụ thể, mặc định vẫn là
   * card trắng phẳng như trước — đổi mặc định sẽ ảnh hưởng mọi màn đang dùng
   * `StatCard` (Dashboard, Progress, Test Review), phần lớn trong số đó không
   * hợp với một khối màu bão hoà (quá nhiều card sát nhau, nội dung dày hơn).
   */
  variant?: 'default' | 'sticker';
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
  variant = 'default',
  children,
  className,
}: StatCardProps) {
  const sticker = variant === 'sticker';
  const gradient = stickerGradient[tone];

  const labelClass = sticker ? 'font-mid text-label text-white/80' : 'font-mid text-label text-muted';
  const valueClass = sticker ? 'font-heavy text-stat text-white' : 'font-heavy text-stat text-ink';
  const unitClass = sticker ? 'font-mid text-body text-white/80' : 'font-mid text-body text-muted';
  const captionClass = sticker
    ? 'flex-1 font-sans text-label text-white/75'
    : 'flex-1 font-sans text-label text-subtle';
  const chevronColor = sticker ? '#FFFFFF' : color.subtle;

  const content = (
    <View className={iconPlacement === 'left' ? 'flex-row items-start gap-3' : 'gap-3'}>
      {sticker ? (
        <View className="h-11 w-11 items-center justify-center rounded-pill bg-white/90">
          <Icon name={icon} size={20} color={gradient[1]} strokeWidth={1.9} />
        </View>
      ) : (
        <IconCircle name={icon} tone={tone} />
      )}

      <View className="min-w-0 flex-1">
        <View className="flex-row items-center justify-between">
          <Text className={labelClass} numberOfLines={1}>
            {label}
          </Text>
          {onPress ? <Icon name="chevron-right" size={16} color={chevronColor} /> : null}
        </View>

        <View className="mt-1 flex-row items-baseline gap-1">
          <Text className={valueClass}>{value}</Text>
          {unit ? <Text className={unitClass}>{unit}</Text> : null}
        </View>

        {status ? (
          <Badge
            label={status.label}
            tone={status.tone === 'primary' ? 'primary' : status.tone}
            className="mt-1"
          />
        ) : null}

        {progress ? (
          <View className={sticker ? 'mt-2 overflow-hidden rounded-pill bg-white/25' : 'mt-2'}>
            {sticker ? (
              <View
                className="h-1.5 rounded-pill bg-white"
                style={{ width: `${Math.max(0, Math.min(100, progress.value))}%` }}
              />
            ) : (
              <ProgressBar value={progress.value} tone={progress.tone ?? 'primary'} />
            )}
          </View>
        ) : null}

        {trend || caption ? (
          <View className="mt-2 flex-row items-center gap-2">
            {trend ? <TrendBadge value={trend.value} suffix={trend.suffix} /> : null}
            {caption ? (
              <Text className={captionClass} numberOfLines={2}>
                {caption}
              </Text>
            ) : null}
          </View>
        ) : null}

        {children}
      </View>
    </View>
  );

  const body = sticker ? (
    <StickerCard colors={gradient} className={['flex-1', className ?? ''].filter(Boolean).join(' ')}>
      {content}
    </StickerCard>
  ) : (
    <Card className={['flex-1', className ?? ''].filter(Boolean).join(' ')}>{content}</Card>
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
