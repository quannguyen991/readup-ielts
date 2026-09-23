/**
 * VIÊN ĐÁ QUÝ LỚN Ở PHẦN ĐẦU TRANG — dấu hiệu riêng của ReadUp. CHỈ CHẠY TRÊN
 * WEB, tải lúc cần (`Hero3D.tsx`). Đá dựng ở `gem-core.ts`.
 *
 * Mỗi mảng một giác cắt và một màu đá, nên nhìn phần đầu trang là biết đang ở
 * đâu: trang chủ kim cương trắng, SAT Math thạch anh tím giác vuông, SAT Verbal
 * ruby bầu dục, Từ vựng ngọc lục bảo giác bậc thang, Tiến độ topaz vàng. Quanh
 * viên chính là vài viên nhỏ bay trên một quỹ đạo nghiêng.
 *
 * TIẾT KIỆM MÁY: ngừng vẽ khi khung ra khỏi màn hình hoặc tab bị ẩn; người đặt
 * "giảm chuyển động" chỉ được một khung tĩnh; độ phân giải tối đa 2x.
 */
import * as THREE from 'three';

import { disposeScene, gemEnvironment, gemGeometry, gemMaterial, glints, glintTexture, halo, releaseEnvironment, rng, GEM_COLORS, type Cut, type GemColor } from './gem-core';

export type SceneKind = 'home' | 'math' | 'verbal' | 'vocab' | 'progress';

type Preset = { cut: Cut; color: GemColor; glow: string; moons: GemColor[] };

const PRESETS: Record<SceneKind, Preset> = {
  home: { cut: 'brilliant', color: 'clear', glow: '#8B7CFF', moons: ['sapphire', 'ruby', 'emerald'] },
  math: { cut: 'princess', color: 'amethyst', glow: '#A78BFA', moons: ['clear', 'topaz'] },
  verbal: { cut: 'oval', color: 'ruby', glow: '#FB7185', moons: ['clear', 'pink'] },
  vocab: { cut: 'emerald', color: 'emerald', glow: '#34D399', moons: ['clear', 'sapphire'] },
  progress: { cut: 'brilliant', color: 'topaz', glow: '#FBBF24', moons: ['clear', 'amethyst', 'sapphire'] },
};

