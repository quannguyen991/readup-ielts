import React, { useMemo } from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { DeckLibrary } from '@/components/vocab/DeckLibrary';
import { OXFORD_TOPIC_DECKS } from '@/data/oxford-topics-decks';

/**
 * Oxford 3000 & 5000 — một đường duy nhất: thư viện bộ từ (lọc "Oxford 3000") →
 * trang bộ từ (`/vocabulary/topic/<slug>`, đủ các cách luyện) → "Tất cả bộ từ"
 * quay về thư viện.
 *
 * Trước đây màn này có một bố cục học riêng (danh sách + lật thẻ + quiz), lệch với
 * bố cục của mọi bộ khác. Giờ không còn bố cục riêng: link cũ `/oxford?topic=…`
 * được chuyển thẳng sang trang bộ từ, không dừng ở danh sách trung gian.
 */
export default function OxfordIndexScreen() {
  const params = useLocalSearchParams<{ topic?: string }>();
  const legacyTopic = useMemo(() => {
    if (!params.topic) return null;
    return OXFORD_TOPIC_DECKS.find((d) => d.title === params.topic || d.slug === params.topic) ?? null;
  }, [params.topic]);

  if (legacyTopic) {
    return <Redirect href={`/vocabulary/topic/${legacyTopic.slug}` as never} />;
  }

  return (
    <Screen>
      <DeckLibrary initialFilter="oxford" />
    </Screen>
  );
}
