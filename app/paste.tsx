import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { useUserArticleStore } from '@/store/useUserArticleStore';
import { color } from '@/theme/tokens';

/** Nhận văn bản tự dán, chấm độ khó rồi mở thẳng màn hình đọc. */
export default function PasteScreen() {
  const { text, title } = useLocalSearchParams<{ text?: string; title?: string }>();
  const addFromText = useUserArticleStore((s) => s.addFromText);
  const created = useRef(false);

  useEffect(() => {
    if (created.current) return;
    if (!text || text.trim().split(/\s+/).length < 40) {
      router.replace('/practice' as never);
      return;
    }

    created.current = true;
    const id = addFromText(text, title);
    router.replace(`/read/${id}` as never);
  }, [text, title, addFromText]);

  return (
    <View className="flex-1 items-center justify-center bg-canvas">
      <ActivityIndicator color={color.primary} />
      <Text className="mt-3 font-sans text-body text-muted">Đang chấm độ khó văn bản…</Text>
    </View>
  );
}
