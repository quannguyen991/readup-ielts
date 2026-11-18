import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';

import { Grid } from '@/components/layout/Grid';
import { Card, SectionHeader } from '@/components/ui';
import { CAM_VOCAB_ALL_BOOKS, CAM_VOCAB_ANKI_BOOK_COUNT, CAM_VOCAB_ANKI_TOTAL, CAM_VOCAB_PASSAGES, CAM_VOCAB_TOTAL, camVocabBookCount, camVocabCoverUri } from '@/data/cambridge-vocab';
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
      label={L(`Cambridge IELTS ${n}, ${words.toLocaleString('vi-VN')} mục từ`, `Cambridge IELTS ${n}, ${words.toLocaleString('en-US')} vocabulary items`)}
      onPress={onPress}
      maxWidth={280}
    />
  );
}

/** Kệ sách Cambridge IELTS; bấm để xem Reading index và các thẻ Anki đã nhập. */
export function CamVocabShelf() {
  const { L } = useL();
  return (
    <Card className="mt-4">
      <SectionHeader
        title={L('Từ vựng theo sách Cambridge', 'Vocabulary by Cambridge book')}
        subtitle={L(
          `Cambridge IELTS 09–21 · ${CAM_VOCAB_ALL_BOOKS.length} sách · ${CAM_VOCAB_ANKI_BOOK_COUNT}/12 bộ Anki · ${CAM_VOCAB_PASSAGES} bài đọc · ${(CAM_VOCAB_TOTAL + CAM_VOCAB_ANKI_TOTAL).toLocaleString('vi-VN')} mục`,
          `Cambridge IELTS 09–21 · ${CAM_VOCAB_ALL_BOOKS.length} books · ${CAM_VOCAB_ANKI_BOOK_COUNT}/12 Anki decks · ${CAM_VOCAB_PASSAGES} passages · ${(CAM_VOCAB_TOTAL + CAM_VOCAB_ANKI_TOTAL).toLocaleString('en-US')} items`,
        )}
        icon="book"
      />
      <View style={{ marginTop: 20, paddingTop: 6 }}>
        <Grid columns={4} tabletColumns={3} mobileColumns={2} gap={26}>
          {CAM_VOCAB_ALL_BOOKS.map((b) => (
            <CamVocabCover key={b.n} n={b.n} words={camVocabBookCount(b.n)} onPress={() => router.push(`/vocabulary/cambridge/${b.n}` as never)} />
          ))}
        </Grid>
      </View>
    </Card>
  );
}
