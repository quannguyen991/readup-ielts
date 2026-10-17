import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { KindBadge, ProgressBar, tr } from '@/components/hub/CoursePieces';
import { HubScreen } from '@/components/hub/HubScreen';
import { GLASS_CARD, HUB } from '@/components/hub/theme';
import { CutePencil } from '@/components/illust/Cute';
import { CuteBulb, CuteMic } from '@/components/illust/CuteMore';
import { Icon } from '@/components/ui/Icon';
import { useL } from '@/i18n/useL';
import {
  PASS_SCORE,
  courseById,
  courseProgress,
  levelProgress,
  levelUnlocked,
  lessonState,
  lessonsOfLevel,
  type Course,
  type CourseLevel,
  type DoneMap,
  type Lesson,
} from '@/services/hub/presentation-course';
import { useFresh } from '@/store/useFresh';
import { useCourseStore } from '@/store/useCourseStore';

const LEVEL_ART: Record<CourseLevel, (p: { size?: number }) => React.ReactElement> = {
  1: CuteBulb,
  2: CutePencil,
  3: CuteMic,
};

const LEVELS: CourseLevel[] = [1, 2, 3];

/** Trang một khoá: tiến độ tổng, rồi từng cấp với các bài. Cấp đang khoá ghi rõ cần đạt gì để mở. */
export default function CourseScreen() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const { L, en } = useL();
  const done = useFresh(useCourseStore, (s) => s.done);
  const course = courseById(String(id));

  if (!course) {
    return (
      <HubScreen title={L('Khoá học', 'Course')} back>
        <View style={[GLASS_CARD, { padding: 18, gap: 8 }]}>
          <Text style={{ color: HUB.ink, fontSize: 16, fontWeight: '800' }}>{L('Chưa có khoá này', 'This course is not available')}</Text>
          <Text style={{ color: HUB.body, fontSize: 13, lineHeight: 19 }}>
            {L('Quay lại Khám phá để chọn khoá khác.', 'Go back to Explore to pick another course.')}
          </Text>
        </View>
      </HubScreen>
    );
  }

  const total = courseProgress(course, done);

  return (
    <HubScreen title={tr(course.title, en)} subtitle={tr(course.blurb, en)} back padBottom={140}>
      <View style={[GLASS_CARD, { padding: 16, gap: 10 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: HUB.ink, fontSize: 15, fontWeight: '800' }}>{L('Tiến độ khoá', 'Course progress')}</Text>
          <Text style={{ color: HUB.green, fontSize: 13, fontWeight: '800' }}>
            {total.done}/{total.total} {L('bài', 'lessons')}
          </Text>
        </View>
        <ProgressBar done={total.done} total={total.total} />
        <Text style={{ color: HUB.muted, fontSize: 12, lineHeight: 17 }}>
          {L(
            `Mỗi cấp kết thúc bằng bài kiểm tra có điểm. Đạt từ ${PASS_SCORE}% thì mở cấp sau.`,
            `Each level ends with a scored check. Score ${PASS_SCORE}% or more to unlock the next level.`,
          )}
        </Text>
      </View>

      {LEVELS.map((level) => (
        <LevelSection key={level} course={course} level={level} done={done} />
      ))}
    </HubScreen>
  );
}

function LevelSection({ course, level, done }: { course: Course; level: CourseLevel; done: DoneMap }) {
  const { L, en } = useL();
  const info = course.levels[level];
  const Art = LEVEL_ART[level];
  const unlocked = levelUnlocked(course, level, done);
  const prog = levelProgress(course, level, done);
  const lessons = lessonsOfLevel(course, level);

  return (
    <View style={{ gap: 10 }}>
      <View style={[GLASS_CARD, { padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
        <View
          style={{
            width: 60,
            height: 60,
            borderRadius: 18,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: HUB.goldSoft,
          }}
        >
          <Art size={44} />
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <Text style={{ color: HUB.ink, fontSize: 16, fontWeight: '800' }}>{tr(info.title, en)}</Text>
          <Text style={{ color: HUB.muted, fontSize: 12 }}>{tr(info.subtitle, en)}</Text>
          <ProgressBar done={prog.done} total={prog.total} color={HUB.sky} />
          <Text style={{ color: HUB.muted, fontSize: 11, fontWeight: '700' }}>
            {prog.done}/{prog.total} {L('bài', 'lessons')}
          </Text>
        </View>
        {unlocked ? null : <Icon name="lock" size={18} color={HUB.muted} />}
      </View>

      {!unlocked && level > 1 ? (
        <Text style={{ color: HUB.muted, fontSize: 12, lineHeight: 17, paddingHorizontal: 4 }}>
          {L(
            `Cấp này mở khi đạt bài kiểm tra cấp ${level - 1} (từ ${PASS_SCORE}%).`,
            `This level opens when you pass the Level ${level - 1} check (${PASS_SCORE}% or more).`,
          )}
        </Text>
      ) : null}

      <View style={{ gap: 8 }}>
        {lessons.map((lesson) => (
          <LessonRow key={lesson.id} course={course} lesson={lesson} done={done} />
        ))}
      </View>
    </View>
  );
}

function LessonRow({ course, lesson, done }: { course: Course; lesson: Lesson; done: DoneMap }) {
  const { L, en } = useL();
  const state = lessonState(course, lesson, done);
  const locked = state === 'locked';
  const best = lesson.kind === 'QUIZ' ? done[lesson.id]?.score : undefined;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={tr(lesson.title, en)}
      disabled={locked}
      onPress={() => router.push(`/hub/course/lesson/${lesson.id}` as never)}
      style={[GLASS_CARD, { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, opacity: locked ? 0.6 : 1 }]}
    >
      <View style={{ flex: 1, minWidth: 0, gap: 5 }}>
        <KindBadge kind={lesson.kind} compact />
        <Text style={{ color: HUB.ink, fontSize: 15, fontWeight: '800' }}>{tr(lesson.title, en)}</Text>
        <Text style={{ color: HUB.muted, fontSize: 12, lineHeight: 17 }} numberOfLines={2}>
          {tr(lesson.desc, en)}
        </Text>
        {best !== undefined ? (
          <Text style={{ color: best >= PASS_SCORE ? HUB.green : HUB.orange, fontSize: 11, fontWeight: '800' }}>
            {L(`Điểm cao nhất: ${best}%`, `Best score: ${best}%`)}
          </Text>
        ) : null}
      </View>
      <StatusIcon state={state} />
    </Pressable>
  );
}

function StatusIcon({ state }: { state: 'done' | 'open' | 'locked' }) {
  if (state === 'done') {
    return (
      <View style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#DCFCE7' }}>
        <Icon name="check" size={16} color={HUB.green} strokeWidth={2.4} />
      </View>
    );
  }
  if (state === 'locked') return <Icon name="lock" size={18} color={HUB.muted} />;
  return <Icon name="chevron-right" size={18} color={HUB.muted} />;
}
