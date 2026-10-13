import React from 'react';
import { Text, View } from 'react-native';

import { useRetroStyle } from '@/components/profile-retro/retro-scope';
import { RGOLD, RINK, RLEAF, RORANGE, RPAPER, RPINK } from '@/components/profile-retro/retro-art';

export type ProgressTone = 'primary' | 'accent' | 'success' | 'warning' | 'danger';

const fillClass: Record<ProgressTone, string> = {
  primary: 'bg-primary-600',
  accent: 'bg-accent-600',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
};

/** Màu thanh tiến độ kiểu retro, theo sắc thái. */
const retroFill: Record<ProgressTone, string> = {
  primary: RGOLD,
  accent: RORANGE,
  success: RLEAF,
  warning: RGOLD,
  danger: RPINK,
};

type ProgressBarProps = {
  /** 0–100. Giá trị ngoài khoảng sẽ được kẹp lại. */
  value: number;
  tone?: ProgressTone;
  height?: number;
  label?: string;
  valueLabel?: string;
  className?: string;
};

export function ProgressBar({
  value,
  tone = 'primary',
  height = 6,
  label,
  valueLabel,
  className,
}: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  const retro = useRetroStyle();

  return (
    <View className={className}>
      {label || valueLabel ? (
        <View className="mb-1.5 flex-row items-center justify-between">
          {label ? <Text className="font-mid text-label text-muted">{label}</Text> : <View />}
          {valueLabel ? (
            <Text className="font-semi text-label text-ink">{valueLabel}</Text>
          ) : null}
        </View>
      ) : null}

      <View
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: Math.round(pct) }}
        className={retro ? 'w-full overflow-hidden' : 'w-full overflow-hidden rounded-pill bg-surfaceAlt'}
        style={retro ? { height, borderRadius: 999, borderWidth: 2.5, borderColor: RINK, backgroundColor: RPAPER } : { height }}
      >
        <View
          className={retro ? 'h-full' : ['h-full rounded-pill', fillClass[tone]].join(' ')}
          style={retro ? { width: `${pct}%`, borderRadius: 999, backgroundColor: retroFill[tone] } : { width: `${pct}%` }}
        />
      </View>
    </View>
  );
}
