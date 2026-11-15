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
import { ZhBookCovers } from '@/components/vocab/chinese/ZhBookCovers';
import { ZH } from '@/components/vocab/chinese/palette';
import { themeForLevel } from '@/components/vocab/chinese/levels';
import { IntroHero } from '@/components/vocab/chinese/IntroHero';
import { ZH_V4 } from '@/components/vocab/chinese/v4';
import { JaIntroHero, JaTopicGrid } from '@/components/vocab/japanese/JaBookParts';
import { isDialogueLesson, JA_STICKER } from '@/components/vocab/japanese/ja-art';

export default function BookVocabScreen() {
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  const { L, en } = useL();
  const book = BOOK_VOCAB_BOOKS.find((item) => item.slug === slug);

  return (
    <Screen>
      <Button
        className="mb-4 self-start"
        label={L('Tất cả sách từ vựng', 'All vocabulary books')}
        variant="ghost"
        size="sm"
        iconLeft="chevron-left"
        onPress={() => router.push('/vocabulary/topics' as never)}
      />
      {book ? (
        <>
          {book.language === 'zh' ? (
            // Đầu trang sách tiếng Trung: tên lớn, ba nhãn số liệu, một dòng mô tả. Ghi chú nguồn xuống cuối trang.
            <Appear>
              <IntroHero
                banner={themeForLevel(1).banner}
                corner={themeForLevel(1).frames.corner}
                wash={themeForLevel(1).wash}
                eyebrow="Từ vựng tiếng Trung"
                title={book.nameVi.split(' · ')[0] ?? book.nameVi}
                chips={[
                  `${book.topics.length} bộ HSK`,
                  `${book.topics.reduce((n, t) => n + t.words.length, 0).toLocaleString('vi-VN')} từ`,
                  `${book.topics.reduce((n, t) => n + t.lessons.length, 0)} buổi học`,
                ]}
                blurb={book.blurb}
              />
            </Appear>
          ) : book.language === 'ja' ? (
            // Đầu trang sách tiếng Nhật: banner xanh rừng–vàng kim, bốn góc hoa anh đào, đèn lồng.
            <Appear>
              <JaIntroHero
                banner={ZH_V4.ja.banner}
                decor={JA_STICKER.maneki}
                eyebrow="Từ vựng tiếng Nhật"
                title={book.nameVi.split(' · ')[0] ?? book.nameVi}
                chips={[
                  `${book.topics.length} bộ`,
                  `${book.topics.reduce((n, t) => n + t.words.length, 0).toLocaleString('vi-VN')} từ`,
                  `${book.topics.reduce((n, t) => n + t.lessons.filter((l) => isDialogueLesson(l.slug)).length, 0)} bài hội thoại`,
                ]}
                blurb={book.blurb}
              />
            </Appear>
          ) : (
          <Appear>
            <Text className="font-heavy text-pageTitle text-ink">{en ? book.name : book.nameVi}</Text>
            <Text className="mt-2 font-sans text-body text-muted">
              {L(`${book.topics.length} chủ đề · ${book.words.length.toLocaleString('vi-VN')} từ`, `${book.topics.length} topics · ${book.words.length.toLocaleString('en-US')} words`)}
            </Text>
            <Text className="mt-1 font-sans text-label text-muted">{book.blurb}</Text>
            {book.sourceNote ? <Text className="mt-2 font-sans text-label text-muted">{book.sourceNote}</Text> : null}
          </Appear>
          )}

          {book.language === 'ja' ? (
            <View className="mt-6">
              <JaTopicGrid book={book} />
            </View>
          ) : (
          <View className="mt-6">
            <Text className="mb-3 font-heavy text-sectionTitle text-ink" style={book.language === 'zh' ? { color: ZH.onPage } : undefined}>
              {book.language === 'zh' ? 'Chọn bộ HSK để học' : L('Chọn chủ đề để học', 'Choose a topic to study')}
            </Text>
            {book.language === 'zh' ? (
              <ZhBookCovers book={book} />
            ) : (
            <Grid columns={2} tabletColumns={2} mobileColumns={1} gap={12}>
              {book.topics.map((topic, index) => (
                <Appear key={topic.slug} index={Math.min(index, 8)}>
                  <Pressable
                    accessibilityRole="link"
                    onPress={() => router.push(`/vocabulary/book/${book.slug}/${topic.slug}` as never)}
                    style={({ hovered, pressed }: { hovered?: boolean; pressed?: boolean }) => ({
                      height: '100%',
                      minHeight: 104,
                      padding: 16,
                      borderRadius: 18,
                      borderWidth: 1,
                      borderColor: hovered ? '#C4B5FD' : '#E9E5F2',
                      backgroundColor: '#FFFFFF',
                      transform: [{ scale: pressed ? 0.985 : hovered ? 1.01 : 1 }],
                    })}
                  >
                    <View className="flex-row items-start justify-between gap-3">
                      <Text className="flex-1 font-strong text-body text-ink">{en ? topic.name : topic.nameVi}</Text>
                      <Text className="font-strong text-label" style={{ color: color.primary }}>{topic.words.length}</Text>
                    </View>
                    <Text className="mt-2 font-sans text-label text-muted">
                      {L(`${topic.lessons.length} buổi học · tối đa 50 từ/buổi`, `${topic.lessons.length} lessons · up to 50 words each`)}
                    </Text>
                  </Pressable>
                </Appear>
              ))}
            </Grid>
            )}
            {book.language === 'zh' && book.sourceNote ? (
              <Text className="mt-8 font-sans text-label text-muted">{book.sourceNote}</Text>
            ) : null}
          </View>
          )}
        </>
      ) : (
        <Card>
          <Text className="font-strong text-cardTitle text-ink">{L('Không tìm thấy sách này', 'Book not found')}</Text>
          <Text className="mt-1 font-sans text-body text-muted">{L('Hãy quay lại thư viện từ vựng để chọn sách khác.', 'Return to the vocabulary library to choose another book.')}</Text>
        </Card>
      )}
    </Screen>
  );
}
