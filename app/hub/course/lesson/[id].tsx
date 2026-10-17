import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { KIND_STYLE, KindBadge, tr } from '@/components/hub/CoursePieces';
import { HubScreen } from '@/components/hub/HubScreen';
import { GLASS_CARD, HUB, SOFT_FILL, SOFT_LINE } from '@/components/hub/theme';
import { Icon } from '@/components/ui/Icon';
import { useL } from '@/i18n/useL';
import {
  PASS_SCORE,
  findLesson,
  gradeQuiz,
  lessonState,
  levelUnlocked,
  nextLesson,
  type Choice,
  type Course,
  type CourseLevel,
  type DoneMap,
  type EyeLesson,
  type LearnLesson,
  type Lesson,
  type MakeoverLesson,
  type CapstoneLesson,
  type QuizLesson,
  type Slide,
  type WatchLesson,
} from '@/services/hub/presentation-course';
import { useFresh } from '@/store/useFresh';
import { useCourseStore } from '@/store/useCourseStore';

type BodyProps<T extends Lesson> = {
  lesson: T;
  finished: boolean;
  onComplete: (score?: number) => void;
  en: boolean;
};

/** Một bài của khoá. Bài khoá hoặc cấp chưa mở thì hiện lý do thay vì nội dung. */
export default function LessonScreen() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const { L, en } = useL();
  const done = useFresh(useCourseStore, (s) => s.done);
  const markDone = useCourseStore((s) => s.markDone);
  const found = findLesson(String(id));

  if (!found) {
    return (
      <HubScreen title={L('Bài học', 'Lesson')} back>
        <Panel>
          <Text style={{ color: HUB.ink, fontSize: 16, fontWeight: '800' }}>{L('Không tìm thấy bài này', 'This lesson could not be found')}</Text>
          <Text style={{ color: HUB.body, fontSize: 13, lineHeight: 19 }}>
            {L('Quay lại Khám phá để mở lại khoá học.', 'Go back to Explore to open the course again.')}
          </Text>
        </Panel>
      </HubScreen>
    );
  }

  const { course, lesson } = found;
  const state = lessonState(course, lesson, done);
  const finished = state === 'done';
  const next = nextLesson(course, lesson);

  return (
    <HubScreen
      title={tr(lesson.title, en)}
      subtitle={`${tr(course.title, en)} · ${tr(course.levels[lesson.level].title, en)}`}
      back
      padBottom={140}
    >
      <View style={{ gap: 10 }}>
        <KindBadge kind={lesson.kind} />
        <Text style={{ color: HUB.body, fontSize: 14, lineHeight: 21 }}>{tr(lesson.desc, en)}</Text>
      </View>

      {state === 'locked' ? (
        <LockedNotice course={course} lesson={lesson} done={done} />
      ) : (
        <Body lesson={lesson} finished={finished} onComplete={(score) => markDone(lesson.id, score)} en={en} />
      )}

      {finished ? <NextStep course={course} lesson={lesson} next={next} done={done} /> : null}
    </HubScreen>
  );
}

function Body({ lesson, finished, onComplete, en }: BodyProps<Lesson>) {
  // `key` theo id bài: đổi bài thì trạng thái chọn đáp án được làm lại từ đầu.
  switch (lesson.kind) {
    case 'LEARN':
      return <LearnBody key={lesson.id} lesson={lesson} finished={finished} onComplete={onComplete} en={en} />;
    case 'WATCH':
      return <WatchBody key={lesson.id} lesson={lesson} finished={finished} onComplete={onComplete} en={en} />;
    case 'MAKEOVER':
      return <MakeoverBody key={lesson.id} lesson={lesson} finished={finished} onComplete={onComplete} en={en} />;
    case 'EYE':
      return <EyeBody key={lesson.id} lesson={lesson} finished={finished} onComplete={onComplete} en={en} />;
    case 'QUIZ':
      return <QuizBody key={lesson.id} lesson={lesson} finished={finished} onComplete={onComplete} en={en} />;
    case 'CAPSTONE':
      return <CapstoneBody key={lesson.id} lesson={lesson} finished={finished} onComplete={onComplete} en={en} />;
  }
}

