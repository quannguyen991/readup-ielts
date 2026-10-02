import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { TaskShell } from '@/components/layout/TaskShell';
import { getCityMap, getFallbackMap } from '@/components/travel/cityData';
import { useTravelReady } from '@/components/travel/useTravel';
import { TravelHud } from '@/components/travel/ui/Hud';
import { useReducedMotion } from '@/components/travel/ui/hooks';
import { Eyebrow, GameButton, PixelPanel, StarsRow, T } from '@/components/travel/ui/kit';
import { CityCanvas } from '@/components/travel/scenes/CityCanvas';
import { FsPortal, useFullscreen } from '@/components/travel/scenes/fullscreen';
import { ImmersiveCity } from '@/components/travel/immersive/ImmersiveCity';
import { Icon } from '@/components/ui/Icon';
import { getPoiContent, poisOfCity } from '@/data/travel/pois';
import { bi, useL } from '@/i18n/useL';
import { isPoiUnlocked } from '@/services/travel/rewards';
import { POS_UNSET } from '@/services/travel/sync';
import type { Tile } from '@/services/travel/types';
import { CITIES, isCityId } from '@/services/travel/world';
import { useTravelStore } from '@/store/useTravelStore';

/**
 * /quest/du-ngoan/[city] — cảnh thành phố. Có bản đồ pixel (canvas, chỉ web) thì vẽ
 * canvas; luôn có danh sách địa điểm bên dưới để chọn bằng bàn phím / điện thoại.
 */
export default function CityRoute() {
  const { city: raw } = useLocalSearchParams<{ city: string }>();
  const ready = useTravelReady();
  const { L, locale } = useL();
  const id = Array.isArray(raw) ? raw[0] : raw;
  const valid = isCityId(id);
  if (ready && valid) return <City city={id} />;
  return (
    <TaskShell backHref="/quest/du-ngoan" backLabel={L('Bản đồ thế giới', 'World map')} title={valid ? bi(CITIES[id].name, locale) : L('Thành phố', 'City')} right={<TravelHud />}>
      {null}
    </TaskShell>
  );
}

