/**
 * NỀN "VỪA HỌC VỪA DU LỊCH" cho các màn ôn từ vựng (quiz, học từ, kiểm tra, điền
 * chỗ trống, chính tả, trò chơi, quiz SAT): cảnh đoàn tàu chạy qua thành phố —
 * đúng cảnh ở Toa Từ Vựng (`/quest/rail`), dùng chung hành trình với trang đó.
 *
 * - Mỗi câu ĐÚNG (bắt qua `useGameStore`, như mọi màn gọi `answer()`): tàu tăng
 *   tốc một nhịp và tiến một quãng; đủ số câu thì tới ga kế, hộ chiếu được đóng
 *   dấu, cảnh đổi sang thành phố mới (chui hầm).
 * - Lớp tối phủ lên cảnh để chữ trắng của màn học vẫn đọc rõ.
 * - Góc dưới trái: huy hiệu ga đang ở + quãng còn lại, bấm để mở Toa Từ Vựng;
 *   nút ✕ tắt nền (bật lại ở Toa Từ Vựng).
 * - Người dùng tắt nền → về nền chàm kẻ ô như cũ.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';

import { OliveGrid } from '@/components/layout/OliveGrid';
import { useHydrated } from '@/components/layout/useHydrated';
import { RailScene } from '@/services/rail/scene';
import { localClock, nextOnRoute, routeById, routeOf, stationById, timeOfDayAt } from '@/services/rail/stations';
import { useGameStore } from '@/store/useGameStore';
import { useRailStore } from '@/store/useRailStore';

/**
 * Nền toa tàu có đang bật không. Khi bật, màn học bỏ thanh đánh quái ở trên
 * (người dùng yêu cầu 30/09: đẩy phần ôn tập lên để thấy cảnh phía sau) —
 * câu trả lời vẫn tính XP / sao như cũ, chỉ không vẽ trận đấu.
 */
export function useTravelBackdropOn(): boolean {
  const hydrated = useHydrated();
  const on = useRailStore((s) => s.backdrop);
  return hydrated && on;
}

export function TravelBackdrop({ color, children }: { color: string; children: React.ReactNode }) {
  const hydrated = useHydrated();
  const on = useRailStore((s) => s.backdrop);
  // Trước khi hydrate (và khi người dùng tắt) giữ nền cũ: máy chủ không biết cài đặt của máy này.
  if (!hydrated || !on) return <OliveGrid color={color}>{children}</OliveGrid>;
  return <Travel color={color}>{children}</Travel>;
}

function Travel({ color, children }: { color: string; children: React.ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<RailScene | null>(null);
  const boost = useRef(0);
  const st = useRailStore();
  const station = stationById(st.station);
  const route = routeById(st.route).stops.includes(station.id) ? routeById(st.route) : routeOf(station.id);
  const next = nextOnRoute(route, station.id);
  const [now, setNow] = useState(() => new Date());
  const [arrived, setArrived] = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  const time = st.time === 'auto' ? timeOfDayAt(localClock(station.tz, now).h) : st.time;

  // Cảnh: ngắm tàu từ ngoài (thấy đoàn tàu chạy), vẽ liên tục, dừng vẽ khi tab ẩn.
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const scene = new RailScene(c);
    scene.view = 'outside';
    sceneRef.current = scene;
    const s0 = useRailStore.getState();
    const st0 = stationById(s0.station);
    scene.set(st0, s0.time === 'auto' ? timeOfDayAt(localClock(st0.tz, new Date()).h) : s0.time, s0.weather);
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let last = performance.now();
    const loop = (t: number) => {
      const dt = Math.min(0.1, (t - last) / 1000);
      last = t;
      boost.current = Math.max(0, boost.current - dt * 0.7);
      scene.speed = reduced ? 0.2 : 0.8 + boost.current * 3;
      if (!document.hidden) scene.frame(dt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    sceneRef.current?.set(station, time, st.weather, true);
  }, [station, time, st.weather]);
  useEffect(() => {
    RailScene.preload(next.id, time);
  }, [next.id, time]);

  // Mỗi câu đúng ở màn học: tàu tăng tốc + tiến một quãng.
  useEffect(
    () =>
      useGameStore.subscribe((s, prev) => {
        if (s.life.correct <= prev.life.correct) return;
        boost.current = 1;
        const r = useRailStore.getState().step();
        if (r.arrived) setArrived(r.arrived);
      }),
    [],
  );
  useEffect(() => {
    if (!arrived) return;
    const id = setTimeout(() => setArrived(null), 3800);
    return () => clearTimeout(id);
  }, [arrived]);

  const left = Math.max(0, st.perStation - st.toward);
  // Màn hẹp (điện thoại): huy hiệu thu gọn còn biểu tượng + chấm tiến độ, đỡ che nội dung.
  const narrow = useWindowDimensions().width < 640;

  return (
    <View className="flex-1" style={{ backgroundColor: color }}>
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          aria-hidden
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 100%', imageRendering: 'pixelated' }}
        />
        {/* Lớp tối: đậm ở giữa (nơi thẻ học nằm), nhạt ở mép để cảnh vẫn lộ ra. */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 75% 85% at 50% 42%, rgba(9,16,34,.66), rgba(9,16,34,.42) 65%, rgba(9,16,34,.22))' }} />
      </View>
      {children}
      <View style={{ position: 'absolute', left: 12, bottom: 12, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={`Đang ở ${station.vi}, còn ${left} câu đúng tới ${next.vi}. Mở Toa Từ Vựng`}
          onPress={() => router.push('/quest/rail' as never)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: 'rgba(10,18,34,.72)', borderWidth: 1, borderColor: 'rgba(255,255,255,.14)' }}
        >
          <Text style={{ fontSize: 14 }}>🚆</Text>
          {narrow ? null : <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }}>{station.vi}</Text>}
          <View style={{ flexDirection: 'row', gap: 3 }}>
            {Array.from({ length: st.perStation }, (_, i) => (
              <View key={i} style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: i < st.toward ? route.color : 'rgba(255,255,255,.25)' }} />
            ))}
          </View>
          {narrow ? null : <Text style={{ color: 'rgba(255,255,255,.75)', fontSize: 14 }}>→ {next.vi}</Text>}
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tắt nền toa tàu"
          onPress={() => useRailStore.getState().set({ backdrop: false })}
          style={{ width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(10,18,34,.72)', borderWidth: 1, borderColor: 'rgba(255,255,255,.14)' }}
        >
          <Text style={{ color: 'rgba(255,255,255,.8)', fontSize: 14 }}>✕</Text>
        </Pressable>
      </View>
      {arrived ? (
        <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: '38%', alignItems: 'center' }} accessibilityLiveRegion="polite">
          <View style={{ transform: [{ rotate: '-6deg' }], borderWidth: 4, borderColor: routeOf(arrived).color, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 8, backgroundColor: 'rgba(248,241,226,.95)' }}>
            <Text style={{ color: routeOf(arrived).color, fontSize: 20, fontWeight: '800', letterSpacing: 2 }}>✦ ĐÃ TỚI {stationById(arrived).vi.toUpperCase()} ✦</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}
