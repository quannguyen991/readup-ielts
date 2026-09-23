import React, { useEffect, useLayoutEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import { levelLabel, posIpa } from '@/data/study-decks';
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
      <Text className="font-semi text-label uppercase tracking-[1.4px] text-muted">{levelLabel(word.band)}</Text>
      <Text className="mt-3 text-center font-heavy text-hero text-ink">{word.word}</Text>
      <Text className="mt-2 font-sans text-bodyLg text-muted">
        {posIpa(word)}
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

/**
 * Chiều cao thẻ đủ chứa mặt sau — mặt thẻ đặt tuyệt đối nên thẻ không tự co giãn
 * theo nội dung; tính từ những mục thật sự có.
 */
export function detailHeight(word: StudyWord, showWord = false): number {
  let h = 190;
  if (showWord) h += 36;
  if (word.definitionEn) h += word.definitionEn.length > 90 ? 48 : 26;
  if (word.example) h += word.example.length > 80 ? 96 : 74;
  if (word.synonyms?.length) h += 44;
  if (word.antonyms?.length) h += 44;
  if (word.collocation) h += 44;
  return Math.max(340, h);
}

/** Nhãn nhỏ của từng mục trên mặt sau. */
function Label({ children }: { children: string }) {
  return <Text className="mb-1.5 font-strong text-label uppercase tracking-[1.2px] text-muted">{children}</Text>;
}

function Chips({ words, tone, bg }: { words: string[]; tone: string; bg: string }) {
  return (
    <View className="flex-row flex-wrap gap-1.5">
      {words.map((w) => (
        <View key={w} className="rounded-pill px-2.5 py-1" style={{ backgroundColor: bg }}>
          <Text className="font-semi text-label" style={{ color: tone }}>
            {w}
          </Text>
        </View>
      ))}
    </View>
  );
}

/**
 * Mặt sau đầy đủ, CHIA MỤC CÓ NHÃN: nghĩa + định nghĩa ở trên, rồi Ví dụ, Đồng
 * nghĩa, Trái nghĩa, Hay đi cùng — mục nào không có dữ liệu thì không hiện.
 * (Bản trước để câu ví dụ và cụm từ trôi không nhãn, người học không biết đó là gì.)
 */
export function DetailFace({ word, showWord }: { word: StudyWord; showWord?: boolean }) {
  return (
    <View>
      {showWord ? (
        <View className="flex-row items-center justify-center gap-2">
          <Text className="text-center font-heavy text-sectionTitle text-primary-700">
            {word.word} <Text className="font-sans text-body text-muted">{word.ipa}</Text>
          </Text>
          <SpeakButton text={word.word} rate={0.85} size={16} />
        </View>
      ) : null}
      <Text className="mt-1 text-center font-heavy text-pageTitle text-ink">{word.meaningVi}</Text>
      {word.definitionEn ? <Text className="mt-1.5 text-center font-sans text-body text-muted">{word.definitionEn}</Text> : null}

      <View className="mt-4 gap-3.5">
        {word.example ? (
          <View>
            <Label>Ví dụ</Label>
            <View className="rounded-2xl px-4 py-3" style={{ backgroundColor: '#F1F6FF' }}>
              <ExampleLine example={word.example} word={word.word} />
            </View>
          </View>
        ) : null}
        {word.synonyms?.length ? (
          <View>
            <Label>Đồng nghĩa</Label>
            <Chips words={word.synonyms} tone="#15803D" bg="#ECFDF3" />
          </View>
        ) : null}
        {word.antonyms?.length ? (
          <View>
            <Label>Trái nghĩa</Label>
            <Chips words={word.antonyms} tone="#BE123C" bg="#FFF1F2" />
          </View>
        ) : null}
        {word.collocation ? (
          <View>
            <Label>Hay đi cùng</Label>
            <Text className="font-semi text-body text-ink">{word.collocation}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}
