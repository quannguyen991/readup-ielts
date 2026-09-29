import React, { useEffect } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';

import { CityApp } from '@/components/city/CityApp';
import { detectCityAvailable, useCityAvailable } from '@/services/city/availability';

/**
 * /quest/city — Thành Phố Tri Thức. CHỈ trên máy tính (`useCityAvailable`).
 * Vào thẳng trên điện thoại / máy tính bảng → chuyển về /quest.
 *
 * `CityApp` tách theo nền tảng: bản iOS/Android (`CityApp.tsx`) rỗng, không
 * import gì của 3D; bản web (`CityApp.web.tsx`) mới nạp three.js bằng import()
 * động, và chỉ khi hook trên trả true.
 */
export default function CityRoute() {
  const available = useCityAvailable();

  useEffect(() => {
    // Kiểm sau khi gắn (không phải lúc render phía máy chủ) để không lệch hydration.
    if (!detectCityAvailable()) router.replace('/quest' as never);
  }, [available]);

  if (!available) return <View style={{ flex: 1 }} />;
  return <CityApp />;
}