function LearnBody({ lesson, finished, onComplete, en }: BodyProps<LearnLesson>) {
  const { L } = useL();
  return (
    <View style={{ gap: 12 }}>
      <Panel>
        {lesson.points.map((p, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: KIND_STYLE.LEARN.bg,
              }}
            >
              <Text style={{ color: KIND_STYLE.LEARN.fg, fontSize: 12, fontWeight: '800' }}>{i + 1}</Text>
            </View>
            <Text style={{ flex: 1, color: HUB.body, fontSize: 14, lineHeight: 21 }}>{tr(p, en)}</Text>
          </View>
        ))}
      </Panel>
      <Panel>
        <Label text={L('Ví dụ', 'Example')} />
        <Text style={{ color: HUB.ink, fontSize: 15, lineHeight: 22, fontWeight: '600' }}>{tr(lesson.example, en)}</Text>
      </Panel>
      {finished ? <DoneTag /> : <ActionButton label={L('Đã hiểu, đánh dấu xong', 'Got it, mark as done')} onPress={() => onComplete()} />}
    </View>
  );
}

function WatchBody({ lesson, finished, onComplete, en }: BodyProps<WatchLesson>) {
  const { L } = useL();
  return (
    <View style={{ gap: 12 }}>
      <Panel>
        <Label text={L('Tình huống', 'Scene')} />
        <Text style={{ color: HUB.body, fontSize: 14, lineHeight: 21 }}>{tr(lesson.scene, en)}</Text>
      </Panel>
      <ChoiceBlock choice={lesson.choice} en={en} finished={finished} onRight={() => onComplete()} />
    </View>
  );
}

function MakeoverBody({ lesson, finished, onComplete, en }: BodyProps<MakeoverLesson>) {
  const { L } = useL();
  const [revealed, setRevealed] = useState(finished);
  return (
    <View style={{ gap: 12 }}>
      <SlideCard label={L('Trước', 'Before')} slide={lesson.before} en={en} />
      <ChoiceBlock
        choice={lesson.choice}
        en={en}
        finished={finished}
        onRight={() => {
          setRevealed(true);
          onComplete();
        }}
      />
      {revealed ? <SlideCard label={L('Sau', 'After')} slide={lesson.after} en={en} after /> : null}
    </View>
  );
}

function EyeBody({ lesson, finished, onComplete, en }: BodyProps<EyeLesson>) {
  const { L } = useL();
  return (
    <View style={{ gap: 12 }}>
      <SlideCard label={L('Slide A', 'Slide A')} slide={lesson.a} en={en} />
      <SlideCard label={L('Slide B', 'Slide B')} slide={lesson.b} en={en} />
      <ChoiceBlock choice={lesson.choice} en={en} finished={finished} onRight={() => onComplete()} />
    </View>
  );
}

