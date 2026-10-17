import React from 'react';
import { Pressable, Text, View, type ViewStyle } from 'react-native';
import { router } from 'expo-router';

import { Starfield } from '@/components/game/juice';

/**
 * GIAO DIỆN ĐẤU TRƯỜNG chung cho các game trong Quest (Đường Vàng, Quán Cà Phê,
 * Đua Xe Từ, Mưa Từ Vựng, Tháp Band): nền đêm có sao, thẻ kính tối có viền sáng,
 * tiêu đề vàng. Dùng một chỗ để mọi game cùng một ngôn ngữ hình ảnh.
 */

export const ARENA = {
  top: '#0B1426',
  bottom: '#1B2A4E',
  glass: 'rgba(255,255,255,0.08)',
  glassStrong: 'rgba(255,255,255,0.14)',
  line: 'rgba(255,255,255,0.16)',
  ink: '#FFFFFF',
  muted: '#B6C2DA',
  gold: '#FACC15',
  goldSoft: '#FDE68A',
} as const;

/** Nền gradient đêm kèm sao. Đặt làm lớp dưới cùng của màn, không nhận chạm. */
export function ArenaBackdrop({ seed = 'arena' }: { seed?: string }) {
  return (
    <View pointerEvents="none" style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }, gradient(ARENA.top, ARENA.bottom)]}>
      <Starfield seed={seed} count={44} />
    </View>
  );
}

/** Thẻ kính: nền mờ, viền sáng nhẹ, bóng đổ sâu. */
export function glass(extra?: ViewStyle): ViewStyle {
  return {
    backgroundColor: ARENA.glass,
    borderWidth: 1,
    borderColor: ARENA.line,
    borderRadius: 22,
    padding: 18,
    boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
    ...(extra ?? {}),
  } as ViewStyle;
}

/** Gradient nền cho ô, nút, thẻ có màu. Web dùng backgroundImage; native rơi về màu đầu. */
export function gradient(a: string, b: string): ViewStyle {
  return { backgroundColor: a, backgroundImage: `linear-gradient(135deg, ${a}, ${b})` } as ViewStyle;
}

/** Đầu màn: nút quay về, tiêu đề vàng, dòng mô tả và một nhãn phụ bên phải. */
export function ArenaHeader({
  title,
  subtitle,
  right,
  backLabel,
  backHref = '/quest',
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  backLabel: string;
  backHref?: string;
}) {
  return (
    <View style={{ gap: 12 }}>
      <Pressable
        onPress={() => router.replace(backHref as never)}
        accessibilityRole="link"
        style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: ARENA.glassStrong, borderWidth: 1, borderColor: ARENA.line }}
      >
        <Text style={{ color: ARENA.ink, fontWeight: '700', fontSize: 13 }}>‹ {backLabel}</Text>
      </Pressable>
      <View style={[glass({ padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 })]}>
        <View style={{ flexShrink: 1, minWidth: 0 }}>
          <Text style={{ color: ARENA.gold, fontWeight: '900', fontSize: 30, textShadowColor: 'rgba(250,204,21,0.45)', textShadowRadius: 14 }}>{title}</Text>
          {subtitle ? <Text style={{ color: ARENA.muted, marginTop: 4, fontSize: 15, lineHeight: 22 }}>{subtitle}</Text> : null}
        </View>
        {right}
      </View>
    </View>
  );
}

/** Nhãn nhỏ dạng viên thuốc, dùng cho số liệu trên đầu màn (Lượt, Combo, Vàng…). */
export function Chip({ label, value, color = ARENA.gold }: { label: string; value: string; color?: string }) {
  return (
    <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.3)', borderWidth: 1, borderColor: ARENA.line, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Text style={{ color: ARENA.muted, fontSize: 12, fontWeight: '700' }}>{label}</Text>
      <Text style={{ color, fontSize: 15, fontWeight: '900' }}>{value}</Text>
    </View>
  );
}

/** Khung thông tin cùng kiểu thẻ kính; nhận `className` để các màn cũ đổi thẳng từ Panel/Card. */
export function ArenaPanel({ children, style, pad = 18, className }: { children: React.ReactNode; style?: ViewStyle; pad?: number; className?: string }) {
  return (
    <View className={className} style={[glass({ padding: pad }), style]}>
      {children}
    </View>
  );
}
