import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { useStudyTheme } from '@/components/vocab/study/useStudyTheme';
import { Icon } from '@/components/ui/Icon';
import { useL } from '@/i18n/useL';
import { pronounce } from '@/services/audio/pronounce';
import type { PronounceTip } from '@/services/vocab/pronounce-tip';

/**
 * Nhận xét của AI cho một lượt đọc sai: âm nào lệch, cách sửa, và vài từ gần giống để so.
 * Ghi rõ là AI, vì máy nhận giọng có thể nghe nhầm; người học luôn đối chiếu với mẫu.
 */
export function PronounceTipCard({ tip }: { tip: PronounceTip }) {
  const { L, en } = useL();
  const t = useStudyTheme();
  return (
    <View
      className="mt-4 gap-2 rounded-xl px-4 py-3"
      style={{ backgroundColor: t.soft, borderLeftWidth: 3, borderLeftColor: t.accent }}
    >
      <Text className="font-strong text-label" style={{ color: t.accent }}>
        {L('Nhận xét của AI', 'AI tip')}
      </Text>
      <Text className="font-sans text-body" style={{ color: t.ink }}>
        {en ? tip.issueEn : tip.issueVi}
      </Text>
      <Text className="font-sans text-body" style={{ color: t.ink }}>
        {en ? tip.fixEn : tip.fixVi}
      </Text>
      {tip.contrast.length > 0 ? (
        <View className="mt-1 flex-row flex-wrap items-center gap-2">
          <Text className="font-sans text-label" style={{ color: t.muted }}>
            {L('So sánh', 'Compare')}
          </Text>
          {tip.contrast.map((w) => (
            <Pressable
              key={w}
              accessibilityRole="button"
              accessibilityLabel={`${L('Nghe', 'Hear')} ${w}`}
              onPress={() => void pronounce(w)}
              className="flex-row items-center gap-1.5 rounded-pill px-3 py-1"
              style={{ backgroundColor: t.chipBg }}
            >
              <Icon name="volume" size={13} color={t.chipInk} />
              <Text className="font-semi text-label" style={{ color: t.chipInk }}>
                {w}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      <Text className="mt-1 font-sans text-label" style={{ color: t.muted }}>
        {L('AI có thể nghe nhầm. Hãy so với mẫu, đừng chỉ tin nhận xét này.', 'The AI can mishear. Check against the model, not just this tip.')}
      </Text>
    </View>
  );
}