function QuizBody({ lesson, finished, onComplete, en }: BodyProps<QuizLesson>) {
  const { L } = useL();
  const best = useFresh(useCourseStore, (s) => s.done[lesson.id]?.score);
  const [picks, setPicks] = useState<(number | null)[]>(() => lesson.questions.map(() => null));
  const [result, setResult] = useState<ReturnType<typeof gradeQuiz> | null>(null);
  const allAnswered = picks.every((p) => p !== null);

  const submit = () => {
    const r = gradeQuiz(lesson.questions, picks);
    setResult(r);
    onComplete(r.score);
  };
  const retry = () => {
    setPicks(lesson.questions.map(() => null));
    setResult(null);
  };

  return (
    <View style={{ gap: 12 }}>
      {lesson.questions.map((q, qi) => (
        <Panel key={qi}>
          <Text style={{ color: HUB.ink, fontSize: 15, fontWeight: '800', lineHeight: 22 }}>
            {qi + 1}. {tr(q.q, en)}
          </Text>
          <View style={{ gap: 8 }}>
            {q.options.map((o, oi) => {
              const picked = picks[qi] === oi;
              let tone: OptionTone = 'idle';
              if (result) {
                if (oi === q.answer) tone = 'right';
                else if (picked) tone = 'wrong';
              } else if (picked) {
                tone = 'selected';
              }
              return (
                <OptionButton
                  key={oi}
                  label={tr(o, en)}
                  tone={tone}
                  disabled={result !== null}
                  onPress={() => setPicks((p) => p.map((v, j) => (j === qi ? oi : v)))}
                />
              );
            })}
          </View>
          {result && picks[qi] !== q.answer ? <Feedback tone="warn" text={tr(q.why, en)} /> : null}
        </Panel>
      ))}

      {result ? (
        <Panel>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: result.passed ? HUB.green : HUB.orange, fontSize: 18, fontWeight: '800' }}>
              {result.passed ? L('Đạt rồi!', 'Passed!') : L('Chưa đạt', 'Not yet')}
            </Text>
            <Text style={{ color: HUB.ink, fontSize: 16, fontWeight: '800' }}>{result.score}%</Text>
          </View>
          <Text style={{ color: HUB.body, fontSize: 13, lineHeight: 19 }}>
            {L(`Đúng ${result.correct}/${result.total} câu.`, `${result.correct}/${result.total} correct.`)}{' '}
            {result.passed
              ? L('Cấp sau đã mở, bạn có thể tiếp tục.', 'The next level is open; you can carry on.')
              : L(`Cần ít nhất ${PASS_SCORE}% để mở cấp sau. Làm lại nhé.`, `You need ${PASS_SCORE}% or more to open the next level. Try again.`)}
          </Text>
          <ActionButton tone="ghost" label={L('Làm lại', 'Try again')} onPress={retry} />
        </Panel>
      ) : (
        <Panel>
          {best !== undefined ? (
            <Text style={{ color: HUB.muted, fontSize: 12, fontWeight: '700' }}>
              {L(`Điểm cao nhất: ${best}%`, `Best score: ${best}%`)}
            </Text>
          ) : null}
          <ActionButton label={L('Nộp bài', 'Submit')} disabled={!allAnswered} onPress={submit} />
          {!allAnswered ? (
            <Text style={{ color: HUB.muted, fontSize: 12 }}>{L('Chọn đáp án cho cả năm câu để nộp.', 'Choose an answer for all five questions to submit.')}</Text>
          ) : null}
        </Panel>
      )}
    </View>
  );
}

function CapstoneBody({ lesson, finished, onComplete, en }: BodyProps<CapstoneLesson>) {
  const { L } = useL();
  const [checked, setChecked] = useState<boolean[]>(() => lesson.tasks.map(() => finished));
  const all = checked.every(Boolean);
  const toggle = (i: number) => {
    if (finished) return;
    setChecked((c) => c.map((v, j) => (j === i ? !v : v)));
  };

  return (
    <View style={{ gap: 12 }}>
      <Panel>
        <Text style={{ color: HUB.muted, fontSize: 12, lineHeight: 18 }}>
          {L('Đánh dấu từng mục khi bạn đã làm xong. Đây là tự kiểm, không có điểm tự động.', 'Tick each item once you have done it. This is a self-check; there is no automatic score.')}
        </Text>
        {lesson.tasks.map((t, i) => (
          <Pressable
            key={i}
            accessibilityRole="checkbox"
            aria-checked={checked[i]}
            onPress={() => toggle(i)}
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: 12,
              padding: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: checked[i] ? '#BBF7D0' : SOFT_LINE,
              backgroundColor: checked[i] ? '#F0FDF4' : SOFT_FILL,
            }}
          >
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                borderWidth: 1.5,
                borderColor: checked[i] ? HUB.green : HUB.muted,
                backgroundColor: checked[i] ? HUB.green : '#FFFFFF',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {checked[i] ? <Icon name="check" size={14} color="#FFFFFF" strokeWidth={2.6} /> : null}
            </View>
            <Text style={{ flex: 1, color: HUB.body, fontSize: 14, lineHeight: 20 }}>{tr(t, en)}</Text>
          </Pressable>
        ))}
      </Panel>
      {finished ? (
        <DoneTag />
      ) : (
        <ActionButton label={L('Hoàn thành thử thách', 'Complete the capstone')} disabled={!all} onPress={() => onComplete()} />
      )}
    </View>
  );
}

