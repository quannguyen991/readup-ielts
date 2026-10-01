import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Grid } from '@/components/layout/Grid';
import { Appear } from '@/components/motion/Motion';
import { Button } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { color } from '@/theme/tokens';
import { PageStickers, SealIcon } from '@/components/illust/HeroArt';
import { Label } from '@/components/illust/Sticker';
import { Badge as BadgeSticker } from '@/components/illust/Cute';
import { useL } from '@/i18n/useL';
import { DifficultyTag } from '@/components/ui/DifficultyTag';
import type { Difficulty } from '@/lib/difficulty';

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
  /** Bậc của bộ — bộ đề xếp từ dễ tới khó, nhãn nằm cạnh tên bộ. */
  difficulty?: Difficulty;
};

const SHADOW = { boxShadow: '0 1px 2px rgba(15,23,42,0.05), 0 8px 20px rgba(94, 72, 35,0.08)' } as object;

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
  const { L } = useL();
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
            <View className="flex-row items-center gap-3">
              <View className="min-w-0 flex-1">
                <Text className="font-strong text-label uppercase tracking-[1.2px] text-primary-600">{eyebrow}</Text>
                <Text className="mt-1 font-heavy text-pageTitle text-ink">{title}</Text>
                <Text className="mt-1 font-sans text-bodyLg text-muted">
                  {L(
                    `${total} bộ đề · ${questions} câu · đã làm ${done}/${total} bộ`,
                    `${total} sets · ${questions} questions · ${done}/${total} sets done`,
                  )}
                </Text>
              </View>
              <View aria-hidden>
                <PageStickers scene={backHref.startsWith('/math') ? 'math' : 'verbal'} size={80} />
              </View>
            </View>
            <View className="mt-4 h-2.5 overflow-hidden rounded-pill" style={{ backgroundColor: '#F8F2E8' }}>
              <View className="h-2.5 rounded-pill" style={{ width: `${total ? (done / total) * 100 : 0}%`, backgroundColor: '#16A34A' }} />
            </View>
            <Button
              className="mt-5 self-start"
              label={done === 0 ? L('Bắt đầu từ Bộ đề 1', 'Start with Set 1') : L(`Làm tiếp: Bộ đề ${nextIndex + 1}`, `Continue: Set ${nextIndex + 1}`)}
              onPress={() => onOpen(nextIndex)}
            />
          </View>
        </Appear>

        <View className="mb-3 mt-7 flex-row items-center gap-2.5">
          <View aria-hidden>
            <SealIcon name="grid" color="#A8843F" size={38} />
          </View>
          <Text className="min-w-0 flex-1 font-heavy text-sectionTitle text-ink">{L('Chọn bộ đề', 'Choose a set')}</Text>
          {done === total && total > 0 ? (
            <View aria-hidden>
              <Label text={L('Đã xong cả kho ✓', 'All sets done ✓')} color="#22A06B" ink="#FFFFFF" tilt={4} size={12} />
            </View>
          ) : null}
        </View>
        <Appear index={1}>
          <Grid columns={4} tabletColumns={3} mobileColumns={2} gap={14}>
            {sets.map((s, i) => {
              const isNext = i === nextIndex;
              const tone = s.ratio === null ? '#94A3B8' : s.ratio >= 0.8 ? '#16A34A' : s.ratio >= 0.5 ? '#D97706' : '#E11D48';
              return (
                <Pressable
                  key={i}
                  accessibilityRole="button"
                  accessibilityLabel={L(`Bộ đề ${i + 1}`, `Set ${i + 1}`)}
                  onPress={() => onOpen(i)}
                  className="rounded-2xl bg-white p-4"
                  style={[{ borderWidth: 2, borderColor: isNext ? color.primary : 'transparent' }, SHADOW]}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="min-w-0 flex-1 flex-row flex-wrap items-center gap-2">
                      <Text className="font-strong text-bodyLg text-ink">{L(`Bộ đề ${i + 1}`, `Set ${i + 1}`)}</Text>
                      {s.difficulty ? <DifficultyTag level={s.difficulty} /> : null}
                    </View>
                    {s.done ? (
                      s.ratio !== null && s.ratio >= 0.8 ? (
                        <View aria-hidden>
                          <BadgeSticker icon="star" color="#F2B632" size={24} />
                        </View>
                      ) : (
                        <Icon name="check" size={18} color={tone} strokeWidth={2.4} />
                      )
                    ) : null}
                  </View>
                  {isNext && !s.done ? (
                    <View aria-hidden style={{ position: 'absolute', top: -10, right: -6 }}>
                      <Label text={L('Làm tiếp →', 'Continue →')} color="#F2B632" tilt={6} size={11} />
                    </View>
                  ) : null}
                  <Text className="mt-1 font-sans text-label text-muted">
                    {L(`${s.size} câu · ~${s.size * minutesPerQuestion} phút`, `${s.size} questions · ~${s.size * minutesPerQuestion} min`)}
                  </Text>
                  <View className="mt-3 flex-row items-center justify-between">
                    {s.score ? (
                      <Text className="font-heavy text-bodyLg" style={{ color: tone }}>
                        {s.score}
                      </Text>
                    ) : (
                      <Text className="font-semi text-body" style={{ color: isNext ? color.primary : '#94A3B8' }}>
                        {isNext ? L('Làm tiếp', 'Continue') : L('Chưa làm', 'Not started')}
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
