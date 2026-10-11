import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { HsaRunner } from '@/components/hsa/HsaRunner';
import { HSA_TOPICS } from '@/data/hsa';
import { HSA_QUESTION_BANK } from '@/data/hsa-bank';
import { bi, useL } from '@/i18n/useL';

export default function HsaTopicPractice() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { L, locale } = useL();
  const topic = HSA_TOPICS.find((item) => item.id === slug);
  const questions = HSA_QUESTION_BANK.filter((question) => question.topic === slug);
  return <HsaRunner title={`${L('HSA · Ôn tập:', 'HSA · Review:')} ${topic ? bi(topic.title, locale) : slug}`} questions={questions} activity={`topic:${slug}`} />;
}