function City({ city }: { city: keyof typeof CITIES }) {
  const { L, locale } = useL();
  const reduced = useReducedMotion();
  // Khung bản đồ có chiều cao tường minh (canvas lấp đầy khung cha): màn rộng theo tỉ lệ tranh 418:235
  // (để thấy trọn tranh ở hệ số nguyên), điện thoại cao hơn để tranh lớn hơn và máy quay đi theo người chơi.
  const map = useMemo(() => getCityMap(city), [city]);
  const win = useWindowDimensions();
  const fs = useFullscreen();
  const [boxW, setBoxW] = useState(0);
  let canvasH: number;
  if (win.width >= 700 && boxW > 0) {
    // hệ số nguyên lớn nhất mà cả bề ngang lẫn chiều cao (≤ 85% màn) còn chứa trọn tranh
    const mw = map?.size.w ?? 418;
    const mh = map?.size.h ?? 235;
    // thế giới nhiều mảnh (lớn hơn một ảnh): khung cao cố định, máy quay cuộn theo người chơi
    if (mw > 500) canvasH = Math.round(Math.min(Math.max(win.height * 0.72, 420), 760));
    else {
      const k = Math.max(1, Math.min(Math.floor(boxW / mw), Math.floor((win.height * 0.85) / mh)));
      canvasH = k * mh + 4;
    }
  } else canvasH = Math.round(Math.min(560, win.height * 0.62));
  const state = useTravelStore();
  const setPos = useTravelStore((s) => s.setPos);
  const pois = useMemo(() => poisOfCity(city), [city]);

  // Chưa ở thành phố này: về bản đồ thế giới (phải bay tới trước).
  const here = state.city === city;
  useEffect(() => {
    if (!here) router.replace('/quest/du-ngoan' as never);
  }, [here]);

  // Vị trí chưa đặt hoặc nằm ngoài bản đồ → điểm xuất phát.
  const pos = state.pos;
  const unset = pos.x === POS_UNSET.x && pos.y === POS_UNSET.y;
  const outside = !!map && (pos.x < 0 || pos.y < 0 || pos.x >= map.size.w || pos.y >= map.size.h);
  useEffect(() => {
    if (here && map && (unset || outside)) setPos({ ...map.spawn });
  }, [here, map, unset, outside, setPos]);

  const enter = useCallback(
    (id: string) => {
      const poi = getPoiContent(id);
      if (!poi) return;
      if (poi.action === 'customs') router.push('/quest/du-ngoan/airport' as never);
      else if (poi.action === 'gate') router.push('/quest/du-ngoan' as never);
      else if (isPoiUnlocked(state, poi)) router.push(`/quest/du-ngoan/visit/${poi.id}` as never);
    },
    [state],
  );
  const onMove = useCallback((t: Tile) => setPos(t), [setPos]);

  if (!here) return null;
  const canvasOk = Platform.OS === 'web' && !!map && !unset && !outside;

  // Web có bản đồ: chế độ TOÀN MÀN HÌNH kiểu Bến Dừa (HUD nổi + ngăn Địa điểm / Nhiệm vụ), không dùng khung trang.
  if (canvasOk) return <ImmersiveCity city={city} map={map!} fallbackMap={getFallbackMap(city)} state={state} onEnterPoi={enter} onMove={onMove} reducedMotion={reduced} />;

  return (
    <TaskShell backHref="/quest/du-ngoan" backLabel={L('Bản đồ thế giới', 'World map')} title={bi(CITIES[city].name, locale)} right={<TravelHud />}>
    <View style={{ gap: 18 }}>
      {canvasOk ? (
        <FsPortal active={fs.active}>
        <View
          onLayout={(e) => setBoxW(Math.round(e.nativeEvent.layout.width))}
          style={fs.active ? { flex: 1, width: '100%' } : { height: canvasH, borderRadius: 8, overflow: 'hidden', borderWidth: 2, borderColor: T.navy }}
        >
          <CityCanvas map={map!} fallbackMap={getFallbackMap(city)} state={state} onEnterPoi={enter} onMove={onMove} reducedMotion={reduced} />
          {fs.active ? (
            <View pointerEvents="none" style={{ position: 'absolute', top: 10, left: 10, flexDirection: 'row', gap: 8 }}>
              {[`🎫 ${state.tickets}`, `● ${state.coins}`].map((t) => (
                <View key={t} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: 'rgba(15,29,51,0.78)', borderWidth: 1, borderColor: 'rgba(184,149,90,0.7)' }}>
                  <Text style={{ color: '#F3EDE1', fontSize: 14, fontWeight: '700' }}>{t}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
        </FsPortal>
      ) : null}

      <View>
        <Eyebrow>{L('Địa điểm', 'Places')}</Eyebrow>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {pois.map((p) => {
            const open = p.action ? true : isPoiUnlocked(state, p);
            const prog = state.poi[p.id];
            return (
              <View key={p.id} style={{ flexGrow: 1, flexBasis: 280, minWidth: 240, maxWidth: 420 }}>
                <PixelPanel inner={{ padding: 14, gap: 8, opacity: open ? 1 : 0.6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {!open ? <Icon name="lock" size={16} color={T.muted} /> : null}
                    <Text className="font-strong" style={{ flex: 1, fontSize: 16, color: T.ink }}>
                      {bi(p.name, locale)}
                    </Text>
                    {p.kind === 'secret' ? (
                      <Text className="font-strong" style={{ fontSize: 14, color: T.goldDark }}>
                        {L('Bí mật', 'Secret')}
                      </Text>
                    ) : null}
                  </View>
                  {!p.action ? <StarsRow n={prog?.best ?? 0} /> : null}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={bi(p.name, locale)}
                    disabled={!open}
                    onPress={() => enter(p.id)}
                    style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 6, borderWidth: 2, borderColor: T.navy, backgroundColor: open ? T.gold : '#E4DCC8' }}
                  >
                    <Text className="font-strong" style={{ fontSize: 14, color: open ? T.navy : T.muted }}>
                      {p.action === 'customs' ? L('Mở quầy vé', 'Open counter') : p.action === 'gate' ? L('Ra bản đồ', 'World map') : open ? (prog?.runs ? L('Làm lại', 'Play again') : L('Vào', 'Enter')) : L('Chưa mở', 'Locked')}
                    </Text>
                  </Pressable>
                </PixelPanel>
              </View>
            );
          })}
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
        <GameButton label={L('Bản đồ thế giới', 'World map')} tone="paper" onPress={() => router.push('/quest/du-ngoan' as never)} />
        <GameButton label={L('Hộ chiếu', 'Passport')} tone="paper" onPress={() => router.push('/quest/du-ngoan/passport' as never)} />
      </View>
    </View>
    </TaskShell>
  );
}
