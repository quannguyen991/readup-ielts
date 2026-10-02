/**
 * DU NGOẠN BAND 9 — thẻ GHIM đầu trang /quest (người dùng 02/10/2026: "chơi cái map
 * du ngoạn thế giới, ghim ở phần quest, bỏ cái vào trận đi").
 *
 * Gần như chỉ có hình: bản đồ thế giới pixel, tên, một dòng, nút lớn "Du ngoạn".
 * Hai con số nhỏ (vé, điểm hộ chiếu) đọc thẳng từ kho du ngoạn, chỉ hiện sau hydrate
 * để khớp bản dựng máy chủ.
 */
import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { useHydrated } from '@/components/layout/useHydrated';
import { Icon } from '@/components/ui/Icon';
import { useL } from '@/i18n/useL';
import { pointsOf } from '@/services/travel/passport';
import { useTravelStore } from '@/store/useTravelStore';
import { GAP, HUB, WEB, useBoxWidth } from './kit';

const MAP_RATIO = 418 / 235;

export function TravelHero() {
  const { L } = useL();
  const hydrated = useHydrated();
  const tickets = useTravelStore((s) => s.tickets);
  const ledger = useTravelStore((s) => s.ledger);
  const onboarded = useTravelStore((s) => s.onboarded);
  const [w, onLayout] = useBoxWidth();
  const wide = w >= 820;
  const points = hydrated ? pointsOf(ledger) : 0;
  const go = () => router.push('/quest/du-ngoan' as never);

  return (
    <View
      onLayout={onLayout}
      style={{
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: HUB.panel,
        borderWidth: 1,
        borderColor: 'rgba(250,204,21,0.45)',
        flexDirection: wide ? 'row' : 'column-reverse',
        ...(WEB ? ({ boxShadow: '0 18px 44px rgba(2,8,23,0.45)' } as object) : null),
      }}
    >
      <View style={{ flex: wide ? 1 : undefined, padding: wide ? 32 : 20, justifyContent: 'center', gap: GAP.md }}>
        <Text className="font-strong" style={{ fontSize: 12, letterSpacing: 1.4, color: HUB.gold }}>
          {L('QUEST · ĐANG GHIM', 'QUEST · PINNED')}
        </Text>
        <Text className="font-heavy" accessibilityRole="header" style={{ fontSize: wide ? 38 : 30, lineHeight: wide ? 44 : 36, color: HUB.ink }}>
          {L('Du ngoạn Band 9', 'Band 9 Travel')}
        </Text>
        <Text className="font-sans" style={{ fontSize: 16, lineHeight: 23, color: HUB.muted, maxWidth: 420 }}>
          {L('Bay qua 9 thành phố, học từ qua từng địa điểm.', 'Fly through 9 cities and learn words, place by place.')}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: GAP.sm, marginTop: 4 }}>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={L('Du ngoạn', 'Travel')}
            onPress={go}
            style={({ hovered }: { hovered?: boolean }) => ({
              minHeight: 56,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              borderRadius: 16,
              paddingHorizontal: 30,
              backgroundColor: hovered ? HUB.goldHover : HUB.gold,
              ...(WEB ? ({ transition: 'background-color 160ms ease, transform 160ms ease', transform: hovered ? 'translateY(-2px)' : 'none' } as object) : null),
            })}
          >
            <Icon name="compass" size={22} color={HUB.ctaInk} strokeWidth={2.4} />
            <Text className="font-heavy" style={{ fontSize: 19, color: HUB.ctaInk }}>
              {L('Du ngoạn', 'Travel')}
            </Text>
          </Pressable>
          {hydrated && onboarded ? (
            <View style={{ flexDirection: 'row', gap: GAP.sm, alignItems: 'center' }}>
              <Chip text={L(`${tickets} vé`, `${tickets} ticket${tickets === 1 ? '' : 's'}`)} />
              <Chip text={L(`${points} điểm hộ chiếu`, `${points} passport pts`)} />
            </View>
          ) : null}
        </View>
      </View>

      <Pressable
        accessibilityRole="image"
        accessibilityLabel={L('Bản đồ thế giới của Du ngoạn Band 9', 'World map of Band 9 Travel')}
        onPress={go}
        style={{ flex: wide ? 1.35 : undefined, width: wide ? undefined : '100%', aspectRatio: wide ? undefined : MAP_RATIO, minHeight: wide ? 300 : undefined, backgroundColor: '#132C4E' }}
      >
        <Image
          source={{ uri: '/travel/maps/world.small.png' }}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
          style={[{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' }, WEB ? ({ imageRendering: 'pixelated' } as object) : null]}
        />
        {WEB ? (
          <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundImage: wide ? 'linear-gradient(90deg, rgba(14,27,48,0.55), rgba(14,27,48,0) 28%)' : 'linear-gradient(0deg, rgba(14,27,48,0.4), rgba(14,27,48,0) 40%)' } as object} />
        ) : null}
      </Pressable>
    </View>
  );
}

function Chip({ text }: { text: string }) {
  return (
    <View style={{ borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: HUB.raised, borderWidth: 1, borderColor: HUB.line }}>
      <Text className="font-strong" style={{ fontSize: 13, color: HUB.ink }}>
        {text}
      </Text>
    </View>
  );
}
