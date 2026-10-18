import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { useCityStatus, useTravelReady } from '@/components/travel/useTravel';
import { Eyebrow, PixelPanel, StampGlyph, StarsRow, T } from '@/components/travel/ui/kit';
import { PassportBoard } from '@/components/travel/ui/PassportBoard';
import { PassportRewards } from '@/components/travel/ui/PassportRewards';
import { TravelPage } from '@/components/travel/ui/TravelPage';
import { Traveller } from '@/components/travel/ui/Traveller';
import { Icon } from '@/components/ui/Icon';
import { mainPoisOfCity } from '@/data/travel/pois';
import { bi, useL } from '@/i18n/useL';
import { pointsOf, readyTiers } from '@/services/travel/passport';
import { CITIES, CITY_ORDER } from '@/services/travel/world';
import { useTravelStore } from '@/store/useTravelStore';

/**
 * /quest/du-ngoan/passport — Hộ chiếu, ba tab: Tem (con dấu từng thành phố, tiến độ), Quà (điểm hộ chiếu và
 * các mốc quà, kể cả "Pro Max"), Xếp hạng ("Ai đi nhiều nhất" của tháng). Mở thẳng một tab bằng `?tab=gifts|board`.
 */
type Tab = 'stamps' | 'gifts' | 'board';
export default function PassportRoute() {
  const ready = useTravelReady();
  const { L } = useL();
  if (!ready) return <TravelPage title={L('Hộ chiếu', 'Passport')} back="/quest/du-ngoan" hud={false}>{null}</TravelPage>;
  return <Passport />;
}

