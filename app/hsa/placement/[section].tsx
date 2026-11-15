import React, { useMemo } from 'react';
import { Text } from 'react-native';
import { Redirect, useLocalSearchParams } from 'expo-router';

import { HsaRunner } from '@/components/hsa/HsaRunner';
import { HSA_QUESTION_BANK } from '@/data/hsa-bank';
import { bi, useL } from '@/i18n/useL';
import { CRITERIA } from '@/services/hsa/criteria';
import { buildPlacement, placementActivity } from '@/services/hsa/placement';

/** Làm một phần của bài test đầu vào; nộp xong sang trang kết quả của phần đó. */
export default function HsaPlacementSectionScreen() {
  const { L, locale } = useL();
  const { section } = useLocalSearchParams<{ section: string }>();
  const sections = useMemo(() => buildPlacement(HSA_QUESTION_BANK), []);
  const found = sections.find((s) => s.id === section);
  if (!found) return <Redirect href={'/hsa/placement' as never} />;
  const criterion = CRITERIA.find((c) => c.id === found.id)!;
  return (
    <HsaRunner
      title={`${L('Test đầu vào', 'Entry test')} · ${bi(criterion.title, locale)}`}
      questions={found.questions}
      activity={placementActivity(found.id)}
      durationSeconds={found.seconds}
    />
  );
}
