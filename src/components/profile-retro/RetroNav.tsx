/**
 * Thanh tab dưới kiểu retro trên điện thoại, và các hằng số điều hướng của bản mẫu hồ sơ.
 * Cột bên trái trên máy tính ở RetroSidebar.tsx; thanh trên ở RetroTopBar.tsx.
 */
import React from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { useL } from '@/i18n/useL';
import { useDisplayName } from '@/store/useAuthStore';

import { RFONT, RGOLD, RINK, RPAPER } from './retro-art';
import { BookIcon, CalendarIcon, HomeIcon } from './retro-icons';

/** Đường dẫn của bản mẫu hồ sơ retro. Chỉ ở đây mới đổi điều hướng sang kiểu retro. */
export const RETRO_ROUTE = '/profile-so-dan';

/**
 * Bản mẫu thuộc mục Cá nhân, nên mọi tra cứu mục điều hướng (đang ở mục nào, có được lùi
 * không) dùng `/profile` thay cho đường dẫn của bản mẫu.
 */
export function navPathFor(pathname: string): string {
  return pathname === RETRO_ROUTE ? '/profile' : pathname;
}

const IS_WEB = Platform.OS === 'web';
const BAR_HEIGHT = 64;

const TABS = [
  { key: 'home', href: '/dashboard', Glyph: HomeIcon, vi: 'Trang chủ', en: 'Home' },
  { key: 'learn', href: '/practice', Glyph: BookIcon, vi: 'Học', en: 'Learn' },
  { key: 'plan', href: '/plan', Glyph: CalendarIcon, vi: 'Lộ trình', en: 'Plan' },
  { key: 'you', href: '/profile', Glyph: null, vi: 'Bạn', en: 'You' },
] as const;

/** Thanh tab dưới trên điện thoại: viên kem có viền mực và bóng lệch, tab đang chọn là đĩa vàng. */
export function RetroTabBar({ active }: { active: (typeof TABS)[number]['key'] }) {
  const { L } = useL();
  const initial = (useDisplayName().trim()[0] ?? 'B').toUpperCase();

  return (
    <View
      accessibilityRole="tablist"
      className="lg:hidden"
      style={
        {
          position: IS_WEB ? 'fixed' : 'absolute',
          left: 14,
          right: 14,
          bottom: IS_WEB ? 'calc(14px + env(safe-area-inset-bottom, 0px))' : 14,
          zIndex: 45,
        } as never
      }
    >
      {/* Bóng lệch mực, cùng kiểu với các khối trong trang */}
      <View aria-hidden pointerEvents="none" style={{ position: 'absolute', top: 6, left: 6, right: -6, bottom: -6, borderRadius: 32, backgroundColor: RINK }} />
      <View
        style={{
          flexDirection: 'row',
          height: BAR_HEIGHT,
          alignItems: 'center',
          paddingHorizontal: 8,
          borderRadius: 32,
          borderWidth: 3,
          borderColor: RINK,
          backgroundColor: RPAPER,
        }}
      >
        {TABS.map((tab) => {
          const on = active === tab.key;
          return (
            <Pressable
              key={tab.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              accessibilityLabel={L(tab.vi, tab.en)}
              onPress={() => {
                if (!on) router.navigate(tab.href as never);
              }}
              style={{ flex: 1, height: BAR_HEIGHT, alignItems: 'center', justifyContent: 'center' }}
            >
              <View
                style={{
                  width: 60,
                  height: 46,
                  borderRadius: 23,
                  borderWidth: on ? 3 : 0,
                  borderColor: RINK,
                  backgroundColor: on ? RGOLD : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {tab.Glyph ? <tab.Glyph size={24} /> : <Text style={{ fontFamily: RFONT.heavy, fontSize: 18, color: RINK }}>{initial}</Text>}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
