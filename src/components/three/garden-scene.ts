/**
 * Đảo 3D của Vườn từ — chỉ chạy trên web, tải lúc cần.
 *
 * Mỗi từ là một cây trên hòn đảo nổi. Thân + tán vẽ bằng InstancedMesh (một
 * lần vẽ cho cả trăm cây), màu và dáng theo trạng thái trí nhớ
 * (`services/vocab/garden.ts`): xanh tươi → vàng úa → nâu gục xuống. Cây nhớ
 * bền có hoa hồng trên ngọn.
 *
 * Kéo để xoay đảo; bấm vào cây để chọn (gọi `onPick`). Tự xoay chậm khi không
 * có ai chạm. Ngừng vẽ khi khung khuất màn hình hoặc tab bị ẩn.
 */
import * as THREE from 'three';

import { spiralLayout, type Plant, type PlantState } from '@/services/vocab/garden';

const STEM: Record<PlantState, number> = {
  seed: 0x84cc16,
  thriving: 0x15803d,
  ok: 0x4d7c0f,
  wilting: 0xa16207,
  dying: 0x78350f,
};
const CROWN: Record<PlantState, number> = {
  seed: 0xa3e635,
  thriving: 0x22c55e,
  ok: 0x84cc16,
  wilting: 0xeab308,
  dying: 0xb45309,
};
/** Độ gục của thân (radian) — cây sắp quên cúi rạp xuống. */
const DROOP: Record<PlantState, number> = { seed: 0, thriving: 0, ok: 0.12, wilting: 0.45, dying: 0.95 };
const CROWN_SIZE: Record<PlantState, number> = { seed: 0.75, thriving: 1.15, ok: 1, wilting: 0.85, dying: 0.7 };

const clay = (color: number, roughness = 0.6) => new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.02 });

export type GardenHandle = { dispose: () => void; select: (id: string | null) => void };

