import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Grid } from '@/components/layout/Grid';
import { Screen } from '@/components/layout/Screen';
import { Appear } from '@/components/motion/Motion';
import { Button, Card, SectionHeader } from '@/components/ui';
import { DeckCard } from '@/components/vocab/DeckCard';
import { deckLook } from '@/components/vocab/deck-style';
import { BOOK_VOCAB_DECKS } from '@/data/vocab-topics';
import { BOOK_PART_SEP, bookPartRanges } from '@/services/vocab/book-parts';
import { deckProgress } from '@/services/vocab/deck-library';
import { studiedLemmas } from '@/services/vocab/topic-fsrs';
import { useTopicStudyStore } from '@/store/useTopicStudyStore';
import { useVocabStore } from '@/store/useVocabStore';
import { useL } from '@/i18n/useL';
import type { VocabTopic } from '@/data/vocab-topics';

/**
 * Trang một sách từ vựng: mỗi phần 30–50 từ là một thẻ bộ từ, cùng kiểu thẻ với
 * các unit ở thư viện. Chạm một phần mở đúng trang bộ từ (`/vocabulary/topic/<phần>`)
 * nên có đủ các chế độ học, tiến độ và kiểm tra như mọi bộ khác.
 */
export default function BookPartsPage() {
  const { L, en } = useL();
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  const book = BOOK_VOCAB_DECKS.find((d) => d.slug === slug);
  const stages = useTopicStudyStore((s) => s.stages);
  const lastAt = useTopicStudyStore((s) => s.lastAt);
  const entries = useVocabStore((s) => s.entries);
  const cards = useVocabStore((s) => s.cards);
  const now = useMemo(() => new Date(), []);
  const studied = useMemo(() => studiedLemmas({ entries, cards }), [entries, cards]);

  if (!book) {
    return (
      <Screen>
        <Card>
          <Text className="font-strong text-cardTitle text-ink">{L('Không có sách này', 'Book not found')}</Text>
          <Button className="mt-3 self-start" label={L('Về thư viện từ vựng', 'Back to vocabulary')} onPress={() => router.push('/vocabulary/topics' as never)} />
        </Card>
      </Screen>
    );
  }

  return <BookParts book={book} L={L} en={en} stages={stages} lastAt={lastAt} studied={studied} now={now} />;
}

function BookParts({
  book,
  L,
  en,
  stages,
  lastAt,
  studied,
  now,
}: {
  book: VocabTopic;
  L: (vi: string, en: string) => string;
  en: boolean;
  stages: ReturnType<typeof useTopicStudyStore.getState>['stages'];
  lastAt: ReturnType<typeof useTopicStudyStore.getState>['lastAt'];
  studied: ReturnType<typeof studiedLemmas>;
  now: Date;
}) {
  const ranges = bookPartRanges(book.words.length);
  const look = deckLook(book.slug);

  const items = ranges.map((r, i) => {
    const n = i + 1;
    const partSlug = `${book.slug}${BOOK_PART_SEP}${n}`;
    const words = book.words.slice(r.start, r.end);
    const preview = words.slice(0, 3).map((w) => w.word).join(', ');
    const progress = deckProgress(words, stages[partSlug], lastAt?.[partSlug], studied);
    return (
      <Appear key={partSlug} index={Math.min(i, 8)} style={{ height: '100%' }}>
        <DeckCard
          title={en ? `Part ${n}` : `Phần ${n}`}
          subtitle={`${words.length} ${en ? 'words' : 'từ'} · ${preview}`}
          progress={progress}
          accent={look.accent}
          icon={look.icon}
          sourceLabel={en ? look.sourceLabelEn : look.sourceLabel}
          now={now}
          onPress={() => router.push(`/vocabulary/topic/${partSlug}` as never)}
        />
      </Appear>
    );
  });

  return (
    <Screen>
      <Appear>
        <Button className="mb-3 self-start" variant="ghost" size="sm" iconLeft="chevron-left" label={L('Thư viện từ vựng', 'Vocabulary library')} onPress={() => router.push('/vocabulary/topics' as never)} />
        <SectionHeader
          title={en ? book.name : book.nameVi}
          subtitle={L(`${book.words.length} từ · ${ranges.length} phần, mỗi phần 30–50 từ`, `${book.words.length} words · ${ranges.length} parts, 30–50 words each`)}
          icon="book"
        />
      </Appear>
      <View className="mt-3">
        <Grid columns={4} tabletColumns={3} mobileColumns={2} gap={14}>
          {items}
        </Grid>
      </View>
    </Screen>
  );
}
