import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Grid } from '@/components/layout/Grid';
import { Appear } from '@/components/motion/Motion';
import { Button, Card } from '@/components/ui';
import { BOOK_VOCAB_BOOKS } from '@/data/vocab-topics';
import { useL } from '@/i18n/useL';
import { color } from '@/theme/tokens';

export default function BookVocabThemeScreen() {
  const { slug, topic: topicSlug } = useLocalSearchParams<{ slug?: string; topic?: string }>();
  const { L, en } = useL();
  const book = BOOK_VOCAB_BOOKS.find((item) => item.slug === slug);
  const topic = book?.topics.find((item) => item.slug === topicSlug);

  return (
    <Screen>
      <Button
        className="mb-4 self-start"
        label={L('Quay lại danh sách chủ đề', 'Back to topics')}
        variant="ghost"
        size="sm"
        iconLeft="chevron-left"
        onPress={() => router.push(`/vocabulary/book/${slug}` as never)}
      />
      {book && topic ? (
        <>
          <Appear>
            <Text className="font-heavy text-pageTitle text-ink">{en ? topic.name : topic.nameVi}</Text>
            <Text className="mt-2 font-sans text-body text-muted">
              {L(`${topic.words.length} từ · ${topic.lessons.length} buổi học`, `${topic.words.length} words · ${topic.lessons.length} lessons`)}
            </Text>
            <Text className="mt-1 font-sans text-label text-muted">{en ? book.name : book.nameVi}</Text>
            {book.sourceNote ? <Text className="mt-1 font-sans text-label text-muted">{book.sourceNote}</Text> : null}
          </Appear>

          <View className="mt-6">
            <Text className="mb-3 font-heavy text-sectionTitle text-ink">{L('Chọn buổi học', 'Choose a lesson')}</Text>
            <Grid columns={2} tabletColumns={2} mobileColumns={1} gap={12}>
              {topic.lessons.map((lesson, index) => (
                <Appear key={lesson.slug} index={Math.min(index, 8)}>
                  <Pressable
                    accessibilityRole="link"
                    onPress={() => router.push(`/vocabulary/topic/${lesson.slug}` as never)}
                    style={({ hovered, pressed }: { hovered?: boolean; pressed?: boolean }) => ({
                      minHeight: 96,
                      padding: 16,
                      borderRadius: 18,
                      borderWidth: 1,
                      borderColor: hovered ? '#C4B5FD' : '#E9E5F2',
                      backgroundColor: '#FFFFFF',
                      transform: [{ scale: pressed ? 0.985 : hovered ? 1.01 : 1 }],
                    })}
                  >
                    <View className="flex-row items-start justify-between gap-3">
                      <Text className="flex-1 font-strong text-body text-ink">{en ? lesson.name : lesson.nameVi}</Text>
                      <Text className="font-strong text-label" style={{ color: color.primary }}>{lesson.words.length} {L('từ', 'words')}</Text>
                    </View>
                    <Text className="mt-2 font-sans text-label text-muted">
                      {lesson.blurb}
                    </Text>
                  </Pressable>
                </Appear>
              ))}
            </Grid>
          </View>
        </>
      ) : (
        <Card>
          <Text className="font-strong text-cardTitle text-ink">{L('Không tìm thấy chủ đề này', 'Topic not found')}</Text>
          <Text className="mt-1 font-sans text-body text-muted">{L('Hãy quay lại thư viện để chọn chủ đề khác.', 'Return to the library to choose another topic.')}</Text>
        </Card>
      )}
    </Screen>
  );
}
