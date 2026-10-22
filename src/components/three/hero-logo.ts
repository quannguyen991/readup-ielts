/**
 * LOGO BAND 9 DẠNG 3D ở phần đầu trang (web). Khối vuông xanh đậm phủ bóng như sơn mài, chữ B ghép từ
 * các mảng kem nổi lên mặt khối, ô vuông vàng kim ánh kim loại. Khối xoay nhanh trọn một vòng cứ 8 giây
 * (êm hai đầu), lắc nhẹ và nghiêng theo chuột; một vệt sáng vàng lướt qua mặt; ba khối vàng nhỏ bay trên
 * quỹ đạo nghiêng; bụi vàng trôi lên.
 *
 * TIẾT KIỆM MÁY: ngừng vẽ khi khuất khung / tab ẩn; "giảm chuyển động" chỉ vẽ một khung tĩnh; độ phân giải
 * tối đa 2x.
 */
import * as THREE from 'three';

import { disposeScene, glintTexture, halo, releaseEnvironment, rng, studioEnvironment } from './glow-core';

const NAVY = '#0F1D33';
const CREAM = '#F3EDE1';
const GOLD = '#B8893E';

/** Đơn vị khung logo (0..100) → đơn vị cảnh, lật trục y. */
const K = 0.034;
const P = (x: number, y: number) => new THREE.Vector2((x - 50) * K, (50 - y) * K);

function rect(x: number, y: number, w: number, h: number): THREE.Shape {
  const s = new THREE.Shape();
  const a = P(x, y);
  const b = P(x + w, y + h);
  s.moveTo(a.x, a.y);
  s.lineTo(b.x, a.y);
  s.lineTo(b.x, b.y);
  s.lineTo(a.x, b.y);
  s.closePath();
  return s;
}

function roundedSquare(r: number): THREE.Shape {
  const s = new THREE.Shape();
  const lo = -50 * K;
  const hi = 50 * K;
  const R = r * K;
  s.moveTo(lo + R, lo);
  s.lineTo(hi - R, lo);
  s.quadraticCurveTo(hi, lo, hi, lo + R);
  s.lineTo(hi, hi - R);
  s.quadraticCurveTo(hi, hi, hi - R, hi);
  s.lineTo(lo + R, hi);
  s.quadraticCurveTo(lo, hi, lo, hi - R);
  s.lineTo(lo, lo + R);
  s.quadraticCurveTo(lo, lo, lo + R, lo);
  return s;
}

/** Thuỳ chữ B: cạnh trái thẳng từ x0 tới cx, nửa elip bên phải tâm (cx, cy). */
function bowl(x0: number, top: number, bottom: number, cx: number, rx: number): THREE.Shape {
  const cy = (top + bottom) / 2;
  const ry = (bottom - top) / 2;
  const s = new THREE.Shape();
  const a = P(x0, top);
  const c = P(cx, cy);
  s.moveTo(a.x, a.y);
  s.lineTo(c.x, a.y);
  s.absellipse(c.x, c.y, rx * K, ry * K, Math.PI / 2, -Math.PI / 2, true, 0);
  const d = P(x0, bottom);
  s.lineTo(d.x, d.y);
  s.closePath();
  return s;
}

/** Nét "9" góc phải dưới: vuông ba góc, góc trái dưới bo tròn. */
function nine(): THREE.Shape {
  const s = new THREE.Shape();
  const a = P(64, 47);
  const b = P(89, 47);
  const c = P(89, 86);
  const d = P(82, 86);
  const center = P(82, 68);
  s.moveTo(a.x, a.y);
  s.lineTo(b.x, b.y);
  s.lineTo(c.x, c.y);
  s.lineTo(d.x, d.y);
  s.absarc(center.x, center.y, 18 * K, -Math.PI / 2, -Math.PI, true);
  s.closePath();
  return s;
}

function extrude(shape: THREE.Shape, depth: number, bevel: number): THREE.ExtrudeGeometry {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 4, curveSegments: 48 });
  g.computeVertexNormals();
  return g;
}

