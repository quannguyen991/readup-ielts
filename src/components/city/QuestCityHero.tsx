/**
 * THÀNH PHỐ TRI THỨC làm phần CHÍNH của trang /quest (chỉ máy tính — trang gọi
 * khối này sau khi `useCityAvailable()` trả true).
 *
 * Số liệu đều lấy từ thành phố thật của người học: kỷ, dân số, công trình,
 * vật liệu, ca đang chờ và đúng MỘT việc cần làm tiếp. Bên phải là khung 3D của
 * chính thành phố đó (nạp động, chỉ web).
 */
import React from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { useShallow } from 'zustand/react/shallow';

import { catalogItem, ERA_INFO, isTower, type Era } from '@/data/city/catalog';
import { blockers, isDone, populationOf } from '@/services/city/construction';
import { ECONOMY } from '@/services/city/economy';
import { MATERIAL_INFO, MATERIAL_KINDS } from '@/services/city/materials';
import { HUB_TOWERS } from '@/services/city/hub';
import type { CityPayload } from '@/services/city/sync';
import { useAuthStore } from '@/store/useAuthStore';
import { useCityStore } from '@/store/useCityStore';
import { CityPreview } from './CityPreview';
import { useCityName } from './ui/common';
import { useHubSnapshot } from './useHubSnapshot';

const GOLD = '#FACC15';
const MUTED = 'rgba(255,255,255,0.72)';
const WEB = Platform.OS === 'web';
const PREVIEW_H = 340;

/** Đúng một việc nên làm tiếp — cùng thứ tự với bảng "Nhiệm vụ" trong thành phố. */
type HeroCity = Pick<CityPayload, 'terrain' | 'sites' | 'priority' | 'inventory' | 'shiftBank' | 'era'>;

function nextStep(s: HeroCity): string {
  if (!s.terrain) return 'Chưa có đất — chọn vùng đất để khởi công.';
  if (s.sites.length === 0) return 'Đất đang trống — đặt công trình đầu tiên, một cái Lều là đủ.';
  const open = s.sites.filter((x) => !isDone(x)).sort((a, b) => (a.id === s.priority ? -1 : b.id === s.priority ? 1 : a.createdAt.localeCompare(b.createdAt)));
  const site = open[0];
  if (!site) return 'Mọi công trình đã xong — xây thêm, hoặc mở bảng Nhiệm vụ để lên kỷ.';
  const name = catalogItem(site.type)?.vi ?? site.type;
  const b = blockers(site, s.inventory, s.shiftBank, new Date());
  const miss = MATERIAL_KINDS.find((k) => (b.materials[k] ?? 0) > 0);
  if (b.needDelivery && miss) return `${name} cần thêm ${b.materials[miss]} ${MATERIAL_INFO[miss].vi.toLowerCase()} — học để nhận.`;
  if (b.needDelivery) return `Đủ vật liệu rồi — vào giao cho ${name}.`;
  if (b.crew) return `${name} chưa có đội thợ — vào thuê đội.`;
  if (b.curingMin > 0) return `Móng ${name} đang đông cứng, còn ${b.curingMin} phút.`;
  return `${name} đang chờ ca làm — cứ ${ECONOMY.shift.answersPerShift} câu trả lời là 1 ca.`;
}