function Passport() {
  const { L, locale } = useL();
  const status = useCityStatus();
  const name = useTravelStore((s) => s.prefs.name);
  const outfit = useTravelStore((s) => s.prefs.outfit);
  const level = useTravelStore((s) => s.passportLevel);
  const visited = useTravelStore((s) => s.visited);
  const poi = useTravelStore((s) => s.poi);
  const souvenirs = useTravelStore((s) => s.souvenirs);
  const params = useLocalSearchParams<{ tab?: string }>();
  const first = params.tab === 'gifts' || params.tab === 'board' ? params.tab : 'stamps';
  const [tab, setTab] = useState<Tab>(first);
  const ledger = useTravelStore((s) => s.ledger);
  const points = pointsOf(ledger);
  const ready = readyTiers(ledger).length;
  const stamps = CITY_ORDER.filter((c) => status[c].stamp).length;
  const starTotal = Object.values(poi).reduce((n, p) => n + p.best, 0);

  const fmt = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString(locale === 'en' ? 'en-GB' : 'vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <TravelPage title={L('Hộ chiếu', 'Passport')} back="/quest/du-ngoan" backLabel={L('Bản đồ', 'Map')}>
      <PixelPanel tone="navy" inner={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <View style={{ backgroundColor: T.paper, padding: 10, borderRadius: 4 }}>
          <Traveller outfit={outfit} size={48} />
        </View>
        <View style={{ flex: 1, minWidth: 180 }}>
          <Text className="font-heavy" style={{ fontSize: 22, color: T.goldLight }}>
            {name || L('Lữ khách', 'Traveller')}
          </Text>
          <Text className="font-strong" style={{ fontSize: 15, color: T.cream }}>
            {L(`Hộ chiếu cấp ${level}`, `Passport level ${level}`)}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 18, flexWrap: 'wrap' }}>
          <Stat n={stamps} label={L('Con dấu', 'Stamps')} />
          <Stat n={Object.keys(souvenirs).length} label={L('Quà', 'Souvenirs')} />
          <Stat n={points} label={L('Điểm', 'Points')} />
          <Stat n={starTotal} label={L('Sao', 'Stars')} />
        </View>
      </PixelPanel>

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }} accessibilityRole="tablist">
        {(
          [
            ['stamps', L('Tem', 'Stamps'), 0],
            ['gifts', L('Quà', 'Rewards'), ready],
            ['board', L('Xếp hạng', 'Ranking'), 0],
          ] as [Tab, string, number][]
        ).map(([id, label, badge]) => (
          <Pressable
            key={id}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === id }}
            onPress={() => setTab(id)}
            style={{ flex: 1, maxWidth: 200, minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 6, borderWidth: 2, borderColor: tab === id ? T.navy : T.line, backgroundColor: tab === id ? T.goldLight : T.paper }}
          >
            <Text className="font-strong" style={{ fontSize: 15, color: T.ink }}>
              {label}
            </Text>
            {badge ? (
              <View style={{ minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center', backgroundColor: T.bad }}>
                <Text className="font-heavy" style={{ fontSize: 14, color: '#2A1808' }}>
                  {badge}
                </Text>
              </View>
            ) : null}
          </Pressable>
        ))}
      </View>

      {tab === 'gifts' ? (
        <View style={{ marginTop: 16 }}>
          <PassportRewards />
        </View>
      ) : null}
      {tab === 'board' ? (
        <View style={{ marginTop: 16 }}>
          <PassportBoard />
        </View>
      ) : null}

      {tab === 'stamps' ? (
      <>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 18 }}>
        {CITY_ORDER.map((c) => {
          const st = status[c];
          const stars = mainPoisOfCity(c).reduce((n, p) => n + (poi[p.id]?.best ?? 0), 0);
          const max = mainPoisOfCity(c).length * 3;
          return (
            <View key={c} style={{ flexGrow: 1, flexBasis: 300, minWidth: 260 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${bi(CITIES[c].name, locale)}${st.stamp ? L(' — đã có con dấu', ' — stamped') : ''}`}
                onPress={() => st.visited && router.push(`/quest/du-ngoan/${c}` as never)}
                disabled={!st.visited}
              >
                <PixelPanel inner={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14, opacity: st.visited ? 1 : 0.55 }}>
                  <View style={{ width: 72, height: 72, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: st.stamp ? '-8deg' : '0deg' }] }}>
                    {st.stamp ? <StampGlyph size={72} color={CITIES[c].tint} /> : st.visited ? <StampGlyph size={72} color="#B9B09A" /> : <Icon name="lock" size={28} color={T.muted} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text className="font-heavy" style={{ fontSize: 18, color: T.ink }}>
                      {bi(CITIES[c].name, locale)}
                    </Text>
                    {st.visited ? (
                      <>
                        <Text className="font-sans" style={{ fontSize: 14, color: T.muted }}>
                          {L('Đến ngày ', 'Arrived ')}
                          {fmt(visited[c]?.firstAt)}
                        </Text>
                        {c !== 'hanoi' ? (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                            <Text className="font-strong" style={{ fontSize: 14, color: T.ink }}>
                              {st.done}/{st.total}
                            </Text>
                            <StarsRow n={max ? Math.round((stars / max) * 3) : 0} size={14} />
                          </View>
                        ) : null}
                      </>
                    ) : (
                      <Text className="font-sans" style={{ fontSize: 14, color: T.muted }}>
                        {L('Chưa ghé', 'Not visited yet')}
                      </Text>
                    )}
                  </View>
                </PixelPanel>
              </Pressable>
            </View>
          );
        })}
      </View>
      <View style={{ marginTop: 18 }}>
        <Eyebrow>{L('Cách có con dấu', 'How to earn a stamp')}</Eyebrow>
        <Text className="font-sans" style={{ fontSize: 15, color: T.muted }}>
          {L('Đạt hết các địa điểm của một thành phố.', 'Pass every place in a city.')}
        </Text>
      </View>
      </>
      ) : null}
    </TravelPage>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <View style={{ alignItems: 'center', minWidth: 52 }}>
      <Text className="font-heavy" style={{ fontSize: 22, color: T.goldLight }}>
        {n}
      </Text>
      <Text className="font-sans" style={{ fontSize: 14, color: T.cream }}>
        {label}
      </Text>
    </View>
  );
}
