/**
 * Bộ thành phần giao diện "Du ngoạn Band 9": khung giấy kem viền navy có đường
 * chỉ vàng mảnh, nút kiểu game, chip vé / xu. Chữ nội dung vẫn dùng phông đọc
 * của app (Plus Jakarta), cỡ ≥ 14px.
 */
import { themedHex } from '@/theme/palette-state';
import React from 'react';
import { Platform, Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { Icon, type IconName } from '@/components/ui/Icon';

/** Bảng màu Band 9. */
export const T = {
  cream: '#F3EDE1',
  paper: '#FBF7EC',
  paperDeep: '#F1E8D3',
  navy: '#0F1D33',
  navySoft: '#1B2D4D',
  gold: themedHex('#8B6CF0'),
  goldDark: '#6A4BD9',
  goldLight: '#E2C88F',
  ink: '#0F1D33',
  muted: '#5C6477',
  line: 'rgba(139, 108, 240,0.45)',
  good: '#2E8B57',
  goodSoft: '#E6F4EC',
  bad: '#C2412D',
  badSoft: '#FBE9E5',
} as const;

const WEB = Platform.OS === 'web';

export const pixelShadow = (px = 3, color: string = T.navy): object =>
  WEB ? { boxShadow: `0 ${px}px 0 ${color}` } : { elevation: 3 };

/** Khung giấy: viền navy, đường chỉ vàng mảnh bên trong, bốn chấm vàng ở góc. */
export function PixelPanel({
  children,
  style,
  inner,
  tone = 'paper',
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  inner?: StyleProp<ViewStyle>;
  tone?: 'paper' | 'navy';
}) {
  const navy = tone === 'navy';
  const stud = (pos: ViewStyle) => <View pointerEvents="none" style={[{ position: 'absolute', width: 6, height: 6, backgroundColor: T.gold }, pos]} />;
  return (
    <View
      style={[
        {
          backgroundColor: navy ? T.navy : T.paper,
          borderWidth: 2,
          borderColor: navy ? T.gold : T.navy,
          borderRadius: 6,
          padding: 4,
          margin: 3,
        },
        WEB ? ({ boxShadow: `0 4px 0 ${navy ? 'rgba(0,0,0,0.35)' : 'rgba(15,29,51,0.18)'}` } as object) : null,
        style,
      ]}
    >
      <View style={[{ borderWidth: 1, borderColor: navy ? 'rgba(226,200,143,0.4)' : T.line, borderRadius: 3, padding: 14 }, inner]}>{children}</View>
      {stud({ top: -3, left: -3 })}
      {stud({ top: -3, right: -3 })}
      {stud({ bottom: -3, left: -3 })}
      {stud({ bottom: -3, right: -3 })}
    </View>
  );
}

export type BtnTone = 'gold' | 'navy' | 'paper' | 'ghost';

/** Nút kiểu game: cao ≥ 44, bóng cứng dưới đáy, ấn xuống thì lún. */
export function GameButton({
  label,
  onPress,
  tone = 'gold',
  disabled,
  icon,
  small,
  style,
  accessibilityLabel,
}: {
  label: string;
  onPress?: () => void;
  tone?: BtnTone;
  disabled?: boolean;
  icon?: IconName;
  small?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const palette = {
    gold: { bg: T.gold, fg: T.navy, edge: T.goldDark },
    navy: { bg: T.navy, fg: T.goldLight, edge: '#000000' },
    paper: { bg: T.paper, fg: T.navy, edge: T.line },
    ghost: { bg: 'transparent', fg: T.navy, edge: 'transparent' },
  }[tone];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        {
          minHeight: small ? 40 : 46,
          maxWidth: '100%',
          paddingVertical: 6,
          paddingHorizontal: small ? 14 : 20,
          borderRadius: 6,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          backgroundColor: disabled ? '#E4DCC8' : palette.bg,
          borderWidth: tone === 'ghost' ? 0 : 2,
          borderColor: disabled ? '#CFC5AB' : tone === 'paper' ? T.navy : palette.edge,
          opacity: disabled ? 0.8 : 1,
          transform: [{ translateY: pressed && !disabled ? 2 : 0 }],
        },
        WEB && !disabled && tone !== 'ghost' ? ({ boxShadow: pressed ? 'none' : `0 3px 0 ${palette.edge}`, cursor: 'pointer' } as object) : null,
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={18} color={disabled ? '#8B8570' : palette.fg} /> : null}
      <Text className="font-strong" style={{ fontSize: small ? 14 : 15, color: disabled ? '#8B8570' : palette.fg, flexShrink: 1, textAlign: 'center' }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function TicketGlyph({ size = 20, color = T.gold }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20">
      <Path d="M2 5h16v3.2a1.8 1.8 0 0 0 0 3.6V15H2v-3.2a1.8 1.8 0 0 0 0-3.6z" fill={color} />
      <Path d="M12.5 5v10" stroke={T.navy} strokeWidth={1.2} strokeDasharray="1.6 1.6" />
    </Svg>
  );
}

export function CoinGlyph({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20">
      <Circle cx={10} cy={10} r={8} fill={T.gold} stroke={T.goldDark} strokeWidth={1.5} />
      <Circle cx={10} cy={10} r={4.6} fill="none" stroke={T.goldLight} strokeWidth={1.4} />
    </Svg>
  );
}

export function PlaneGlyph({ size = 24, color = T.navy, rotate = 0 }: { size?: number; color?: string; rotate?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={{ transform: [{ rotate: `${rotate}deg` }] }}>
      <Path d="M21 11.2 14 9 9.5 2.5 8 3l2 6.4L5.5 10 4 8l-1.2.4L3.8 12l-1 3.6L4 16l1.5-2 4.5.6-2 6.4 1.5.5L14 15l7-2.2c.8-.3.8-1.4 0-1.6z" fill={color} />
    </Svg>
  );
}

export function StampGlyph({ size = 64, color = T.goldDark, label }: { size?: number; color?: string; label?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Circle cx={32} cy={32} r={28} fill="none" stroke={color} strokeWidth={3} strokeDasharray="3 2.4" />
      <Circle cx={32} cy={32} r={21} fill="none" stroke={color} strokeWidth={2} />
      <Rect x={22} y={29} width={20} height={6} fill={color} opacity={0.85} />
      {label ? null : <Path d="M32 17l3 6 7 1-5 5 1.2 7L32 32.4 25.8 36 27 29l-5-5 7-1z" fill={color} />}
    </Svg>
  );
}

/** Chip "vé" / "xu" cho thanh trên cùng. */
export function StatChip({ kind, value, label }: { kind: 'ticket' | 'coin'; value: number; label: string }) {
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}`}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 36, paddingHorizontal: 10, borderRadius: 6, backgroundColor: T.navy, borderWidth: 1, borderColor: T.gold }}
    >
      {kind === 'ticket' ? <TicketGlyph size={18} /> : <CoinGlyph size={18} />}
      <Text className="font-strong" style={{ fontSize: 15, color: T.goldLight }}>
        {value}
      </Text>
    </View>
  );
}

/** Ba ngôi sao (đủ / rỗng). */
export function StarsRow({ n, max = 3, size = 16 }: { n: number; max?: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }} accessible accessibilityLabel={`${n}/${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <Icon key={i} name={i < n ? 'star-fill' : 'star'} size={size} color={i < n ? T.gold : '#B9B09A'} />
      ))}
    </View>
  );
}

/** Tiêu đề nhỏ của một khối: chữ in hoa cách chữ, đường kẻ vàng. */
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
      <Text className="font-heavy" style={{ fontSize: 14, letterSpacing: 1.4, color: T.goldDark, textTransform: 'uppercase' }}>
        {children}
      </Text>
      <View style={{ flex: 1, height: 1, backgroundColor: T.line }} />
    </View>
  );
}

/** Bề ngang trang của cả game. */
export const PAGE_MAX = 1040;
