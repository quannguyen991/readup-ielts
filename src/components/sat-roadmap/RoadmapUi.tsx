/**
 * Mảnh giao diện dùng chung của Lộ trình SAT Math theo chủ đề: sticker của
 * chương, viên trạng thái mức (Dễ / Trung bình / Khó), khối song ngữ.
 */
import React from 'react';
import { Text, View } from 'react-native';

import { CuteBook, CuteCalendar, CuteClock, CuteGlobe, CutePencil } from '@/components/illust/Cute';
import { CuteBulb, CuteCalculator, CuteChat, CuteFlame, CuteMagnifier, CuteNotebook, CutePlant, CuteRocket, CuteStar, CuteTrophy, Motion } from '@/components/illust/CuteMore';
import { Sticker } from '@/components/illust/Sticker';
import { PASS_RATIO, type Bi, type Level, type RoadChapter } from '@/data/sat-roadmap';
import type { LevelBest } from '@/store/useSatRoadmapStore';

const ART: Record<RoadChapter['art'], (p: { size?: number }) => React.ReactElement> = {
  calculator: CuteCalculator,
  rocket: CuteRocket,
  book: CuteBook,
  notebook: CuteNotebook,
  globe: CuteGlobe,
  clock: CuteClock,
  star: CuteStar,
  bulb: CuteBulb,
  magnifier: CuteMagnifier,
  trophy: CuteTrophy,
  pencil: CutePencil,
  chat: CuteChat,
  calendar: CuteCalendar,
  plant: CutePlant,
  flame: CuteFlame,
};

export function ChapterSticker({ art, size = 64, tilt = -6, motion = true }: { art: RoadChapter['art']; size?: number; tilt?: number; motion?: boolean }) {
  const I = ART[art];
  const body = (
    <Sticker tilt={tilt}>
      <I size={size} />
    </Sticker>
  );
  return motion ? <Motion kind="float">{body}</Motion> : body;
}

export const LEVEL_TONE: Record<Level, { bg: string; soft: string; ink: string; emoji: string }> = {
  easy: { bg: '#22A06B', soft: '#E7F7EF', ink: '#14532D', emoji: '🌱' },
  medium: { bg: '#F2B632', soft: '#FFF6DD', ink: '#7A4B00', emoji: '🔥' },
  hard: { bg: '#E0533D', soft: '#FDECE9', ink: '#7F1D1D', emoji: '🚀' },
};

export type LevelState = 'passed' | 'tried' | 'new';

export function levelState(b: LevelBest | undefined): LevelState {
  if (!b) return 'new';
  return b.correct / b.total >= PASS_RATIO ? 'passed' : 'tried';
}

/** Ba chấm trạng thái mức trên thẻ chương. */
export function LevelDots({ best }: { best: Partial<Record<Level, LevelBest>> | undefined }) {
  return (
    <View style={{ flexDirection: 'row', gap: 5 }}>
      {(['easy', 'medium', 'hard'] as const).map((lv) => {
        const st = levelState(best?.[lv]);
        const t = LEVEL_TONE[lv];
        return (
          <View
            key={lv}
            accessibilityLabel={`${lv}: ${st}`}
            style={{ height: 8, flex: 1, borderRadius: 4, backgroundColor: st === 'passed' ? t.bg : st === 'tried' ? t.bg + '66' : 'rgba(15,23,42,0.1)' }}
          />
        );
      })}
    </View>
  );
}

export type Lang = 'both' | 'vi' | 'en';

/** Một cặp song ngữ: hai cột (VI | EN) trên màn rộng, xếp chồng trên màn hẹp. */
export function BiText({ t, lang, wide, size = 15, strong = false }: { t: Bi; lang: Lang; wide: boolean; size?: number; strong?: boolean }) {
  const font = strong ? 'font-heavy' : 'font-sans';
  if (lang !== 'both')
    return (
      <Text className={font} style={{ fontSize: size, lineHeight: size * 1.5, color: '#0F172A' }}>
        {lang === 'vi' ? t.vi : t.en}
      </Text>
    );
  return (
    <View style={{ flexDirection: wide ? 'row' : 'column', gap: wide ? 16 : 6 }}>
      <View style={{ flex: 1, flexDirection: 'row', gap: 8 }}>
        <Tag text="VI" color="#E0533D" />
        <Text className={font} style={{ flex: 1, fontSize: size, lineHeight: size * 1.5, color: '#0F172A' }}>
          {t.vi}
        </Text>
      </View>
      <View style={{ flex: 1, flexDirection: 'row', gap: 8 }}>
        <Tag text="EN" color="#A8843F" />
        <Text className={font} style={{ flex: 1, fontSize: size, lineHeight: size * 1.5, color: '#334155' }} lang="en">
          {t.en}
        </Text>
      </View>
    </View>
  );
}

function Tag({ text, color }: { text: string; color: string }) {
  return (
    <View style={{ alignSelf: 'flex-start', marginTop: 2, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1, backgroundColor: color }}>
      <Text className="font-heavy" style={{ fontSize: 12, color: '#FFFFFF' }}>
        {text}
      </Text>
    </View>
  );
}
