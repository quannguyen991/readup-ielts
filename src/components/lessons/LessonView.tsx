import { themedHex } from '@/theme/palette-state';
import React from 'react';
import { Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { MathText } from '@/components/math/MathText';
import { Appear } from '@/components/motion/Motion';
import { Button } from '@/components/ui';
import { Icon, type IconName } from '@/components/ui/Icon';
import type { LessonBlock, TheoryLesson } from '@/data/lessons/types';
import { choicesIn, matchingChoice } from './example-choice';
import { color } from '@/theme/tokens';
import { useL } from '@/i18n/useL';

const CARD = { boxShadow: '0 1px 2px rgba(15,23,42,0.05), 0 12px 30px rgba(94, 72, 35,0.08)' } as object;

export const LEVEL_TONE: Record<TheoryLesson['level'], { fg: string; bg: string }> = {
  'Nền tảng': { fg: '#15803D', bg: '#DCFCE7' },
  'Trung bình': { fg: '#B45309', bg: '#FEF3C7' },
  'Nâng cao': { fg: '#BE123C', bg: '#FFE4E6' },
};

/** Tên mức độ bằng tiếng Anh (khoá là mức tiếng Việt trong dữ liệu bài học). */
const LEVEL_EN: Record<TheoryLesson['level'], string> = {
  'Nền tảng': 'Foundation',
  'Trung bình': 'Intermediate',
  'Nâng cao': 'Advanced',
};

export function levelLabel(level: TheoryLesson['level'], en: boolean): string {
  return en ? LEVEL_EN[level] : level;
}

/**
 * Một bài lý thuyết, trình bày như phòng bài ngữ pháp: cột trái là mục lục các
 * bước và tiến độ, cột phải là nội dung bước hiện tại. Thứ tự bước: mục tiêu →
 * từng quy tắc → từng ví dụ (tự làm trước, lời giải mở sau) → bẫy & mẹo → bước
 * cuối là kiểm tra không gợi ý, nhớ nhanh, và luyện bộ đề.
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
  practiceLevels,
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
  practiceLevels?: { key: string; label: string; href: string }[];
  next?: { title: string; href: string };
}) {
  const tone = LEVEL_TONE[lesson.level];
  const { L, en } = useL();
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const [at, setAt] = React.useState(0);
  const isMath = !!math;

  const rules = rulesOf(lesson);
  const examples = examplesOf(lesson);
  const notes = notesOf(lesson);
  const steps: LessonStep[] = [
    {
      label: L('Mục tiêu', 'Goal'),
      title: L('Học xong làm được gì', 'What you will be able to do'),
      content: (
        <>
          <Text className="font-semi text-ink" style={{ fontSize: 18, lineHeight: 26 }}>{lesson.goal}</Text>
          {lesson.prerequisite ? (
            <Text className="mt-3 font-sans text-body text-muted">{L('Ôn trước: ', 'Review first: ')}{lesson.prerequisite}</Text>
          ) : null}
          {lesson.recognize ? (
            <View className="mt-4 flex-row items-start gap-3 rounded-2xl p-4" style={{ backgroundColor: '#FCF9F4' }}>
              <Icon name="search" size={18} color={color.primary} />
              <View className="min-w-0 flex-1">
                <Text className="font-heavy text-body text-ink">{L('Nhận diện dạng bài', 'Recognize the question')}</Text>
                <Text className="mt-1 font-sans text-body text-muted">{lesson.recognize}</Text>
              </View>
            </View>
          ) : null}
        </>
      ),
    },
    ...rules.map((r, i) => ({
      label: L(`Quy tắc ${i + 1}`, `Rule ${i + 1}`),
      title: r.title,
      content: (
        <>
          <RichText math={isMath} size={17}>{r.body}</RichText>
          {r.formula ? (
            <View className="mt-4 self-start rounded-xl px-4 py-3" style={{ backgroundColor: '#F8F6F1' }}>
              <RichText math={isMath} size={18} bold>{r.formula}</RichText>
            </View>
          ) : null}
        </>
      ),
    })),
    ...examples.map((ex, i) => ({
      label: L(`Ví dụ ${i + 1}`, `Example ${i + 1}`),
      title: L('Tự làm trước, rồi mới xem lời giải', 'Try it first, then see the solution'),
      content: <ExampleCard block={ex} math={isMath} n={i + 1} total={examples.length} />,
    })),
    ...(notes.length
      ? [
          {
            label: L('Bẫy & mẹo', 'Traps & tips'),
            title: L('Chỗ hay mất điểm', 'Where points are lost'),
            content: (
              <View className="gap-3">
                {notes.map((n, i) => (
                  <NoteCard key={i} block={n} math={isMath} />
                ))}
              </View>
            ),
          },
        ]
      : []),
    {
      label: L('Kiểm tra cuối', 'Final check'),
      title: L('Tự kiểm tra, rồi luyện bộ đề', 'Check yourself, then practise'),
      content: (
        <>
          {check}
          {lesson.summary ? (
            <View className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <View className="flex-row items-center gap-2">
                <Icon name="check" size={17} color="#15803D" strokeWidth={2.4} />
                <Text className="font-heavy text-body text-ink">{L('Nhớ nhanh', 'Remember')}</Text>
              </View>
              <Text className="mt-2 font-sans text-body text-ink">{lesson.summary}</Text>
            </View>
          ) : null}
          <View className="mt-5 gap-3">
            {practiceLevels?.length ? (
              <View className="flex-row flex-wrap gap-2">
                {practiceLevels.map((level) => (
                  <Button key={level.key} size="sm" variant="outline" label={level.label} onPress={() => router.push(level.href as never)} />
                ))}
              </View>
            ) : null}
            <View className="flex-row flex-wrap gap-2">
              <Button label={L('Luyện bộ đề', 'Practise sets')} iconRight="arrow-right" onPress={() => router.push(practiceHref as never)} />
              {!done ? <Button variant="secondary" label={L('Đánh dấu đã học xong', 'Mark as completed')} iconLeft="check" onPress={onDone} /> : null}
              {next ? <Button variant="ghost" label={L(`Bài tiếp: ${next.title}`, `Next lesson: ${next.title}`)} onPress={() => router.push(next.href as never)} /> : null}
            </View>
          </View>
        </>
      ),
    },
  ];

  const last = steps.length - 1;
  const idx = Math.min(at, last);
  const current = steps[idx]!;
  const pct = Math.round((idx / last) * 100);

  const toc = (
    <View className="gap-1">
      {steps.map((s, i) => {
        const active = i === idx;
        const passed = i < idx;
        return (
          <Pressable
            key={i}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => setAt(i)}
            className="flex-row items-center gap-2.5 rounded-xl px-3 py-2.5"
            style={{ backgroundColor: active ? '#FFFFFF' : 'transparent', borderWidth: active ? 1.5 : 0, borderColor: color.primary }}
          >
            <View
              className="h-5 w-5 items-center justify-center rounded-pill"
              style={{ borderWidth: 2, borderColor: passed || active ? color.primary : '#CBBFAE', backgroundColor: passed ? color.primary : 'transparent' }}
            >
              {passed ? <Icon name="check" size={11} color="#FFFFFF" strokeWidth={3} /> : null}
            </View>
            <Text className={active ? 'font-heavy text-ink' : 'font-semi text-muted'} style={{ fontSize: 14, flexShrink: 1 }}>
              {s.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

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
          <View className="mt-5 rounded-[22px] bg-white p-5" style={CARD}>
            <Text className="font-strong text-label uppercase tracking-[1.2px] text-primary-600">{eyebrow}</Text>
            <Text className="mt-1 font-heavy text-pageTitle text-ink">{en ? lesson.englishName : lesson.title}</Text>
            <Text className="mt-0.5 font-sans text-body text-muted">{en ? lesson.title : lesson.englishName}</Text>
            <View className="mt-3 flex-row flex-wrap items-center gap-2">
              <View className="rounded-pill px-3 py-1" style={{ backgroundColor: tone.bg }}>
                <Text className="font-strong text-label" style={{ color: tone.fg }}>
                  {levelLabel(lesson.level, en)}
                </Text>
              </View>
              <View className="flex-row items-center gap-1 rounded-pill bg-slate-100 px-3 py-1">
                <Icon name="clock" size={13} color="#475569" />
                <Text className="font-semi text-label" style={{ color: '#475569' }}>
                  {lesson.minutes} {L('phút', 'min')}
                </Text>
              </View>
              {done ? (
                <View className="flex-row items-center gap-1 rounded-pill px-3 py-1" style={{ backgroundColor: '#DCFCE7' }}>
                  <Icon name="check" size={13} color="#15803D" strokeWidth={2.4} />
                  <Text className="font-semi text-label" style={{ color: '#15803D' }}>
                    {L('Đã học', 'Completed')}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </Appear>

        {/* Tiến độ: một thanh chạy suốt chiều rộng, luôn cho biết đang ở đâu. */}
        <View className="mt-4 rounded-[22px] bg-white px-5 py-4" style={CARD}>
          <View className="flex-row items-center justify-between gap-3">
            <Text className="font-strong text-label text-muted">
              {L(`Bước ${idx + 1} trên ${steps.length}`, `Step ${idx + 1} of ${steps.length}`)}
            </Text>
            <Text className="font-heavy text-label" style={{ color: color.primary }}>{pct}%</Text>
          </View>
          <View className="mt-2.5 h-2 overflow-hidden rounded-pill" style={{ backgroundColor: '#F1EBDF' }}>
            <View style={{ width: `${pct}%`, height: 8, borderRadius: 999, backgroundColor: color.primary }} />
          </View>
        </View>

        <View className="mt-4" style={{ flexDirection: wide ? 'row' : 'column', gap: 16, alignItems: 'flex-start' }}>
          {/* Cột trái: mục lục các bước */}
          <View className="rounded-[22px] bg-white p-3" style={{ width: wide ? 260 : '100%', ...CARD }}>
            {wide ? toc : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 4, paddingVertical: 4 }}>
                {steps.map((s, i) => (
                  <Pressable
                    key={i}
                    accessibilityRole="button"
                    onPress={() => setAt(i)}
                    className="rounded-pill px-4 py-2.5"
                    style={{ backgroundColor: i === idx ? color.primary : i < idx ? '#F4EFE6' : '#FFFFFF', borderWidth: 1, borderColor: i === idx ? color.primary : '#E8E0D2' }}
                  >
                    <Text className="font-semi text-label" style={{ color: i === idx ? '#FFFFFF' : color.ink }}>
                      {i < idx ? '✓ ' : ''}{s.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Cột phải: nội dung bước hiện tại */}
          <View className="min-w-0" style={{ flex: 1, width: wide ? undefined : '100%' }}>
            <Appear key={idx} index={0}>
              <View className="rounded-[22px] bg-white p-6 md:p-8" style={CARD}>
                <View className="self-start rounded-pill px-3 py-1" style={{ backgroundColor: color.primary + '1F' }}>
                  <Text className="font-strong text-label uppercase tracking-[1px]" style={{ color: color.primary }}>{current.label}</Text>
                </View>
                <Text className="mt-3 font-heavy text-ink" style={{ fontSize: 28, lineHeight: 36 }}>{current.title}</Text>
                <View className="mt-5 border-t pt-5" style={{ borderColor: '#F1EBDF' }}>{current.content}</View>
              </View>
            </Appear>

            {/* Thanh điều hướng: bước trước bên trái, bước kế bên phải. */}
            <View className="mt-4 flex-row items-center justify-between gap-3 rounded-[22px] bg-white px-4 py-3" style={CARD}>
              <Button variant="outline" label={L('Bước trước', 'Previous')} disabled={idx === 0} onPress={() => setAt(Math.max(0, idx - 1))} />
              {idx < last ? (
                <View className="min-w-0 flex-shrink flex-row items-center gap-3">
                  {wide ? (
                    <Text className="font-sans text-label text-muted" numberOfLines={1} style={{ flexShrink: 1 }}>
                      {L('Tiếp theo: ', 'Next: ')}{steps[idx + 1]!.label}
                    </Text>
                  ) : null}
                  <Button label={L('Tiếp tục', 'Continue')} iconRight="arrow-right" onPress={() => setAt(Math.min(last, idx + 1))} />
                </View>
              ) : (
                <Text className="font-strong text-body" style={{ color: '#15803D' }}>{L('Bạn đã đi hết bài', "You've reached the end")}</Text>
              )}
            </View>
          </View>
        </View>
      </View>
    </Screen>
  );
}

type LessonStep = { label: string; title: string; content: React.ReactNode };

const RULE_TONES = [themedHex('#B8955A'), '#10B981', '#F59E0B', '#EC4899', '#D6B57C', '#B07A3A'];


type RuleBlock = Extract<LessonBlock, { kind: 'rule' }>;
type ExampleBlock = Extract<LessonBlock, { kind: 'example' }>;
type NoteBlock = Extract<LessonBlock, { kind: 'trap' | 'tip' }>;

const rulesOf = (l: TheoryLesson) => l.blocks.filter((x): x is RuleBlock => x.kind === 'rule');
const examplesOf = (l: TheoryLesson) => l.blocks.filter((x): x is ExampleBlock => x.kind === 'example');
const notesOf = (l: TheoryLesson) => l.blocks.filter((x): x is NoteBlock => x.kind === 'trap' || x.kind === 'tip');

function ExampleCard({ block, math, n, total }: { block: ExampleBlock; math: boolean; n: number; total: number }) {
  const choices = choicesIn(block.problem);
  const [picked, setPicked] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState(false);
  const revealed = open || picked !== null;
  const correct = picked !== null && choices !== null && matchingChoice(choices, block.answer) === picked;
  const { L } = useL();

  return (
    <View className="rounded-[22px] bg-white p-4 md:p-5" style={CARD}>
      <Text className="font-semi text-label text-muted">{n} / {total}</Text>
      <View className="mt-1.5">
        <RichText math={math} bold size={17}>
          {block.problem}
        </RichText>
      </View>

      {choices && !revealed ? (
        <View className="mt-4 flex-row flex-wrap gap-2">
          {choices.map((c) => (
            <Pressable
              key={c}
              accessibilityRole="button"
              onPress={() => setPicked(c)}
              className="rounded-xl px-5 py-2.5"
              style={{ borderWidth: 1.5, borderColor: '#EEE7DC', backgroundColor: '#FFFFFF' }}
            >
              <Text className="font-strong text-body text-ink">{c}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {!revealed ? (
        <Pressable accessibilityRole="button" onPress={() => setOpen(true)} className="mt-3 self-start">
          <Text className="font-semi text-label" style={{ color: color.primary }}>
            {choices ? L('Chưa chắc? Xem luôn lời giải', 'Not sure? See the solution') : L('Tự nghĩ xong rồi bấm để xem lời giải', 'Think it through, then tap to see the solution')} →
          </Text>
        </Pressable>
      ) : (
        <Appear>
          {picked !== null ? (
            <View className="mt-4 flex-row items-center gap-2 rounded-xl px-4 py-2.5" style={{ backgroundColor: correct ? '#ECFDF3' : '#FFF1F2' }}>
              <Icon name={correct ? 'check' : 'close'} size={16} color={correct ? '#15803D' : '#BE123C'} strokeWidth={2.4} />
              <Text className="font-strong text-body" style={{ color: correct ? '#15803D' : '#BE123C' }}>
                {correct ? L(`Đúng — "${picked}"`, `Correct — "${picked}"`) : L(`Chưa đúng — bạn chọn "${picked}"`, `Not quite — you chose "${picked}"`)}
              </Text>
            </View>
          ) : null}
          <View className="mt-4 gap-0">
            {block.steps.map((st, i) => (
              <View key={i} className="flex-row gap-3">
                <View className="items-center" style={{ width: 14 }}>
                  <View className="mt-1.5 h-2.5 w-2.5 rounded-pill" style={{ backgroundColor: color.primary }} />
                  {i < block.steps.length - 1 ? <View style={{ width: 2, flex: 1, backgroundColor: '#F8EFDF', marginTop: 2 }} /> : null}
                </View>
                <View className="min-w-0 flex-1 pb-3">
                  <RichText math={math}>{st}</RichText>
                </View>
              </View>
            ))}
          </View>
          <View className="mt-1 flex-row flex-wrap items-center gap-2 rounded-xl px-4 py-2.5" style={{ backgroundColor: '#FBF8F4' }}>
            <Text className="font-strong text-body text-ink">{L('Đáp án:', 'Answer:')}</Text>
            <View className="min-w-0 flex-1">
              <RichText math={math} bold>
                {block.answer}
              </RichText>
            </View>
          </View>
        </Appear>
      )}
    </View>
  );
}

function NoteCard({ block, math }: { block: NoteBlock; math: boolean }) {
  const trap = block.kind === 'trap';
  const { L } = useL();
  return (
    <View className="flex-row gap-3 rounded-2xl p-4" style={{ flexGrow: 1, flexBasis: 300, backgroundColor: trap ? '#FFF1F2' : '#FFFBEB' }}>
      <Icon name={trap ? 'info' : 'sparkle'} size={18} color={trap ? '#BE123C' : '#B45309'} />
      <View className="min-w-0 flex-1">
        <Text className="font-strong text-body" style={{ color: trap ? '#BE123C' : '#B45309' }}>
          {trap ? L('Bẫy hay gặp', 'Common trap') : L('Mẹo phòng thi', 'Exam tip')}
        </Text>
        <View className="mt-0.5">
          <RichText math={math}>{block.text}</RichText>
        </View>
      </View>
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
