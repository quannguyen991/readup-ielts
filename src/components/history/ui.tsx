import React from 'react';
import { Platform, Pressable, Text, View } from 'react-native';

import { readingFont } from '@/lib/readingFonts';
import { playSfx } from '@/services/audio/sfx-ui';
import type { DisplayLang } from '@/services/history/types';

import { historyPoster } from './posterTheme';

/** Bảng màu và vài mảnh giao diện dùng chung của mảng lịch sử — cùng chất liệu "tờ giấy kem" của màn đọc song ngữ. */
export const H = {
  paper: '#FFFFFF',
  ink: '#1A1A17',
  body: '#34332E',
  muted: '#85837A',
  rule: '#E8E5DC',
  tint: '#F5F3EC',
  accent: '#957846',
  accentSoft: '#F3E9D2',
  good: '#16794A',
  goodBg: 'rgba(22,163,74,0.10)',
  bad: '#B3261E',
  badBg: 'rgba(220,38,38,0.08)',
  warn: '#8A5A12',
  warnBg: '#FBF1D3',
} as const;

export const softShadow = (Platform.OS === 'web'
  ? { boxShadow: '0 1px 2px rgba(15,23,42,0.05), 0 10px 26px rgba(94,72,35,0.08)' }
  : { elevation: 2 }) as object;

/** Chọn chữ theo chế độ hiển thị: `both` lấy tiếng Việt làm chữ chính. */
export const pickLang = (lang: DisplayLang, vi: string, en: string): string => (lang === 'en' ? en : vi);

export function Card({ children, style, id }: { children: React.ReactNode; style?: object; id?: string }) {
  return (
    <View
      nativeID={id}
      style={[{ backgroundColor: H.paper, borderRadius: 20, borderWidth: 1, borderColor: H.rule, padding: 20 }, softShadow, style]}
    >
      {children}
    </View>
  );
}

export function Eyebrow({ children, poster = false }: { children: React.ReactNode; poster?: boolean }) {
  return <Text style={{ fontFamily: readingFont.sansBold, fontSize: 12.5, letterSpacing: 0.4, color: poster ? historyPoster.red : H.accent, textTransform: 'uppercase' }}>{children}</Text>;
}

export function SectionTitle({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <View style={{ gap: 2 }}>
      <Text style={{ fontFamily: readingFont.display, fontWeight: '700', fontSize: 22, letterSpacing: -0.25, color: H.ink }}>{children}</Text>
      {hint ? <Text style={{ fontFamily: readingFont.sans, fontSize: 13, color: H.muted }}>{hint}</Text> : null}
    </View>
  );
}

export function Chip({ label, tone = 'plain', poster = false }: { label: string; tone?: 'plain' | 'accent' | 'warn' | 'good' | 'bad'; poster?: boolean }) {
  const t = poster ? {
    plain: { bg: historyPoster.forest, fg: historyPoster.cream },
    accent: { bg: historyPoster.red, fg: historyPoster.cream },
    warn: { bg: historyPoster.gold, fg: historyPoster.ink },
    good: { bg: historyPoster.olive, fg: historyPoster.cream },
    bad: { bg: historyPoster.deepRed, fg: historyPoster.cream },
  }[tone] : {
    plain: { bg: H.tint, fg: H.body },
    accent: { bg: H.accentSoft, fg: H.accent },
    warn: { bg: H.warnBg, fg: H.warn },
    good: { bg: H.goodBg, fg: H.good },
    bad: { bg: H.badBg, fg: H.bad },
  }[tone];
  return (
    <View style={{ alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, backgroundColor: t.bg }}>
      <Text style={{ fontFamily: readingFont.sansBold, fontSize: 12, color: t.fg }}>{label}</Text>
    </View>
  );
}

/** Nút phân đoạn (EN | VI | Song ngữ…). Cao tối thiểu 44px cho ngón tay. */
export function Segmented<T extends string>({ value, options, onChange, label, poster = false }: { value: T; options: { key: T; label: string }[]; onChange: (v: T) => void; label: string; poster?: boolean }) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={{ flexDirection: 'row', backgroundColor: poster ? historyPoster.ink : H.tint, borderRadius: poster ? 6 : 999, borderWidth: poster ? 2 : 0, borderColor: poster ? historyPoster.gold : 'transparent', padding: 3, alignSelf: 'flex-start' }}>
      {options.map((o) => {
        const on = o.key === value;
        return (
          <Pressable
            key={o.key}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            onPress={() => {
              if (!on) playSfx('select');
              onChange(o.key);
            }}
            style={{ minHeight: 40, minWidth: 56, paddingHorizontal: 14, borderRadius: poster ? 3 : 999, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? poster ? historyPoster.gold : H.accent : 'transparent' }}
          >
            <Text style={{ fontFamily: readingFont.sansBold, fontSize: 13.5, color: on ? poster ? historyPoster.ink : '#FFFFFF' : poster ? historyPoster.cream : H.body }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function LinkButton({ label, onPress, strong, disabled, style }: { label: string; onPress: () => void; strong?: boolean; disabled?: boolean; style?: object }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={() => {
        playSfx('tap');
        onPress();
      }}
      style={[
        { minHeight: 44, borderRadius: 22, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: strong ? H.accent : H.tint, opacity: disabled ? 0.5 : 1 },
        style,
      ]}
    >
      <Text style={{ fontFamily: readingFont.sansBold, fontSize: 14, color: strong ? '#FFFFFF' : H.ink }}>{label}</Text>
    </Pressable>
  );
}
