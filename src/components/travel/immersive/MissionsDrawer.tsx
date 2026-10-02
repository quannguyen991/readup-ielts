import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { bi, useL } from '@/i18n/useL';
import { playSfx } from '@/services/audio/sfx-ui';
import { journeyOf, type JourneyStep } from '@/services/travel/journey';
import { MISSION_CAPS, claimableCount, missionsFor, statusOf, type Mission, type MissionCtx } from '@/services/travel/missions';
import type { CityId, TravelState } from '@/services/travel/types';
import { CITIES } from '@/services/travel/world';
import { todayKey } from '@/store/persist';
import { useTravelStore } from '@/store/useTravelStore';
import { StarsRow, T } from '../ui/kit';
import { Drawer } from './Drawer';
import { Bar, KIND_GLYPH } from './hudKit';

type Tab = 'route' | 'missions';

export function missionCtx(s: Pick<TravelState, 'ledger' | 'poi' | 'souvenirs' | 'dailyCaps'>): MissionCtx {
  return { ledger: s.ledger, poi: s.poi, souvenirs: s.souvenirs, dailyCaps: s.dailyCaps, day: todayKey() };
}

/** Số nhiệm vụ chờ nhận — cho chấm đỏ trên nút Nhiệm vụ. */
export function useClaimable(city: CityId): number {
  const ledger = useTravelStore((s) => s.ledger);
  const poi = useTravelStore((s) => s.poi);
  const souvenirs = useTravelStore((s) => s.souvenirs);
  const dailyCaps = useTravelStore((s) => s.dailyCaps);
  return useMemo(() => claimableCount(city, missionCtx({ ledger, poi, souvenirs, dailyCaps })), [city, ledger, poi, souvenirs, dailyCaps]);
}

/** Ngăn "Nhiệm vụ": lộ trình của thành phố + nhiệm vụ kiếm vé (ngày / tuần / thành phố / chuỗi). */
export function MissionsDrawer({ city, onClose, onGo }: { city: CityId; onClose: () => void; onGo: (id: string) => void }) {
  const { L } = useL();
  const [tab, setTab] = useState<Tab>('route');
  const claimable = useClaimable(city);
  return (
    <Drawer
      title={L('Nhiệm vụ & lộ trình', 'Missions & route')}
      onClose={onClose}
      header={
        <View style={{ flexDirection: 'row', gap: 8, padding: 10, borderBottomWidth: 1, borderColor: T.line }}>
          {(
            [
              ['route', L('Lộ trình', 'Route'), false],
              ['missions', L('Nhiệm vụ', 'Missions'), claimable > 0],
            ] as [Tab, string, boolean][]
          ).map(([k, label, dot]) => (
            <Pressable
              key={k}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === k }}
              onPress={() => setTab(k)}
              style={{ flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 6, borderWidth: 2, borderColor: T.navy, backgroundColor: tab === k ? T.gold : T.paper }}
            >
              <Text className="font-strong" style={{ fontSize: 14, color: T.navy }}>
                {label}
                {dot ? '  ●' : ''}
              </Text>
            </Pressable>
          ))}
        </View>
      }
    >
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 12, gap: 12 }}>
        {tab === 'route' ? <RouteTab city={city} onGo={onGo} /> : <MissionList city={city} />}
      </ScrollView>
    </Drawer>
  );
}

function stepMark(st: JourneyStep['state']): string {
  return st === 'done' ? '✓' : st === 'next' ? '▶' : st === 'open' ? '○' : '🔒';
}

