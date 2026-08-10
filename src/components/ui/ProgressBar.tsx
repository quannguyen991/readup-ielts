import React from 'react';
import { Text, View } from 'react-native';

export type ProgressTone = 'primary' | 'accent' | 'success' | 'warning' | 'danger';

const fillClass: Record<ProgressTone, string> = {
  primary: 'bg-primary-600',
  accent: 'bg-accent-600',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
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
        className="w-full overflow-hidden rounded-pill bg-surfaceAlt"
        style={{ height }}
      >
        <View
          className={['h-full rounded-pill', fillClass[tone]].join(' ')}
          style={{ width: `${pct}%` }}
        />
      </View>
    </View>
  );
}
