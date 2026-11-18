import React from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';

import { HeroShell } from '@/components/layout/HeroShell';
import { NeonWindow } from '@/components/neon/Neon';
import type { NeonIconId } from '@/components/neon/neon-art';

/** Bảng màu khu Luyện nói — cùng bảng với Hôm nay và Lộ trình học. */
export const HUB_UI = {
  navy: '#2B2350',
  purple: '#6A4BD9',
  muted: '#6B6590',
  line: '#E6E1F3',
  wash: '#F3F0FB',
  orange: '#E0862B',
  green: '#16A34A',
} as const;


/**
 * Chữ của khu Luyện nói và các trang dùng bộ thành phần này: Nunito (đã nạp toàn app ở app/_layout.tsx), đặt phông RÕ RÀNG
 * theo độ đậm. Không đặt phông thì chữ rơi về phông hệ thống của máy — mỗi máy một kiểu — nên mọi `fontWeight` ở đây đi kèm họ phông.
 */
export function nun(weight: '400' | '600' | '700' | '800' | '900'): { fontFamily: string; fontWeight: 'normal' } {
  const family = weight === '900' ? 'Nunito_700Bold' : weight === '800' ? 'Nunito_400Regular' : weight === '700' ? 'Nunito_700Bold' : weight === '600' ? 'Nunito_600SemiBold' : 'Nunito_400Regular';
  return { fontFamily: `${family}, Nunito, system-ui, sans-serif`, fontWeight: 'normal' };
}

export type HubStat = { value: string; label: string };

/** Đầu trang kiểu Hôm nay: nhãn nhỏ, tiêu đề hai dòng (dòng 2 màu cam), mô tả và hàng chỉ số. */
export function HubHero({ eyebrow, title, accent, desc, stats }: { eyebrow: string; title: string; accent?: string; desc?: string; stats?: HubStat[] }) {
  const wide = useWindowDimensions().width >= 720;
  return (
    <HeroShell radius={28} style={{ padding: wide ? 26 : 18, gap: 6 }}>
      <Text style={{ color: HUB_UI.purple, fontSize: 13, ...nun('800'), letterSpacing: 1.6, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.88)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 4, overflow: 'hidden' }}>{eyebrow}</Text>
      <Text style={{ color: HUB_UI.navy, fontSize: wide ? 36 : 26, ...nun('900'), lineHeight: wide ? 42 : 32, letterSpacing: -0.4 }}>{title}</Text>
      {accent ? <Text style={{ color: HUB_UI.orange, fontSize: wide ? 36 : 26, ...nun('900'), lineHeight: wide ? 42 : 32, letterSpacing: -0.4 }}>{accent}</Text> : null}
      {desc ? <Text style={{ color: HUB_UI.muted, fontSize: 15, ...nun('600'), lineHeight: 22, marginTop: 4, maxWidth: 560 }}>{desc}</Text> : null}
      {stats?.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 }}>
          {stats.map((s) => (
            <View key={s.label} style={{ flexGrow: 1, flexBasis: 150, minWidth: 140, padding: 12, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.94)' }}>
              <Text style={{ color: HUB_UI.navy, fontSize: 22, ...nun('900') }}>{s.value}</Text>
              <Text style={{ color: HUB_UI.muted, fontSize: 13, ...nun('700') }}>{s.label}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </HeroShell>
  );
}

/** Khung cửa sổ retro như Lộ trình học: thanh tiêu đề xanh tím, thân trắng. */
export function HubPanel({ title, icon = 'book', badge, children }: { title: string; icon?: NeonIconId; badge?: string; children: React.ReactNode }) {
  return (
    <NeonWindow title={title} icon={icon} badge={badge} padded={false}>
      <View style={{ padding: 16, gap: 12 }}>{children}</View>
    </NeonWindow>
  );
}

/** Hàng nút lọc dạng viên thuốc. */
export function HubChips<T extends string>({ options, value, onChange }: { options: { id: T; label: string }[]; value: T; onChange: (id: T) => void }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {options.map((o) => {
        const on = o.id === value;
        return (
          <Pressable key={o.id} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => onChange(o.id)} style={{ borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: on ? HUB_UI.purple : '#FFFFFF', borderWidth: 1.5, borderColor: on ? HUB_UI.purple : HUB_UI.line }}>
            <Text style={{ fontSize: 14, ...nun('800'), color: on ? '#FFFFFF' : HUB_UI.navy }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Thanh tiến độ mảnh, màu tím. */
export function HubBar({ ratio, color = HUB_UI.purple }: { ratio: number; color?: string }) {
  return (
    <View style={{ height: 8, borderRadius: 4, backgroundColor: HUB_UI.wash, overflow: 'hidden' }}>
      <View style={{ width: `${Math.round(Math.min(1, Math.max(0, ratio)) * 100)}%`, height: 8, borderRadius: 4, backgroundColor: color }} />
    </View>
  );
}

/** Mảnh nhỏ (viên thuốc chữ) dùng cho độ khó, số câu, thời lượng. */
export function HubTag({ label, color = HUB_UI.purple, bg = HUB_UI.wash }: { label: string; color?: string; bg?: string }) {
  return (
    <View style={{ borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3, backgroundColor: bg }}>
      <Text style={{ fontSize: 12.5, ...nun('800'), color }}>{label}</Text>
    </View>
  );
}

/** Thẻ nổi lên khi rê chuột (chỉ web), dùng cho mọi thẻ bấm được trong khu Luyện nói. */
export function hubLift(hovered: boolean | undefined, color: string = HUB_UI.purple): object {
  return {
    transitionDuration: '160ms',
    transitionProperty: 'transform, box-shadow, border-color',
    transform: [{ translateY: hovered ? -3 : 0 }],
    boxShadow: hovered ? `0 12px 24px ${color}33` : '0 2px 8px rgba(43,35,80,0.06)',
    borderColor: hovered ? color : HUB_UI.line,
  };
}
