import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { Grid } from '@/components/layout/Grid';
import { HeroStat, LightHero } from '@/components/layout/LightHero';
import { Screen } from '@/components/layout/Screen';
import { Badge, Button, Card, Icon } from '@/components/ui';
import {
  AUDIO_LEVELS,
  AUDIO_NGUON,
  AUDIO_TOPICS,
  audioLibraryStats,
  estimateMinutes,
  filterAudio,
  formatLength,
  type LibraryAudio,
} from '@/data/audio-library';
import { color } from '@/theme/tokens';
import { useL } from '@/i18n/useL';

/** Tên chủ đề bản tiếng Anh (dữ liệu gốc ở seed/audio-library giữ tiếng Việt). */
const TOPIC_EN: Record<string, string> = {
  'Tiếng Anh hằng ngày': 'Everyday English',
  'Thời sự và xã hội': 'News & society',
  'Kiến thức phổ thông': 'General knowledge',
  'Khoa học': 'Science',
  'Bài nói': 'Talks',
};

/**
 * Thư viện nghe có sẵn lời.
 *
 * Điểm khác duy nhất so với Thư viện video, và là cả lý do màn này tồn tại:
 * **không phải dán gì cả**. Lời đọc đã nằm sẵn trong app vì nguồn VOA Learning
 * English thuộc phạm vi công cộng.
 *
 * Vẫn nói rõ giới hạn ngay trên đầu, y như thư viện video — chỉ là một giới hạn
 * khác: giọng ở đây đọc CHẬM hơn tốc độ nói tự nhiên. Luyện mãi trên tài liệu
 * đọc chậm rồi tưởng mình đã nghe được là một cách hỏng thi rất êm ái, nên chỗ
 * này phải nói trước chứ không phải để người học tự phát hiện trong phòng thi.
 */
