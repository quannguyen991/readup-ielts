import React from 'react';
import { Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { LessonView } from '@/components/lessons/LessonView';
import { VerbalQuickCheck } from '@/components/lessons/QuickCheck';
import { Button, Card } from '@/components/ui';
import { VERBAL_LESSONS } from '@/data/lessons/verbal-lessons';
import { SAT_RW_QUESTIONS } from '@/data/sat-rw-repository';
import { lessonKey, useLessonStore } from '@/store/useLessonStore';
import { useL } from '@/i18n/useL';

export default function VerbalLessonScreen() {
  const { skill = '' } = useLocalSearchParams<{ skill: string }>();
  const { L } = useL();
  const index = VERBAL_LESSONS.findIndex((l) => l.skill === skill);
  const lesson = VERBAL_LESSONS[index];
  const key = lessonKey('verbal', skill);
  const done = useLessonStore((s) => !!s.done[key]);
  const markDone = useLessonStore((s) => s.markDone);

  if (!lesson) {
    return (
      <Screen>
        <Card>
          <Text className="font-strong text-cardTitle text-ink">{L('Không có bài học này', 'Lesson not found')}</Text>
          <Button className="mt-3 self-start" label={L('Về danh sách bài học', 'Back to lessons')} onPress={() => router.replace('/sat-rw/learn' as never)} />
        </Card>
      </Screen>
    );
  }
  const domain = SAT_RW_QUESTIONS.find((q) => q.skill === skill)?.domain ?? '';
  const next = VERBAL_LESSONS[index + 1];
  return (
    <LessonView
      key={skill}
      lesson={lesson}
      eyebrow={L(
        `SAT Verbal · ${domain} · Bài ${index + 1}/${VERBAL_LESSONS.length}`,
        `SAT Verbal · ${domain} · Lesson ${index + 1}/${VERBAL_LESSONS.length}`,
      )}
      backHref="/sat-rw/learn"
      backLabel={L('Bài học SAT Verbal', 'SAT Verbal lessons')}
      check={<VerbalQuickCheck key={skill} skill={skill} />}
      done={done}
      onDone={() => markDone(key)}
      practiceHref={`/sat-rw/skill/${skill}`}
      next={next ? { title: next.title, href: `/sat-rw/learn/${next.skill}` } : undefined}
    />
  );
}
