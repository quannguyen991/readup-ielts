import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Icon } from '@/components/ui/Icon';
import { useCityStatus, useTravelReady } from '@/components/travel/useTravel';
import { GameButton, PixelPanel, StarsRow, StampGlyph, T, TicketGlyph } from '@/components/travel/ui/kit';
import { useReducedMotion } from '@/components/travel/ui/hooks';
import { Onboarding } from '@/components/travel/ui/Onboarding';
import { TravelPage } from '@/components/travel/ui/TravelPage';
import { WorldMapView, type Flight } from '@/components/travel/ui/WorldMapView';
import { bi, useL } from '@/i18n/useL';
import { CITIES, CITY_ORDER, canFly } from '@/services/travel/world';
import type { CityId } from '@/services/travel/types';
import { useTravelStore } from '@/store/useTravelStore';

/**
 * /quest/du-ngoan — Bản đồ thế giới của "Du ngoạn Band 9": chọn thành phố, xem
 * giá vé, bay. Lần đầu mở là màn giới thiệu (ba slide, đặt tên, nhận 2 vé).
 */
export default function TravelWorldRoute() {
  const ready = useTravelReady();
  const onboarded = useTravelStore((s) => s.onboarded);
  const { L } = useL();

  if (!ready) return <TravelPage title={L('Du ngoạn thế giới', 'Travel the world')} hud={false}>{null}</TravelPage>;
  if (!onboarded) {
    return (
      <TravelPage title={L('Du ngoạn thế giới', 'Travel the world')} hud={false}>
        <Onboarding />
      </TravelPage>
    );
  }
  return <World />;
}

const FLIGHT_MS = 1800;

