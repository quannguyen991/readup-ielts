import React, { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { Slot } from 'expo-router';

import { HUB } from '@/components/hub/theme';

/**
 * Khu luyện nói (Hub). Không còn thanh tab riêng ở dưới: mọi lối vào (Học, Gia sư,
 * Khám phá, Tiến độ) nằm ngay trên trang Hôm nay. Trên web, cả khu dùng Nunito — cùng
 * họ chữ tròn với trang cute-home — bằng cách gắn một class lên <html> khi vào Hub.
 */
const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap&subset=vietnamese';
const CLASS = 'hub-font';
const STYLE_ID = 'hub-font-style';

function useHubFont() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const root = document.documentElement;

    if (!document.getElementById('hub-font-link')) {
      const link = document.createElement('link');
      link.id = 'hub-font-link';
      link.rel = 'stylesheet';
      link.href = FONT_HREF;
      document.head.appendChild(link);
    }
    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = `html.${CLASS} body, html.${CLASS} body * { font-family: "Nunito", system-ui, sans-serif !important; }`;
      document.head.appendChild(style);
    }

    root.classList.add(CLASS);
    return () => {
      root.classList.remove(CLASS);
    };
  }, []);
}

export default function HubLayout() {
  useHubFont();
  return (
    <View style={{ flex: 1, backgroundColor: HUB.bg[0] }}>
      <Slot />
    </View>
  );
}
