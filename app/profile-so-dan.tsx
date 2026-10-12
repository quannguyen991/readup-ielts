/**
 * Bản mẫu hồ sơ theo phong cách retro (ảnh tham chiếu): thử giao diện trước khi
 * quyết định thay màn Hồ sơ thật. Shrikhand được nạp riêng ở đây từ assets/fonts
 * (OFL), không đụng tới _layout dùng chung.
 */
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useFonts } from 'expo-font';

import { ProfileRetro } from '@/components/profile-retro/ProfileRetro';
import { color } from '@/theme/tokens';

export default function ProfileSoDanScreen() {
  const [fontsLoaded] = useFonts({
    Shrikhand_400Regular: require('../assets/fonts/Shrikhand_400Regular.ttf'),
  });

  if (!fontsLoaded) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color={color.primary} />
      </View>
    );
  }

  return <ProfileRetro />;
}
