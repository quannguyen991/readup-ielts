/**
 * NÚT CHỌN NGÔN NGỮ VI / EN — ở chân thanh bên (máy tính) và đầu trang (điện
 * thoại). Lựa chọn lưu trên máy và đồng bộ theo tài khoản (khoá `locale`).
 */
import { themedHex } from '@/theme/palette-state';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import type { Locale } from '@/i18n/keys';
import { useLocale } from '@/i18n/useL';
import { useLocaleStore } from '@/i18n/useT';
import { useRewardStore } from '@/store/useRewardStore';

const OPTIONS: Array<{ code: Locale; short: string; label: string }> = [
  { code: 'vi', short: 'VI', label: 'Tiếng Việt' },
  { code: 'en', short: 'EN', label: 'English' },
];

export function LanguageSwitch({ tone = 'light', compact = false }: { tone?: 'light' | 'dark'; compact?: boolean }) {
  const locale = useLocale();
  const setLocale = useLocaleStore((s) => s.setLocale);
  const chiikawa = useRewardStore((s) => s.theme === 'theme-chiikawa');
  const dark = tone === 'dark';
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel="Ngôn ngữ / Language"
      style={{ flexDirection: compact ? 'column' : 'row', alignSelf: compact ? 'center' : 'flex-start', borderRadius: compact ? 22 : 999, padding: 3, gap: 2, backgroundColor: dark ? 'rgba(255,255,255,0.1)' : chiikawa ? '#FBE8EF' : 'rgba(184,149,90,0.14)' }}
    >
      {OPTIONS.map((o) => {
        const on = locale === o.code;
        return (
          <Pressable
            key={o.code}
            accessibilityRole="radio"
            aria-checked={on}
            accessibilityLabel={o.label}
            onPress={() => setLocale(o.code)}
            style={{ borderRadius: 999, width: compact ? 40 : undefined, alignItems: 'center', paddingHorizontal: compact ? 0 : 12, paddingVertical: 5, backgroundColor: on ? chiikawa ? '#D65E86' : themedHex('#B8955A') : 'transparent' }}
          >
            <Text className="font-strong" style={{ fontSize: 12, letterSpacing: 0.6, color: on ? '#FFFFFF' : dark ? 'rgba(255,255,255,0.75)' : chiikawa ? '#704B5B' : '#6E6552' }}>
              {o.short}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
