import React from 'react';
import { Text, View } from 'react-native';
import { Link, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/Icon';
import { BOTTOM_TAB_ITEMS } from '@/navigation/nav-items';
import { color } from '@/theme/tokens';

/** Mobile: sidebar thu thành 5 tab chính + tab "More" chứa phần còn lại. */
export function BottomTabs() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const tabs = [
    ...BOTTOM_TAB_ITEMS.map((i) => ({
      key: i.key,
      href: i.href,
      icon: i.icon,
      label: i.shortLabel ?? i.label,
    })),
    { key: 'more', href: '/more', icon: 'more' as const, label: 'More' },
  ];

  return (
    <View
      className="flex-row border-t border-border bg-surface px-2 pt-2"
      style={{ paddingBottom: Math.max(insets.bottom, 8) }}
    >
      {tabs.map((tab) => {
        const active = pathname.startsWith(tab.href);
        return (
          <Link key={tab.key} href={tab.href as never} asChild>
            <View
              accessibilityRole="link"
              aria-selected={active}
              className="flex-1 items-center gap-1 py-1"
            >
              <Icon
                name={tab.icon}
                size={21}
                color={active ? color.primary : color.subtle}
                strokeWidth={active ? 2 : 1.7}
              />
              <Text
                className={[
                  'text-label',
                  active ? 'font-semi text-primary-700' : 'font-mid text-subtle',
                ].join(' ')}
              >
                {tab.label}
              </Text>
            </View>
          </Link>
        );
      })}
    </View>
  );
}
