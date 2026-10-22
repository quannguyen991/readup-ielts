import React, { useEffect, useMemo, useState } from 'react';
import { Linking, Platform, Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { LightHero } from '@/components/layout/LightHero';
import { Screen } from '@/components/layout/Screen';
import { EmptyNote, Pill, SourceNote } from '@/components/luyen-doc/LuyenDocParts';
import { Button, Card } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { LIBRIVOX_BOOKS, LIBRIVOX_NGUON, formatSeconds, type Book } from '@/data/luyen-doc';
import { useL } from '@/i18n/useL';

/**
 * Chi tiết một sách nói: danh sách chương và trình phát. Trên web dùng trình phát có
 * sẵn của trình duyệt; trên thiết bị khác mở chương ở trình duyệt, vì app chưa có trình
 * phát native cho mục này.
 */
export default function SachNoiChiTietScreen() {
  const { L } = useL();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const book = useMemo<Book | undefined>(() => LIBRIVOX_BOOKS.find((b) => b.id === id), [id]);
  const [index, setIndex] = useState(0);

  // Đổi sách thì bắt đầu lại từ chương đầu.
  useEffect(() => {
    setIndex(0);
  }, [id]);

  if (!book || book.chapters.length === 0) {
    return (
      <Screen>
        <EmptyNote text={L('Không tìm thấy sách này.', 'This book was not found.')} />
        <View className="mt-4">
          <Button
            label={L('Về danh sách sách nói', 'Back to audiobooks')}
            variant="brandOutline"
            size="lg"
            onPress={() => router.replace('/luyen-doc/sach-noi' as never)}
          />
        </View>
      </Screen>
    );
  }

  const last = book.chapters.length - 1;
  const current = book.chapters[Math.min(index, last)] ?? book.chapters[0];
  if (!current) return null;

  return (
    <Screen>
      <LightHero
        badge={L('SÁCH NÓI', 'AUDIOBOOK')}
        art="listening"
        line1={book.title}
        line2={book.author}
        subtitle={L(
          `${book.chapters.length} chương · ${formatSeconds(book.totalSeconds)}`,
          `${book.chapters.length} chapters · ${formatSeconds(book.totalSeconds)}`,
        )}
      />

      <Card className="mt-6 gap-3">
        <Pill label={book.level} level={book.level} />
        <Text className="font-strong text-cardTitle text-ink">
          {current.title || L(`Chương ${current.n}`, `Chapter ${current.n}`)}
        </Text>
        {current.reader ? (
          <Text className="font-sans text-label text-muted">{L(`Đọc bởi ${current.reader}`, `Read by ${current.reader}`)}</Text>
        ) : null}
        <ChapterPlayer key={current.url} url={current.url} onEnded={() => setIndex((i) => Math.min(i + 1, last))} />
      </Card>

      <View className="mt-5 gap-2">
        {book.chapters.map((c, i) => {
          const on = i === index;
          return (
            <Pressable
              key={c.url}
              onPress={() => setIndex(i)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              className={`flex-row items-center gap-3 rounded-panel border px-4 py-3 ${
                on ? 'border-brand bg-brand-soft' : 'border-border bg-surface'
              }`}
            >
              <Text className="font-strong text-body text-primary" style={{ width: 28 }}>
                {c.n}
              </Text>
              <View className="min-w-0 flex-1">
                <Text className="font-sans text-body text-ink" numberOfLines={1}>
                  {c.title || L(`Chương ${c.n}`, `Chapter ${c.n}`)}
                </Text>
                <Text className="font-sans text-label text-subtle">{formatSeconds(c.seconds)}</Text>
              </View>
              {on ? <Icon name="volume" size={16} color="#6A4BD9" /> : null}
            </Pressable>
          );
        })}
      </View>

      <SourceNote
        lines={[`${LIBRIVOX_NGUON.ten} · ${LIBRIVOX_NGUON.giay_phep}`, `${L('Đọc bởi', 'Read by')}: ${book.readers.join(', ')}`]}
        link={book.sourceUrl}
      />
    </Screen>
  );
}

/** Trình phát một chương. Web: thẻ audio của trình duyệt; nơi khác: mở ở trình duyệt. */
function ChapterPlayer({ url, onEnded }: { url: string; onEnded: () => void }) {
  const { L } = useL();
  if (Platform.OS === 'web') {
    return React.createElement('audio', {
      src: url,
      controls: true,
      preload: 'metadata',
      onEnded,
      style: { width: '100%' },
    });
  }
  return (
    <Button
      label={L('Mở chương trên trình duyệt', 'Open chapter in browser')}
      variant="brand"
      size="lg"
      iconRight="arrow-right"
      onPress={() => Linking.openURL(url)}
    />
  );
}
