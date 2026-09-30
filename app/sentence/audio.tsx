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
  filterAudio,
  formatLength,
  type LibraryAudio,
} from '@/data/audio-library';
import { color } from '@/theme/tokens';

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
  const [level, setLevel] = useState('all');
  const [topic, setTopic] = useState('all');
  const [search, setSearch] = useState('');

  const stats = useMemo(() => audioLibraryStats(), []);
  const items = useMemo(() => filterAudio({ level, topic, search }), [level, topic, search]);

  return (
    <Screen>
      <LightHero
        badge="LISTENING AUDIO LIBRARY" art="listening"
        line1="Thư viện nghe"
        line2="nghe rồi chỉ ra bằng chứng"
        subtitle={`${stats.items} bài nghe từ ${stats.programs} chuyên mục, đã có sẵn lời đọc — bấm vào là làm được ngay, không phải dán gì.`}
        footer={
          <>
            <HeroStat value={String(stats.items)} label="bài nghe" />
            <HeroStat value={String(stats.programs)} label="chuyên mục" />
          </>
        }
      >
        <Button label="Bắt đầu nghe" variant="brand" size="lg" iconRight="arrow-right" onPress={() => setSearch('')} />
      </LightHero>

      <View className="mt-4 flex-row items-start gap-2.5 rounded-panel border border-border bg-surface p-3.5">
        <Icon name="info" size={17} color={color.subtle} strokeWidth={2} />
        <Text className="min-w-0 flex-1 font-sans text-body text-muted" style={{ lineHeight: 22 }}>
          Giọng đọc ở đây là giọng Mỹ, <Text className="font-strong">đọc chậm hơn tốc độ tự nhiên</Text>{' '}
          theo chủ ý sư phạm của {AUDIO_NGUON.ten}. Rất hợp để bắt đầu, nhưng không thay được việc
          nghe người bản xứ nói ở tốc độ thật — phần đó vẫn ở{' '}
          <Text
            className="font-strong text-primary-600"
            onPress={() => router.push('/sentence/videos' as never)}
          >
            Thư viện video
          </Text>
          . Nhãn trình độ là xếp tương đối giữa các chuyên mục với nhau, không phải thang CEFR chuẩn.
        </Text>
      </View>

      <Card className="mt-6">
        <View className="flex-row items-center gap-2 rounded-panel border border-border bg-surface px-3 py-2">
          <Icon name="search" size={16} color={color.subtle} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Tìm theo tên bài hoặc chuyên mục…"
            placeholderTextColor={color.subtle}
            className="min-w-0 flex-1 font-sans text-body text-ink"
          />
        </View>

        <Text className="mb-1.5 mt-4 font-semi uppercase tracking-wide text-subtle" style={{ fontSize: 10 }}>
          Trình độ
        </Text>
        <View className="flex-row flex-wrap gap-1.5">
          <Chip label="Tất cả" active={level === 'all'} onPress={() => setLevel('all')} />
          {AUDIO_LEVELS.map((l) => (
            <Chip
              key={l}
              label={`${l} · ${stats.byLevel[l] ?? 0}`}
              active={level === l}
              onPress={() => setLevel(level === l ? 'all' : l)}
            />
          ))}
        </View>

        <Text className="mb-1.5 mt-4 font-semi uppercase tracking-wide text-subtle" style={{ fontSize: 10 }}>
          Chủ đề
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-1.5 py-0.5">
            <Chip label="Tất cả" active={topic === 'all'} onPress={() => setTopic('all')} />
            {AUDIO_TOPICS.map((t) => (
              <Chip key={t} label={t} active={topic === t} onPress={() => setTopic(topic === t ? 'all' : t)} />
            ))}
          </View>
        </ScrollView>
      </Card>

      <Text className="mt-5 font-strong text-cardTitle text-ink">{items.length} bài nghe</Text>

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
            Không có bài nào khớp. Bỏ bớt bộ lọc hoặc đổi từ khoá tìm.
          </Text>
        </Card>
      ) : null}

      <View className="mt-6 rounded-panel border border-border bg-surface p-3.5">
        <Text className="font-semi uppercase tracking-wide text-subtle" style={{ fontSize: 10 }}>
          Nguồn
        </Text>
        <Text className="mt-1 font-sans text-label text-muted" style={{ lineHeight: 19 }}>
          Toàn bộ âm thanh và lời đọc lấy từ {AUDIO_NGUON.ten} ({AUDIO_NGUON.trang}).{' '}
          {AUDIO_NGUON.giay_phep} — được dùng lại kèm ghi nguồn.
        </Text>
      </View>
    </Screen>
  );
}

function AudioCard({ item }: { item: LibraryAudio }) {
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
        <Badge label={formatLength(item.words)} tone="neutral" />
        <Badge label="có sẵn lời" tone="success" />
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
