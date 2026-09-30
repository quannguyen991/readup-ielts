/**
 * TOA TỪ VỰNG — "ghế cạnh cửa sổ" (nạp động từ `RailApp.web.tsx`).
 *
 * Người học ngồi TRONG toa: cảnh pixel hiện qua ô cửa sổ bo tròn có rèm, kính
 * đọng mưa / bám sương; câu hỏi là tấm vé giấy đặt trên bàn dưới cửa sổ; bảng
 * lật (split-flap) báo giờ địa phương và ga sắp tới; chọn hành trình theo TUYẾN
 * (sơ đồ kiểu tàu điện); tới ga thì hộ chiếu được đóng dấu; radio nhỏ trong toa
 * phát nhạc tự tổng hợp. Có nút đổi góc nhìn ra ngoài để ngắm đoàn tàu chạy.
 *
 * Chuyển ga theo CÂU ĐÚNG (mặc định 5) hoặc theo thời gian. Câu trả lời đi qua
 * `useGameStore.answer` như mọi bài từ vựng (mã chống lặp theo từ + ngày).
 * Cảnh, nhạc sinh bằng code (`services/rail/*`).
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { router } from 'expo-router';

import { useWordPools } from '@/components/quiz/useWordPools';
import { makeQuestion, type CatchQuestion } from '@/services/city/life';
import { dateKey } from '@/services/gamification/points';
import { RailMusic, TRACKS, type MusicStyle } from '@/services/rail/music';
import { RailScene, type Weather } from '@/services/rail/scene';
import { localClock, nextOnRoute, ROUTES, routeById, routeOf, STATIONS, stationById, timeOfDayAt, type Route, type TimeOfDay } from '@/services/rail/stations';
import { useGameStore } from '@/store/useGameStore';
import { useRailStore } from '@/store/useRailStore';

const C = {
  wall: '#0F2238',
  wall2: '#142B46',
  line: 'rgba(255,255,255,0.10)',
  ink: '#EAF0FA',
  muted: '#9DB0CC',
  blue: '#4A7FE8',
  brass: '#D9A441',
  amber: '#FFC24A',
  paper: '#F8F1E2',
  paperInk: '#2B2118',
  wood: '#7A4E2E',
  ok: '#2E9A5E',
  bad: '#C8402F',
};
const MONO = "'IBM Plex Mono', ui-monospace, Menlo, monospace";
const SERIF = "'Fraunces', 'Be Vietnam Pro', serif";

const CSS = `
.tv-root{position:absolute;inset:0;overflow-y:auto;color:${C.ink};font-family:'Be Vietnam Pro',system-ui,sans-serif;
  background:
    linear-gradient(180deg, rgba(0,0,0,.25), transparent 180px),
    repeating-linear-gradient(90deg, transparent 0 118px, rgba(255,255,255,.035) 118px 120px),
    linear-gradient(180deg, ${C.wall2}, ${C.wall} 60%, #0B1A2C)}
.tv-wrap{max-width:1240px;margin:0 auto;padding:16px 20px 64px}
.tv-rack{height:10px;border-radius:0 0 8px 8px;background:linear-gradient(180deg,#B7C3D4,#6E7C90);box-shadow:0 6px 14px rgba(0,0,0,.35);margin:0 -20px 18px;opacity:.55}
.tv-btn{appearance:none;border:1px solid ${C.line};background:rgba(255,255,255,.06);color:${C.ink};font:inherit;font-size:15px;border-radius:999px;padding:9px 14px;cursor:pointer;display:inline-flex;align-items:center;gap:8px;transition:background .15s,border-color .15s,transform .1s;white-space:nowrap}
.tv-btn:hover{background:rgba(255,255,255,.12)}
.tv-btn:active{transform:translateY(1px)}
.tv-btn.on{background:${C.blue};border-color:${C.blue};color:#fff}
.tv-btn:focus-visible,.tv-opt:focus-visible,.tv-dot:focus-visible,.tv-icon:focus-visible{outline:3px solid ${C.amber};outline-offset:2px}
.tv-card{background:rgba(9,20,35,.55);border:1px solid ${C.line};border-radius:20px;padding:16px;backdrop-filter:blur(6px)}
.tv-h{font-family:${MONO};font-size:13px;letter-spacing:.16em;text-transform:uppercase;color:${C.muted};margin:0 0 10px;font-weight:600}

/* cửa sổ toa */
.tv-window{position:relative;border-radius:34px;padding:16px;background:linear-gradient(180deg,#F3EBDD,#D9CDB8);box-shadow:0 18px 40px rgba(0,0,0,.45), inset 0 2px 0 rgba(255,255,255,.7), inset 0 -3px 0 rgba(0,0,0,.12)}
.tv-glass{position:relative;border-radius:22px;overflow:hidden;background:#000;box-shadow:inset 0 0 0 3px rgba(0,0,0,.35)}
.tv-glass canvas{display:block;width:100%;height:auto;image-rendering:pixelated;image-rendering:crisp-edges}
.tv-glass::after{content:'';position:absolute;inset:0;pointer-events:none;background:linear-gradient(115deg,rgba(255,255,255,.16) 0%,rgba(255,255,255,.04) 22%,transparent 23%,transparent 58%,rgba(255,255,255,.07) 59%,transparent 70%);mix-blend-mode:screen}
.tv-curtain{position:absolute;top:-6px;bottom:18px;width:9%;min-width:38px;pointer-events:none;border-radius:8px;
  background:repeating-linear-gradient(90deg,#2F5FC4 0 7px,#3D6FD6 7px 12px,#2A55B0 12px 16px);box-shadow:0 8px 16px rgba(0,0,0,.35);transform-origin:top}
.tv-curtain.l{left:-10px;clip-path:polygon(0 0,100% 0,62% 55%,100% 100%,0 100%)}
.tv-curtain.r{right:-10px;clip-path:polygon(0 0,100% 0,100% 100%,0 100%,38% 55%)}
.tv-tie{position:absolute;top:52%;width:9%;min-width:38px;height:8px;background:${C.brass};border-radius:4px}
.tv-table{height:26px;margin:-6px 6% 0;border-radius:0 0 14px 14px;background:linear-gradient(180deg,#A8744A,${C.wood} 55%,#5A3820);box-shadow:0 14px 26px rgba(0,0,0,.45)}

/* vé câu hỏi */
.tv-ticket{position:relative;margin:-10px 4% 0;background:${C.paper};color:${C.paperInk};border-radius:16px;display:grid;grid-template-columns:1fr 132px;box-shadow:0 12px 30px rgba(0,0,0,.35);
  background-image:radial-gradient(rgba(120,90,50,.06) 1px,transparent 1px);background-size:5px 5px}
.tv-ticket::before,.tv-ticket::after{content:'';position:absolute;right:122px;width:20px;height:20px;border-radius:50%;background:${C.wall}}
.tv-ticket::before{top:-10px}.tv-ticket::after{bottom:-10px}
.tv-stub{border-left:2px dashed rgba(43,33,24,.25);padding:16px 14px;display:flex;flex-direction:column;gap:6px;align-items:flex-start;justify-content:center}
.tv-opt{appearance:none;text-align:left;font:inherit;font-size:16px;color:${C.paperInk};background:#FFFDF7;border:1.5px solid rgba(43,33,24,.18);border-radius:12px;padding:12px 14px;cursor:pointer;display:flex;gap:10px;align-items:center;transition:border-color .15s,transform .12s,box-shadow .15s}
.tv-opt:hover:not([disabled]){border-color:${C.blue};transform:translateY(-1px);box-shadow:0 4px 0 rgba(74,127,232,.25)}
.tv-opt.right{border-color:${C.ok};background:#E9F7EE}
.tv-opt.wrong{border-color:${C.bad};background:#FCEBE8}
.tv-kbd{font-family:${MONO};font-size:13px;border:1px solid rgba(43,33,24,.25);border-radius:6px;padding:0 6px;color:#7A6A58}
.tv-stamp{position:absolute;right:150px;top:14px;border:3px solid ${C.ok};color:${C.ok};border-radius:10px;padding:2px 10px;font-family:${MONO};font-weight:600;letter-spacing:.14em;transform:rotate(-9deg);animation:tv-slam .38s cubic-bezier(.2,.9,.3,1.3) both}
@keyframes tv-slam{from{opacity:0;transform:rotate(-9deg) scale(2.2)}to{opacity:.9;transform:rotate(-9deg) scale(1)}}

/* bảng lật */
.tv-flap{display:inline-flex;gap:2px}
.tv-flap span{display:inline-flex;align-items:center;justify-content:center;width:1.05em;height:1.45em;background:linear-gradient(180deg,#1B1B1F 50%,#111114 50%);color:${C.amber};border-radius:3px;font-family:${MONO};font-weight:600;box-shadow:inset 0 -1px 0 rgba(255,255,255,.06);animation:tv-flip .42s ease both;transform-origin:center}
@keyframes tv-flip{0%{transform:rotateX(90deg);filter:brightness(1.8)}100%{transform:none}}

/* sơ đồ tuyến */
.tv-line{position:relative;display:flex;align-items:flex-start;overflow-x:auto;padding:8px 4px 4px;scrollbar-width:thin}
.tv-dot{appearance:none;background:none;border:0;color:${C.muted};font:inherit;font-size:13px;display:flex;flex-direction:column;align-items:center;gap:6px;min-width:84px;cursor:pointer;padding:0}
.tv-dot i{width:14px;height:14px;border-radius:50%;background:${C.wall};border:3px solid currentColor;display:block}
.tv-dot.done i{background:currentColor}
.tv-dot.here{color:${C.ink};font-weight:700}
.tv-dot.here i{width:22px;height:22px;box-shadow:0 0 0 5px rgba(255,194,74,.25)}

/* hộ chiếu */
.tv-pass{background:linear-gradient(180deg,#F4ECDC,#EADFC8);color:${C.paperInk};border-radius:18px;padding:18px;box-shadow:inset 0 0 0 6px rgba(120,90,50,.08)}
.tv-st{width:100%;aspect-ratio:1;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;font-family:${MONO};font-size:12px;line-height:1.2;padding:6px}
.tv-icon{appearance:none;border:1px solid ${C.line};background:rgba(255,255,255,.05);color:${C.ink};border-radius:12px;height:42px;cursor:pointer;font:inherit;font-size:14px;display:flex;align-items:center;justify-content:center;gap:6px;transition:background .15s}
.tv-icon.on{background:${C.blue};border-color:${C.blue}}
.tv-range{width:100%;accent-color:${C.amber}}
.tv-pop{animation:tv-pop .32s cubic-bezier(.2,.9,.3,1.2) both}
@keyframes tv-pop{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:none}}
.tv-imm{position:fixed;inset:0;z-index:1000;background:#000;color:${C.ink};font-family:'Be Vietnam Pro',system-ui,sans-serif}
.tv-imm canvas{width:100vw;height:100vh;object-fit:cover;image-rendering:pixelated}
.tv-routes{flex-wrap:wrap}
.tv-main{display:grid;grid-template-columns:minmax(0,1fr) 330px;gap:22px;align-items:start}
@media (max-width:1060px){.tv-main{grid-template-columns:1fr}}
@media (max-width:640px){
  .tv-wrap{padding:12px 12px 48px}.tv-rack{margin:0 -12px 12px}
  .tv-window{padding:9px;border-radius:22px}.tv-glass{border-radius:14px}
  .tv-curtain{display:none}.tv-tie{display:none}
  .tv-ticket{grid-template-columns:1fr;margin:-8px 0 0}.tv-ticket::before,.tv-ticket::after{display:none}.tv-stub{display:none}
  .tv-routes{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;margin-right:-12px!important}
  .tv-grid2{grid-template-columns:1fr!important}.tv-hide-sm{display:none!important}.tv-stamp{right:14px}
}
@media (prefers-reduced-motion:reduce){.tv-flap span,.tv-pop,.tv-stamp{animation:none}}
`;

let injected = false;
function useTvCss() {
  useEffect(() => {
    if (injected || typeof document === 'undefined') return;
    injected = true;
    const el = document.createElement('style');
    el.textContent = CSS;
    document.head.appendChild(el);
    // Phông có dấu tiếng Việt, giấy phép OFL.
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=IBM+Plex+Mono:wght@400;600&display=swap';
    document.head.appendChild(link);
  }, []);
}

/** Chữ bảng lật: mỗi ký tự một ô, đổi chữ là lật lại (key theo ký tự). */
function Flap({ text, len, size = 18 }: { text: string; len: number; size?: number }) {
  const t = text.toUpperCase().padEnd(len, ' ').slice(0, len);
  return (
    <span className="tv-flap" style={{ fontSize: size }} aria-label={text}>
      {[...t].map((ch, i) => (
        <span key={`${i}-${ch}`} aria-hidden style={{ animationDelay: `${i * 35}ms` }}>
          {ch === ' ' ? ' ' : ch}
        </span>
      ))}
    </span>
  );
}

const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7);
/** Bỏ dấu cho bảng lật (bảng cơ khí chỉ có chữ không dấu — đúng chất bảng ga cũ). */
const plain = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');

type Phase = { k: 'ask'; q: CatchQuestion; at: number } | { k: 'done'; q: CatchQuestion; picked: number; right: boolean } | { k: 'empty' };

const TIME_LABEL: Record<TimeOfDay, string> = { day: 'Ban ngày', sunset: 'Hoàng hôn', night: 'Ban đêm' };
const WEATHER_LABEL: Record<Weather, string> = { clear: 'Trời quang', rain: 'Mưa', snow: 'Tuyết' };
const STYLE_LABEL: Record<MusicStyle, string> = { piano: 'Piano', lofi: 'Lo-fi', ambient: 'Ambient', bell: 'Chuông' };

export default function RailPage() {
  useTvCss();
  const st = useRailStore();
  const station = stationById(st.station);
  const route = routeById(st.route).stops.includes(station.id) ? routeById(st.route) : routeOf(station.id);
  const next = nextOnRoute(route, station.id);
  const after = nextOnRoute(route, next.id);
  const { focus, pool } = useWordPools();

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 10_000);
    return () => clearInterval(id);
  }, []);
  const clock = localClock(station.tz, now);
  const hhmm = `${String(clock.h).padStart(2, '0')}:${String(clock.m).padStart(2, '0')}`;
  const time: TimeOfDay = st.time === 'auto' ? timeOfDayAt(clock.h) : st.time;

  // ---------------------------------------------------------------- cảnh
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const immRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<RailScene | null>(null);
  const [immersive, setImmersive] = useState(false);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const boost = useRef(0);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const target = immersive ? immRef.current : canvasRef.current;
    if (!target) return;
    const scene = new RailScene(target);
    sceneRef.current = scene;
    const s0 = useRailStore.getState();
    const st0 = stationById(s0.station);
    scene.view = s0.view;
    scene.set(st0, s0.time === 'auto' ? timeOfDayAt(localClock(st0.tz, new Date()).h) : s0.time, s0.weather);
    let raf = 0;
    let last = performance.now();
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const loop = (t: number) => {
      const dt = Math.min(0.1, (t - last) / 1000);
      last = t;
      boost.current = Math.max(0, boost.current - dt * 0.8);
      scene.speed = pausedRef.current ? Math.max(0, scene.speed - dt) : reduced ? 0.25 : 1 + boost.current * 2.5;
      if (!document.hidden) scene.frame(dt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [immersive]);

  useEffect(() => {
    sceneRef.current?.set(station, time, st.weather, true);
  }, [station, time, st.weather]);
  useEffect(() => {
    if (sceneRef.current) sceneRef.current.view = st.view;
  }, [st.view]);
  // Nạp trước ảnh nền của ga kế để lúc tàu tới không phải chờ tải.
  useEffect(() => {
    RailScene.preload(next.id, time);
  }, [next.id, time]);

  // ---------------------------------------------------------------- radio
  const musicRef = useRef<RailMusic | null>(null);
  const [playing, setPlaying] = useState(false);
  const [trackNow, setTrackNow] = useState(st.track);
  const music = () => {
    if (!musicRef.current) {
      const m = new RailMusic();
      m.onTrack = (i) => {
        setTrackNow(i);
        useRailStore.getState().set({ track: i });
      };
      musicRef.current = m;
    }
    return musicRef.current;
  };
  useEffect(() => () => musicRef.current?.dispose(), []);
  useEffect(() => {
    const m = musicRef.current;
    if (!m) return;
    m.style = st.style;
    m.setVolume(st.volume);
  }, [st.style, st.volume]);
  useEffect(() => {
    const m = musicRef.current;
    if (m && playing) m.setRain(st.rainSound && st.weather === 'rain');
  }, [st.rainSound, st.weather, playing]);
  const togglePlay = () => {
    const m = music();
    m.style = st.style;
    if (playing) {
      m.stop();
      m.setRain(false);
      setPlaying(false);
    } else {
      m.setVolume(st.volume);
      m.start(st.track);
      m.setRain(st.rainSound && st.weather === 'rain');
      setPlaying(true);
    }
  };

  // ---------------------------------------------------------------- chuyển ga
  // Quãng đã đi tới ga kế lưu trong store: dùng chung với nền tàu ở các màn ôn từ vựng.
  const toward = st.toward;
  const setToward = useCallback((v: number) => useRailStore.getState().set({ toward: v }), []);
  const [arrived, setArrived] = useState<string | null>(null);
  const passed = useRef(0);
  const goTo = useCallback((id: string, byTrain: boolean) => {
    const s = useRailStore.getState();
    s.set({ station: id, route: routeOf(id).id });
    setToward(0);
    if (byTrain) {
      const fresh = s.stamp(id);
      setArrived(fresh ? id : null);
      passed.current += 1;
      if (s.autoTrack && musicRef.current?.playing && passed.current % 5 === 0) musicRef.current.skip(1);
    }
  }, [setToward]);
  const goNext = useCallback(() => {
    const s = useRailStore.getState();
    const r = routeById(s.route).stops.includes(s.station) ? routeById(s.route) : routeOf(s.station);
    goTo(nextOnRoute(r, s.station).id, true);
  }, [goTo]);
  useEffect(() => {
    if (!arrived) return;
    const id = setTimeout(() => setArrived(null), 4200);
    return () => clearTimeout(id);
  }, [arrived]);

  const [tick, setTickState] = useState(0);
  const tickRef = useRef(0);
  const setTick = useCallback((v: number) => {
    tickRef.current = v;
    setTickState(v);
  }, []);
  useEffect(() => {
    if (!st.auto || st.advanceBy !== 'time' || paused) return;
    const id = setInterval(() => {
      const n = tickRef.current + 1;
      if (n >= useRailStore.getState().seconds) {
        setTick(0);
        goNext();
      } else setTick(n);
    }, 1000);
    return () => clearInterval(id);
  }, [st.auto, st.advanceBy, paused, goNext, setTick]);

  const pickRoute = (r: Route) => {
    st.set({ route: r.id });
    if (!r.stops.includes(station.id)) goTo(r.stops[0]!, false);
  };

  // ---------------------------------------------------------------- câu hỏi
  const ask = (): Phase => {
    const q = makeQuestion(focus, pool, Math.random);
    return q ? { k: 'ask', q, at: Date.now() } : { k: 'empty' };
  };
  const [phase, setPhase] = useState<Phase>(ask);
  const newQuestion = useCallback(() => {
    const q = makeQuestion(focus, pool, Math.random);
    setPhase(q ? { k: 'ask', q, at: Date.now() } : { k: 'empty' });
  }, [focus, pool]);

  const pick = useCallback(
    (i: number) => {
      if (phase.k !== 'ask') return;
      const right = i === phase.q.answer;
      useGameStore.getState().answer(right, 'vocab', { key: `rail:${phase.q.word}:${dateKey(new Date())}` });
      useRailStore.getState().count(right);
      setPhase({ k: 'done', q: phase.q, picked: i, right });
      if (right) {
        boost.current = 1;
        const s = useRailStore.getState();
        if (s.auto && s.advanceBy === 'answers') {
          const r = s.step();
          if (r.arrived) {
            setArrived(r.fresh ? r.arrived : null);
            passed.current += 1;
            if (s.autoTrack && musicRef.current?.playing && passed.current % 5 === 0) musicRef.current.skip(1);
          }
        }
      }
    },
    [phase],
  );
  useEffect(() => {
    if (phase.k !== 'done' || !phase.right) return;
    const id = setTimeout(newQuestion, 950);
    return () => clearTimeout(id);
  }, [phase, newQuestion]);

  const pickRef = useRef(pick);
  const nextRef = useRef(newQuestion);
  const phaseRef = useRef(phase);
  useEffect(() => {
    pickRef.current = pick;
    nextRef.current = newQuestion;
    phaseRef.current = phase;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA')) return;
      const n = Number(e.key);
      if (n >= 1 && n <= 4) pickRef.current(n - 1);
      else if ((e.key === 'Enter' || e.key === ' ') && phaseRef.current.k === 'done') {
        e.preventDefault();
        nextRef.current();
      } else if (e.key === 'Escape') setImmersive(false);
      else if (e.key.toLowerCase() === 'f') setImmersive((v) => !v);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const progress = st.advanceBy === 'answers' ? toward / st.perStation : tick / st.seconds;
  const leftText = st.advanceBy === 'answers' ? `${st.perStation - toward} câu đúng` : `${Math.max(0, st.seconds - tick)} giây`;
  const tickets = Object.keys(st.tickets).length;
  const hereIdx = route.stops.indexOf(station.id);

  const ticket = (
    <Ticket phase={phase} onPick={pick} onNext={newQuestion} route={route} station={station.vi} next={next.vi} progress={progress} leftText={leftText} auto={st.auto} seat={`${String(7 + (hash(station.id) & 3)).padStart(2, '0')}·${(hash(station.id) & 15) + 1}A`} />
  );

  return (
    <div className="tv-root">
      <div className="tv-wrap">
        <div className="tv-rack" aria-hidden />
        {/* ------------------------------------------------ đầu toa */}
        <header style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button className="tv-btn" aria-label="Về Quest" onClick={() => router.push('/quest' as never)}>
            ←
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <span style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 700 }}>Toa Từ Vựng</span>
            <span style={{ fontFamily: MONO, fontSize: 13, color: C.muted, letterSpacing: '.08em' }}>
              {route.glyph} Tuyến {route.vi}
            </span>
          </div>
          <span style={{ flex: 1 }} />
          <button className={`tv-btn${st.view === 'outside' ? ' on' : ''}`} onClick={() => st.set({ view: st.view === 'window' ? 'outside' : 'window' })} title="Đổi góc nhìn">
            {st.view === 'window' ? '🪟' : '🚆'}
            <span className="tv-hide-sm">{st.view === 'window' ? 'Ghế cạnh cửa sổ' : 'Ngắm tàu từ ngoài'}</span>
          </button>
          <button className="tv-btn" onClick={() => setImmersive(true)} title="Phím F">
            ⛶<span className="tv-hide-sm"> Toàn cảnh</span>
          </button>
        </header>

        {/* ------------------------------------------------ chọn tuyến + sơ đồ */}
        <div className="tv-routes" style={{ display: 'flex', gap: 8, margin: '16px 0 8px' }} role="radiogroup" aria-label="Chọn tuyến">
          {ROUTES.map((r) => (
            <button key={r.id} role="radio" aria-checked={route.id === r.id} className={`tv-btn${route.id === r.id ? ' on' : ''}`} onClick={() => pickRoute(r)} style={route.id === r.id ? { background: r.color, borderColor: r.color } : undefined}>
              {r.glyph} {r.vi}
            </button>
          ))}
        </div>
        <RouteLine route={route} hereIdx={hereIdx} progress={progress} tickets={st.tickets} onPick={(id) => goTo(id, false)} />

        {/* ------------------------------------------------ toa */}
        <div className="tv-main" style={{ marginTop: 18 }}>
          <div>
            <div className="tv-window">
              <div className="tv-glass">
                <canvas ref={canvasRef} role="img" aria-label={`Ngoài cửa sổ: ${station.vi}, ${TIME_LABEL[time].toLowerCase()}, ${WEATHER_LABEL[st.weather].toLowerCase()}`} />
                <div style={{ position: 'absolute', left: 'max(16px, 8%)', bottom: 14, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontFamily: SERIF, fontSize: 'clamp(20px, 3vw, 32px)', fontWeight: 700, color: '#fff', textShadow: '0 2px 0 rgba(0,0,0,.45), 0 0 18px rgba(0,0,0,.35)' }}>{station.vi}</span>
                  <a className="tv-btn tv-hide-sm" href={`https://vi.wikipedia.org/wiki/${station.wiki}`} target="_blank" rel="noreferrer" style={{ background: 'rgba(10,20,35,.55)', fontSize: 13, padding: '5px 10px', textDecoration: 'none' }}>
                    Tìm hiểu ↗
                  </a>
                </div>
                <button className="tv-btn" style={{ position: 'absolute', right: 'max(14px, 8%)', bottom: 12, background: 'rgba(10,20,35,.55)', padding: '6px 12px' }} aria-label={paused ? 'Cho tàu chạy tiếp' : 'Dừng tàu'} onClick={() => setPaused((p) => !p)}>
                  {paused ? '▶' : 'Ⅱ'}
                </button>
                {arrived ? <ArrivalStamp id={arrived} /> : null}
              </div>
              <div className="tv-curtain l" aria-hidden />
              <div className="tv-curtain r" aria-hidden />
              <div className="tv-tie" style={{ left: -10 }} aria-hidden />
              <div className="tv-tie" style={{ right: -10 }} aria-hidden />
            </div>
            <div className="tv-table" aria-hidden />
            {ticket}
          </div>

          {/* ------------------------------------------------ cột phải */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="tv-card" style={{ background: '#101014', borderColor: '#26262C' }}>
              <h2 className="tv-h">Bảng ga</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 10px', alignItems: 'center' }}>
                <span className="tv-h" style={{ margin: 0, fontSize: 12 }}>Giờ</span>
                <Flap text={hhmm} len={5} size={20} />
                <span className="tv-h" style={{ margin: 0, fontSize: 12 }}>Tại</span>
                <Flap text={plain(station.en)} len={12} size={15} />
                <span className="tv-h" style={{ margin: 0, fontSize: 12 }}>Tới</span>
                <Flap text={plain(next.en)} len={12} size={15} />
                <span className="tv-h" style={{ margin: 0, fontSize: 12 }}>Sau</span>
                <Flap text={plain(after.en)} len={12} size={15} />
              </div>
              <div style={{ marginTop: 12, height: 6, borderRadius: 6, background: '#26262C', overflow: 'hidden' }}>
                <i style={{ display: 'block', height: '100%', width: `${Math.min(100, progress * 100)}%`, background: C.amber, transition: 'width .5s' }} />
              </div>
              <div style={{ fontFamily: MONO, fontSize: 13, color: '#B9B3A2', marginTop: 8 }}>{st.auto ? `Còn ${leftText} tới ${next.vi}` : 'Đang đỗ — bật tự chạy để đi tiếp'}</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
                <button className={`tv-icon${st.auto ? ' on' : ''}`} style={{ padding: '0 12px' }} onClick={() => st.set({ auto: !st.auto })}>
                  {st.auto ? '⏵ Tự chạy' : '⏸ Đang đỗ'}
                </button>
                <button className={`tv-icon${st.backdrop ? ' on' : ''}`} style={{ padding: '0 12px' }} title="Cảnh tàu chạy làm nền khi ôn từ vựng (quiz, học từ, kiểm tra)" onClick={() => st.set({ backdrop: !st.backdrop })}>
                  {st.backdrop ? '🖼️ Nền ôn từ: bật' : '🖼️ Nền ôn từ: tắt'}
                </button>
                <select
                  aria-label="Cách chuyển ga"
                  className="tv-icon"
                  style={{ padding: '0 10px', flex: 1 }}
                  value={st.advanceBy === 'answers' ? `a${st.perStation}` : `t${st.seconds}`}
                  onChange={(e) => {
                    const v = e.target.value;
                    setTick(0);
                    setToward(0);
                    if (v.startsWith('a')) st.set({ advanceBy: 'answers', perStation: Number(v.slice(1)) });
                    else st.set({ advanceBy: 'time', seconds: Number(v.slice(1)) });
                  }}
                >
                  <option value="a3">3 câu đúng / ga</option>
                  <option value="a5">5 câu đúng / ga</option>
                  <option value="a10">10 câu đúng / ga</option>
                  <option value="t60">1 phút / ga</option>
                  <option value="t120">2 phút / ga</option>
                  <option value="t300">5 phút / ga</option>
                </select>
              </div>
            </div>

            <div className="tv-card">
              <h2 className="tv-h">Bầu trời</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }} role="radiogroup" aria-label="Thời điểm">
                {(['auto', 'day', 'sunset', 'night'] as const).map((k) => (
                  <button key={k} role="radio" aria-checked={st.time === k} className={`tv-icon${st.time === k ? ' on' : ''}`} title={k === 'auto' ? 'Theo giờ địa phương của ga' : TIME_LABEL[k]} onClick={() => st.set({ time: k })}>
                    {k === 'auto' ? '🕰️' : k === 'day' ? '☀️' : k === 'sunset' ? '🌇' : '🌙'}
                  </button>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 6 }} role="radiogroup" aria-label="Thời tiết">
                {(['clear', 'rain', 'snow'] as const).map((k) => (
                  <button key={k} role="radio" aria-checked={st.weather === k} className={`tv-icon${st.weather === k ? ' on' : ''}`} onClick={() => st.set({ weather: k })}>
                    {k === 'clear' ? '🌤️' : k === 'rain' ? '🌧️' : '❄️'} {WEATHER_LABEL[k]}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 13, color: C.muted, marginTop: 8 }}>{st.time === 'auto' ? `Theo giờ ở ${station.vi}: ${TIME_LABEL[time].toLowerCase()}` : TIME_LABEL[time]}</div>
            </div>

            <Radio
              playing={playing}
              track={trackNow}
              onToggle={togglePlay}
              onSkip={(d) => playing && music().skip(d)}
              onTrack={(i) => {
                setTrackNow(i);
                st.set({ track: i });
                if (playing) music().start(i);
              }}
            />
          </aside>
        </div>

        {/* ------------------------------------------------ hộ chiếu */}
        <section className="tv-pass" style={{ marginTop: 28 }} aria-label="Hộ chiếu tàu">
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
            <h2 style={{ fontFamily: SERIF, fontSize: 24, margin: 0 }}>Hộ chiếu tàu</h2>
            <span style={{ fontFamily: MONO, fontSize: 13, color: '#7A6A58' }}>
              {tickets}/{STATIONS.length} dấu · đúng {st.correct}/{st.answered} câu trên tàu
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 14 }}>
            {ROUTES.flatMap((r) =>
              r.stops.map((id) => {
                const s = stationById(id);
                const got = st.tickets[id];
                const rot = (hash(id) % 14) - 7;
                return (
                  <button
                    key={id}
                    onClick={() => goTo(id, false)}
                    aria-label={`${s.vi}${got ? `, đã đóng dấu ngày ${got}` : ', chưa tới'}`}
                    className="tv-st"
                    style={{
                      appearance: 'none',
                      cursor: 'pointer',
                      background: 'transparent',
                      border: got ? `3px solid ${r.color}` : '2px dashed rgba(43,33,24,.2)',
                      color: got ? r.color : 'rgba(43,33,24,.35)',
                      transform: got ? `rotate(${rot}deg)` : undefined,
                      boxShadow: got ? `inset 0 0 0 5px ${r.color}33` : undefined,
                    }}
                  >
                    <span style={{ fontSize: 18 }}>{got ? r.glyph : '·'}</span>
                    <strong style={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: '.06em' }}>{plain(s.vi)}</strong>
                    <span>{got ? got.slice(5).split('-').reverse().join('/') : s.country}</span>
                  </button>
                );
              }),
            )}
          </div>
          <p style={{ fontSize: 14, color: '#7A6A58', margin: '14px 0 0' }}>Tàu tự tới một ga (bằng câu đúng hoặc theo giờ) là hộ chiếu có thêm một con dấu. Chọn ga bằng tay thì không tính.</p>
        </section>
      </div>

      {immersive && typeof document !== 'undefined'
        ? createPortal(
            <div className="tv-imm" role="dialog" aria-modal="true" aria-label="Toàn cảnh">
              <canvas ref={immRef} aria-hidden />
              <div style={{ position: 'absolute', left: 16, top: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 700, textShadow: '0 2px 0 rgba(0,0,0,.5)' }}>{station.vi}</span>
                <Flap text={hhmm} len={5} size={16} />
              </div>
              <div style={{ position: 'absolute', right: 16, top: 16, display: 'flex', gap: 8 }}>
                <button className="tv-btn" style={{ background: 'rgba(10,20,35,.6)' }} onClick={togglePlay}>
                  📻 {playing ? 'Ⅱ' : '▶'}
                </button>
                <button className="tv-btn" style={{ background: 'rgba(10,20,35,.6)' }} onClick={() => setImmersive(false)}>
                  ✕ Thoát (Esc)
                </button>
              </div>
              <div style={{ position: 'absolute', left: '50%', top: 72, transform: 'translateX(-50%)', width: 'min(760px, calc(100% - 24px))' }}>{ticket}</div>
              {arrived ? <ArrivalStamp id={arrived} /> : null}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function RouteLine({ route, hereIdx, progress, tickets, onPick }: { route: Route; hereIdx: number; progress: number; tickets: Record<string, string>; onPick: (id: string) => void }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const box = ref.current;
    const el = box?.querySelector('.here') as HTMLElement | null;
    // Cuộn NGANG trong sơ đồ tới ga hiện tại (không kéo cả trang như scrollIntoView).
    if (box && el) box.scrollTo({ left: el.offsetLeft - box.clientWidth / 2 + el.clientWidth / 2, behavior: 'smooth' });
  }, [hereIdx, route.id]);
  const n = route.stops.length;
  const done = Math.min(n - 1, hereIdx + Math.min(1, progress));
  return (
    <div ref={ref} className="tv-line" aria-label={`Sơ đồ tuyến ${route.vi}`}>
      <div style={{ position: 'relative', display: 'flex', minWidth: n * 84 }}>
        {/* Đường ray nối các ga + đoạn đã đi. */}
        <div aria-hidden style={{ position: 'absolute', left: 42, right: 42, top: 9, height: 4, borderRadius: 4, background: 'rgba(255,255,255,.12)' }} />
        <div aria-hidden style={{ position: 'absolute', left: 42, top: 9, height: 4, borderRadius: 4, background: route.color, width: `calc((100% - 84px) * ${done / Math.max(1, n - 1)})`, transition: 'width .6s ease' }} />
        {route.stops.map((id, i) => {
          const s = stationById(id);
          const cls = i === hereIdx ? ' here' : tickets[id] || i < hereIdx ? ' done' : '';
          return (
            <button key={id} className={`tv-dot${cls}`} onClick={() => onPick(id)} aria-current={i === hereIdx ? 'location' : undefined} style={{ position: 'relative', zIndex: 1, color: route.color, flex: '1 0 84px' }}>
              <i style={i === hereIdx ? { marginTop: -4 } : undefined} />
              <span style={{ color: i === hereIdx ? C.ink : C.muted, whiteSpace: 'nowrap' }}>{i === hereIdx ? `🚆 ${s.vi}` : s.vi}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ArrivalStamp({ id }: { id: string }) {
  const s = stationById(id);
  const r = routeOf(id);
  return (
    <div role="status" style={{ position: 'absolute', left: '50%', top: '42%', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }}>
      <div className="tv-stamp" style={{ position: 'static', borderColor: r.color, color: r.color, background: 'rgba(248,241,226,.92)', fontSize: 20, padding: '8px 18px', borderWidth: 4, whiteSpace: 'nowrap' }}>
        ✦ ĐÃ TỚI {plain(s.vi).toUpperCase()} ✦
      </div>
    </div>
  );
}

function Ticket({ phase, onPick, onNext, route, station, next, progress, leftText, auto, seat }: { phase: Phase; onPick: (i: number) => void; onNext: () => void; route: Route; station: string; next: string; progress: number; leftText: string; auto: boolean; seat: string }) {
  if (phase.k === 'empty') return <div className="tv-ticket" style={{ padding: 18 }}>Chưa có từ nào để hỏi — mở một bộ từ vựng để bắt đầu.</div>;
  const q = phase.q;
  return (
    <div className="tv-ticket">
      <div style={{ padding: '16px 18px 14px', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: MONO, fontSize: 12, letterSpacing: '.14em', color: '#7A6A58' }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: route.color, flex: 'none' }} />
          VÉ HỌC · {station.toUpperCase()} → {next.toUpperCase()}
        </div>
        <div key={q.word} className="tv-pop">
          <div style={{ fontFamily: MONO, fontSize: 12, color: '#7A6A58', marginTop: 10 }}>Chọn nghĩa đúng của</div>
          <div lang="en" style={{ fontFamily: SERIF, fontSize: 'clamp(30px, 4vw, 42px)', fontWeight: 700, lineHeight: 1.1, margin: '2px 0 14px', overflowWrap: 'anywhere' }}>
            {q.word}
          </div>
          <div className="tv-grid2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {q.options.map((o, i) => {
              const cls = phase.k === 'done' ? (i === q.answer ? ' right' : i === phase.picked ? ' wrong' : '') : '';
              return (
                <button key={i} className={`tv-opt${cls}`} disabled={phase.k !== 'ask'} onClick={() => onPick(i)}>
                  <span className="tv-kbd">{i + 1}</span>
                  {o}
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, minHeight: 36 }}>
          {phase.k === 'done' && !phase.right ? (
            <>
              <span style={{ color: C.bad }}>Nghĩa đúng: {q.options[q.answer]}</span>
              <span style={{ flex: 1 }} />
              <button className="tv-btn on" onClick={onNext}>
                Câu tiếp ↵
              </button>
            </>
          ) : auto ? (
            <>
              {/* Chuyến đi trên vé: toa nhỏ tiến dần về ga kế. */}
              <div style={{ position: 'relative', flex: 1, height: 18 }} aria-hidden>
                <div style={{ position: 'absolute', left: 0, right: 0, top: 8, borderTop: '2px dotted rgba(43,33,24,.3)' }} />
                <span style={{ position: 'absolute', top: -2, left: `calc(${Math.min(1, progress) * 100}% - 10px)`, transition: 'left .6s ease', fontSize: 16 }}>🚃</span>
                <span style={{ position: 'absolute', right: -4, top: 1, width: 12, height: 12, borderRadius: 6, background: route.color }} />
              </div>
              <span style={{ fontFamily: MONO, fontSize: 13, color: '#7A6A58', whiteSpace: 'nowrap' }}>còn {leftText}</span>
            </>
          ) : null}
        </div>
      </div>
      <div className="tv-stub">
        <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '.16em', color: '#7A6A58' }}>TOA · GHẾ</span>
        <span style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 700 }}>{seat}</span>
        <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '.16em', color: '#7A6A58', marginTop: 6 }}>PHÍM</span>
        <span style={{ fontFamily: MONO, fontSize: 13 }}>1–4 · Enter</span>
      </div>
      {phase.k === 'done' && phase.right ? <span className="tv-stamp">ĐÚNG</span> : null}
    </div>
  );
}

function Radio({ playing, track, onToggle, onSkip, onTrack }: { playing: boolean; track: number; onToggle: () => void; onSkip: (d: 1 | -1) => void; onTrack: (i: number) => void }) {
  const st = useRailStore();
  return (
    <div className="tv-card" style={{ background: 'linear-gradient(180deg,#5A3A24,#3E2716)', borderColor: '#6E4A30' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div aria-hidden style={{ width: 54, height: 54, flex: 'none', borderRadius: 12, background: 'radial-gradient(circle,#2A1A10 1.6px,transparent 1.8px) 0 0/7px 7px, #4A3020', boxShadow: 'inset 0 0 0 2px #2A1A10' }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 className="tv-h" style={{ color: '#E8C9A0', margin: 0 }}>📻 Radio toa tàu</h2>
          <div style={{ marginTop: 6, background: '#1A120A', borderRadius: 8, padding: '6px 10px', fontFamily: MONO, fontSize: 14, color: C.amber, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {playing ? '♪ ' : ''}
            {TRACKS[track]?.name}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
        <button className="tv-icon" style={{ flex: 1 }} aria-label="Bài trước" onClick={() => onSkip(-1)}>
          ⏮
        </button>
        <button className="tv-icon" style={{ flex: 2, background: playing ? C.brass : undefined, borderColor: playing ? C.brass : undefined, color: playing ? '#2A1A10' : undefined }} aria-label={playing ? 'Tắt nhạc' : 'Bật nhạc'} onClick={onToggle}>
          {playing ? 'Ⅱ Tắt' : '▶ Bật nhạc'}
        </button>
        <button className="tv-icon" style={{ flex: 1 }} aria-label="Bài sau" onClick={() => onSkip(1)}>
          ⏭
        </button>
      </div>
      <select aria-label="Chọn bài" className="tv-icon" style={{ width: '100%', marginTop: 6, padding: '0 10px' }} value={track} onChange={(e) => onTrack(Number(e.target.value))}>
        {TRACKS.map((t, i) => (
          <option key={t.name} value={i}>
            {String(i + 1).padStart(2, '0')} · {t.name}
          </option>
        ))}
      </select>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginTop: 6 }} role="radiogroup" aria-label="Phong cách">
        {(Object.keys(STYLE_LABEL) as MusicStyle[]).map((k) => (
          <button key={k} role="radio" aria-checked={st.style === k} className="tv-icon" style={st.style === k ? { background: C.brass, borderColor: C.brass, color: '#2A1A10' } : undefined} onClick={() => st.set({ style: k })}>
            {STYLE_LABEL[k]}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
        <span aria-hidden>🔈</span>
        <input className="tv-range" type="range" min={0} max={1} step={0.05} value={st.volume} onChange={(e) => st.set({ volume: Number(e.target.value) })} aria-label="Âm lượng" />
        <span aria-hidden>🔊</span>
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 8, fontSize: 14, color: '#E8C9A0' }}>
        <label style={{ display: 'inline-flex', gap: 6, alignItems: 'center', cursor: 'pointer' }}>
          <input type="checkbox" checked={st.rainSound} onChange={(e) => st.set({ rainSound: e.target.checked })} style={{ accentColor: C.brass }} /> Tiếng mưa
        </label>
        <label style={{ display: 'inline-flex', gap: 6, alignItems: 'center', cursor: 'pointer' }}>
          <input type="checkbox" checked={st.autoTrack} onChange={(e) => st.set({ autoTrack: e.target.checked })} style={{ accentColor: C.brass }} /> Đổi bài mỗi 5 ga
        </label>
      </div>
    </div>
  );
}
