import React from 'react';
import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { TaskShell } from '@/components/layout/TaskShell';
import { useTravelReady } from '@/components/travel/useTravel';
import { TravelHud } from '@/components/travel/ui/Hud';
import { Eyebrow, GameButton, PixelPanel, T } from '@/components/travel/ui/kit';
import { getBundle, historyGuidesForPoi, historyHref, isDevBuild } from '@/data/history';
import { getPoiContent } from '@/data/travel/pois';
import { bi, useL } from '@/i18n/useL';
import { isPoiUnlocked } from '@/services/travel/rewards';
import { useTravelStore } from '@/store/useTravelStore';

/**
 * /quest/du-ngoan/guide/[poi] — người hướng dẫn kể lịch sử nơi này.
 *
 * Người chơi là KHÁCH DU LỊCH ở hiện tại: người hướng dẫn hỏi (bằng TIẾNG ANH — luật: nhân vật trong game
 * chỉ nói tiếng Anh) có muốn nghe chuyện đã xảy ra không; đồng ý thì sang trang đọc song ngữ + nghe thuyết minh.
 * Luôn mở: không vé, không sao. Lượt luyện từ của địa điểm vẫn nằm ở đây, theo luật khoá cũ.
 */
export default function GuideRoute() {
  const { poi: raw } = useLocalSearchParams<{ poi: string }>();
  const ready = useTravelReady();
  const { L, locale } = useL();
  const id = Array.isArray(raw) ? raw[0] : raw;
  const poi = id ? getPoiContent(id) : undefined;
  const back = poi ? `/quest/du-ngoan/${poi.city}` : '/quest/du-ngoan';
  return (
    <TaskShell backHref={back} backLabel={L('Quay lại thành phố', 'Back to the city')} title={poi ? bi(poi.name, locale) : L('Địa điểm', 'Place')} right={<TravelHud />}>
      {ready && poi ? <Guide poiId={poi.id} /> : null}
    </TaskShell>
  );
}

function Guide({ poiId }: { poiId: string }) {
  const { L, locale, en } = useL();
  const poi = getPoiContent(poiId)!;
  const progress = useTravelStore((s) => s.poi);
  const guides = historyGuidesForPoi(poiId);
  const open = isPoiUnlocked({ poi: progress }, poi);

  return (
    <View style={{ gap: 18, maxWidth: 720, width: '100%', alignSelf: 'center' }}>
      {guides.map((g) => {
        const bundle = getBundle(g.topicId, g.dev);
        const scenes = g.sceneIds.map((id) => bundle?.scenes.find((s) => s.id === id)).filter((s): s is NonNullable<typeof s> => !!s);
        return (
          <PixelPanel key={`${g.topicId}-${g.sceneIds.join()}`} inner={{ gap: 12, padding: 16 }}>
            <Eyebrow>{L('Người hướng dẫn', 'Guide')}</Eyebrow>
            {/* Lời nhân vật: CHỈ tiếng Anh. */}
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: T.gold, borderWidth: 2, borderColor: T.navy, alignItems: 'center', justifyContent: 'center' }}>
                <Text className="font-strong" style={{ fontSize: 18, color: T.navy }}>G</Text>
              </View>
              <Text className="font-strong" style={{ flex: 1, fontSize: 17, lineHeight: 25, color: T.ink }}>
                “{g.guideLineEn}”
              </Text>
            </View>

            <Text className="font-strong" style={{ fontSize: 15, color: T.navy }}>
              {bi(g.label, locale)}
            </Text>
            {g.otherPlaces ? (
              <Text className="font-sans" style={{ fontSize: 14, lineHeight: 20, color: T.muted }}>
                {L('Các cảnh này diễn ra ở những nơi khác ở Việt Nam, không phải ở thành phố này.', 'These scenes took place elsewhere in Vietnam, not in this city.')}
              </Text>
            ) : null}
            {poiId.startsWith('hochiminh') ? (
              <Text className="font-sans" style={{ fontSize: 14, lineHeight: 20, color: T.muted }}>
                {L('Năm 1945, nơi này được gọi là Sài Gòn — nay là Thành phố Hồ Chí Minh.', 'In 1945 this city was called Saigon; today it is Ho Chi Minh City.')}
              </Text>
            ) : null}

            <View style={{ gap: 4 }}>
              {scenes.map((s) => (
                <Text key={s.id} className="font-sans" style={{ fontSize: 14, color: T.ink }}>
                  {s.n}. {en ? s.titleEn : s.titleVi} · {en ? s.dateLabel.en : s.dateLabel.vi}
                </Text>
              ))}
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {g.sceneIds.length > 0 ? <GameButton label={L('Nghe câu chuyện', 'Hear the story')} onPress={() => router.push(historyHref(g.topicId, g.sceneIds[0], g.dev) as never)} /> : null}
            </View>
            {isDevBuild() && g.dev ? <Text className="font-sans" style={{ fontSize: 12, color: T.muted }}>DEV fixture</Text> : null}
          </PixelPanel>
        );
      })}

      {!poi.action ? (
        <PixelPanel inner={{ gap: 10, padding: 16 }}>
          <Eyebrow>{L('Luyện từ vựng ở đây', 'Practise vocabulary here')}</Eyebrow>
          <Text className="font-sans" style={{ fontSize: 14, color: T.muted }}>
            {open ? L('Lượt hỏi từ vựng của địa điểm này vẫn như thường.', 'The usual vocabulary run for this place.') : L('Cần hoàn thành địa điểm trước đó để mở lượt này.', 'Finish the previous place to open this run.')}
          </Text>
          <GameButton tone="paper" disabled={!open} label={L('Vào lượt luyện từ', 'Start the vocabulary run')} onPress={() => router.push(`/quest/du-ngoan/visit/${poi.id}` as never)} />
        </PixelPanel>
      ) : null}

      <GameButton tone="paper" label={L('Quay lại thành phố', 'Back to the city')} onPress={() => router.replace(`/quest/du-ngoan/${poi.city}` as never)} />
    </View>
  );
}
