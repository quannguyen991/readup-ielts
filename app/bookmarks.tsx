import React, { useMemo } from 'react';
import { Text, View } from 'react-native';

import { ArticleCard } from '@/components/article/ArticleCard';
import { Screen } from '@/components/layout/Screen';
import { Card, HeroBanner, Icon, SectionHeader } from '@/components/ui';
import { getArticleById } from '@/data/articles';
import { useStudyStore } from '@/store/useStudyStore';
import { useVocabStore } from '@/store/useVocabStore';
import { color } from '@/theme/tokens';

export default function BookmarksScreen() {
  const bookmarks = useStudyStore((s) => s.bookmarks);
  // Selector PHẢI trả về thứ ổn định qua các lần render. Object.values dựng
  // mảng mới mỗi lần, zustand thấy snapshot luôn khác nên render lại vô hạn —
  // màn này từng trắng trang kèm "Maximum update depth exceeded".
  const entries = useVocabStore((s) => s.entries);
  const words = useMemo(() => Object.values(entries), [entries]);

  const articles = useMemo(
    () =>
      bookmarks
        .map((id) => getArticleById(id))
        .filter((a): a is NonNullable<typeof a> => Boolean(a)),
    [bookmarks],
  );

  return (
    <Screen>
      <HeroBanner
        title="Đã lưu"
        subtitle="Bài đọc bạn đánh dấu để quay lại sau."
        illustration="bookmarks-hero"
      />

      <Card className="mt-4">
        <SectionHeader title="Bài đã đánh dấu" subtitle={`${articles.length} bài`} icon="bookmark" />

        <View className="mt-3 gap-2">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}

          {articles.length === 0 ? (
            <View className="items-center rounded-panel bg-surfaceAlt px-4 py-10">
              <Icon name="bookmark" size={30} color={color.subtle} />
              <Text className="mt-3 text-center font-sans text-body text-muted">
                Chưa đánh dấu bài nào. Bấm biểu tượng bookmark trên card bài đọc.
              </Text>
            </View>
          ) : null}
        </View>
      </Card>

      <Card className="mt-4">
        <SectionHeader
          title="Từ đã lưu gần đây"
          subtitle={`${words.length} từ`}
          icon="letters"
          iconTone="accent"
        />

        <View className="mt-3 flex-row flex-wrap gap-2">
          {words.slice(0, 30).map((word) => (
            <View key={word.id} className="rounded-pill bg-accent-50 px-3 py-1.5">
              <Text className="font-semi text-label text-accent-700">{word.word}</Text>
            </View>
          ))}

          {words.length === 0 ? (
            <Text className="font-sans text-body text-muted">Chưa lưu từ nào.</Text>
          ) : null}
        </View>
      </Card>
    </Screen>
  );
}
