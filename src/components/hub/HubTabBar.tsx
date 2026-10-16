import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, usePathname } from 'expo-router';

import { Icon, type IconName } from '@/components/ui/Icon';
import { HUB } from './theme';

/** Năm tab của khu vực luyện nói. Chỉ hiện ở năm trang gốc; trang con (bài học, phòng) không có. */
const TABS: { href: string; label: string; icon: IconName }[] = [
  { href: '/hub', label: 'Hôm nay', icon: 'calendar' },
  { href: '/hub/learn', label: 'Học', icon: 'book' },
  { href: '/hub/tutor', label: 'Gia sư', icon: 'sparkle' },
  { href: '/hub/explore', label: 'Khám phá', icon: 'compass' },
  { href: '/hub/progress', label: 'Tiến độ', icon: 'trending' },
];

export function HubTabBar() {
  const pathname = usePathname().replace(/\/+$/, '') || '/';
  const root = TABS.some((t) => t.href === pathname);
  if (!root) return null;

  return (
    <View accessibilityRole="tablist" style={{ flexDirection: 'row', backgroundColor: HUB.paper, borderTopWidth: 1, borderTopColor: HUB.line, paddingBottom: 8, paddingTop: 6 }}>
      {TABS.map((t) => {
        const on = pathname === t.href;
        return (
          <Pressable
            key={t.href}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={t.label}
            onPress={() => !on && router.replace(t.href as never)}
            style={{ flex: 1, alignItems: 'center', gap: 3, paddingVertical: 4 }}
          >
            <View style={{ width: 34, height: 3, borderRadius: 2, backgroundColor: on ? HUB.blue : 'transparent', marginBottom: 3, shadowColor: HUB.blue, shadowOpacity: on ? 0.9 : 0, shadowRadius: 8 }} />
            <Icon name={t.icon} size={22} color={on ? HUB.ink : HUB.muted} strokeWidth={on ? 2.1 : 1.7} />
            <Text style={{ color: on ? HUB.ink : HUB.muted, fontSize: 11, fontWeight: on ? '700' : '500' }}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
