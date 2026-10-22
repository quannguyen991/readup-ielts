import React, { useMemo } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';

import { devBundles, featuredImage, hasPublishedHistory, HISTORY_LEARNING_ENABLED, isDevBuild, KHANG_CHIEN_TOPIC_ID, getBundle } from '@/data/history';
import { useL } from '@/i18n/useL';
import { readingFont, useReadingFonts } from '@/lib/readingFonts';
import { visibleScenes } from '@/services/history/gating';
import { resumeScene } from '@/services/history/progress';
import { useHistoryStore } from '@/store/useHistoryStore';

import { HistoryImage } from './HistoryImage';
import { Chip, H, softShadow } from './ui';

/**
 * Thẻ lối vào "Khám phá lịch sử Việt Nam song ngữ" ở trang chủ.
 * Chỉ hiện khi đã có ít nhất một cảnh qua cổng xuất bản. Ở bản phát triển mà chưa có cảnh nào: hiện trạng thái
 * "Sắp ra mắt" (dành cho người làm app, để thấy chỗ đặt) — người dùng thật không bao giờ thấy.
 */
export function HistoryHomeCard({ compact = false, marginTop = 0 }: { compact?: boolean; marginTop?: number }) {
  useReadingFonts();
  const { L } = useL();
  const { width } = useWindowDimensions();
  const published = hasPublishedHistory();
  const topics = useHistoryStore((s) => s.topics);
  const wide = width >= 768 && !compact;

  const thumb = useMemo(() => {
    const real = featuredImage();
    if (real) return real;
    if (!isDevBuild()) return null;
    const fx = devBundles()[0];
    const s = fx?.scenes[0];
    return s?.image ? { file: s.image.file, altVi: s.image.altVi, altEn: s.image.altEn } : null;
  }, []);

  if (!HISTORY_LEARNING_ENABLED || (!published && !isDevBuild())) return null;

  const started = !!topics[KHANG_CHIEN_TOPIC_ID];
  const bundle = getBundle(KHANG_CHIEN_TOPIC_ID);
  const resume = bundle && published ? resumeScene({ topics }, KHANG_CHIEN_TOPIC_ID, visibleScenes(bundle).map((s) => s.id)) : null;
  const go = () => {
    if (!published) router.push('/history?dev=1' as never);
    else router.push((resume && started ? `/history/${KHANG_CHIEN_TOPIC_ID}?scene=${resume}` : `/history/${KHANG_CHIEN_TOPIC_ID}`) as never);
  };

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={L('Khám phá lịch sử Việt Nam song ngữ', 'Explore Vietnamese history, bilingual')}
      onPress={go}
      style={[
        {
          flexDirection: wide ? 'row' : 'column',
          marginTop,
          overflow: 'hidden',
          borderRadius: 24,
          backgroundColor: '#FFFFFF',
          borderWidth: 1,
          borderColor: H.rule,
        },
        softShadow,
      ]}
    >
      {wide ? (
      <View style={{ width: '40%', minHeight: 220, backgroundColor: '#F3F0FB', justifyContent: 'center' }}>
        {thumb ? (
          <HistoryImage file={thumb.file} alt={L(thumb.altVi, thumb.altEn)} />
        ) : (
          <View style={{ aspectRatio: 16 / 9, width: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EADFC5' }}>
            <Text style={{ fontFamily: readingFont.sansHeavy, fontSize: 40, color: H.accent }}>1945</Text>
          </View>
        )}
      </View>
      ) : null}
      <View style={{ flex: 1, padding: wide ? 28 : 20, gap: 10, justifyContent: 'center' }}>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          <Chip tone="accent" label={L('Mới · Song ngữ Việt–Anh', 'New · Bilingual EN–VI')} />
          {!published ? <Chip tone="warn" label={L('Sắp ra mắt (chỉ hiện ở bản dev)', 'Coming soon (dev builds only)')} /> : null}
        </View>
        <Text style={{ fontFamily: readingFont.display, fontWeight: '700', fontSize: wide ? 30 : 24, lineHeight: wide ? 38 : 31, letterSpacing: -0.35, color: H.ink }}>
          {L('Khám phá lịch sử Việt Nam song ngữ', 'Explore Vietnamese history, bilingual')}
        </Text>
        <Text style={{ fontFamily: readingFont.sans, fontSize: 15, lineHeight: 22, color: H.body }}>
          {L('Đọc Việt–Anh · nghe thuyết minh · 12 chặng', 'Read in Vietnamese and English · listen to the narration · 12 stages')}
        </Text>
        <View style={{ marginTop: 6, minHeight: 48, alignSelf: 'flex-start', paddingHorizontal: 24, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: H.accent }}>
          <Text style={{ fontFamily: readingFont.sansBold, fontSize: 15, color: '#FFFFFF' }}>{started && published ? L('Tiếp tục', 'Continue') : L('Bắt đầu', 'Start')} →</Text>
        </View>
      </View>
    </Pressable>
  );
}
