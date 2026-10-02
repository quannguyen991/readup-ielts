/**
 * NỀN "VỪA HỌC VỪA DU LỊCH" cho các màn ôn từ vựng (quiz, học từ, kiểm tra, điền
 * chỗ trống, chính tả, trò chơi, quiz SAT): nhân vật bay (máy bay, kỳ lân, rồng…)
 * lướt qua các thành phố — đúng cảnh ở Chuyến bay từ vựng (`/quest/rail`), dùng
 * chung hành trình và nhân vật đã chọn với trang đó.
 *
 * - Mỗi câu ĐÚNG (bắt qua `useGameStore`, như mọi màn gọi `answer()`): nhân vật
 *   tăng tốc một nhịp và bay thêm một quãng; đủ số câu thì tới thành phố kế, hộ
 *   chiếu được đóng dấu, cảnh đổi sang thành phố mới (bay xuyên dải mây).
 * - Lớp tối phủ lên cảnh để chữ trắng của màn học vẫn đọc rõ.
 * - Góc dưới trái: huy hiệu nhân vật + thành phố đang bay qua + quãng còn lại,
 *   bấm để mở Chuyến bay từ vựng; nút ✕ tắt nền (bật lại ở Chuyến bay từ vựng).
 * - Người dùng tắt nền → về nền chàm kẻ ô như cũ.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { router, usePathname } from 'expo-router';

import { LightGrid } from '@/components/layout/LightGrid';
import { OliveGrid } from '@/components/layout/OliveGrid';
import { useHydrated } from '@/components/layout/useHydrated';
import { setFlightSfx, sfx } from '@/services/audio/sfx';
import { flyerById } from '@/services/rail/flyers';
import { RailScene } from '@/services/rail/scene';
import { localClock, nextOnRoute, routeById, routeOf, stationById, timeOfDayAt } from '@/services/rail/stations';
import { useGameStore } from '@/store/useGameStore';
import { useRailStore } from '@/store/useRailStore';
import { useTravelPractice } from '@/store/useTravelPractice';
import { isTravelLightRoute, isVocabStudyRoute } from '@/navigation/focus-routes';
import { useL } from '@/i18n/useL';
import { FlyerThumb } from './FlyerThumb';
import { StudyBackdrop } from '@/components/vocab/study/StudyBackdrop';
import { useStoreThemeId } from '@/components/vocab/study/useStudyTheme';
import { useTopicStudyStore } from '@/store/useTopicStudyStore';

/**
 * Nền cảnh bay có đang bật không. Khi bật, màn học bỏ thanh đánh quái ở trên
 * (người dùng yêu cầu 30/09: đẩy phần ôn tập lên để thấy cảnh phía sau) —
 * câu trả lời vẫn tính XP / sao như cũ, chỉ không vẽ trận đấu.
 */
export function useTravelBackdropOn(): boolean {
  const hydrated = useHydrated();
  const on = useRailStore((s) => s.backdrop);
  return hydrated && on;
}

/**
 * `tone`: 'dark' cho màn ôn từ (chữ trắng trên nền chàm) — phủ lớp tối;
 * 'light' cho màn luyện câu (chữ đậm, thẻ trắng) — phủ lớp sáng, cảnh vẫn lộ ở mép.
 */
/**
 * Màn hiện tại có đang chạy nền cảnh bay không: bật trong cài đặt VÀ đang làm bài
 * — màn ôn từ vựng luôn là làm bài; chép chính tả / viết câu chỉ khi đã mở một bộ.
 */
export function useTravelActive(): boolean {
  const on = useTravelBackdropOn();
  const pathname = usePathname();
  const practicing = useTravelPractice((s) => s.count > 0);
  // Màn ôn từ chỉ chạy cảnh bay khi người học bật "Nền & hiệu ứng" và chọn chủ đề Cảnh bay pixel.
  const sceneStudy = useStoreThemeId() === 'scene' && isVocabStudyRoute(pathname);
  return sceneStudy || (on && isTravelLightRoute(pathname) && practicing);
}

/** Ô nhiễu 128×128 (SVG feTurbulence, xám) — lát kín, dùng để làm mịn dải chuyển sắc. */
const DITHER = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='128'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

export function TravelBackdrop({ color, tone = 'dark', children }: { color: string; tone?: 'dark' | 'light'; children: React.ReactNode }) {
  const hydrated = useHydrated();
  const on = useRailStore((s) => s.backdrop);
  const themeId = useStoreThemeId();
  // Màn ôn từ vựng: nền phẳng (mặc định) hoặc chủ đề người học chọn; chỉ chủ đề "Cảnh bay pixel" mới dựng cảnh canvas.
  if (hydrated && tone === 'dark' && themeId !== 'scene') return <StudyBackdrop id={themeId}>{children}</StudyBackdrop>;
  if (hydrated && tone === 'dark') return <Travel color={color} tone={tone}>{children}</Travel>;
  // Trước khi hydrate (và khi người dùng tắt) giữ nền cũ: máy chủ không biết cài đặt của máy này.
  if (!hydrated || !on) return tone === 'light' ? <LightGrid>{children}</LightGrid> : <OliveGrid color={color}>{children}</OliveGrid>;
  return (
    <Travel color={color} tone={tone}>
      {children}
    </Travel>
  );
}

