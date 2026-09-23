/**
 * VIÊN ĐÁ QUÝ NHỎ Ở GÓC THẺ KHỐI (`Gem3D.tsx`). CHỈ CHẠY TRÊN WEB, tải lúc cần.
 * Hình học, ánh sáng và shader của đá nằm ở `gem-core.ts`.
 *
 * MỘT BỘ VẼ WEBGL CHO MỌI VIÊN: trình duyệt chỉ cho mở một số ít ngữ cảnh WebGL
 * một lúc (Chrome ~16), mà một trang có thể có sáu, bảy thẻ. Nên cả trang dùng
 * chung một `WebGLRenderer` vẽ ra khung ẩn; vẽ xong viên nào thì chép ngay sang
 * khung 2D của thẻ đó (`drawImage`).
 *
 * TIẾT KIỆM MÁY: viên nào ra khỏi màn hình thì thôi vẽ; tab ẩn thì dừng hết;
 * người đặt "giảm chuyển động" chỉ được một khung tĩnh.
 */
import * as THREE from 'three';

import { disposeScene, gemEnvironment, gemGeometry, gemMaterial, glints, halo, GEM_COLORS, type Cut, type GemColor } from './gem-core';

export type GemSpec = { cut: Cut; color: GemColor; /** Viên nhỏ bay quanh viên chính. */ companion?: GemColor };

export type GemHandle = { dispose: () => void; setBoost: (on: boolean) => void };

type View = {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  tick: (t: number, dt: number, boost: number) => void;
  visible: boolean;
  boost: number;
  target: number;
};

/** Cạnh khung vẽ chung, điểm ảnh thật — đủ cho ô 128px CSS ở mật độ 2x. */
const RT = 256;

let renderer: THREE.WebGLRenderer | null = null;
let raf = 0;
let lastFrame = 0;
const views = new Set<View>();

function getRenderer(): THREE.WebGLRenderer {
  if (renderer) return renderer;
  const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  r.setPixelRatio(1);
  r.setSize(RT, RT, false);
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.toneMapping = THREE.ACESFilmicToneMapping;
  r.toneMappingExposure = 1.05;
  r.setClearColor(0x000000, 0);
  renderer = r;
  return r;
}

function draw(v: View) {
  const r = getRenderer();
  const { width: w, height: h } = v.canvas;
  r.setScissorTest(true);
  r.setViewport(0, 0, w, h);
  r.setScissor(0, 0, w, h);
  r.clear();
  r.render(v.scene, v.camera);
  // Gốc toạ độ WebGL ở góc DƯỚI trái: vùng vừa vẽ nằm ở đáy khung chung.
  v.ctx.clearRect(0, 0, w, h);
  v.ctx.drawImage(r.domElement, 0, RT - h, w, h, 0, 0, w, h);
}

function loop(now: number) {
  raf = requestAnimationFrame(loop);
  if (document.hidden) return;
  const dt = lastFrame ? Math.min(0.05, (now - lastFrame) / 1000) : 1 / 60;
  lastFrame = now;
  const t = now / 1000;
  for (const v of views) {
    if (!v.visible) continue;
    v.boost += (v.target - v.boost) * Math.min(1, dt * 5);
    v.tick(t, dt, v.boost);
    draw(v);
  }
}

/** Gắn một viên đá vào khung `canvas`. Trả về hàm huỷ và công tắc "thẻ đang được rê chuột". */
export function mountGem(canvas: HTMLCanvasElement, spec: GemSpec, size: number): GemHandle {
  const r = getRenderer();
  const env = gemEnvironment(r);
  const px = Math.min(RT, Math.round(size * Math.min(window.devicePixelRatio || 1, 2)));
  canvas.width = px;
  canvas.height = px;
  const ctx = canvas.getContext('2d')!;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 1.3, 6.1);
  camera.lookAt(0, -0.08, 0);

  const color = GEM_COLORS[spec.color];
  const back = halo(color, 3.1, 0.32);
  back.position.set(0, -0.05, -1.4);
  scene.add(back);

  const root = new THREE.Group();
  scene.add(root);
  const gem = new THREE.Mesh(gemGeometry(spec.cut), gemMaterial(env, color, { body: spec.color === 'clear' ? 0.15 : 0.92, fire: spec.color === 'clear' ? 1.6 : 1 }));
  gem.rotation.x = 0.12;
  gem.scale.setScalar(1.22);
  root.add(gem);
  const sparkle = glints(gem, 4, 1, spec.cut.length * 13 + spec.color.length);

  let orbit: { pivot: THREE.Group; mini: THREE.Mesh; spark: (t: number) => void } | null = null;
  if (spec.companion) {
    const pivot = new THREE.Group();
    pivot.rotation.set(0.38, 0, -0.22);
    const c = GEM_COLORS[spec.companion];
    const mini = new THREE.Mesh(gemGeometry('brilliant'), gemMaterial(env, c, { body: spec.companion === 'clear' ? 0.15 : 0.92, fire: spec.companion === 'clear' ? 1.6 : 1 }));
    mini.scale.setScalar(0.3);
    pivot.add(mini);
    root.add(pivot);
    orbit = { pivot, mini, spark: glints(mini, 1, 1, 91) };
  }

  const tick = (t: number, dt: number, boost: number) => {
    gem.rotation.y += dt * (0.55 + boost * 1.9);
    gem.rotation.z = Math.sin(t * 0.8) * 0.06;
    root.position.y = Math.sin(t * 1.4) * 0.06;
    root.scale.setScalar(1 + boost * 0.08);
    sparkle(t);
    if (orbit) {
      const a = t * (0.8 + boost * 1.5);
      orbit.mini.position.set(Math.cos(a) * 1.5, 0, Math.sin(a) * 1.5);
      orbit.mini.rotation.y += dt * 2;
      orbit.spark(t);
    }
  };

  const view: View = { canvas, ctx, scene, camera, tick, visible: true, boost: 0, target: 0 };
  const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const io = new IntersectionObserver((entries) => {
    view.visible = entries.some((e) => e.isIntersecting);
    if (still && view.visible) draw(view);
  });
  io.observe(canvas);

  if (still) {
    // Khung tĩnh: chọn một thời điểm có tia lấp lánh đang sáng.
    tick(2.2, 0, 0);
    draw(view);
  } else {
    views.add(view);
    if (!raf) {
      lastFrame = 0;
      raf = requestAnimationFrame(loop);
    }
  }

  return {
    setBoost: (on) => {
      view.target = on ? 1 : 0;
    },
    dispose: () => {
      views.delete(view);
      io.disconnect();
      if (views.size === 0 && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
      disposeScene(scene);
    },
  };
}
