import React from 'react';
import { Text, View } from 'react-native';

import { Icon } from '@/components/ui';
import { STATE_LABEL, type LearnState } from '@/services/sentence/learn-status';
import { useL } from '@/i18n/useL';

/**
 * NHÃN DÁN trạng thái học: "Chưa học" / "Đang học" / "Đã học".
 *
 * Màu và biểu tượng đi cùng chữ (không dựa riêng vào màu) để người mù màu vẫn đọc
 * được. Con số "x/y" lấy từ lịch sử làm bài thật — xem `learn-status.ts`.
 */
const STYLE: Record<LearnState, { bg: string; ink: string; border: string }> = {
  new: { bg: '#F1F5F9', ink: '#475569', border: '#CBD5E1' },
  learning: { bg: '#FEF3C7', ink: '#92400E', border: '#F5C451' },
  learned: { bg: '#DCFCE7', ink: '#15803D', border: '#86D9A3' },
};

export function LearnSticker({
  state,
  learned,
  total,
  size = 'md',
}: {
  state: LearnState;
  learned?: number;
  total?: number;
  size?: 'sm' | 'md';
}) {
  const { L, en } = useL();
  const st = STYLE[state];
  const label = en ? STATE_LABEL[state].en : STATE_LABEL[state].vi;
  const showCount = state === 'learning' && total !== undefined && learned !== undefined;
  const fs = size === 'sm' ? 11 : 12.5;
  return (
    <View
      accessibilityLabel={`${label}${showCount ? ` ${learned}/${total}` : ''}`}
      className="flex-row items-center gap-1 self-start rounded-pill"
      style={{
        backgroundColor: st.bg,
        borderWidth: 1.5,
        borderColor: st.border,
        paddingHorizontal: size === 'sm' ? 7 : 9,
        paddingVertical: size === 'sm' ? 2 : 3,
      }}
    >
      <Icon name={state === 'learned' ? 'check' : state === 'learning' ? 'pencil' : 'lock'} size={size === 'sm' ? 11 : 13} color={st.ink} strokeWidth={2.6} />
      <Text className="font-nun-heavy" style={{ fontSize: fs, color: st.ink }}>
        {label}
      </Text>
      {showCount ? (
        <Text className="font-nun-strong" style={{ fontSize: fs, color: st.ink, opacity: 0.85 }}>
          {learned}/{total}
          {L(' câu', '')}
        </Text>
      ) : null}
    </View>
  );
}
