import React, { useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, ScrollView, Text, View, type ViewToken } from 'react-native';

import { ClipCard } from '@/components/clip/ClipCard';
import { CLIP_CATEGORIES, clipsIn, type ClipCategory, type EnglishClip } from '@/data/english-clips';
import { useL } from '@/i18n/useL';

type Filter = ClipCategory | 'all';

/** Cột feed rộng vừa một video, không theo bề rộng trang. */
const FEED_MAX_WIDTH = 680;

/**
 * Clip tiếng Anh: feed dọc kiểu kênh TikTok luyện tiếng Anh. Cuộn xuống để xem clip kế
 * tiếp; mỗi clip là một video thật trên YouTube, kèm hai từ và một câu hỏi nhỏ.
 */
export default function ClipFeedScreen() {
  const { L } = useL();
  const [filter, setFilter] = useState<Filter>('all');
  const [activeId, setActiveId] = useState<string | null>(null);
  const listRef = useRef<FlatList<EnglishClip>>(null);

  const clips = useMemo(() => clipsIn(filter), [filter]);
  // Clip đang xem: mặc định là clip đầu, và luôn thuộc danh sách đang lọc.
  const playingId = clips.some((c) => c.videoId === activeId) ? activeId : (clips[0]?.videoId ?? null);

  // Clip đang xem là clip chiếm ít nhất 60% màn hình. Callback phải ổn định, nên giữ trong ref.
  const onViewable = useRef(({ viewableItems }: { viewableItems: ViewToken<EnglishClip>[] }) => {
    const top = viewableItems.find((v) => v.isViewable && v.item);
    if (top?.item) setActiveId(top.item.videoId);
  }).current;
  const viewability = useRef({ itemVisiblePercentThreshold: 60 }).current;

  const choose = (f: Filter) => {
    setFilter(f);
    setActiveId(null);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  };

  const header = (
    <View className="gap-3 pb-4" style={{ width: '100%', maxWidth: FEED_MAX_WIDTH, alignSelf: 'center' }}>
      <Text className="font-heavy text-sectionTitle text-ink">{L('Clip tiếng Anh', 'English clips')}</Text>
      <Text className="font-sans text-body text-muted">
        {L('Xem clip, học 2 từ, rồi trả lời 1 câu hỏi nhỏ.', 'Watch a clip, learn two words, then answer one quick question.')}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        <FilterChip label={L('Tất cả', 'All')} active={filter === 'all'} onPress={() => choose('all')} />
        {CLIP_CATEGORIES.map((c) => (
          <FilterChip key={c.key} label={L(c.vi, c.en)} active={filter === c.key} onPress={() => choose(c.key)} />
        ))}
      </ScrollView>
      <Text className="font-strong text-cardTitle text-ink">{L(`${clips.length} clip`, `${clips.length} clips`)}</Text>
    </View>
  );

  return (
    <View className="flex-1">
      <FlatList
        ref={listRef}
        style={{ flex: 1 }}
        data={clips}
        keyExtractor={(c) => c.videoId}
        ListHeaderComponent={header}
        renderItem={({ item }) => (
          <View style={{ width: '100%', maxWidth: FEED_MAX_WIDTH, alignSelf: 'center' }}>
            <ClipCard clip={item} active={item.videoId === playingId} onActivate={() => setActiveId(item.videoId)} />
          </View>
        )}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewable}
        viewabilityConfig={viewability}
      />
    </View>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      className={`rounded-pill border px-3.5 py-2 ${active ? 'border-brand bg-brand' : 'border-border bg-surface'}`}
    >
      <Text className={`font-semi text-body ${active ? 'text-ink' : 'text-muted'}`}>{label}</Text>
    </Pressable>
  );
}