/** Bài đang khoá: nói rõ cần làm gì để mở. */
function LockedNotice({ course, lesson, done }: { course: Course; lesson: Lesson; done: DoneMap }) {
  const { L } = useL();
  const cause = !levelUnlocked(course, lesson.level, done)
    ? L(`Cấp này mở khi đạt bài kiểm tra cấp ${lesson.level - 1}.`, `This level opens once you pass the Level ${lesson.level - 1} check.`)
    : lesson.kind === 'QUIZ'
      ? L('Làm xong các bài học của cấp này rồi quay lại bài kiểm tra.', 'Finish the lessons in this level, then come back to the check.')
      : L('Đạt bài kiểm tra cùng cấp để mở thử thách.', 'Pass the check in this level to open the capstone.');

  return (
    <Panel>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Icon name="lock" size={18} color={HUB.muted} />
        <Text style={{ color: HUB.ink, fontSize: 15, fontWeight: '800' }}>{L('Bài này đang khoá', 'This lesson is locked')}</Text>
      </View>
      <Text style={{ color: HUB.body, fontSize: 13, lineHeight: 19 }}>{cause}</Text>
      <ActionButton tone="ghost" label={L('Về khoá học', 'Back to course')} onPress={() => router.replace(`/hub/course/${course.id}` as never)} />
    </Panel>
  );
}

function NextStep({ course, lesson, next, done }: { course: Course; lesson: Lesson; next: Lesson | undefined; done: DoneMap }) {
  const { L } = useL();
  const level = lesson.level as CourseLevel;
  const unlockedNext = lesson.kind === 'QUIZ' && level < 3 && levelUnlocked(course, (level + 1) as CourseLevel, done);
  return (
    <Panel>
      <DoneTag />
      {unlockedNext ? (
        <Text style={{ color: HUB.body, fontSize: 13, lineHeight: 19 }}>
          {L(`Cấp ${level + 1} đã mở.`, `Level ${level + 1} is now open.`)}
        </Text>
      ) : null}
      {next ? (
        <ActionButton label={L('Bài tiếp theo', 'Next lesson')} onPress={() => router.replace(`/hub/course/lesson/${next.id}` as never)} />
      ) : null}
      <ActionButton tone="ghost" label={L('Về khoá học', 'Back to course')} onPress={() => router.replace(`/hub/course/${course.id}` as never)} />
    </Panel>
  );
}

function ChoiceBlock({ choice, en, finished, onRight }: { choice: Choice; en: boolean; finished: boolean; onRight: () => void }) {
  const { L } = useL();
  const [pick, setPick] = useState<number | null>(finished ? choice.answer : null);
  const right = pick !== null && pick === choice.answer;
  const wrong = pick !== null && pick !== choice.answer;

  return (
    <Panel>
      <Text style={{ color: HUB.ink, fontSize: 15, fontWeight: '800', lineHeight: 22 }}>{tr(choice.q, en)}</Text>
      <View style={{ gap: 8 }}>
        {choice.options.map((o, i) => {
          let tone: OptionTone = 'idle';
          if (pick === i) tone = right ? 'right' : 'wrong';
          return (
            <OptionButton
              key={i}
              label={tr(o, en)}
              tone={tone}
              disabled={finished || right}
              onPress={() => {
                setPick(i);
                if (i === choice.answer) onRight();
              }}
            />
          );
        })}
      </View>
      {wrong ? <Feedback tone="warn" text={L('Chưa đúng. Thử phương án khác.', 'Not quite. Try another option.')} /> : null}
      {right ? <Feedback tone="ok" text={tr(choice.why, en)} /> : null}
    </Panel>
  );
}

