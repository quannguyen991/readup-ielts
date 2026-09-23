import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { MathText } from '@/components/math/MathText';
import { Appear } from '@/components/motion/Motion';
import { Button } from '@/components/ui';
import { Icon, type IconName } from '@/components/ui/Icon';
import type { LessonBlock, TheoryLesson } from '@/data/lessons/types';
import { color } from '@/theme/tokens';

const CARD = { boxShadow: '0 1px 2px rgba(15,23,42,0.05), 0 12px 30px rgba(30,41,99,0.08)' } as object;

export const LEVEL_TONE: Record<TheoryLesson['level'], { fg: string; bg: string }> = {
  'Nền tảng': { fg: '#15803D', bg: '#DCFCE7' },
  'Trung bình': { fg: '#B45309', bg: '#FEF3C7' },
  'Nâng cao': { fg: '#BE123C', bg: '#FFE4E6' },
};

/**
 * Một bài lý thuyết: HỌC (các khối kiến thức) → LUYỆN (`check`, ba câu tự kiểm
 * tra do màn gọi truyền vào) → CHỨNG MINH (nút sang bộ đề của kỹ năng).
 *
 * `math` bật render công thức qua `MathText`; bài Verbal là chữ thường.
 */
export function LessonView({
  lesson,
  eyebrow,
  backHref,
  backLabel,
  math,
  check,
  done,
  onDone,
  practiceHref,
  next,
}: {
  lesson: TheoryLesson;
  eyebrow: string;
  backHref: string;
  backLabel: string;
  math?: boolean;
  check: React.ReactNode;
  done: boolean;
  onDone: () => void;
  practiceHref: string;
  next?: { title: string; href: string };
}) {
  const tone = LEVEL_TONE[lesson.level];

  return (
    <Screen>
      <View className="w-full self-center" style={{ maxWidth: 860 }}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace(backHref as never)}
          className="flex-row items-center gap-2 self-start rounded-pill bg-white/85 px-4 py-2"
        >
          <Icon name="chevron-left" size={18} color={color.ink} />
          <Text className="font-semi text-body text-ink">{backLabel}</Text>
        </Pressable>

        <Appear index={0}>
          <View className="mt-5 rounded-[22px] bg-white p-6" style={CARD}>
            <Text className="font-strong text-label uppercase tracking-[1.2px] text-primary-600">{eyebrow}</Text>
            <Text className="mt-1 font-heavy text-pageTitle text-ink">{lesson.title}</Text>
            <Text className="mt-0.5 font-sans text-body text-muted">{lesson.englishName}</Text>
            <View className="mt-3 flex-row flex-wrap items-center gap-2">
              <View className="rounded-pill px-3 py-1" style={{ backgroundColor: tone.bg }}>
                <Text className="font-strong text-label" style={{ color: tone.fg }}>
                  {lesson.level}
                </Text>
              </View>
              <View className="flex-row items-center gap-1 rounded-pill bg-slate-100 px-3 py-1">
                <Icon name="clock" size={13} color="#475569" />
                <Text className="font-semi text-label" style={{ color: '#475569' }}>
                  {lesson.minutes} phút
                </Text>
              </View>
              {done ? (
                <View className="flex-row items-center gap-1 rounded-pill px-3 py-1" style={{ backgroundColor: '#DCFCE7' }}>
                  <Icon name="check" size={13} color="#15803D" strokeWidth={2.4} />
                  <Text className="font-semi text-label" style={{ color: '#15803D' }}>
                    Đã học
                  </Text>
                </View>
              ) : null}
            </View>
            <View className="mt-4 flex-row gap-3 rounded-2xl p-4" style={{ backgroundColor: '#F1F6FF' }}>
              <Icon name="target" size={18} color={color.primary} />
              <Text className="min-w-0 flex-1 font-semi text-body text-ink">{lesson.goal}</Text>
            </View>
          </View>
        </Appear>

        <Step n={1} title="Học" />
        <View className="gap-3">
          {lesson.blocks.map((b, i) => (
            <Appear key={i} index={i + 1}>
              <Block block={b} math={!!math} />
            </Appear>
          ))}
        </View>

        <Step n={2} title="Tự kiểm tra — 3 câu" />
        {check}

        <Step n={3} title="Chứng minh bằng bộ đề" />
        <View className="rounded-[22px] bg-white p-6" style={CARD}>
          <Text className="font-sans text-bodyLg text-ink">
            Làm các bộ đề 10 câu của đúng kỹ năng này. Đạt từ 8/10 trở lên ở một bộ là bạn đã nắm được bài.
          </Text>
          <View className="mt-4 flex-row flex-wrap gap-2">
            <Button label="Luyện bộ đề" iconRight="arrow-right" onPress={() => router.push(practiceHref as never)} />
            {!done ? <Button variant="secondary" label="Đánh dấu đã học xong" iconLeft="check" onPress={onDone} /> : null}
            {next ? <Button variant="ghost" label={`Bài tiếp: ${next.title}`} onPress={() => router.push(next.href as never)} /> : null}
          </View>
        </View>
      </View>
    </Screen>
  );
}

