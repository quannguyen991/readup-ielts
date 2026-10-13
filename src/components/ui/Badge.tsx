import React from 'react';
import { Platform, Text, View } from 'react-native';

import { useRetroStyle } from '@/components/profile-retro/retro-scope';
import { RFONT, RGOLD, RINK, RLEAF, RORANGE, RPAPER, RPINK, RSKY } from '@/components/profile-retro/retro-art';

export type BadgeTone =
  | 'primary'
  | 'accent'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'neutral';

const toneClass: Record<BadgeTone, { bg: string; text: string }> = {
  primary: { bg: 'bg-primary-50', text: 'text-primary-700' },
  accent: { bg: 'bg-accent-50', text: 'text-accent-700' },
  success: { bg: 'bg-success-soft', text: 'text-success-ink' },
  danger: { bg: 'bg-danger-soft', text: 'text-danger-ink' },
  warning: { bg: 'bg-warning-soft', text: 'text-warning-ink' },
  info: { bg: 'bg-info-soft', text: 'text-info-ink' },
  neutral: { bg: 'bg-surfaceAlt', text: 'text-muted' },
};

/** Màu nền retro theo sắc thái: mỗi nhãn một màu trong bảng màu của trang. */
const retroFill: Record<BadgeTone, string> = {
  primary: RGOLD,
  accent: RORANGE,
  success: RLEAF,
  danger: RPINK,
  warning: RGOLD,
  info: RSKY,
  neutral: RPAPER,
};

type BadgeProps = {
  label: string;
  tone?: BadgeTone;
  /** 'chip' bo tròn hoàn toàn, 'tag' bo nhẹ như badge ACADEMIC trong ảnh 4. */
  shape?: 'chip' | 'tag';
  uppercase?: boolean;
  className?: string;
};

export function Badge({
  label,
  tone = 'neutral',
  shape = 'chip',
  uppercase = false,
  className,
}: BadgeProps) {
  const t = toneClass[tone];
  const retro = useRetroStyle();
  return (
    <View
      className={[
        'self-start px-2.5 py-1',
        retro ? '' : shape === 'chip' ? 'rounded-pill' : 'rounded-md',
        retro ? '' : t.bg,
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={
        retro
          ? ({
              borderRadius: shape === 'chip' ? 999 : 8,
              borderWidth: 2.5,
              borderColor: RINK,
              backgroundColor: retroFill[tone],
              ...(Platform.OS === 'web' ? { boxShadow: '2px 2px 0 #1F1A1D' } : {}),
            } as never)
          : undefined
      }
    >
      <Text
        className={['font-semi text-label tracking-wide', retro ? '' : t.text].join(' ')}
        style={[uppercase ? { letterSpacing: 0.6 } : null, retro ? { color: RINK, fontFamily: RFONT.heavy } : null]}
      >
        {uppercase ? label.toUpperCase() : label}
      </Text>
    </View>
  );
}

type TrendBadgeProps = {
  /** Số dương = tăng (xanh lá), âm = giảm (đỏ), 0 = không đổi (xám). */
  value: number;
  suffix?: string;
  className?: string;
};

/** Chip mũi tên ↑ 0.5 / ↓ 2% xuất hiện khắp Dashboard, Progress, Test Review. */
export function TrendBadge({ value, suffix = '', className }: TrendBadgeProps) {
  const dir = value > 0 ? 'up' : value < 0 ? 'down' : 'flat';
  const tone =
    dir === 'up'
      ? { bg: 'bg-success-soft', text: 'text-success-ink', arrow: '↑' }
      : dir === 'down'
        ? { bg: 'bg-danger-soft', text: 'text-danger-ink', arrow: '↓' }
        : { bg: 'bg-surfaceAlt', text: 'text-muted', arrow: '—' };

  return (
    <View
      className={['self-start rounded-pill px-2 py-0.5', tone.bg, className ?? '']
        .filter(Boolean)
        .join(' ')}
    >
      <Text className={['font-semi text-label', tone.text].join(' ')}>
        {dir === 'flat' ? tone.arrow : `${tone.arrow} ${Math.abs(value)}${suffix}`}
      </Text>
    </View>
  );
}
