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

/* ---- Bộ nền mùa & văn hoá ---- */
.stbd-petal{background:linear-gradient(135deg,var(--c1,#FFE0EA),var(--c2,#F7A1BE))}
.stbd-glow{position:absolute;border-radius:50%;will-change:opacity;animation:stbd-breathe 8s ease-in-out infinite}
.stbd-moon{position:absolute;border-radius:50%;background:radial-gradient(circle at 38% 38%,#FFFDF3 0 55%,#FFE9C2 75%,rgba(255,233,194,0) 76%);box-shadow:0 0 60px 24px rgba(255,236,200,.28)}

/* Tuyết lớn mềm (không dùng filter: chỉ gradient) */
.stbd-fk2{position:absolute;top:-8%;left:var(--x);width:var(--s);height:var(--s);border-radius:50%;opacity:.9;will-change:transform;
 background:radial-gradient(circle,rgba(255,255,255,.98) 0 30%,rgba(255,255,255,.55) 52%,rgba(255,255,255,0) 72%);animation:stbd-snow var(--d) linear var(--dl) infinite}
.stbd-hill{position:absolute;left:-10%;width:120%;border-radius:50% 50% 0 0/100% 100% 0 0}

/* Đèn lồng treo, lắc nhẹ quanh điểm treo */
.stbd-lant{position:absolute;top:0;left:var(--x);width:var(--w);height:calc(var(--w)*1.15);margin-top:var(--len);transform-origin:50% calc(var(--len)*-1);will-change:transform;animation:stbd-swing var(--d) ease-in-out var(--dl) infinite alternate}
.stbd-lant::before{content:"";position:absolute;left:50%;top:calc(var(--len)*-1);width:2px;height:var(--len);background:linear-gradient(#E6B65A,#B98A2E);transform:translateX(-50%)}
.stbd-lant::after{content:"";position:absolute;inset:0;border-radius:46%;background:radial-gradient(circle at 50% 42%,var(--c1,#FF8A3C) 0 22%,var(--c2,#D8281E) 70%,#8E1410 100%);box-shadow:0 0 28px 8px var(--glow,rgba(255,120,50,.45)),inset 0 0 0 2px rgba(255,214,120,.55)}
@keyframes stbd-swing{from{transform:rotate(-4deg)}to{transform:rotate(4deg)}}

/* Sao lấp lánh 4 cánh (vàng kim / ánh kim) */
.stbd-spark{position:absolute;left:var(--x);top:var(--y);width:var(--s);height:var(--s);clip-path:polygon(50% 0,59% 41%,100% 50%,59% 59%,50% 100%,41% 59%,0 50%,41% 41%);
 background:linear-gradient(135deg,#FFF6CF,#FFD36B 55%,#E0A53A);will-change:transform,opacity;animation:stbd-sparkle var(--d) ease-in-out var(--dl) infinite}
@keyframes stbd-sparkle{0%,100%{transform:scale(.25) rotate(0);opacity:0}50%{transform:scale(1) rotate(45deg);opacity:1}}
.stbd-shimmer{position:absolute;top:-10%;bottom:-10%;left:-40%;width:30%;background:linear-gradient(100deg,transparent,rgba(255,226,150,.16),transparent);transform:skewX(-14deg);will-change:transform;animation:stbd-sweep 9s ease-in-out infinite}
@keyframes stbd-sweep{0%{transform:translate3d(0,0,0) skewX(-14deg)}60%,100%{transform:translate3d(460%,0,0) skewX(-14deg)}}

/* Đèn kết Noel / ô cửa sổ thành phố */
.stbd-bulb{position:absolute;left:var(--x);top:var(--y);width:var(--s);height:var(--s);border-radius:50%;background:var(--c);box-shadow:0 0 12px 4px var(--c);will-change:opacity;animation:stbd-tw var(--d) ease-in-out var(--dl) infinite}
.stbd-win{position:absolute;left:var(--x);top:var(--y);width:4px;height:6px;background:#FFD27A;opacity:.85;will-change:opacity;animation:stbd-tw var(--d) ease-in-out var(--dl) infinite}
.stbd-tree{position:absolute;bottom:-1%;left:var(--x);width:var(--w);height:calc(var(--w)*1.35)}
.stbd-tree i{position:absolute;left:50%;transform:translateX(-50%);background:linear-gradient(180deg,#2F8A55,#145A33);clip-path:polygon(50% 0,100% 100%,0 100%)}
.stbd-skyline{position:absolute;left:0;right:0;bottom:0}

/* Sóng seigaiha trôi ngang + mặt trời đỏ + lá phong */
.stbd-seig{position:absolute;left:0;bottom:0;width:calc(100% + 120px);will-change:transform;animation:stbd-seigdrift 26s linear infinite;
 background-image:radial-gradient(circle at 50% 100%,transparent 0 24%,var(--l) 25% 28%,transparent 29% 40%,var(--l) 41% 44%,transparent 45% 56%,var(--l) 57% 60%,transparent 61% 100%),
  radial-gradient(circle at 50% 100%,transparent 0 24%,var(--l) 25% 28%,transparent 29% 40%,var(--l) 41% 44%,transparent 45% 56%,var(--l) 57% 60%,transparent 61% 100%);
 background-size:60px 30px;background-position:0 0,30px 15px;background-color:var(--b)}
@keyframes stbd-seigdrift{from{transform:translate3d(0,0,0)}to{transform:translate3d(-60px,0,0)}}
.stbd-redsun{position:absolute;border-radius:50%;background:radial-gradient(circle at 40% 38%,#F0604F,#C8281E 70%);box-shadow:0 0 70px 20px rgba(220,70,50,.25)}
.stbd-peak{position:absolute;bottom:var(--b);left:var(--x);width:var(--w);height:var(--h);clip-path:polygon(0 100%,50% 0,100% 100%);background:linear-gradient(180deg,#F7F2EF 0 14%,#7C86B4 15%,#3C4F7A 100%)}

/* Tím loang: các vệt màu lớn trôi và co giãn rất chậm */
.stbd-blob{position:absolute;width:var(--s);height:var(--s);left:var(--x);top:var(--y);border-radius:50%;opacity:.75;will-change:transform;
 background:radial-gradient(circle,var(--c) 0,transparent 66%);animation:stbd-blob var(--d) ease-in-out var(--dl) infinite alternate}
@keyframes stbd-blob{from{transform:translate3d(-8%,-6%,0) scale(.9)}to{transform:translate3d(10%,8%,0) scale(1.15)}}

/* Pháo hoa, gợn nước, cá koi, núi mực */
.stbd-burst{position:absolute;left:var(--x);top:var(--y);width:var(--s);height:var(--s);margin:calc(var(--s)/-2) 0 0 calc(var(--s)/-2);border-radius:50%;opacity:0;will-change:transform,opacity;
 background:repeating-conic-gradient(var(--c) 0 2.5deg,transparent 2.5deg 12deg);-webkit-mask-image:radial-gradient(circle,transparent 0 16%,#000 18% 60%,transparent 66%);mask-image:radial-gradient(circle,transparent 0 16%,#000 18% 60%,transparent 66%);
 animation:stbd-burst var(--d) ease-out var(--dl) infinite}
@keyframes stbd-burst{0%{transform:scale(.15);opacity:0}12%{opacity:1}70%{opacity:.85}100%{transform:scale(1);opacity:0}}
.stbd-ripple{position:absolute;left:var(--x);top:var(--y);width:var(--s);height:calc(var(--s)*.42);margin:calc(var(--s)*-.21) 0 0 calc(var(--s)/-2);border-radius:50%;border:2px solid rgba(200,255,250,.55);opacity:0;will-change:transform,opacity;animation:stbd-ripple var(--d) ease-out var(--dl) infinite}
@keyframes stbd-ripple{0%{transform:scale(.1);opacity:.9}100%{transform:scale(1);opacity:0}}
.stbd-pad{position:absolute;left:var(--x);top:var(--y);width:var(--s);height:calc(var(--s)*.6);border-radius:50%;background:radial-gradient(ellipse at 40% 40%,#5FC27A,#2B7E4C 70%);clip-path:polygon(0 0,100% 0,100% 100%,0 100%,50% 52%);clip-path:none;opacity:.92;will-change:transform;animation:stbd-bob var(--d) ease-in-out var(--dl) infinite alternate}
@keyframes stbd-bob{from{transform:translate3d(-5px,0,0) rotate(-3deg)}to{transform:translate3d(6px,3px,0) rotate(4deg)}}
.stbd-koi{position:absolute;left:var(--x);top:var(--y);width:var(--w);height:calc(var(--w)*.34);will-change:transform;animation:stbd-swim var(--d) ease-in-out var(--dl) infinite alternate}
.stbd-koi::before{content:"";position:absolute;inset:0;border-radius:60% 40% 40% 60%/50%;background:linear-gradient(90deg,var(--c1),var(--c2));box-shadow:0 4px 10px rgba(0,0,0,.25)}
.stbd-koi::after{content:"";position:absolute;right:-22%;top:12%;width:34%;height:76%;background:linear-gradient(90deg,var(--c1),transparent);clip-path:polygon(0 50%,100% 0,70% 50%,100% 100%)}
@keyframes stbd-swim{from{transform:translate3d(-8vw,0,0) rotate(-6deg)}to{transform:translate3d(10vw,3vh,0) rotate(5deg)}}
.stbd-mtn{position:absolute;left:var(--x);bottom:var(--b);width:var(--w);height:var(--h);clip-path:polygon(0 100%,0 70%,10% 52%,18% 58%,30% 30%,38% 42%,50% 8%,60% 36%,68% 26%,80% 52%,90% 44%,100% 66%,100% 100%);background:linear-gradient(180deg,var(--c1),var(--c2))}

@media (prefers-reduced-motion: reduce){
 .stbd *{animation:none!important}
 .stbd-petal,.stbd-flake,.stbd-fk2{display:none}
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
    case 'sakuranight':
      return (
        <>
          <div className="stbd-moon" style={st({ right: '12%', top: '9%', width: 110, height: 110 })} />
          <div className="stbd-fill" style={st({ background: 'radial-gradient(70% 34% at 50% 112%, rgba(255,150,190,0.38), transparent 70%)' })} />
          {[10, 28, 52, 74, 90].map((x, i) =>
            h('div', { key: `l${i}`, className: 'stbd-lant', style: st({ '--x': `${x}%`, '--w': `${30 + (i % 3) * 8}px`, '--len': `${40 + ((i * 37) % 90)}px`, '--d': `${5 + (i % 3)}s`, '--dl': `${-i * 1.1}s`, '--c1': '#FFD08A', '--c2': '#E8622F', '--glow': 'rgba(255,160,80,.4)' }) }),
          )}
          {[...PETALS, ...PETALS.slice(0, 8).map((p, i) => ({ ...p, x: `${(i * 12 + 6) % 100}%`, dl: `${-(i * 1.7 + 0.8).toFixed(1)}s` }))].map((p, i) =>
            h('div', { key: i, className: 'stbd-petal', style: st({ '--x': p.x, '--s': `${p.s}px`, '--d': p.d, '--dl': p.dl, '--c1': '#FFEAF1', '--c2': '#F59BBB' }) }),
          )}
        </>
      );
    case 'snowfall':
      return (
        <>
          <div className="stbd-hill" style={st({ bottom: '-14%', height: '34%', background: 'linear-gradient(180deg,#FFFFFF,#E6F0FA)' })} />
          <div className="stbd-hill" style={st({ bottom: '-20%', left: '-30%', width: '90%', height: '34%', background: 'linear-gradient(180deg,#FFFFFF,#DCE9F7)' })} />
          {PETALS.map((p, i) => h('div', { key: i, className: 'stbd-fk2', style: st({ '--x': p.x, '--s': `${10 + (p.s % 12)}px`, '--d': `${10 + (i % 7) * 1.4}s`, '--dl': p.dl }) }))}
          {PETALS.slice(0, 9).map((p, i) => h('div', { key: `b${i}`, className: 'stbd-fk2', style: st({ '--x': `${(i * 11 + 4) % 100}%`, '--s': `${5 + (i % 4)}px`, '--d': `${7 + (i % 5)}s`, '--dl': `${-(i * 1.3).toFixed(1)}s`, opacity: 0.7 }) }))}
        </>
      );
    case 'noel':
      return (
        <>
          {[5, 15, 25, 35, 45, 55, 65, 75, 85, 95].map((x, i) =>
            h('div', { key: `g${i}`, className: 'stbd-bulb', style: st({ '--x': `${x}%`, '--y': `${1.5 + (i % 2) * 2}%`, '--s': '9px', '--c': ['#FF4D5E', '#FFD65A', '#5CE08A', '#6CC8FF', '#FF9E4D'][i % 5]!, '--d': `${2.4 + (i % 3) * 0.7}s`, '--dl': `${-i * 0.5}s` }) }),
          )}
          {[8, 44, 78].map((x, i) =>
            h('div', { key: `t${i}`, className: 'stbd-tree', style: st({ '--x': `${x}%`, '--w': `${i === 1 ? 150 : 110}px` }) },
              h('i', { style: st({ top: '0%', width: '48%', height: '36%' }) }),
              h('i', { style: st({ top: '24%', width: '70%', height: '40%' }) }),
              h('i', { style: st({ top: '48%', width: '96%', height: '48%' }) }),
            ),
          )}
          {[[14, 70], [47, 62], [82, 74], [20, 82], [50, 84], [86, 84]].map(([x, y], i) =>
            h('div', { key: `o${i}`, className: 'stbd-bulb', style: st({ '--x': `${x}%`, '--y': `${y}%`, '--s': '7px', '--c': ['#FFD65A', '#FF4D5E', '#FFFFFF'][i % 3]!, '--d': `${2 + (i % 3)}s`, '--dl': `${-i * 0.7}s` }) }),
          )}
          {PETALS.map((p, i) => h('div', { key: i, className: 'stbd-fk2', style: st({ '--x': p.x, '--s': `${6 + (p.s % 8)}px`, '--d': `${9 + (i % 6)}s`, '--dl': p.dl }) }))}
        </>
      );
    case 'europe':
      return (
        <>
          <div className="stbd-moon" style={st({ left: '14%', top: '10%', width: 90, height: 90 })} />
          {BRIGHT.map(([x, y], i) => h('div', { key: i, className: 'stbd-bright', style: st({ left: `${x}%`, top: `${(y ?? 0) % 40}%`, animationDelay: `${-i * 0.9}s` }) }))}
          <div className="stbd-skyline" style={st({ height: '34%', background: 'linear-gradient(180deg,#4B3A78,#2A2160)', opacity: 0.8, clipPath: 'polygon(0 100%,0 62%,3% 62%,3% 48%,5% 30%,7% 48%,7% 60%,13% 60%,13% 52%,17% 52%,17% 36%,19% 14%,21% 36%,21% 52%,27% 52%,27% 66%,34% 66%,34% 44%,36% 44%,36% 58%,43% 58%,43% 68%,50% 68%,50% 50%,52% 12%,54% 50%,54% 68%,60% 68%,60% 58%,66% 58%,66% 40%,68% 20%,70% 40%,70% 58%,76% 58%,76% 70%,83% 70%,83% 50%,86% 50%,86% 62%,92% 62%,92% 44%,94% 32%,96% 44%,96% 66%,100% 66%,100% 100%)' })} />
          <div className="stbd-skyline" style={st({ height: '22%', background: 'linear-gradient(180deg,#1B1642,#0E0B2B)', clipPath: 'polygon(0 100%,0 56%,6% 56%,6% 38%,10% 38%,10% 56%,18% 56%,18% 44%,26% 44%,26% 62%,34% 62%,34% 30%,38% 30%,38% 62%,47% 62%,47% 48%,56% 48%,56% 60%,64% 60%,64% 34%,70% 34%,70% 56%,78% 56%,78% 42%,86% 42%,86% 58%,94% 58%,94% 46%,100% 46%,100% 100%)' })} />
          {Array.from({ length: 18 }, (_, i) => h('div', { key: `w${i}`, className: 'stbd-win', style: st({ '--x': `${(i * 5.6 + 4) % 96}%`, '--y': `${80 + ((i * 7) % 16)}%`, '--d': `${3 + (i % 4)}s`, '--dl': `${-i * 0.6}s` }) }))}
          {[[18, 30], [60, 22], [82, 44], [36, 52], [70, 64]].map(([x, y], i) =>
            h('div', { key: `s${i}`, className: 'stbd-spark', style: st({ '--x': `${x}%`, '--y': `${y}%`, '--s': `${14 + (i % 3) * 6}px`, '--d': `${3.5 + (i % 3)}s`, '--dl': `${-i * 0.9}s` }) }),
          )}
        </>
      );
    case 'lantern':
      return (
        <>
          <div className="stbd-fill" style={st({ background: 'radial-gradient(50% 40% at 50% 108%, rgba(255,150,60,0.35), transparent 70%)' })} />
          {h('div', { className: 'stbd-drift', style: st({ top: '58%', height: '16%', '--d': '44s', background: 'radial-gradient(60% 50% at 40% 50%, rgba(255,196,90,0.22), transparent 70%)' }) })}
          {h('div', { className: 'stbd-drift', style: st({ top: '30%', height: '14%', '--d': '56s', '--dl': '-20s', background: 'radial-gradient(60% 50% at 60% 50%, rgba(255,196,90,0.16), transparent 70%)' }) })}
          {[4, 16, 30, 44, 58, 72, 84, 94].map((x, i) =>
            h('div', { key: i, className: 'stbd-lant', style: st({ '--x': `${x}%`, '--w': `${38 + (i % 3) * 14}px`, '--len': `${30 + ((i * 53) % 150)}px`, '--d': `${4.5 + (i % 4)}s`, '--dl': `${-i * 0.9}s` }) }),
          )}
          {[[22, 56], [48, 72], [68, 50], [88, 66], [10, 76]].map(([x, y], i) =>
            h('div', { key: `s${i}`, className: 'stbd-spark', style: st({ '--x': `${x}%`, '--y': `${y}%`, '--s': `${12 + (i % 3) * 5}px`, '--d': `${3 + (i % 3)}s`, '--dl': `${-i * 0.8}s` }) }),
          )}
        </>
      );
    case 'seigaiha':
      return (
        <>
          <div className="stbd-redsun" style={st({ right: '14%', top: '14%', width: 130, height: 130 })} />
          {h('div', { className: 'stbd-drift', style: st({ top: '24%', height: '8%', '--d': '48s', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.7),transparent)', borderRadius: 999 }) })}
          {h('div', { className: 'stbd-seig', style: st({ height: '30%', '--b': '#27457A', '--l': 'rgba(255,255,255,0.28)' }) })}
          {h('div', { className: 'stbd-seig', style: st({ height: '16%', '--b': '#1B3560', '--l': 'rgba(255,255,255,0.22)', animationDuration: '18s' }) })}
          {PETALS.slice(0, 9).map((p, i) => h('div', { key: i, className: 'stbd-petal', style: st({ '--x': p.x, '--s': `${p.s}px`, '--d': p.d, '--dl': p.dl, '--c1': '#F8B04A', '--c2': '#CC3A22', borderRadius: '50% 0 50% 50%' }) }))}
        </>
      );
    case 'fuji':
      return (
        <>
          <div className="stbd-redsun" style={st({ left: '58%', top: '26%', width: 96, height: 96, background: 'radial-gradient(circle at 40% 38%,#FFE2B8,#FBA46C 75%)', boxShadow: '0 0 80px 26px rgba(255,170,110,0.35)' })} />
          {h('div', { className: 'stbd-drift', style: st({ top: '30%', height: '8%', '--d': '50s', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.75),transparent)', borderRadius: 999 }) })}
          {h('div', { className: 'stbd-peak', style: st({ '--b': '14%', '--x': '-6%', '--w': '46%', '--h': '30%', opacity: 0.8 }) })}
          {h('div', { className: 'stbd-peak', style: st({ '--b': '10%', '--x': '26%', '--w': '56%', '--h': '48%' }) })}
          {h('div', { className: 'stbd-peak', style: st({ '--b': '12%', '--x': '70%', '--w': '40%', '--h': '26%', opacity: 0.85 }) })}
          <div className="stbd-fill" style={st({ top: '84%', background: 'linear-gradient(180deg,#3A4B78,#26335A)' })} />
          {h('div', { className: 'stbd-drift', style: st({ top: '70%', height: '12%', '--d': '36s', '--dl': '-8s', background: 'radial-gradient(60% 50% at 50% 50%, rgba(255,255,255,0.7), transparent 70%)' }) })}
          {PETALS.slice(0, 10).map((p, i) => h('div', { key: i, className: 'stbd-petal', style: st({ '--x': p.x, '--s': `${p.s}px`, '--d': p.d, '--dl': p.dl }) }))}
        </>
      );
    case 'bling':
      return (
        <>
          <div className="stbd-fill" style={st({ background: 'radial-gradient(60% 40% at 50% -6%, rgba(255,210,110,0.22), transparent 70%), radial-gradient(50% 36% at 50% 112%, rgba(255,190,80,0.18), transparent 70%)' })} />
          <div className="stbd-shimmer" />
          {[[8, 12], [20, 38], [33, 16], [46, 56], [58, 8], [70, 34], [83, 18], [92, 52], [14, 70], [38, 82], [62, 74], [86, 86], [28, 58], [76, 62]].map(([x, y], i) =>
            h('div', { key: i, className: 'stbd-spark', style: st({ '--x': `${x}%`, '--y': `${y}%`, '--s': `${10 + (i % 4) * 7}px`, '--d': `${2.8 + (i % 5) * 0.8}s`, '--dl': `${-i * 0.55}s` }) }),
          )}
        </>
      );
    case 'inkwash':
      return (
        <>
          <div className="stbd-redsun" style={st({ right: '16%', top: '12%', width: 84, height: 84, boxShadow: 'none', background: 'radial-gradient(circle at 40% 38%,#C8453A,#9E2B22 75%)' })} />
          {h('div', { className: 'stbd-mtn', style: st({ '--x': '-6%', '--b': '30%', '--w': '62%', '--h': '36%', '--c1': 'rgba(150,160,160,0.45)', '--c2': 'rgba(190,196,190,0.2)' }) })}
          {h('div', { className: 'stbd-mtn', style: st({ '--x': '38%', '--b': '26%', '--w': '70%', '--h': '44%', '--c1': 'rgba(120,132,134,0.55)', '--c2': 'rgba(190,196,190,0.25)' }) })}
          {h('div', { className: 'stbd-drift', style: st({ top: '52%', height: '16%', '--d': '40s', background: 'radial-gradient(60% 50% at 40% 50%, rgba(250,248,240,0.95), transparent 72%)' }) })}
          {h('div', { className: 'stbd-mtn', style: st({ '--x': '-10%', '--b': '-2%', '--w': '70%', '--h': '42%', '--c1': 'rgba(70,82,86,0.8)', '--c2': 'rgba(90,102,106,0.5)' }) })}
          {h('div', { className: 'stbd-mtn', style: st({ '--x': '44%', '--b': '-4%', '--w': '72%', '--h': '32%', '--c1': 'rgba(50,62,66,0.85)', '--c2': 'rgba(80,92,96,0.5)' }) })}
          {h('div', { className: 'stbd-drift', style: st({ top: '70%', height: '14%', '--d': '52s', '--dl': '-14s', background: 'radial-gradient(60% 50% at 60% 50%, rgba(250,248,240,0.85), transparent 72%)' }) })}
        </>
      );
    case 'maple':
      return (
        <>
          <div className="stbd-fill" style={st({ background: 'radial-gradient(40% 30% at 82% 6%, rgba(255,236,190,0.85), transparent 70%)' })} />
          {[...PETALS, ...PETALS.slice(0, 6).map((p, i) => ({ ...p, x: `${(i * 17 + 9) % 100}%`, dl: `${-(i * 1.9 + 1).toFixed(1)}s` }))].map((p, i) =>
            h('div', { key: i, className: 'stbd-petal', style: st({ '--x': p.x, '--s': `${p.s + 8}px`, '--d': p.d, '--dl': p.dl, '--c1': i % 2 ? '#F6A23C' : '#E5532C', '--c2': i % 3 ? '#C2321C' : '#9E2412', borderRadius: '50% 0 50% 50%' }) }),
          )}
        </>
      );
    case 'hanabi':
      return (
        <>
          {BRIGHT.map(([x, y], i) => h('div', { key: i, className: 'stbd-bright', style: st({ left: `${x}%`, top: `${(y ?? 0) % 45}%`, animationDelay: `${-i * 0.9}s` }) }))}
          {[
            ['#FF6FB0', 26, 34, 300, 6.5, 0], ['#FFD65A', 72, 28, 260, 7.5, -2.4], ['#6CD8FF', 50, 52, 220, 6, -4.2], ['#9BFF8C', 84, 58, 200, 8, -1.2], ['#FFA45C', 14, 60, 210, 7, -5.4],
          ].map(([c, x, y, s, d, dl], i) => h('div', { key: i, className: 'stbd-burst', style: st({ '--c': c as string, '--x': `${x}%`, '--y': `${y}%`, '--s': `${s}px`, '--d': `${d}s`, '--dl': `${dl}s` }) }))}
          <div className="stbd-skyline" style={st({ height: '12%', background: '#05071A', clipPath: 'polygon(0 100%,0 60%,8% 60%,8% 30%,12% 30%,12% 60%,22% 60%,22% 44%,30% 44%,30% 66%,44% 66%,44% 40%,50% 20%,56% 40%,56% 66%,70% 66%,70% 50%,80% 50%,80% 30%,86% 30%,86% 60%,100% 60%,100% 100%)' })} />
        </>
      );
    case 'koi':
      return (
        <>
          {[[22, 30, 220, 9, 0], [70, 56, 280, 11, -4], [44, 78, 200, 8, -7]].map(([x, y, s, d, dl], i) =>
            h('div', { key: `r${i}`, className: 'stbd-ripple', style: st({ '--x': `${x}%`, '--y': `${y}%`, '--s': `${s}px`, '--d': `${d}s`, '--dl': `${dl}s` }) }),
          )}
          {h('div', { className: 'stbd-koi', style: st({ '--x': '16%', '--y': '34%', '--w': '120px', '--d': '17s', '--c1': '#FF7A3C', '--c2': '#FFD0A8' }) })}
          {h('div', { className: 'stbd-koi', style: st({ '--x': '56%', '--y': '60%', '--w': '150px', '--d': '21s', '--dl': '-6s', '--c1': '#F4F4F0', '--c2': '#F26B3A' }) })}
          {h('div', { className: 'stbd-koi', style: st({ '--x': '36%', '--y': '14%', '--w': '96px', '--d': '15s', '--dl': '-9s', '--c1': '#FFB02E', '--c2': '#FFF0C8' }) })}
          {[[12, 66, 90], [80, 22, 110], [64, 84, 76], [30, 52, 64]].map(([x, y, s], i) =>
            h('div', { key: `p${i}`, className: 'stbd-pad', style: st({ '--x': `${x}%`, '--y': `${y}%`, '--s': `${s}px`, '--d': `${6 + i}s`, '--dl': `${-i * 1.3}s` }) }),
          )}
          {PETALS.slice(0, 10).map((p, i) => h('div', { key: i, className: 'stbd-petal', style: st({ '--x': p.x, '--s': `${p.s - 2}px`, '--d': p.d, '--dl': p.dl }) }))}
        </>
      );
    case 'swirl':
      return (
        <>
          {[
            ['#FF4FA3', '-10%', '-14%', '70vmax', '19s', '0s'],
            ['#FFB23F', '48%', '-18%', '58vmax', '23s', '-6s'],
            ['#1FC8E8', '30%', '46%', '66vmax', '21s', '-3s'],
            ['#8E5CF6', '-16%', '40%', '64vmax', '25s', '-10s'],
            ['#7CFF9B', '64%', '58%', '40vmax', '28s', '-14s'],
          ].map(([c, x, y, s, d, dl], i) => h('div', { key: i, className: 'stbd-blob', style: st({ '--c': c!, '--x': x!, '--y': y!, '--s': s!, '--d': d!, '--dl': dl! }) }))}
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
