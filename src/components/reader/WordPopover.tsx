import React, { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import * as Speech from 'expo-speech';
import { englishVoice } from '@/services/audio/voice';

import { Icon } from '@/components/ui';
import { readingFont } from '@/lib/readingFonts';
import { lemmatize } from '@/services/dictionary/lookup';
import { offlineGloss } from '@/services/dictionary/offline-glossary';
import { findRich, type RichEntry } from '@/services/dictionary/rich-dictionary';
import { useVocabStore } from '@/store/useVocabStore';

import type { WordPick } from './HoverGloss';

/**
 * Thẻ chi tiết khi BẤM vào một từ trong bài đọc.
 *
 * Neo ngay dưới từ (hoặc trên, nếu gần đáy màn hình) chứ không trồi lên từ đáy
 * như bảng tra cũ: mắt không phải rời chỗ đang đọc. Mọi dữ liệu đã tải sẵn lúc
 * mở bài (`rich-dictionary.ts`), nên thẻ mở ra là có đủ — không có "đang tra".
 *
 * Thứ tự trong thẻ đi từ cái cần nhất: nghĩa tiếng Việt ngay cạnh từ, rồi từ
 * loại và định nghĩa tiếng Anh, câu ví dụ, cuối cùng là từ đồng nghĩa — thứ để
 * mở rộng vốn từ chứ không phải để hiểu câu đang đọc.
 */

const CARD_WIDTH = 340;
// Chàm đậm + hổ phách: cùng họ màu với nút "Kiểm tra" vàng trên thanh công cụ của màn đọc.
const INK = '#1E1B4B';
const LIME = '#FBBF24';
const LIME_SOFT = '#FCD68A';

export function WordPopover({
  pick,
  table,
  articleId,
  articleTitle,
  paragraphIndex,
  onClose,
}: {
  pick: WordPick | null;
  table: Record<string, RichEntry>;
  articleId: string;
  articleTitle: string;
  paragraphIndex: number | null;
  onClose: () => void;
}) {
  const { width: winW, height: winH } = useWindowDimensions();
  const [cardH, setCardH] = useState(0);
  const reduced = useReducedMotion();
  const t = useSharedValue(0);

  const saveWord = useVocabStore((s) => s.saveWord);
  const entries = useVocabStore((s) => s.entries);

  useEffect(() => {
    if (!pick) return;
    t.value = 0;
    t.value = withTiming(1, { duration: reduced ? 0 : 200, easing: Easing.out(Easing.cubic) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pick]);

  useEffect(() => {
    if (!pick || Platform.OS !== 'web') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [pick, onClose]);

  const animated = useAnimatedStyle(() => ({
    opacity: t.value,
    transform: [{ translateY: (1 - t.value) * 8 }, { scale: 0.97 + t.value * 0.03 }],
  }));

  if (!pick) return null;

  const rich = findRich(table, pick.word);
  const basic = offlineGloss(pick.word);
  const meaningVi = rich?.meaningVi ?? basic?.meaningVi ?? '—';
  const pos = rich?.pos ?? basic?.pos ?? '';
  const lemma = lemmatize(pick.word);
  const saved = Object.values(entries).some((e) => e.lemma === lemma && e.articleId === articleId);

  // Vị trí: dưới từ nếu đủ chỗ, không thì lên trên; kẹp trong màn hình.
  const width = Math.min(CARD_WIDTH, winW - 24);
  const left = Math.max(12, Math.min(pick.anchor.x + pick.anchor.width / 2 - width / 2, winW - width - 12));
  const below = pick.anchor.y + pick.anchor.height + 10;
  const fitsBelow = below + cardH <= winH - 12;
  const top = cardH === 0 ? below : fitsBelow ? below : Math.max(12, pick.anchor.y - cardH - 10);

  const speak = (text: string) => {
    Speech.stop();
    Speech.speak(text, { language: 'en-GB', rate: 0.9, voice: englishVoice() });
  };

  const save = () => {
    saveWord({
      word: pick.surface || pick.word,
      lemma,
      phonetic: rich?.ipa ?? null,
      partOfSpeech: pos || null,
      definitionContext: null,
      definitionGeneral: rich?.defEn ?? null,
      definitionVi: meaningVi === '—' ? null : meaningVi,
      exampleSentence: rich?.example ?? null,
      sourceSentence: pick.sentence,
      articleId,
      articleTitle,
      paragraphIndex,
      isCollocation: false,
    });
  };

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Đóng thẻ từ"
        onPress={onClose}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <Animated.View
        onLayout={(e) => setCardH(e.nativeEvent.layout.height)}
        style={[
          {
            position: 'absolute',
            left,
            top,
            width,
            borderRadius: 18,
            backgroundColor: INK,
            padding: 16,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.06)',
            ...(Platform.OS === 'web'
              ? ({ boxShadow: '0 18px 40px rgba(15,23,42,0.35), 0 4px 0 rgba(15,23,42,0.5)' } as object)
              : { elevation: 12 }),
            opacity: cardH === 0 ? 0 : 1,
          },
          animated,
        ]}
      >
        {/* ------------------------------------------------ hàng đầu */}
        <View className="flex-row items-center justify-between">
          <Text style={{ color: LIME, fontSize: 11, fontFamily: readingFont.mono, letterSpacing: 0.5 }}>
            EN{rich?.ipa ? `  ${rich.ipa}` : ''}
          </Text>
          <View className="flex-row items-center gap-3">
            <Text style={{ color: LIME, fontSize: 11, fontFamily: readingFont.mono }}>VI</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Đóng"
              onPress={onClose}
              className="h-7 w-7 items-center justify-center rounded-pill"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
            >
              <Icon name="close" size={13} color="#FFFFFF" strokeWidth={2.2} />
            </Pressable>
          </View>
        </View>

        <View className="mt-1.5 flex-row flex-wrap items-center gap-x-3 gap-y-1">
          <Text
            style={{
              color: '#FFFFFF',
              fontFamily: readingFont.display,
              fontStyle: 'italic',
              fontWeight: '800',
              fontSize: 24,
            }}
          >
            {pick.surface || pick.word}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Nghe phát âm"
            onPress={() => speak(pick.surface || pick.word)}
            className="h-8 w-8 items-center justify-center rounded-pill"
            style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
          >
            <Icon name="volume" size={15} color="#FFFFFF" strokeWidth={2} />
          </Pressable>
          <Text className="font-strong" style={{ color: '#FFFFFF', fontSize: 16, flexShrink: 1 }}>
            {meaningVi}
          </Text>
        </View>

        {/* --------------------------------------------- khối định nghĩa */}
        <View className="mt-3 rounded-panel p-3" style={{ backgroundColor: 'rgba(0,0,0,0.25)' }}>
          {pos ? (
            <View className="self-start rounded-md px-2 py-0.5" style={{ backgroundColor: 'rgba(251,191,36,0.16)' }}>
              <Text className="font-heavy uppercase" style={{ color: LIME, fontSize: 10, letterSpacing: 0.8 }}>
                {posLabel(pos)}
              </Text>
            </View>
          ) : null}

          {rich?.defEn ? (
            <Text className="mt-2 font-strong" style={{ color: '#FFFFFF', fontSize: 14.5, lineHeight: 21 }}>
              {rich.defEn}
            </Text>
          ) : null}
          <Text style={{ color: LIME_SOFT, fontStyle: 'italic', fontFamily: readingFont.body, fontSize: 13.5, marginTop: 4 }}>
            → {meaningVi}
          </Text>

          {rich?.example ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Nghe câu ví dụ"
              onPress={() => speak(rich.example)}
              className="mt-2.5 rounded-md px-3 py-2"
              style={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.04)' }}
            >
              <Text style={{ color: 'rgba(255,255,255,0.78)', fontStyle: 'italic', fontFamily: readingFont.body, fontSize: 13, lineHeight: 19 }}>
                “{rich.example}”
              </Text>
            </Pressable>
          ) : null}

          {rich?.synonyms?.length ? (
            <View className="mt-3">
              <Text className="font-heavy uppercase" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9.5, letterSpacing: 1 }}>
                Từ đồng nghĩa
              </Text>
              <View className="mt-1.5 flex-row flex-wrap gap-1.5">
                {rich.synonyms.map((s) => (
                  <Pressable
                    key={s}
                    accessibilityRole="button"
                    accessibilityLabel={`Nghe từ ${s}`}
                    onPress={() => speak(s)}
                    className="rounded-pill px-2.5 py-1"
                    style={{ backgroundColor: 'rgba(251,191,36,0.12)', borderWidth: 1, borderColor: 'rgba(251,191,36,0.32)' }}
                  >
                    <Text style={{ color: '#FDEBC8', fontSize: 12, fontStyle: 'italic', fontFamily: readingFont.body }}>
                      {s}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}
        </View>

        {/* ------------------------------------------------- nút lưu */}
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: saved }}
          disabled={saved}
          onPress={save}
          className="mt-3.5 flex-row items-center justify-center gap-2 rounded-panel py-3"
          style={{ backgroundColor: saved ? 'rgba(251,191,36,0.18)' : LIME }}
        >
          <Icon name={saved ? 'check' : 'plus'} size={15} color={saved ? LIME : INK} strokeWidth={2.4} />
          <Text className="font-heavy uppercase" style={{ color: saved ? LIME : INK, fontSize: 12.5, letterSpacing: 1.2 }}>
            {saved ? 'Đã lưu vào sổ từ' : 'Lưu từ'}
          </Text>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

function posLabel(pos: string): string {
  const p = pos.replace(/\.$/, '').toLowerCase();
  const map: Record<string, string> = {
    n: 'noun',
    v: 'verb',
    adj: 'adjective',
    adv: 'adverb',
    prep: 'preposition',
    conj: 'conjunction',
    pron: 'pronoun',
    art: 'article',
    num: 'number',
    interj: 'interjection',
    name: 'proper noun',
    phr: 'phrase',
  };
  return map[p] ?? pos;
}
