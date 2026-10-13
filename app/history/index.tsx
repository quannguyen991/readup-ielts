import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { HistoryImage } from '@/components/history/HistoryImage';
import { Card, Chip, Eyebrow, H, LinkButton } from '@/components/history/ui';
import { Screen } from '@/components/layout/Screen';
import { devEnabled, isDevBuild, listTopics } from '@/data/history';
import { useL } from '@/i18n/useL';
import { readingFont, useReadingFonts } from '@/lib/readingFonts';
import { visibleScenes } from '@/services/history/gating';
import { completedCount } from '@/services/history/progress';
import { HISTORY_DISCLAIMER } from '@/services/history/types';
import { useHistoryStore } from '@/store/useHistoryStore';

/** /history — danh sách chủ đề lịch sử (hiện chỉ những chủ đề đã có cảnh qua cổng xuất bản). */
export default function HistoryIndex() {
  useReadingFonts();
  const { L, en } = useL();
  const { dev } = useLocalSearchParams<{ dev?: string }>();
  const isDev = devEnabled(dev);
  const topics = listTopics(isDev);
  const progress = useHistoryStore((s) => s.topics);

  return (
    <Screen cat="read">
      <View style={{ gap: 6, marginBottom: 16 }}>
        <Eyebrow>{L('Khám phá', 'Explore')}</Eyebrow>
        <Text accessibilityRole="header" style={{ fontFamily: readingFont.sansHeavy, fontSize: 32, lineHeight: 38, letterSpacing: -0.6, color: H.ink }}>
          {L('Khám phá lịch sử Việt Nam song ngữ', 'Explore Vietnamese history, bilingual')}
        </Text>
        <Text style={{ fontFamily: readingFont.sans, fontSize: 15, lineHeight: 22, color: H.body, maxWidth: 720 }}>
          {L('Đọc Việt–Anh · nghe thuyết minh · khám phá qua hình ảnh. Mỗi chủ đề được chia thành các cảnh ngắn, kèm nguồn và bảng đối chiếu.', 'Read in Vietnamese and English, listen to the narration and explore through pictures. Each topic is split into short scenes with sources and a cross-check table.')}
        </Text>
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
        <View style={{ gap: 16 }}>
          {topics.map((b) => {
            const scenes = visibleScenes(b);
            const first = scenes[0];
            const ids = scenes.map((s) => s.id);
            const done = completedCount({ topics: progress }, b.topic.id, ids);
            const href = `/history/${b.topic.id}${b.topic.id === 'dev-fixture' ? '?dev=1' : ''}`;
            return (
              <Pressable key={b.topic.id} accessibilityRole="link" onPress={() => router.push(href as never)}>
                <Card style={{ padding: 0, overflow: 'hidden', flexDirection: 'row', flexWrap: 'wrap' }}>
                  <View style={{ flexGrow: 1, flexBasis: 280, minHeight: 180 }}>
                    {first?.image ? <HistoryImage file={first.image.file} alt={en ? first.image.altEn : first.image.altVi} /> : null}
                  </View>
                  <View style={{ flexGrow: 2, flexBasis: 320, padding: 22, gap: 8 }}>
                    <Chip tone="accent" label={b.topic.periodLabel} />
                    <Text style={{ fontFamily: readingFont.sansHeavy, fontSize: 24, lineHeight: 30, color: H.ink }}>{b.topic.titleVi}</Text>
                    <Text style={{ fontFamily: readingFont.literata, fontStyle: 'italic', fontSize: 16, color: H.muted }}>{b.topic.titleEn}</Text>
                    <Text style={{ fontFamily: readingFont.sans, fontSize: 14.5, lineHeight: 21, color: H.body }}>{en ? b.topic.summary.en : b.topic.summary.vi}</Text>
                    <Text style={{ fontFamily: readingFont.sansSemi, fontSize: 13, color: H.muted }}>
                      {L(`${scenes.length} cảnh · đã đọc ${done}`, `${scenes.length} scenes · ${done} read`)}
                    </Text>
                    <LinkButton style={{ alignSelf: 'flex-start' }} strong label={done > 0 ? L('Tiếp tục', 'Continue') : L('Bắt đầu', 'Start')} onPress={() => router.push(href as never)} />
                  </View>
                </Card>
              </Pressable>
            );
          })}
        </View>
      )}

      <Text style={{ marginTop: 22, fontFamily: readingFont.sans, fontSize: 12.5, lineHeight: 19, color: H.muted, textAlign: 'center' }}>{L(HISTORY_DISCLAIMER.vi, HISTORY_DISCLAIMER.en)}</Text>
    </Screen>
  );
}
