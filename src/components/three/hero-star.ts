/**
 * NGÔI SAO PHÁT SÁNG Ở PHẦN ĐẦU TRANG — dấu hiệu riêng của ReadUp. CHỈ CHẠY TRÊN
 * WEB, tải lúc cần (`Hero3D.tsx`). Sao dựng ở `glow-core.ts`.
 *
 * Sao TRẮNG (người dùng chọn), còn quầng và vành tia sáng phía sau mang màu của
 * mảng, nên nhìn phần đầu trang vẫn biết đang ở đâu: trang chủ vàng, SAT Math tím,
 * SAT Verbal hồng, Từ vựng xanh ngọc, Tiến độ hổ phách. Quầng màu cũng là thứ viền
 * cho sao trắng nổi lên trên nền sáng. Quanh sao là vài ngôi sao nhỏ bay trên một
 * quỹ đạo nghiêng. Sao đung đưa nhẹ, thở sáng theo nhịp, và cứ vài
 * giây lại xoay một vòng — như ngôi sao thưởng trong game.
 *
 * TIẾT KIỆM MÁY: ngừng vẽ khi khung ra khỏi màn hình hoặc tab bị ẩn; người đặt
 * "giảm chuyển động" chỉ được một khung tĩnh; độ phân giải tối đa 2x.
 */
import * as THREE from 'three';

import { disposeScene, glintTexture, halo, raysSprite, releaseEnvironment, rng, starGeometry, starMaterial, studioEnvironment } from './glow-core';

export type SceneKind = 'home' | 'math' | 'verbal' | 'vocab' | 'progress';

type Preset = { tint: string; glow: string; moons: string[] };

const WHITE = '#FFFFFF';

const PRESETS: Record<SceneKind, Preset> = {
  home: { tint: WHITE, glow: '#FFB020', moons: [WHITE, WHITE, WHITE] },
  math: { tint: WHITE, glow: '#8B5CF6', moons: [WHITE, WHITE] },
  verbal: { tint: WHITE, glow: '#F43F5E', moons: [WHITE, WHITE] },
  vocab: { tint: WHITE, glow: '#10B981', moons: [WHITE, WHITE] },
  progress: { tint: WHITE, glow: '#F59E0B', moons: [WHITE, WHITE, WHITE] },
};

