import React, { useEffect, useLayoutEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { CARD_SHADOW, ExampleLine, SpeakButton } from './StudyKit';
import type { StudyWord } from '@/services/vocab/topic-study';

/**
 * Một thẻ hai mặt, xoay quanh trục Y khi lật. Dùng chung cho dải thẻ ở trang bộ
 * từ và phần Lật thẻ của màn Học.
 *
 * Lật bằng shared value của Reanimated (mặt sau quay sẵn 180°), không dùng
 * `entering=` — trên web nó làm trắng trang. Đổi `cardKey` thì thẻ về mặt
 * trước NGAY, không xoay: xoay ngược lúc đổi thẻ sẽ lộ mặt sau của thẻ mới.
 */
export function FlipCard({
  front,
  back,
  flipped,
  onFlip,
  cardKey,
  height = 340,
}: {
  front: React.ReactNode;
  back: React.ReactNode;
  flipped: boolean;
  onFlip: () => void;
  cardKey?: string;
  height?: number;
}) {
  const rot = useSharedValue(flipped ? 1 : 0);

  useLayoutEffect(() => {
    // Shared value của Reanimated vốn là đích gán — xem cùng ngoại lệ ở QuestVisual.
    rot.value = 0;
  }, [cardKey, rot]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    rot.value = withTiming(flipped ? 1 : 0, { duration: 420, easing: Easing.out(Easing.cubic) });
  }, [flipped, rot]);

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1200 }, { rotateY: `${interpolate(rot.value, [0, 1], [0, 180])}deg` }],
  }));
  const backStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1200 }, { rotateY: `${interpolate(rot.value, [0, 1], [180, 360])}deg` }],
  }));

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
    <Pressable accessibilityRole="button" accessibilityLabel="Lật thẻ" onPress={onFlip} style={{ height }}>
      <Animated.View style={[face, frontStyle, { alignItems: 'center', justifyContent: 'center' }]}>{front}</Animated.View>
      <Animated.View style={[face, backStyle, { justifyContent: 'center' }]}>{back}</Animated.View>
    </Pressable>
  );
}

/** Mặt thẻ mang từ tiếng Anh: từ, loại từ, phiên âm. */
export function WordFace({ word, hint }: { word: StudyWord; hint?: string }) {
  return (
    <>
      <Text className="font-semi text-label uppercase tracking-[1.4px] text-muted">Band {word.band}</Text>
      <Text className="mt-3 text-center font-heavy text-hero text-ink">{word.word}</Text>
      <Text className="mt-2 font-sans text-bodyLg text-muted">
        {word.pos} · {word.ipa}
      </Text>
      {hint ? <Text className="absolute bottom-5 font-sans text-label text-subtle">{hint}</Text> : null}
    </>
  );
}

/** Mặt thẻ chỉ có nghĩa tiếng Việt — cho chiều Việt → Anh. */
export function MeaningFace({ word, hint }: { word: StudyWord; hint?: string }) {
  return (
    <>
      <Text className="font-semi text-label uppercase tracking-[1.4px] text-muted">Từ tiếng Anh là gì?</Text>
      <Text className="mt-3 text-center font-heavy text-pageTitle text-ink">{word.meaningVi}</Text>
      <Text className="mt-2 font-sans text-bodyLg text-muted">{word.pos}</Text>
      {hint ? <Text className="absolute bottom-5 font-sans text-label text-subtle">{hint}</Text> : null}
    </>
  );
}

/** Mặt thẻ chỉ có giọng đọc và phiên âm — cho chiều nghe. */
export function ListenFace({ word, hint }: { word: StudyWord; hint?: string }) {
  return (
    <>
      <Text className="font-semi text-label uppercase tracking-[1.4px] text-muted">Nghe và đoán từ</Text>
      <View className="mt-4">
        <SpeakButton text={word.word} rate={0.85} size={26} />
      </View>
      <Text className="mt-3 font-sans text-sectionTitle text-muted">{word.ipa}</Text>
      {hint ? <Text className="absolute bottom-5 font-sans text-label text-subtle">{hint}</Text> : null}
    </>
  );
}

/** Mặt sau đầy đủ: từ, nghĩa, định nghĩa, ví dụ, cụm đi kèm. */
export function DetailFace({ word, showWord }: { word: StudyWord; showWord?: boolean }) {
  return (
    <>
      {showWord ? (
        <Text className="text-center font-heavy text-sectionTitle text-primary-700">
          {word.word} <Text className="font-sans text-body text-muted">{word.ipa}</Text>
        </Text>
      ) : null}
      <Text className="mt-1 text-center font-heavy text-pageTitle text-ink">{word.meaningVi}</Text>
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
    </>
  );
}
