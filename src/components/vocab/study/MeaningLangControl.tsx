import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { useHydrated } from '@/components/layout/useHydrated';
import { useL } from '@/i18n/useL';
import type { MeaningLang } from '@/services/vocab/meaning-lang';
import { useTopicStudyStore } from '@/store/useTopicStudyStore';
import { color } from '@/theme/tokens';

export type MeaningLangTone = { ink: string; panel: string; border: string; accent: string; onAccent: string };

const LIGHT: MeaningLangTone = { ink: color.ink, panel: '#F3F0FB', border: '#E1D9CB', accent: color.primary, onAccent: '#FFFFFF' };

/**
 * Chọn NGHĨA HIỂN THỊ khi học từ: tiếng Việt hoặc tiếng Anh. Áp ngay cho mọi màn học (thẻ, trắc nghiệm, ghép cặp,
 * bóng bay, kiểm tra…). Với từ Nhật/Trung: Nhật/Trung ↔ Việt hoặc ↔ Anh. Với từ tiếng Anh: nghĩa Việt hoặc
 * định nghĩa tiếng Anh (học Anh–Anh). Chiều hỏi (từ → nghĩa hay nghĩa → từ) chọn ở "Chiều hỏi" của màn Học.
 */
export function MeaningLangControl({ tone = LIGHT }: { tone?: MeaningLangTone }) {
  const { L } = useL();
  const hydrated = useHydrated();
  const stored = useTopicStudyStore((s) => s.meaningLang);
  const set = useTopicStudyStore((s) => s.setMeaningLang);
  const value: MeaningLang = hydrated ? stored : 'vi';
  const opts: { key: MeaningLang; label: string }[] = [
    { key: 'vi', label: L('Tiếng Việt', 'Vietnamese') },
    { key: 'en', label: L('Tiếng Anh', 'English') },
  ];
  return (
    <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', alignSelf: 'flex-start', padding: 4, gap: 4, borderRadius: 999, backgroundColor: tone.panel, borderWidth: 1, borderColor: tone.border }}>
      {opts.map((o) => {
        const on = o.key === value;
        return (
          <Pressable
            key={o.key}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            onPress={() => set(o.key)}
            style={({ pressed }) => ({ minHeight: 36, paddingHorizontal: 18, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? tone.accent : 'transparent', opacity: pressed ? 0.85 : 1 })}
          >
            <Text className="font-strong text-body" style={{ color: on ? tone.onAccent : tone.ink }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
