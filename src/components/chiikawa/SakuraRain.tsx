import React, { useEffect, useMemo } from 'react';
import { Platform, View } from 'react-native';

import { mulberry32 } from '@/services/questions/rng';
import { useChiikawaActive } from './chiikawa';

/**
 * Mưa hoa đào rơi ở màn chính, chỉ khi bật Chiikawa. Cánh hoa là CSS thuần:
 * một lớp rơi chậm, một lớp đung đưa lắc qua lại — chuyển động nối tiếp, không
 * tốn render React. Tắt khi người dùng bật "giảm chuyển động". Không nhận chuột.
 */
const CSS_ID = 'readup-sakura-rain';
const CSS = `
@keyframes sr-fall{0%{transform:translate3d(0,-8vh,0)}100%{transform:translate3d(0,112vh,0)}}
@keyframes sr-sway{0%,100%{transform:translate3d(0,0,0) rotate(0deg)}50%{transform:translate3d(var(--sw),0,0) rotate(160deg)}}
@media (prefers-reduced-motion:reduce){[data-sr]{animation:none!important;opacity:.5!important}}
`;

function ensureCss() {
  if (Platform.OS !== 'web' || typeof document === 'undefined' || document.getElementById(CSS_ID)) return;
  const el = document.createElement('style');
  el.id = CSS_ID;
  el.textContent = CSS;
  document.head.appendChild(el);
}

export function SakuraRain({ count = 18 }: { count?: number }) {
  const active = useChiikawaActive();
  useEffect(ensureCss, []);

  const petals = useMemo(() => {
    const rng = mulberry32(20261015);
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: rng() * 100,
      size: 9 + rng() * 9,
      fall: 9 + rng() * 8,
      swayDur: 2.6 + rng() * 2.2,
      delay: -rng() * 14,
      sway: `${Math.round(18 + rng() * 26)}px`,
      hue: rng() > 0.5 ? '#F7A9C6' : '#FFC8DA',
    }));
  }, [count]);

  if (!active || Platform.OS !== 'web') return null;

  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ position: 'fixed' as never, top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', zIndex: 2 }}
    >
      {petals.map((p) => (
        <div
          key={p.id}
          data-sr="1"
          style={{
            position: 'absolute',
            left: `${p.left}%`,
            top: 0,
            animation: `sr-fall ${p.fall.toFixed(2)}s linear ${p.delay.toFixed(2)}s infinite`,
            willChange: 'transform',
          }}
        >
          <div
            data-sr="1"
            style={{
              width: p.size,
              height: p.size * 0.72,
              background: `linear-gradient(135deg, #FFFFFF 0%, ${p.hue} 70%)`,
              borderRadius: '0 80% 0 80%',
              opacity: 0.85,
              boxShadow: '0 1px 3px rgba(198,90,120,0.25)',
              animation: `sr-sway ${p.swayDur.toFixed(2)}s ease-in-out infinite`,
              ['--sw' as string]: p.sway,
            } as React.CSSProperties}
          />
        </div>
      ))}
    </View>
  );
}
