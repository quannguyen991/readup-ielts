import React from 'react';
import { Text, View } from 'react-native';

import { useTravelReady } from '@/components/travel/useTravel';
import { Eyebrow, PixelPanel, T } from '@/components/travel/ui/kit';
import { TravelPage } from '@/components/travel/ui/TravelPage';
import { SOUVENIRS } from '@/data/travel/souvenirs';
import { bi, useL } from '@/i18n/useL';
import { CITIES, CITY_ORDER } from '@/services/travel/world';
import { useTravelStore } from '@/store/useTravelStore';

/** /quest/du-ngoan/suitcase — Vali: quà lưu niệm đã có, theo thành phố. */
export default function SuitcaseRoute() {
  const ready = useTravelReady();
  const { L } = useL();
  if (!ready) return <TravelPage title={L('Vali', 'Suitcase')} back="/quest/du-ngoan" hud={false}>{null}</TravelPage>;
  return <Suitcase />;
}

function Suitcase() {
  const { L, locale } = useL();
  const owned = useTravelStore((s) => s.souvenirs);
  const total = SOUVENIRS.length;
  const have = SOUVENIRS.filter((s) => owned[s.id]).length;

  return (
    <TravelPage title={L('Vali', 'Suitcase')} back="/quest/du-ngoan" backLabel={L('Bản đồ', 'Map')}>
      <Text className="font-strong" style={{ fontSize: 15, color: T.muted, marginBottom: 14 }}>
        {L(`${have}/${total} món quà`, `${have}/${total} souvenirs`)}
      </Text>
      {CITY_ORDER.map((c) => {
        const list = SOUVENIRS.filter((s) => s.city === c);
        if (!list.length) return null;
        return (
          <View key={c} style={{ marginBottom: 20 }}>
            <Eyebrow>{bi(CITIES[c].name, locale)}</Eyebrow>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {list.map((s) => {
                const got = !!owned[s.id];
                return (
                  <View key={s.id} style={{ flexGrow: 1, flexBasis: 220, maxWidth: 340, minWidth: 180 }} accessible accessibilityLabel={got ? `${bi(s.name, locale)}. ${bi(s.desc, locale)}` : L('Quà chưa mở', 'Locked souvenir')}>
                    <PixelPanel inner={{ padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: 4,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: got ? (s.rare ? T.goldLight : T.paperDeep) : '#E4DCC8',
                          borderWidth: 2,
                          borderColor: got ? T.gold : '#CFC5AB',
                        }}
                      >
                        <Text style={{ fontSize: 28, opacity: got ? 1 : 0.25 }}>{got ? s.glyph : '?'}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text className="font-strong" style={{ fontSize: 15, color: got ? T.ink : T.muted }}>
                          {got ? bi(s.name, locale) : L('Chưa mở', 'Locked')}
                        </Text>
                        <Text className="font-sans" style={{ fontSize: 14, color: T.muted }}>
                          {got ? bi(s.desc, locale) : L('Hoàn thành một địa điểm để nhận.', 'Pass a place to get it.')}
                        </Text>
                      </View>
                    </PixelPanel>
                  </View>
                );
              })}
            </View>
          </View>
        );
      })}
    </TravelPage>
  );
}
