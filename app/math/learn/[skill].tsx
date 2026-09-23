import React from 'react';
import { Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { LessonView } from '@/components/lessons/LessonView';
import { MathQuickCheck } from '@/components/lessons/QuickCheck';
import { Button, Card } from '@/components/ui';
import { MATH_LESSONS } from '@/data/lessons/math-lessons';
import { MATH_DOMAIN_LABEL, MATH_SKILL_DOMAIN, type MathSkill } from '@/lib/math/types';
import { lessonKey, useLessonStore } from '@/store/useLessonStore';

export default function MathLessonScreen() {
  const { skill = '' } = useLocalSearchParams<{ skill: string }>();
  const index = MATH_LESSONS.findIndex((l) => l.skill === skill);
  const lesson = MATH_LESSONS[index];
  const key = lessonKey('math', skill);
  const done = useLessonStore((s) => !!s.done[key]);
  const markDone = useLessonStore((s) => s.markDone);

  if (!lesson) {
    return (
      <Screen>
        <Card>
          <Text className="font-strong text-cardTitle text-ink">Không có bài học này</Text>
          <Button className="mt-3 self-start" label="Về danh sách bài học" onPress={() => router.replace('/math/learn' as never)} />
        </Card>
      </Screen>
    );
  }
  const next = MATH_LESSONS[index + 1];
  return (
    <LessonView
      key={skill}
      lesson={lesson}
      eyebrow={`SAT Math · ${MATH_DOMAIN_LABEL[MATH_SKILL_DOMAIN[skill as MathSkill]]} · Bài ${index + 1}/${MATH_LESSONS.length}`}
      backHref="/math/learn"
      backLabel="Bài học SAT Math"
      math
      check={<MathQuickCheck key={skill} skill={skill as MathSkill} />}
      done={done}
      onDone={() => markDone(key)}
      practiceHref={`/math/drill/${skill}`}
      next={next ? { title: next.title, href: `/math/learn/${next.skill}` } : undefined}
    />
  );
}