export function QuestCityHero() {
  // Chỉ phần khối này hiện — học thêm một câu (bộ đếm ca, sổ ngày) không làm cả khối render lại.
  const s = useCityStore(useShallow((x) => ({ terrain: x.terrain, sites: x.sites, priority: x.priority, inventory: x.inventory, shiftBank: x.shiftBank, era: x.era })));
  const cityName = useCityName();
  const era = (s.era || 1) as Era;
  const done = s.sites.filter((x) => isDone(x)).length;
  const building = s.sites.length - done;
  const pop = populationOf(s.sites);
  const chosen = !!s.terrain;
  // Chưa có cao ốc nào: khung 3D cho xem THÀNH PHỐ MẪU Kỷ 5 (đích đến) — có ghi
  // rõ là bản mẫu. Có cao ốc rồi thì khung hiện chính thành phố của mình.
  const hasTower = s.sites.some((x) => isTower(catalogItem(x.type)));
  const showSample = !hasTower;

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel="Vào Thành phố Tri thức"
      onPress={() => router.push('/quest/city' as never)}
      style={({ hovered }: { hovered?: boolean }) => ({
        borderRadius: 22,
        overflow: 'hidden',
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: hovered ? 'rgba(125,211,252,0.75)' : 'rgba(125,211,252,0.45)',
        // Xanh navy (người dùng không thích tím).
        backgroundColor: '#0B1A2E',
        ...(WEB ? ({ transition: 'border-color 160ms ease', cursor: 'pointer' } as object) : null),
      })}
    >
      <View style={{ flex: 1, padding: 28, justifyContent: 'center', minWidth: 320 }}>
        <View style={{ alignSelf: 'flex-start', borderRadius: 999, borderWidth: 1, borderColor: 'rgba(125,211,252,0.45)', backgroundColor: 'rgba(125,211,252,0.12)', paddingHorizontal: 12, paddingVertical: 5 }}>
          <Text className="font-strong" style={{ fontSize: 12, letterSpacing: 1.2, color: '#BAE6FD' }}>
            BAND 9 QUEST · THÀNH PHỐ TRI THỨC
          </Text>
        </View>
        <Text className="font-heavy" style={{ marginTop: 12, fontSize: 34, lineHeight: 40, color: '#FFFFFF' }}>
          Mỗi câu đúng là <Text style={{ color: GOLD }}>một viên gạch.</Text>
        </Text>
        <Text className="font-sans" style={{ marginTop: 8, fontSize: 14, lineHeight: 21, color: MUTED, maxWidth: 520 }}>
          {chosen
            ? `${cityName} · Kỷ ${era} · ${ERA_INFO[era].vi}. Học ở bất kỳ đâu — kể cả trên điện thoại — vật liệu và ca làm việc đều về đây.`
            : 'Chọn một vùng đất rồi xây từ túp lều tới tòa chọc trời. Gỗ, đá, gạch, thép, kính chỉ đến từ bài học thật.'}
        </Text>

        {chosen ? (
          <View style={{ marginTop: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <Stat glyph="👥" value={pop.toLocaleString('vi-VN')} label="dân" />
            <Stat glyph="🏠" value={String(done)} label="công trình xong" />
            <Stat glyph="🏗️" value={String(building)} label="đang xây" />
            <Stat glyph="👷" value={String(s.shiftBank)} label="ca đang chờ" />
          </View>
        ) : null}

        {chosen ? (
          <View style={{ marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {MATERIAL_KINDS.map((k) => (
              <Text key={k} className="font-strong" style={{ fontSize: 14, color: '#FFFFFF' }} accessibilityLabel={`${MATERIAL_INFO[k].vi}: ${s.inventory[k]}`}>
                {MATERIAL_INFO[k].glyph} {s.inventory[k]}
              </Text>
            ))}
          </View>
        ) : null}

        <View style={{ marginTop: 14, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: 'rgba(255,255,255,0.07)', maxWidth: 520 }}>
          <Text className="font-semi" style={{ fontSize: 12, letterSpacing: 0.6, color: MUTED }}>
            VIỆC TIẾP THEO
          </Text>
          <Text className="font-strong" style={{ marginTop: 2, fontSize: 14, lineHeight: 20, color: '#FFFFFF' }}>
            {nextStep(s)}
          </Text>
        </View>

        <View style={{ marginTop: 18, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, paddingHorizontal: 20, paddingVertical: 13, backgroundColor: GOLD }}>
            <Text style={{ fontSize: 15 }}>🏙️</Text>
            <Text className="font-heavy" style={{ fontSize: 15, color: '#2A1B02' }}>
              {chosen ? 'Vào thành phố' : 'Chọn vùng đất'}
            </Text>
          </View>
          <Pressable
            accessibilityRole="link"
            onPress={(e) => {
              e.stopPropagation?.();
              router.push('/quest/city?mau=1' as never);
            }}
            style={({ hovered }: { hovered?: boolean }) => ({
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 13,
              borderWidth: 1,
              borderColor: 'rgba(125,211,252,0.5)',
              backgroundColor: hovered ? 'rgba(125,211,252,0.18)' : 'rgba(125,211,252,0.08)',
              ...(WEB ? ({ transition: 'background-color 160ms ease' } as object) : null),
            })}
          >
            <Text className="font-strong" style={{ fontSize: 14, color: '#FFFFFF' }}>
              🏢 Xem thành phố mẫu
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="link"
            onPress={(e) => {
              e.stopPropagation?.();
              router.push('/quest/city?hub=1' as never);
            }}
            style={({ hovered }: { hovered?: boolean }) => ({
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 13,
              borderWidth: 1,
              borderColor: 'rgba(250,204,21,0.55)',
              backgroundColor: hovered ? 'rgba(250,204,21,0.18)' : 'rgba(250,204,21,0.08)',
              ...(WEB ? ({ transition: 'background-color 160ms ease' } as object) : null),
            })}
          >
            <Text className="font-strong" style={{ fontSize: 14, color: '#FFFFFF' }}>
              🏗️ Trung tâm Tương lai
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="link"
            onPress={(e) => {
              e.stopPropagation?.();
              router.push('/quest/pick' as never);
            }}
            style={({ hovered }: { hovered?: boolean }) => ({
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 13,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.22)',
              backgroundColor: hovered ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)',
              ...(WEB ? ({ transition: 'background-color 160ms ease' } as object) : null),
            })}
          >
            <Text className="font-strong" style={{ fontSize: 14, color: '#FFFFFF' }}>
              📚 Học để lấy vật liệu
            </Text>
          </Pressable>
        </View>

        <HubStrip />
      </View>

      {/* Khung 3D lấp đầy cả cột, cao bằng khối chữ bên trái. */}
      <View style={{ width: '56%', minHeight: PREVIEW_H, position: 'relative', alignSelf: 'stretch', backgroundColor: 'rgba(125,211,252,0.08)' }}>
        <CityPreview height={PREVIEW_H + 120} sample={showSample} />
        {showSample ? (
          <View style={{ position: 'absolute', left: 14, top: 14, flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(11,26,46,0.82)' }}>
            <Text style={{ fontSize: 13 }}>🏙️</Text>
            <Text className="font-strong" style={{ fontSize: 13, color: '#FFFFFF' }}>
              Thành phố mẫu · Kỷ 5 — đích đến của bạn
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

/**
 * Tiến độ THẬT của Trung tâm Tương lai (khu cao ốc chung) — từ /api/city-hub.
 * Chưa tải được thì không hiện số bịa: chỉ hiện dòng mời vào.
 */
function HubStrip() {
  const token = useAuthStore((st) => st.session?.access_token ?? null);
  const { data } = useHubSnapshot(token);
  const p = data?.progress;
  const cur = p && p.current >= 0 ? p.towers[p.current] : undefined;
  const tower = cur ? HUB_TOWERS[p!.current] : undefined;
  const pct = p && p.floorsTotal ? Math.round((p.floorsBuilt / p.floorsTotal) * 100) : 0;
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel="Vào Trung tâm Tương lai"
      onPress={(e) => {
        e.stopPropagation?.();
        router.push('/quest/city?hub=1' as never);
      }}
      style={({ hovered }: { hovered?: boolean }) => ({
        marginTop: 14,
        maxWidth: 520,
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 10,
        backgroundColor: hovered ? 'rgba(125,211,252,0.14)' : 'rgba(125,211,252,0.07)',
        borderWidth: 1,
        borderColor: 'rgba(125,211,252,0.25)',
        ...(WEB ? ({ transition: 'background-color 160ms ease' } as object) : null),
      })}
    >
      <Text className="font-semi" style={{ fontSize: 12, letterSpacing: 0.6, color: MUTED }}>
        TRUNG TÂM TƯƠNG LAI · CẢ CỘNG ĐỒNG CÙNG XÂY
      </Text>
      {p ? (
        <>
          <View style={{ marginTop: 6, flexDirection: 'row', gap: 6 }}>
            {p.towers.map((t, i) => (
              <View key={t.id} style={{ flex: 1, height: 8, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.12)', overflow: 'hidden' }}>
                <View style={{ width: `${Math.round((t.done ? 1 : (t.floorsBuilt + (t.floor?.fraction ?? 0)) / t.floors) * 100)}%`, height: '100%', backgroundColor: t.done ? '#4ADE80' : i === p.current ? GOLD : '#7DD3FC' }} />
              </View>
            ))}
          </View>
          <Text className="font-strong" style={{ marginTop: 6, fontSize: 14, lineHeight: 20, color: '#FFFFFF' }}>
            {tower && cur
              ? `${tower.glyph} ${tower.vi} đang lên tầng ${cur.floorsBuilt + 1}/${cur.floors} · cả khu ${p.floorsBuilt}/${p.floorsTotal} tầng (${pct}%) · ${data!.people} người đã góp`
              : `Cả năm tháp đã xong · ${data!.people} người đã góp`}
          </Text>
        </>
      ) : (
        <Text className="font-strong" style={{ marginTop: 4, fontSize: 14, color: '#FFFFFF' }}>
          Năm tòa cao ốc chung — góp vật liệu để cả cộng đồng cùng lên tầng →
        </Text>
      )}
    </Pressable>
  );
}

function Stat({ glyph, value, label }: { glyph: string; value: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,0.08)' }}>
      <Text style={{ fontSize: 13 }}>{glyph}</Text>
      <Text className="font-heavy" style={{ fontSize: 14, color: '#FFFFFF' }}>
        {value}
      </Text>
      <Text className="font-sans" style={{ fontSize: 13, color: MUTED }}>
        {label}
      </Text>
    </View>
  );
}
