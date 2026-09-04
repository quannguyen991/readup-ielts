import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/ui';
import type { EvidenceMark } from '@/services/proofloop/types';
import { color } from '@/theme/tokens';

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
  if (mark) {
    return (
      <View className="mt-3 rounded-panel border border-primary-600 bg-primary-50 px-3 py-2.5">
        <View className="flex-row items-center justify-between gap-2">
          <View className="flex-1 flex-row items-center gap-2">
            <Icon name="check" size={14} color={color.primary} />
            <Text className="font-mid text-label text-primary-600">
              Bằng chứng · đoạn {mark.paragraphIndex + 1}
            </Text>
          </View>
          <Pressable onPress={onClear} accessibilityLabel="Bỏ khoanh bằng chứng">
            <Text className="font-mid text-label text-muted">Chọn lại</Text>
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
      accessibilityLabel="Khoanh câu đỡ đáp án này"
      className={[
        'mt-3 flex-row items-center gap-2 rounded-panel border px-3 py-2.5',
        active ? 'border-primary-600 bg-primary-50' : 'border-dashed border-border bg-surface',
      ].join(' ')}
    >
      <Icon name="letters" size={14} color={active ? color.primary : color.muted} />
      <Text
        className={[
          'flex-1 font-mid text-label',
          active ? 'text-primary-600' : 'text-muted',
        ].join(' ')}
      >
        {active
          ? 'Chạm từ đầu và từ cuối của câu đỡ đáp án…'
          : 'Khoanh câu trong bài đỡ đáp án này'}
      </Text>
    </Pressable>
  );
}
