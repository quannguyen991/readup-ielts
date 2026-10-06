/**
 * BẢN ĐỒ THẾ GIỚI của "Du ngoạn Band 9": ảnh pixel-art (đường bay đã vẽ sẵn) làm
 * nền, phóng nguyên; phủ lên là các điểm nóng thành phố (khoá / mở / đã đến / đang
 * ở), thẻ giá vé khi rê chuột hoặc được chọn, và chiếc máy bay bay dọc đường bay.
 */
import React, { useMemo, useRef, useState } from 'react';
import { Pressable, Text, View, type GestureResponderEvent } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { bi, useL } from '@/i18n/useL';
import { CITIES, CITY_ORDER, flightCost } from '@/services/travel/world';
import { learningProgress } from '@/services/travel/flightProgress';
import { routePoint, WORLD_ART } from '@/services/travel/worldGeometry';
import { useTravelStore } from '@/store/useTravelStore';
import { WorldAmbient } from '@/components/travel/ambient/WorldAmbient';
import type { CityId } from '@/services/travel/types';
import { useReducedMotion } from './hooks';
import { PlaneGlyph, T, TicketGlyph } from './kit';
import { FsPortal, useFullscreen } from '@/components/travel/scenes/fullscreen';
import { PixelStage, cssAnim } from './PixelStage';

export type CityStatus = {
  unlocked: boolean;
  visited: boolean;
  stamp: boolean;
  done: number;
  total: number;
};

export type Flight = { from: CityId; to: CityId; t: number };

export { WORLD_ART };

const ORDER: CityId[] = CITY_ORDER;

const route = routePoint;

