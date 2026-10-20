/**
 * NỀN CHỦ ĐỀ cho màn ôn từ vựng (web): vũ trụ, hoa anh đào, rừng sương mù, hoàng hôn, đêm mưa.
 *
 * Toàn bộ bằng CSS gradient + vài thẻ div — không ảnh lớn, không canvas. Hoạt hình chỉ dùng
 * `transform` / `opacity` (chạy trên GPU, không đụng bố cục), dừng khi tab ẩn, tắt hẳn khi người
 * dùng đặt "giảm chuyển động". Màu chữ / thẻ nằm ở `study-theme.ts`.
 */
import React, { useEffect } from 'react';
import { View, useWindowDimensions } from 'react-native';

import { ArtBackdrop, ArtCaption, useStudyBackdrop } from '@/components/art/ArtBackdrop';
import { WorldBackdrop } from '@/components/travel/ambient/WorldBackdrop.web';
import { PxCityBackdrop } from '@/components/travel/pxscene/PxCityBackdrop.web';

import { isArtTheme, themeOf, type StudyTheme } from './study-theme';

/** Dưới mốc này (điện thoại, máy bảng) chỉ giữ nền màu, bỏ các lớp hạt và hoạt hình chạy liên tục cho mượt. */
const DECOR_MIN_WIDTH = 1024;

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

