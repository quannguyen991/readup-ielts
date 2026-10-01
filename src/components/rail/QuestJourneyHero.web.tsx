/**
 * KHỐI ĐẦU TRANG QUEST — "Hành trình học": cảnh đoàn tàu đang chạy qua thành
 * phố hiện tại (cùng hành trình với Toa Từ Vựng và nền các màn ôn từ), tuyến
 * đang đi dạng sơ đồ, số dấu hộ chiếu, quãng còn lại tới ga kế, và lối vào học.
 *
 * Người dùng yêu cầu 30/09/2026: Quest lấy toa tàu (và thành phố trên máy tính)
 * làm màn hình chính.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';

import { useHydrated } from '@/components/layout/useHydrated';
import { CuteGlobe, CuteTrain } from '@/components/illust/Cute';
import { CuteStar, CuteTrophy, Motion, Sparkles } from '@/components/illust/CuteMore';
import { RailScene } from '@/services/rail/scene';
import { localClock, nextOnRoute, routeById, routeOf, STATIONS, stationById, timeOfDayAt } from '@/services/rail/stations';
import { useRailStore } from '@/store/useRailStore';

const INK = '#FFFFFF';
const MUTED = 'rgba(255,255,255,0.74)';

export function QuestJourneyHero() {
  const hydrated = useHydrated();
  const st = useRailStore();
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<RailScene | null>(null);
  const [now] = useState(() => new Date());

  // Trước khi hydrate dùng ga mặc định (máy chủ không biết hành trình của máy này).
  const station = stationById(hydrated ? st.station : 'hanoi');
  const route = routeById(st.route).stops.includes(station.id) ? routeById(st.route) : routeOf(station.id);
  const next = nextOnRoute(route, station.id);
  const time = st.time === 'auto' ? timeOfDayAt(localClock(station.tz, now).h) : st.time;
  const stamps = hydrated ? Object.keys(st.tickets).length : 0;
  const hereIdx = route.stops.indexOf(station.id);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const scene = new RailScene(c);
    scene.view = 'outside';
    sceneRef.current = scene;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let last = performance.now();
    const loop = (t: number) => {
      const dt = Math.min(0.1, (t - last) / 1000);
      last = t;
      scene.speed = reduced ? 0.2 : 0.9;
      if (!document.hidden) scene.frame(dt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  useEffect(() => {
    sceneRef.current?.set(station, time, st.weather, false);
  }, [station, time, st.weather]);

  const cta = (label: string, href: string, primary = false) => (
    <Pressable
      key={href}
      accessibilityRole="link"
      onPress={() => router.push(href as never)}
      style={({ hovered }: { hovered?: boolean }) => ({
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 11,
        backgroundColor: primary ? (hovered ? '#FDE047' : '#FACC15') : hovered ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.1)',
        borderWidth: primary ? 0 : 1,
        borderColor: 'rgba(255,255,255,0.22)',
        transition: 'background-color 160ms ease',
      } as object)}
    >
      <Text className="font-heavy" style={{ fontSize: 14, color: primary ? '#2A1B02' : INK }}>
        {label}
      </Text>
    </Pressable>
  );

  return (
    <View style={{ borderRadius: 26, overflow: 'hidden', backgroundColor: '#0F2238', flexDirection: wide ? 'row' : 'column', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
      {/* Cảnh tàu chạy */}
      <View style={{ flex: wide ? 1.55 : undefined, position: 'relative', minHeight: wide ? 300 : 190 }}>
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`Đoàn tàu đang chạy qua ${station.vi}`}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 100%', imageRendering: 'pixelated' }}
        />
        <View style={{ position: 'absolute', left: 16, top: 14, flexDirection: 'row', gap: 8 }}>
          <View style={{ borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(10,18,34,0.7)' }}>
            <Text className="font-strong" style={{ fontSize: 12, letterSpacing: 1.2, color: '#FDE68A' }}>
              ĐANG Ở {station.vi.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      {/* Hành trình */}
      <View style={{ flex: 1, padding: wide ? 26 : 18, gap: 12, position: 'relative', overflow: 'hidden' }}>
        <Sparkles count={6} color="#FDE68A" />
        <View style={{ alignSelf: 'flex-start', borderRadius: 999, borderWidth: 1, borderColor: 'rgba(250,204,21,0.4)', backgroundColor: 'rgba(250,204,21,0.1)', paddingHorizontal: 12, paddingVertical: 5 }}>
          <Text className="font-strong" style={{ fontSize: 12, letterSpacing: 1.2, color: '#FDE68A' }}>
            BAND 9 QUEST · HÀNH TRÌNH HỌC
          </Text>
        </View>
        <Text className="font-heavy" style={{ fontSize: wide ? 30 : 24, lineHeight: wide ? 36 : 30, color: INK }}>
          Học tới đâu, <Text style={{ color: '#FACC15' }}>tàu chạy tới đó.</Text>
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }} accessibilityLabel={`Mỗi câu đúng tàu tiến một quãng; ${st.perStation} câu đúng tới thành phố mới`}>
          <Motion kind="float">
            <CuteStar size={40} />
          </Motion>
          <Text className="font-heavy" style={{ fontSize: 18, color: MUTED }}>
            →
          </Text>
          <Motion kind="float" delay={0.3}>
            <CuteTrain size={70} />
          </Motion>
          <Text className="font-heavy" style={{ fontSize: 18, color: MUTED }}>
            →
          </Text>
          <Motion kind="wobble" delay={0.6}>
            <CuteGlobe size={42} />
          </Motion>
          <Motion kind="float" delay={0.9}>
            <CuteTrophy size={42} />
          </Motion>
        </View>

        {/* Tuyến dạng sơ đồ: chấm đã qua / đang ở / chưa tới */}
        <View>
          <Text className="font-semi" style={{ fontSize: 12, color: MUTED }}>
            {route.glyph} Tuyến {route.vi} · ga {hereIdx + 1}/{route.stops.length}
          </Text>
          <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center' }}>
            {route.stops.map((id, i) => (
              <React.Fragment key={id}>
                {i > 0 ? <View style={{ flex: 1, height: 3, backgroundColor: i <= hereIdx ? route.color : 'rgba(255,255,255,0.18)' }} /> : null}
                <View
                  accessibilityLabel={stationById(id).vi}
                  style={{ width: i === hereIdx ? 14 : 9, height: i === hereIdx ? 14 : 9, borderRadius: 7, backgroundColor: i <= hereIdx ? route.color : 'rgba(255,255,255,0.25)', borderWidth: i === hereIdx ? 3 : 0, borderColor: '#FFFFFF' }}
                />
              </React.Fragment>
            ))}
          </View>
          <View style={{ marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <Stat value={`🎫 ${stamps}/${STATIONS.length}`} label="dấu" />
            <Stat value={`✓ ${Math.max(0, st.perStation - (hydrated ? st.toward : 0))}`} label={`→ ${next.vi}`} />
          </View>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
          {cta('🚆 Lên tàu học từ', '/quest/rail', true)}
          {cta('Ôn bộ từ', '/vocabulary/topics')}
          {cta('Chép chính tả', '/sentence/dictation')}
        </View>
      </View>
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,0.07)' }}>
      <Text className="font-heavy" style={{ fontSize: 16, color: INK }}>
        {value}
      </Text>
      <Text className="font-semi" style={{ fontSize: 12, color: MUTED }}>
        {label}
      </Text>
    </View>
  );
}