function SlideCard({ label, slide, en, after = false }: { label: string; slide: Slide; en: boolean; after?: boolean }) {
  return (
    <View
      style={[
        GLASS_CARD,
        {
          padding: 16,
          gap: 10,
          borderColor: after ? '#BBF7D0' : HUB.line,
          backgroundColor: after ? '#F0FDF4' : '#FFFFFF',
        },
      ]}
    >
      <Label text={label} />
      <Text style={{ color: HUB.ink, fontSize: 17, fontWeight: '800', lineHeight: 23 }}>{tr(slide.headline, en)}</Text>
      {slide.bullets.map((b, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, marginTop: 7, backgroundColor: HUB.muted }} />
          <Text style={{ flex: 1, color: HUB.body, fontSize: 14, lineHeight: 20 }}>{tr(b, en)}</Text>
        </View>
      ))}
    </View>
  );
}

type OptionTone = 'idle' | 'selected' | 'right' | 'wrong';

function OptionButton({ label, tone, onPress, disabled = false }: { label: string; tone: OptionTone; onPress: () => void; disabled?: boolean }) {
  const colors: Record<OptionTone, { bg: string; border: string; fg: string }> = {
    idle: { bg: SOFT_FILL, border: SOFT_LINE, fg: HUB.body },
    selected: { bg: 'rgba(140, 83, 27, 0.10)', border: HUB.blue, fg: HUB.ink },
    right: { bg: '#DCFCE7', border: '#86EFAC', fg: '#166534' },
    wrong: { bg: '#FEE2E2', border: '#FCA5A5', fg: '#991B1B' },
  };
  const c = colors[tone];
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 13,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: c.border,
        backgroundColor: c.bg,
      }}
    >
      <Text style={{ flex: 1, color: c.fg, fontSize: 14, fontWeight: tone === 'selected' ? '800' : '600', lineHeight: 20 }}>{label}</Text>
      {tone === 'right' ? <Icon name="check" size={16} color="#15803D" strokeWidth={2.4} /> : null}
      {tone === 'wrong' ? <Icon name="close" size={16} color="#B91C1C" strokeWidth={2.4} /> : null}
    </Pressable>
  );
}

function Feedback({ tone, text }: { tone: 'ok' | 'warn'; text: string }) {
  const ok = tone === 'ok';
  return (
    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start', padding: 12, borderRadius: 12, backgroundColor: ok ? '#DCFCE7' : '#FFEDD5' }}>
      <Icon name={ok ? 'check' : 'info'} size={16} color={ok ? '#15803D' : '#C2410C'} />
      <Text style={{ flex: 1, color: ok ? '#166534' : '#9A3412', fontSize: 13, lineHeight: 19 }}>{text}</Text>
    </View>
  );
}

function DoneTag() {
  const { L } = useL();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 14, backgroundColor: '#DCFCE7' }}>
      <Icon name="check" size={16} color={HUB.green} strokeWidth={2.4} />
      <Text style={{ color: '#166534', fontSize: 14, fontWeight: '800' }}>{L('Đã xong', 'Done')}</Text>
    </View>
  );
}

function ActionButton({ label, onPress, disabled = false, tone = 'primary' }: { label: string; onPress: () => void; disabled?: boolean; tone?: 'primary' | 'ghost' }) {
  const ghost = tone === 'ghost';
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={{
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: ghost ? 1 : 0,
        borderColor: HUB.blue,
        backgroundColor: ghost ? '#FFFFFF' : disabled ? HUB.line : HUB.blue,
      }}
    >
      <Text style={{ color: ghost ? HUB.blue : disabled ? HUB.muted : '#FFFFFF', fontSize: 15, fontWeight: '800' }}>{label}</Text>
    </Pressable>
  );
}

function Label({ text }: { text: string }) {
  return <Text style={{ color: HUB.muted, fontSize: 11, fontWeight: '800', letterSpacing: 0.6 }}>{text.toUpperCase()}</Text>;
}

function Panel({ children }: { children: React.ReactNode }) {
  return <View style={[GLASS_CARD, { padding: 16, gap: 12 }]}>{children}</View>;
}