/** Bóng mềm dưới viên đá: viên đá lơ lửng trên nền chứ không dán lên trang. */
function groundShadow(): THREE.Sprite {
  const S = 128;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  grad.addColorStop(0, 'rgba(49,46,129,0.38)');
  grad.addColorStop(0.5, 'rgba(49,46,129,0.14)');
  grad.addColorStop(1, 'rgba(49,46,129,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, S, S);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
}

/** Gắn viên đá của mảng `kind` vào `host`; trả về hàm huỷ. */
export function mountHeroGem(host: HTMLElement, kind: SceneKind): () => void {
  const preset = PRESETS[kind];
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  Object.assign(canvas.style, { width: '100%', height: '100%', display: 'block' });
  host.appendChild(canvas);

  const env = gemEnvironment(renderer);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);

  const stage = new THREE.Group();
  scene.add(stage);

  const back = halo(preset.glow, 6.2, 0.5);
  back.position.set(0, 0.1, -2.2);
  stage.add(back);

  const shadow = groundShadow();
  shadow.position.set(0, -2.15, -0.5);
  shadow.scale.set(3.4, 0.7, 1);
  stage.add(shadow);

  const main = new THREE.Mesh(gemGeometry(preset.cut), gemMaterial(env, GEM_COLORS[preset.color], { body: preset.color === 'clear' ? 0.12 : 0.92, fire: preset.color === 'clear' ? 1.6 : 1 }));
  main.scale.setScalar(1.62);
  main.rotation.x = 0.1;
  const floatGroup = new THREE.Group();
  floatGroup.add(main);
  stage.add(floatGroup);
  const sparkle = glints(main, 7, 1, 5);

  // Quỹ đạo nghiêng: một vệt sáng mảnh và các viên nhỏ chạy trên đó.
  const orbit = new THREE.Group();
  orbit.rotation.set(0.42, 0, -0.26);
  stage.add(orbit);
  const R = 2.55;
  const trail = new THREE.Mesh(
    new THREE.TorusGeometry(R, 0.007, 6, 160),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  trail.rotation.x = Math.PI / 2;
  orbit.add(trail);
  const moons = preset.moons.map((c, i) => {
    const m = new THREE.Mesh(gemGeometry(i % 2 === 0 ? 'brilliant' : 'princess'), gemMaterial(env, GEM_COLORS[c], { body: c === 'clear' ? 0.12 : 0.92, fire: c === 'clear' ? 1.6 : 1 }));
    m.scale.setScalar(0.42);
    orbit.add(m);
    return { m, spark: glints(m, 1, 1, 30 + i), phase: (i / preset.moons.length) * Math.PI * 2 };
  });

  // Bụi sáng li ti bay lên chậm quanh viên đá.
  const rand = rng(kind.length * 7 + 3);
  const dustCount = 22;
  const dustPos = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i += 1) {
    dustPos[i * 3] = (rand() - 0.5) * 5.2;
    dustPos[i * 3 + 1] = (rand() - 0.5) * 4.4;
    dustPos[i * 3 + 2] = (rand() - 0.5) * 2.5;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(
    dustGeo,
    new THREE.PointsMaterial({ map: glintTexture(), size: 0.16, transparent: true, opacity: 0.75, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  stage.add(dust);

  const resize = () => {
    const w = Math.max(1, host.clientWidth);
    const h = Math.max(1, host.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Khung hẹp thì lùi camera ra để cả viên đá lẫn quỹ đạo nằm trọn trong khung.
    const d = Math.max(8.2, 11.4 / camera.aspect);
    camera.position.set(0, 1.1, d);
    camera.lookAt(0, -0.1, 0);
    camera.updateProjectionMatrix();
  };
  resize();

  const pointer = { x: 0, y: 0 };
  const onPointer = (e: PointerEvent) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
  };

  const place = (t: number, dt: number) => {
    main.rotation.y += dt * 0.38;
    main.rotation.z = Math.sin(t * 0.6) * 0.05;
    const bob = Math.sin(t * 1.1) * 0.12;
    floatGroup.position.y = bob;
    // Viên đá càng lên cao, bóng dưới càng nhạt và rộng.
    shadow.material.opacity = 0.9 - bob * 1.6;
    shadow.scale.set(3.4 + bob * 1.2, 0.7 + bob * 0.2, 1);
    for (const moon of moons) {
      const a = moon.phase + t * 0.42;
      moon.m.position.set(Math.cos(a) * R, 0, Math.sin(a) * R);
      moon.m.rotation.y += dt * 1.4;
      moon.m.rotation.x = 0.3;
      moon.spark(t);
    }
    sparkle(t);
    const p = dust.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < dustCount; i += 1) {
      let y = p.getY(i) + dt * 0.18;
      if (y > 2.3) y = -2.3;
      p.setY(i, y);
    }
    p.needsUpdate = true;
  };

  let visible = true;
  let frame = 0;
  let last = 0;
  const tick = (now: number) => {
    frame = requestAnimationFrame(tick);
    if (!visible || document.hidden) return;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    const t = now / 1000;
    place(t, dt);
    // Cả cụm nghiêng nhẹ theo con trỏ.
    stage.rotation.y += (pointer.x * 0.22 - stage.rotation.y) * 0.05;
    stage.rotation.x += (pointer.y * 0.1 - stage.rotation.x) * 0.05;
    renderer.render(scene, camera);
  };

  const ro = new ResizeObserver(resize);
  ro.observe(host);
  const io = new IntersectionObserver((entries) => {
    visible = entries.some((e) => e.isIntersecting);
  });
  io.observe(host);

  const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  if (still) {
    place(2.2, 0);
    renderer.render(scene, camera);
  } else {
    window.addEventListener('pointermove', onPointer, { passive: true });
    frame = requestAnimationFrame(tick);
  }

  return () => {
    cancelAnimationFrame(frame);
    window.removeEventListener('pointermove', onPointer);
    ro.disconnect();
    io.disconnect();
    disposeScene(scene);
    dustGeo.dispose();
    dust.material.dispose();
    releaseEnvironment(renderer);
    renderer.dispose();
    canvas.remove();
  };
}