function Travel({ color, tone, children }: { color: string; tone: 'dark' | 'light'; children: React.ReactNode }) {
  const { L, en } = useL();
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
  // Đang bay qua thành phố: câu đúng / sai phát tiếng gió + chuông thay cho tiếng trận đấu.
  useEffect(() => {
    setFlightSfx(true);
    return () => setFlightSfx(false);
  }, []);
  const time = st.time === 'auto' ? timeOfDayAt(localClock(station.tz, now).h) : st.time;

  // Cảnh: nhân vật bay lệch sang phải (bên trái là thẻ học), vẽ liên tục, dừng vẽ khi tab ẩn.
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const scene = new RailScene(c);
    sceneRef.current = scene;
    const s0 = useRailStore.getState();
    const st0 = stationById(s0.station);
    scene.setFlyer(s0.flyer);
    scene.set(st0, s0.time === 'auto' ? timeOfDayAt(localClock(st0.tz, new Date()).h) : s0.time, s0.weather);
    const reduced = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    scene.calm = reduced;
    let raf = 0;
    let last = performance.now();
    const loop = (t: number) => {
      const dt = Math.min(0.1, (t - last) / 1000);
      last = t;
      boost.current = Math.max(0, boost.current - dt * 0.7);
      scene.speed = reduced ? 0.4 : 0.8 + boost.current * 3;
      // Màn rộng: nhân vật bay lệch sang phải (bên trái là thẻ học). Màn hẹp chỉ thấy một lát giữa cảnh nên bay giữa khung, cao hơn thẻ.
      const wide = window.innerWidth >= 640;
      scene.flyerX = wide ? 0.67 : 0.5;
      scene.flyerY = wide ? 0.34 : 0.24;
      if (!document.hidden) scene.frame(dt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      scene.dispose();
    };
  }, []);

  useEffect(() => {
    sceneRef.current?.set(station, time, st.weather, true);
  }, [station, time, st.weather]);
  useEffect(() => {
    sceneRef.current?.setFlyer(st.flyer);
  }, [st.flyer]);
  useEffect(() => {
    RailScene.preload(next.id, time);
  }, [next.id, time]);

  // Mỗi câu đúng ở màn học: nhân vật tăng tốc + bay thêm một quãng.
  useEffect(
    () =>
      useGameStore.subscribe((s, prev) => {
        if (s.life.correct <= prev.life.correct) return;
        boost.current = 1;
        const r = useRailStore.getState().step();
        if (r.arrived) {
          setArrived(r.arrived);
          sfx.flyArrive();
        }
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
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 100%' }}
        />
        {/* Lớp tối: đậm ở giữa (nơi thẻ học nằm), nhạt ở mép để cảnh vẫn lộ ra. */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              tone === 'light'
                ? 'radial-gradient(ellipse 80% 90% at 50% 40%, rgba(238,243,251,.80), rgba(238,243,251,.62) 60%, rgba(238,243,251,.30))'
                : 'radial-gradient(ellipse 75% 85% at 50% 42%, rgba(9,16,34,.66), rgba(9,16,34,.42) 65%, rgba(9,16,34,.22))',
          }}
        />
        {/* Nhiễu rất nhẹ phá dải màu (banding) của lớp tối khi chuyển sắc. */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.07, mixBlendMode: 'overlay', backgroundImage: DITHER, backgroundSize: '128px 128px' }} />
      </View>
      {children}
      <View style={{ position: 'absolute', left: 12, bottom: 12, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={L(`${flyerById(st.flyer).vi} đang bay qua ${station.vi}, còn ${left} câu đúng tới ${next.vi}. Mở Chuyến bay từ vựng`, `${flyerById(st.flyer).en} over ${station.en}, ${left} more correct answers to ${next.en}. Open Vocab Flight`)}
          onPress={() => router.push('/quest/rail' as never)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: 'rgba(10,18,34,.72)', borderWidth: 1, borderColor: 'rgba(255,255,255,.14)' }}
        >
          <FlyerThumb id={st.flyer} box={22} />
          {narrow ? null : <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }}>{en ? station.en : station.vi}</Text>}
          <View style={{ flexDirection: 'row', gap: 3 }}>
            {Array.from({ length: st.perStation }, (_, i) => (
              <View key={i} style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: i < st.toward ? route.color : 'rgba(255,255,255,.25)' }} />
            ))}
          </View>
          {narrow ? null : <Text style={{ color: 'rgba(255,255,255,.75)', fontSize: 14 }}>→ {en ? next.en : next.vi}</Text>}
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={L('Tắt nền cảnh bay', 'Turn off the flying background')}
          onPress={() => useTopicStudyStore.getState().setStudyFx(false)}
          style={{ width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(10,18,34,.72)', borderWidth: 1, borderColor: 'rgba(255,255,255,.14)' }}
        >
          <Text style={{ color: 'rgba(255,255,255,.8)', fontSize: 14 }}>✕</Text>
        </Pressable>
      </View>
      {arrived ? (
        <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: '38%', alignItems: 'center' }} accessibilityLiveRegion="polite">
          <View style={{ transform: [{ rotate: '-6deg' }], borderWidth: 4, borderColor: routeOf(arrived).color, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 8, backgroundColor: 'rgba(248,241,226,.95)' }}>
            <Text style={{ color: routeOf(arrived).color, fontSize: 20, fontWeight: '800', letterSpacing: 2 }}>✦ {L('ĐÃ TỚI', 'ARRIVED IN')} {(en ? stationById(arrived).en : stationById(arrived).vi).toUpperCase()} ✦</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}
