import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { Icon, type IconName } from './Icon';
import { color } from '@/theme/tokens';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger'
  /** Dùng trên nền gradient của banner hero: chữ trắng, nền mờ. */
  | 'onDark'
  /** Nút chính trên banner gradient: nền trắng, chữ xanh (như ảnh 4). */
  | 'onDarkSolid';
export type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconLeft?: IconName;
  iconRight?: IconName;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
};

const container: Record<ButtonVariant, string> = {
  primary: 'bg-primary-600',
  secondary: 'bg-accent-600',
  outline: 'bg-surface border border-borderStrong',
  ghost: 'bg-transparent',
  danger: 'bg-danger',
  onDark: 'bg-white/15 border border-white/35',
  onDarkSolid: 'bg-white',
};

const labelClass: Record<ButtonVariant, string> = {
  primary: 'text-white',
  secondary: 'text-white',
  outline: 'text-ink',
  ghost: 'text-primary-600',
  danger: 'text-white',
  onDark: 'text-white',
  onDarkSolid: 'text-primary-700',
};

const iconColor: Record<ButtonVariant, string> = {
  primary: color.white,
  secondary: color.white,
  outline: color.body,
  ghost: color.primary,
  danger: color.white,
  onDark: color.white,
  onDarkSolid: color.primary,
};

const sizing: Record<ButtonSize, { box: string; text: string; icon: number }> = {
  sm: { box: 'h-9 px-3 rounded-md gap-1.5', text: 'text-label', icon: 15 },
  md: { box: 'h-11 px-4 rounded-panel gap-2', text: 'text-body', icon: 17 },
  lg: { box: 'h-12 px-5 rounded-panel gap-2', text: 'text-bodyLg', icon: 19 },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  iconLeft,
  iconRight,
  disabled = false,
  loading = false,
  fullWidth = false,
  className,
}: ButtonProps) {
  const s = sizing[size];
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      className={[
        'flex-row items-center justify-center',
        s.box,
        container[variant],
        fullWidth ? 'w-full' : 'self-start',
        inactive ? 'opacity-50' : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={({ pressed }) => (pressed ? { opacity: 0.85 } : undefined)}
    >
      {loading ? (
        <ActivityIndicator size="small" color={iconColor[variant]} />
      ) : (
        <>
          {iconLeft ? <Icon name={iconLeft} size={s.icon} color={iconColor[variant]} /> : null}
          <Text className={['font-semi', s.text, labelClass[variant]].join(' ')}>{label}</Text>
          {iconRight ? <Icon name={iconRight} size={s.icon} color={iconColor[variant]} /> : null}
        </>
      )}
    </Pressable>
  );
}

type IconButtonProps = {
  name: IconName;
  onPress?: () => void;
  size?: number;
  tone?: 'default' | 'primary';
  accessibilityLabel: string;
  className?: string;
};

export function IconButton({
  name,
  onPress,
  size = 18,
  tone = 'default',
  accessibilityLabel,
  className,
}: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      className={[
        'h-9 w-9 items-center justify-center rounded-md border border-border bg-surface',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
    >
      <View>
        <Icon name={name} size={size} color={tone === 'primary' ? color.primary : color.muted} />
      </View>
    </Pressable>
  );
}
