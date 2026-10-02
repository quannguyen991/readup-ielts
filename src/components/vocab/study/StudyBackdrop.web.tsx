/**
 * NỀN CHỦ ĐỀ cho màn ôn từ vựng (web): vũ trụ, hoa anh đào, rừng sương mù, hoàng hôn, đêm mưa.
 *
 * Toàn bộ bằng CSS gradient + vài thẻ div — không ảnh lớn, không canvas. Hoạt hình chỉ dùng
 * `transform` / `opacity` (chạy trên GPU, không đụng bố cục), dừng khi tab ẩn, tắt hẳn khi người
 * dùng đặt "giảm chuyển động". Màu chữ / thẻ nằm ở `study-theme.ts`.
 */
import React, { useEffect } from 'react';
import { View } from 'react-native';

import { ArtBackdrop, ArtCaption, useStudyBackdrop } from '@/components/art/ArtBackdrop';
import { WorldBackdrop } from '@/components/travel/ambient/WorldBackdrop.web';
import { PxCityBackdrop } from '@/components/travel/pxscene/PxCityBackdrop.web';

import { isArtTheme, themeOf, type StudyTheme } from './study-theme';

const STYLE_ID = 'readup-study-backdrop';
const CSS = `
.stbd{position:absolute;inset:0;overflow:hidden;pointer-events:none;contain:strict}
.stbd *{pointer-events:none}
.stbd.stbd-paused *{animation-play-state:paused!important}
.stbd-fill{position:absolute;inset:0}

/* Vũ trụ: hai lớp sao nhấp nháy lệch pha, đủ rẻ vì chỉ đổi opacity */
.stbd-sa,.stbd-sb{position:absolute;inset:0;background-repeat:repeat;will-change:opacity}
.stbd-sa{background-size:320px 240px;background-image:
 radial-gradient(1.3px 1.3px at 24px 34px,#fff,transparent),radial-gradient(1px 1px at 92px 128px,#cfd8ff,transparent),
 radial-gradient(1.5px 1.5px at 160px 62px,#fff,transparent),radial-gradient(1px 1px at 226px 182px,#fff,transparent),
 radial-gradient(1.2px 1.2px at 280px 96px,#bcd0ff,transparent),radial-gradient(1px 1px at 60px 210px,#fff,transparent);
 animation:stbd-tw 5s ease-in-out infinite}
.stbd-sb{background-size:410px 290px;background-image:
 radial-gradient(1.6px 1.6px at 40px 70px,#fff,transparent),radial-gradient(1.2px 1.2px at 150px 200px,#ffe9b0,transparent),
 radial-gradient(1px 1px at 250px 40px,#fff,transparent),radial-gradient(1.4px 1.4px at 340px 150px,#c7d2ff,transparent),
 radial-gradient(1px 1px at 380px 260px,#fff,transparent);
 animation:stbd-tw 7.5s ease-in-out -3.2s infinite}
.stbd-bright{position:absolute;width:3px;height:3px;border-radius:50%;background:#fff;box-shadow:0 0 8px 2px rgba(180,200,255,.75);animation:stbd-tw 4s ease-in-out infinite}
@keyframes stbd-tw{0%,100%{opacity:.3}50%{opacity:1}}

/* Hoa anh đào: cánh hoa rơi chéo, xoay chậm */
.stbd-petal{position:absolute;top:-8%;left:var(--x);width:var(--s);height:calc(var(--s)*.72);
 background:linear-gradient(135deg,#FFE0EA,#F7A1BE);border-radius:100% 0 100% 0;opacity:.88;will-change:transform;
 animation:stbd-fall var(--d) linear var(--dl) infinite}
@keyframes stbd-fall{0%{transform:translate3d(0,-8vh,0) rotate(0deg)}50%{transform:translate3d(46px,56vh,0) rotate(200deg)}100%{transform:translate3d(-34px,112vh,0) rotate(400deg)}}

/* Sương mù / mây: dải sáng trôi ngang */
.stbd-drift{position:absolute;left:-30%;width:160%;will-change:transform;animation:stbd-drift var(--d) ease-in-out var(--dl,0s) infinite alternate}
@keyframes stbd-drift{from{transform:translate3d(-6%,0,0)}to{transform:translate3d(6%,0,0)}}

/* Mưa: lớp vệt mưa lặp theo chiều dọc, nghiêng nhẹ */
.stbd-rain{position:absolute;inset:-12% -12%;will-change:transform;transform:rotate(9deg);animation:stbd-rain var(--d) linear infinite}
@keyframes stbd-rain{from{transform:rotate(9deg) translate3d(0,0,0)}to{transform:rotate(9deg) translate3d(0,var(--h),0)}}

@media (prefers-reduced-motion: reduce){
 .stbd *{animation:none!important}
 .stbd-petal{display:none}
}
`;

function useBackdropCss() {
  useEffect(() => {
    if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
    const tag = document.createElement('style');
    tag.id = STYLE_ID;
    tag.textContent = CSS;
    document.head.appendChild(tag);
  }, []);
}

/** Dừng mọi hoạt hình khi tab ẩn (CSS vẫn chạy ngầm ở một số trình duyệt). */
function usePauseWhenHidden(ref: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const on = () => ref.current?.classList.toggle('stbd-paused', document.visibilityState === 'hidden');
    on();
    document.addEventListener('visibilitychange', on);
    return () => document.removeEventListener('visibilitychange', on);
  }, [ref]);
}

