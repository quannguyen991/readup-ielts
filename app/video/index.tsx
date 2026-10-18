import React from 'react';
import { Platform, Pressable, Text, View, useWindowDimensions, type ViewStyle } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Appear } from '@/components/motion/Motion';
import { Icon } from '@/components/ui';
import { LIBRARY_VIDEOS } from '@/data/video-library';
import { useL } from '@/i18n/useL';
import { favouriteMode, useVideoHubStore } from '@/store/useVideoHubStore';

/**
 * HỌC QUA VIDEO: bốn cách học trên cùng một kho video. Mỗi thẻ mở một chế độ có sẵn
 * của app; "Video ngẫu nhiên" rút một video trong kho rồi mở ngay chế độ chép chính tả.
 *
 * Cá nhân hoá: chế độ vừa mở nằm lên đầu lưới, kèm dải "Tiếp tục"; chế độ hay dùng nhất
 * được gắn nhãn. Thói quen lưu trên máy này (useVideoHubStore).
 */

type Mode = {
  key: string;
  vi: string;
  en: string;
  sub: string;
  subEn: string;
  bg: string;
  ink: string;
  icon: 'pencil' | 'volume' | 'play' | 'clipboard' | 'list' | 'mic' | 'book';
  wide?: boolean;
  tall?: boolean;
  stripes?: boolean;
  onPress: () => void;
};

type Badge = 'recent' | 'favourite';

const SHADOW = '0 6px 18px rgba(60,35,10,0.12)';

function randomVideoId(): string | null {
  const list = LIBRARY_VIDEOS;
  if (list.length === 0) return null;
  return list[Math.floor(Math.random() * list.length)]?.id ?? null;
}

export default function VideoHub() {
  const { L, en } = useL();
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const counts = useVideoHubStore((s) => s.counts);
  const last = useVideoHubStore((s) => s.last);
  const touch = useVideoHubStore((s) => s.touch);
  const fav = favouriteMode(counts);

  const modes: Mode[] = [
    {
      key: 'dictation',
      vi: 'Chép chính tả', en: 'Dictation', sub: 'Nghe và chép lại từng câu', subEn: 'Listen and write each sentence',
      bg: '#E4DDF9', ink: '#2E2360', icon: 'pencil', wide: false, tall: true,
      onPress: () => router.push('/sentence/youtube' as never),
    },
    {
      key: 'shadow', vi: 'Nói nhại', en: 'Shadowing', sub: 'Nghe và nói lại theo người bản ngữ', subEn: 'Listen and repeat after the native speaker',
      bg: '#F8C5CD', ink: '#6A1B2D', icon: 'mic', wide: true,
      onPress: () => router.push('/shadow' as never),
    },
    {
      key: 'random', vi: 'Video ngẫu nhiên', en: 'Random video', sub: 'Rút một video bất kỳ và chép ngay', subEn: 'Draw a random video and dictate it',
      bg: '#1E4D40', ink: '#FFFFFF', icon: 'play', wide: false,
      onPress: () => {
        const id = randomVideoId();
        router.push((id ? `/sentence/youtube?v=${id}` : '/sentence/youtube') as never);
      },
    },
    {
      key: 'mine', vi: 'Video của tôi', en: 'My videos', sub: 'Video bạn tự thêm từ YouTube', subEn: 'Videos you added from YouTube',
      bg: '#F4CC4F', ink: '#3A2A05', icon: 'list', wide: false, stripes: true,
      onPress: () => router.push('/sentence/youtube' as never),
    },
    {
      key: 'quiz', vi: 'Trắc nghiệm', en: 'Quiz', sub: 'Nghe và làm trắc nghiệm', subEn: 'Listen and answer multiple choice',
      bg: '#F2B26B', ink: '#4A2305', icon: 'clipboard', wide: false,
      onPress: () => router.push('/clip' as never),
    },
    {
      key: 'subs', vi: 'Phụ đề', en: 'Subtitles', sub: 'Xem phụ đề song ngữ', subEn: 'Watch with bilingual subtitles',
      bg: '#D5E8A0', ink: '#2A3D08', icon: 'book', wide: false,
      onPress: () => router.push('/sentence/videos' as never),
    },
  ];

  return (
    <Screen>
      <View
        style={{
          borderRadius: 26,
          padding: 24,
          backgroundColor: '#A8481F',
          backgroundImage: 'linear-gradient(120deg, #A8481F, #C8632E)',
          boxShadow: '0 8px 22px rgba(120,50,20,0.25)',
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 14,
        } as ViewStyle}
      >
        <View style={{ flexShrink: 1, minWidth: 0 }}>
          <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 30 }}>{L('Học qua video', 'Learn with video')}</Text>
          <Text style={{ color: '#FCE7D6', fontSize: 15, marginTop: 4 }}>
            {L('Bốn cách học trên cùng một video. Chọn một chế độ để bắt đầu.', 'Four ways to learn from the same video. Pick a mode to start.')}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/sentence/videos' as never)}
          style={({ pressed }: { pressed: boolean }) => ({
            flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 999,
            backgroundColor: '#1B1B1B', opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.97 : 1 }],
            ...(Platform.OS === 'web' ? ({ transition: 'transform 140ms ease' } as object) : {}),
          }) as ViewStyle}
        >
          <Icon name="play" size={15} color="#FFFFFF" />
          <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 15 }}>{L('Mở kho video', 'Open video library')}</Text>
        </Pressable>
      </View>

      {last ? (
        <ContinueStrip
          mode={modes.find((m) => m.key === last)}
          en={en}
          onOpen={(m) => {
            touch(m.key);
            m.onPress();
          }}
        />
      ) : null}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 18 }}>
        {/* Chế độ vừa mở lên đầu lưới; các chế độ còn lại giữ thứ tự cũ. */}
        {(last ? [...modes.filter((m) => m.key === last), ...modes.filter((m) => m.key !== last)] : modes).map((m, i) => {
          const badge: Badge | undefined = m.key === last ? 'recent' : m.key === fav && (counts[m.key] ?? 0) >= 3 ? 'favourite' : undefined;
          return (
            <Appear key={m.key} index={i} style={{ width: wide ? '48%' : '100%' } as ViewStyle}>
              <ModeCard mode={m} en={en} tall={!!m.tall} badge={badge} onOpen={() => {
                touch(m.key);
                m.onPress();
              }} />
            </Appear>
          );
        })}
      </View>
    </Screen>
  );
}