function RouteTab({ city, onGo }: { city: CityId; onGo: (id: string) => void }) {
  const { L, locale } = useL();
  const poi = useTravelStore((s) => s.poi);
  const visited = useTravelStore((s) => s.visited);
  const j = useMemo(() => journeyOf({ poi, visited }, city), [poi, visited, city]);
  const nextName = j.nextCity ? bi(CITIES[j.nextCity].name, locale) : null;
  return (
    <>
      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Text className="font-heavy" style={{ fontSize: 17, color: T.ink }}>
            {bi(CITIES[city].name, locale)}
          </Text>
          <Text className="font-strong" style={{ fontSize: 14, color: T.goldDark }}>
            {j.passed}/{j.total} · {j.pct}%
          </Text>
        </View>
        <Bar pct={j.pct} height={10} />
        <Text className="font-sans" style={{ fontSize: 14, color: T.muted }}>
          {j.stamped ? L('Đã đóng dấu hộ chiếu thành phố này.', 'Passport stamp collected for this city.') : L('Đạt 2 sao ở mọi địa điểm để đóng dấu hộ chiếu.', 'Pass every place with 2 stars to earn the passport stamp.')}
        </Text>
      </View>
      {nextName ? (
        <View style={{ gap: 6, padding: 10, borderRadius: 8, borderWidth: 1.5, borderColor: T.line, backgroundColor: T.paperDeep }}>
          <Text className="font-strong" style={{ fontSize: 14, color: T.ink }}>
            {j.unlockPct >= 100 ? L(`Đã đủ điều kiện mở ${nextName} (và các thành phố kế).`, `You can unlock ${nextName} (and the next cities).`) : L(`Còn ${j.needMore} địa điểm để mở ${nextName}`, `${j.needMore} more places to unlock ${nextName}`)}
          </Text>
          <Bar pct={j.unlockPct} color={j.unlockPct >= 100 ? T.good : T.gold} />
        </View>
      ) : null}
      {j.next ? (
        <View style={{ gap: 8, padding: 10, borderRadius: 8, borderWidth: 2, borderColor: T.gold, backgroundColor: '#FBF1D3' }}>
          <Text className="font-strong" style={{ fontSize: 14, color: T.goldDark, letterSpacing: 1 }}>
            {L('BƯỚC TIẾP THEO', 'NEXT STEP')}
          </Text>
          <Text className="font-strong" style={{ fontSize: 16, color: T.ink }}>
            {KIND_GLYPH[j.next.kind] ?? '📍'} {bi(j.next.name, locale)}
          </Text>
          <Pressable accessibilityRole="button" onPress={() => onGo(j.next!.id)} style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 6, borderWidth: 2, borderColor: T.navy, backgroundColor: T.gold }}>
            <Text className="font-strong" style={{ fontSize: 14, color: T.navy }}>
              {L('Đi tới', 'Go there')}
            </Text>
          </Pressable>
        </View>
      ) : null}
      <View style={{ gap: 6 }}>
        {j.steps.map((s, i) => (
          <Pressable
            key={s.poi.id}
            accessibilityRole="button"
            disabled={s.state === 'locked'}
            onPress={() => onGo(s.poi.id)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1.5, borderColor: s.state === 'next' ? T.gold : T.line, backgroundColor: s.state === 'done' ? T.goodSoft : T.paper, opacity: s.state === 'locked' ? 0.65 : 1 }}
          >
            <Text style={{ width: 22, textAlign: 'center', fontSize: 16, color: s.state === 'done' ? T.good : T.goldDark }}>{stepMark(s.state)}</Text>
            <View style={{ flex: 1 }}>
              <Text className="font-strong" style={{ fontSize: 14, color: T.ink }}>
                {i + 1}. {bi(s.poi.name, locale)}
              </Text>
              {s.state === 'locked' && s.needs ? (
                <Text className="font-sans" style={{ fontSize: 14, color: T.muted }}>
                  {L(`Sau ${s.needs.name.vi}`, `After ${s.needs.name.en}`)}
                </Text>
              ) : null}
            </View>
            {!s.poi.action ? <StarsRow n={s.stars} size={13} /> : null}
          </Pressable>
        ))}
      </View>
    </>
  );
}

