import React from 'react';
import { Pressable, Text, View } from 'react-native';
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
  const { L, en } = useL();

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
            <View className="mt-4 flex-row gap-3 rounded-2xl p-4" style={{ backgroundColor: '#FCF9F4' }}>
              <Icon name="target" size={18} color={color.primary} />
              <Text className="min-w-0 flex-1 font-semi text-body text-ink">{lesson.goal}</Text>
            </View>
          </View>
        </Appear>

        {/* LUẬT CẦN NHỚ — mọi ý kiến thức trong MỘT khung, đọc một lượt là nắm cả bài. */}
        <Section
          icon="book"
          title={L('Luật cần nhớ', 'Rules to remember')}
          sub={L(
            `${rulesOf(lesson).length} ý — đọc hết một lượt trước khi sang ví dụ`,
            `${rulesOf(lesson).length} points — read them all once before the examples`,
          )}
        />
        <Appear index={1}>
          <View className="rounded-[22px] bg-white p-5 md:p-6" style={CARD}>
            {rulesOf(lesson).map((r, i) => (
              <View key={i} className={i > 0 ? 'mt-4 border-t pt-4' : ''} style={{ borderColor: '#F6F3EE' }}>
                <View className="flex-row items-start gap-3">
                  <View className="mt-1.5 h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: RULE_TONES[i % RULE_TONES.length] }} />
                  <View className="min-w-0 flex-1">
                    <Text className="font-heavy text-ink" style={{ fontSize: 17, lineHeight: 23 }}>
                      {r.title}
                    </Text>
                    <View className="mt-1">
                      <RichText math={!!math}>{r.body}</RichText>
                    </View>
                    {r.formula ? (
                      <View className="mt-2.5 self-start rounded-xl px-4 py-2.5" style={{ backgroundColor: '#FBF8F4' }}>
                        <RichText math={!!math} size={17} bold>
                          {r.formula}
                        </RichText>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>
            ))}
          </View>
        </Appear>

        {/* VÍ DỤ — tự chọn trước, rồi mới mở lời giải. */}
        {examplesOf(lesson).length > 0 ? (
          <>
            <Section
              icon="pencil"
              title={L('Thử với ví dụ', 'Try the examples')}
              sub={L('Tự trả lời trước, rồi mới mở lời giải từng bước', 'Answer first, then open the step-by-step solution')}
            />
            <View className="gap-3">
              {examplesOf(lesson).map((ex, i) => (
                <Appear key={i} index={i + 2}>
                  <ExampleCard block={ex} math={!!math} n={i + 1} total={examplesOf(lesson).length} />
                </Appear>
              ))}
            </View>
          </>
        ) : null}

        {/* BẪY + MẸO — tách riêng khỏi phần luật để không lẫn. */}
        {notesOf(lesson).length > 0 ? (
          <>
            <Section
              icon="info"
              title={L('Cẩn thận khi làm đề', 'Watch out on the test')}
              sub={L('Bẫy đề hay giăng và mẹo làm nhanh', 'Common traps and quick tips')}
            />
            <View className="flex-row flex-wrap gap-3">
              {notesOf(lesson).map((n, i) => (
                <NoteCard key={i} block={n} math={!!math} />
              ))}
            </View>
          </>
        ) : null}

        <Section
          icon="target"
          title={L('Tự kiểm tra', 'Check yourself')}
          sub={L('3 câu, chấm ngay — sai câu nào xem lại luật tương ứng ở trên', '3 questions, marked instantly — if you miss one, review its rule above')}
        />
        {check}

        <Section
          icon="trophy"
          title={L('Luyện bằng bộ đề', 'Practise with question sets')}
          sub={L('Đạt 8/10 ở một bộ là nắm được bài', 'Score 8/10 on a set and you’ve got it')}
        />
        <View className="rounded-[22px] bg-white p-6" style={CARD}>
          <Text className="font-sans text-bodyLg text-ink">
            {L(
              'Làm các bộ đề 10 câu của đúng kỹ năng này. Đạt từ 8/10 trở lên ở một bộ là bạn đã nắm được bài.',
              'Do the 10-question sets for this exact skill. Score 8/10 or higher on a set and you’ve mastered the lesson.',
            )}
          </Text>
          <View className="mt-4 flex-row flex-wrap gap-2">
            <Button label={L('Luyện bộ đề', 'Practise sets')} iconRight="arrow-right" onPress={() => router.push(practiceHref as never)} />
            {!done ? <Button variant="secondary" label={L('Đánh dấu đã học xong', 'Mark as completed')} iconLeft="check" onPress={onDone} /> : null}
            {next ? <Button variant="ghost" label={L(`Bài tiếp: ${next.title}`, `Next lesson: ${next.title}`)} onPress={() => router.push(next.href as never)} /> : null}
          </View>
        </View>
      </View>
    </Screen>
  );
}

const RULE_TONES = ['#B8955A', '#10B981', '#F59E0B', '#EC4899', '#D6B57C', '#B07A3A'];

type RuleBlock = Extract<LessonBlock, { kind: 'rule' }>;
type ExampleBlock = Extract<LessonBlock, { kind: 'example' }>;
type NoteBlock = Extract<LessonBlock, { kind: 'trap' | 'tip' }>;

const rulesOf = (l: TheoryLesson) => l.blocks.filter((x): x is RuleBlock => x.kind === 'rule');
const examplesOf = (l: TheoryLesson) => l.blocks.filter((x): x is ExampleBlock => x.kind === 'example');
const notesOf = (l: TheoryLesson) => l.blocks.filter((x): x is NoteBlock => x.kind === 'trap' || x.kind === 'tip');

/**
 * Tiêu đề một phần của bài. Bản cũ là ô số tròn "1 Học / 2 / 3" — người dùng
 * thấy bài lý thuyết khó hiểu, khó dùng (27/09/2026): luật rời từng thẻ, ví dụ
 * lộ sẵn đáp án, bẫy/mẹo lẫn giữa các luật. Giờ bài chia theo VIỆC người học
 * làm: đọc luật → tự thử ví dụ → xem bẫy → tự kiểm tra → luyện bộ đề.
 */
function Section({ icon, title, sub }: { icon: IconName; title: string; sub?: string }) {
  return (
    <View className="mb-3 mt-8 flex-row items-center gap-3">
      <View className="h-9 w-9 items-center justify-center rounded-xl bg-white" style={CARD}>
        <Icon name={icon} size={17} color={color.ink} />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="font-heavy text-sectionTitle text-ink">{title}</Text>
        {sub ? <Text className="font-sans text-label text-ink" style={{ opacity: 0.7 }}>{sub}</Text> : null}
      </View>
    </View>
  );
}

function ExampleCard({ block, math, n, total }: { block: ExampleBlock; math: boolean; n: number; total: number }) {
  const choices = choicesIn(block.problem);
  const [picked, setPicked] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState(false);
  const revealed = open || picked !== null;
  const correct = picked !== null && choices !== null && matchingChoice(choices, block.answer) === picked;
  const { L } = useL();

  return (
    <View className="rounded-[22px] bg-white p-5" style={CARD}>
      <Text className="font-semi text-label text-muted">
        {L('Ví dụ', 'Example')} {n}/{total}
      </Text>
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
