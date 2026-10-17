import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { HeroStat, LightHero } from '@/components/layout/LightHero';
import { Screen } from '@/components/layout/Screen';
import { ActionCard, BookCover, EmptyNote, Pill, Section, SourceNote } from '@/components/luyen-doc/LuyenDocParts';
import { Button } from '@/components/ui';
import { HScroll } from '@/components/ui/HScroll';
import { AUDIO_PROGRAMS } from '@/data/audio-library';
import {
  LIBRIVOX_BOOKS,
  LIBRIVOX_NGUON,
  WIKI_NGUON,
  NASA_NGUON,
  VIDEO_NEWS,
  VIDEO_NEWS_NGUON,
  VOA_NGUON,
  VOA_VIDEOS,
  NEWS,
  dayLabel,
  formatSeconds,
  groupNewsByDay,
  sectionLabel,
  vnTodayIso,
} from '@/data/luyen-doc';
import { thumbnailUrl } from '@/data/video-library';
import { useL } from '@/i18n/useL';

const go = (href: string) => router.push(href as never);

/** Trang tổng hợp Luyện đọc: tin mới nhất, video VOA, sách nói và các luyện tập có sẵn. */
export default function LuyenDocScreen() {
  const { L } = useL();
  const today = vnTodayIso();
  const latest = groupNewsByDay(NEWS, today)[0];
  const latestItems = (latest?.items ?? []).slice(0, 10);

  return (
    <Screen>
      <LightHero
        badge={L('LUYỆN ĐỌC', 'READING PRACTICE')}
        art="listening"
        line1={L('Đọc và nghe tiếng Anh mỗi ngày', 'Read and listen to English every day')}
        line2={L('tin tức · video · sách nói', 'news · video · audiobooks')}
        subtitle={L('Tin tiếng Anh theo ngày, có ghi nguồn rõ ràng.', 'Daily English news, with clear sources.')}
        footer={
          <>
            <HeroStat value={String(NEWS.length)} label={L('tin', 'news')} />
            <HeroStat value={String(VOA_VIDEOS.length)} label={L('video', 'videos')} />
            <HeroStat value={String(LIBRIVOX_BOOKS.length)} label={L('sách nói', 'audiobooks')} />
          </>
        }
      >
        <View className="flex-row flex-wrap gap-2.5">
          <Button
            label={L('Đọc tin hôm nay', "Read today's news")}
            variant="brand"
            size="lg"
            iconRight="arrow-right"
            onPress={() => go('/luyen-doc/tin')}
          />
          <Button
            label={L('Nghe sách nói', 'Listen to audiobooks')}
            variant="brandOutline"
            size="lg"
            onPress={() => go('/luyen-doc/sach-noi')}
          />
        </View>
      </LightHero>

      <Section
        title={L('Tin mới nhất', 'Latest news')}
        sub={latest ? `${latest.label} · ${WIKI_NGUON.ten} · NASA` : undefined}
        onMore={() => go('/luyen-doc/tin')}
      >
        {latestItems.length === 0 ? (
          <EmptyNote text={L('Chưa có tin. Chạy lại script làm mới tin.', 'No news yet. Run the news refresh script.')} />
        ) : (
          <HScroll contentContainerStyle={{ gap: 12, paddingVertical: 2 }}>
            {latestItems.map((it) => (
              <Pressable
                key={it.id}
                onPress={() => go('/luyen-doc/tin')}
                accessibilityRole="link"
                className="rounded-card border border-border bg-surface p-4"
                style={{ width: 280, gap: 8 }}
              >
                <Pill label={sectionLabel(it.section)} />
                <Text className="font-strong text-body text-ink" numberOfLines={3}>
                  {it.headline}
                </Text>
                {it.details[0] ? (
                  <Text className="font-sans text-label text-muted" numberOfLines={3}>
                    {it.details[0]}
                  </Text>
                ) : null}
              </Pressable>
            ))}
          </HScroll>
        )}
      </Section>

      <Section
        title={L('Video tin tức', 'News videos')}
        sub={L('Vietnam Today và BBC News, nhúng từ YouTube.', 'Vietnam Today and BBC News, embedded from YouTube.')}
      >
        <HScroll contentContainerStyle={{ gap: 12, paddingVertical: 2 }}>
          {VIDEO_NEWS.slice(0, 16).map((v) => (
            <Pressable
              key={v.id}
              onPress={() => go(`/sentence/youtube?v=${v.id}`)}
              accessibilityRole="link"
              className="overflow-hidden rounded-card border border-border bg-surface"
              style={{ width: 240 }}
            >
              <Image source={{ uri: thumbnailUrl(v.id) }} resizeMode="cover" style={{ width: '100%', aspectRatio: 16 / 9 }} />
              <View className="gap-1 p-3">
                <Text className="font-strong text-body text-ink" numberOfLines={2}>
                  {v.title}
                </Text>
                <Text className="font-sans text-label text-subtle">
                  {v.source} · {dayLabel(v.publishedAt, today)}
                  {v.durationSeconds ? ` · ${formatSeconds(v.durationSeconds)}` : ''}
                </Text>
              </View>
            </Pressable>
          ))}
        </HScroll>
      </Section>

      <Section
        title={L('Video VOA', 'VOA videos')}
        sub={L('Nhúng từ YouTube. Dán phụ đề ở màn luyện để chép.', 'Embedded from YouTube. Paste subtitles in the practice screen to dictate.')}
        onMore={() => go('/sentence/videos')}
      >
        <HScroll contentContainerStyle={{ gap: 12, paddingVertical: 2 }}>
          {VOA_VIDEOS.slice(0, 12).map((v) => (
            <Pressable
              key={v.id}
              onPress={() => go(`/sentence/youtube?v=${v.id}`)}
              accessibilityRole="link"
              className="overflow-hidden rounded-card border border-border bg-surface"
              style={{ width: 240 }}
            >
              <Image source={{ uri: thumbnailUrl(v.id) }} resizeMode="cover" style={{ width: '100%', aspectRatio: 16 / 9 }} />
              <View className="gap-1 p-3">
                <Text className="font-strong text-body text-ink" numberOfLines={2}>
                  {v.title}
                </Text>
                <Text className="font-sans text-label text-subtle">
                  {dayLabel(v.publishedAt, today)}
                  {v.durationSeconds ? ` · ${formatSeconds(v.durationSeconds)}` : ''}
                </Text>
              </View>
            </Pressable>
          ))}
        </HScroll>
      </Section>

      <Section
        title={L('Sách nói', 'Audiobooks')}
        sub={L('Sách kinh điển, đọc bởi tình nguyện viên LibriVox.', 'Classic books read by LibriVox volunteers.')}
        onMore={() => go('/luyen-doc/sach-noi')}
      >
        <HScroll contentContainerStyle={{ gap: 12, paddingVertical: 2 }}>
          {LIBRIVOX_BOOKS.map((b) => (
            <Pressable
              key={b.id}
              onPress={() => go(`/luyen-doc/sach-noi/${b.id}`)}
              accessibilityRole="link"
              className="overflow-hidden rounded-card border border-border bg-surface"
              style={{ width: 210 }}
            >
              <BookCover title={b.title} height={130} />
              <View className="gap-1 p-3">
                <Text className="font-sans text-label text-muted" numberOfLines={1}>
                  {b.author}
                </Text>
                <Text className="font-sans text-label text-subtle">
                  {b.level} · {formatSeconds(b.totalSeconds)}
                </Text>
              </View>
            </Pressable>
          ))}
        </HScroll>
      </Section>

      <Section title={L('Phát âm và luyện nghe', 'Pronunciation and listening')}>
        <HScroll contentContainerStyle={{ gap: 12, paddingVertical: 2 }}>
          <ActionCard
            icon="mic"
            title={L('Đọc theo VOA', 'Shadow VOA')}
            text={L('Đọc to theo từng câu', 'Read aloud, sentence by sentence')}
            onPress={() => go('/shadow')}
          />
          <ActionCard
            icon="volume"
            title={L('Podcast VOA', 'VOA podcasts')}
            text={L(`${AUDIO_PROGRAMS.length} chuyên mục có lời`, `${AUDIO_PROGRAMS.length} programs with transcripts`)}
            onPress={() => go('/sentence/audio')}
          />
          <ActionCard
            icon="pencil"
            title={L('Nghe & chép', 'Listen & dictate')}
            text={L('Chép chính tả từ bài nghe', 'Dictate from the listening tracks')}
            onPress={() => go('/sentence')}
          />
          <ActionCard
            icon="languages"
            title={L('Song ngữ', 'Bilingual')}
            text={L('Đọc bài song ngữ theo đoạn', 'Read bilingual articles paragraph by paragraph')}
            onPress={() => go('/bilingual')}
          />
        </HScroll>
      </Section>

      <SourceNote
        lines={[
          `${WIKI_NGUON.ten} · ${WIKI_NGUON.giay_phep}`,
          `${NASA_NGUON.ten} · ${NASA_NGUON.giay_phep}`,
          `${VIDEO_NEWS_NGUON.ten} · ${VIDEO_NEWS_NGUON.giay_phep}`,
          `${VOA_NGUON.ten} · ${VOA_NGUON.giay_phep}`,
          `${LIBRIVOX_NGUON.ten} · ${LIBRIVOX_NGUON.giay_phep}`,
        ]}
      />
    </Screen>
  );
}
