import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { HsaRunner } from '@/components/hsa/HsaRunner';
import { HSA_KIND_LABEL, HSA_KIND_ORDER, type HsaQuestionKind } from '@/data/hsa';
import { HSA_QUESTION_BANK } from '@/data/hsa-bank';
import { bi, useL } from '@/i18n/useL';

export default function HsaKindPractice() {
  const { kind: rawKind } = useLocalSearchParams<{ kind: string }>();
  const kind = (HSA_KIND_ORDER.includes(rawKind as HsaQuestionKind) ? rawKind as HsaQuestionKind : HSA_KIND_ORDER[0])!;
  const { L, locale } = useL();
  const questions = HSA_QUESTION_BANK.filter((question) => question.kind === kind);
  return <HsaRunner title={`${L('HSA ·', 'HSA ·')} ${bi(HSA_KIND_LABEL[kind], locale)}`} questions={questions} activity={`practice:${kind}`} />;
}
