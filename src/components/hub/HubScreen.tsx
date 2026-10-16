import React, { type ReactNode } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { Icon } from '@/components/ui/Icon';
import { CHIIKAWA_IMG, useChiikawaActive } from '@/components/chiikawa/chiikawa';
import { useGameStore } from '@/store/useGameStore';
import { useHubStore } from '@/store/useHubStore';
import { dayKeyOf, streakDays } from '@/services/hub/daily';
import { HUB } from './theme';

/** Khung chung: nền vũ trụ, đầu trang với chỉ số (chuỗi ngày, XP), và nội dung cuộn. */
export function HubScreen({
  title,
  subtitle,
  children,
  back,
  scroll = true,
  padBottom = 120,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  back?: boolean;
  scroll?: boolean;
  padBottom?: number;
}) {
  const doneByDay = useHubStore((s) => s.doneByDay);
  const xp = useGameStore((s) => s.xp);
  const streak = streakDays(doneByDay, dayKeyOf(new Date()));
  const chiikawa = useChiikawaActive();

  const header = (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 14, paddingBottom: 10, gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
        {back ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Quay lại" onPress={() => (router.canGoBack() ? router.back() : router.replace('/hub' as never))} style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: HUB.glass }}>
            <Icon name="chevron-left" size={20} color={HUB.ink} />
          </Pressable>
        ) : null}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={{ color: HUB.ink, fontSize: 22, fontWeight: '800' }}>{title}</Text>
          {subtitle ? <Text numberOfLines={2} style={{ color: HUB.muted, fontSize: 13, marginTop: 2 }}>{subtitle}</Text> : null}
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Chip icon="flame" color={HUB.orange} value={String(streak)} label="chuỗi" />
        <Chip icon="trophy" color={HUB.amber} value={xp >= 10000 ? '10000+' : String(xp)} label="XP" />
        {chiikawa ? <Image source={CHIIKAWA_IMG.wave} resizeMode="contain" style={{ width: 40, height: 40 }} accessibilityIgnoresInvertColors /> : null}
      </View>
    </View>
  );

  return (
    <LinearGradient colors={HUB.bg as never} start={{ x: 0, y: 0 }} end={{ x: 0.6, y: 1 }} style={{ flex: 1 }}>
      {header}
      {scroll ? (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: padBottom, gap: 16 }} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      ) : (
        <View style={{ flex: 1, paddingHorizontal: 16, paddingBottom: padBottom }}>{children}</View>
      )}
    </LinearGradient>
  );
}

function Chip({ icon, color, value, label }: { icon: 'flame' | 'trophy'; color: string; value: string; label: string }) {
  return (
    <View accessibilityLabel={`${value} ${label}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, backgroundColor: HUB.glassStrong, borderWidth: 1, borderColor: HUB.line }}>
      <Icon name={icon} size={14} color={color} strokeWidth={2.2} />
      <Text style={{ color: HUB.ink, fontSize: 13, fontWeight: '700' }}>{value}</Text>
    </View>
  );
}
