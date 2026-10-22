import React from 'react';
import { Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/Icon';
import type { Bi, LessonKind } from '@/services/hub/presentation-course';

import { HUB } from './theme';

/** Màu và biểu tượng của từng loại bài. Nền nhạt, chữ đậm: đọc được trên nền kem. */
export const KIND_STYLE: Record<LessonKind, { bg: string; fg: string; icon: IconName }> = {
  LEARN: { bg: '#EDE9FE', fg: '#6D28D9', icon: 'book' },
  WATCH: { bg: '#E0F2FE', fg: '#0369A1', icon: 'play' },
  MAKEOVER: { bg: '#F3F0FB', fg: '#6A4BD9', icon: 'sparkle' },
  EYE: { bg: '#CCFBF1', fg: '#0F766E', icon: 'search' },
  QUIZ: { bg: '#F3F0FB', fg: '#6A4BD9', icon: 'target' },
  CAPSTONE: { bg: '#DCFCE7', fg: '#15803D', icon: 'trophy' },
};

/** Chọn chữ theo ngôn ngữ đang bật (dữ liệu khoá luôn có đủ vi và en). */
export function tr(b: Bi, en: boolean): string {
  return en ? b.en : b.vi;
}

export function KindBadge({ kind, compact = false }: { kind: LessonKind; compact?: boolean }) {
  const s = KIND_STYLE[kind];
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        alignSelf: 'flex-start',
        paddingHorizontal: compact ? 7 : 9,
        paddingVertical: compact ? 3 : 4,
        borderRadius: 999,
        backgroundColor: s.bg,
      }}
    >
      <Icon name={s.icon} size={compact ? 10 : 12} color={s.fg} strokeWidth={2.2} />
      <Text style={{ color: s.fg, fontSize: compact ? 10 : 11, fontWeight: '800', letterSpacing: 0.4 }}>{kind}</Text>
    </View>
  );
}

export function ProgressBar({ done, total, color = HUB.green }: { done: number; total: number; color?: string }) {
  const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
  return (
    <View style={{ height: 8, borderRadius: 4, backgroundColor: HUB.line, overflow: 'hidden' }}>
      <View style={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: 4 }} />
    </View>
  );
}
