/**
 * THÀNH PHỐ TRI THỨC ở đầu trang /quest (chỉ máy tính — trang gọi khối này sau
 * khi `useCityAvailable()` trả true).
 *
 * 01/10/2026: người dùng chê khối cũ "bố cục không đẹp, rất nhiều chữ" và bảo
 * hình phải là MAP KHU CAO ỐC (skyline) chứ không phải thành phố mẫu. Giờ là
 * một khung: cảnh 3D của Trung tâm Tương lai chiếm cả khối, bên trái chỉ có
 * tiêu đề, hai nút và một dòng tiến độ thật.
 */
import React from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import type { Era } from '@/data/city/catalog';
import { useAuthStore } from '@/store/useAuthStore';
import { HUB_DOWNTOWN, type HubSnapshot } from '@/services/city/hub';
import { useCityStore } from '@/store/useCityStore';
import { CityPreview } from './CityPreview';
import { useHubSnapshot } from './useHubSnapshot';
import { useL } from '@/i18n/useL';

const GOLD = '#E2C88F';
const WEB = Platform.OS === 'web';
const HEIGHT = 380;

export function QuestCityHero() {
  const { L } = useL();
  const chosen = useCityStore((s) => !!s.terrain);
  const era = useCityStore((s) => (s.era || 1) as Era);
  const token = useAuthStore((st) => st.session?.access_token ?? null);
  const { data } = useHubSnapshot(token);

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={L('Vào Trung tâm Tương lai', 'Enter the Future Centre')}
      onPress={() => router.push('/quest/city' as never)}
      style={{
        borderRadius: 24,
        overflow: 'hidden',
        minHeight: HEIGHT,
        backgroundColor: '#0B1A2E',
        ...(WEB ? ({ cursor: 'pointer' } as object) : null),
      }}
    >
      {/* cảnh 3D: khu cao ốc chung, phủ cả khối */}
      <View style={{ position: 'absolute', top: 0, left: '30%', right: 0, bottom: 0 }}>
        <CityPreview height={HEIGHT + 40} hub hubTotal={data?.total} />
      </View>
      {/* lớp mờ phía trái để chữ đọc được trên nền cảnh */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: '58%',
          ...(WEB ? ({ backgroundImage: 'linear-gradient(90deg, rgba(11,26,46,0.94) 0%, rgba(11,26,46,0.78) 55%, rgba(11,26,46,0) 100%)' } as object) : { backgroundColor: 'rgba(11,26,46,0.7)' }),
        }}
      />

      <View style={{ flex: 1, minHeight: HEIGHT, padding: 32, justifyContent: 'space-between', maxWidth: 560 }}>
        <View>
          <Text className="font-strong" style={{ fontSize: 12, letterSpacing: 2.4, color: GOLD }}>
            {L('THÀNH PHỐ TRI THỨC', 'CITY OF KNOWLEDGE')}
          </Text>
          <Text className="font-heavy" style={{ marginTop: 10, fontSize: 40, lineHeight: 46, color: '#FFFFFF' }}>
            {L('Mỗi câu đúng', 'Every right answer')}
            {'\n'}
            <Text style={{ color: GOLD }}>{L('là một viên gạch', 'is a brick')}</Text>
          </Text>
        </View>

        <View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
            <Pressable
              accessibilityRole="link"
              onPress={(e) => {
                e.stopPropagation?.();
                router.push('/quest/city' as never);
              }}
              style={({ hovered }: { hovered?: boolean }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                borderRadius: 12,
                paddingHorizontal: 20,
                paddingVertical: 13,
                backgroundColor: hovered ? '#F0DBA8' : GOLD,
              })}
            >
              <Text className="font-heavy" style={{ fontSize: 15, color: '#0F1D33' }}>
                {L('Vào Trung tâm', 'Enter the Centre')}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="link"
              onPress={(e) => {
                e.stopPropagation?.();
                router.push('/quest/city?own=1' as never);
              }}
              style={({ hovered }: { hovered?: boolean }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                borderRadius: 12,
                paddingHorizontal: 18,
                paddingVertical: 12,
                borderWidth: 1.5,
                borderColor: 'rgba(226,200,143,0.7)',
                backgroundColor: hovered ? 'rgba(226,200,143,0.16)' : 'rgba(255,255,255,0.04)',
              })}
            >
              <Text className="font-heavy" style={{ fontSize: 17, lineHeight: 18, color: GOLD }}>
                {chosen ? '🏙️' : '＋'}
              </Text>
              <Text className="font-strong" style={{ fontSize: 15, color: '#FFFFFF' }}>
                {chosen ? L(`Thành phố của tôi · Kỷ ${era}`, `My city · Era ${era}`) : L('Thành phố của bạn', 'Your city')}
              </Text>
            </Pressable>
          </View>
          <HubLine data={data} />
        </View>
      </View>
    </Pressable>
  );
}

/** Một dòng tiến độ THẬT của khu mở rộng (từ /api/city-hub); chưa tải được thì không hiện số. */
function HubLine({ data }: { data: HubSnapshot | null }) {
  const { L } = useL();
  const p = data?.progress;
  if (!p) return null;
  return (
    <View style={{ marginTop: 18, maxWidth: 360 }}>
      <View style={{ flexDirection: 'row', gap: 5 }}>
        {p.towers.map((t, i) => (
          <View key={t.id} style={{ flex: 1, height: 5, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.18)', overflow: 'hidden' }}>
            <View style={{ width: `${Math.round((t.done ? 1 : (t.floorsBuilt + (t.floor?.fraction ?? 0)) / t.floors) * 100)}%`, height: '100%', backgroundColor: t.done ? '#4ADE80' : i === p.current ? GOLD : '#7DD3FC' }} />
          </View>
        ))}
      </View>
      <Text className="font-semi" style={{ marginTop: 8, fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
        {L(`${HUB_DOWNTOWN.length} tòa xong · khu mở rộng ${p.floorsBuilt}/${p.floorsTotal} tầng`, `${HUB_DOWNTOWN.length} towers done · expansion ${p.floorsBuilt}/${p.floorsTotal} floors`)}
      </Text>
    </View>
  );
}
