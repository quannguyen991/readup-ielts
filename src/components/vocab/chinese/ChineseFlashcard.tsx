import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';

import { useAutoPronounce } from '@/services/audio/pronounce';
import { speak, useHotkeys } from '@/components/vocab/study/StudyKit';
import type { StudyWord, WordStage } from '@/services/vocab/topic-study';
import { ZH_ART } from './art';
import { HANZI_FAMILY, HEAD_FAMILY, RADIUS, ZH, ZH_TONE, toneLabel, toneOf } from './palette';

const RATINGS: { stage: WordStage; label: string; key: string; bg: string; ink: string }[] = [
  { stage: 0, label: 'Quên', key: '1', bg: ZH.dangerSoft, ink: ZH.seal },
  { stage: 1, label: 'Mơ hồ', key: '2', bg: ZH.goldSoftBg, ink: '#8A5E1C' },
  { stage: 2, label: 'Nhớ rồi', key: '3', bg: ZH.sageSoft, ink: ZH.sage },
];

/**
 * Thẻ học chữ Hán, KHÔNG có khung riêng: nằm trong tờ giấy của trang bài.
 *
 * Một khối "sân khấu" duy nhất chứa cả mặt trước lẫn mặt sau, nên thẻ không nhảy kích thước.
 * Mặt trước: chữ lớn trong ô tập viết, pinyin đổi màu theo thanh điệu. Bấm để lật.
 * Mặt sau: nghĩa, câu ví dụ có tô đậm từ đang học, và ba nút chấm mức nhớ.
 *
 * Phím tắt (web): ← → đổi thẻ, Space/Enter lật, 1/2/3 chấm mức nhớ khi đã lật.
 */
