import React from 'react';
import { useLocalSearchParams } from 'expo-router';

import { SentenceTrainer } from '@/components/east-asian-sentences/SentenceTrainer';

/** Dịch câu tiếng Trung / tiếng Nhật. */
export default function EaTranslateScreen() {
  const { lang } = useLocalSearchParams<{ lang: string }>();
  return <SentenceTrainer lang={lang === 'ja' ? 'ja' : 'zh'} mode="translate" />;
}
