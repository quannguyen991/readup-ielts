import React, { useEffect, useLayoutEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import { levelLabel, posIpa } from '@/data/study-decks';
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { CARD_SHADOW, SpeakButton } from './StudyKit';
import { ExampleSentence } from '@/components/vocab/ExampleSentence';
import { SkyEffect } from '@/components/effects/SkyEffect';
import type { StudyWord } from '@/services/vocab/topic-study';
import { useL } from '@/i18n/useL';
import { useStudyTheme } from './useStudyTheme';
import { playSfx } from '@/services/audio/sfx-ui';

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
  const { L } = useL();
  const rot = useSharedValue(flipped ? 1 : 0);

  useLayoutEffect(() => {
    // Shared value của Reanimated vốn là đích gán — xem cùng ngoại lệ ở QuestVisual.
    rot.value = 0;
  }, [cardKey, rot]);

  const firstFlip = React.useRef(true);
  useEffect(() => {
    if (firstFlip.current) firstFlip.current = false;
    else playSfx('flip');
    // eslint-disable-next-line react-hooks/immutability
    rot.value = withTiming(flipped ? 1 : 0, { duration: 420, easing: Easing.out(Easing.cubic) });
  }, [flipped, rot]);

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1200 }, { rotateY: `${interpolate(rot.value, [0, 1], [0, 180])}deg` }],
  }));
  const backStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1200 }, { rotateY: `${interpolate(rot.value, [0, 1], [180, 360])}deg` }],
  }));

  const theme = useStudyTheme();
  const face = {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backfaceVisibility: 'hidden' as const,
    borderRadius: 24,
    backgroundColor: theme.card,
    borderWidth: theme.cardBorder === 'transparent' ? 0 : 1,
    borderColor: theme.cardBorder,
    padding: 28,
    overflow: 'hidden' as const,
    ...(CARD_SHADOW as object),
  };

  return (
    <Pressable accessibilityLabel={L('Lật thẻ', 'Flip card')} onPress={onFlip} style={{ height }}>
      {/* Bầu trời sáng có sao băng: mặt trước đủ, mặt sau nhạt cho dễ đọc chữ. */}
      <Animated.View style={[face, frontStyle, { alignItems: 'center', justifyContent: 'center' }]}>
        {theme.id === 'scene' ? <SkyEffect /> : null}
        {front}
      </Animated.View>
      <Animated.View style={[face, backStyle, { justifyContent: 'center' }]}>
        {theme.id === 'scene' ? <SkyEffect intensity={0.45} /> : null}
        {back}
      </Animated.View>
    </Pressable>
  );
}

/** Mặt thẻ mang từ tiếng Anh: từ, loại từ, phiên âm. */
export function WordFace({ word, hint }: { word: StudyWord; hint?: string }) {
  return (
    <>
      <Text className="font-semi text-label text-muted">{levelLabel(word.band)}</Text>
      <Text className="mt-3 text-center font-strong text-hero text-ink">{word.word}</Text>
      <Text className="mt-2 font-sans text-bodyLg text-muted">
        {posIpa(word)}
      </Text>
      {hint ? <Text className="absolute bottom-5 font-sans text-label text-subtle">{hint}</Text> : null}
    </>
  );
}

/** Mặt thẻ chỉ có nghĩa tiếng Việt — cho chiều Việt → Anh. */
export function MeaningFace({ word, hint }: { word: StudyWord; hint?: string }) {
  const { L } = useL();
  return (
    <>
      <Text className="font-semi text-label text-muted">{L('Từ tiếng Anh là gì?', "What's the English word?")}</Text>
      <Text className="mt-3 text-center font-strong text-pageTitle text-ink">{word.meaningVi}</Text>
      <Text className="mt-2 font-sans text-bodyLg text-muted">{word.pos}</Text>
      {hint ? <Text className="absolute bottom-5 font-sans text-label text-subtle">{hint}</Text> : null}
    </>
  );
}

/** Mặt thẻ chỉ có giọng đọc và phiên âm — cho chiều nghe. */
export function ListenFace({ word, hint }: { word: StudyWord; hint?: string }) {
  const { L } = useL();
  return (
    <>
      <Text className="font-semi text-label text-muted">{L('Nghe và đoán từ', 'Listen and guess the word')}</Text>
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
  let h = 170;
  if (showWord) h += 36;
  if (word.example) h += word.example.length > 80 ? 82 : 62;
  if (word.synonyms?.length) h += 40;
  if (word.antonyms?.length) h += 40;
  if (word.collocation) h += 40;
  return Math.max(320, h);
}

/** Nhãn nhỏ của từng mục trên mặt sau. */
function Label({ children }: { children: string }) {
  return <Text className="mb-1 font-sans text-label text-muted">{children}</Text>;
}

function Chips({ words }: { words: string[] }) {
  const theme = useStudyTheme();
  return (
    <View className="flex-row flex-wrap gap-1.5">
      {words.map((w) => (
        <View key={w} className="rounded-pill px-2.5 py-0.5" style={{ backgroundColor: theme.chipBg }}>
          <Text className="font-mid text-label" style={{ color: theme.chipInk }}>{w}</Text>
        </View>
      ))}
    </View>
  );
}

/**
 * Mặt sau đầy đủ, CHIA MỤC CÓ NHÃN: nghĩa tiếng Việt ở trên (bỏ định nghĩa tiếng
 * Anh theo ý người dùng, 24/09/2026), rồi Ví dụ, Đồng
 * nghĩa, Trái nghĩa, Hay đi cùng — mục nào không có dữ liệu thì không hiện.
 * (Bản trước để câu ví dụ và cụm từ trôi không nhãn, người học không biết đó là gì.)
 */
export function DetailFace({ word, showWord }: { word: StudyWord; showWord?: boolean }) {
  const { L } = useL();
  return (
    <View>
      {showWord ? (
        <View className="flex-row items-center justify-center gap-2">
          <Text className="text-center font-strong text-sectionTitle text-primary-700">
            {word.word} <Text className="font-sans text-body text-muted">{word.ipa}</Text>
          </Text>
          <SpeakButton text={word.word} rate={0.85} size={16} />
        </View>
      ) : null}
      <Text className="mt-1 text-center font-strong text-sectionTitle text-ink">{word.meaningVi}</Text>

      <View className="mt-3 gap-2.5">
        {word.example ? (
          <View>
            <Label>{L('Ví dụ', 'Example')}</Label>
            <ExampleSentence example={word.example} word={word.word} />
          </View>
        ) : null}
        {word.synonyms?.length ? (
          <View>
            <Label>{L('Đồng nghĩa', 'Synonyms')}</Label>
            <Chips words={word.synonyms} />
          </View>
        ) : null}
        {word.antonyms?.length ? (
          <View>
            <Label>{L('Trái nghĩa', 'Antonyms')}</Label>
            <Chips words={word.antonyms} />
          </View>
        ) : null}
        {word.collocation ? (
          <View>
            <Label>{L('Hay đi cùng', 'Collocations')}</Label>
            <Text className="font-mid text-body text-ink">{word.collocation}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}
