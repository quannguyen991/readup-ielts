import React from 'react';
import { useLocalSearchParams } from 'expo-router';

import { SentenceTrainer } from '@/components/east-asian-sentences/SentenceTrainer';

/** Nghe chép chính tả tiếng Trung / tiếng Nhật. */
export default function EaDictationScreen() {
  const { lang } = useLocalSearchParams<{ lang: string }>();
  return <SentenceTrainer lang={lang === 'ja' ? 'ja' : 'zh'} mode="dictation" />;
}
