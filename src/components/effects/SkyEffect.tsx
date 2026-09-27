import React, { useEffect } from 'react';
import { Platform } from 'react-native';

/**
 * BẦU TRỜI SÁNG cho thẻ học từ vựng (27/09/2026): mưa sao băng, sao lấp lánh,
 * mây trôi — người dùng muốn có cảm giác bầu trời nhưng NỀN VẪN SÁNG, không
 * chuyển sang nền đêm. Nên sao và vệt sao băng mang màu (xanh, tím, vàng) thay
 * vì trắng: trên nền trắng, sao trắng không thấy được.
 *
 * Chỉ vẽ trên web, bằng thẻ div + keyframes CSS (react-native-web lọc mất
 * animation trong style của View). Nằm dưới nội dung, `pointer-events: none`.
 * Người đặt "giảm chuyển động" thì sao đứng yên, không có sao băng.
 *
 * `intensity` 0–1: mặt trước thẻ để đủ, mặt sau (nhiều chữ) để nhạt.
 */
const STYLE_ID = 'readup-sky-effect';
const CSS = `
@keyframes rsky-twinkle { 0%,100% { opacity: .25; transform: scale(.6) rotate(0deg); } 50% { opacity: 1; transform: scale(1) rotate(20deg); } }
@keyframes rsky-meteor {
  0% { opacity: 0; transform: translate(0,0) rotate(-35deg); }
  3% { opacity: 1; }
  17% { opacity: 1; }
  24% { opacity: 0; transform: translate(-420px, 296px) rotate(-35deg); }
  100% { opacity: 0; transform: translate(-420px, 296px) rotate(-35deg); }
}
@keyframes rsky-cloud { 0%,100% { transform: translateX(0); } 50% { transform: translateX(26px); } }
.rsky-star { position: absolute; animation: rsky-twinkle var(--d) ease-in-out var(--delay) infinite; }
.rsky-meteor { position: absolute; height: 3px; width: 190px; border-radius: 2px; opacity: 0;
  background: linear-gradient(90deg, rgba(79,127,230,1), rgba(139,92,246,.7) 30%, rgba(167,139,250,0));
  box-shadow: 0 0 12px rgba(79,127,230,.7); transform-origin: left center;
  animation: rsky-meteor var(--d) linear var(--delay) infinite; }
.rsky-meteor::before { content: ''; position: absolute; left: -4px; top: -3px; width: 9px; height: 9px; border-radius: 50%;
  background: #fff; box-shadow: 0 0 14px 5px rgba(79,127,230,.95); }
.rsky-dot { position: absolute; width: 3px; height: 3px; border-radius: 50%; background: #7FA3F6; animation: rsky-twinkle var(--d) ease-in-out var(--delay) infinite; }
.rsky-cloud { position: absolute; border-radius: 999px; filter: blur(18px); animation: rsky-cloud 14s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) {
  .rsky-star, .rsky-cloud, .rsky-dot { animation: none; }
  .rsky-meteor { display: none; }
}
`;

function useSkyCss() {
  useEffect(() => {
    if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
    const tag = document.createElement('style');
    tag.id = STYLE_ID;
    tag.textContent = CSS;
    document.head.appendChild(tag);
  }, []);
}

