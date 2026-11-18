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
.stbd-rise{position:absolute;bottom:-6%;left:var(--x);width:var(--s);height:var(--s);border-radius:50%;border:1.5px solid rgba(200,250,255,.6);background:radial-gradient(circle at 30% 30%,rgba(255,255,255,.5),rgba(255,255,255,.05) 60%);will-change:transform,opacity;animation:stbd-rise var(--d) ease-in var(--dl) infinite}
@keyframes stbd-rise{0%{transform:translate3d(0,0,0);opacity:0}12%{opacity:.9}100%{transform:translate3d(14px,-108vh,0);opacity:0}}
.stbd-fly{position:absolute;left:var(--x);top:var(--y);width:var(--s);height:var(--s);border-radius:50%;background:#F4FF9A;box-shadow:0 0 14px 5px rgba(220,255,120,.7);opacity:0;will-change:transform,opacity;animation:stbd-fly var(--d) ease-in-out var(--dl) infinite}
@keyframes stbd-fly{0%{transform:translate3d(0,0,0);opacity:0}20%{opacity:1}50%{transform:translate3d(30px,-22px,0);opacity:.35}80%{opacity:1}100%{transform:translate3d(-14px,-46px,0);opacity:0}}
.stbd-dune{position:absolute;left:-10%;width:130%;border-radius:50% 50% 0 0/100% 100% 0 0}
.stbd-torii{position:absolute;left:var(--x);bottom:var(--b);width:var(--w);height:calc(var(--w)*.8)}
.stbd-torii i{position:absolute;background:#B3261E}
.stbd-torii i:nth-child(1){left:12%;top:18%;width:8%;bottom:0}
.stbd-torii i:nth-child(2){right:12%;top:18%;width:8%;bottom:0}
.stbd-torii i:nth-child(3){left:0;right:0;top:6%;height:11%;border-radius:2px 2px 40% 40%/2px 2px 100% 100%;background:#8E1B15}
.stbd-torii i:nth-child(4){left:8%;right:8%;top:28%;height:7%}

.stbd-bird{position:absolute;left:-6%;top:var(--y);width:calc(20px*var(--sc,1));height:calc(8px*var(--sc,1));will-change:transform;animation:stbd-fly2 var(--d) linear var(--dl) infinite}
.stbd-bird::before,.stbd-bird::after{content:"";position:absolute;top:2px;width:52%;height:2px;border-radius:2px;background:var(--bc,rgba(40,30,60,.6))}
.stbd-bird::before{left:0;transform:rotate(26deg)}
.stbd-bird::after{right:0;transform:rotate(-26deg)}
@keyframes stbd-fly2{from{transform:translate3d(0,0,0)}to{transform:translate3d(115vw,-7vh,0)}}
.stbd-pine{position:absolute;left:var(--x);bottom:var(--b,0%);width:var(--w);height:calc(var(--w)*2.1);background:var(--c);clip-path:polygon(50% 0,63% 22%,56% 22%,72% 46%,60% 46%,82% 72%,54% 72%,54% 100%,46% 100%,46% 72%,18% 72%,40% 46%,28% 46%,44% 22%,37% 22%)}
.stbd-gem{position:absolute;left:var(--x);top:var(--y);width:var(--s);height:calc(var(--s)*.85);clip-path:polygon(22% 0,78% 0,100% 34%,50% 100%,0 34%);background:linear-gradient(135deg,var(--c1),var(--c2) 55%,var(--c1));will-change:transform;animation:stbd-bob var(--d) ease-in-out var(--dl) infinite alternate}
.stbd-branch{position:absolute;left:var(--x);top:var(--y);width:var(--w);height:7px;background:linear-gradient(90deg,#2A1020,#5A3446);border-radius:6px;transform:rotate(var(--r));transform-origin:0 50%}
.stbd-rays{position:absolute;left:var(--x);top:var(--y);width:var(--s);height:var(--s);margin:calc(var(--s)/-2) 0 0 calc(var(--s)/-2);border-radius:50%;background:repeating-conic-gradient(from 0deg,var(--c) 0 5deg,transparent 5deg 14deg);-webkit-mask-image:radial-gradient(circle,#000 0,transparent 68%);mask-image:radial-gradient(circle,#000 0,transparent 68%);will-change:transform;animation:stbd-spin 120s linear infinite}
@keyframes stbd-spin{to{transform:rotate(360deg)}}
.stbd-jelly{position:absolute;left:var(--x);bottom:-14%;width:var(--s);height:calc(var(--s)*1.5);will-change:transform;animation:stbd-jelly var(--d) ease-in-out var(--dl) infinite}
.stbd-jelly::before{content:"";position:absolute;left:0;right:0;top:0;height:55%;border-radius:50% 50% 30% 30%/90% 90% 20% 20%;background:radial-gradient(ellipse at 50% 30%,rgba(255,255,255,.55),var(--c) 70%);box-shadow:0 0 24px 6px var(--c);opacity:.8}
.stbd-jelly::after{content:"";position:absolute;left:12%;right:12%;top:50%;bottom:0;background:repeating-linear-gradient(90deg,var(--c) 0 3px,transparent 3px 9px);opacity:.55;-webkit-mask-image:linear-gradient(#000,transparent);mask-image:linear-gradient(#000,transparent)}
@keyframes stbd-jelly{0%{transform:translate3d(0,0,0)}50%{transform:translate3d(18px,-62vh,0)}100%{transform:translate3d(-10px,-135vh,0)}}
.stbd-ray{position:absolute;top:-10%;left:var(--x);width:var(--w);height:90%;background:linear-gradient(180deg,rgba(170,240,255,.3),transparent);transform:skewX(-18deg);transform-origin:50% 0;will-change:opacity;animation:stbd-breathe 9s ease-in-out var(--dl,0s) infinite}
.stbd-shroom{position:absolute;left:var(--x);bottom:var(--b);width:var(--s);height:var(--s);will-change:opacity;animation:stbd-tw var(--d) ease-in-out var(--dl) infinite}
.stbd-shroom::before{content:"";position:absolute;left:0;right:0;top:0;height:60%;border-radius:50% 50% 8% 8%/100% 100% 10% 10%;background:var(--c);box-shadow:0 0 18px 5px var(--c)}
.stbd-shroom::after{content:"";position:absolute;left:38%;right:38%;top:55%;bottom:0;background:linear-gradient(#E6FFFF,#8AC8E8);border-radius:3px}
.stbd-lotus{position:absolute;left:var(--x);top:var(--y);width:var(--s);height:calc(var(--s)*.55);border-radius:50% 50% 50% 50%/100% 100% 0 0;background:radial-gradient(ellipse at 50% 100%,#FFF6C8 0 12%,#FFC2DA 13% 50%,#F0709F 100%);box-shadow:0 0 14px rgba(255,150,190,.5);will-change:transform;animation:stbd-bob var(--d) ease-in-out var(--dl) infinite alternate}
.stbd-pyr{position:absolute;bottom:var(--b);left:var(--x);width:var(--w);height:var(--h);clip-path:polygon(0 100%,50% 0,100% 100%);background:linear-gradient(100deg,#F4CD8C 0 50%,#CC9250 50% 100%)}
.stbd-lamp{position:absolute;left:var(--x);bottom:0;width:4px;height:var(--h);background:#1B1536}
.stbd-lamp::after{content:"";position:absolute;left:50%;top:-6px;width:12px;height:12px;margin-left:-6px;border-radius:50%;background:#FFE2A0;box-shadow:0 0 18px 8px rgba(255,200,110,.55)}
.stbd-balloon{position:absolute;bottom:-16%;left:var(--x);width:var(--s);height:calc(var(--s)*1.18);border-radius:50% 50% 46% 46%;background:radial-gradient(circle at 35% 30%,rgba(255,255,255,.8),var(--c) 55%);will-change:transform;animation:stbd-rise2 var(--d) linear var(--dl) infinite}
.stbd-balloon::after{content:"";position:absolute;left:50%;top:100%;width:1.5px;height:calc(var(--s)*.8);background:rgba(120,120,140,.5)}
@keyframes stbd-rise2{from{transform:translate3d(0,0,0)}to{transform:translate3d(30px,-128vh,0)}}
.stbd-donut{position:absolute;left:var(--x);top:var(--y);width:var(--s);height:var(--s);border-radius:50%;border:calc(var(--s)*.28) solid var(--c);box-shadow:inset 0 0 0 2px rgba(255,255,255,.5);will-change:transform;animation:stbd-bob var(--d) ease-in-out var(--dl) infinite alternate}
.stbd-mleaf{clip-path:polygon(50% 0,58% 20%,75% 8%,70% 35%,98% 30%,80% 52%,92% 64%,60% 62%,56% 100%,44% 100%,40% 62%,8% 64%,20% 52%,2% 30%,30% 35%,25% 8%,42% 20%);border-radius:0!important;height:var(--s)!important}
.stbd-pagoda{position:absolute;left:var(--x);bottom:var(--b,0%);width:var(--w);height:calc(var(--w)*1.4);background:var(--c);clip-path:polygon(50% 0,54% 8%,78% 22%,64% 24%,66% 34%,88% 48%,68% 50%,70% 62%,96% 78%,72% 80%,72% 100%,28% 100%,28% 80%,4% 78%,30% 62%,32% 50%,12% 48%,34% 34%,36% 24%,22% 22%,46% 8%)}
.stbd-env{position:absolute;top:-8%;left:var(--x);width:var(--s);height:calc(var(--s)*1.5);border-radius:4px;background:linear-gradient(180deg,#E0302A,#B3201A);box-shadow:inset 0 0 0 2px #FFD65A;will-change:transform;animation:stbd-snow var(--d) linear var(--dl) infinite}
.stbd-env::after{content:"";position:absolute;left:50%;top:36%;width:40%;aspect-ratio:1;margin-left:-20%;border-radius:50%;background:#FFD65A}
.stbd-fk2{box-shadow:0 0 5px rgba(110,160,225,.5)}

.stbd-neon{position:absolute;left:var(--x);top:var(--y);width:var(--w);height:var(--h);border-bottom:3px solid var(--c);border-radius:0 0 50% 50%/0 0 100% 100%;box-shadow:0 6px 10px -2px var(--c),0 12px 26px -6px var(--c);opacity:.95;will-change:opacity;animation:stbd-tw 3.4s ease-in-out var(--dl,0s) infinite}
.stbd-ring{border:3px solid var(--c);border-radius:50%;box-shadow:0 0 10px var(--c),0 0 26px var(--c),inset 0 0 12px var(--c)}

@media (prefers-reduced-motion: reduce){
 .stbd *{animation:none!important}
 .stbd-petal,.stbd-flake,.stbd-fk2,.stbd-rise,.stbd-fly,.stbd-bird,.stbd-balloon,.stbd-env,.stbd-jelly{display:none}
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
  const birds = (list: number[][], bc = 'rgba(40,30,60,.6)') => list.map(([y, d, dl, sc], i) => h('div', { key: `bd${i}`, className: 'stbd-bird', style: st({ '--y': `${y}%`, '--d': `${d}s`, '--dl': `${dl}s`, '--sc': sc as number, '--bc': bc }) }));
  const topStars = (n: number) => Array.from({ length: n }, (_, i) => h('div', { key: `ts${i}`, className: 'stbd-bright', style: st({ left: `${(i * 37 + 11) % 97}%`, top: `${(i * 23 + 5) % 46}%`, animationDelay: `${-i * 0.7}s` }) }));
  const pinesOf = (list: (string | number)[][]) => list.map(([x, w, c, b], i) => h('div', { key: `pn${i}`, className: 'stbd-pine', style: st({ '--x': `${x}%`, '--w': `${w}px`, '--c': c as string, '--b': `${b ?? 0}%` }) }));
  const bursts = (list: (string | number)[][]) => list.map(([c, x, y, sz, d, dl], i) => h('div', { key: `bu${i}`, className: 'stbd-burst', style: st({ '--c': c as string, '--x': `${x}%`, '--y': `${y}%`, '--s': `${sz}px`, '--d': `${d}s`, '--dl': `${dl}s` }) }));
  const gems = (list: (string | number)[][]) => list.map(([x, y, sz, c1, c2, d, dl], i) => h('div', { key: `gm${i}`, className: 'stbd-gem', style: st({ '--x': `${x}%`, '--y': `${y}%`, '--s': `${sz}px`, '--c1': c1 as string, '--c2': c2 as string, '--d': `${d}s`, '--dl': `${dl}s` }) }));
  const balloons = (list: (string | number)[][]) => list.map(([c, x, sz, d, dl], i) => h('div', { key: `bl${i}`, className: 'stbd-balloon', style: st({ '--c': c as string, '--x': `${x}%`, '--s': `${sz}px`, '--d': `${d}s`, '--dl': `${dl}s` }) }));
  const rays = (x: number, y: number, sz: number, c: string) => h('div', { key: 'rays', className: 'stbd-rays', style: st({ '--x': `${x}%`, '--y': `${y}%`, '--s': `${sz}px`, '--c': c }) });
  const branch = (key: string, x0: number, y0: number, wv: number, r: number, cols: string[], n = 9) => {
    const rad = (r * Math.PI) / 180;
    return [
      h('div', { key: `${key}b`, className: 'stbd-branch', style: st({ '--x': `${x0}%`, '--y': `${y0}%`, '--w': `${wv}vw`, '--r': `${r}deg` }) }),
      ...Array.from({ length: n }, (_, i) => {
        const t = (i + 1) / (n + 1);
        const jit = ((i * 53) % 9) - 4;
        return h('div', { key: `${key}${i}`, className: 'stbd-bulb', style: st({ '--x': `calc(${x0}% + ${(Math.cos(rad) * wv * t).toFixed(2)}vw)`, '--y': `calc(${y0}% + ${(Math.sin(rad) * wv * t + jit * 0.25).toFixed(2)}vw)`, '--s': `${12 + (i % 3) * 5}px`, '--c': cols[i % cols.length]!, '--d': `${3 + (i % 4)}s`, '--dl': `${-i * 0.6}s` }) });
      }),
    ];
  };
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
          {topStars(14)}
          <div className="stbd-moon" style={st({ right: '12%', top: '9%', width: 110, height: 110 })} />
          <div className="stbd-fill" style={st({ background: 'radial-gradient(70% 34% at 50% 112%, rgba(255,150,190,0.38), transparent 70%)' })} />
          {[10, 28, 52, 74, 90].map((x, i) =>
            h('div', { key: `l${i}`, className: 'stbd-lant', style: st({ '--x': `${x}%`, '--w': `${30 + (i % 3) * 8}px`, '--len': `${40 + ((i * 37) % 90)}px`, '--d': `${5 + (i % 3)}s`, '--dl': `${-i * 1.1}s`, '--c1': '#FFD08A', '--c2': '#E8622F', '--glow': 'rgba(255,160,80,.4)' }) }),
          )}
          {[...PETALS, ...PETALS.slice(0, 8).map((p, i) => ({ ...p, x: `${(i * 12 + 6) % 100}%`, dl: `${-(i * 1.7 + 0.8).toFixed(1)}s` }))].map((p, i) =>
            h('div', { key: i, className: 'stbd-petal', style: st({ '--x': p.x, '--s': `${p.s}px`, '--d': p.d, '--dl': p.dl, '--c1': '#FFEAF1', '--c2': '#F59BBB' }) }),
          )}
          {branch('bl', -2, -4, 38, 14, ['#FFD7E6', '#FF9EC2', '#FFEAF2'], 10)}
          {branch('br', 102, -2, 34, 166, ['#FFD7E6', '#FF9EC2', '#FFEAF2'], 9)}
          {h('div', { className: 'stbd-pagoda', style: st({ '--x': '82%', '--w': '150px', '--b': '-3%', '--c': '#12082A', opacity: 0.9 }) })}
          {h('div', { className: 'stbd-pagoda', style: st({ '--x': '4%', '--w': '90px', '--b': '-3%', '--c': '#1A0C34', opacity: 0.8 }) })}
          {h('div', { className: 'stbd-drift', style: st({ top: '76%', height: '12%', '--d': '40s', background: 'radial-gradient(60% 50% at 50% 50%, rgba(255,170,205,0.25), transparent 70%)' }) })}
        </>
      );
    case 'snowfall':
      return (
        <>
          {pinesOf([[6, 90, '#2B4A66', 12], [15, 58, '#35587A', 13], [79, 110, '#2B4A66', 12], [91, 64, '#35587A', 13]])}
          <div className="stbd-hill" style={st({ bottom: '-14%', height: '34%', background: 'linear-gradient(180deg,#FFFFFF,#E6F0FA)' })} />
          <div className="stbd-hill" style={st({ bottom: '-20%', left: '-30%', width: '90%', height: '34%', background: 'linear-gradient(180deg,#FFFFFF,#DCE9F7)' })} />
          {PETALS.map((p, i) => h('div', { key: i, className: 'stbd-fk2', style: st({ '--x': p.x, '--s': `${10 + (p.s % 12)}px`, '--d': `${10 + (i % 7) * 1.4}s`, '--dl': p.dl }) }))}
          {PETALS.slice(0, 9).map((p, i) => h('div', { key: `b${i}`, className: 'stbd-fk2', style: st({ '--x': `${(i * 11 + 4) % 100}%`, '--s': `${5 + (i % 4)}px`, '--d': `${7 + (i % 5)}s`, '--dl': `${-(i * 1.3).toFixed(1)}s`, opacity: 0.7 }) }))}
          <div style={st({ position: 'absolute', left: '86%', bottom: '11%', width: 56, height: 56, borderRadius: '50%', background: '#fff', boxShadow: '0 0 0 2px rgba(110,160,225,.45)' })} />
          <div style={st({ position: 'absolute', left: 'calc(86% + 8px)', bottom: 'calc(11% + 50px)', width: 40, height: 40, borderRadius: '50%', background: '#fff', boxShadow: '0 0 0 2px rgba(110,160,225,.45)' })} />
          <div style={st({ position: 'absolute', left: 'calc(86% + 20px)', bottom: 'calc(11% + 70px)', width: 14, height: 5, background: '#F28A2E', borderRadius: 3 })} />
          {h('div', { className: 'stbd-drift', style: st({ top: '14%', height: '10%', '--d': '46s', background: 'radial-gradient(60% 50% at 50% 50%, rgba(255,255,255,0.8), transparent 70%)' }) })}
          {Array.from({ length: 10 }, (_, i) => h('div', { key: `ic${i}`, className: 'stbd-spark', style: st({ '--x': `${(i * 19 + 7) % 96}%`, '--y': `${(i * 29 + 6) % 70}%`, '--s': `${10 + (i % 3) * 5}px`, '--d': `${3 + (i % 4)}s`, '--dl': `${-i * 0.7}s`, background: '#9CC6F0' }) }))}
        </>
      );
    case 'noel':
      return (
        <>
          <div className="stbd-fill" style={st({ background: 'radial-gradient(60% 40% at 50% 112%, rgba(255,255,255,0.22), transparent 70%), radial-gradient(50% 30% at 18% 0%, rgba(92,224,138,0.16), transparent 70%), radial-gradient(50% 30% at 84% 0%, rgba(255,77,94,0.16), transparent 70%)' })} />
          {[[3, 4, 44, '#FF3D6E', 0], [28, 3, 44, '#35F0FF', -0.9], [53, 4, 44, '#FFE14D', -1.8], [78, 3, 44, '#5CFF9A', -2.7]].map(([x, y, w, c, dl], i) =>
            h('div', { key: `n${i}`, className: 'stbd-neon', style: st({ '--x': `${x}%`, '--y': `${y}%`, '--w': `${w}%`, '--h': '9%', '--c': c as string, '--dl': `${dl}s` }) }),
          )}
          {Array.from({ length: 36 }, (_, i) => {
            const seg = Math.floor(i / 9);
            const t = (i % 9) / 8;
            return h('div', { key: `g${i}`, className: 'stbd-bulb', style: st({ '--x': `${3 + seg * 25 + t * 44}%`, '--y': `${4 + Math.sin(t * Math.PI) * 9}%`, '--s': '8px', '--c': ['#FF3D6E', '#35F0FF', '#FFE14D', '#5CFF9A', '#B66BFF'][(i + seg) % 5]!, '--d': `${1.6 + (i % 4) * 0.5}s`, '--dl': `${-i * 0.35}s` }) });
          })}
          {[[12, 30], [88, 26]].map(([x, y], i) =>
            h('div', { key: `r${i}`, className: 'stbd-neon stbd-ring', style: st({ '--x': `${x}%`, '--y': `${y}%`, '--w': '84px', '--h': '84px', '--c': i ? '#FF3D6E' : '#5CFF9A', '--dl': `${-i * 1.3}s` }) }),
          )}
          <div className="stbd-hill" style={st({ bottom: '-12%', height: '30%', background: 'linear-gradient(180deg,#FFFFFF,#DCE9F7)' })} />
          <div className="stbd-hill" style={st({ bottom: '-20%', left: '-35%', width: '95%', height: '30%', background: 'linear-gradient(180deg,#FFFFFF,#CFE0F2)' })} />
          {[[4, 150], [24, 110], [44, 190], [66, 120], [82, 160]].map(([x, w], i) =>
            h('div', { key: `t${i}`, className: 'stbd-tree', style: st({ '--x': `${x}%`, '--w': `${w}px`, bottom: '4%' }) },
              h('i', { style: st({ top: '0%', width: '46%', height: '36%' }) }),
              h('i', { style: st({ top: '22%', width: '68%', height: '40%' }) }),
              h('i', { style: st({ top: '46%', width: '94%', height: '50%' }) }),
              ...Array.from({ length: 11 }, (_, k) => {
                const y = 14 + k * 7.2;
                const half = 4 + y * 0.4;
                return h('div', { key: `l${k}`, className: 'stbd-bulb', style: st({ '--x': `${50 + (k % 2 ? 1 : -1) * half * (0.35 + (k % 3) * 0.3)}%`, '--y': `${y}%`, '--s': '7px', '--c': ['#FF3D6E', '#FFE14D', '#35F0FF', '#FFFFFF', '#5CFF9A'][(k + i) % 5]!, '--d': `${1.6 + (k % 3) * 0.6}s`, '--dl': `${-k * 0.4}s` }) });
              }),
            ),
          )}
          {PETALS.map((p, i) => h('div', { key: i, className: 'stbd-fk2', style: st({ '--x': p.x, '--s': `${12 + (p.s % 14)}px`, '--d': `${9 + (i % 7) * 1.3}s`, '--dl': p.dl }) }))}
          {Array.from({ length: 44 }, (_, i) => h('div', { key: `b${i}`, className: 'stbd-fk2', style: st({ '--x': `${(i * 7.7 + 3) % 100}%`, '--s': `${5 + (i % 6)}px`, '--d': `${6 + (i % 6)}s`, '--dl': `${-(i * 1.1).toFixed(1)}s`, opacity: 0.75 }) }))}
        </>
      );
    case 'europe':
      return (
        <>
          {balloons([['#F2A65A', 18, 56, 70, -10], ['#8F6CE0', 70, 44, 90, -50]])}
          <div className="stbd-moon" style={st({ left: '14%', top: '10%', width: 90, height: 90 })} />
          {BRIGHT.map(([x, y], i) => h('div', { key: i, className: 'stbd-bright', style: st({ left: `${x}%`, top: `${(y ?? 0) % 40}%`, animationDelay: `${-i * 0.9}s` }) }))}
          <div className="stbd-skyline" style={st({ height: '34%', background: 'linear-gradient(180deg,#4B3A78,#2A2160)', opacity: 0.8, clipPath: 'polygon(0 100%,0 62%,3% 62%,3% 48%,5% 30%,7% 48%,7% 60%,13% 60%,13% 52%,17% 52%,17% 36%,19% 14%,21% 36%,21% 52%,27% 52%,27% 66%,34% 66%,34% 44%,36% 44%,36% 58%,43% 58%,43% 68%,50% 68%,50% 50%,52% 12%,54% 50%,54% 68%,60% 68%,60% 58%,66% 58%,66% 40%,68% 20%,70% 40%,70% 58%,76% 58%,76% 70%,83% 70%,83% 50%,86% 50%,86% 62%,92% 62%,92% 44%,94% 32%,96% 44%,96% 66%,100% 66%,100% 100%)' })} />
          <div className="stbd-skyline" style={st({ height: '22%', background: 'linear-gradient(180deg,#1B1642,#0E0B2B)', clipPath: 'polygon(0 100%,0 56%,6% 56%,6% 38%,10% 38%,10% 56%,18% 56%,18% 44%,26% 44%,26% 62%,34% 62%,34% 30%,38% 30%,38% 62%,47% 62%,47% 48%,56% 48%,56% 60%,64% 60%,64% 34%,70% 34%,70% 56%,78% 56%,78% 42%,86% 42%,86% 58%,94% 58%,94% 46%,100% 46%,100% 100%)' })} />
          {Array.from({ length: 18 }, (_, i) => h('div', { key: `w${i}`, className: 'stbd-win', style: st({ '--x': `${(i * 5.6 + 4) % 96}%`, '--y': `${80 + ((i * 7) % 16)}%`, '--d': `${3 + (i % 4)}s`, '--dl': `${-i * 0.6}s` }) }))}
          {[[18, 30], [60, 22], [82, 44], [36, 52], [70, 64]].map(([x, y], i) =>
            h('div', { key: `s${i}`, className: 'stbd-spark', style: st({ '--x': `${x}%`, '--y': `${y}%`, '--s': `${14 + (i % 3) * 6}px`, '--d': `${3.5 + (i % 3)}s`, '--dl': `${-i * 0.9}s` }) }),
          )}
          {[6, 24, 42, 60, 78, 94].map((x, i) => h('div', { key: `lp${i}`, className: 'stbd-lamp', style: st({ '--x': `${x}%`, '--h': `${70 + (i % 3) * 14}px` }) }))}
          {bursts([['#FFD65A', 26, 26, 240, 8, -1], ['#FF9EC2', 74, 20, 220, 9, -5]])}
          <div className="stbd-fill" style={st({ top: '94%', background: 'linear-gradient(180deg,rgba(255,200,120,0.35),rgba(10,8,30,0.9))' })} />
        </>
      );
    case 'lantern':
      return (
        <>
          {h('div', { className: 'stbd-drift', style: st({ top: '16%', height: '10%', '--d': '50s', background: 'radial-gradient(40% 50% at 30% 50%, rgba(255,214,120,0.3), transparent 70%), radial-gradient(30% 50% at 70% 50%, rgba(255,160,80,0.25), transparent 70%)' }) })}
          <div className="stbd-fill" style={st({ background: 'radial-gradient(50% 40% at 50% 108%, rgba(255,150,60,0.35), transparent 70%)' })} />
          {h('div', { className: 'stbd-drift', style: st({ top: '58%', height: '16%', '--d': '44s', background: 'radial-gradient(60% 50% at 40% 50%, rgba(255,196,90,0.22), transparent 70%)' }) })}
          {h('div', { className: 'stbd-drift', style: st({ top: '30%', height: '14%', '--d': '56s', '--dl': '-20s', background: 'radial-gradient(60% 50% at 60% 50%, rgba(255,196,90,0.16), transparent 70%)' }) })}
          {[4, 16, 30, 44, 58, 72, 84, 94].map((x, i) =>
            h('div', { key: i, className: 'stbd-lant', style: st({ '--x': `${x}%`, '--w': `${38 + (i % 3) * 14}px`, '--len': `${30 + ((i * 53) % 150)}px`, '--d': `${4.5 + (i % 4)}s`, '--dl': `${-i * 0.9}s` }) }),
          )}
          {[[22, 56], [48, 72], [68, 50], [88, 66], [10, 76]].map(([x, y], i) =>
            h('div', { key: `s${i}`, className: 'stbd-spark', style: st({ '--x': `${x}%`, '--y': `${y}%`, '--s': `${12 + (i % 3) * 5}px`, '--d': `${3 + (i % 3)}s`, '--dl': `${-i * 0.8}s` }) }),
          )}
          {h('div', { className: 'stbd-pagoda', style: st({ '--x': '3%', '--w': '120px', '--b': '-2%', '--c': '#1E0508' }) })}
          {h('div', { className: 'stbd-pagoda', style: st({ '--x': '80%', '--w': '160px', '--b': '-2%', '--c': '#1E0508' }) })}
          {h('div', { className: 'stbd-pagoda', style: st({ '--x': '66%', '--w': '80px', '--b': '-2%', '--c': '#2A0A10', opacity: 0.85 }) })}
          {bursts([['#FFD65A', 30, 30, 260, 7.5, -1], ['#FF6B4A', 80, 26, 240, 8, -4], ['#FFE9A8', 54, 56, 200, 6.8, -2.6]])}
        </>
      );
    case 'seigaiha':
      return (
        <>
          {rays(80, 22, 620, 'rgba(217,70,58,0.22)')}
          <div className="stbd-redsun" style={st({ right: '14%', top: '14%', width: 130, height: 130 })} />
          {h('div', { className: 'stbd-drift', style: st({ top: '24%', height: '8%', '--d': '48s', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.7),transparent)', borderRadius: 999 }) })}
          {h('div', { className: 'stbd-seig', style: st({ height: '30%', '--b': '#27457A', '--l': 'rgba(255,255,255,0.28)' }) })}
          {h('div', { className: 'stbd-seig', style: st({ height: '16%', '--b': '#1B3560', '--l': 'rgba(255,255,255,0.22)', animationDuration: '18s' }) })}
          {PETALS.slice(0, 9).map((p, i) => h('div', { key: i, className: 'stbd-petal', style: st({ '--x': p.x, '--s': `${p.s}px`, '--d': p.d, '--dl': p.dl, '--c1': '#F8B04A', '--c2': '#CC3A22', borderRadius: '50% 0 50% 50%' }) }))}
          {birds([[18, 40, -4, 1.4], [30, 55, -20, 1], [10, 48, -30, 0.8]], 'rgba(30,50,90,0.65)')}
          {h('div', { className: 'stbd-pine', style: st({ '--x': '2%', '--w': '60px', '--c': '#1B3560', '--b': '30%', opacity: 0.8 }) })}
        </>
      );
    case 'fuji':
      return (
        <>
          {birds([[16, 44, -6, 1.2], [26, 60, -26, 0.9], [12, 52, -34, 0.7]], 'rgba(60,70,110,0.65)')}
          <div className="stbd-redsun" style={st({ left: '58%', top: '26%', width: 96, height: 96, background: 'radial-gradient(circle at 40% 38%,#FFE2B8,#FBA46C 75%)', boxShadow: '0 0 80px 26px rgba(255,170,110,0.35)' })} />
          {h('div', { className: 'stbd-drift', style: st({ top: '30%', height: '8%', '--d': '50s', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.75),transparent)', borderRadius: 999 }) })}
          {h('div', { className: 'stbd-peak', style: st({ '--b': '14%', '--x': '-6%', '--w': '46%', '--h': '30%', opacity: 0.8 }) })}
          {h('div', { className: 'stbd-peak', style: st({ '--b': '10%', '--x': '26%', '--w': '56%', '--h': '48%' }) })}
          {h('div', { className: 'stbd-peak', style: st({ '--b': '12%', '--x': '70%', '--w': '40%', '--h': '26%', opacity: 0.85 }) })}
          <div className="stbd-fill" style={st({ top: '84%', background: 'linear-gradient(180deg,#3A4B78,#26335A)' })} />
          {h('div', { className: 'stbd-drift', style: st({ top: '70%', height: '12%', '--d': '36s', '--dl': '-8s', background: 'radial-gradient(60% 50% at 50% 50%, rgba(255,255,255,0.7), transparent 70%)' }) })}
          {PETALS.slice(0, 10).map((p, i) => h('div', { key: i, className: 'stbd-petal', style: st({ '--x': p.x, '--s': `${p.s}px`, '--d': p.d, '--dl': p.dl }) }))}
          {branch('fj', -2, -3, 36, 12, ['#FFD7E6', '#FFB0CB', '#FFFFFF'], 10)}
          {pinesOf([[3, 70, '#1F2A4A', -1], [11, 50, '#26335A', -1], [88, 80, '#1F2A4A', -1], [80, 56, '#26335A', -1]])}
          <div className="stbd-fill" style={st({ top: '92%', background: 'linear-gradient(180deg,rgba(255,190,150,0.35),rgba(20,26,56,0.9))' })} />
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
          {gems([[10, 24, 38, '#E8F6FF', '#8EC8FF', 6, 0], [84, 16, 30, '#FFE9A8', '#E0A63C', 7, -2], [18, 70, 34, '#FFD1E8', '#E2689B', 8, -4], [78, 72, 42, '#C9F5E1', '#46B98C', 6.5, -1], [46, 88, 26, '#FFF2C2', '#D8A432', 7.5, -3], [92, 46, 24, '#E8F6FF', '#8EC8FF', 5.5, -5]])}
          {Array.from({ length: 16 }, (_, i) => h('div', { key: `gd${i}`, className: 'stbd-rise', style: st({ '--x': `${(i * 11 + 4) % 96}%`, '--s': `${4 + (i % 4) * 2}px`, '--d': `${10 + (i % 6) * 1.5}s`, '--dl': `${-i * 1.2}s`, border: 'none', background: 'radial-gradient(circle at 30% 30%,#FFF2B8,#E0A63C)', boxShadow: '0 0 8px 2px rgba(255,200,90,0.6)' }) }))}
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
          {pinesOf([[2, 70, '#2A3438', 0], [9, 48, '#36444A', 0], [88, 84, '#2A3438', 0], [80, 52, '#36444A', 0]])}
          {birds([[22, 46, -6, 1.3], [34, 58, -24, 0.9], [14, 50, -34, 0.8]], 'rgba(30,42,51,0.7)')}
          <div style={st({ position: 'absolute', right: '4%', bottom: '5%', width: 30, height: 30, borderRadius: 4, background: '#9E2B22', boxShadow: 'inset 0 0 0 3px #F4EFE3' })} />
        </>
      );
    case 'maple':
      return (
        <>
          {rays(82, 6, 720, 'rgba(255,236,190,0.5)')}
          <div className="stbd-fill" style={st({ background: 'radial-gradient(40% 30% at 82% 6%, rgba(255,236,190,0.85), transparent 70%)' })} />
          {[...PETALS, ...PETALS.slice(0, 6).map((p, i) => ({ ...p, x: `${(i * 17 + 9) % 100}%`, dl: `${-(i * 1.9 + 1).toFixed(1)}s` }))].map((p, i) =>
            h('div', { key: i, className: 'stbd-petal stbd-mleaf', style: st({ '--x': p.x, '--s': `${p.s + 8}px`, '--d': p.d, '--dl': p.dl, '--c1': i % 2 ? '#F6A23C' : '#E5532C', '--c2': i % 3 ? '#C2321C' : '#9E2412', borderRadius: '50% 0 50% 50%' }) }),
          )}
          {branch('mp', -2, -3, 40, 10, ['#E5532C', '#F6A23C', '#C2321C'], 11)}
          {branch('mq', 102, -2, 30, 168, ['#F6A23C', '#E5532C', '#9E2412'], 8)}
          {h('div', { className: 'stbd-hill', style: st({ bottom: '-14%', height: '24%', background: 'linear-gradient(180deg,#E58A3C,#B8501E)' }) })}
        </>
      );
    case 'hanabi':
      return (
        <>
          {topStars(12)}
          {BRIGHT.map(([x, y], i) => h('div', { key: i, className: 'stbd-bright', style: st({ left: `${x}%`, top: `${(y ?? 0) % 45}%`, animationDelay: `${-i * 0.9}s` }) }))}
          {[
            ['#FF6FB0', 26, 34, 300, 6.5, 0], ['#FFD65A', 72, 28, 260, 7.5, -2.4], ['#6CD8FF', 50, 52, 220, 6, -4.2], ['#9BFF8C', 84, 58, 200, 8, -1.2], ['#FFA45C', 14, 60, 210, 7, -5.4],
          ].map(([c, x, y, s, d, dl], i) => h('div', { key: i, className: 'stbd-burst', style: st({ '--c': c as string, '--x': `${x}%`, '--y': `${y}%`, '--s': `${s}px`, '--d': `${d}s`, '--dl': `${dl}s` }) }))}
          <div className="stbd-skyline" style={st({ height: '12%', background: '#05071A', clipPath: 'polygon(0 100%,0 60%,8% 60%,8% 30%,12% 30%,12% 60%,22% 60%,22% 44%,30% 44%,30% 66%,44% 66%,44% 40%,50% 20%,56% 40%,56% 66%,70% 66%,70% 50%,80% 50%,80% 30%,86% 30%,86% 60%,100% 60%,100% 100%)' })} />
          {bursts([['#B58CFF', 40, 22, 240, 7, -3], ['#FF8FB0', 90, 36, 220, 8.5, -6], ['#6CFFD0', 6, 24, 200, 6.8, -1.5], ['#FFE066', 58, 66, 180, 7.2, -4.4]])}
          {Array.from({ length: 14 }, (_, i) => h('div', { key: `hl${i}`, className: 'stbd-bulb', style: st({ '--x': `${3 + i * 7.2}%`, '--y': `${88 + (i % 2) * 2}%`, '--s': '9px', '--c': i % 2 ? '#FF9E4D' : '#FF5A6E', '--d': `${2 + (i % 3)}s`, '--dl': `${-i * 0.4}s` }) }))}
          <div className="stbd-fill" style={st({ top: '93%', background: 'linear-gradient(180deg,rgba(255,120,160,0.25),rgba(5,7,26,0.95))' })} />
        </>
      );
    case 'koi':
      return (
        <>
          {[18, 46, 74].map((x, i) => h('div', { key: `ry${i}`, className: 'stbd-ray', style: st({ '--x': `${x}%`, '--w': `${90 + i * 20}px`, '--dl': `${-i * 3}s` }) }))}
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
          {[[10, 50, 70], [84, 70, 84], [52, 86, 60], [70, 30, 66]].map(([x, y, sz], i) => h('div', { key: `lo${i}`, className: 'stbd-lotus', style: st({ '--x': `${x}%`, '--y': `${y}%`, '--s': `${sz}px`, '--d': `${6 + i}s`, '--dl': `${-i * 1.5}s` }) }))}
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
          {[[10, 22], [30, 70], [56, 16], [78, 62], [92, 30], [44, 88]].map(([x, y], i) => h('div', { key: `sp${i}`, className: 'stbd-spark', style: st({ '--x': `${x}%`, '--y': `${y}%`, '--s': `${12 + (i % 3) * 6}px`, '--d': `${3 + (i % 3)}s`, '--dl': `${-i * 0.8}s`, background: '#fff' }) }))}
          {gems([[8, 62, 30, '#FFD1F0', '#FF4FA3', 7, 0], [86, 18, 34, '#C9F5FF', '#1FC8E8', 8, -3], [68, 80, 26, '#FFE9B8', '#FFB23F', 6.5, -2]])}
        </>
      );
    case 'tet':
      return (
        <>
          <div className="stbd-fill" style={st({ background: 'radial-gradient(50% 36% at 50% 110%, rgba(255,214,90,0.3), transparent 70%)' })} />
          {[6, 22, 40, 60, 78, 93].map((x, i) =>
            h('div', { key: `l${i}`, className: 'stbd-lant', style: st({ '--x': `${x}%`, '--w': `${34 + (i % 3) * 10}px`, '--len': `${24 + ((i * 41) % 110)}px`, '--d': `${4.5 + (i % 3)}s`, '--dl': `${-i}s` }) }),
          )}
          {[...PETALS, ...PETALS.slice(0, 8).map((p, i) => ({ ...p, x: `${(i * 13 + 5) % 100}%`, dl: `${-(i * 1.6 + 0.7).toFixed(1)}s` }))].map((p, i) =>
            h('div', { key: i, className: 'stbd-petal', style: st({ '--x': p.x, '--s': `${p.s}px`, '--d': p.d, '--dl': p.dl, ...(i % 2 ? { '--c1': '#FFF2A6', '--c2': '#F5C518' } : { '--c1': '#FFD3DF', '--c2': '#F0668C' }) }) }),
          )}
          {[[20, 40], [64, 30], [84, 58], [38, 66]].map(([x, y], i) =>
            h('div', { key: `s${i}`, className: 'stbd-spark', style: st({ '--x': `${x}%`, '--y': `${y}%`, '--s': `${12 + (i % 3) * 5}px`, '--d': `${3 + (i % 3)}s`, '--dl': `${-i * 0.9}s` }) }),
          )}
          {branch('ma', -2, -3, 36, 12, ['#FFE14D', '#FFC400', '#FFF2A6'], 11)}
          {branch('dao', 102, -2, 32, 168, ['#FF9EBB', '#FF6B95', '#FFD3DF'], 10)}
          {[[14, 22, 13, 0], [34, 26, 15, -4], [58, 20, 12, -8], [76, 24, 16, -2], [90, 22, 14, -6]].map(([x, sz, d, dl], i) => h('div', { key: `en${i}`, className: 'stbd-env', style: st({ '--x': `${x}%`, '--s': `${sz}px`, '--d': `${d}s`, '--dl': `${dl}s` }) }))}
          {bursts([['#FFD65A', 50, 30, 300, 7, 0], ['#FF7A5C', 18, 50, 240, 8, -3], ['#FFE9A8', 86, 44, 240, 6.5, -5]])}
        </>
      );
    case 'firefly':
      return (
        <>
          {h('div', { className: 'stbd-drift', style: st({ top: '56%', height: '24%', '--d': '48s', background: 'radial-gradient(60% 50% at 40% 50%, rgba(200,255,220,0.14), transparent 70%)' }) })}
          {h('div', { className: 'stbd-drift', style: st({ top: '30%', height: '18%', '--d': '62s', '--dl': '-20s', background: 'radial-gradient(60% 50% at 60% 50%, rgba(200,255,220,0.1), transparent 70%)' }) })}
          <div className="stbd-moon" style={st({ left: '70%', top: '8%', width: 80, height: 80, opacity: 0.85 })} />
          {[8, 20, 34, 50, 64, 80, 92].map((x, i) =>
            h('div', { key: `t${i}`, className: 'stbd-stalk', style: st({ '--x': `${x}%`, '--w': `${12 + (i % 3) * 5}px`, '--h': `${52 + ((i * 11) % 34)}%`, '--d': `${7 + (i % 4)}s`, '--dl': `${-i * 0.8}s`, background: 'linear-gradient(90deg,#10301F,#1C4A31 45%,#0C2418)' }) }),
          )}
          {Array.from({ length: 22 }, (_, i) => h('div', { key: `f${i}`, className: 'stbd-fly', style: st({ '--x': `${(i * 17 + 7) % 96}%`, '--y': `${30 + ((i * 23) % 62)}%`, '--s': `${4 + (i % 3) * 2}px`, '--d': `${5 + (i % 5)}s`, '--dl': `${-i * 0.7}s` }) }))}
          {[[8, 2, 34, '#7DF9E0'], [24, 1, 22, '#B58CFF'], [70, 3, 30, '#7DF9E0'], [88, 1, 40, '#FF8FD0'], [48, 2, 18, '#B58CFF']].map(([x, b, sz, c], i) => h('div', { key: `sh${i}`, className: 'stbd-shroom', style: st({ '--x': `${x}%`, '--b': `${b}%`, '--s': `${sz}px`, '--c': c as string, '--d': `${3 + i}s`, '--dl': `${-i * 0.8}s` }) }))}
          {Array.from({ length: 18 }, (_, i) => h('div', { key: `gr${i}`, className: 'stbd-stalk', style: st({ '--x': `${(i * 6 + 2) % 98}%`, '--w': '6px', '--h': `${8 + ((i * 7) % 8)}%`, '--d': `${4 + (i % 3)}s`, '--dl': `${-i * 0.5}s`, background: 'linear-gradient(90deg,#1B4A2A,#2E7D46 50%,#143A20)' }) }))}
          {Array.from({ length: 14 }, (_, i) => h('div', { key: `f2${i}`, className: 'stbd-fly', style: st({ '--x': `${(i * 13 + 3) % 96}%`, '--y': `${40 + ((i * 17) % 50)}%`, '--s': `${3 + (i % 3)}px`, '--d': `${6 + (i % 4)}s`, '--dl': `${-i * 0.9}s` }) }))}
        </>
      );
    case 'deepsea':
      return (
        <>
          {[8, 30, 55, 80].map((x, i) => h('div', { key: `ry${i}`, className: 'stbd-ray', style: st({ '--x': `${x}%`, '--w': `${90 + (i % 2) * 50}px`, '--dl': `${-i * 2.5}s` }) }))}
          <div className="stbd-fill" style={st({ background: 'radial-gradient(60% 40% at 50% -8%, rgba(120,230,255,0.28), transparent 70%)' })} />
          {h('div', { className: 'stbd-band', style: st({ top: '10%', height: '30%', '--d': '26s', background: 'radial-gradient(50% 50% at 45% 50%,rgba(90,200,255,.22),transparent 72%)' }) })}
          {Array.from({ length: 16 }, (_, i) => h('div', { key: i, className: 'stbd-rise', style: st({ '--x': `${(i * 13 + 5) % 96}%`, '--s': `${8 + (i % 5) * 5}px`, '--d': `${9 + (i % 6) * 1.5}s`, '--dl': `${-i * 1.1}s` }) }))}
          {[[26, 40, 120, 19, 0], [66, 62, 90, 23, -8]].map(([x, y, w, d, dl], i) =>
            h('div', { key: `k${i}`, className: 'stbd-koi', style: st({ '--x': `${x}%`, '--y': `${y}%`, '--w': `${w}px`, '--d': `${d}s`, '--dl': `${dl}s`, '--c1': '#5CE0E8', '--c2': '#2F7FD0', opacity: 0.7 }) }),
          )}
          {h('div', { className: 'stbd-dune', style: st({ bottom: '-12%', height: '22%', background: 'linear-gradient(180deg,#0E4F5E,#062B36)' }) })}
          {[[14, 54, '#FF8FE0', 22, 0], [46, 40, '#7DF0FF', 28, -9], [78, 64, '#B58CFF', 25, -16]].map(([x, sz, c, d, dl], i) => h('div', { key: `jl${i}`, className: 'stbd-jelly', style: st({ '--x': `${x}%`, '--s': `${sz}px`, '--c': c as string, '--d': `${d}s`, '--dl': `${dl}s` }) }))}
          {[4, 12, 20, 76, 88, 95].map((x, i) => h('div', { key: `sw${i}`, className: 'stbd-stalk', style: st({ '--x': `${x}%`, '--w': `${8 + (i % 3) * 3}px`, '--h': `${18 + ((i * 7) % 12)}%`, '--d': `${5 + (i % 3)}s`, '--dl': `${-i * 0.7}s`, background: i % 2 ? 'linear-gradient(90deg,#1B8A6A,#4FD6A0 50%,#0E5A48)' : 'linear-gradient(90deg,#B84A7E,#F07AA8 50%,#8A2E5A)' }) }))}
          {[[20, 22, 40, 12, 0], [30, 26, 34, 14, -3], [24, 30, 38, 13, -6], [62, 70, 36, 15, -2], [70, 74, 30, 16, -7]].map(([x, y, w, d, dl], i) => h('div', { key: `fs${i}`, className: 'stbd-koi', style: st({ '--x': `${x}%`, '--y': `${y}%`, '--w': `${w}px`, '--d': `${d}s`, '--dl': `${dl}s`, '--c1': '#FFD27A', '--c2': '#FF8A5C', opacity: 0.8 }) }))}
        </>
      );
    case 'paris':
      return (
        <>
          {topStars(14)}
          <div className="stbd-moon" style={st({ right: '14%', top: '10%', width: 76, height: 76 })} />
          {BRIGHT.map(([x, y], i) => h('div', { key: i, className: 'stbd-bright', style: st({ left: `${x}%`, top: `${(y ?? 0) % 40}%`, animationDelay: `${-i * 0.8}s` }) }))}
          <div className="stbd-skyline" style={st({ height: '48%', background: 'linear-gradient(180deg,#2C2554,#161235)', clipPath: 'polygon(0 100%,0 74%,10% 74%,10% 66%,20% 66%,20% 72%,32% 72%,32% 62%,40% 62%,45% 40%,48% 6%,50% 0,52% 6%,55% 40%,60% 62%,68% 62%,68% 70%,80% 70%,80% 64%,90% 64%,90% 74%,100% 74%,100% 100%)' })} />
          {Array.from({ length: 16 }, (_, i) => h('div', { key: `w${i}`, className: 'stbd-win', style: st({ '--x': `${(i * 6.3 + 3) % 96}%`, '--y': `${84 + ((i * 5) % 12)}%`, '--d': `${3 + (i % 4)}s`, '--dl': `${-i * 0.6}s` }) }))}
          {[[48, 8], [50, 20], [49, 32]].map(([x, y], i) =>
            h('div', { key: `s${i}`, className: 'stbd-spark', style: st({ '--x': `${x}%`, '--y': `${y}%`, '--s': `${14 + i * 4}px`, '--d': `${1.8 + i * 0.5}s`, '--dl': `${-i * 0.6}s` }) }),
          )}
          {PETALS.slice(0, 8).map((p, i) => h('div', { key: i, className: 'stbd-fk2', style: st({ '--x': p.x, '--s': `${5 + (p.s % 6)}px`, '--d': `${10 + (i % 5)}s`, '--dl': p.dl, opacity: 0.6 }) }))}
          {[6, 22, 38, 62, 78, 94].map((x, i) => h('div', { key: `lp${i}`, className: 'stbd-lamp', style: st({ '--x': `${x}%`, '--h': `${70 + (i % 3) * 14}px` }) }))}
          {bursts([['#FFD65A', 24, 26, 260, 7, 0], ['#FF8FB0', 76, 20, 240, 8, -3]])}
          {balloons([['#F28FB0', 12, 54, 80, -10], ['#FFD65A', 80, 40, 100, -60]])}
          <div className="stbd-fill" style={st({ top: '94%', background: 'linear-gradient(180deg,rgba(255,200,120,0.3),rgba(14,10,40,0.92))' })} />
        </>
      );
    case 'desert':
      return (
        <>
          {h('div', { className: 'stbd-pyr', style: st({ '--x': '6%', '--b': '34%', '--w': '300px', '--h': '190px' }) })}
          {h('div', { className: 'stbd-pyr', style: st({ '--x': '28%', '--b': '34%', '--w': '190px', '--h': '120px', opacity: 0.9 }) })}
          <div className="stbd-redsun" style={st({ left: '64%', top: '16%', width: 110, height: 110, background: 'radial-gradient(circle at 40% 38%,#FFF1C4,#FFB454 75%)', boxShadow: '0 0 90px 30px rgba(255,180,90,0.35)' })} />
          {h('div', { className: 'stbd-drift', style: st({ top: '22%', height: '8%', '--d': '46s', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.6),transparent)', borderRadius: 999 }) })}
          {h('div', { className: 'stbd-dune', style: st({ bottom: '14%', height: '24%', background: 'linear-gradient(180deg,#E9B56D,#D79A52)' }) })}
          {h('div', { className: 'stbd-dune', style: st({ bottom: '-6%', left: '-30%', width: '110%', height: '30%', background: 'linear-gradient(180deg,#D98E4A,#BD7138)' }) })}
          {h('div', { className: 'stbd-dune', style: st({ bottom: '-14%', left: '30%', width: '90%', height: '28%', background: 'linear-gradient(180deg,#C97B3E,#A35E2D)' }) })}
          {h('div', { className: 'stbd-drift', style: st({ top: '70%', height: '10%', '--d': '30s', '--dl': '-6s', background: 'radial-gradient(60% 50% at 50% 50%, rgba(255,230,180,0.5), transparent 70%)' }) })}
          {birds([[16, 40, -4, 1.3], [26, 56, -22, 1], [10, 50, -30, 0.8]], 'rgba(90,50,24,0.7)')}
          {Array.from({ length: 8 }, (_, i) => h('div', { key: `ss${i}`, className: 'stbd-spark', style: st({ '--x': `${(i * 13 + 9) % 94}%`, '--y': `${54 + ((i * 11) % 36)}%`, '--s': `${10 + (i % 3) * 4}px`, '--d': `${3 + (i % 3)}s`, '--dl': `${-i * 0.8}s`, background: '#FFE9B8' }) }))}
        </>
      );
    case 'lavender':
      return (
        <>
          {rays(82, 14, 620, 'rgba(255,240,200,0.5)')}
          <div className="stbd-sun" style={st({ right: '16%', top: '10%', width: 120, height: 120 })} />
          {h('div', { className: 'stbd-mtn', style: st({ '--x': '-8%', '--b': '34%', '--w': '70%', '--h': '26%', '--c1': 'rgba(170,150,215,0.55)', '--c2': 'rgba(210,200,235,0.2)' }) })}
          {h('div', { className: 'stbd-mtn', style: st({ '--x': '40%', '--b': '34%', '--w': '70%', '--h': '20%', '--c1': 'rgba(150,130,200,0.5)', '--c2': 'rgba(210,200,235,0.2)' }) })}
          {h('div', { className: 'stbd-hill', style: st({ bottom: '-8%', height: '34%', background: 'linear-gradient(180deg,#A58BD8,#7B5FB8)' }) })}
          {h('div', { className: 'stbd-hill', style: st({ bottom: '-16%', left: '-30%', width: '100%', height: '30%', background: 'linear-gradient(180deg,#8D70C8,#6A4CA6)' }) })}
          {[6, 16, 27, 38, 49, 60, 71, 82, 92].map((x, i) =>
            h('div', { key: i, className: 'stbd-stalk', style: st({ '--x': `${x}%`, '--w': '7px', '--h': `${24 + ((i * 9) % 14)}%`, '--d': `${4 + (i % 3)}s`, '--dl': `${-i * 0.6}s`, background: 'linear-gradient(180deg,#B9A0EA,#6F9A4E 60%)' }) }),
          )}
          {PETALS.slice(0, 9).map((p, i) => h('div', { key: `p${i}`, className: 'stbd-petal', style: st({ '--x': p.x, '--s': `${p.s - 4}px`, '--d': p.d, '--dl': p.dl, '--c1': '#EADFFF', '--c2': '#B497E8' }) }))}
          {pinesOf([[3, 40, '#3F6B3A', 8], [93, 46, '#3F6B3A', 6]])}
          {Array.from({ length: 18 }, (_, i) => h('div', { key: `fr${i}`, className: 'stbd-stalk', style: st({ '--x': `${(i * 5.7 + 1) % 98}%`, '--w': '8px', '--h': `${12 + ((i * 5) % 8)}%`, '--d': `${4 + (i % 3)}s`, '--dl': `${-i * 0.5}s`, background: 'linear-gradient(180deg,#9A74E0,#7A55C0 70%,#4F7B3A)' }) }))}
          {birds([[18, 44, -6, 1.1], [30, 60, -26, 0.8]], 'rgba(120,70,150,0.6)')}
        </>
      );
    case 'candy':
      return (
        <>
          {h('div', { className: 'stbd-drift', style: st({ top: '10%', height: '14%', '--d': '44s', background: 'radial-gradient(40% 50% at 30% 50%, rgba(255,255,255,0.9), transparent 70%), radial-gradient(30% 50% at 72% 50%, rgba(255,255,255,0.8), transparent 70%)' }) })}
          {h('div', { className: 'stbd-drift', style: st({ top: '62%', height: '14%', '--d': '58s', '--dl': '-18s', background: 'radial-gradient(40% 50% at 40% 50%, rgba(255,255,255,0.85), transparent 70%)' }) })}
          {[
            ['#FF9EC7', '-10%', '-12%', '60vmax', '22s', '0s'],
            ['#9EE6FF', '50%', '-10%', '52vmax', '26s', '-7s'],
            ['#FFE08A', '28%', '48%', '56vmax', '24s', '-4s'],
            ['#C9B2FF', '-14%', '44%', '50vmax', '28s', '-11s'],
          ].map(([c, x, y, s, d, dl], i) => h('div', { key: i, className: 'stbd-blob', style: st({ '--c': c!, '--x': x!, '--y': y!, '--s': s!, '--d': d!, '--dl': dl!, opacity: 0.55 }) }))}
          {[[12, 20], [34, 62], [58, 18], [78, 70], [90, 34], [48, 84]].map(([x, y], i) =>
            h('div', { key: `s${i}`, className: 'stbd-spark', style: st({ '--x': `${x}%`, '--y': `${y}%`, '--s': `${12 + (i % 3) * 6}px`, '--d': `${3 + (i % 3)}s`, '--dl': `${-i * 0.8}s`, background: '#fff' }) }),
          )}
          {balloons([['#FF8FB8', 10, 56, 24, 0], ['#8FD8FF', 34, 44, 30, -8], ['#FFD66B', 62, 60, 27, -15], ['#B79BFF', 86, 48, 33, -22]])}
          {[[8, 34, 70, '#FFB3D1'], [88, 22, 56, '#9EE6FF'], [16, 76, 64, '#FFE08A'], [80, 74, 60, '#C9B2FF']].map(([x, y, sz, c], i) => h('div', { key: `dn${i}`, className: 'stbd-donut', style: st({ '--x': `${x}%`, '--y': `${y}%`, '--s': `${sz}px`, '--c': c as string, '--d': `${5 + i}s`, '--dl': `${-i * 1.2}s` }) }))}
        </>
      );
    case 'torii':
      return (
        <>
          {topStars(14)}{rays(66, 26, 640, 'rgba(255,170,110,0.22)')}
          <div className="stbd-redsun" style={st({ left: '58%', top: '14%', width: 120, height: 120, background: 'radial-gradient(circle at 40% 38%,#FFE6B8,#FF9A5C 75%)', boxShadow: '0 0 90px 30px rgba(255,140,90,0.4)' })} />
          {h('div', { className: 'stbd-mtn', style: st({ '--x': '-6%', '--b': '30%', '--w': '60%', '--h': '24%', '--c1': 'rgba(120,70,110,0.7)', '--c2': 'rgba(200,120,110,0.3)' }) })}
          {h('div', { className: 'stbd-mtn', style: st({ '--x': '46%', '--b': '30%', '--w': '64%', '--h': '20%', '--c1': 'rgba(110,60,100,0.7)', '--c2': 'rgba(200,120,110,0.3)' }) })}
          <div className="stbd-fill" style={st({ top: '70%', background: 'linear-gradient(180deg,#3A1F4A,#1E1030)' })} />
          {h('div', { className: 'stbd-torii', style: st({ '--x': '12%', '--b': '22%', '--w': '150px' }) }, h('i'), h('i'), h('i'), h('i'))}
          {h('div', { className: 'stbd-torii', style: st({ '--x': '66%', '--b': '16%', '--w': '90px', opacity: 0.85 }) }, h('i'), h('i'), h('i'), h('i'))}
          {h('div', { className: 'stbd-drift', style: st({ top: '66%', height: '12%', '--d': '38s', background: 'radial-gradient(60% 50% at 50% 50%, rgba(255,220,200,0.45), transparent 70%)' }) })}
          {PETALS.slice(0, 11).map((p, i) => h('div', { key: i, className: 'stbd-petal', style: st({ '--x': p.x, '--s': `${p.s}px`, '--d': p.d, '--dl': p.dl }) }))}
          {h('div', { className: 'stbd-torii', style: st({ '--x': '42%', '--b': '11%', '--w': '60px', opacity: 0.6 }) }, h('i'), h('i'), h('i'), h('i'))}
          {h('div', { className: 'stbd-torii', style: st({ '--x': '30%', '--b': '13%', '--w': '40px', opacity: 0.45 }) }, h('i'), h('i'), h('i'), h('i'))}
          {[8, 24, 40, 56, 72, 90].map((x, i) => h('div', { key: `tl${i}`, className: 'stbd-lant', style: st({ '--x': `${x}%`, '--w': '26px', '--len': `${20 + ((i * 29) % 40)}px`, '--d': `${4 + (i % 3)}s`, '--dl': `${-i}s` }) }))}
          {birds([[20, 50, -8, 1], [32, 66, -30, 0.8]], 'rgba(40,20,50,0.7)')}
          {Array.from({ length: 10 }, (_, i) => h('div', { key: `tf${i}`, className: 'stbd-fly', style: st({ '--x': `${(i * 11 + 5) % 94}%`, '--y': `${50 + ((i * 17) % 42)}%`, '--s': '4px', '--d': `${6 + (i % 4)}s`, '--dl': `${-i * 0.9}s` }) }))}
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
