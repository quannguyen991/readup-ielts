import React from 'react';
import { Text, View } from 'react-native';
import { Link, usePathname } from 'expo-router';

import { Icon } from '@/components/ui/Icon';
import { IconCircle } from '@/components/ui/IconCircle';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { NAV_ITEMS } from '@/navigation/nav-items';
import { color, layout } from '@/theme/tokens';

/**
 * Sidebar trái cố định trên web.
 * Đáy sidebar: ảnh tham chiếu là card "Upgrade to Premium"; vì đây là bản dùng
 * cá nhân nên đổi thành card streak/động viên theo yêu cầu trong prompt.
 */
export function Sidebar() {
  const pathname = usePathname();

  return (
    <View
      className="h-full border-r border-border bg-surface px-3 pb-4 pt-4"
      style={{ width: layout.sidebarWidth }}
    >
      <View className="gap-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link key={item.key} href={item.href as never} asChild>
              <View
                accessibilityRole="link"
                accessibilityState={{ selected: active }}
                className={[
                  'flex-row items-center gap-3 rounded-panel px-3 py-2.5',
                  active ? 'bg-primary-50' : 'bg-transparent',
                ].join(' ')}
              >
                <Icon
                  name={item.icon}
                  size={19}
                  color={active ? color.primary : color.muted}
                  strokeWidth={active ? 2 : 1.7}
                />
                <Text
                  className={[
                    'text-body',
                    active ? 'font-semi text-primary-700' : 'font-mid text-body',
                  ].join(' ')}
                >
                  {item.label}
                </Text>
              </View>
            </Link>
          );
        })}
      </View>

      <View className="flex-1" />

      <StreakCard />
    </View>
  );
}

/** Thay cho card "Upgrade to Premium" — bản cá nhân dùng card động viên. */
function StreakCard() {
  return (
    <View className="items-center rounded-card border border-border bg-surfaceAlt px-4 py-5">
      <IconCircle name="flame" tone="warning" size={52} />
      <Text className="mt-3 text-center font-strong text-cardTitle text-ink">
        Chuỗi 7 ngày 🔥
      </Text>
      <Text className="mt-1 text-center font-sans text-label text-muted">
        Mỗi ngày một bài đọc. Giữ nhịp là thứ đưa bạn tới band 7.
      </Text>
      <ProgressBar value={70} tone="warning" className="mt-3 w-full" />
      <Text className="mt-2 font-mid text-label text-muted">45 / 60 phút hôm nay</Text>
    </View>
  );
}
