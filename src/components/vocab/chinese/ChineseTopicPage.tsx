import React, { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { seededRng, shuffled, type StudyWord, type WordStage } from '@/services/vocab/topic-study';
import { ChineseFlashcard } from './ChineseFlashcard';
import { ZhPracticeGrid } from './ZhPracticeGrid';
import { themeForLevel } from './levels';
import { setZhLevel } from './levelStore';
import { levelOfName } from './themes';
import { ZH_V4 } from './v4';
import { HANZI_FAMILY, HEAD_FAMILY, RADIUS, ZH, ZH_TONE, toneOf } from './palette';
import { useChineseFonts } from './useChineseFonts';
import { ZhLevelCorners } from './ZhNineFrame';
import { EaFrame } from '../eastasia/EaLesson';
import { useEaSkin } from '../eastasia/EaParts';

/** Một chip số liệu ở đầu bài: chấm màu, nhãn và con số đậm. */
function StatChip({ label, n, dot, bg }: { label: string; n: number; dot: string; bg: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, height: 26, paddingHorizontal: 10, borderRadius: 999, backgroundColor: bg }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: dot }} />
      <Text style={{ fontSize: 12, color: ZH.ink2 }}>
        {label} <Text style={{ fontWeight: '700', color: ZH.ink }}>{n}</Text>
      </Text>
    </View>
  );
}

/** Màu của một từ theo mức đã chấm: xanh nhớ, vàng mơ hồ, đỏ quên, xám chưa học. */
function stageColor(stage: WordStage | undefined): string {
  if (stage === 2) return ZH.sage;
  if (stage === 1) return ZH.gold;
  if (stage === 0) return ZH.seal;
  return '#E4DACA';
}

/**
 * Trang một bài từ vựng tiếng Trung, theo bố cục của app nhưng vẽ theo giấy Band 9:
 * 1. Đầu bài (tờ giấy có viền vàng): tên bài, thanh tiến độ, số liệu, vòng phần trăm đã nhớ, cảnh bên phải.
 * 2. "Cách luyện": lưới thẻ có tranh cho mọi chế độ (xem ZhPracticeGrid).
 * 3. Danh sách từ và thẻ học: máy tính hai cột (danh sách cuộn riêng, thẻ ở cạnh); điện thoại thẻ lên trước.
 *
 * Trạng thái học dùng lại đúng handler của trang bài học (lưu, sao, chấm mức nhớ, lịch ôn FSRS).
 */
