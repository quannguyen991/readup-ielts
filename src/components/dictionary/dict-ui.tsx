import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { PixelText } from '@/components/neon/Neon';
import { goldLeaf, color } from '@/theme/tokens';
import { readingFont } from '@/lib/readingFonts';

/** Bộ khối dựng chung của trang Từ điển chuyên sâu: thẻ trắng bo tròn, tiêu đề mục, chip. */

export const SOFT_SHADOW = '0 14px 34px -18px rgba(54,36,120,0.28), 0 2px 6px rgba(54,36,120,0.06)';

export function Card({ children, style, pad = 22 }: { children: React.ReactNode; style?: object; pad?: number }) {
  return (
    <View
      style={
        {
          backgroundColor: color.surface,
          borderRadius: 24,
          borderWidth: 2,
          borderColor: '#2A22B5',
          padding: pad,
          // Bóng đặc lệch xuống như cửa sổ neon của trang Hôm nay (không dùng bóng mờ).
          boxShadow: '0 6px 0 rgba(42,34,181,0.28)',
          ...style,
        } as object
      }
    >
      {children}
    </View>
  );
}

export function SectionTitle({ children, hint }: { children: string; hint?: string }) {
  return (
    <View style={{ marginBottom: 14, gap: 2 }}>
      <PixelText size={28} color="#2A22B5">{children}</PixelText>
      {hint ? <Text style={{ fontFamily: readingFont.sans, fontSize: 13, color: color.muted }}>{hint}</Text> : null}
    </View>
  );
}

export function Pill({ label, tone = 'plain' }: { label: string; tone?: 'gold' | 'primary' | 'plain' }) {
  const bg = tone === 'gold' ? goldLeaf.soft : tone === 'primary' ? color.primarySoft : color.surfaceAlt;
  const fg = tone === 'gold' ? goldLeaf.softInk : tone === 'primary' ? color.primaryDark : color.body;
  return (
    <View style={{ backgroundColor: bg, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5, borderWidth: tone === 'gold' ? 1 : 0, borderColor: '#F0D58A' }}>
      <Text style={{ fontFamily: readingFont.sansBold, fontSize: 13, color: fg }}>{label}</Text>
    </View>
  );
}

/** Chip bấm được: từ in đậm, nghĩa Việt nhỏ bên cạnh. */
export function WordChip({
  word,
  gloss,
  onPress,
  tone = 'plain',
  current = false,
}: {
  word: string;
  gloss?: string;
  onPress?: () => void;
  tone?: 'plain' | 'good' | 'bad';
  current?: boolean;
}) {
  const palette = {
    plain: { bg: color.surfaceAlt, border: color.border, fg: color.ink },
    good: { bg: '#EAF7EF', border: '#BFE6CD', fg: '#14532D' },
    bad: { bg: '#FDEEEC', border: '#F5C9C4', fg: '#7F1D1D' },
  }[tone];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Tra từ ${word}`}
      disabled={!onPress || current}
      onPress={onPress}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) =>
        ({
          flexDirection: 'row',
          alignItems: 'baseline',
          flexWrap: 'wrap',
          gap: 6,
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: current ? color.primaryDark : palette.border,
          backgroundColor: current ? color.primaryDark : palette.bg,
          opacity: pressed ? 0.75 : 1,
          transform: [{ translateY: hovered && onPress && !current ? -1 : 0 }],
        }) as object
      }
    >
      <Text style={{ fontFamily: readingFont.sansBold, fontSize: 15, color: current ? '#FFFFFF' : palette.fg }}>{word}</Text>
      {gloss ? <Text style={{ fontFamily: readingFont.sans, fontSize: 13, color: current ? 'rgba(255,255,255,0.85)' : color.muted }}>{gloss}</Text> : null}
    </Pressable>
  );
}