export default function AudioLibraryScreen() {
  const { L, en } = useL();
  const [level, setLevel] = useState('all');
  const [topic, setTopic] = useState('all');
  const [search, setSearch] = useState('');

  const stats = useMemo(() => audioLibraryStats(), []);
  const items = useMemo(() => filterAudio({ level, topic, search }), [level, topic, search]);

  return (
    <Screen>
      <LightHero
        badge="LISTENING AUDIO LIBRARY" art="listening"
        line1={L('Thư viện nghe', 'Listening library')}
        line2={L('nghe rồi chỉ ra bằng chứng', 'listen, then point to the evidence')}
        subtitle={L(`${stats.items} bài nghe từ ${stats.programs} chuyên mục, đã có sẵn lời đọc — bấm vào là làm được ngay, không phải dán gì.`, `${stats.items} listening tracks from ${stats.programs} programs, transcripts included — tap and start, nothing to paste.`)}
        footer={
          <>
            <HeroStat value={String(stats.items)} label={L('bài nghe', 'tracks')} />
            <HeroStat value={String(stats.programs)} label={L('chuyên mục', 'programs')} />
          </>
        }
      >
        <Button label={L('Bắt đầu nghe', 'Start listening')} variant="brand" size="lg" iconRight="arrow-right" onPress={() => setSearch('')} />
      </LightHero>

      <View className="mt-4 flex-row items-start gap-2.5 rounded-panel border border-border bg-surface p-3.5">
        <Icon name="info" size={17} color={color.subtle} strokeWidth={2} />
        <Text className="min-w-0 flex-1 font-sans text-body text-muted" style={{ lineHeight: 22 }}>
          {L('Giọng đọc ở đây là giọng Mỹ, ', 'The voices here are American, ')}<Text className="font-strong">{L('đọc chậm hơn tốc độ tự nhiên', 'read more slowly than natural speech')}</Text>{' '}
          {L(
            `theo chủ ý sư phạm của ${AUDIO_NGUON.ten}. Rất hợp để bắt đầu, nhưng không thay được việc nghe người bản xứ nói ở tốc độ thật — phần đó vẫn ở`,
            `on purpose, as ${AUDIO_NGUON.ten} intends for teaching. Great for getting started, but no substitute for hearing native speakers at real speed — that's still in the`,
          )}{' '}
          <Text
            className="font-strong text-primary-600"
            onPress={() => router.push('/sentence/videos' as never)}
          >
            {L('Thư viện video', 'Video library')}
          </Text>
          {L('. Nhãn trình độ là xếp tương đối giữa các chuyên mục với nhau, không phải thang CEFR chuẩn.', '. Level labels rank the programs relative to each other — they are not official CEFR levels.')}
        </Text>
      </View>

      <Card className="mt-6">
        <View className="flex-row items-center gap-2 rounded-panel border border-border bg-surface px-3 py-2">
          <Icon name="search" size={16} color={color.subtle} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={L('Tìm theo tên bài hoặc chuyên mục…', 'Search by title or program…')}
            placeholderTextColor={color.subtle}
            className="min-w-0 flex-1 font-sans text-body text-ink"
          />
        </View>

        <Text className="mb-1.5 mt-4 font-semi uppercase tracking-wide text-subtle" style={{ fontSize: 12 }}>
          {L('Trình độ', 'Level')}
        </Text>
        <View className="flex-row flex-wrap gap-1.5">
          <Chip label={L('Tất cả', 'All')} active={level === 'all'} onPress={() => setLevel('all')} />
          {AUDIO_LEVELS.map((l) => (
            <Chip
              key={l}
              label={`${l} · ${stats.byLevel[l] ?? 0}`}
              active={level === l}
              onPress={() => setLevel(level === l ? 'all' : l)}
            />
          ))}
        </View>

        <Text className="mb-1.5 mt-4 font-semi uppercase tracking-wide text-subtle" style={{ fontSize: 12 }}>
          {L('Chủ đề', 'Topic')}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-1.5 py-0.5">
            <Chip label={L('Tất cả', 'All')} active={topic === 'all'} onPress={() => setTopic('all')} />
            {AUDIO_TOPICS.map((t) => (
              <Chip key={t} label={en ? (TOPIC_EN[t] ?? t) : t} active={topic === t} onPress={() => setTopic(topic === t ? 'all' : t)} />
            ))}
          </View>
        </ScrollView>
      </Card>

      <Text className="mt-5 font-strong text-cardTitle text-ink">{L(`${items.length} bài nghe`, `${items.length} tracks`)}</Text>

      <View className="mt-3">
        <Grid columns={3} tabletColumns={2} mobileColumns={1} gap={14}>
          {items.map((a) => (
            <AudioCard key={a.id} item={a} />
          ))}
        </Grid>
      </View>

      {items.length === 0 ? (
        <Card className="mt-3">
          <Text className="font-sans text-body text-muted">
            {L('Không có bài nào khớp. Bỏ bớt bộ lọc hoặc đổi từ khoá tìm.', 'Nothing matches. Remove a filter or try another search.')}
          </Text>
        </Card>
      ) : null}

      <View className="mt-6 rounded-panel border border-border bg-surface p-3.5">
        <Text className="font-semi uppercase tracking-wide text-subtle" style={{ fontSize: 12 }}>
          {L('Nguồn', 'Source')}
        </Text>
        <Text className="mt-1 font-sans text-label text-muted" style={{ lineHeight: 19 }}>
          {L(
            `Toàn bộ âm thanh và lời đọc lấy từ ${AUDIO_NGUON.ten} (${AUDIO_NGUON.trang}). ${AUDIO_NGUON.giay_phep} — được dùng lại kèm ghi nguồn.`,
            `All audio and transcripts come from ${AUDIO_NGUON.ten} (${AUDIO_NGUON.trang}). Public domain (a work of the US federal government) — reused with attribution.`,
          )}
        </Text>
      </View>
    </Screen>
  );
}

function AudioCard({ item }: { item: LibraryAudio }) {
  const { L } = useL();
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => router.push(`/sentence/listen?a=${item.id}` as never)}
      className="h-full rounded-card border border-border bg-surface p-4"
      style={({ pressed }) => (pressed ? { opacity: 0.92 } : undefined)}
    >
      <View className="flex-row items-center gap-2">
        <View className="h-8 w-8 items-center justify-center rounded-pill bg-primary-50">
          <Icon name="play" size={15} color={color.primary} />
        </View>
        <Text className="min-w-0 flex-1 font-sans text-label text-muted" numberOfLines={1}>
          {item.program}
        </Text>
      </View>

      <Text className="mt-3 font-strong text-body text-ink" numberOfLines={3} style={{ lineHeight: 21 }}>
        {item.title}
      </Text>

      <View className="mt-auto flex-row flex-wrap items-center gap-1.5 pt-3">
        <Badge label={item.level} tone="neutral" />
        <Badge label={L(formatLength(item.words), `~${estimateMinutes(item.words)} min`)} tone="neutral" />
        <Badge label={L('có sẵn lời', 'transcript')} tone="success" />
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
        'items-center justify-center rounded-pill border px-3 py-1.5',
        active ? 'border-primary-600 bg-primary-600' : 'border-border bg-surface',
      ].join(' ')}
      style={{ minHeight: 44 }}
    >
      <Text className={['font-semi text-label', active ? 'text-white' : 'text-muted'].join(' ')}>
        {label}
      </Text>
    </Pressable>
  );
}