export function ChineseFlashcard({
  word,
  index,
  total,
  stage,
  starred,
  saved,
  onPrev,
  onNext,
  onRate,
  onStar,
  onSave,
}: {
  word: StudyWord;
  index: number;
  total: number;
  stage: WordStage | undefined;
  starred: boolean;
  saved: boolean;
  onPrev: () => void;
  onNext: () => void;
  onRate: (stage: WordStage) => void;
  onStar: () => void;
  onSave: () => void;
}) {
  const [flipped, setFlipped] = useState(false);
  useEffect(() => setFlipped(false), [word.word, index]);
  useAutoPronounce(word.word, `zh-${index}-${word.word}`, 'zh');

  useHotkeys((e) => {
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.key === 'ArrowRight') onNext();
    else if (e.key === 'ArrowLeft') onPrev();
    else if (e.key === ' ' || e.code === 'Space' || e.key === 'Enter') {
      e.preventDefault();
      setFlipped((f) => !f);
    } else if (flipped && (e.key === '1' || e.key === '2' || e.key === '3')) {
      onRate((Number(e.key) - 1) as WordStage);
    }
  });

  const py = word.romanization || word.ipa;
  const tone = toneOf(py);
  const toneColor = ZH_TONE[tone];
  const long = word.word.length > 1;

  return (
    <View style={{ gap: 12 }}>
      {/* Dòng trên: cấp, số thẻ, và hai thao tác phụ (sao, lưu sổ) */}
      <View className="flex-row items-center justify-between" style={{ gap: 8 }}>
        <View className="flex-row items-center" style={{ gap: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#7A5A22' }}>{word.band || 'HSK'}</Text>
          <Text style={{ fontSize: 12, color: ZH.mist }}>·</Text>
          <Text style={{ fontSize: 12, color: ZH.ink2 }}>
            <Text style={{ fontWeight: '700', color: ZH.ink }}>{index + 1}</Text> / {total}
          </Text>
          {stage === 2 ? <Text style={{ fontSize: 12, color: ZH.sage, fontWeight: '600' }}>· đã nhớ</Text> : null}
        </View>
        <View className="flex-row" style={{ gap: 6 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={starred ? 'Bỏ đánh dấu sao' : 'Đánh dấu sao'}
            onPress={onStar}
            style={{ height: 30, paddingHorizontal: 10, borderRadius: RADIUS.control, borderWidth: 1, borderColor: ZH.line, backgroundColor: starred ? ZH.goldSoftBg : ZH.card, justifyContent: 'center' }}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', color: starred ? '#8A5E1C' : ZH.ink2 }}>{starred ? '★ Đã sao' : '☆ Sao'}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={onSave}
            style={{ height: 30, paddingHorizontal: 10, borderRadius: RADIUS.control, borderWidth: 1, borderColor: ZH.line, backgroundColor: saved ? ZH.sageSoft : ZH.card, justifyContent: 'center' }}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', color: saved ? ZH.sage : ZH.ink2 }}>{saved ? 'Đã lưu sổ' : 'Lưu sổ'}</Text>
          </Pressable>
        </View>
      </View>

      {/* Sân khấu thẻ: một khối cho cả hai mặt, không nhảy kích thước */}
      <View
        style={{
          borderRadius: RADIUS.block,
          borderWidth: 1,
          borderColor: ZH.line,
          backgroundColor: ZH.cream2,
          paddingHorizontal: 22,
          paddingVertical: 22,
          minHeight: 340,
          justifyContent: 'center',
        }}
      >
        {!flipped ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Lật thẻ để xem nghĩa"
            onPress={() => setFlipped(true)}
            style={{ alignItems: 'center', gap: 14 }}
          >
            <View style={{ width: 168, height: 168, borderRadius: 12, borderWidth: 1.5, borderColor: ZH.seal, backgroundColor: ZH.card, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <View style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 1, backgroundColor: '#EAD9CD', pointerEvents: 'none' }} />
              <View style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 1, backgroundColor: '#EAD9CD', pointerEvents: 'none' }} />
              <Text style={{ fontFamily: HANZI_FAMILY, fontSize: long ? 74 : 132, lineHeight: long ? 90 : 146, color: ZH.ink }}>{word.word}</Text>
            </View>
            <Text style={{ fontSize: 24, fontWeight: '600', color: toneColor }}>{py}</Text>
            <Text style={{ fontSize: 12, color: ZH.mist }}>{word.pos ? `${word.pos} · ` : ''}{toneLabel(tone)} · chạm để lật</Text>
          </Pressable>
        ) : (
          <View style={{ gap: 14 }}>
            <Pressable accessibilityRole="button" onPress={() => setFlipped(false)} style={{ gap: 2 }}>
              <View className="flex-row items-baseline" style={{ gap: 10, flexWrap: 'wrap' }}>
                <Text style={{ fontFamily: HANZI_FAMILY, fontSize: 34, color: ZH.ink }}>{word.word}</Text>
                <Text style={{ fontSize: 15, fontWeight: '600', color: toneColor }}>{py}</Text>
              </View>
              {word.glossLanguage === 'en' ? <Text style={{ fontSize: 10, color: ZH.mist }}>Nghĩa tiếng Anh</Text> : null}
              <Text style={{ fontFamily: HEAD_FAMILY, fontSize: word.glossLanguage === 'en' ? 19 : 24, fontWeight: '700', color: ZH.ink }}>{word.meaningVi}</Text>
            </Pressable>

            {word.example ? (
              <View style={{ borderRadius: RADIUS.control, borderWidth: 1, borderColor: ZH.line, backgroundColor: ZH.card, padding: 14, gap: 4 }}>
                <Text style={{ fontFamily: HANZI_FAMILY, fontSize: 18, color: ZH.ink }}>{highlight(word.example, word.word)}</Text>
                {word.exampleReading ? <Text style={{ fontSize: 12, color: ZH.mist }}>{word.exampleReading}</Text> : null}
                {word.exampleVi ? <Text style={{ fontSize: 13, color: ZH.ink2 }}>{word.exampleVi}</Text> : null}
              </View>
            ) : null}

            {word.collocation ? <Text style={{ fontSize: 12, color: ZH.ink2 }}>Hay đi với: {word.collocation}</Text> : null}
            {word.synonyms?.length ? <Text style={{ fontSize: 12, color: ZH.ink2 }}>Đồng nghĩa: {word.synonyms.join(' · ')}</Text> : null}
          </View>
        )}
      </View>

      {/* Chấm mức nhớ: chỉ hiện sau khi lật */}
      {flipped ? (
        <View className="flex-row" style={{ gap: 8 }}>
          {RATINGS.map((r) => {
            const active = stage === r.stage;
            return (
              <Pressable
                key={r.label}
                accessibilityRole="button"
                accessibilityLabel={`${r.label} (phím ${r.key})`}
                onPress={() => onRate(r.stage)}
                style={({ pressed }: { pressed?: boolean }) => ({
                  flex: 1,
                  height: 46,
                  borderRadius: RADIUS.control,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: r.bg,
                  borderWidth: active ? 1.5 : 1,
                  borderColor: active ? r.ink : 'transparent',
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Text style={{ color: r.ink, fontWeight: '700', fontSize: 14 }}>{r.label}</Text>
                <Text style={{ color: r.ink, fontSize: 10, opacity: 0.7 }}>phím {r.key}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {/* Hàng dưới: nghe và đổi thẻ; trên điện thoại xuống dòng thay vì tràn khỏi thẻ */}
      <View className="flex-row items-center justify-between" style={{ gap: 8, flexWrap: 'wrap' }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Nghe phát âm"
          onPress={() => speak(word.word, { language: 'zh' })}
          style={({ pressed }: { pressed?: boolean }) => ({ flexDirection: 'row', alignItems: 'center', gap: 8, height: 40, paddingHorizontal: 14, borderRadius: RADIUS.control, borderWidth: 1, borderColor: ZH.line, backgroundColor: ZH.card, opacity: pressed ? 0.85 : 1 })}
        >
          <Image source={ZH_ART.seal} style={{ width: 16, height: 16 }} contentFit="contain" />
          <Text style={{ fontSize: 13, fontWeight: '600', color: ZH.ink }}>Nghe</Text>
        </Pressable>
        <View className="flex-row" style={{ gap: 8 }}>
          <Pressable accessibilityRole="button" onPress={onPrev} disabled={index === 0} style={({ pressed }: { pressed?: boolean }) => navBtn(index === 0, pressed)}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: ZH.ink }}>← Trước</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onNext} style={({ pressed }: { pressed?: boolean }) => navBtn(false, pressed)}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: ZH.ink }}>Tiếp →</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function navBtn(disabled: boolean, pressed?: boolean) {
  return {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: RADIUS.control,
    borderWidth: 1,
    borderColor: ZH.line,
    backgroundColor: ZH.card,
    justifyContent: 'center' as const,
    opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
  };
}

/** Tô đậm chữ đang học trong câu ví dụ (màu son). */
function highlight(sentence: string, target: string) {
  const parts = target ? sentence.split(target) : [sentence];
  if (parts.length === 1) return sentence;
  return parts.map((p, i) => (
    <React.Fragment key={i}>
      {p}
      {i < parts.length - 1 ? <Text style={{ color: ZH.seal, fontWeight: '700' }}>{target}</Text> : null}
    </React.Fragment>
  ));
}
