import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Grid } from '@/components/layout/Grid';
import { HeroStat, LightHero } from '@/components/layout/LightHero';
import { Screen } from '@/components/layout/Screen';
import { BookCover, Pill, SourceNote } from '@/components/luyen-doc/LuyenDocParts';
import { LIBRIVOX_BOOKS, LIBRIVOX_NGUON, formatSeconds } from '@/data/luyen-doc';
import { useL } from '@/i18n/useL';

/** Danh sách sách nói. Bấm vào sách để mở danh sách chương và trình phát. */
export default function SachNoiScreen() {
  const { L } = useL();
  const chapters = LIBRIVOX_BOOKS.reduce((s, b) => s + b.chapters.length, 0);
  const hours = Math.round(LIBRIVOX_BOOKS.reduce((s, b) => s + b.totalSeconds, 0) / 3600);

  return (
    <Screen>
      <LightHero
        badge={L('SÁCH NÓI', 'AUDIOBOOKS')}
        art="listening"
        line1={L('Nghe sách kinh điển', 'Listen to classic books')}
        line2={L('đọc bởi tình nguyện viên', 'read by volunteers')}
        subtitle={L('Sách thuộc phạm vi công cộng, ghi tên người đọc.', 'Public-domain books, with reader credits.')}
        footer={
          <>
            <HeroStat value={String(LIBRIVOX_BOOKS.length)} label={L('sách', 'books')} />
            <HeroStat value={String(chapters)} label={L('chương', 'chapters')} />
            <HeroStat value={`~${hours}`} label={L('giờ nghe', 'hours')} />
          </>
        }
      />

      <View className="mt-6">
        <Grid columns={3} tabletColumns={2} mobileColumns={1} gap={14}>
          {LIBRIVOX_BOOKS.map((b) => (
            <Pressable
              key={b.id}
              onPress={() => router.push(`/luyen-doc/sach-noi/${b.id}` as never)}
              accessibilityRole="link"
              className="h-full overflow-hidden rounded-card border border-border bg-surface"
            >
              <BookCover title={b.title} height={170} />
              <View className="gap-2 p-4">
                <Pill label={b.level} level={b.level} />
                <Text className="font-strong text-body text-ink" numberOfLines={2}>
                  {b.title}
                </Text>
                <Text className="font-sans text-label text-muted" numberOfLines={1}>
                  {b.author}
                </Text>
                <Text className="font-sans text-label text-subtle">
                  {b.chapters.length} {L('chương', 'chapters')} · {formatSeconds(b.totalSeconds)}
                </Text>
                <Text className="font-sans text-label text-subtle" numberOfLines={1}>
                  {L('Đọc bởi', 'Read by')} {b.readers.slice(0, 2).join(', ')}
                </Text>
              </View>
            </Pressable>
          ))}
        </Grid>
      </View>

      <SourceNote lines={[`${LIBRIVOX_NGUON.ten} · ${LIBRIVOX_NGUON.giay_phep}`]} />
    </Screen>
  );
}