// Vị trí cố định (không ngẫu nhiên) để bản dựng máy chủ và trình duyệt khớp nhau.
const PETALS = Array.from({ length: 14 }, (_, i) => ({
  x: `${(i * 7.3 + (i % 3) * 5) % 100}%`,
  s: 12 + ((i * 5) % 11),
  d: `${11 + ((i * 3) % 7)}s`,
  dl: `${-((i * 2.3) % 14).toFixed(1)}s`,
}));
const BRIGHT = [
  [12, 18], [78, 9], [44, 34], [90, 52], [27, 66], [64, 78], [8, 88],
];

function Layers({ theme }: { theme: StudyTheme }) {
  const h = React.createElement;
  const st = (o: Record<string, string | number>) => o as React.CSSProperties;
  switch (theme.layer) {
    case 'stars':
      return (
        <>
          <div className="stbd-sa" />
          <div className="stbd-sb" />
          {BRIGHT.map(([x, y], i) => h('div', { key: i, className: 'stbd-bright', style: st({ left: `${x}%`, top: `${y}%`, animationDelay: `${-i * 0.9}s` }) }))}
        </>
      );
    case 'petals':
      return (
        <>
          <div className="stbd-fill" style={st({ background: 'radial-gradient(45% 35% at 12% 0%, rgba(255,255,255,0.55), transparent 70%)' })} />
          {PETALS.map((p, i) => h('div', { key: i, className: 'stbd-petal', style: st({ '--x': p.x, '--s': `${p.s}px`, '--d': p.d, '--dl': p.dl }) }))}
        </>
      );
    case 'mist':
      return (
        <>
          <div className="stbd-fill" style={st({ background: 'radial-gradient(120% 55% at 50% 108%, rgba(63,110,92,0.55) 0 38%, transparent 39%), radial-gradient(90% 45% at 15% 112%, rgba(47,92,76,0.55) 0 40%, transparent 41%), radial-gradient(90% 45% at 88% 112%, rgba(54,101,84,0.5) 0 40%, transparent 41%)' })} />
          {h('div', { className: 'stbd-drift', style: st({ top: '18%', height: '34%', '--d': '26s', background: 'radial-gradient(60% 50% at 40% 50%, rgba(255,255,255,0.55), transparent 70%)' }) })}
          {h('div', { className: 'stbd-drift', style: st({ top: '52%', height: '30%', '--d': '34s', '--dl': '-9s', background: 'radial-gradient(60% 50% at 60% 50%, rgba(255,255,255,0.45), transparent 70%)' }) })}
        </>
      );
    case 'dusk':
      return (
        <>
          <div className="stbd-fill" style={st({ background: 'radial-gradient(40% 14% at 50% 94%, rgba(255,232,170,0.8), transparent 75%), radial-gradient(130% 40% at 50% 112%, rgba(120,70,130,0.55) 0 45%, transparent 46%)' })} />
          {h('div', { className: 'stbd-drift', style: st({ top: '16%', height: '8%', '--d': '40s', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)', borderRadius: 999 }) })}
          {h('div', { className: 'stbd-drift', style: st({ top: '34%', height: '6%', '--d': '52s', '--dl': '-18s', background: 'linear-gradient(90deg, transparent, rgba(255,240,230,0.45), transparent)', borderRadius: 999 }) })}
        </>
      );
    case 'rain':
      return (
        <>
          <div className="stbd-fill" style={st({ background: 'radial-gradient(70% 30% at 50% 108%, rgba(90,140,200,0.25), transparent 70%)' })} />
          {h('div', {
            className: 'stbd-rain',
            style: st({ '--d': '0.95s', '--h': '260px', opacity: 0.55, backgroundSize: '140px 260px', backgroundImage: 'radial-gradient(1px 26px at 22px 30px, rgba(190,215,255,0.55), transparent), radial-gradient(1px 20px at 88px 150px, rgba(190,215,255,0.45), transparent), radial-gradient(1px 30px at 120px 80px, rgba(190,215,255,0.5), transparent)' }),
          })}
          {h('div', {
            className: 'stbd-rain',
            style: st({ '--d': '1.5s', '--h': '340px', opacity: 0.32, backgroundSize: '210px 340px', backgroundImage: 'radial-gradient(1px 22px at 40px 60px, rgba(190,215,255,0.5), transparent), radial-gradient(1px 28px at 150px 220px, rgba(190,215,255,0.5), transparent)' }),
          })}
        </>
      );
    case 'world':
      return <WorldBackdrop />;
    case 'pxscene':
      return <PxCityBackdrop themeId={theme.id} />;
    default:
      return null;
  }
}

export function StudyBackdrop({ id, children }: { id: string; children: React.ReactNode }) {
  const theme = themeOf(id);
  const ref = React.useRef<HTMLDivElement | null>(null);
  useBackdropCss();
  usePauseWhenHidden(ref);
  const art = useStudyBackdrop(true);
  if (isArtTheme(theme.id) && art) {
    // zIndex 0 mở ngăn xếp riêng để ảnh (zIndex -1) nằm sau nội dung, trên màu nền.
    return (
      <View className="flex-1" style={{ backgroundColor: theme.skyBase, zIndex: 0 }}>
        <ArtBackdrop backdrop={art} />
        {children}
        <ArtCaption backdrop={art} phone={false} />
      </View>
    );
  }
  return (
    <View className="flex-1" style={{ backgroundColor: theme.skyBase }}>
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <div ref={ref} className="stbd" aria-hidden style={{ background: theme.sky }}>
          <Layers theme={theme} />
        </div>
      </View>
      {children}
    </View>
  );
}
