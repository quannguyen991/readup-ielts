/**
 * QUẢ CẦU GIỌNG NÓI — "giám khảo AI" ở giữa phòng luyện nói (người dùng
 * 30/09/2026: "cho 1 cái bong bóng tròn ở giữa, kiểu như giám khảo AI, thao tác
 * xong nói cùng").
 *
 * Bốn trạng thái, đổi màu và nhịp:
 *  - `idle`      thở chậm (xanh dương nhạt) — chờ bắt đầu;
 *  - `speaking`  giám khảo đang hỏi — vòng sóng lan ra (xanh dương → xanh trời);
 *  - `listening` đang nghe bạn — lõi phồng theo âm lượng micro (xanh lá ngọc);
 *  - `thinking`  chuẩn bị / đang chấm — xoay chậm (vàng hổ phách).
 *
 * Âm lượng: `level` (0..1) do nơi gọi đưa vào qua ref, đọc mỗi khung hình nên
 * không render lại React. Không có âm lượng thì lõi vẫn nhịp theo trạng thái.
 * Tôn trọng "giảm chuyển động".
 */
import { themedHex } from '@/theme/palette-state';
import React, { useEffect, useRef } from 'react';
import { Image, Platform, Pressable, View } from 'react-native';

import { CHIIKAWA_IMG } from '@/components/chiikawa/chiikawa';

export type OrbState = 'idle' | 'speaking' | 'listening' | 'thinking';

const PAL: Record<OrbState, [string, string, string]> = {
  idle: ['#EAD0A4', '#6A4BD9', '#6A4BD9'],
  speaking: ['#E0C699', themedHex('#8B6CF0'), '#6A4BD9'],
  listening: ['#86EFAC', '#14B8A6', '#0F766E'],
  thinking: ['#FDE68A', '#F2B632', '#6A4BD9'],
};

const CSS_ID = 'readup-voice-orb';
const CSS = `
.vo-wrap{position:relative;display:flex;align-items:center;justify-content:center}
.vo-ring{position:absolute;inset:0;border-radius:50%;border:2px solid var(--c2);opacity:0}
.vo-speaking .vo-ring{animation:vo-ring 2.2s ease-out infinite}
.vo-speaking .vo-ring:nth-child(2){animation-delay:.73s}
.vo-speaking .vo-ring:nth-child(3){animation-delay:1.46s}
@keyframes vo-ring{0%{transform:scale(.72);opacity:.55}100%{transform:scale(1.35);opacity:0}}
.vo-glow{position:absolute;inset:6%;border-radius:50%;background:radial-gradient(circle,var(--c1) 0%,transparent 70%);filter:blur(22px);opacity:.75;transition:background .6s}
.vo-core{position:absolute;inset:14%;border-radius:50%;overflow:hidden;box-shadow:0 18px 50px -12px var(--c3),inset 0 -12px 30px rgba(0,0,0,.18),inset 0 10px 24px rgba(255,255,255,.35);transition:transform .12s ease-out}
.vo-core::before{content:"";position:absolute;inset:-30%;background:conic-gradient(from 0deg,var(--c1),var(--c2),var(--c3),var(--c2),var(--c1));animation:vo-spin 9s linear infinite;transition:filter .6s}
.vo-core::after{content:"";position:absolute;left:18%;top:12%;width:38%;height:26%;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.75),rgba(255,255,255,0) 70%)}
.vo-blob{position:absolute;width:70%;height:70%;border-radius:50%;filter:blur(14px);opacity:.7;mix-blend-mode:screen}
.vo-blob.a{left:-10%;top:10%;background:var(--c1);animation:vo-drift 7s ease-in-out infinite}
.vo-blob.b{right:-12%;bottom:-8%;background:var(--c3);animation:vo-drift 9s ease-in-out infinite reverse}
@keyframes vo-spin{to{transform:rotate(360deg)}}
@keyframes vo-drift{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(12%,-10%) scale(1.15)}}
.vo-idle .vo-core{animation:vo-breathe 4.5s ease-in-out infinite}
.vo-thinking .vo-core::before{animation-duration:3.2s}
@keyframes vo-breathe{0%,100%{transform:scale(.96)}50%{transform:scale(1.03)}}
/* Chủ đề Chiikawa: không vòng sáng, Chiikawa thay cho lõi. */
.vo-ck{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;transition:transform .12s ease-out}
.vo-ck img{width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 12px 18px rgba(198,90,120,.28))}
.vo-idle .vo-ck img{animation:vo-breathe 4.5s ease-in-out infinite}
.vo-speaking .vo-ck img{animation:vo-bob 1.6s ease-in-out infinite}
.vo-thinking .vo-ck img{animation:vo-breathe 2.4s ease-in-out infinite}
@keyframes vo-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@media (prefers-reduced-motion:reduce){.vo-ring,.vo-core,.vo-core::before,.vo-blob,.vo-ck img{animation:none!important}}
`;

