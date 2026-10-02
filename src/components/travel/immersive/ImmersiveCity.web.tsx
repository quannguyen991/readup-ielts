/**
 * Thành phố ở CHẾ ĐỘ TOÀN MÀN HÌNH kiểu Bến Dừa (web): một lớp cố định phủ cả cửa sổ (che thanh bên / đầu trang của app),
 * canvas lấp đầy, HUD nổi (thẻ thông tin trái-trên, hàng nút phải-trên, dòng gợi ý dưới, bản đồ nhỏ), ngăn "Địa điểm" và
 * "Nhiệm vụ" trượt từ phải. Đây là bố cục TRONG app, khác nút Fullscreen API của trình duyệt (vẫn còn, ở hàng nút).
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { createPortal } from 'react-dom';
import { router } from 'expo-router';

import { poisOfCity } from '@/data/travel/pois';
import { bi, useL } from '@/i18n/useL';
import { isSfxMuted } from '@/services/audio/sfx';
import { skyAt, formatClock } from '@/services/travel/clock';
import { recommendedPoi } from '@/services/travel/journey';
import { isPoiUnlocked } from '@/services/travel/rewards';
import { CITIES } from '@/services/travel/world';
import { useGameStore } from '@/store/useGameStore';
import { CityCanvas } from '../scenes/CityCanvas';
import type { CityCanvasHandle } from '../scenes/CityCanvas';
import { toggleFullscreen, useFullscreen } from '../scenes/fullscreen';
import { T } from '../ui/kit';
import { HudBtn, HudChip, HUD, hudCard } from './hudKit';
import { Minimap } from './Minimap';
import { MissionsDrawer, useClaimable } from './MissionsDrawer';
import { PlacesDrawer, type PlaceRow } from './PlacesDrawer';
import { PoiTooltip } from './PoiTooltip';
import type { ImmersiveCityProps } from './ImmersiveCity';

const LS_MINI = 'readup:travel:minimap';

function readMini(): boolean {
  try {
    return window.localStorage.getItem(LS_MINI) !== '0';
  } catch {
    return true;
  }
}

export function ImmersiveCity({ city, map, fallbackMap, state, onEnterPoi, onMove, reducedMotion }: ImmersiveCityProps) {
  const { L, locale } = useL();
  const win = useWindowDimensions();
  const narrow = win.width < 700;
  const fs = useFullscreen();
  const [drawer, setDrawer] = useState<null | 'places' | 'missions'>(null);
  const [panel, setPanel] = useState<null | 'help' | 'settings'>(null);
  const [mini, setMini] = useState(readMini);
  const [hover, setHover] = useState<{ id: string; at: { x: number; y: number } } | null>(null);
  const [focus, setFocus] = useState<string | null>(null);
  const [player, setPlayer] = useState<{ x: number; y: number } | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [toast, setToast] = useState('');
  const handle = useRef<CityCanvasHandle | null>(null);
  const claimable = useClaimable(city);
  const sound = useGameStore((s) => s.sound);
  const setSound = useGameStore((s) => s.setSound);

  // Che cuộn của trang phía sau khi đang ở chế độ này.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(id);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(''), 2400);
    return () => window.clearTimeout(id);
  }, [toast]);

  const pois = useMemo(() => poisOfCity(city), [city]);
  const rec = useMemo(() => recommendedPoi(state, city)?.id ?? null, [state, city]);
  const { locked, done, rows } = useMemo(() => {
    const lockedSet = new Set<string>();
    const doneSet = new Set<string>();
    const out: PlaceRow[] = pois.map((p) => {
      const unlocked = p.action ? true : isPoiUnlocked(state, p);
      if (!unlocked) lockedSet.add(p.id);
      const prog = state.poi[p.id];
      if (!p.action && (prog?.best ?? 0) >= 2) doneSet.add(p.id);
      return { poi: p, unlocked, stars: prog?.best ?? 0, runs: prog?.runs ?? 0, recommended: p.id === rec, needs: !unlocked && p.unlock?.after ? pois.find((q) => q.id === p.unlock!.after) : undefined };
    });
    const rank = (r: PlaceRow) => (r.recommended ? 0 : r.poi.action ? 3 : r.unlocked ? 1 : 2);
    out.sort((a, b) => rank(a) - rank(b));
    return { locked: lockedSet, done: doneSet, rows: out };
  }, [pois, state, rec]);
  const highlights = useMemo(() => ({ recommended: rec, focus, locked }), [rec, focus, locked]);

  const sky = useMemo(() => skyAt(city, now), [city, now]);
  const stars = useMemo(() => pois.filter((p) => !p.action).reduce((n, p) => n + (state.poi[p.id]?.best ?? 0), 0), [pois, state.poi]);
  const maxStars = pois.filter((p) => !p.action).length * 3;

  const go = useCallback(
    (id: string) => {
      setDrawer(null);
      if (!handle.current?.walkToPoi(id)) setToast(L('Chưa có đường tới đó — thử đi gần hơn.', 'No route there yet — try moving closer.'));
    },
    [L],
  );
  const enter = useCallback(
    (id: string) => {
      setDrawer(null);
      onEnterPoi(id);
    },
    [onEnterPoi],
  );
  const onHover = useCallback((id: string | null, at: { x: number; y: number }) => setHover(id ? { id, at } : null), []);
  const toggleMini = () =>
    setMini((m) => {
      try {
        window.localStorage.setItem(LS_MINI, m ? '0' : '1');
      } catch {
        /* bỏ qua */
      }
      return !m;
    });

  const hoverPoi = hover ? pois.find((p) => p.id === hover.id) : undefined;
  const miniW = narrow ? 112 : 168;
  const sec = (e: boolean) => ({ opacity: e ? 1 : 0.9 });

  const root = (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2147482000, background: '#0F1D33', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <View style={{ flex: 1 }}>
        <CityCanvas
          map={map}
          fallbackMap={fallbackMap}
          state={state}
          onEnterPoi={enter}
          onMove={onMove}
          reducedMotion={reducedMotion}
          highlights={highlights}
          onHoverPoi={onHover}
          onPlayer={setPlayer}
          handleRef={handle}
          hideFullscreenButton
        />

        {/* thẻ thông tin trái-trên */}
        <View pointerEvents="box-none" style={{ position: 'absolute', top: 10, left: 10, maxWidth: narrow ? win.width - 76 : 460 }}>
          <View style={[hudCard, { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8, paddingRight: 12 }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={L('Về bản đồ thế giới', 'Back to the world map')}
              onPress={() => router.push('/quest/du-ngoan' as never)}
              style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.08)' }}
            >
              <Text style={{ fontSize: 22, color: HUD.gold }}>←</Text>
            </Pressable>
            <View style={{ gap: 4, flexShrink: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                <Text className="font-heavy" numberOfLines={1} style={{ fontSize: 17, color: HUD.text, flexShrink: 1 }}>
                  {bi(CITIES[city].name, locale)}
                </Text>
                <Text className="font-strong" style={{ fontSize: 13, color: HUD.dim }}>
                  {sky.lamps ? '🌙' : '☀️'} {formatClock(sky.time)}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                <HudChip glyph="🎫" value={state.tickets} label={L('Vé máy bay', 'Plane tickets')} />
                <HudChip glyph="●" value={state.coins} label={L('Xu', 'Coins')} />
                <HudChip glyph="★" value={`${stars}/${maxStars}`} label={L('Sao', 'Stars')} />
              </View>
            </View>
          </View>
        </View>

        {/* hàng nút phải-trên */}
        <View pointerEvents="box-none" style={{ position: 'absolute', top: 10, right: 10, flexDirection: narrow ? 'column' : 'row', gap: 8 }}>
          <HudBtn glyph="📍" label={L('Địa điểm', 'Places')} active={drawer === 'places'} onPress={() => setDrawer((d) => (d === 'places' ? null : 'places'))} />
          <HudBtn glyph="🎯" label={L('Nhiệm vụ & lộ trình', 'Missions & route')} active={drawer === 'missions'} dot={claimable > 0} onPress={() => setDrawer((d) => (d === 'missions' ? null : 'missions'))} />
          <HudBtn glyph="🛂" label={L('Hộ chiếu', 'Passport')} onPress={() => router.push('/quest/du-ngoan/passport' as never)} />
          <HudBtn glyph="🗺️" label={L('Bản đồ thế giới', 'World map')} onPress={() => router.push('/quest/du-ngoan' as never)} />
          <HudBtn glyph="⚙️" label={L('Cài đặt', 'Settings')} active={panel === 'settings'} onPress={() => setPanel((p) => (p === 'settings' ? null : 'settings'))} />
          <HudBtn glyph="❔" label={L('Trợ giúp', 'Help')} active={panel === 'help'} onPress={() => setPanel((p) => (p === 'help' ? null : 'help'))} />
          {fs.supported ? <HudBtn glyph={fs.active ? '🗗' : '⛶'} label={fs.active ? L('Thoát toàn màn hình', 'Exit full screen') : L('Toàn màn hình', 'Full screen')} onPress={toggleFullscreen} /> : null}
        </View>

        {panel ? (
          <View style={[hudCard, { position: 'absolute', top: narrow ? 70 : 64, right: narrow ? 64 : 10, width: 250, padding: 12, gap: 10, zIndex: 25 }]}>
            {panel === 'settings' ? (
              <>
                <Text className="font-heavy" style={{ fontSize: 14, color: HUD.gold }}>
                  {L('Cài đặt', 'Settings')}
                </Text>
                <Toggle label={L('Âm thanh', 'Sound')} on={sound && !isSfxMuted()} onPress={() => setSound(!sound)} />
                <Toggle label={L('Bản đồ nhỏ', 'Mini-map')} on={mini} onPress={toggleMini} />
              </>
            ) : (
              <>
                <Text className="font-heavy" style={{ fontSize: 14, color: HUD.gold }}>
                  {L('Cách chơi', 'How to play')}
                </Text>
                {[
                  L('Chạm / bấm để đi · WASD hoặc phím mũi tên · E để vào', 'Tap / click to walk · WASD or arrows · E to enter'),
                  L('Vòng vàng nhấp nháy = nơi nên đi tiếp; mũi tên ở mép = hướng tới đó', 'Pulsing gold ring = next place to visit; edge arrow points to it'),
                  L('🔒 khoá · ✓ đã đạt · 3 chấm = số sao', '🔒 locked · ✓ passed · 3 dots = stars'),
                  L('Hoàn thành nhiệm vụ để kiếm thêm vé bay', 'Finish missions to earn extra plane tickets'),
                ].map((t) => (
                  <Text key={t} className="font-sans" style={{ fontSize: 13, color: HUD.text }}>
                    {t}
                  </Text>
                ))}
              </>
            )}
          </View>
        ) : null}

        {/* bản đồ nhỏ */}
        {mini && map.image ? (
          <View pointerEvents="none" style={{ position: 'absolute', left: 10, bottom: 10, ...sec(true) }}>
            <Minimap map={map} player={player} recommended={rec} locked={locked} done={done} width={miniW} label={L('Bản đồ nhỏ', 'Mini-map')} />
          </View>
        ) : null}

        {/* dòng gợi ý dưới */}
        <View pointerEvents="none" style={{ position: 'absolute', bottom: 10, left: mini && map.image ? miniW + 24 : 10, right: 10, alignItems: 'center' }}>
          <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: 'rgba(15,29,51,0.7)' }}>
            <Text className="font-sans" style={{ fontSize: 13, color: HUD.text, textAlign: 'center' }}>
              {narrow ? L('Chạm để đi · 📍 để chọn nơi', 'Tap to move · 📍 to pick a place') : L('Bấm để đi · WASD · E tương tác · 📍 chọn địa điểm', 'Click to move · WASD · E interact · 📍 pick a place')}
            </Text>
          </View>
        </View>

        {toast ? (
          <View pointerEvents="none" style={{ position: 'absolute', bottom: 56, left: 0, right: 0, alignItems: 'center', zIndex: 26 }}>
            <View style={[hudCard, { paddingHorizontal: 14, paddingVertical: 8 }]}>
              <Text className="font-strong" style={{ fontSize: 14, color: HUD.text }}>
                {toast}
              </Text>
            </View>
          </View>
        ) : null}

        {hoverPoi && !drawer ? <PoiTooltip poi={hoverPoi} at={hover!.at} locked={locked.has(hoverPoi.id)} needs={hoverPoi.unlock?.after ? pois.find((q) => q.id === hoverPoi.unlock!.after) : undefined} stars={state.poi[hoverPoi.id]?.best ?? 0} /> : null}

        {drawer === 'places' ? <PlacesDrawer rows={rows} state={state} onClose={() => setDrawer(null)} onGo={go} onEnter={enter} onFocus={setFocus} /> : null}
        {drawer === 'missions' ? <MissionsDrawer city={city} onClose={() => setDrawer(null)} onGo={go} /> : null}
      </View>
    </div>
  );
  return createPortal(root, document.body);
}

function Toggle({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="switch" accessibilityState={{ checked: on }} onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 }}>
      <Text className="font-strong" style={{ fontSize: 14, color: HUD.text }}>
        {label}
      </Text>
      <View style={{ width: 46, height: 26, borderRadius: 13, padding: 3, backgroundColor: on ? T.gold : 'rgba(255,255,255,0.2)', alignItems: on ? 'flex-end' : 'flex-start' }}>
        <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' }} />
      </View>
    </Pressable>
  );
}
