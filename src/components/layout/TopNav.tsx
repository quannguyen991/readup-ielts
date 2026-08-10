import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Link, usePathname } from 'expo-router';

import { Icon } from '@/components/ui/Icon';
import { TOP_NAV_ITEMS } from '@/navigation/nav-items';
import { color, layout } from '@/theme/tokens';

type TopNavProps = {
  userName?: string;
};

export function TopNav({ userName = 'Aisha' }: TopNavProps) {
  const pathname = usePathname();

  return (
    <View
      className="flex-row items-center justify-between border-b border-border bg-surface px-4 lg:px-6"
      style={{ height: layout.topNavHeight }}
    >
      <Logo />

      <View className="hidden flex-row items-center gap-1 lg:flex">
          {TOP_NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link key={item.key} href={item.href as never} asChild>
                <View
                  accessibilityRole="link"
                  accessibilityState={{ selected: active }}
                  className={[
                    'flex-row items-center gap-2 rounded-pill px-3.5 py-2',
                    active ? 'bg-primary-50' : 'bg-transparent',
                  ].join(' ')}
                >
                  <Icon
                    name={item.icon}
                    size={17}
                    color={active ? color.primary : color.muted}
                  />
                  <Text
                    className={[
                      'text-body',
                      active ? 'font-semi text-primary-700' : 'font-mid text-muted',
                    ].join(' ')}
                  >
                    {item.label}
                  </Text>
                </View>
              </Link>
            );
          })}
      </View>

      <View className="flex-row items-center gap-3">
        <Pressable accessibilityRole="button" accessibilityLabel="Thông báo" className="p-1.5">
          <View>
            <Icon name="bell" size={20} color={color.muted} />
            <View className="absolute right-0 top-0 h-2 w-2 rounded-pill bg-danger" />
          </View>
        </Pressable>

        <View className="flex-row items-center gap-2">
          <View className="h-9 w-9 items-center justify-center rounded-pill bg-accent-100">
            <Text className="font-strong text-body text-accent-700">
              {userName.slice(0, 1).toUpperCase()}
            </Text>
          </View>
          <Text className="hidden font-semi text-body text-ink lg:flex">Hello, {userName}</Text>
          <Icon name="chevron-down" size={16} color={color.subtle} />
        </View>
      </View>
    </View>
  );
}

export function Logo() {
  return (
    <View className="flex-row items-center gap-2.5">
      <View className="h-9 w-9 items-center justify-center rounded-md bg-primary-600">
        <Icon name="book" size={20} color={color.white} strokeWidth={1.9} />
      </View>
      <Text className="font-heavy text-sectionTitle text-ink">ReadUp IELTS</Text>
    </View>
  );
}
