import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';

import { Grid } from '@/components/layout/Grid';
import { Card, SectionHeader } from '@/components/ui';
import { CAM_VOCAB_BOOKS, CAM_VOCAB_PASSAGES, CAM_VOCAB_TOTAL, camVocabCount, camVocabCoverUri } from '@/data/cambridge-vocab';
import { useL } from '@/i18n/useL';

import { BookCover } from './BookShelf';

/**
 * Bìa một sách Cambridge trong phần từ vựng của đề Cam. Rê chuột (hoặc focus bàn phím) thì
 * sách nhảy lên, nghiêng nhẹ và đổ bóng đậm hơn; bấm xuống thì lún lại.
 */
export function CamVocabCover({ n, words, onPress }: { n: number; words: number; onPress?: () => void }) {
  const { L } = useL();
  return (
    <BookCover
      uri={camVocabCoverUri(n)}
      label={L(`Cambridge IELTS ${n}, ${words.toLocaleString('vi-VN')} từ`, `Cambridge IELTS ${n}, ${words.toLocaleString('en-US')} words`)}
      onPress={onPress}
      maxWidth={280}
    />
  );
}

/** Kệ 12 sách Cambridge IELTS 10–21; bấm một sách để xem danh sách từ theo từng bài đọc. */
export function CamVocabShelf() {
  const { L } = useL();
  return (
    <Card className="mt-4">
      <SectionHeader
        title={L('Từ vựng theo sách Cambridge', 'Vocabulary by Cambridge book')}
        subtitle={L(
          `Cambridge IELTS 10–21 · ${CAM_VOCAB_BOOKS.length} sách · ${CAM_VOCAB_PASSAGES} bài đọc · ${CAM_VOCAB_TOTAL.toLocaleString('vi-VN')} từ và cụm từ`,
          `Cambridge IELTS 10–21 · ${CAM_VOCAB_BOOKS.length} books · ${CAM_VOCAB_PASSAGES} passages · ${CAM_VOCAB_TOTAL.toLocaleString('en-US')} words and phrases`,
        )}
        icon="book"
      />
      <View style={{ marginTop: 20, paddingTop: 6 }}>
        <Grid columns={4} tabletColumns={3} mobileColumns={2} gap={26}>
          {CAM_VOCAB_BOOKS.map((b) => (
            <CamVocabCover key={b.n} n={b.n} words={camVocabCount(b)} onPress={() => router.push(`/vocabulary/cambridge/${b.n}` as never)} />
          ))}
        </Grid>
      </View>
    </Card>
  );
}
