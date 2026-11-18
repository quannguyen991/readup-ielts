import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';

import { EaRoadmap } from '@/components/vocab/eastasia/EaRoadmap';
import { EaScreen } from '@/components/vocab/eastasia/EaPages';
import type { EaLang } from '@/data/learning-path/east-asian';
import { useL } from '@/i18n/useL';

/** Lộ trình HSK 1–6 (`/vocabulary/lo-trinh/zh`) và JLPT N5–N1 (`/vocabulary/lo-trinh/ja`). */
export default function EastAsianRoadmapScreen() {
  const { lang } = useLocalSearchParams<{ lang?: string }>();
  const { L } = useL();
  const l: EaLang = lang === 'ja' ? 'ja' : 'zh';
  return (
    <EaScreen lang={l} backLabel={L('Tất cả sách từ vựng', 'All vocabulary books')} onBack={() => router.push('/vocabulary/topics' as never)}>
      <EaRoadmap lang={l} />
    </EaScreen>
  );
}