export function ChineseTopicPage({
  slug,
  title,
  eyebrow,
  words,
  stages,
  starred,
  saved,
  shuffle,
  onSave,
  onStar,
  onRate,
  bare = false,
}: {
  slug: string;
  title: string;
  eyebrow: string;
  words: readonly StudyWord[];
  stages: Readonly<Record<string, WordStage>> | undefined;
  starred: ReadonlySet<string>;
  saved: ReadonlySet<string>;
  shuffle: boolean;
  onSave: (w: StudyWord) => void;
  onStar: (w: StudyWord) => void;
  onRate: (w: StudyWord, stage: WordStage) => void;
  /** Chỉ vẽ khu học từng từ (danh sách + thẻ) trong khung hoa văn; đầu bài và lưới cách luyện do trang ngoài vẽ. */
  bare?: boolean;
}) {
  useChineseFonts();
  const eaSkin = useEaSkin('zh');
  const { width } = useWindowDimensions();
  const wide = width >= 960;

  const [shuffleOn, setShuffleOn] = useState(shuffle);
  const [seed, setSeed] = useState(() => Date.now() % 100000);
  const list = useMemo(
    () => (shuffleOn ? shuffled(words, seededRng(seed)) : [...words]),
    [shuffleOn, seed, words],
  );

  // Bắt đầu ở từ chưa nhớ đầu tiên, như trang bài học cũ.
  const [index, setIndex] = useState(() => {
    const first = words.findIndex((w) => stages?.[w.word] !== 2);
    return first === -1 ? 0 : first;
  });
  const safeIndex = Math.min(index, Math.max(0, list.length - 1));
  const current = list[safeIndex];

  const counts = useMemo(() => {
    let mastered = 0;
    let fuzzy = 0;
    let forgot = 0;
    for (const w of words) {
      const s = stages?.[w.word];
      if (s === 2) mastered += 1;
      else if (s === 1) fuzzy += 1;
      else if (s === 0) forgot += 1;
    }
    return { mastered, fuzzy, forgot, fresh: words.length - mastered - fuzzy - forgot };
  }, [words, stages]);

  const pct = Math.round((counts.mastered / Math.max(1, words.length)) * 100);
  // Mỗi cấp HSK có một banner và một màu nhấn riêng; cấp đọc từ tiêu đề bài ("HSK 4 · Buổi 01").
  const level = levelOfName(title) ?? 1;
  const theme = themeForLevel(level);
  // Nền trang đổi theo cấp khi mở bài; rời trang thì trả về cấp 1.
  useEffect(() => {
    setZhLevel(level);
    return () => setZhLevel(1);
  }, [level]);

  /* 1 · ĐẦU BÀI: banner phố cổ có viền vàng, gồm chữ, thanh tiến độ và vòng phần trăm */
  const ringBg = Platform.OS === 'web' ? ({ backgroundImage: `conic-gradient(${ZH.sage} ${pct}%, #F3DCC8 0)` } as object) : null;
  const hero = (
    <View
      style={{
        borderRadius: RADIUS.sheet,
        borderWidth: 2,
        borderColor: ZH.gold,
        backgroundColor: ZH.seal,
        overflow: 'hidden',
        paddingHorizontal: wide ? 60 : 26,
        paddingTop: wide ? 34 : 30,
        paddingBottom: wide ? 34 : 30,
        flexDirection: wide ? 'row' : 'column',
        alignItems: wide ? 'center' : 'stretch',
        gap: wide ? 28 : 18,
      }}
    >
      {/* Nền: banner phố cổ (vẽ bằng ChatGPT, không chữ) với lớp đỏ mờ bên trái để chữ đọc rõ */}
      <Image source={theme.banner} contentFit="cover" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
      <LinearGradient
        colors={theme.wash}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />
      <View style={{ flex: 1, minWidth: 0, gap: 8 }}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/vocabulary/topics' as never)}
          style={{ alignSelf: 'flex-start', height: 32, paddingHorizontal: 14, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.92)', justifyContent: 'center' }}
        >
          <Text style={{ fontSize: 13, color: ZH.seal, fontWeight: '600' }}>← Tất cả sách từ vựng</Text>
        </Pressable>
        <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.6, color: '#F5D28A', marginTop: 10 }}>{eyebrow}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Text style={{ fontFamily: HEAD_FAMILY, fontSize: wide ? 40 : 28, fontWeight: '700', color: '#FFF6E8' }}>{title}</Text>
          {/* Đám mây vàng cạnh tên bài, như trang trí ở ảnh mẫu */}
          <Image source={ZH_V4.sticker.goldCloud} contentFit="contain" style={{ width: wide ? 60 : 44, height: wide ? 44 : 32 }} />
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <Text style={{ fontSize: 13, color: '#FFE3D2', marginRight: 4 }}>{words.length} từ</Text>
          <StatChip label="Đã nhớ" n={counts.mastered} dot={ZH.sage} bg="#FFFBF5" />
          <StatChip label="Mơ hồ" n={counts.fuzzy} dot={ZH.gold} bg="#FFFBF5" />
          <StatChip label="Quên" n={counts.forgot} dot={ZH.seal} bg="#FFFBF5" />
          <StatChip label="Chưa học" n={counts.fresh} dot={ZH.mist} bg="#FFFBF5" />
        </View>
        {/* Thanh tiến độ chia ba màu theo mức đã chấm */}
        <View style={{ flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.3)', maxWidth: 520, marginTop: 6 }}>
          <View style={{ width: `${(counts.mastered / Math.max(1, words.length)) * 100}%`, backgroundColor: '#8FD39E' }} />
          <View style={{ width: `${(counts.fuzzy / Math.max(1, words.length)) * 100}%`, backgroundColor: '#FFD36B' }} />
          <View style={{ width: `${(counts.forgot / Math.max(1, words.length)) * 100}%`, backgroundColor: '#FF9C8E' }} />
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 22, alignSelf: wide ? 'auto' : 'center' }}>
        {/* Vòng phần trăm đã nhớ, như huy hiệu viền vàng */}
        <View style={[{ width: 112, height: 112, borderRadius: 56, backgroundColor: '#F3DCC8', borderWidth: 3, borderColor: ZH.gold2, alignItems: 'center', justifyContent: 'center' }, ringBg]}>
          <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: '#FFFBF5', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 24, fontWeight: '400', color: ZH.seal }}>{pct}%</Text>
            <Text style={{ fontSize: 11, color: ZH.ink2 }}>đã nhớ</Text>
          </View>
        </View>
      </View>
    </View>
  );

  /* 3a · DANH SÁCH TỪ */
  const ticks = (
    <View style={{ flexDirection: 'row', gap: 2, height: 10 }}>
      {words.map((w, i) => {
        const active = current?.word === w.word;
        return (
          <Pressable
            key={`${w.word}-${i}`}
            accessibilityRole="button"
            accessibilityLabel={`Từ ${i + 1}: ${w.word}`}
            onPress={() => {
              const at = list.findIndex((x) => x.word === w.word);
              setIndex(at === -1 ? 0 : at);
            }}
            style={{ flex: 1, borderRadius: 2, backgroundColor: stageColor(stages?.[w.word]), borderWidth: active ? 1.5 : 0, borderColor: ZH.ink }}
          />
        );
      })}
    </View>
  );

  const rows = list.map((w, i) => {
    const active = i === safeIndex;
    const s = stages?.[w.word];
    const py = w.romanization || w.ipa;
    const isStar = starred.has(w.word);
    return (
      <View
        key={`${w.word}-${i}`}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          borderBottomWidth: 1,
          borderBottomColor: ZH.line,
          borderLeftWidth: 3,
          borderLeftColor: active ? ZH.seal : 'transparent',
          backgroundColor: active ? ZH.cream2 : ZH.card,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: active }}
          onPress={() => setIndex(i)}
          style={({ hovered, pressed }: { hovered?: boolean; pressed?: boolean }) => ({
            flex: 1,
            minWidth: 0,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
            paddingVertical: 10,
            paddingLeft: 14,
            paddingRight: 8,
            opacity: pressed ? 0.85 : 1,
            backgroundColor: hovered && !active ? '#FBF7EE' : 'transparent',
          })}
        >
          <Text style={{ fontFamily: HANZI_FAMILY, fontSize: 26, width: 44, textAlign: 'center', color: ZH.ink }}>{w.word}</Text>
          <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: ZH_TONE[toneOf(py)] }}>{py}</Text>
            <Text numberOfLines={1} style={{ fontSize: 14, color: ZH.ink2 }}>{w.meaningVi}</Text>
          </View>
        </Pressable>
        <View
          accessibilityLabel={s === 2 ? 'Đã nhớ' : s === 1 ? 'Mơ hồ' : s === 0 ? 'Quên' : 'Chưa học'}
          style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: stageColor(s), marginRight: 6 }}
        />
        <Pressable accessibilityRole="button" accessibilityLabel={isStar ? 'Bỏ sao' : 'Gắn sao'} hitSlop={8} onPress={() => onStar(w)} style={{ paddingHorizontal: 10, paddingVertical: 12 }}>
          <Text style={{ fontSize: 15, color: isStar ? '#8A5E1C' : ZH.mist }}>{isStar ? '★' : '☆'}</Text>
        </Pressable>
      </View>
    );
  });

  const listPanel = (
    <View style={{ flex: wide ? 1 : undefined, minWidth: 0, borderRightWidth: wide ? 1 : 0, borderBottomWidth: wide ? 0 : 1, borderColor: ZH.line }}>
      <View style={{ paddingHorizontal: 18, paddingTop: 16, paddingBottom: 12, gap: 10 }}>
        <View className="flex-row items-center justify-between" style={{ gap: 10 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: ZH.ink }}>
            Danh sách từ <Text style={{ fontWeight: '500', color: ZH.mist }}>· {list.length}</Text>
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setSeed(Date.now() % 100000);
              setShuffleOn((v) => !v);
              setIndex(0);
            }}
            style={{ height: 28, paddingHorizontal: 10, borderRadius: RADIUS.control, borderWidth: 1, borderColor: ZH.line, backgroundColor: shuffleOn ? ZH.goldSoftBg : ZH.card, justifyContent: 'center' }}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', color: ZH.ink }}>{shuffleOn ? 'Đang xáo trộn' : 'Xáo trộn'}</Text>
          </Pressable>
        </View>
        {ticks}
      </View>
      <ScrollView style={{ maxHeight: wide ? 540 : undefined }} nestedScrollEnabled>
        {rows}
      </ScrollView>
    </View>
  );

  /* 3b · THẺ HỌC */
  const cardPanel = (
    <View style={{ width: wide ? 420 : undefined, padding: wide ? 22 : 18 }}>
      {current ? (
        <ChineseFlashcard
          word={current}
          index={safeIndex}
          total={list.length}
          stage={stages?.[current.word]}
          starred={starred.has(current.word)}
          saved={saved.has(current.word.toLowerCase())}
          onPrev={() => setIndex((i) => Math.max(0, i - 1))}
          onNext={() => setIndex((i) => (i + 1) % list.length)}
          onRate={(stage) => {
            onRate(current, stage);
            setIndex((i) => (i + 1) % list.length);
          }}
          onStar={() => onStar(current)}
          onSave={() => onSave(current)}
        />
      ) : null}
    </View>
  );

  const studyInner = (
      <View style={{ flexDirection: wide ? 'row' : 'column', alignItems: 'stretch', borderRadius: RADIUS.block, overflow: 'hidden', borderWidth: 1, borderColor: ZH.line, backgroundColor: ZH.card }}>
      {wide ? (
          <>
            {listPanel}
            {cardPanel}
          </>
        ) : (
          <>
            {cardPanel}
            {listPanel}
          </>
        )}
      </View>
  );

  // Khu học từng từ: khung góc + viền vàng bao quanh; lề trong chừa chỗ cho góc khung không đè lên chữ.
  const study = (
    <View
      style={{
        position: 'relative',
        borderRadius: RADIUS.sheet,
        backgroundColor: ZH.card,
        borderWidth: 1,
        borderColor: ZH.line,
        overflow: 'hidden',
        paddingHorizontal: wide ? 56 : 40,
        paddingVertical: wide ? 56 : 40,
      }}
    >
      <View pointerEvents="none" style={{ position: 'absolute', left: 12, right: 12, top: 12, bottom: 12, borderWidth: 1, borderColor: 'rgba(184,149,90,0.75)', borderRadius: RADIUS.block }} />
      {studyInner}
      <ZhLevelCorners source={theme.frames.corner} c={wide ? 52 : 40} />
    </View>
  );

  if (bare) {
    return (
      <EaFrame skin={eaSkin} pad={wide ? 28 : 16}>
        {studyInner}
      </EaFrame>
    );
  }

  return (
    <View style={{ width: '100%', maxWidth: 1180, alignSelf: 'center', gap: wide ? 28 : 20 }}>
      {/* Viền khung trang trí phủ lên đầu bài: khung ngang trên máy tính, khung góc trên điện thoại */}
      <View style={{ position: 'relative' }}>
        {hero}
        {wide ? (
          <ZhLevelCorners source={theme.frames.corner} c={84} />
        ) : null}
      </View>
      <ZhPracticeGrid slug={slug} wide={wide} accent={theme.accent} frames={theme.frames} />
      <View style={{ gap: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text style={{ fontFamily: HEAD_FAMILY, fontSize: 20, fontWeight: '700', color: ZH.onPage }}>Học từng từ</Text>
          {/* Hoa mẫu đơn trang trí cạnh tiêu đề, như nhãn dán ở ảnh mẫu */}
          <Image source={ZH_V4.sticker.peony} contentFit="contain" style={{ width: 44, height: 44 }} />
        </View>
        {study}
      </View>
    </View>
  );
}