function Step({ n, title }: { n: number; title: string }) {
  return (
    <View className="mb-3 mt-8 flex-row items-center gap-3">
      <View className="h-8 w-8 items-center justify-center rounded-pill" style={{ backgroundColor: color.primary }}>
        <Text className="font-heavy text-body text-white">{n}</Text>
      </View>
      <Text className="font-heavy text-sectionTitle text-ink">{title}</Text>
    </View>
  );
}

/** Chữ của bài: bài Math đi qua `MathText` để vẽ công thức, bài Verbal là chữ thường. */
function RichText({ math, children, size = 16, bold }: { math: boolean; children: string; size?: number; bold?: boolean }) {
  return math ? (
    <MathText size={size} weight={bold ? 'semibold' : 'regular'}>
      {children}
    </MathText>
  ) : (
    <Text className={bold ? 'font-semi text-ink' : 'font-sans text-ink'} style={{ fontSize: size, lineHeight: size * 1.5 }}>
      {children}
    </Text>
  );
}

function Block({ block, math }: { block: LessonBlock; math: boolean }) {
  if (block.kind === 'rule') {
    return (
      <View className="rounded-2xl bg-white p-5" style={CARD}>
        <Text className="font-strong text-cardTitle text-ink">{block.title}</Text>
        <View className="mt-1.5">
          <RichText math={math}>{block.body}</RichText>
        </View>
        {block.formula ? (
          <View className="mt-3 rounded-xl px-4 py-3" style={{ backgroundColor: '#F5F3FF', borderLeftWidth: 3, borderLeftColor: '#7C3AED' }}>
            <RichText math={math} size={17} bold>
              {block.formula}
            </RichText>
          </View>
        ) : null}
      </View>
    );
  }
  if (block.kind === 'example') {
    return (
      <View className="rounded-2xl bg-white p-5" style={CARD}>
        <Label icon="pencil" text="Ví dụ" tone={color.primary} />
        <View className="mt-2">
          <RichText math={math} bold>{block.problem}</RichText>
        </View>
        <View className="mt-3 gap-2">
          {block.steps.map((s, i) => (
            <View key={i} className="flex-row items-start gap-3">
              <View className="mt-0.5 h-6 w-6 items-center justify-center rounded-pill bg-primary-50">
                <Text className="font-strong text-label text-primary-700">{i + 1}</Text>
              </View>
              <View className="min-w-0 flex-1">
                <RichText math={math}>{s}</RichText>
              </View>
            </View>
          ))}
        </View>
        <View className="mt-3 flex-row flex-wrap items-center gap-2 rounded-xl px-4 py-2.5" style={{ backgroundColor: '#ECFDF3' }}>
          <Text className="font-strong text-body" style={{ color: '#15803D' }}>
            Đáp án:
          </Text>
          <View className="min-w-0 flex-1">
            <RichText math={math} bold>{block.answer}</RichText>
          </View>
        </View>
      </View>
    );
  }
  const trap = block.kind === 'trap';
  return (
    <View
      className="flex-row gap-3 rounded-2xl p-4"
      style={{ backgroundColor: trap ? '#FFF1F2' : '#FFFBEB', borderWidth: 1, borderColor: trap ? '#FECDD3' : '#FDE68A' }}
    >
      <Icon name={trap ? 'info' : 'sparkle'} size={18} color={trap ? '#BE123C' : '#B45309'} />
      <View className="min-w-0 flex-1">
        <Text className="font-strong text-body" style={{ color: trap ? '#BE123C' : '#B45309' }}>
          {trap ? 'Bẫy hay gặp' : 'Mẹo phòng thi'}
        </Text>
        <View className="mt-0.5">
          <RichText math={math}>{block.text}</RichText>
        </View>
      </View>
    </View>
  );
}

function Label({ icon, text, tone }: { icon: IconName; text: string; tone: string }) {
  return (
    <View className="flex-row items-center gap-1.5">
      <Icon name={icon} size={15} color={tone} />
      <Text className="font-strong text-label uppercase tracking-[1.1px]" style={{ color: tone }}>
        {text}
      </Text>
    </View>
  );
}
