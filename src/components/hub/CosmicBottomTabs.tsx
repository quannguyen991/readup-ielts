import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Icon, type IconName } from '@/components/ui/Icon';

export type CosmicTabKey = 'today' | 'learn' | 'tutor' | 'explore' | 'progress';

const TABS: { key: CosmicTabKey; label: string; icon: IconName; route: string }[] = [
  { key: 'today', label: 'Hôm nay', icon: 'settings', route: '/hub' },
  { key: 'learn', label: 'Học', icon: 'book', route: '/hub/learn' },
  { key: 'tutor', label: 'Gia sư', icon: 'chat', route: '/hub/tutor' },
  { key: 'explore', label: 'Khám phá', icon: 'compass', route: '/hub/explore' },
  { key: 'progress', label: 'Tiến độ', icon: 'trending', route: '/hub/progress' },
];

export function CosmicBottomTabs({ activeTab }: { activeTab: CosmicTabKey }) {
  return (
    <View
      className="border-t border-[#1F2148] bg-[#0E102E]/95 py-2.5 px-3"
      style={{
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(16px)',
      }}
    >
      <View className="mx-auto flex-row items-center justify-between w-full max-w-[650px]">
        {TABS.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <Pressable
              key={tab.key}
              accessibilityRole="button"
              accessibilityLabel={tab.label}
              onPress={() => router.push(tab.route as never)}
              className="relative flex-1 items-center justify-center py-1"
            >
              {/* Vòng sáng phát quang trên tab đang chọn (như ảnh 1 và 2) */}
              {isActive ? (
                <View
                  className="absolute -top-2.5 h-[3px] w-12 rounded-full bg-[#38BDF8]"
                  style={{
                    boxShadow: '0 0 10px #38BDF8, 0 0 20px #0284C7',
                  }}
                />
              ) : null}

              <View
                className="items-center justify-center rounded-xl p-1.5"
                style={{
                  backgroundColor: isActive ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                }}
              >
                <Icon
                  name={tab.icon}
                  size={20}
                  color={isActive ? '#38BDF8' : '#717899'}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
              </View>

              <Text
                className="mt-1 font-strong text-[11px]"
                style={{
                  color: isActive ? '#38BDF8' : '#717899',
                  fontWeight: isActive ? '800' : '600',
                }}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
