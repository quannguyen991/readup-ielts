import {useEffect, useRef, useState} from 'react';

export type SceneBg = {
  /** Không đuôi, ví dụ "/bg/road" → /bg/road.webm, /bg/road.mp4, /bg/road-poster.jpg */
  base: string;
};

/**
 * Video nền lặp, tắt tiếng, nằm sau khung chữ.
 * - Ảnh bìa hiện ngay; video chỉ tải sau khi trang rảnh (preload="metadata").
 * - Dừng khi tab ẩn hoặc khi người dùng bật "giảm chuyển động" (chỉ còn ảnh bìa).
 * - Đổi `scene.base` → chuyển cảnh mờ dần (cross-fade), không nháy.
 */
export function SceneBackground({scene}: {scene: SceneBg}) {
  const [state, setState] = useState(() => ({
    sceneBase: scene.base,
    layers: [{key: scene.base, base: scene.base}],
  }));
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const layers = state.layers;

  if (state.sceneBase !== scene.base) {
    setState((current) => ({
      sceneBase: scene.base,
      layers: current.sceneBase === scene.base ? current.layers : [...current.layers.slice(-1), {key: scene.base, base: scene.base}],
    }));
  }

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => setState((current) => ({ ...current, layers: current.layers.slice(-1) })), 900);
    return () => window.clearTimeout(id);
  }, [scene.base]);

  return (
    <div aria-hidden style={{position: 'fixed', inset: 0, zIndex: 0, background: '#0b130c'}}>
      {layers.map((l, i) => (
        <BgVideo key={l.key} base={l.base} reduced={reduced} fadeIn={i > 0 || layers.length === 1} />
      ))}
    </div>
  );
}

function BgVideo({base, reduced, fadeIn}: {base: string; reduced: boolean; fadeIn: boolean}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [shown, setShown] = useState(!fadeIn);

  useEffect(() => {
    const v = ref.current;
    if (!v || reduced) return;
    const onVis = () => (document.hidden ? v.pause() : void v.play().catch(() => {}));
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [reduced]);

  const poster = `${base}-poster.jpg`;
  const fill: React.CSSProperties = {
    position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
    opacity: shown ? 1 : 0, transition: 'opacity 800ms ease',
  };

  if (reduced) return <img src={poster} alt="" style={{...fill, opacity: 1}} />;

  return (
    <video
      ref={ref}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      poster={poster}
      onCanPlay={() => setShown(true)}
      style={fill}
    >
      <source src={`${base}.webm`} type="video/webm" />
      <source src={`${base}.mp4`} type="video/mp4" />
    </video>
  );
}

/* Cách dùng:
 *   <SceneBackground scene={{base: '/bg/road'}} />
 *   <main style={{position: 'relative', zIndex: 1}}>…khung chữ bên trái…</main>
 * Mỗi cảnh một bộ: road.webm, road.mp4, road-poster.jpg đặt trong public/bg/.
 */
