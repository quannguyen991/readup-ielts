import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { chipSlice, type TypeInfo } from '@/services/questions/article-types';
import { shortLabel } from '@/services/questions/ielts-types';
import type { QuestionType } from '@/types/database';
import { useL } from '@/i18n/useL';

/**
 * Hàng chip "dạng bài" trên thẻ bài: tối đa 3 chip + "+n".
 *
 *   - chip đặc  : dạng đang được lọc và bài CÓ SẴN dạng đó;
 *   - chip nét đứt: dạng đang được lọc, bài chưa có nhưng TẠO ĐƯỢC — bấm để tạo;
 *   - chip thường: dạng có trong đề của bài.
 *
 * Cuối hàng luôn có nút "Tạo đề" gọn: một chạm mở hộp chọn bộ trộn.
 */
export function TypeChips({
  info,
  highlight = [],
  makeable = [],
  onMake,
  max = 3,
}: {
  info: TypeInfo;
  /** Dạng người học đang lọc. */
  highlight?: readonly QuestionType[];
  /** Dạng đang lọc mà bài chưa có nhưng tạo được. */
  makeable?: readonly QuestionType[];
  onMake?: (preselect?: QuestionType) => void;
  max?: number;
}) {
  const { L } = useL();

  // Dạng lọc xếp lên đầu để không bị "+n" nuốt mất.
  const order: QuestionType[] = [
    ...info.types.filter((t) => highlight.includes(t)),
    ...makeable,
    ...info.types.filter((t) => !highlight.includes(t)),
  ];
  const { shown, more } = chipSlice(order, max);

  if (info.source === 'none') return null;

  return (
    <View className="flex-row flex-wrap items-center gap-1.5" accessibilityLabel={L('Dạng bài', 'Question types')}>
      {shown.map((t) => {
        const isMake = makeable.includes(t);
        const hit = highlight.includes(t) && !isMake;
        const base = 'rounded-pill border px-2 py-0.5';
        if (isMake) {
          return (
            <Pressable
              key={t}
              onPress={() => onMake?.(t)}
              accessibilityRole="button"
              accessibilityLabel={L(`Tạo đề ${shortLabel(t)}`, `Create ${shortLabel(t)} questions`)}
              className={`${base} border-dashed border-primary-600 bg-primary-50`}
            >
              <Text className="font-semi text-primary-700" style={{ fontSize: 10.5 }}>
                + {shortLabel(t)}
              </Text>
            </Pressable>
          );
        }
        return (
          <View key={t} className={`${base} ${hit ? 'border-primary-600 bg-primary-600' : 'border-border bg-surfaceAlt'}`}>
            <Text className={`font-semi ${hit ? 'text-white' : 'text-muted'}`} style={{ fontSize: 10.5 }}>
              {shortLabel(t)}
            </Text>
          </View>
        );
      })}
      {more > 0 ? (
        <Text className="font-semi text-subtle" style={{ fontSize: 10.5 }}>
          +{more}
        </Text>
      ) : null}
      {onMake ? (
        <Pressable
          onPress={() => onMake()}
          accessibilityRole="button"
          accessibilityLabel={L('Tạo đề', 'Create questions')}
          className="rounded-pill border border-dashed border-border px-2 py-0.5"
          style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
        >
          <Text className="font-semi text-muted" style={{ fontSize: 10.5 }}>
            {info.source === 'saved' ? L('Đổi dạng', 'Change mix') : L('+ Tạo đề', '+ Create')}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
