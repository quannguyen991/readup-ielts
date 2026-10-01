import React from 'react';
import { useLocalSearchParams } from 'expo-router';

import { LessonHub } from '@/components/lessons/LessonHub';
import { MATH_LESSONS } from '@/data/lessons/math-lessons';
import { SAT_MATH_VOCAB_LESSONS } from '@/data/lessons/vocab-lessons';
import { MATH_DOMAIN_LABEL, MATH_SKILL_DOMAIN, type MathDomain, type MathSkill } from '@/lib/math/types';
import { useL } from '@/i18n/useL';

const DOMAINS: MathDomain[] = ['algebra', 'advanced_math', 'problem_solving_data', 'geometry_trig'];
const GROUPS = DOMAINS.map((d) => ({
  domain: MATH_DOMAIN_LABEL[d],
  lessons: MATH_LESSONS.filter((l) => MATH_SKILL_DOMAIN[l.skill as MathSkill] === d),
}));

/** Bài học SAT Math: 19 bài lý thuyết theo kỹ năng + các bài từ vựng thuật ngữ. */
export default function MathLearnScreen() {
  const { L } = useL();
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  return (
    <LessonHub
      subject="math"
      title={L('Bài học SAT Math', 'SAT Math lessons')}
      blurb={L('Mỗi kỹ năng: kiến thức, ví dụ, bẫy, tự kiểm tra.', 'Each skill: concept, examples, traps, quick check.')}
      backHref="/math"
      backLabel="SAT Math"
      groups={GROUPS}
      vocab={SAT_MATH_VOCAB_LESSONS}
      initialTab={tab === 'vocab' ? 'vocab' : 'theory'}
    />
  );
}
