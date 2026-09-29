import React, { useEffect } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';

import { CityGalleryApp } from '@/components/city/CityGalleryApp';
import { detectCityAvailable, useCityAvailable } from '@/services/city/availability';

/**
 * /quest/city/gallery — trang soát hình công trình cho NHÀ PHÁT TRIỂN.
 * Chỉ có khi `__DEV__` và trên máy tính; bản build thật chuyển về /quest.
 */
export default function CityGalleryRoute() {
  const available = useCityAvailable();

  useEffect(() => {
    if (!__DEV__ || !detectCityAvailable()) router.replace('/quest' as never);
  }, [available]);

  if (!__DEV__ || !available) return <View style={{ flex: 1 }} />;
  return <CityGalleryApp />;
}
