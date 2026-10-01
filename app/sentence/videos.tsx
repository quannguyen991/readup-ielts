import React, { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { Grid } from '@/components/layout/Grid';
import { HeroStat, LightHero } from '@/components/layout/LightHero';
import { Screen } from '@/components/layout/Screen';
import { Badge, Button, Card, Icon } from '@/components/ui';
import {
  VIDEO_LEVELS,
  VIDEO_TOPICS,
  filterVideos,
  formatDuration,
  getLibraryVideo,
  thumbnailUrl,
  videoLibraryStats,
  type LibraryVideo,
} from '@/data/video-library';
import { preparedList, useVideoTranscriptStore } from '@/store/useVideoTranscriptStore';
import { color } from '@/theme/tokens';
import { useL } from '@/i18n/useL';

/** Tên chủ đề bản tiếng Anh (dữ liệu gốc ở seed/video-library giữ tiếng Việt). */
const TOPIC_EN: Record<string, string> = {
  'Tiếng Anh hằng ngày': 'Everyday English',
  'Phỏng vấn đường phố': 'Street interviews',
  'Khoa học': 'Science',
  'Kiến thức phổ thông': 'General knowledge',
  'Thiên nhiên': 'Nature',
  'Bài nói': 'Talks',
  'Thời sự và xã hội': 'News & society',
  'Kinh tế và hạ tầng': 'Economy & infrastructure',
};

/**
 * Thư viện video luyện nghe.
 *
 * NÓI THẲNG GIỚI HẠN NGAY TRÊN ĐẦU, không giấu xuống cuối. App không tự lấy được
 * phụ đề từ YouTube (đo cả hai đường, xem `video-library.ts`), nên mỗi video phải
 * dán phụ đề một lần. Hứa "bấm là học" rồi để người ta đâm vào ô dán ở màn sau
 * là cách nhanh nhất khiến họ nghĩ app hỏng.
 *
 * Đổi lại, dán một lần là xong: mục "Đang luyện dở" ở trên cùng gom những video
 * đã chuẩn bị, vào là làm tiếp ngay.
 */
export default function VideoLibraryScreen() {
  const { L, en } = useL();
  const [level, setLevel] = useState('all');
  const [topic, setTopic] = useState('all');
  const [search, setSearch] = useState('');

  const stats = useMemo(() => videoLibraryStats(), []);
  const videos = useMemo(() => filterVideos({ level, topic, search }), [level, topic, search]);

  const saved = useVideoTranscriptStore((s) => s.videos);
  const prepared = useMemo(() => preparedList(saved), [saved]);

  return (
    <Screen>
      <LightHero
        badge="LISTENING VIDEO LIBRARY" art="listening"
        line1={L('Thư viện video', 'Video library')}
        line2={L('nghe câu thật, chép lại', 'hear real sentences, write them down')}
        subtitle={L(`${stats.videos} video từ ${stats.channels} kênh, chia theo trình độ. Nghe từng câu rồi chép lại, hoặc chuyển sang phần nghe hiểu để làm đề sinh từ chính phụ đề video đó.`, `${stats.videos} videos from ${stats.channels} channels, sorted by level. Listen to each sentence and write it down, or switch to comprehension for a quiz built from that video's subtitles.`)}
        footer={
          <>
            <HeroStat value={String(stats.videos)} label="video" />
            <HeroStat value={String(stats.channels)} label={L('kênh', 'channels')} />
            <HeroStat value={String(prepared.length)} label={L('đã chuẩn bị', 'prepared')} />
          </>
        }
      >
        <Button label={L('Tìm video', 'Find a video')} variant="brand" size="lg" iconRight="arrow-right" onPress={() => setSearch('')} />
      </LightHero>

      <View className="mt-4 flex-row items-start gap-2.5 rounded-panel border border-warning bg-warning-soft p-3.5">
        <Icon name="info" size={17} color={color.warning} strokeWidth={2} />
        <Text className="min-w-0 flex-1 font-sans text-body text-warning-ink" style={{ lineHeight: 22 }}>
          {L('YouTube không cho lấy phụ đề tự động nữa, nên lần đầu mở một video bạn cần dán phụ đề vào — mở video trên YouTube, bấm', "YouTube no longer lets apps fetch subtitles automatically, so the first time you open a video you need to paste them in — open the video on YouTube, tap")}{' '}
          <Text className="font-strong">…more</Text> →{' '}
          <Text className="font-strong">Show transcript</Text>
          {L(', chép rồi dán. Chỉ phải làm một lần cho mỗi video; app nhớ lại cho những lần sau.', ', copy it and paste. You only do this once per video; the app remembers it next time.')}
        </Text>
      </View>

      {prepared.length > 0 ? (
        <View className="mt-6">
          <Text className="font-strong text-cardTitle text-ink">{L('Đang luyện dở', 'In progress')}</Text>
          <Text className="mt-1 font-sans text-body text-muted">
            {L(`${prepared.length} video đã chuẩn bị phụ đề — vào là làm tiếp ngay.`, `${prepared.length} videos with subtitles ready — jump right back in.`)}
          </Text>
          <View className="mt-3">
            <Grid columns={4} tabletColumns={2} mobileColumns={1} gap={14}>
              {prepared.slice(0, 8).map((p) => {
                // Tra lại tên thật trong thư viện. Trước đây chỗ này dựng thẻ
                // với title `Video <id>`, nên người đã chuẩn bị 5 video sẽ thấy
                // 5 thẻ mang tên kiểu "Video pEO9-iPZQWA" — đúng ngay ở mục
                // MỜI họ quay lại. Chỉ giữ dạng đó khi video không còn trong
                // thư viện (đã gỡ khỏi seed nhưng người học vẫn còn dữ liệu).
                const meta = getLibraryVideo(p.videoId);
                return (
                  <VideoCard
                    key={p.videoId}
                    video={
                      meta ?? {
                        id: p.videoId,
                        title: `Video ${p.videoId}`,
                        channel: L('Không còn trong thư viện', 'No longer in the library'),
                        level: '',
                        topic: '',
                        durationSeconds: null,
                      }
                    }
                    progress={L(`${p.doneCount}/${p.sentences.length} câu`, `${p.doneCount}/${p.sentences.length} sentences`)}
                  />
                );
              })}
            </Grid>
          </View>
        </View>
      ) : null}

      <Card className="mt-6">
        <View className="flex-row items-center gap-2 rounded-panel border border-border bg-surface px-3 py-2">
          <Icon name="search" size={16} color={color.subtle} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={L('Tìm theo tên video hoặc kênh…', 'Search by video or channel…')}
            placeholderTextColor={color.subtle}
            className="min-w-0 flex-1 font-sans text-body text-ink"
          />
        </View>

        <Text className="mb-1.5 mt-4 font-semi uppercase tracking-wide text-subtle" style={{ fontSize: 10 }}>
          {L('Trình độ', 'Level')}
        </Text>
        <View className="flex-row flex-wrap gap-1.5">
          <Chip label={L('Tất cả', 'All')} active={level === 'all'} onPress={() => setLevel('all')} />
          {VIDEO_LEVELS.map((l) => (
            <Chip key={l} label={l} active={level === l} onPress={() => setLevel(level === l ? 'all' : l)} />
          ))}
        </View>

        <Text className="mb-1.5 mt-4 font-semi uppercase tracking-wide text-subtle" style={{ fontSize: 10 }}>
          {L('Chủ đề', 'Topic')}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-1.5 py-0.5">
            <Chip label={L('Tất cả', 'All')} active={topic === 'all'} onPress={() => setTopic('all')} />
            {VIDEO_TOPICS.map((t) => (
              <Chip key={t} label={en ? (TOPIC_EN[t] ?? t) : t} active={topic === t} onPress={() => setTopic(topic === t ? 'all' : t)} />
            ))}
          </View>
        </ScrollView>
      </Card>

      <Text className="mt-5 font-strong text-cardTitle text-ink">{L(`${videos.length} video`, `${videos.length} videos`)}</Text>

      <View className="mt-3">
        <Grid columns={4} tabletColumns={2} mobileColumns={1} gap={14}>
          {videos.map((v) => (
            <VideoCard key={v.id} video={v} prepared={Boolean(saved[v.id])} />
          ))}
        </Grid>
      </View>

      {videos.length === 0 ? (
        <Card className="mt-3">
          <Text className="font-sans text-body text-muted">
            {L('Không có video nào khớp. Bỏ bớt bộ lọc hoặc đổi từ khoá tìm.', 'No videos match. Remove a filter or try another search.')}
          </Text>
        </Card>
      ) : null}
    </Screen>
  );
}

function VideoCard({
  video,
  prepared,
  progress,
}: {
  video: LibraryVideo;
  prepared?: boolean;
  progress?: string;
}) {
  const { L, en } = useL();
  const s = video.durationSeconds;
  const duration = en && s !== null ? (s < 60 ? 'under 1 min' : `${Math.round(s / 60)} min`) : formatDuration(s);

  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => router.push(`/sentence/youtube?v=${video.id}` as never)}
      className="h-full overflow-hidden rounded-card border border-border bg-surface"
      style={({ pressed }) => (pressed ? { opacity: 0.92 } : undefined)}
    >
      {/*
        Ảnh giữ đúng tỉ lệ 16:9 bằng aspectRatio, không đặt chiều cao cứng: đặt
        cứng thì ở cột hẹp ảnh bị méo, mà thumbnail méo trông như ảnh hỏng.
      */}
      <View style={{ aspectRatio: 16 / 9, backgroundColor: color.surfaceAlt }}>
        <Image
          source={{ uri: thumbnailUrl(video.id) }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
        {duration ? (
          <View className="absolute bottom-2 right-2 rounded-pill bg-black/70 px-2 py-0.5">
            <Text className="font-strong text-white" style={{ fontSize: 10 }}>
              {duration}
            </Text>
          </View>
        ) : null}
      </View>

      <View className="flex-1 p-3.5">
        <Text className="font-strong text-body text-ink" numberOfLines={2} style={{ lineHeight: 21 }}>
          {video.title}
        </Text>
        <Text className="mt-1 font-sans text-label text-muted" numberOfLines={1}>
          {video.channel}
        </Text>

        <View className="mt-2.5 flex-row flex-wrap items-center gap-1.5">
          {video.level ? <Badge label={video.level} tone="neutral" /> : null}
          {progress ? <Badge label={progress} tone="success" /> : null}
          {prepared && !progress ? <Badge label={L('đã có phụ đề', 'subtitles ready')} tone="success" /> : null}
        </View>
      </View>
    </Pressable>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      aria-selected={active}
      className={[
        'rounded-pill border px-3 py-1.5',
        active ? 'border-primary-600 bg-primary-600' : 'border-border bg-surface',
      ].join(' ')}
    >
      <Text className={['font-semi text-label', active ? 'text-white' : 'text-muted'].join(' ')}>
        {label}
      </Text>
    </Pressable>
  );
}