// Vị trí cố định (không ngẫu nhiên): bản dựng phía máy chủ và phía trình duyệt phải khớp.
const STARS: { x: number; y: number; s: number; c: string; d: number; delay: number }[] = [
  { x: 6, y: 12, s: 18, c: '#6F96F2', d: 3.2, delay: 0 },
  { x: 20, y: 70, s: 13, c: '#A78BFA', d: 2.6, delay: 0.8 },
  { x: 33, y: 20, s: 11, c: '#F5B82E', d: 3.8, delay: 1.4 },
  { x: 55, y: 8, s: 16, c: '#6F96F2', d: 2.9, delay: 0.4 },
  { x: 70, y: 62, s: 20, c: '#A78BFA', d: 3.5, delay: 1.9 },
  { x: 86, y: 26, s: 13, c: '#F5B82E', d: 2.4, delay: 1.1 },
  { x: 92, y: 80, s: 16, c: '#6F96F2', d: 3.1, delay: 2.3 },
  { x: 13, y: 42, s: 10, c: '#F5B82E', d: 2.2, delay: 1.6 },
  { x: 46, y: 86, s: 12, c: '#6F96F2', d: 3.4, delay: 0.2 },
  { x: 78, y: 7, s: 10, c: '#A78BFA', d: 2.7, delay: 2.8 },
  { x: 28, y: 88, s: 9, c: '#6F96F2', d: 2.5, delay: 1.2 },
  { x: 62, y: 38, s: 8, c: '#F5B82E', d: 3.0, delay: 2.1 },
  { x: 95, y: 48, s: 11, c: '#A78BFA', d: 2.8, delay: 0.5 },
  { x: 3, y: 84, s: 12, c: '#A78BFA', d: 3.3, delay: 1.8 },
];
// Chấm sao nhỏ lấp lánh rải khắp nền.
const DOTS: [number, number, number][] = [
  [10, 28, 0.3], [24, 10, 1.1], [42, 32, 2.0], [51, 66, 0.7], [66, 20, 1.5], [83, 44, 2.4],
  [90, 12, 0.9], [37, 58, 1.8], [74, 88, 0.1], [16, 58, 2.7], [58, 94, 1.3], [98, 66, 2.2],
];
const METEORS = [
  { top: -6, left: 70, d: 5.5, delay: 0.3 },
  { top: 4, left: 100, d: 6.5, delay: 2.4 },
  { top: 22, left: 104, d: 7.5, delay: 4.1 },
  { top: -10, left: 44, d: 8.5, delay: 5.6 },
];

const SPARK = 'M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0 Z';

export function SkyEffect({ intensity = 1, radius = 24 }: { intensity?: number; radius?: number }) {
  useSkyCss();
  if (Platform.OS !== 'web') return null;
  const h = React.createElement;
  const v = (o: Record<string, string | number>) => o as React.CSSProperties;

  return h(
    'div',
    {
      'aria-hidden': true,
      style: v({
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        borderRadius: radius,
        pointerEvents: 'none',
        opacity: intensity,
        // Trời ban ngày: xanh rất nhạt ở trên, ngả trắng rồi hơi tím ở dưới.
        background: 'linear-gradient(170deg, #DCE8FF 0%, #F2F6FF 50%, #F1EAFF 100%)',
      }),
    },
    h('div', { className: 'rsky-cloud', style: v({ width: 220, height: 70, left: '-40px', top: '8%', background: 'rgba(255,255,255,.95)' }) }),
    h('div', { className: 'rsky-cloud', style: v({ width: 260, height: 80, right: '-60px', bottom: '6%', background: 'rgba(214,226,255,.9)', animationDelay: '-7s' }) }),
    ...DOTS.map(([x, y, delay], i) =>
      h('div', { key: `d${i}`, className: 'rsky-dot', style: v({ left: `${x}%`, top: `${y}%`, '--d': '2.4s', '--delay': `${delay}s` }) }),
    ),
    ...METEORS.map((m, i) =>
      h('div', {
        key: `m${i}`,
        className: 'rsky-meteor',
        style: v({ top: `${m.top}%`, left: `${m.left}%`, '--d': `${m.d}s`, '--delay': `${m.delay}s` }),
      }),
    ),
    ...STARS.map((s, i) =>
      h(
        'svg',
        {
          key: `s${i}`,
          className: 'rsky-star',
          viewBox: '0 0 24 24',
          width: s.s,
          height: s.s,
          style: v({ left: `${s.x}%`, top: `${s.y}%`, '--d': `${s.d}s`, '--delay': `${s.delay}s`, filter: `drop-shadow(0 0 4px ${s.c})` }),
        },
        h('path', { d: SPARK, fill: s.c }),
      ),
    ),
  );
}