function MissionList({ city }: { city: CityId }) {
  const { L, locale } = useL();
  const ledger = useTravelStore((s) => s.ledger);
  const poi = useTravelStore((s) => s.poi);
  const souvenirs = useTravelStore((s) => s.souvenirs);
  const dailyCaps = useTravelStore((s) => s.dailyCaps);
  const claim = useTravelStore((s) => s.claimMission);
  const [msg, setMsg] = useState('');
  const ctx = useMemo(() => missionCtx({ ledger, poi, souvenirs, dailyCaps }), [ledger, poi, souvenirs, dailyCaps]);
  const all = useMemo(() => missionsFor(city), [city]);
  const groups: [string, string, Mission[]][] = [
    ['daily', L('Hôm nay', 'Today'), all.filter((m) => m.scope === 'daily')],
    ['weekly', L('Tuần này', 'This week'), all.filter((m) => m.scope === 'weekly')],
    ['city', bi(CITIES[city].name, locale), all.filter((m) => m.scope === 'city')],
    ['streak', L('Chuỗi ngày', 'Streaks'), all.filter((m) => m.scope === 'streak')],
  ];
  const onClaim = (m: Mission) => {
    const r = claim(m.id);
    if (r.ok) {
      playSfx(r.tickets > 0 ? 'reward' : 'coin');
      setMsg(L(`Đã nhận ${[r.tickets ? `+${r.tickets} vé` : '', r.coins ? `+${r.coins} xu` : ''].filter(Boolean).join(' ')}`, `Claimed ${[r.tickets ? `+${r.tickets} ticket${r.tickets > 1 ? 's' : ''}` : '', r.coins ? `+${r.coins} coins` : ''].filter(Boolean).join(' ')}`));
    } else if (r.reason === 'cap') setMsg(L('Hôm nay / tuần này đã nhận đủ vé từ nhiệm vụ.', 'You have reached the ticket limit for this period.'));
  };
  return (
    <>
      <Text className="font-sans" style={{ fontSize: 14, color: T.muted }}>
        {L(`Vé từ nhiệm vụ: tối đa +${MISSION_CAPS.dailyTickets}/ngày và +${MISSION_CAPS.weeklyTickets}/tuần. Mỗi nhiệm vụ nhận một lần mỗi kỳ.`, `Mission tickets: up to +${MISSION_CAPS.dailyTickets} a day and +${MISSION_CAPS.weeklyTickets} a week. Each mission pays once per period.`)}
      </Text>
      {msg ? (
        <View accessibilityLiveRegion="polite" style={{ padding: 8, borderRadius: 6, backgroundColor: T.goodSoft, borderWidth: 1, borderColor: T.good }}>
          <Text className="font-strong" style={{ fontSize: 14, color: T.good }}>
            {msg}
          </Text>
        </View>
      ) : null}
      {groups.map(([key, title, list]) =>
        list.length ? (
          <View key={key} style={{ gap: 8 }}>
            <Text className="font-heavy" style={{ fontSize: 14, letterSpacing: 1.2, color: T.goldDark, textTransform: 'uppercase' }}>
              {title}
            </Text>
            {list.map((m) => {
              const st = statusOf(m, ctx);
              return (
                <View key={m.id} style={{ gap: 6, padding: 10, borderRadius: 8, borderWidth: 1.5, borderColor: st.claimable ? T.gold : T.line, backgroundColor: st.claimed ? T.goodSoft : st.claimable ? '#FBF1D3' : T.paper }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text className="font-strong" style={{ flex: 1, fontSize: 14, color: T.ink }}>
                      {bi(m.title, locale)}
                    </Text>
                    <Text className="font-strong" style={{ fontSize: 14, color: T.goldDark }}>
                      {m.reward.tickets ? `🎫${m.reward.tickets} ` : ''}
                      {m.reward.coins ? `●${m.reward.coins}` : ''}
                    </Text>
                  </View>
                  <Text className="font-sans" style={{ fontSize: 14, color: T.muted }}>
                    {bi(m.hint, locale)}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Bar pct={(st.progress / st.goal) * 100} color={st.done ? T.good : T.gold} style={{ flex: 1 }} />
                    <Text className="font-strong" style={{ fontSize: 14, color: T.ink }}>
                      {st.progress}/{st.goal}
                    </Text>
                  </View>
                  {st.claimed ? (
                    <Text className="font-strong" style={{ fontSize: 14, color: T.good }}>
                      ✓ {L('Đã nhận', 'Claimed')}
                    </Text>
                  ) : st.capped ? (
                    <Text className="font-sans" style={{ fontSize: 14, color: T.muted }}>
                      {L('Đã hết lượt nhận vé kỳ này — quay lại sau.', 'Ticket limit reached for this period — come back later.')}
                    </Text>
                  ) : (
                    <Pressable
                      accessibilityRole="button"
                      disabled={!st.claimable}
                      onPress={() => onClaim(m)}
                      style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 6, borderWidth: 2, borderColor: T.navy, backgroundColor: st.claimable ? T.gold : '#E4DCC8' }}
                    >
                      <Text className="font-strong" style={{ fontSize: 14, color: st.claimable ? T.navy : T.muted }}>
                        {st.claimable ? L('Nhận thưởng', 'Claim reward') : L('Chưa xong', 'In progress')}
                      </Text>
                    </Pressable>
                  )}
                </View>
              );
            })}
          </View>
        ) : null,
      )}
    </>
  );
}
