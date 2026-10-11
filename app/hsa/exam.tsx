import React from 'react';
import { HSA_PAPERS } from '@/data/hsa-bank';
import { HsaRunner } from '@/components/hsa/HsaRunner';
import { useL } from '@/i18n/useL';

export default function HsaExamScreen() {
  const { L } = useL();
  const paper = HSA_PAPERS[0];
  return <HsaRunner title={`HSA · ${L(paper.title.vi, paper.title.en)}`} questions={paper.questions} activity={`mock:form-${paper.id}`} durationSeconds={60 * 60} />;
}