export function mountGarden(host: HTMLElement, plants: readonly Plant[], onPick: (id: string | null) => void): GardenHandle {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;
  const canvas = renderer.domElement;
  Object.assign(canvas.style, { width: '100%', height: '100%', display: 'block', touchAction: 'none', cursor: 'grab' });
  host.appendChild(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xbfdbfe, 1.35));
  const sun = new THREE.DirectionalLight(0xfff7e6, 2.1);
  sun.position.set(5, 9, 4);
  scene.add(sun);

  const world = new THREE.Group();
  scene.add(world);

  // --- Đảo: mặt cỏ, thân đất thuôn xuống, mỏm đá dưới đáy, vài hòn đá, một ao nước.
  const R = 5;
  const grass = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.42, 64), clay(0x16a34a, 0.8));
  grass.position.y = -0.21;
  world.add(grass);
  const grassTop = new THREE.Mesh(new THREE.CylinderGeometry(R - 0.12, R - 0.12, 0.05, 64), clay(0x4ade80, 0.9));
  grassTop.position.y = 0.01;
  world.add(grassTop);
  // Thân đất gần như thẳng đứng rồi mới thuôn nhọn — thuôn ngay từ mép thì nhìn
  // từ trên xuống sẽ bị mặt cỏ che mất, đảo trông như cái đĩa phẳng.
  const soil = new THREE.Mesh(new THREE.CylinderGeometry(R - 0.06, R - 0.5, 0.95, 48), clay(0xb45309, 0.85));
  soil.position.y = -0.9;
  world.add(soil);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(R - 0.5, 2.3, 48), clay(0x92400e, 0.9));
  tip.position.y = -2.52;
  tip.rotation.x = Math.PI;
  world.add(tip);
  const pond = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.06, 40), new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.15, metalness: 0.1 }));
  pond.position.set(-3.1, 0.03, 2.2);
  pond.scale.set(1.4, 1, 1);
  world.add(pond);
  const rockMat = clay(0x94a3b8, 0.7);
  for (const [x, z, s] of [
    [3.6, -2.4, 0.32],
    [3.2, -2.9, 0.2],
    [-3.9, -1.4, 0.26],
    [1.2, 4.2, 0.22],
  ] as const) {
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), rockMat);
    rock.position.set(x, s * 0.6, z);
    world.add(rock);
  }

  // --- Cây: xếp theo xoắn ốc hướng dương, cây cũ ở tâm.
  const n = plants.length;
  const spots = spiralLayout(n, R - 0.7);
  const stemGeo = new THREE.CylinderGeometry(0.045, 0.07, 1, 6);
  stemGeo.translate(0, 0.5, 0);
  const crownGeo = new THREE.IcosahedronGeometry(0.26, 1);
  const flowerGeo = new THREE.SphereGeometry(0.1, 14, 10);
  const stems = new THREE.InstancedMesh(stemGeo, clay(0xffffff, 0.7), Math.max(n, 1));
  const crowns = new THREE.InstancedMesh(crownGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55, flatShading: true }), Math.max(n, 1));
  const flowerCount = plants.filter((p) => p.flower).length;
  const flowers = new THREE.InstancedMesh(flowerGeo, new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.4 }), Math.max(flowerCount, 1));
  stems.count = n;
  crowns.count = n;
  flowers.count = flowerCount;
  world.add(stems, crowns, flowers);

  const tmpColor = new THREE.Color();
  const phase = plants.map((_, i) => (i * 2.399) % (Math.PI * 2));
  plants.forEach((p, i) => {
    stems.setColorAt(i, tmpColor.setHex(STEM[p.state]));
    crowns.setColorAt(i, tmpColor.setHex(CROWN[p.state]));
  });
  if (stems.instanceColor) stems.instanceColor.needsUpdate = true;
  if (crowns.instanceColor) crowns.instanceColor.needsUpdate = true;

  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const pos = new THREE.Vector3();
  const scl = new THREE.Vector3();
  const up = new THREE.Vector3();
  const tops: THREE.Vector3[] = plants.map(() => new THREE.Vector3());

  const place = (t: number) => {
    let f = 0;
    plants.forEach((p, i) => {
      const spot = spots[i]!;
      // Gục ra phía ngoài đảo; lắc nhẹ theo gió.
      const outward = Math.atan2(spot.z, spot.x);
      const sway = Math.sin(t * 1.3 + phase[i]!) * 0.04;
      const droop = DROOP[p.state] + sway;
      e.set(Math.sin(outward) * droop, 0, -Math.cos(outward) * droop);
      q.setFromEuler(e);
      pos.set(spot.x, 0.02, spot.z);
      scl.set(1, p.height, 1);
      m.compose(pos, q, scl);
      stems.setMatrixAt(i, m);
      up.set(0, p.height, 0).applyQuaternion(q);
      const top = tops[i]!.copy(pos).add(up);
      const size = CROWN_SIZE[p.state] * (0.75 + p.height * 0.25);
      m.compose(top, q, scl.set(size, size * (p.state === 'dying' ? 0.7 : 1), size));
      crowns.setMatrixAt(i, m);
      if (p.flower) {
        m.compose(pos.copy(top).add(up.set(0, 0.26 * size, 0)), q, scl.set(1, 1, 1));
        flowers.setMatrixAt(f, m);
        f += 1;
      }
    });
    stems.instanceMatrix.needsUpdate = true;
    crowns.instanceMatrix.needsUpdate = true;
    flowers.instanceMatrix.needsUpdate = true;
  };
  place(0);

  // Vòng sáng dưới cây đang chọn.
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.05, 10, 40), new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xf59e0b, emissiveIntensity: 0.6 }));
  ring.rotation.x = Math.PI / 2;
  ring.visible = false;
  world.add(ring);
  let selected = -1;

  // --- Camera, kéo để xoay, tự xoay khi rảnh.
  const resize = () => {
    const w = Math.max(1, host.clientWidth);
    const h = Math.max(1, host.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Nhìn chếch thấp để thấy cả mặt cỏ lẫn thân đất: đảo phải "nổi", không phải một cái đĩa.
    const dist = 15 * Math.max(1, 1.3 / camera.aspect);
    camera.position.set(0, dist * 0.42, dist * 0.9);
    camera.lookAt(0, -0.9, 0);
    camera.updateProjectionMatrix();
  };
  resize();

  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  let dragging = false;
  let moved = 0;
  let lastX = 0;
  let idleUntil = 0;
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();

  const onDown = (ev: PointerEvent) => {
    dragging = true;
    moved = 0;
    lastX = ev.clientX;
    canvas.style.cursor = 'grabbing';
    canvas.setPointerCapture(ev.pointerId);
  };
  const onMove = (ev: PointerEvent) => {
    if (!dragging) return;
    const dx = ev.clientX - lastX;
    lastX = ev.clientX;
    moved += Math.abs(dx);
    world.rotation.y += dx * 0.008;
    idleUntil = performance.now() + 4000;
  };
  const onUp = (ev: PointerEvent) => {
    dragging = false;
    canvas.style.cursor = 'grab';
    if (moved > 6) return;
    const box = canvas.getBoundingClientRect();
    ndc.set(((ev.clientX - box.left) / box.width) * 2 - 1, -((ev.clientY - box.top) / box.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObjects([crowns, stems], false)[0];
    const id = hit?.instanceId !== undefined ? plants[hit.instanceId]?.id ?? null : null;
    onPick(id);
  };
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);

  let visible = true;
  let frame = 0;
  const clock = new THREE.Clock();
  const tick = () => {
    frame = requestAnimationFrame(tick);
    if (!visible || document.hidden) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    if (!dragging && performance.now() > idleUntil) world.rotation.y += dt * 0.08;
    place(t);
    if (selected >= 0) {
      ring.visible = true;
      const s = spots[selected]!;
      ring.position.set(s.x, 0.06, s.z);
      ring.scale.setScalar(1 + Math.sin(t * 4) * 0.08);
    } else ring.visible = false;
    renderer.render(scene, camera);
  };

  const ro = new ResizeObserver(resize);
  ro.observe(host);
  const io = new IntersectionObserver((entries) => {
    visible = entries.some((x) => x.isIntersecting);
  });
  io.observe(host);

  if (reduced) renderer.render(scene, camera);
  else frame = requestAnimationFrame(tick);

  return {
    select: (id) => {
      selected = id ? plants.findIndex((p) => p.id === id) : -1;
      if (reduced) {
        ring.visible = selected >= 0;
        if (selected >= 0) ring.position.set(spots[selected]!.x, 0.06, spots[selected]!.z);
        renderer.render(scene, camera);
      }
    },
    dispose: () => {
      cancelAnimationFrame(frame);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      ro.disconnect();
      io.disconnect();
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.geometry.dispose();
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((mat) => mat.dispose());
      });
      renderer.dispose();
      canvas.remove();
    },
  };
}