/* Biển: dải sóng trôi ngang, mặt trời mờ */
.stbd-sun{position:absolute;right:12%;top:12%;width:150px;height:150px;border-radius:50%;background:radial-gradient(circle,rgba(255,246,214,.95) 0 34%,rgba(255,226,160,.45) 45%,transparent 70%)}
.stbd-sea{position:absolute;left:0;right:0;bottom:0;height:30%;background:linear-gradient(180deg,#3FA6CF,#1B6E96)}
.stbd-wave{position:absolute;left:-30%;width:160%;height:14%;border-radius:50%;will-change:transform;animation:stbd-drift var(--d) ease-in-out var(--dl,0s) infinite alternate}

/* Đêm tuyết: bông tuyết rơi chậm */
.stbd-flake{position:absolute;top:-6%;left:var(--x);width:var(--s);height:var(--s);border-radius:50%;background:#fff;opacity:.8;will-change:transform;animation:stbd-snow var(--d) linear var(--dl) infinite}
@keyframes stbd-snow{from{transform:translate3d(0,-6vh,0)}50%{transform:translate3d(14px,50vh,0)}to{transform:translate3d(-10px,106vh,0)}}

/* Rừng tre: thân tre đung đưa quanh gốc */
.stbd-stalk{position:absolute;bottom:-2%;width:var(--w);height:var(--h);left:var(--x);transform-origin:50% 100%;background:linear-gradient(90deg,#5E8F45,#8CBF6A 45%,#4E7D39);border-radius:6px;opacity:.9;animation:stbd-sway var(--d) ease-in-out var(--dl) infinite alternate}
@keyframes stbd-sway{from{transform:rotate(-2deg)}to{transform:rotate(2.5deg)}}

/* Cực quang: các dải màu trôi và thở chậm */
.stbd-band{position:absolute;left:-20%;width:140%;border-radius:50%;will-change:transform,opacity;animation:stbd-drift var(--d) ease-in-out var(--dl,0s) infinite alternate,stbd-breathe 9s ease-in-out infinite}
@keyframes stbd-breathe{0%,100%{opacity:.45}50%{opacity:.9}}

/* Mưa: lớp vệt mưa lặp theo chiều dọc, nghiêng nhẹ */
.stbd-rain{position:absolute;inset:-12% -12%;will-change:transform;transform:rotate(9deg);animation:stbd-rain var(--d) linear infinite}
@keyframes stbd-rain{from{transform:rotate(9deg) translate3d(0,0,0)}to{transform:rotate(9deg) translate3d(0,var(--h),0)}}

@media (prefers-reduced-motion: reduce){
 .stbd *{animation:none!important}
 .stbd-petal,.stbd-flake{display:none}
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
    case 'waves':
      return (
        <>
          <div className="stbd-sun" />
          <div className="stbd-sea" />
          {h('div', { className: 'stbd-wave', style: st({ bottom: '22%', '--d': '18s', background: 'radial-gradient(60% 60% at 50% 40%,rgba(255,255,255,.4),transparent 70%)' }) })}
          {h('div', { className: 'stbd-wave', style: st({ bottom: '10%', '--d': '24s', '--dl': '-7s', height: '18%', background: 'radial-gradient(60% 60% at 50% 40%,rgba(255,255,255,.3),transparent 70%)' }) })}
        </>
      );
    case 'snow':
      return (
        <>
          <div className="stbd-fill" style={st({ background: 'radial-gradient(60% 30% at 50% 110%, rgba(190,215,255,.22), transparent 70%)' })} />
          {PETALS.map((p, i) => h('div', { key: i, className: 'stbd-flake', style: st({ '--x': p.x, '--s': `${3 + (p.s % 6)}px`, '--d': `${9 + (i % 6)}s`, '--dl': p.dl }) }))}
        </>
      );
    case 'bamboo':
      return (
        <>
          <div className="stbd-fill" style={st({ background: 'radial-gradient(70% 40% at 50% 0%, rgba(255,255,230,.6), transparent 70%)' })} />
          {[6, 18, 31, 47, 58, 72, 86, 95].map((x, i) =>
            h('div', { key: i, className: 'stbd-stalk', style: st({ '--x': `${x}%`, '--w': `${10 + (i % 3) * 4}px`, '--h': `${62 + ((i * 7) % 30)}%`, '--d': `${6 + (i % 4)}s`, '--dl': `${-i * 0.7}s` }) }),
          )}
        </>
      );
    case 'aurora':
      return (
        <>
          {h('div', { className: 'stbd-band', style: st({ top: '14%', height: '26%', '--d': '22s', background: 'radial-gradient(50% 50% at 40% 50%,rgba(60,255,190,.45),transparent 72%)' }) })}
          {h('div', { className: 'stbd-band', style: st({ top: '34%', height: '24%', '--d': '30s', '--dl': '-11s', background: 'radial-gradient(50% 50% at 62% 50%,rgba(140,110,255,.42),transparent 72%)' }) })}
          {h('div', { className: 'stbd-band', style: st({ top: '6%', height: '18%', '--d': '40s', '--dl': '-20s', background: 'radial-gradient(50% 50% at 55% 50%,rgba(80,220,255,.3),transparent 72%)' }) })}
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

/**
 * `caption=false`: không vẽ chú thích tranh ở đây (người gọi tự đặt `StudyBackdropCaption` ở lớp TRÊN nội dung —
 * dùng khi nền chỉ là một lớp phía sau, không bọc nội dung, để đổi nền không dựng lại cả trang).
 */
export function StudyBackdrop({ id, children, caption = true }: { id: string; children: React.ReactNode; caption?: boolean }) {
  const theme = themeOf(id);
  const ref = React.useRef<HTMLDivElement | null>(null);
  const { width } = useWindowDimensions();
  const decor = width >= DECOR_MIN_WIDTH;
  useBackdropCss();
  usePauseWhenHidden(ref);
  const art = useStudyBackdrop();
  if (isArtTheme(theme.id) && art) {
    // zIndex 0 mở ngăn xếp riêng để ảnh (zIndex -1) nằm sau nội dung, trên màu nền.
    return (
      <View className="flex-1" style={{ backgroundColor: theme.skyBase, zIndex: 0 }}>
        <ArtBackdrop backdrop={art} />
        {children}
        {caption ? <ArtCaption backdrop={art} phone={false} /> : null}
      </View>
    );
  }
  return (
    <View className="flex-1" style={{ backgroundColor: theme.skyBase }}>
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <div ref={ref} className="stbd" aria-hidden style={{ background: theme.sky }}>
          {decor ? <Layers theme={theme} /> : null}
        </div>
      </View>
      {children}
    </View>
  );
}

/** Chú thích tranh (tên tranh · hoạ sĩ, có nút ẩn) — vẽ ở lớp TRÊN nội dung để bấm được. */
export function StudyBackdropCaption({ id }: { id: string }) {
  const art = useStudyBackdrop();
  if (!isArtTheme(themeOf(id).id) || !art) return null;
  return <ArtCaption backdrop={art} phone={false} />;
}