export function WorldMapView({
  current,
  selected,
  status,
  onSelect,
  flight,
}: {
  current: CityId;
  selected: CityId | null;
  status: Record<CityId, CityStatus>;
  onSelect: (c: CityId) => void;
  flight?: Flight | null;
}) {
  const { L, locale } = useL();
  const still = useReducedMotion();
  const fs = useFullscreen();
  const [hover, setHover] = useState<CityId | null>(null);
  const stageRef = useRef<HTMLElement | null>(null);
  // Thành phố mở kế tiếp: đã mở, chưa đến, gần đường bay nhất từ nơi đang ở.
  const next = useMemo(() => ORDER.filter((c) => c !== current && status[c].unlocked && !status[c].visited).sort((a, b) => flightCost(current, a) - flightCost(current, b))[0] ?? null, [current, status]);

  const poi = useTravelStore((s) => s.poi);
  const progress = learningProgress({ poi });
  const focus = WORLD_ART[flight ? flight.to : selected ?? current];
  const plane = flight ? route(flight.from, flight.to, flight.t) : null;

  return (
    <FsPortal active={fs.active}>
    <View style={fs.active ? { flex: 1, justifyContent: 'center', padding: 8 } : null}>
    <PixelStage source={{ uri: '/travel/maps/world-clean.png' }} focus={focus} label={L('Bản đồ thế giới', 'World map')} fullscreenButton>
      {(k) => (
        <>
          <WorldAmbient progress={progress} k={k} still={still} hidePlane={!!flight} />
          {/* Chạm ra ngoài các vòng: chọn thành phố GẦN NHẤT trong bán kính 28px (chỉ cho chuột / cảm ứng). */}
          <Pressable
            tabIndex={-1}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            ref={(node) => {
              stageRef.current = node as unknown as HTMLElement | null;
            }}
            onPress={(e: GestureResponderEvent) => {
              // Trên web sự kiện click không có locationX: tính từ clientX và khung của sân khấu.
              const n = e.nativeEvent as unknown as { locationX?: number; locationY?: number; clientX?: number; clientY?: number };
              const rect = stageRef.current?.getBoundingClientRect?.();
              const px = rect && typeof n.clientX === 'number' ? n.clientX - rect.left : (n.locationX ?? -1000);
              const py = rect && typeof n.clientY === 'number' ? n.clientY - rect.top : (n.locationY ?? -1000);
              let best: CityId | null = null;
              let bestD = 28;
              for (const c of ORDER) {
                const d = Math.hypot(WORLD_ART[c].x * k - px, WORLD_ART[c].y * k - py);
                if (d <= bestD) {
                  bestD = d;
                  best = c;
                }
              }
              if (best) onSelect(best);
            }}
            style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}
          />
          {ORDER.map((c) => {
            const st = status[c];
            const at = WORLD_ART[c];
            const sel = selected === c;
            const isCur = c === current && !flight;
            const showTag = sel || hover === c;
            const cost = flightCost(current, c);
            const name = bi(CITIES[c].name, locale);
            const label = `${name}${st.unlocked ? '' : L(' — chưa mở', ' — locked')}${st.stamp ? L(' — đã có con dấu', ' — stamped') : ''}`;
            const size = Math.max(44, 14 * k);
            // Vùng chạm là hình tròn KHÔNG chồng nhau: đường kính ≤ khoảng cách tới thành phố gần nhất.
            const gap = Math.min(...ORDER.filter((o) => o !== c).map((o) => Math.hypot(WORLD_ART[o].x - at.x, WORLD_ART[o].y - at.y) * k));
            const hit = Math.max(24, Math.min(size, gap * 0.92));
            return (
              <View key={c} pointerEvents="box-none" style={{ position: 'absolute', left: at.x * k - size / 2, top: at.y * k - size / 2, width: size, height: size }}>
                {/* vòng trạng thái */}
                {!st.unlocked ? (
                  <View pointerEvents="none" style={{ position: 'absolute', top: (size - hit) / 2, left: (size - hit) / 2, right: (size - hit) / 2, bottom: (size - hit) / 2, borderRadius: size, borderWidth: 3, borderColor: '#9AA0AE', backgroundColor: 'rgba(60,66,80,0.55)', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="lock" size={16} color="#E8E4D8" />
                  </View>
                ) : next === c && !isCur ? (
                  <View pointerEvents="none" style={[{ position: 'absolute', top: (size - hit) / 2, left: (size - hit) / 2, right: (size - hit) / 2, bottom: (size - hit) / 2, borderRadius: size, borderWidth: 3, borderColor: T.goldLight }, cssAnim('tvPulse', 1500, still)]} className="tv-anim" />
                ) : sel ? (
                  <View pointerEvents="none" style={{ position: 'absolute', top: (size - hit) / 2, left: (size - hit) / 2, right: (size - hit) / 2, bottom: (size - hit) / 2, borderRadius: size, borderWidth: 3, borderColor: T.paper }} />
                ) : null}
                {st.stamp ? (
                  <View pointerEvents="none" style={{ position: 'absolute', right: 2, top: 2, width: 18, height: 18, borderRadius: 9, backgroundColor: T.good, borderWidth: 2, borderColor: T.paper, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="check" size={11} color="#FFFFFF" strokeWidth={3} />
                  </View>
                ) : null}
                {isCur ? (
                  <View pointerEvents="none" className="tv-anim" style={[{ position: 'absolute', left: size / 2 - 11, top: -26, alignItems: 'center' }, cssAnim('tvBounce', 900, still)]}>
                    <View style={{ width: 22, height: 22, borderRadius: 11, borderBottomRightRadius: 2, transform: [{ rotate: '45deg' }], backgroundColor: T.navy, borderWidth: 2, borderColor: T.goldLight }} />
                    <View style={{ position: 'absolute', top: 7, width: 7, height: 7, backgroundColor: T.goldLight }} />
                  </View>
                ) : null}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={label}
                  accessibilityState={{ selected: sel }}
                  onPress={() => onSelect(c)}
                  onHoverIn={() => setHover(c)}
                  onHoverOut={() => setHover((h) => (h === c ? null : h))}
                  onFocus={() => setHover(c)}
                  onBlur={() => setHover((h) => (h === c ? null : h))}
                  style={(st) => ({ position: 'absolute', left: (size - hit) / 2, top: (size - hit) / 2, width: hit, height: hit, borderRadius: hit, borderWidth: (st as { focused?: boolean }).focused ? 3 : 0, borderColor: T.paper })}
                />
                {showTag ? (
                  <View
                    pointerEvents="none"
                    style={{ position: 'absolute', top: size + 2, left: size / 2 - 70, width: 140, alignItems: 'center', zIndex: 5 }}
                  >
                    <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, backgroundColor: T.paper, borderWidth: 2, borderColor: T.navy, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text className="font-strong" style={{ fontSize: 14, color: T.navy }} numberOfLines={1}>
                        {name}
                      </Text>
                      {c !== current ? (
                        <>
                          <TicketGlyph size={14} />
                          <Text className="font-strong" style={{ fontSize: 14, color: T.navy }}>
                            {cost}
                          </Text>
                        </>
                      ) : null}
                    </View>
                  </View>
                ) : null}
              </View>
            );
          })}
          {plane ? (
            <View pointerEvents="none" style={{ position: 'absolute', left: plane.x * k - 16, top: plane.y * k - 16, zIndex: 6 }}>
              <PlaneGlyph size={32} color="#FFFFFF" rotate={plane.angle} />
            </View>
          ) : null}
        </>
      )}
    </PixelStage>
    </View>
    </FsPortal>
  );
}