/** Bóng mềm dưới ngôi sao: sao lơ lửng trên nền chứ không dán lên trang. */
function groundShadow(): THREE.Sprite {
  const S = 128;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  grad.addColorStop(0, 'rgba(49,46,129,0.34)');
  grad.addColorStop(0.5, 'rgba(49,46,129,0.12)');
  grad.addColorStop(1, 'rgba(49,46,129,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, S, S);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
}

/** Nhịp xoay một vòng: 0 lúc đứng, lên 2π trong 0,9 giây mỗi 7 giây, êm hai đầu. */
function spinAt(t: number): number {
  const period = 7;
  const spin = 0.9;
  const k = (t % period) / spin;
  if (k >= 1) return 0;
  const eased = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
  return eased * Math.PI * 2;
}

/** Gắn ngôi sao của mảng `kind` vào `host`; trả về hàm huỷ. */
export function mountHeroStar(host: HTMLElement, kind: SceneKind): () => void {
  const preset = PRESETS[kind];
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  Object.assign(canvas.style, { width: '100%', height: '100%', display: 'block' });
  host.appendChild(canvas);

  const env = studioEnvironment(renderer);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);

  const stage = new THREE.Group();
  scene.add(stage);

  const back = halo(preset.glow, 6.6, 0.55);
  back.position.set(0, 0.1, -2.4);
  stage.add(back);

  const rays = raysSprite(preset.glow, 7.4, 0.42);
  rays.position.set(0, 0.1, -2);
  stage.add(rays);

  const shadow = groundShadow();
  shadow.position.set(0, -2.15, -0.5);
  shadow.scale.set(3, 0.6, 1);
  stage.add(shadow);

  const mainMat = starMaterial(env, preset.tint);
  const main = new THREE.Mesh(starGeometry(), mainMat);
  main.scale.setScalar(1.45);
  const floatGroup = new THREE.Group();
  floatGroup.add(main);
  stage.add(floatGroup);

  // Loé sáng ở lõi và ở bốn đầu cánh, lệch nhịp nhau.
  const flareMat = new THREE.SpriteMaterial({ map: glintTexture(), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
  const core = new THREE.Sprite(flareMat);
  core.position.set(0, 0, 0.42);
  main.add(core);
  const tips = [
    [0, 1.18],
    [1, 0],
    [0, -1.18],
    [-1, 0],
  ].map(([x, y], i) => {
    const s = new THREE.Sprite(flareMat);
    s.position.set(x! * 0.96, y! * 0.96, 0.08);
    main.add(s);
    return { s, phase: i * 1.7 };
  });

  // Quỹ đạo nghiêng: một vệt sáng mảnh và các ngôi sao nhỏ chạy trên đó.
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
  const moonGeo = starGeometry(96, 0.3);
  const moons = preset.moons.map((c, i) => {
    const mat = starMaterial(env, c);
    const m = new THREE.Mesh(moonGeo, mat);
    m.scale.setScalar(0.34);
    orbit.add(m);
    return { m, mat, phase: (i / preset.moons.length) * Math.PI * 2 };
  });

  // Bụi sáng li ti bay lên chậm quanh ngôi sao.
  const rand = rng(kind.length * 7 + 3);
  const dustCount = 26;
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
    new THREE.PointsMaterial({ map: glintTexture(), size: 0.16, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  stage.add(dust);

  const resize = () => {
    const w = Math.max(1, host.clientWidth);
    const h = Math.max(1, host.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Khung hẹp thì lùi camera ra để cả ngôi sao lẫn quỹ đạo nằm trọn trong khung.
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
    // Đung đưa nhẹ (không quay ngang hẳn — sao phẳng nhìn nghiêng thì mất dáng),
    // và cứ bảy giây xoay trọn một vòng.
    main.rotation.y = Math.sin(t * 0.7) * 0.5 + spinAt(t);
    main.rotation.z = Math.sin(t * 0.5) * 0.08;
    const bob = Math.sin(t * 1.1) * 0.12;
    floatGroup.position.y = bob;
    shadow.material.opacity = 0.9 - bob * 1.6;
    shadow.scale.set(3 + bob * 1.2, 0.6 + bob * 0.2, 1);

    const pulse = 0.5 + 0.5 * Math.sin(t * 2.4);
    mainMat.uniforms.pulse!.value = pulse;
    back.material.opacity = 0.5 + pulse * 0.2;
    rays.material.rotation = t * 0.12;
    rays.material.opacity = 0.36 + pulse * 0.18;
    rays.scale.setScalar(7.1 + pulse * 0.5);
    core.scale.setScalar(0.45 + pulse * 0.35);
    for (const tip of tips) {
      // Nhọn và ngắn: phần lớn thời gian tắt, loé trong chốc lát.
      const k = Math.pow(Math.max(0, Math.sin(t * 0.9 + tip.phase)), 18);
      tip.s.scale.setScalar(k * 0.7);
    }

    for (const moon of moons) {
      const a = moon.phase + t * 0.42;
      moon.m.position.set(Math.cos(a) * R, 0, Math.sin(a) * R);
      moon.m.rotation.y += dt * 1.6;
      moon.mat.uniforms.pulse!.value = 0.5 + 0.5 * Math.sin(t * 3 + moon.phase);
    }
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
    moonGeo.dispose();
    dustGeo.dispose();
    dust.material.dispose();
    releaseEnvironment(renderer);
    renderer.dispose();
    canvas.remove();
  };
}
