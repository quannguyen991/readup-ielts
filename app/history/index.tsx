import React, { useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { HistoryImage } from '@/components/history/HistoryImage';
import { Card, Chip, Eyebrow, H, LinkButton, softShadow } from '@/components/history/ui';
import { Screen } from '@/components/layout/Screen';
import { devEnabled, isDevBuild, listTopics } from '@/data/history';
import { useL } from '@/i18n/useL';
import { readingFont, useReadingFonts } from '@/lib/readingFonts';
import { playSfx } from '@/services/audio/sfx-ui';
import { visibleScenes } from '@/services/history/gating';
import { completedCount } from '@/services/history/progress';
import { HISTORY_DISCLAIMER, type Scene, type TopicBundle } from '@/services/history/types';
import { useHistoryStore } from '@/store/useHistoryStore';

/** /history — danh sách chủ đề lịch sử đã qua cổng xuất bản. */
export default function HistoryIndex() {
  useReadingFonts();
  const { L } = useL();
  const { width } = useWindowDimensions();
  const { dev } = useLocalSearchParams<{ dev?: string }>();
  const isDev = devEnabled(dev);
  const topics = listTopics(isDev);
  const totalScenes = topics.reduce((count, bundle) => count + bundle.topic.sceneIds.length, 0);
  const progress = useHistoryStore((s) => s.topics);
  const wide = width >= 900;

  return (
    <Screen cat="read">
      <View style={{ gap: 28, paddingTop: wide ? 14 : 4 }}>
        <View style={{ gap: 13, marginBottom: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
            <View style={{ width: 26, height: 1, backgroundColor: H.accent }} />
            <Eyebrow>{L('Hồ sơ lịch sử', 'History collection')}</Eyebrow>
          </View>
          <Text accessibilityRole="header" style={{ fontFamily: readingFont.display, fontWeight: '700', fontSize: wide ? 48 : 38, lineHeight: wide ? 55 : 45, letterSpacing: -1.15, color: H.ink }}>
            {L('Lịch sử Việt Nam', 'Vietnamese history')}
          </Text>
          <View style={{ flexDirection: wide ? 'row' : 'column', justifyContent: 'space-between', alignItems: wide ? 'flex-end' : 'flex-start', gap: 16 }}>
            <Text style={{ fontFamily: readingFont.sans, fontSize: 15.5, lineHeight: 23, color: H.body, maxWidth: 690 }}>
              {L('Đọc và nghe các dấu mốc lịch sử qua những cảnh minh họa song ngữ, có nguồn đối chiếu.', 'Read and listen to key moments through bilingual illustrated scenes with cited sources.')}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: wide ? 16 : 0, borderLeftWidth: wide ? 1 : 0, borderColor: H.rule }}>
              <Text style={{ fontFamily: readingFont.display, fontSize: 28, lineHeight: 32, color: H.accent }}>{String(topics.length).padStart(2, '0')}</Text>
              <View style={{ gap: 1 }}>
                <Text style={{ fontFamily: readingFont.sansBold, fontSize: 10.5, letterSpacing: 0.8, color: H.muted }}>{L('CHỦ ĐỀ', 'TOPICS')}</Text>
                <Text style={{ fontFamily: readingFont.sansSemi, fontSize: 12.5, color: H.body }}>{L(`${totalScenes} chặng`, `${totalScenes} scenes`)}</Text>
              </View>
            </View>
          </View>
          <View style={{ height: 1, marginTop: 5, backgroundColor: H.rule }} />
        </View>

        {topics.length === 0 ? (
          <Card style={{ gap: 10, maxWidth: 640 }}>
            <Chip tone="warn" label={L('Sắp ra mắt', 'Coming soon')} />
            <Text style={{ fontFamily: readingFont.sansHeavy, fontSize: 22, color: H.ink }}>{L('Chủ đề đầu tiên đang được kiểm chứng', 'The first topic is being fact-checked')}</Text>
            <Text style={{ fontFamily: readingFont.sans, fontSize: 14.5, lineHeight: 22, color: H.body }}>
              {L('Chúng tôi chỉ xuất bản những cảnh đã có nguồn đối chiếu, ảnh và audio hoàn chỉnh.', 'We only publish scenes that have cross-checked sources, a finished image and finished audio.')}
            </Text>
            {isDevBuild() ? (
              <LinkButton style={{ alignSelf: 'flex-start' }} label="DEV: mở dữ liệu mẫu (?dev=1)" onPress={() => router.push('/history?dev=1' as never)} />
            ) : null}
          </Card>
        ) : (
          <View style={{ gap: 18 }}>
            {topics.map((bundle) => {
              const scenes = visibleScenes(bundle);
              const done = completedCount({ topics: progress }, bundle.topic.id, scenes.map((scene) => scene.id));
              const href = `/history/${bundle.topic.id}${bundle.topic.id === 'dev-fixture' ? '?dev=1' : ''}`;
              return <TopicFeature key={bundle.topic.id} bundle={bundle} scenes={scenes} done={done} href={href} />;
            })}
          </View>
        )}

        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 0 }}>
          <View style={{ width: 3, minHeight: 30, borderRadius: 2, backgroundColor: H.accentSoft }} />
          <Text style={{ flex: 1, fontFamily: readingFont.sans, fontSize: 12.5, lineHeight: 19, color: H.muted }}>{L(HISTORY_DISCLAIMER.vi, HISTORY_DISCLAIMER.en)}</Text>
        </View>
      </View>
    </Screen>
  );
}

