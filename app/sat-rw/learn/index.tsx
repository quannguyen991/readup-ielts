import React from 'react';
import { useLocalSearchParams } from 'expo-router';

import { LessonHub } from '@/components/lessons/LessonHub';
import { VERBAL_LESSONS } from '@/data/lessons/verbal-lessons';
import { SAT_VERBAL_VOCAB_LESSONS } from '@/data/lessons/vocab-lessons';
import { SAT_RW_QUESTIONS } from '@/data/sat-rw-repository';
import { useL } from '@/i18n/useL';

/** Domain của mỗi kỹ năng lấy từ chính kho câu hỏi, để hai nơi không lệch nhau. */
const domainOf = (skill: string) => SAT_RW_QUESTIONS.find((q) => q.skill === skill)?.domain ?? 'Khác';
const ORDER = ['Standard English Conventions', 'Expression of Ideas', 'Craft and Structure', 'Information and Ideas'];
const GROUPS = [...new Set([...ORDER, ...VERBAL_LESSONS.map((l) => domainOf(l.skill))])]
  .map((d) => ({ domain: d, lessons: VERBAL_LESSONS.filter((l) => domainOf(l.skill) === d) }))
  .filter((g) => g.lessons.length > 0);

/** Bài học SAT Verbal: 12 bài lý thuyết + bài từ vựng Words in Context và từ nối. */
export default function VerbalLearnScreen() {
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const { L } = useL();
  return (
    <LessonHub
      subject="verbal"
      title={L('Bài học SAT Verbal', 'SAT Verbal lessons')}
      blurb={L(
        'Ngữ pháp, từ nối, từ trong ngữ cảnh và đọc hiểu — mỗi dạng câu một bài, kèm các bài từ vựng học theo cặp đồng nghĩa – trái nghĩa.',
        'Grammar, transitions, words in context and reading — one lesson per question type, plus vocabulary lessons built on synonym–antonym pairs.',
      )}
      backHref="/sat-rw"
      backLabel="SAT Verbal"
      groups={GROUPS}
      vocab={SAT_VERBAL_VOCAB_LESSONS}
      initialTab={tab === 'vocab' ? 'vocab' : 'theory'}
    />
  );
}