function World() {
  const { L, locale } = useL();
  const reduced = useReducedMotion();
  const status = useCityStatus();
  const current = useTravelStore((s) => s.city);
  const tickets = useTravelStore((s) => s.tickets);
  const poiState = useTravelStore((s) => s.poi);
  const visited = useTravelStore((s) => s.visited);
  const fly = useTravelStore((s) => s.fly);
  const [selected, setSelected] = useState<CityId | null>(null);
  const [flight, setFlight] = useState<Flight | null>(null);
  const raf = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (raf.current) clearInterval(raf.current);
  }, []);

  const go = useCallback((city: CityId) => router.push(`/quest/du-ngoan/${city}` as never), []);

  const startFlight = useCallback(
    (to: CityId) => {
      const from = current;
      const r = fly(to);
      if (!r.ok) return;
      if (reduced) {
        go(to);
        return;
      }
      const t0 = Date.now();
      setFlight({ from, to, t: 0 });
      raf.current = setInterval(() => {
        const t = Math.min(1, (Date.now() - t0) / FLIGHT_MS);
        setFlight({ from, to, t });
        if (t >= 1) {
          if (raf.current) clearInterval(raf.current);
          raf.current = null;
          setFlight(null);
          go(to);
        }
      }, 40);
    },
    [current, fly, go, reduced],
  );

  // Mặc định chọn thành phố đang ở.
  const sel = selected ?? current;
  const meta = CITIES[sel];
  const st = status[sel];
  const check = canFly({ tickets, city: current, poi: poiState }, sel);
  const flying = !!flight;
  const firstTrip = Object.keys(visited).length <= 1 && sel === current;

  let action: React.ReactNode;
  if (sel === current) {
    action = <GameButton label={L('Vào thành phố', 'Enter the city')} icon="arrow-right" onPress={() => go(sel)} disabled={flying} />;
  } else if (check.ok) {
    action = (
      <GameButton
        label={check.cost === 0 ? L('Về nhà (miễn phí)', 'Fly home (free)') : L(`Bay (−${check.cost} vé)`, `Fly (−${check.cost} ticket${check.cost > 1 ? 's' : ''})`)}
        icon="compass"
        onPress={() => startFlight(sel)}
        disabled={flying}
      />
    );
  } else if (check.reason === 'locked') {
    const need = meta.requires ? bi(CITIES[meta.requires].name, locale) : '';
    action = <GameButton label={L(`Mở khi xong 60% ${need}`, `Unlocks at 60% of ${need}`)} icon="lock" tone="paper" disabled />;
  } else {
    action = <GameButton label={L('Chưa đủ vé — kiếm vé', 'Not enough tickets — earn some')} icon="plus" tone="navy" onPress={() => router.push('/quest/du-ngoan/airport' as never)} />;
  }

  return (
    <TravelPage title={L('Du ngoạn thế giới', 'Travel the world')}>
      <WorldMapView current={current} selected={sel} status={status} onSelect={setSelected} flight={flight} />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }} accessibilityRole="list">
        {CITY_ORDER.map((c) => {
          const on = c === sel;
          return (
            <Pressable
              key={c}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              onPress={() => setSelected(c)}
              style={{ minHeight: 44, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 6, borderWidth: 2, borderColor: on ? T.navy : T.line, backgroundColor: on ? T.goldLight : T.paper }}
            >
              {!status[c].unlocked ? <Icon name="lock" size={14} color={T.muted} /> : <View style={{ width: 10, height: 10, backgroundColor: CITIES[c].tint }} />}
              <Text className="font-strong" style={{ fontSize: 14, color: T.ink }}>
                {bi(CITIES[c].name, locale)}
              </Text>
              {status[c].stamp ? <Icon name="check" size={14} color={T.goldDark} /> : null}
              {c === current ? <Icon name="compass" size={14} color={T.navy} /> : null}
            </Pressable>
          );
        })}
      </View>

      <PixelPanel style={{ marginTop: 18 }} inner={{ padding: 16, gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <View style={{ width: 8, alignSelf: 'stretch', backgroundColor: meta.tint, borderRadius: 2 }} />
          <View style={{ flex: 1, minWidth: 180 }}>
            <Text className="font-heavy" style={{ fontSize: 22, color: T.ink }}>
              {bi(meta.name, locale)}
              <Text className="font-sans" style={{ fontSize: 15, color: T.muted }}>
                {'  '}
                {bi(meta.country, locale)}
              </Text>
            </Text>
            <Text className="font-sans" style={{ fontSize: 15, color: T.muted, marginTop: 2 }}>
              {bi(meta.tagline, locale)}
            </Text>
          </View>
          {st.stamp ? <StampGlyph size={52} /> : null}
        </View>

        <View style={{ flexDirection: 'row', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <Text className="font-strong" style={{ fontSize: 14, color: T.ink }}>
            {L('Band ', 'Band ')}
            {meta.band}
          </Text>
          {sel !== 'hanoi' ? (
            <Text className="font-strong" style={{ fontSize: 14, color: T.ink }}>
              {L(`${st.done}/${st.total} chỗ`, `${st.done}/${st.total} places`)}
            </Text>
          ) : null}
          {sel !== current ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <TicketGlyph size={18} />
              <Text className="font-strong" style={{ fontSize: 14, color: T.ink }}>
                {check.cost === 0 ? L('Miễn phí', 'Free') : L(`${check.cost} vé`, `${check.cost} ticket${check.cost > 1 ? 's' : ''}`)}
              </Text>
            </View>
          ) : (
            <Text className="font-strong" style={{ fontSize: 14, color: T.good }}>
              {L('Bạn đang ở đây', 'You are here')}
            </Text>
          )}
          {st.total > 0 && sel !== 'hanoi' ? <StarsRow n={Math.min(3, Math.round((st.done / st.total) * 3))} /> : null}
        </View>

        <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>{action}</View>
        {firstTrip ? (
          <Text className="font-sans" style={{ fontSize: 14, color: T.muted }}>
            {L('Chạm một thành phố để xem giá vé.', 'Tap a city to see its ticket price.')}
          </Text>
        ) : null}
      </PixelPanel>

      <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
        <GameButton label={L('Quầy vé', 'Ticket counter')} icon="plus" tone="paper" onPress={() => router.push('/quest/du-ngoan/airport' as never)} />
        <GameButton label={L('Hộ chiếu', 'Passport')} icon="bookmark" tone="paper" onPress={() => router.push('/quest/du-ngoan/passport' as never)} />
        <GameButton label={L('Vali', 'Suitcase')} icon="gift" tone="paper" onPress={() => router.push('/quest/du-ngoan/suitcase' as never)} />
      </View>
    </TravelPage>
  );
}
