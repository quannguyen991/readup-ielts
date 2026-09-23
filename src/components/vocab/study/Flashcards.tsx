import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { CARD_SHADOW, ExampleLine, SpeakButton, useHotkeys } from './StudyKit';
import { Icon } from '@/components/ui/Icon';
import { seededRng, shuffled, type StudyWord } from '@/services/vocab/topic-study';
import { color } from '@/theme/tokens';

/**
 * Thẻ ghi nhớ lật được, đặt ngay trên trang bộ từ.
 *
 * Mặt trước: từ, loại từ, phiên âm. Mặt sau: nghĩa tiếng Việt, định nghĩa
 * tiếng Anh, câu ví dụ, cụm hay đi kèm. Lật bằng bấm vào thẻ, Space hoặc Enter;
 * ← → để chuyển thẻ.
 *
 * Lật bằng shared value của Reanimated (xoay quanh trục Y, mặt sau quay sẵn
 * 180°), không dùng `entering=` — trên web nó làm trắng trang.
 */
export function Flashcards<W extends StudyWord>({
  words,
  savedWords,
  onSave,
}: {
  words: W[];
  savedWords: Set<string>;
  onSave: (w: W) => void;
}) {
  const [order, setOrder] = useState<'original' | 'shuffled'>('original');
  const [seed, setSeed] = useState(1);
  const list = useMemo(() => (order === 'original' ? words : shuffled(words, seededRng(seed))), [order, words, seed]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const rot = useSharedValue(0);

  useEffect(() => {
    rot.value = withTiming(flipped ? 1 : 0, { duration: 420, easing: Easing.out(Easing.cubic) });
  }, [flipped, rot]);

  const word = list[index];
  const go = (d: number) => {
    setFlipped(false);
    // Về mặt trước NGAY, không xoay: xoay ngược lúc đổi thẻ sẽ lộ mặt sau của thẻ mới.
    // Shared value của Reanimated vốn là đích gán — xem cùng ngoại lệ ở QuestVisual.
    // eslint-disable-next-line react-hooks/immutability
    rot.value = 0;
    setIndex((i) => (i + d + list.length) % list.length);
  };

  useHotkeys((e) => {
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.key === 'ArrowRight') go(1);
    else if (e.key === 'ArrowLeft') go(-1);
    else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      setFlipped((f) => !f);
    }
  });

  const front = useAnimatedStyle(() => ({
    transform: [{ perspective: 1200 }, { rotateY: `${interpolate(rot.value, [0, 1], [0, 180])}deg` }],
  }));
  const back = useAnimatedStyle(() => ({
    transform: [{ perspective: 1200 }, { rotateY: `${interpolate(rot.value, [0, 1], [180, 360])}deg` }],
  }));

  if (!word) return null;
  const saved = savedWords.has(word.word.toLowerCase());

  const face = {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backfaceVisibility: 'hidden' as const,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    padding: 28,
    ...(CARD_SHADOW as object),
  };

  return (
    <View>
      <Pressable accessibilityRole="button" accessibilityLabel="Lật thẻ" onPress={() => setFlipped((f) => !f)} style={{ height: 340 }}>
        <Animated.View style={[face, front, { alignItems: 'center', justifyContent: 'center' }]}>
          <Text className="font-semi text-label uppercase tracking-[1.4px] text-muted">Band {word.band}</Text>
          <Text className="mt-3 text-center font-heavy text-hero text-ink">{word.word}</Text>
          <Text className="mt-2 font-sans text-bodyLg text-muted">
            {word.pos} · {word.ipa}
          </Text>
          <Text className="absolute bottom-5 font-sans text-label text-subtle">Bấm thẻ hoặc Space để lật</Text>
        </Animated.View>
        <Animated.View style={[face, back, { justifyContent: 'center' }]}>
          <Text className="text-center font-heavy text-pageTitle text-ink">{word.meaningVi}</Text>
          <Text className="mt-2 text-center font-sans text-body text-muted">{word.definitionEn}</Text>
          {word.example ? (
            <View className="mt-5 rounded-2xl px-4 py-3" style={{ backgroundColor: '#F1F6FF' }}>
              <ExampleLine example={word.example} word={word.word} />
            </View>
          ) : null}
          {word.collocation ? (
            <Text className="mt-3 text-center font-sans text-body text-muted">
              Hay đi cùng: <Text className="font-semi text-ink">{word.collocation}</Text>
            </Text>
          ) : null}
        </Animated.View>
      </Pressable>

      {/* Hàng điều khiển dưới thẻ. */}
      <View className="mt-4 flex-row items-center justify-between gap-2">
        <View className="flex-row items-center gap-2">
          <SpeakButton text={word.word} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={saved ? 'Đã lưu vào sổ từ' : 'Lưu vào sổ từ'}
            onPress={() => !saved && onSave(word)}
            className="h-10 flex-row items-center gap-1.5 rounded-pill px-3"
            style={{ backgroundColor: saved ? '#ECFDF3' : '#F1F5F9' }}
          >
            <Icon name={saved ? 'check' : 'bookmark'} size={16} color={saved ? '#16A34A' : '#475569'} />
            <Text className="font-semi text-label" style={{ color: saved ? '#16A34A' : '#475569' }}>
              {saved ? 'Đã lưu' : 'Lưu'}
            </Text>
          </Pressable>
        </View>

        <View className="flex-row items-center gap-2">
          <NavBtn icon="chevron-left" onPress={() => go(-1)} label="Thẻ trước" />
          <Text className="min-w-[72px] text-center font-semi text-body text-ink">
            {index + 1} / {list.length}
          </Text>
          <NavBtn icon="chevron-right" onPress={() => go(1)} label="Thẻ sau" />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Trộn thẻ"
          onPress={() => {
            setOrder((o) => (o === 'original' ? 'shuffled' : 'original'));
            setSeed((s) => s + 1);
            setIndex(0);
            setFlipped(false);
          }}
          className="h-10 flex-row items-center gap-1.5 rounded-pill px-3"
          style={{ backgroundColor: order === 'shuffled' ? '#EAF1FF' : '#F1F5F9' }}
        >
          <Icon name="refresh" size={15} color={order === 'shuffled' ? color.primary : '#475569'} />
          <Text className="font-semi text-label" style={{ color: order === 'shuffled' ? color.primary : '#475569' }}>
            {order === 'shuffled' ? 'Đã trộn' : 'Trộn'}
          </Text>
        </Pressable>
      </View>
      <Text className="mt-3 text-center font-sans text-label" style={{ color: '#1E293B' }}>
        Phím tắt: ← → chuyển thẻ · Space / Enter lật thẻ
      </Text>
    </View>
  );
}

function NavBtn({ icon, onPress, label }: { icon: 'chevron-left' | 'chevron-right'; onPress: () => void; label: string }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} className="h-10 w-10 items-center justify-center rounded-pill bg-white" style={CARD_SHADOW}>
      <Icon name={icon} size={18} color={color.ink} />
    </Pressable>
  );
}