/** Bóng mềm dưới khối (ấm, không tím). */
function groundShadow(): THREE.Sprite {
  const S = 128;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  grad.addColorStop(0, 'rgba(90,67,24,0.34)');
  grad.addColorStop(0.5, 'rgba(90,67,24,0.12)');
  grad.addColorStop(1, 'rgba(90,67,24,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, S, S);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
}

/** Xoay trọn một vòng: 1,1 giây, mỗi 8 giây, êm hai đầu. */
function spinAt(t: number): number {
  const period = 8;
  const spin = 1.1;
  const k = (t % period) / spin;
  if (k >= 1) return 0;
  const eased = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
  return eased * Math.PI * 2;
}

export function mountHeroLogo(host: HTMLElement): () => void {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  Object.assign(canvas.style, { width: '100%', height: '100%', display: 'block' });
  host.appendChild(canvas);

  const env = studioEnvironment(renderer);
  const scene = new THREE.Scene();
  scene.environment = env;
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);

  scene.add(new THREE.AmbientLight(0xffffff, 0.35));
  const key = new THREE.DirectionalLight(0xfff1d6, 1.6);
  key.position.set(3, 4, 6);
  scene.add(key);
  const sweep = new THREE.PointLight(0xffd98a, 0, 7, 1.6);
  scene.add(sweep);

  const stage = new THREE.Group();
  scene.add(stage);

  const back = halo('#E8B86A', 6.8, 0.5);
  back.position.set(0, 0.1, -2.4);
  stage.add(back);

  const shadow = groundShadow();
  shadow.position.set(0, -2.35, -0.5);
  shadow.scale.set(3.4, 0.62, 1);
  stage.add(shadow);

  // ---------------------------------------------------------------- khối logo
  const navyMat = new THREE.MeshPhysicalMaterial({ color: NAVY, roughness: 0.32, metalness: 0.15, clearcoat: 1, clearcoatRoughness: 0.12, envMapIntensity: 0.9 });
  const creamMat = new THREE.MeshPhysicalMaterial({ color: CREAM, roughness: 0.42, metalness: 0, clearcoat: 0.4, clearcoatRoughness: 0.3, envMapIntensity: 0.6 });
  const goldMat = new THREE.MeshPhysicalMaterial({ color: GOLD, roughness: 0.34, metalness: 0.85, envMapIntensity: 0.75, emissive: new THREE.Color('#6B4E1C'), emissiveIntensity: 0.2 });

  const PLATE = 0.42;
  const plateBevel = 0.06;
  const plate = new THREE.Mesh(extrude(roundedSquare(6), PLATE, plateBevel), navyMat);
  plate.position.z = -PLATE / 2;

  const front = PLATE / 2 + plateBevel;
  const pieces = new THREE.Group();
  pieces.position.z = front - 0.01;
  const raise = 0.1;
  const bevel = 0.012;
  const add = (shape: THREE.Shape, mat: THREE.Material, depth = raise) => {
    const m = new THREE.Mesh(extrude(shape, depth, bevel), mat);
    pieces.add(m);
    return m;
  };
  add(rect(14, 12, 19, 74), creamMat);
  add(bowl(37, 12, 44, 45, 15), creamMat);
  add(bowl(37, 47, 86, 46, 15), creamMat);
  add(nine(), creamMat);
  const goldSq = add(rect(64, 12, 25, 32), goldMat, raise * 1.8);

  const logo = new THREE.Group();
  logo.add(plate, pieces);
  logo.scale.setScalar(0.9);
  const floatGroup = new THREE.Group();
  floatGroup.add(logo);
  stage.add(floatGroup);

  // Loé sáng trên ô vàng.
  const flareMat = new THREE.SpriteMaterial({ map: glintTexture(), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
  const flare = new THREE.Sprite(flareMat);
  const gc = P(76.5, 28);
  flare.position.set(gc.x, gc.y, raise * 2 + 0.05);
  goldSq.add(flare);

  // ---------------------------------------------------------------- quỹ đạo
  const orbit = new THREE.Group();
  orbit.rotation.set(0.42, 0, -0.26);
  stage.add(orbit);
  const R = 2.35;
  const trail = new THREE.Mesh(
    new THREE.TorusGeometry(R, 0.007, 6, 160),
    new THREE.MeshBasicMaterial({ color: 0xf1d9a6, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  trail.rotation.x = Math.PI / 2;
  orbit.add(trail);
  const cubeGeo = new THREE.BoxGeometry(0.26, 0.26, 0.26);
  const cubes = [0, 1, 2].map((i) => {
    const m = new THREE.Mesh(cubeGeo, goldMat);
    orbit.add(m);
    return { m, phase: (i / 3) * Math.PI * 2 };
  });

  // Bụi vàng li ti bay lên chậm.
  const rand = rng(91);
  const dustCount = 24;
  const dustPos = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i += 1) {
    dustPos[i * 3] = (rand() - 0.5) * 5.4;
    dustPos[i * 3 + 1] = (rand() - 0.5) * 4.6;
    dustPos[i * 3 + 2] = (rand() - 0.5) * 2.5;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(
    dustGeo,
    new THREE.PointsMaterial({ map: glintTexture(), color: 0xffe2a6, size: 0.15, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  stage.add(dust);

  const resize = () => {
    const w = Math.max(1, host.clientWidth);
    const h = Math.max(1, host.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const d = Math.max(8.5, 9.5 / camera.aspect);
    camera.position.set(0, 0.9, d);
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
    logo.rotation.y = Math.sin(t * 0.6) * 0.42 + spinAt(t);
    logo.rotation.x = Math.sin(t * 0.45) * 0.08 - 0.06;
    const bob = Math.sin(t * 1.05) * 0.12;
    floatGroup.position.y = bob;
    shadow.material.opacity = 0.9 - bob * 1.6;
    shadow.scale.set(3.4 + bob * 1.2, 0.62 + bob * 0.2, 1);

    // Vệt sáng vàng quét ngang mặt khối mỗi 5 giây.
    const k = (t % 5) / 5;
    sweep.position.set(-4 + k * 8, 1.2 - k * 1.4, 2.2);
    sweep.intensity = Math.sin(Math.PI * Math.min(1, k * 1.6)) * 18;

    const pulse = 0.5 + 0.5 * Math.sin(t * 2.2);
    back.material.opacity = 0.44 + pulse * 0.16;
    goldMat.emissiveIntensity = 0.1 + pulse * 0.18;
    flare.scale.setScalar(Math.pow(Math.max(0, Math.sin(t * 0.8)), 14) * 0.9);

    for (const c of cubes) {
      const a = c.phase + t * 0.4;
      c.m.position.set(Math.cos(a) * R, 0, Math.sin(a) * R);
      c.m.rotation.x += dt * 1.2;
      c.m.rotation.y += dt * 1.7;
    }
    const p = dust.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < dustCount; i += 1) {
      let y = p.getY(i) + dt * 0.18;
      if (y > 2.4) y = -2.4;
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
    place(now / 1000, dt);
    stage.rotation.y += (pointer.x * 0.2 - stage.rotation.y) * 0.05;
    stage.rotation.x += (pointer.y * 0.08 - stage.rotation.x) * 0.05;
    renderer.render(scene, camera);
  };

  // Giảm chuyển động: một khung tĩnh, không vòng lặp. Khung đổi cỡ thì vẽ lại khung đó.
  const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const drawStill = () => {
    place(2.2, 0);
    renderer.render(scene, camera);
  };
  if (still) drawStill();

  const ro = new ResizeObserver(() => {
    resize();
    if (still) drawStill();
  });
  ro.observe(host);
  const io = new IntersectionObserver((entries) => {
    visible = entries.some((e) => e.isIntersecting);
  });
  io.observe(host);

  if (!still) {
    window.addEventListener('pointermove', onPointer, { passive: true });
    frame = requestAnimationFrame(tick);
  }

  return () => {
    cancelAnimationFrame(frame);
    window.removeEventListener('pointermove', onPointer);
    ro.disconnect();
    io.disconnect();
    disposeScene(scene);
    cubeGeo.dispose();
    dustGeo.dispose();
    dust.material.dispose();
    releaseEnvironment(renderer);
    renderer.dispose();
    canvas.remove();
  };
}
