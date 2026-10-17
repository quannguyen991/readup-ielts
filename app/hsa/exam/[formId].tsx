import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { HsaRunner } from '@/components/hsa/HsaRunner';
import { HSA_PAPERS } from '@/data/hsa-bank';
import { useL } from '@/i18n/useL';

export default function HsaPaperScreen() {
  const { formId } = useLocalSearchParams<{ formId: string }>();
  const { L } = useL();
  const paper = (HSA_PAPERS.find((item) => item.id === formId) ?? HSA_PAPERS[0])!;
  return <HsaRunner title={`HSA · ${L(paper.title.vi, paper.title.en)}`} questions={paper.questions} activity={`mock:form-${paper.id}`} durationSeconds={60 * 60} />;
}
