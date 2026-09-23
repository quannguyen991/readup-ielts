import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Grid } from '@/components/layout/Grid';
import { Appear } from '@/components/motion/Motion';
import { Button } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { color } from '@/theme/tokens';

export type PickerSet = {
  /** Số câu của bộ. */
  size: number;
  /** Đã làm hết (hoặc ít nhất một lần) chưa. */
  done: boolean;
  /** Tỉ lệ đúng 0–1, null khi chưa làm câu nào. */
  ratio: number | null;
  /** Dòng điểm, ví dụ "8/10". */
  score?: string;
  /** Ghi chú góc phải, ví dụ "2 lần" hoặc "6/10 câu". */
  note?: string;
};

const SHADOW = { boxShadow: '0 1px 2px rgba(15,23,42,0.05), 0 8px 20px rgba(30,41,99,0.08)' } as object;

/**
 * Danh sách bộ đề của một kỹ năng — đích của nút "Luyện" ở SAT Math và SAT
 * Verbal. Người học thấy mình đang ở bộ nào trong kho, chọn làm tiếp hoặc làm
 * lại đúng một bộ cụ thể, thay vì bị ném thẳng vào "mười câu kế tiếp".
 */
export function SetPicker({
  backHref,
  backLabel,
  eyebrow,
  title,
  sets,
  nextIndex,
  minutesPerQuestion,
  onOpen,
  footnote,
}: {
  backHref: string;
  backLabel: string;
  eyebrow: string;
  title: string;
  sets: PickerSet[];
  nextIndex: number;
  minutesPerQuestion: number;
  onOpen: (index: number) => void;
  footnote: string;
}) {
  const total = sets.length;
  const done = sets.filter((s) => s.done).length;
  const questions = sets.reduce((n, s) => n + s.size, 0);
  return (
    <Screen>
      <View className="w-full self-center" style={{ maxWidth: 1040 }}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace(backHref as never)}
          className="flex-row items-center gap-2 self-start rounded-pill bg-white/85 px-4 py-2"
        >
          <Icon name="chevron-left" size={18} color={color.ink} />
          <Text className="font-semi text-body text-ink">{backLabel}</Text>
        </Pressable>

        <Appear index={0}>
          <View className="mt-5 rounded-[22px] bg-white p-6" style={SHADOW}>
            <Text className="font-strong text-label uppercase tracking-[1.2px] text-primary-600">{eyebrow}</Text>
            <Text className="mt-1 font-heavy text-pageTitle text-ink">{title}</Text>
            <Text className="mt-1 font-sans text-bodyLg text-muted">
              {total} bộ đề · {questions} câu · đã làm {done}/{total} bộ
            </Text>
            <View className="mt-4 h-2.5 overflow-hidden rounded-pill" style={{ backgroundColor: '#E8EEF8' }}>
              <View className="h-2.5 rounded-pill" style={{ width: `${total ? (done / total) * 100 : 0}%`, backgroundColor: '#16A34A' }} />
            </View>
            <Button
              className="mt-5 self-start"
              label={done === 0 ? 'Bắt đầu từ Bộ đề 1' : `Làm tiếp: Bộ đề ${nextIndex + 1}`}
              onPress={() => onOpen(nextIndex)}
            />
          </View>
        </Appear>

        <Text className="mb-3 mt-7 font-heavy text-sectionTitle text-ink">Chọn bộ đề</Text>
        <Appear index={1}>
          <Grid columns={4} tabletColumns={3} mobileColumns={2} gap={14}>
            {sets.map((s, i) => {
              const isNext = i === nextIndex;
              const tone = s.ratio === null ? '#94A3B8' : s.ratio >= 0.8 ? '#16A34A' : s.ratio >= 0.5 ? '#D97706' : '#E11D48';
              return (
                <Pressable
                  key={i}
                  accessibilityRole="button"
                  accessibilityLabel={`Bộ đề ${i + 1}`}
                  onPress={() => onOpen(i)}
                  className="rounded-2xl bg-white p-4"
                  style={[{ borderWidth: 2, borderColor: isNext ? color.primary : 'transparent' }, SHADOW]}
                >
                  <View className="flex-row items-center justify-between">
                    <Text className="font-strong text-bodyLg text-ink">Bộ đề {i + 1}</Text>
                    {s.done ? <Icon name="check" size={18} color={tone} strokeWidth={2.4} /> : null}
                  </View>
                  <Text className="mt-1 font-sans text-label text-muted">
                    {s.size} câu · ~{s.size * minutesPerQuestion} phút
                  </Text>
                  <View className="mt-3 flex-row items-center justify-between">
                    {s.score ? (
                      <Text className="font-heavy text-bodyLg" style={{ color: tone }}>
                        {s.score}
                      </Text>
                    ) : (
                      <Text className="font-semi text-body" style={{ color: isNext ? color.primary : '#94A3B8' }}>
                        {isNext ? 'Làm tiếp' : 'Chưa làm'}
                      </Text>
                    )}
                    {s.note ? <Text className="font-sans text-label text-muted">{s.note}</Text> : null}
                  </View>
                </Pressable>
              );
            })}
          </Grid>
        </Appear>
        <Text className="mt-4 font-sans text-label text-muted">{footnote}</Text>
      </View>
    </Screen>
  );
}
