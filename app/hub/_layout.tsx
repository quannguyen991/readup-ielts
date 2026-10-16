import React from 'react';
import { View } from 'react-native';
import { Slot } from 'expo-router';

import { HubTabBar } from '@/components/hub/HubTabBar';
import { HUB } from '@/components/hub/theme';

/**
 * Khu luyện nói (tab Hôm nay / Học / Gia sư / Khám phá / Tiến độ). Đây là một khu
 * riêng với thanh tab riêng: `focus-routes` ẩn thanh điều hướng chung của app khi
 * vào /hub, nên không có hai thanh chồng nhau.
 */
export default function HubLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: HUB.bg[0] }}>
      <View style={{ flex: 1 }}>
        <Slot />
      </View>
      <HubTabBar />
    </View>
  );
}
