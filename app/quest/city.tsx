import React, { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';

import { City3D, type TimeOfDay } from '@/components/city/City3D';
import { Icon } from '@/components/ui';
import {
  BLUEPRINTS,
  BUILD_BLOCK_REASON,
  blueprint,
  canBuild,
  demolishRefund,
  levelFor,
  LEVEL_POPULATION,
  nextLevelNeed,
  populationOf,
  type Blueprint,
  type BlueprintId,
} from '@/services/city/blueprints';
import { isInnerLot, SAMPLE_CITY } from '@/services/city/layout';
import { MATERIAL_INFO, MATERIAL_KINDS, STAR_PRICE, starCost, type MaterialKind, type Materials } from '@/services/city/materials';
import { formatStars } from '@/services/gamification/shop';
import { STARTER_GIFT, useCityStore } from '@/store/useCityStore';
import { useStarBalance } from '@/store/useStarBalance';

/**
 * THÀNH PHỐ TRI THỨC (dựng lại 29/09/2026 theo ý người dùng): người học xây
 * thành phố của mình bằng vật liệu kiếm từ bài tập, hoặc đổi sao lấy vật
 * liệu. "Thành phố mẫu" là một thành phố xây sẵn đủ 24 khu — cho thấy đích đến
 * trước khi bắt đầu. Luật ở `src/services/city/*`, cảnh 3D ở
 * `src/components/city/city-scene.ts`.
 *
 * Giao diện ít chữ: thành phố là nhân vật chính, các bảng nổi gọn ở mép.
 */
type Mode = 'own' | 'sample';

const GLASS = {
  backgroundColor: 'rgba(255,255,255,0.92)',
  borderRadius: 18,
  ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(10px)', boxShadow: '0 8px 24px rgba(15,23,42,0.14)' } as object) : { elevation: 4 }),
};

export default function CityScreen() {
  const city = useCityStore();
  const stars = useStarBalance();
  const [mode, setMode] = useState<Mode>(() => (Object.keys(useCityStore.getState().plots).length > 0 ? 'own' : 'sample'));
  const [time, setTime] = useState<TimeOfDay>('day');
  const [selected, setSelected] = useState<string | null>(null);
  const [market, setMarket] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [focusLot, setFocusLot] = useState<string | null>(null);
  const [webgl, setWebgl] = useState<boolean | null>(null);

  const own = mode === 'own';
  const plots = own ? city.plots : SAMPLE_CITY;
  const population = populationOf(plots);
  const level = levelFor(population);
  const next = nextLevelNeed(population);

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast((t) => (t === msg ? null : t)), 2600);
  };

  const pick = (id: string | null) => {
    if (!own) return;
    setSelected(id);
    setMarket(false);
  };

  const build = (type: BlueprintId) => {
    if (!selected) return;
    const before = levelFor(populationOf(city.plots));
    const r = city.build(selected, type);
    if (!r.ok) {
      flash(BUILD_BLOCK_REASON[r.reason]);
      return;
    }
    const bp = blueprint(type)!;
    const after = levelFor(populationOf(useCityStore.getState().plots));
    flash(after > before ? `Lên cấp ${after}! Mở khoá công trình mới` : bp.population > 0 ? `${bp.name} · +${bp.population} dân` : `Đã xây ${bp.name}`);
    setFocusLot(`${selected}:${Date.now()}`);
    setSelected(null);
  };

  const selectedType = selected ? city.plots[selected]?.type : undefined;

  return (
    <View style={{ flex: 1, backgroundColor: '#DCEBFF' }}>
      {Platform.OS === 'web' ? (
        <City3D
          plots={plots}
          time={time}
          editable={own}
          selected={own ? selected : null}
          focusLot={focusLot}
          onPick={pick}
          onReady={setWebgl}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
      ) : null}

      {Platform.OS !== 'web' || webgl === false ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text className="text-center font-strong text-bodyLg text-ink">
            Thành phố 3D cần trình duyệt có WebGL. Mở ReadUp trên máy tính hoặc Chrome điện thoại.
          </Text>
        </View>
      ) : null}

      {/* ------------------------------------------------ thanh trên */}
      <View pointerEvents="box-none" style={{ position: 'absolute', top: 14, left: 14, right: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'flex-start' }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Về Quest"
          onPress={() => router.replace('/quest' as never)}
          style={[GLASS, { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 999 }]}
        >
          <Icon name="chevron-left" size={20} color="#0F172A" />
        </Pressable>

        <View style={[GLASS, { paddingHorizontal: 16, paddingVertical: 9, minWidth: 210 }]}>
          <Text className="font-heavy text-body text-ink">{own ? 'Thành phố của bạn' : 'Thành phố mẫu'}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 }}>
            <View style={{ backgroundColor: '#4A7FE8', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 1 }}>
              <Text className="font-heavy text-white" style={{ fontSize: 11 }}>
                Cấp {level}
              </Text>
            </View>
            <Text className="font-semi text-label text-muted">{population.toLocaleString('vi-VN')} dân</Text>
          </View>
          {own && next ? <LevelBar population={population} level={level} need={next.need} /> : null}
        </View>

        <View style={{ flex: 1 }} />

        <View style={[GLASS, { flexDirection: 'row', padding: 4, borderRadius: 999 }]}>
          {(['own', 'sample'] as const).map((m) => (
            <Pressable
              key={m}
              accessibilityRole="button"
              accessibilityState={{ selected: mode === m }}
              onPress={() => {
                setMode(m);
                setSelected(null);
                setMarket(false);
              }}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: mode === m ? '#4A7FE8' : 'transparent',
                ...(Platform.OS === 'web' && mode === m ? ({ backgroundImage: 'linear-gradient(100deg,#7FA3F6,#4A7FE8)' } as object) : null),
              }}
            >
              <Text className="font-strong text-label" style={{ color: mode === m ? '#FFFFFF' : '#334155' }}>
                {m === 'own' ? 'Của bạn' : 'Mẫu'}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={[GLASS, { flexDirection: 'row', padding: 4, borderRadius: 999, gap: 2 }]}>
          {(
            [
              ['day', '☀️', 'Ban ngày'],
              ['dusk', '🌇', 'Hoàng hôn'],
              ['night', '🌙', 'Ban đêm'],
            ] as const
          ).map(([t, glyph, label]) => (
            <Pressable
              key={t}
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={{ selected: time === t }}
              onPress={() => setTime(t)}
              style={{ width: 36, height: 36, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: time === t ? '#E0EAFF' : 'transparent' }}
            >
              <Text style={{ fontSize: 17 }}>{glyph}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* ------------------------------------------------ vật liệu */}
      {own ? (
        <View pointerEvents="box-none" style={{ position: 'absolute', top: 76, right: 14, alignItems: 'flex-end', gap: 8 }}>
          <View style={[GLASS, { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 6 }]}>
            {MATERIAL_KINDS.map((k) => (
              <View key={k} accessibilityLabel={`${MATERIAL_INFO[k].name}: ${city.inventory[k]}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6 }}>
                <Text style={{ fontSize: 15 }}>{MATERIAL_INFO[k].glyph}</Text>
                <Text className="font-heavy text-label text-ink">{city.inventory[k]}</Text>
              </View>
            ))}
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setMarket((v) => !v);
                setSelected(null);
              }}
              className="bg-primary-600"
              style={{ marginLeft: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <Icon name="plus" size={14} color="#FFFFFF" />
              <Text className="font-strong text-label text-white">Vật liệu</Text>
            </Pressable>
          </View>
          {market ? <Market inventory={city.inventory} stars={stars} onBuy={(k, q) => (city.buy(k, q, stars) ? flash(`+${q} ${MATERIAL_INFO[k].name}`) : flash('Chưa đủ sao'))} onClose={() => setMarket(false)} /> : null}
        </View>
      ) : null}

      {/* ------------------------------------------------ dưới */}
      <View pointerEvents="box-none" style={{ position: 'absolute', left: 14, right: 14, bottom: 16, alignItems: 'center', gap: 10 }}>
        {toast ? (
          <View style={{ backgroundColor: '#0F172A', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 9 }}>
            <Text className="font-strong text-body text-white">{toast}</Text>
          </View>
        ) : null}

        {!own ? (
          <View style={[GLASS, { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingVertical: 12 }]}>
            <Text className="font-semi text-body text-ink">Học đều để xây một thành phố như thế này</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setMode('own')}
              className="bg-primary-600"
              style={{ paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999 }}
            >
              <Text className="font-strong text-body text-white">Xây thành phố của tôi</Text>
            </Pressable>
          </View>
        ) : !city.giftClaimed ? (
          <View style={[GLASS, { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingVertical: 12, flexWrap: 'wrap', justifyContent: 'center' }]}>
            <Text style={{ fontSize: 26 }}>🎁</Text>
            <View>
              <Text className="font-heavy text-body text-ink">Quà khởi công</Text>
              <Text className="font-sans text-label text-muted">
                {STARTER_GIFT.wood} gỗ · {STARTER_GIFT.brick} gạch · {STARTER_GIFT.glass} kính — đủ ngôi nhà đầu tiên
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                if (city.claimGift()) flash('Chọn một khu đất trống để xây');
              }}
              className="bg-primary-600"
              style={{ paddingHorizontal: 18, paddingVertical: 9, borderRadius: 999 }}
            >
              <Text className="font-strong text-body text-white">Nhận</Text>
            </Pressable>
          </View>
        ) : selected && !selectedType ? (
          <BuildPanel lotId={selected} onBuild={build} onClose={() => setSelected(null)} />
        ) : selected && selectedType ? (
          <OccupiedPanel
            type={selectedType}
            onDemolish={() => {
              if (city.demolish(selected)) flash('Đã phá dỡ · hoàn một nửa vật liệu');
              setSelected(null);
            }}
            onClose={() => setSelected(null)}
          />
        ) : Object.keys(city.plots).length === 0 ? (
          <View style={[GLASS, { paddingHorizontal: 16, paddingVertical: 10 }]}>
            <Text className="font-semi text-body text-ink">Bấm một khu đất trống để xây</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function LevelBar({ population, level, need }: { population: number; level: number; need: number }) {
  const from = LEVEL_POPULATION[level - 1] ?? 0;
  const to = population + need;
  const pct = Math.max(4, Math.min(100, ((population - from) / Math.max(1, to - from)) * 100));
  return (
    <View style={{ marginTop: 6 }}>
      <View style={{ height: 5, borderRadius: 999, backgroundColor: '#E2E8F0', overflow: 'hidden' }}>
        <View style={{ width: `${pct}%`, height: '100%', backgroundColor: '#4A7FE8', borderRadius: 999 }} />
      </View>
      <Text className="font-sans text-muted" style={{ fontSize: 11, marginTop: 3 }}>
        Còn {need} dân lên cấp {level + 1}
      </Text>
    </View>
  );
}

function CostRow({ cost, inventory }: { cost: Partial<Materials>; inventory: Materials }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      {MATERIAL_KINDS.filter((k) => (cost[k] ?? 0) > 0).map((k) => {
        const short = inventory[k] < (cost[k] ?? 0);
        return (
          <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
            <Text style={{ fontSize: 12 }}>{MATERIAL_INFO[k].glyph}</Text>
            <Text className="font-strong" style={{ fontSize: 12, color: short ? '#DC2626' : '#334155' }}>
              {cost[k]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function BuildPanel({ lotId, onBuild, onClose }: { lotId: string; onBuild: (t: BlueprintId) => void; onClose: () => void }) {
  const plots = useCityStore((s) => s.plots);
  const inventory = useCityStore((s) => s.inventory);
  const level = levelFor(populationOf(plots));
  const inner = isInnerLot(lotId);
  return (
    <View style={[GLASS, { width: '100%', maxWidth: 980, padding: 12 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingHorizontal: 4 }}>
        <Text className="font-heavy text-body text-ink">Xây gì ở đây?{inner ? ' · khu trung tâm' : ''}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Đóng" onPress={onClose} style={{ padding: 4 }}>
          <Icon name="close" size={18} color="#64748B" />
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
        {BLUEPRINTS.map((bp) => (
          <BlueprintCard key={bp.id} bp={bp} check={canBuild(bp.id, lotId, plots, inventory, isInnerLot)} level={level} inventory={inventory} onBuild={() => onBuild(bp.id)} />
        ))}
      </ScrollView>
    </View>
  );
}

function BlueprintCard({
  bp,
  check,
  level,
  inventory,
  onBuild,
}: {
  bp: Blueprint;
  check: ReturnType<typeof canBuild>;
  level: number;
  inventory: Materials;
  onBuild: () => void;
}) {
  const locked = level < bp.unlockLevel;
  const ok = check.ok;
  return (
    <View style={{ width: 172, borderRadius: 14, padding: 12, backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: ok ? '#A5C0FA' : '#E2E8F0', opacity: locked ? 0.6 : 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={{ fontSize: 26 }}>{bp.glyph}</Text>
        <View style={{ flex: 1 }}>
          <Text className="font-heavy text-label text-ink" numberOfLines={1}>
            {bp.name}
          </Text>
          <Text className="font-sans text-muted" style={{ fontSize: 11 }}>
            {bp.population > 0 ? `+${bp.population} dân` : 'Cây xanh'}
          </Text>
        </View>
      </View>
      <View style={{ marginTop: 8, minHeight: 18 }}>
        {locked ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Icon name="lock" size={12} color="#64748B" />
            <Text className="font-semi text-muted" style={{ fontSize: 12 }}>
              Mở ở cấp {bp.unlockLevel}
            </Text>
          </View>
        ) : (
          <CostRow cost={bp.cost} inventory={inventory} />
        )}
      </View>
      <Pressable
        accessibilityRole="button"
        disabled={!ok}
        onPress={onBuild}
        className={ok ? 'bg-primary-600' : ''}
        style={{ marginTop: 10, borderRadius: 10, paddingVertical: 7, alignItems: 'center', backgroundColor: ok ? undefined : '#E2E8F0' }}
      >
        <Text className="font-strong text-label" style={{ color: ok ? '#FFFFFF' : '#64748B' }}>
          {ok ? 'Xây' : locked ? 'Chưa mở' : BUILD_BLOCK_REASON[(check as { reason: keyof typeof BUILD_BLOCK_REASON }).reason]}
        </Text>
      </Pressable>
    </View>
  );
}

function OccupiedPanel({ type, onDemolish, onClose }: { type: BlueprintId; onDemolish: () => void; onClose: () => void }) {
  const bp = blueprint(type)!;
  const refund = demolishRefund(type);
  return (
    <View style={[GLASS, { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 12, flexWrap: 'wrap' }]}>
      <Text style={{ fontSize: 28 }}>{bp.glyph}</Text>
      <View>
        <Text className="font-heavy text-body text-ink">{bp.name}</Text>
        <Text className="font-sans text-label text-muted">
          {bp.floors > 0 ? `${bp.floors} tầng · ` : ''}
          {bp.population > 0 ? `${bp.population} dân` : 'cây xanh'}
        </Text>
      </View>
      <Pressable accessibilityRole="button" onPress={onDemolish} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#FEE2E2' }}>
        <Text className="font-strong text-label" style={{ color: '#B91C1C' }}>
          Phá dỡ · hoàn {Object.values(refund).reduce((a, b) => a + (b ?? 0), 0)} vật liệu
        </Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Đóng" onPress={onClose} style={{ padding: 4 }}>
        <Icon name="close" size={18} color="#64748B" />
      </Pressable>
    </View>
  );
}

function Market({
  inventory,
  stars,
  onBuy,
  onClose,
}: {
  inventory: Materials;
  stars: number;
  onBuy: (k: MaterialKind, qty: number) => void;
  onClose: () => void;
}) {
  const rows = useMemo(() => MATERIAL_KINDS, []);
  return (
    <View style={[GLASS, { width: 360, maxWidth: '100%', padding: 14 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text className="font-heavy text-body text-ink">Vật liệu</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text className="font-strong text-label text-ink">⭐ {formatStars(stars)}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Đóng" onPress={onClose} style={{ padding: 2 }}>
            <Icon name="close" size={18} color="#64748B" />
          </Pressable>
        </View>
      </View>
      <Text className="font-sans text-muted" style={{ fontSize: 12, marginTop: 2 }}>
        Mỗi câu đúng = 1 vật liệu của mảng đó. Hoặc đổi sao.
      </Text>
      <View style={{ marginTop: 10, gap: 8 }}>
        {rows.map((k) => {
          const info = MATERIAL_INFO[k];
          const price = starCost(k, 10);
          return (
            <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={{ fontSize: 20 }}>{info.glyph}</Text>
              <View style={{ flex: 1 }}>
                <Text className="font-strong text-label text-ink">
                  {info.name} <Text className="font-sans text-muted">· {inventory[k]}</Text>
                </Text>
                <Pressable accessibilityRole="link" onPress={() => router.push(info.href as never)}>
                  <Text className="font-semi" style={{ fontSize: 12, color: '#4A7FE8' }}>
                    Học {info.earn} →
                  </Text>
                </Pressable>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Đổi ${price} sao lấy 10 ${info.name}`}
                disabled={stars < price}
                onPress={() => onBuy(k, 10)}
                style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: stars < price ? '#F1F5F9' : '#FEF3C7' }}
              >
                <Text className="font-strong" style={{ fontSize: 12, color: stars < price ? '#94A3B8' : '#92400E' }}>
                  +10 · {price}⭐
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>
      <Text className="font-sans text-muted" style={{ fontSize: 11, marginTop: 8 }}>
        Giá mỗi đơn vị: {MATERIAL_KINDS.map((k) => `${MATERIAL_INFO[k].name} ${STAR_PRICE[k]}⭐`).join(' · ')}
      </Text>
    </View>
  );
}