function TopicFeature({ bundle, scenes, done, href }: { bundle: TopicBundle; scenes: Scene[]; done: number; href: string }) {
  const { L, en } = useL();
  const { width } = useWindowDimensions();
  const [hovered, setHovered] = useState(false);
  const wide = width >= 900;
  const first = scenes[0];
  const total = bundle.topic.sceneIds.length;
  const progress = scenes.length > 0 ? Math.round((done / scenes.length) * 100) : 0;
  const open = () => {
    playSfx('tap');
    router.push(href as never);
  };

  return (
    <Pressable
      nativeID={`history-topic-${bundle.topic.id}`}
      accessibilityRole="link"
      accessibilityLabel={L(`Mở chủ đề ${bundle.topic.titleVi}`, `Open topic ${bundle.topic.titleEn}`)}
      onPress={open}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => [
        {
          flexDirection: wide ? 'row' : 'column',
          overflow: 'hidden',
          borderRadius: 26,
          borderWidth: 1,
          borderColor: hovered ? '#D9C79F' : H.rule,
          backgroundColor: '#F3F0FB',
          transform: [{ translateY: pressed ? 1 : hovered ? -3 : 0 }],
          transition: 'transform 220ms ease, border-color 220ms ease, box-shadow 220ms ease',
          ...softShadow,
          ...(hovered ? { boxShadow: '0 16px 38px rgba(94,72,35,0.14)' } : {}),
        },
      ]}
    >
      <View style={{ width: wide ? '52%' : '100%', height: wide ? 420 : Math.min(292, Math.round(width * 0.58)), backgroundColor: '#D6D3C4' }}>
        {first?.image ? (
          <HistoryImage immersive file={first.image.file} alt={en ? first.image.altEn : first.image.altVi} />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: readingFont.display, fontSize: 42, color: H.accent }}>{bundle.topic.periodLabel}</Text>
          </View>
        )}
        {first ? (
          <View style={{ position: 'absolute', left: 20, right: 20, bottom: 20, alignItems: 'flex-start' }}>
            <View style={{ maxWidth: '100%', gap: 4, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, backgroundColor: 'rgba(18,22,18,.72)', borderWidth: 1, borderColor: 'rgba(255,255,255,.2)' }}>
              <Text style={{ fontFamily: readingFont.sansBold, fontSize: 10.5, letterSpacing: 0.75, color: '#EED9A9' }}>{L(`CẢNH ${first.n} · ${bundle.topic.periodLabel}`, `SCENE ${first.n} · ${bundle.topic.periodLabel}`)}</Text>
              <Text numberOfLines={2} style={{ fontFamily: readingFont.sansSemi, fontSize: 14, lineHeight: 19, color: '#F3F0FB' }}>{en ? first.titleEn : first.titleVi}</Text>
            </View>
          </View>
        ) : null}
      </View>

      <View style={{ flex: 1, minWidth: 0, minHeight: wide ? 420 : undefined, padding: wide ? 28 : 24, gap: wide ? 9 : 13, justifyContent: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
          <View style={{ width: 22, height: 1, backgroundColor: H.accent }} />
          <Text style={{ fontFamily: readingFont.sansBold, fontSize: 11, letterSpacing: 0.9, color: H.accent }}>{bundle.topic.periodLabel}</Text>
        </View>
        <Text style={{ fontFamily: readingFont.display, fontWeight: '700', fontSize: wide ? 32 : 27, lineHeight: wide ? 40 : 34, letterSpacing: -0.45, color: H.ink }}>
          {bundle.topic.titleVi}
        </Text>

        <View style={{ flexDirection: 'row', gap: 0, marginTop: 3, paddingVertical: wide ? 10 : 14, borderTopWidth: 1, borderBottomWidth: 1, borderColor: H.rule }}>
          <Metric value={`${String(scenes.length).padStart(2, '0')}/${String(total).padStart(2, '0')}`} label={L('CẢNH SẴN SÀNG', 'SCENES READY')} />
          <Metric value="VI · EN" label={L('SONG NGỮ', 'BILINGUAL')} />
          <Metric value="EN" label={L('THUYẾT MINH', 'NARRATION')} />
        </View>

        <View style={{ gap: wide ? 5 : 7, marginRight: 58 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', gap: 9 }}>
            <Text style={{ fontFamily: readingFont.sansSemi, fontSize: 11.5, color: H.muted }}>{L('TIẾN ĐỘ ĐỌC', 'READING PROGRESS')}</Text>
            <Text style={{ fontFamily: readingFont.mono, fontSize: 11.5, color: H.body }}>{done}/{scenes.length}</Text>
          </View>
          <View style={{ height: 4, borderRadius: 3, backgroundColor: H.accentSoft, overflow: 'hidden' }}>
            <View style={{ width: `${progress}%`, height: '100%', borderRadius: 3, backgroundColor: H.accent }} />
          </View>
        </View>

        <View style={{ alignSelf: 'flex-start', minHeight: wide ? 46 : 50, flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 2, paddingHorizontal: 20, borderRadius: 15, backgroundColor: H.accent }}>
          <Text style={{ fontFamily: readingFont.sansBold, fontSize: 14.5, color: '#FFFFFF' }}>{done > 0 ? L('Tiếp tục hành trình', 'Continue reading') : L('Bắt đầu đọc', 'Start reading')}</Text>
          <Text style={{ fontFamily: readingFont.sansBold, fontSize: 19, color: '#FFFFFF' }}>→</Text>
        </View>
      </View>
    </Pressable>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ flex: 1, minWidth: 0, gap: 5, paddingVertical: 2, paddingLeft: 12, borderLeftWidth: 1, borderColor: H.rule }}>
      <Text numberOfLines={1} style={{ fontFamily: readingFont.sansBold, fontSize: 15, color: H.ink }}>{value}</Text>
      <Text numberOfLines={1} style={{ fontFamily: readingFont.sansSemi, fontSize: 9.5, letterSpacing: 0.45, color: H.muted }}>{label}</Text>
    </View>
  );
}
