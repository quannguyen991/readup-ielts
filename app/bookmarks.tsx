import React from 'react';
import { Text, View } from 'react-native';

import { ArticleCard } from '@/components/article/ArticleCard';
import { Screen } from '@/components/layout/Screen';
import { Card, Icon, SectionHeader } from '@/components/ui';
import { getArticleById } from '@/data/articles';
import { useStudyStore } from '@/store/useStudyStore';
import { useVocabStore } from '@/store/useVocabStore';
import { color } from '@/theme/tokens';

export default function BookmarksScreen() {
  const bookmarks = useStudyStore((s) => s.bookmarks);
  const words = useVocabStore((s) => Object.values(s.entries));

  const articles = bookmarks
    .map((id) => getArticleById(id))
    .filter((a): a is NonNullable<typeof a> => Boolean(a));

  return (
    <Screen>
      <Text className="font-heavy text-pageTitle text-ink">Bookmarks</Text>
      <Text className="mt-1 font-sans text-body text-muted">
        Bài đọc bạn đánh dấu để quay lại sau.
      </Text>

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
