import React, { useEffect, useRef } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';

import { Icon } from '@/components/ui';
import { useReducedMotion } from '@/components/travel/ui/hooks';
import { useL } from '@/i18n/useL';
import { readingFont } from '@/lib/readingFonts';
import type { Scene } from '@/services/history/types';

import { H } from './ui';

/**
 * Dòng thời gian / mục lục: một hàng nốt tròn có số cảnh và mốc ngày, cuộn ngang. Nốt đang xem được tô đặc,
 * nốt đã đọc có dấu tích, nốt đang được thuyết minh có chấm sóng. Bấm một nốt = mở cảnh và nghe từ đầu cảnh.
 */
export function SceneTimeline({
  scenes,
  activeId,
  playingId,
  completed,
  onSelect,
}: {
  scenes: Scene[];
  activeId: string;
  playingId: string | null;
  completed: ReadonlySet<string>;
  onSelect: (id: string) => void;
}) {
  const { L, en } = useL();
  const reduced = useReducedMotion();
  const scroller = useRef<ScrollView>(null);
  const xs = useRef<Record<string, number>>({});

  // Giữ nốt đang xem trong tầm nhìn khi đổi cảnh.
  useEffect(() => {
    const x = xs.current[activeId];
    if (x != null) scroller.current?.scrollTo({ x: Math.max(0, x - 40), animated: !reduced });
  }, [activeId, reduced]);

  return (
    <View accessibilityRole="tablist" accessibilityLabel={L('Dòng thời gian các cảnh', 'Scene timeline')}>
      <ScrollView ref={scroller} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 6, paddingHorizontal: 4 }}>
        {scenes.map((s, i) => {
          const on = s.id === activeId;
          const done = completed.has(s.id);
          const playing = s.id === playingId;
          const label = en ? s.dateLabel.en : s.dateLabel.vi;
          const title = en ? s.titleEn : s.titleVi;
          return (
            <View key={s.id} onLayout={(e) => (xs.current[s.id] = e.nativeEvent.layout.x)} style={{ width: 96, alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', height: 44 }}>
                <View style={{ flex: 1, height: 2, backgroundColor: i === 0 ? 'transparent' : H.rule }} />
                <Pressable
                  accessibilityRole="tab"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={`${L('Cảnh', 'Scene')} ${s.n}: ${title}`}
                  onPress={() => onSelect(s.id)}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: on ? H.accent : done ? H.accentSoft : H.paper,
                    borderWidth: 2,
                    borderColor: on || playing ? H.accent : H.rule,
                    ...(Platform.OS === 'web' ? ({ transition: 'background-color .2s, border-color .2s' } as object) : null),
                  }}
                >
                  {playing ? (
                    <Icon name="volume" size={18} color={on ? '#FFFFFF' : H.accent} strokeWidth={2.2} />
                  ) : done && !on ? (
                    <Icon name="check" size={18} color={H.accent} strokeWidth={2.6} />
                  ) : (
                    <Text style={{ fontFamily: readingFont.sansHeavy, fontSize: 15, color: on ? '#FFFFFF' : H.body }}>{s.n}</Text>
                  )}
                </Pressable>
                <View style={{ flex: 1, height: 2, backgroundColor: i === scenes.length - 1 ? 'transparent' : H.rule }} />
              </View>
              <Text numberOfLines={2} style={{ marginTop: 2, textAlign: 'center', fontFamily: on ? readingFont.sansBold : readingFont.sansMedium, fontSize: 12, lineHeight: 16, color: on ? H.ink : H.muted, paddingHorizontal: 4 }}>
                {label}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
