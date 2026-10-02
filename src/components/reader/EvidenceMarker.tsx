import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/ui';
import type { EvidenceMark } from '@/services/proofloop/types';
import { color } from '@/theme/tokens';
import { useL } from '@/i18n/useL';

/**
 * Nút khoanh bằng chứng cho MỘT câu hỏi.
 *
 * VÌ SAO BẮT NGƯỜI HỌC KHOANH: đáp án đúng một mình không nói được gì. Hai học
 * sinh cùng chọn đúng, một người chỉ ra được câu đỡ đáp án còn một người chỉ vào
 * câu không liên quan — đó là hai tình huống khác hẳn nhau, và không hệ thống
 * nào phân biệt được nếu chỉ nhìn đáp án.
 *
 * Chỗ khoanh này chính là vế thứ hai của phép so ở `proofloop/state.ts`. Vế thứ
 * nhất — `evidenceParagraphIndex` — đã nằm sẵn trong mọi bộ đề từ trước.
 *
 * Dùng lại chế độ "Chọn cụm từ" đã có ở màn đọc chứ không dựng máy chọn chữ
 * riêng: `useTextSelection` chỉ chạy trên web, còn chạm hai đầu cụm thì chạy cả
 * trên điện thoại — mà điện thoại mới là chỗ phần lớn người học ngồi.
 */
export function EvidenceMarker({
  mark,
  active,
  onStart,
  onClear,
}: {
  mark: EvidenceMark | undefined;
  active: boolean;
  onStart: () => void;
  onClear: () => void;
}) {
  const { L } = useL();
  if (mark) {
    return (
      <View className="mt-3 rounded-panel border border-primary-600 bg-primary-50 px-3 py-2.5">
        <View className="flex-row items-center justify-between gap-2">
          <View className="flex-1 flex-row items-center gap-2">
            <Icon name="check" size={14} color={color.primary} />
            <Text className="font-mid text-label text-primary-600">
              {L(`Bằng chứng · đoạn ${mark.paragraphIndex + 1}`, `Evidence · paragraph ${mark.paragraphIndex + 1}`)}
            </Text>
          </View>
          <Pressable onPress={onClear} hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }} accessibilityLabel={L('Bỏ khoanh bằng chứng', 'Clear evidence mark')}>
            <Text className="font-mid text-label text-muted">{L('Chọn lại', 'Reselect')}</Text>
          </Pressable>
        </View>
        <Text className="mt-1.5 font-sans text-label text-ink" numberOfLines={3}>
          “{mark.phrase}”
        </Text>
      </View>
    );
  }

  return (
    <Pressable
      onPress={onStart}
      accessibilityLabel={L('Khoanh câu đỡ đáp án này', 'Mark the sentence that supports this answer')}
      className={[
        'mt-1 min-h-[36px] flex-row items-center gap-2 rounded-panel px-1',
        active ? 'border border-primary-600 bg-primary-50 px-3 py-2' : '',
      ].join(' ')}
    >
      <Icon name="letters" size={13} color={active ? color.primary : color.subtle} />
      <Text
        className={[
          'flex-1 font-mid text-label',
          active ? 'text-primary-600' : 'text-subtle',
        ].join(' ')}
      >
        {active
          ? L('Chạm từ đầu và từ cuối của câu đỡ đáp án…', 'Tap the first and last word of the supporting sentence…')
          : L('Khoanh câu trong bài đỡ đáp án này', 'Mark the sentence in the passage that supports this answer')}
      </Text>
    </Pressable>
  );
}