/** Chiikawa theo trạng thái: chờ vẫy, đang hỏi vẫy liên tục, đang nghe reo, đang chấm ló lên. */
/** Đường dẫn ảnh của một tài nguyên require(). Web không có Image.resolveAssetSource nên rơi về các dạng còn lại. */
function assetUri(mod: unknown): string {
  const resolve = (Image as unknown as { resolveAssetSource?: (m: unknown) => { uri: string } }).resolveAssetSource;
  if (typeof resolve === 'function') return resolve(mod).uri;
  if (typeof mod === 'string') return mod;
  const m = mod as { uri?: string; default?: unknown };
  if (typeof m?.uri === 'string') return m.uri;
  if (typeof m?.default === 'string') return m.default;
  return '';
}

const CK_POSE: Record<OrbState, 'wave' | 'cheer' | 'peek'> = { idle: 'wave', speaking: 'wave', listening: 'cheer', thinking: 'peek' };

function ensureCss() {
  if (typeof document === 'undefined' || document.getElementById(CSS_ID)) return;
  const el = document.createElement('style');
  el.id = CSS_ID;
  el.textContent = CSS;
  document.head.appendChild(el);
}

export function VoiceOrb({
  state,
  size = 220,
  level,
  onPress,
  label,
}: {
  state: OrbState;
  size?: number;
  /** Âm lượng micro 0..1 (ref, đọc mỗi khung hình). */
  level?: React.MutableRefObject<number>;
  onPress?: () => void;
  label: string;
}) {
  const coreRef = useRef<HTMLDivElement | null>(null);
  // Phòng nói luôn dùng Chiikawa thay quả cầu tròn (yêu cầu 16/10/2026), không phụ thuộc theme đang bật.
  const chiikawa = true;

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    ensureCss();
  }, []);

  // Lõi phồng theo âm lượng khi đang nghe (không qua React state).
  useEffect(() => {
    if (Platform.OS !== 'web' || state !== 'listening' || !level) {
      if (coreRef.current) coreRef.current.style.transform = '';
      return;
    }
    let raf = 0;
    let smooth = 0;
    const loop = () => {
      smooth += ((level.current ?? 0) - smooth) * 0.25;
      if (coreRef.current) coreRef.current.style.transform = `scale(${(0.94 + Math.min(1, smooth) * 0.26).toFixed(3)})`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [state, level]);

  const [c1, c2, c3] = PAL[state];

  if (Platform.OS !== 'web') {
    return (
      <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} disabled={!onPress}>
        <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: c2 }} />
      </Pressable>
    );
  }

  const orb = chiikawa
    ? React.createElement(
        'div',
        { className: `vo-wrap vo-${state}`, style: { width: size, height: size } },
        React.createElement(
          'div',
          { className: 'vo-ck', ref: coreRef },
          React.createElement('img', { src: assetUri(CHIIKAWA_IMG[CK_POSE[state]]), alt: '', draggable: false }),
        ),
      )
    : React.createElement(
    'div',
    { className: `vo-wrap vo-${state}`, style: { width: size, height: size, ['--c1' as string]: c1, ['--c2' as string]: c2, ['--c3' as string]: c3 } },
    React.createElement('div', { className: 'vo-ring' }),
    React.createElement('div', { className: 'vo-ring' }),
    React.createElement('div', { className: 'vo-ring' }),
    React.createElement('div', { className: 'vo-glow' }),
    React.createElement('div', { className: 'vo-core', ref: coreRef }, React.createElement('div', { className: 'vo-blob a' }), React.createElement('div', { className: 'vo-blob b' })),
  );

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={label}
      onPress={onPress}
      disabled={!onPress}
      style={({ hovered }: { hovered?: boolean }) => ({ borderRadius: size / 2, transform: [{ scale: onPress && hovered ? 1.03 : 1 }], transition: 'transform 200ms ease' }) as object}
    >
      {orb}
    </Pressable>
  );
}

/**
 * Âm lượng micro (0..1) vào một ref — chỉ trên máy tính (web, có chuột), để
 * không tranh micro với bộ nhận giọng trên điện thoại. Lỗi / bị từ chối thì
 * ref đứng ở 0, quả cầu vẫn chạy theo trạng thái.
 */
export function useMicLevel(active: boolean): React.MutableRefObject<number> {
  const level = useRef(0);
  useEffect(() => {
    if (Platform.OS !== 'web' || !active || typeof window === 'undefined') return;
    if (!window.matchMedia?.('(pointer: fine)').matches || !navigator.mediaDevices?.getUserMedia) return;
    let stopped = false;
    let raf = 0;
    let stream: MediaStream | null = null;
    let ctx: AudioContext | null = null;
    navigator.mediaDevices
      .getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })
      .then((s) => {
        if (stopped) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        ctx = new AudioContext();
        const an = ctx.createAnalyser();
        an.fftSize = 512;
        ctx.createMediaStreamSource(s).connect(an);
        const buf = new Uint8Array(an.fftSize);
        const loop = () => {
          an.getByteTimeDomainData(buf);
          let sum = 0;
          for (let i = 0; i < buf.length; i++) {
            const v = (buf[i]! - 128) / 128;
            sum += v * v;
          }
          level.current = Math.min(1, Math.sqrt(sum / buf.length) * 5);
          raf = requestAnimationFrame(loop);
        };
        loop();
      })
      .catch(() => {
        level.current = 0;
      });
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      void ctx?.close();
      level.current = 0;
    };
  }, [active]);
  return level;
}