/** Dải "Tiếp tục" ở đầu trang: chế độ người học mở gần nhất, bấm một cái là vào lại. */
function ContinueStrip({ mode, en, onOpen }: { mode: Mode | undefined; en: boolean; onOpen: (m: Mode) => void }) {
  if (!mode) return null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={en ? `Continue: ${mode.en}` : `Tiếp tục: ${mode.vi}`}
      onPress={() => onOpen(mode)}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => ({
        marginTop: 18,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 14,
        paddingRight: 18,
        borderRadius: 999,
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: mode.ink,
        boxShadow: hovered ? '0 10px 22px rgba(60,35,10,0.18)' : '0 4px 12px rgba(60,35,10,0.10)',
        transform: [{ scale: pressed ? 0.985 : 1 }],
        ...(Platform.OS === 'web' ? ({ transition: 'transform 160ms ease, box-shadow 160ms ease' } as object) : {}),
      }) as ViewStyle}
    >
      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: mode.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={mode.icon} size={18} color={mode.ink} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 12, fontWeight: '800', color: '#8A7F72', letterSpacing: 0.4 }}>{en ? 'CONTINUE' : 'TIẾP TỤC'}</Text>
        <Text numberOfLines={1} style={{ fontSize: 16, fontWeight: '800', color: '#2B2118' }}>{en ? mode.en : mode.vi}</Text>
      </View>
      <Text style={{ fontSize: 14, fontWeight: '800', color: mode.ink }}>{en ? 'Open ›' : 'Mở lại ›'}</Text>
    </Pressable>
  );
}

function ModeCard({ mode, en, tall, badge, onOpen }: { mode: Mode; en: boolean; tall: boolean; badge?: Badge; onOpen: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={en ? mode.en : mode.vi}
      onPress={onOpen}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => ({
        minHeight: tall ? 280 : 170,
        borderRadius: 24,
        padding: 22,
        overflow: 'hidden',
        backgroundColor: mode.bg,
        boxShadow: pressed ? '0 2px 6px rgba(0,0,0,0.12)' : hovered ? '0 14px 30px rgba(60,35,10,0.22)' : SHADOW,
        transform: [{ translateY: pressed ? 2 : hovered ? -4 : 0 }, { scale: pressed ? 0.985 : 1 }],
        ...(Platform.OS === 'web' ? ({ transition: 'transform 180ms cubic-bezier(.2,.8,.2,1), box-shadow 180ms ease' } as object) : {}),
      }) as ViewStyle}
    >
      {mode.stripes ? (
        <View pointerEvents="none" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: 0.35, backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.45) 0 12px, transparent 12px 24px)' } as ViewStyle} />
      ) : null}
      <View pointerEvents="none" style={{ position: 'absolute', right: -30, top: -30, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.22)' }} />
      <View style={{ width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.7)' }}>
        <Icon name={mode.icon} size={20} color={mode.ink} />
      </View>
      {badge ? (
        <View pointerEvents="none" style={{ position: 'absolute', top: 16, right: 16, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: mode.ink }}>
          <Text style={{ color: mode.bg, fontSize: 12, fontWeight: '800' }}>
            {badge === 'recent' ? (en ? 'Recent' : 'Gần đây') : en ? 'Favourite' : 'Hay dùng'}
          </Text>
        </View>
      ) : null}
      <Text style={{ marginTop: 18, color: mode.ink, fontWeight: '900', fontSize: tall ? 30 : 24, letterSpacing: 0.3, lineHeight: tall ? 34 : 28 }}>
        {(en ? mode.en : mode.vi).toUpperCase()}
      </Text>
      <Text style={{ marginTop: 6, color: mode.ink, opacity: 0.85, fontSize: 15, lineHeight: 21 }}>{en ? mode.subEn : mode.sub}</Text>
    </Pressable>
  );
}
