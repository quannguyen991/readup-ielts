/**
 * DẢI NHẤN VÀNG ÁNH KIM cho câu chốt ở đầu trang (Band 9, 01/10/2026: "cho chỗ
 * này bôi vàng ánh kim"): nền vàng chuyển nhiều nấc như kim loại, một vệt sáng
 * lướt qua chậm, chữ xanh đậm của logo. Tôn trọng "giảm chuyển động".
 */
import React, { useEffect } from 'react';
import { Platform, Text, View } from 'react-native';

import { BRAND } from './Logo';

const CSS_ID = 'band9-gold-highlight';
const CSS = `
.b9-gold{position:relative;overflow:hidden;background-image:linear-gradient(100deg,#F4E4B8 0%,#DDBE7C 28%,#B8955A 52%,#D9BA78 74%,#F1DDAA 100%);box-shadow:inset 0 1px 0 rgba(255,255,255,.65),inset 0 -2px 0 rgba(120,88,36,.35),0 8px 22px -10px rgba(143,110,54,.55)}
.b9-gold::after{content:"";position:absolute;top:-20%;bottom:-20%;left:-40%;width:30%;transform:skewX(-20deg);background:linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,.55),rgba(255,255,255,0));animation:b9-shine 5.5s ease-in-out infinite}
@keyframes b9-shine{0%,55%{left:-40%}85%,100%{left:120%}}
@media (prefers-reduced-motion:reduce){.b9-gold::after{animation:none;display:none}}
`;

export function GoldHighlight({ children, fontSize, lineHeight }: { children: string; fontSize: number; lineHeight: number }) {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined' || document.getElementById(CSS_ID)) return;
    const el = document.createElement('style');
    el.id = CSS_ID;
    el.textContent = CSS;
    document.head.appendChild(el);
  }, []);
  return (
    <View
      {...({ dataSet: { b9gold: '1' } } as object)}
      className="mt-1.5 self-start rounded-md px-3 py-1 b9-gold"
      style={{ marginLeft: -10, backgroundColor: BRAND.gold }}
    >
      <Text className="font-heavy" style={{ fontSize, lineHeight, color: BRAND.navy }}>
        {children}
      </Text>
    </View>
  );
}
