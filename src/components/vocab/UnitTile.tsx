import React from 'react';
import { Platform, Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/ui';
import { useL } from '@/i18n/useL';
import type { DeckProgress } from '@/services/vocab/deck-library';

/**
 * Ô BỘ TỪ dạng thư mục màu: nhãn nguồn ở tai thư mục, số từ thật to, vài từ đầu bộ và thanh tiến độ.
 * Một ô nhìn là biết bộ nào, bao nhiêu từ, học tới đâu — không cần đọc đoạn mô tả.
 */

const WEB = Platform.OS === 'web';

/** Tám cặp màu đậm (chữ trắng đọc rõ), xếp xen kẽ nên hai ô kề nhau không trùng màu. */
export const TILE_TONES: readonly (readonly [string, string])[] = [
  ['#D97706', '#B45309'],
  ['#2563EB', '#1D4ED8'],
  ['#0D9488', '#0F766E'],
  ['#DB2777', '#BE185D'],
  ['#7C3AED', '#6D28D9'],
  ['#65A30D', '#4D7C0F'],
  ['#EA580C', '#C2410C'],
  ['#0891B2', '#0E7490'],
];

export function UnitTile({
  index,
  tag,
  title,
  words,
  total,
  progress,
  onPress,
}: {
  index: number;
  /** Chữ ở tai thư mục, ví dụ "OXFORD 3000". */
  tag: string;
  title: string;
  /** Vài từ đầu bộ để người học đoán được nội dung. */
  words: readonly string[];
  total: number;
  progress: DeckProgress;
  onPress: () => void;
}) {
  const { L } = useL();
  const [from, to] = TILE_TONES[index % TILE_TONES.length] ?? TILE_TONES[0]!;
  const done = progress.mastered;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const learning = progress.learning;
  const complete = total > 0 && done >= total;

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${title}, ${total} ${L('từ', 'words')}, ${pct}%`}
      onPress={onPress}
      style={({ hovered, pressed }: { hovered?: boolean; pressed?: boolean }) =>
        ({
          height: '100%',
          minHeight: 168,
          marginTop: 12,
          borderRadius: 22,
          borderTopLeftRadius: 8,
          padding: 14,
          paddingTop: 16,
          overflow: 'visible',
          backgroundColor: from,
          backgroundImage: `linear-gradient(145deg, ${from}, ${to})`,
          boxShadow: hovered ? `0 14px 28px ${to}55` : `0 6px 16px ${to}33`,
          transform: [{ translateY: pressed ? 1 : hovered ? -4 : 0 }],
          transition: WEB ? 'transform 180ms cubic-bezier(0.2,0.8,0.2,1), box-shadow 180ms ease' : undefined,
        }) as never
      }
    >
      {/* Tai thư mục */}
      <View
        pointerEvents="none"
        style={{ position: 'absolute', left: 0, top: -11, width: 64, height: 14, borderTopLeftRadius: 8, borderTopRightRadius: 12, backgroundColor: to }}
      />
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <View style={{ flexShrink: 1, minWidth: 0, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, backgroundColor: 'rgba(255,255,255,0.22)' }}>
          <Text numberOfLines={1} style={{ fontSize: 12, fontFamily: 'Nunito_700Bold', letterSpacing: 0.8, color: '#FFFFFF' }}>{tag}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
          <Text style={{ fontSize: 34, lineHeight: 36, fontFamily: 'Nunito_700Bold', color: '#FFFFFF' }}>{total}</Text>
          <Text style={{ fontSize: 12, fontFamily: 'Nunito_700Bold', color: 'rgba(255,255,255,0.85)' }}>{L('TỪ', 'WORDS')}</Text>
        </View>
      </View>

      <Text numberOfLines={2} style={{ marginTop: 10, fontSize: 17, lineHeight: 22, fontFamily: 'Nunito_700Bold', color: '#FFFFFF' }}>{title}</Text>
      {words.length ? (
        <Text numberOfLines={1} style={{ fontFamily: 'Nunito_400Regular', marginTop: 3, fontSize: 13, color: 'rgba(255,255,255,0.88)' }}>{words.slice(0, 3).join(' · ')}</Text>
      ) : null}

      <View style={{ flex: 1 }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 }}>
        <View style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.28)', overflow: 'hidden', flexDirection: 'row' }}>
          <View style={{ width: `${total ? (done / total) * 100 : 0}%`, backgroundColor: '#FFFFFF' }} />
          <View style={{ width: `${total ? (learning / total) * 100 : 0}%`, backgroundColor: 'rgba(255,255,255,0.6)' }} />
        </View>
        {complete ? (
          <Icon name="check" size={16} color="#FFFFFF" strokeWidth={3} />
        ) : (
          <Text style={{ fontSize: 13, fontFamily: 'Nunito_700Bold', color: '#FFFFFF' }}>{done}/{total}</Text>
        )}
      </View>

      <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, borderRadius: 22, borderTopLeftRadius: 8, overflow: 'hidden' }}>
        <View style={{ position: 'absolute', right: -22, bottom: -22, width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(255,255,255,0.12)' }} />
      </View>
    </Pressable>
  );
}
