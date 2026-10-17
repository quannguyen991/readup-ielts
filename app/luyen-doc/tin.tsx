import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';

import { LightHero } from '@/components/layout/LightHero';
import { Screen } from '@/components/layout/Screen';
import { Chip, EmptyNote, Pill, SourceNote } from '@/components/luyen-doc/LuyenDocParts';
import { Icon } from '@/components/ui/Icon';
import { HScroll } from '@/components/ui/HScroll';
import {
  NASA_NGUON,
  NEWS,
  NEWS_LEVEL_LABEL,
  WIKI_NGUON,
  groupNewsByDay,
  isoToVi,
  newsSections,
  sectionLabel,
  vnTodayIso,
} from '@/data/luyen-doc';
import { useL } from '@/i18n/useL';
import { speakLines, type SpokenLine } from '@/services/audio/pronounce';
import type { NewsItem } from '@/data/luyen-doc';

/**
 * Tin tiếng Anh theo ngày. Bấm Nghe để đọc tin bằng giọng máy trên thiết bị (không tốn
 * phí API). Đọc dừng khi rời trang hoặc khi bấm Dừng.
 */
export default function TinHangNgayScreen() {
  const { L } = useL();
  const today = useMemo(() => vnTodayIso(), []);
  const sections = useMemo(() => newsSections(NEWS), []);
  const [section, setSection] = useState('all');
  const [playing, setPlaying] = useState<string | null>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const days = useMemo(() => groupNewsByDay(NEWS, today, section), [today, section]);

  // Dừng đọc khi rời trang, để giọng không tiếp tục sau khi người học đã đi chỗ khác.
  useEffect(() => () => stopRef.current?.(), []);

  const listen = (it: NewsItem) => {
    stopRef.current?.();
    stopRef.current = null;
    if (playing === it.id) {
      setPlaying(null);
      return;
    }
    const lines: SpokenLine[] = [
      { text: it.headline, rate: 0.9, pauseMs: 350 },
      ...it.details.map((d) => ({ text: d, rate: 0.9, pauseMs: 250 })),
    ];
    setPlaying(it.id);
    stopRef.current = speakLines(lines, {
      onEnd: () => setPlaying((p) => (p === it.id ? null : p)),
    });
  };

  return (
    <Screen>
      <LightHero
        badge={L('TIN HẰNG NGÀY', 'DAILY NEWS')}
        art="listening"
        line1={L('Tin tiếng Anh theo ngày', 'English news by day')}
        line2={L('đọc to, nghe, chọn ý để nhớ', 'listen, read aloud, pick the points to remember')}
        subtitle={L('Bấm Nghe để đọc tin bằng giọng máy.', 'Tap Listen to hear the news read aloud.')}
      />

      <SourceNote
        lines={[`${WIKI_NGUON.ten} · ${WIKI_NGUON.giay_phep}`, `${NASA_NGUON.ten} · ${NASA_NGUON.giay_phep}`,`${L('Độ khó ước lượng', 'Estimated level')}: ${NEWS_LEVEL_LABEL}`]}
      />

      <View className="mt-6">
        <HScroll contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
          <Chip label={L('Tất cả', 'All')} active={section === 'all'} onPress={() => setSection('all')} />
          {sections.map((s) => (
            <Chip key={s} label={sectionLabel(s)} active={section === s} onPress={() => setSection(s)} />
          ))}
        </HScroll>
      </View>

      {days.length === 0 ? (
        <View className="mt-6">
          <EmptyNote text={L('Chưa có tin cho mục này.', 'No news for this section yet.')} />
        </View>
      ) : null}

      {days.map((d) => (
        <View key={d.date} className="mt-7 gap-3">
          <View className="flex-row items-baseline gap-2">
            <Text className="font-heavy text-cardTitle text-ink">{d.label}</Text>
            <Text className="font-sans text-label text-subtle">
              {d.items.length} {L('tin', 'news')}
              {d.label !== isoToVi(d.date) ? ` · ${isoToVi(d.date)}` : ''}
            </Text>
          </View>
          {d.items.map((it) => (
            <NewsCard key={it.id} item={it} playing={playing === it.id} onListen={() => listen(it)} />
          ))}
        </View>
      ))}
    </Screen>
  );
}

function NewsCard({ item, playing, onListen }: { item: NewsItem; playing: boolean; onListen: () => void }) {
  const { L } = useL();
  return (
    <View className="gap-3 rounded-card border border-border bg-surface p-4">
      <Pill label={sectionLabel(item.section)} />
      <Text className="font-strong text-cardTitle text-ink">{item.headline}</Text>
      {item.details.map((d, i) => (
        <Text key={`${item.id}-${i}`} className="font-sans text-body text-muted">
          {d}
        </Text>
      ))}
      <View className="mt-1 flex-row flex-wrap items-center justify-between gap-3">
        <Pressable
          onPress={onListen}
          accessibilityRole="button"
          accessibilityLabel={playing ? L('Dừng đọc', 'Stop reading') : L('Nghe tin', 'Listen to news')}
          className={`flex-row items-center gap-2 rounded-pill border px-4 py-2 ${
            playing ? 'border-primary bg-brand-soft' : 'border-primary bg-surface'
          }`}
        >
          <Icon name={playing ? 'close' : 'volume'} size={16} color="#8F6E36" />
          <Text className="font-semi text-label text-primary">{playing ? L('Dừng', 'Stop') : L('Nghe', 'Listen')}</Text>
        </Pressable>
        <Pressable onPress={() => Linking.openURL(item.sourceUrl)} accessibilityRole="link" className="flex-row items-center gap-1.5">
          <Text className="font-sans text-label text-subtle">{item.source === 'nasa' ? L('Nguồn · NASA', 'Source · NASA') : L('Nguồn · CC BY-SA 4.0', 'Source · CC BY-SA 4.0')}</Text>
          <Icon name="arrow-right" size={13} color="#94A3B8" />
        </Pressable>
      </View>
    </View>
  );
}
