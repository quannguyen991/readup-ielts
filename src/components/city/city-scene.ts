/**
 * Cảnh 3D của Thành phố Tri thức — chỉ chạy trên web, three.js tải lúc cần.
 *
 * Dựng: bầu trời chuyển màu theo giờ (ngày / hoàng hôn / đêm), mặt trời đổ bóng
 * mềm, phản chiếu môi trường cho mặt kính, lưới đường có vạch kẻ, xe chạy, mây
 * trôi, sông ở rìa, quảng trường trung tâm có đài phun nước, và 24 khu đất.
 *
 * Tương tác: kéo để xoay, lăn để phóng to, bấm một khu đất để chọn (gọi
 * `onPick`). Ở Thành phố mẫu camera tự xoay chậm cho tới khi người xem chạm.
 * Ngừng vẽ khi tab ẩn hoặc khung khuất khỏi màn hình (tiết kiệm pin).
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

import type { BlueprintId, Plots } from '@/services/city/blueprints';
import { CITY_HALF, GRID, LOT, LOTS, PITCH, ROAD } from '@/services/city/layout';
import { buildBlueprint, lamp, plaza, tree } from './city-buildings';
import { mergeStatic } from './city-merge';
import { disposeTextures, grassTexture, hash, pavingTexture, rng, roadTexture } from './city-textures';

export type TimeOfDay = 'day' | 'dusk' | 'night';

export type CityHandle = {
  setPlots: (plots: Plots, animateNew: boolean) => void;
  select: (lotId: string | null) => void;
  setTime: (t: TimeOfDay) => void;
  setEditable: (editable: boolean) => void;
  /** Bay camera tới một khu đất (sau khi xây xong). */
  focus: (lotId: string) => void;
  dispose: () => void;
};

type Preset = {
  skyTop: string;
  skyBottom: string;
  fog: string;
  hemiSky: string;
  hemiGround: string;
  hemi: number;
  sun: string;
  sunI: number;
  sunPos: [number, number, number];
  night: number;
  exposure: number;
  stars: number;
};

const PRESETS: Record<TimeOfDay, Preset> = {
  day: {
    skyTop: '#4F8FE6', skyBottom: '#DCEBFF', fog: '#D8E8FB', hemiSky: '#EAF3FF', hemiGround: '#6F8A5E', hemi: 0.95,
    sun: '#FFF3DC', sunI: 2.6, sunPos: [140, 190, 90], night: 0, exposure: 1, stars: 0,
  },
  dusk: {
    skyTop: '#33407F', skyBottom: '#F6A56B', fog: '#E9A77F', hemiSky: '#F6C9A8', hemiGround: '#433650', hemi: 0.6,
    sun: '#FF9557', sunI: 1.7, sunPos: [230, 55, -60], night: 0.6, exposure: 1.05, stars: 0.15,
  },
  night: {
    skyTop: '#050A1C', skyBottom: '#1A2A57', fog: '#0F1935', hemiSky: '#3B4E8C', hemiGround: '#0A0E1C', hemi: 0.42,
    sun: '#A9C1FF', sunI: 0.55, sunPos: [-120, 160, 60], night: 1, exposure: 1.12, stars: 1,
  },
};

const RIVER_DAY = new THREE.Color('#3F8FCB');
const RIVER_NIGHT = new THREE.Color('#1D3F6B');
const WHITE = new THREE.Color('#FFFFFF');
const GROUND_NIGHT = new THREE.Color('#5E6B80');

export function mountCity(
  host: HTMLElement,
  init: { plots: Plots; time: TimeOfDay; editable: boolean; onPick: (lotId: string | null) => void },
): CityHandle {
  const touch = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, touch ? 1.5 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const canvas = renderer.domElement;
  Object.assign(canvas.style, { width: '100%', height: '100%', display: 'block', touchAction: 'none', cursor: 'grab' });
  host.appendChild(canvas);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  scene.environmentIntensity = 0.55;

  const camera = new THREE.PerspectiveCamera(38, 1, 1, 3000);
  camera.position.set(235, 155, 285);
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 30, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.minDistance = 55;
  controls.maxDistance = 560;
  controls.minPolarAngle = 0.2;
  controls.maxPolarAngle = 1.38;
  controls.autoRotateSpeed = 0.45;
  controls.addEventListener('start', () => {
    controls.autoRotate = false;
  });

  // ------------------------------------------------------------ đồ phát sáng theo giờ
  const litMats: { mat: THREE.MeshStandardMaterial; base: number }[] = [];
  const lit = (mat: THREE.MeshStandardMaterial, base: number) => litMats.push({ mat, base });

  // ------------------------------------------------------------ bầu trời
  const skyUniforms = { top: { value: new THREE.Color() }, bottom: { value: new THREE.Color() } };
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(1400, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: skyUniforms,
      vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader:
        'uniform vec3 top; uniform vec3 bottom; varying vec3 vP; void main(){ float h = clamp(vP.y*1.6+0.08,0.0,1.0); gl_FragColor = vec4(mix(bottom, top, pow(h,0.8)),1.0); }',
    }),
  );
  scene.add(sky);
  scene.fog = new THREE.Fog('#D8E8FB', 420, 1300);

  const starGeo = new THREE.BufferGeometry();
  {
    const r = rng(5);
    const pts: number[] = [];
    for (let i = 0; i < 900; i++) {
      const th = r() * Math.PI * 2;
      const ph = Math.acos(0.15 + r() * 0.85);
      pts.push(1200 * Math.sin(ph) * Math.cos(th), 1200 * Math.cos(ph), 1200 * Math.sin(ph) * Math.sin(th));
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  }
  const starMat = new THREE.PointsMaterial({ color: '#FFFFFF', size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false });
  scene.add(new THREE.Points(starGeo, starMat));

  // ------------------------------------------------------------ ánh sáng
  const hemi = new THREE.HemisphereLight('#EAF3FF', '#6F8A5E', 0.95);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight('#FFF3DC', 2.6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(touch ? 1024 : 2048, touch ? 1024 : 2048);
  const sc = sun.shadow.camera;
  sc.left = -CITY_HALF - 20;
  sc.right = CITY_HALF + 20;
  sc.top = CITY_HALF + 20;
  sc.bottom = -CITY_HALF - 20;
  sc.near = 10;
  sc.far = 700;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.6;
  scene.add(sun);
  scene.add(sun.target);

  // Mọi thứ đứng yên gom vào `env` để cuối cùng gộp một lần (xem `city-merge.ts`).
  const env = new THREE.Group();
  scene.add(env);

  // ------------------------------------------------------------ mặt đất, sông, đồi
  const groundMat = new THREE.MeshStandardMaterial({ map: (() => {
      const t = grassTexture().clone();
      t.needsUpdate = true;
      t.repeat.set(80, 80);
      return t;
    })(), roughness: 0.95 });
  const ground = new THREE.Mesh(new THREE.CircleGeometry(1100, 64), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.3;
  ground.receiveShadow = true;
  scene.add(ground);

  const riverZ = CITY_HALF + 38;
  const riverMat = new THREE.MeshPhysicalMaterial({ color: '#3F8FCB', roughness: 0.06, metalness: 0.15, clearcoat: 1, envMapIntensity: 1.4 });
  const river = new THREE.Mesh(new THREE.PlaneGeometry(1400, 46), riverMat);
  river.rotation.x = -Math.PI / 2;
  river.position.set(0, -0.2, riverZ);
  river.receiveShadow = true;
  scene.add(river);
  const bank = new THREE.MeshStandardMaterial({ color: '#E4D3A8', roughness: 1 });
  for (const s of [-1, 1]) {
    const b = new THREE.Mesh(new THREE.PlaneGeometry(1400, 5), bank);
    b.rotation.x = -Math.PI / 2;
    b.position.set(0, -0.22, riverZ + s * 25);
    env.add(b);
  }
  {
    const r = rng(21);
    const hillMat = new THREE.MeshStandardMaterial({ color: '#7FA86A', roughness: 1, flatShading: true });
    for (let i = 0; i < 16; i++) {
      const a = r() * Math.PI * 2;
      const d = 760 + r() * 240;
      const h = 30 + r() * 60;
      const hill = new THREE.Mesh(new THREE.ConeGeometry(110 + r() * 90, h, 7), hillMat);
      hill.position.set(Math.cos(a) * d, h / 2 - 2, Math.sin(a) * d);
      env.add(hill);
    }
  }

  // ------------------------------------------------------------ nền thành phố, đường
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(CITY_HALF * 2 + 8, 0.6, CITY_HALF * 2 + 8),
    new THREE.MeshStandardMaterial({ color: '#CFC8BA', roughness: 0.9 }),
  );
  base.position.y = -0.3;
  base.receiveShadow = true;
  env.add(base);

  const roadLen = GRID * PITCH + ROAD;
  const lines: number[] = [];
  for (let k = 0; k <= GRID; k++) lines.push((k - GRID / 2) * PITCH);
  const roadTex = roadTexture();
  const roadMat = (rotate: boolean) => {
    const t = roadTex.clone();
    t.needsUpdate = true;
    t.repeat.set(1, roadLen / 22);
    if (rotate) t.rotation = 0;
    return new THREE.MeshStandardMaterial({ map: t, roughness: 0.92 });
  };
  const vMat = roadMat(false);
  const hMat = roadMat(true);
  for (const c of lines) {
    const v = new THREE.Mesh(new THREE.PlaneGeometry(ROAD, roadLen), vMat);
    v.rotation.x = -Math.PI / 2;
    v.position.set(c, 0.02, 0);
    v.receiveShadow = true;
    env.add(v);
    const h = new THREE.Mesh(new THREE.PlaneGeometry(ROAD, roadLen), hMat);
    h.rotation.set(-Math.PI / 2, 0, Math.PI / 2);
    h.position.set(0, 0.03, c);
    h.receiveShadow = true;
    env.add(h);
  }
  // ngã tư: phủ nhựa trơn để vạch hai chiều không đè nhau
  const crossMat = new THREE.MeshStandardMaterial({ color: '#4B5260', roughness: 0.92 });
  const zebra = new THREE.MeshStandardMaterial({ color: '#F1EEE6', roughness: 0.8 });
  for (const x of lines) {
    for (const z of lines) {
      const c = new THREE.Mesh(new THREE.PlaneGeometry(ROAD, ROAD), crossMat);
      c.rotation.x = -Math.PI / 2;
      c.position.set(x, 0.04, z);
      c.receiveShadow = true;
      env.add(c);
      for (let s = 0; s < 4; s++) {
        const zb = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 2.2), zebra);
        zb.rotation.x = -Math.PI / 2;
        zb.position.set(x - 1.5 + s, 0.05, z + ROAD / 2 + 1.2);
        env.add(zb);
      }
    }
  }
  // đèn đường ở góc ngã tư
  {
    const lr = rng(8);
    for (const x of lines) {
      for (const z of lines) {
        if (lr() < 0.35) continue;
        const l = lamp(lit);
        l.position.set(x + ROAD / 2 + 0.6, 0, z + ROAD / 2 + 0.6);
        l.rotation.y = Math.PI * 0.75;
        env.add(l);
      }
    }
  }
  // hàng cây quanh rìa thành phố
  {
    const tr = rng(13);
    for (let i = 0; i < 70; i++) {
      const a = (i / 70) * Math.PI * 2 + tr() * 0.05;
      const d = CITY_HALF + 10 + tr() * 22;
      const x = Math.cos(a) * d;
      const z = Math.sin(a) * d;
      if (z > riverZ - 30) continue;
      const t = tree(tr, 1.3 + tr() * 0.6);
      t.position.set(x, 0, z);
      env.add(t);
    }
  }

  // ------------------------------------------------------------ quảng trường trung tâm
  const plazaParts = plaza(lit);
  plazaParts.group.position.y = 0.3;
  env.add(plazaParts.group);
  const plazaSlab = new THREE.Mesh(
    new THREE.BoxGeometry(LOT, 0.3, LOT),
    new THREE.MeshStandardMaterial({ map: pavingTexture('#DCD4C4'), roughness: 0.9 }),
  );
  plazaSlab.position.y = 0.15;
  plazaSlab.receiveShadow = true;
  env.add(plazaSlab);
  mergeStatic(env);

  // ------------------------------------------------------------ khu đất
  type LotView = {
    id: string;
    group: THREE.Group;
    pad: THREE.Mesh;
    marker: THREE.Group;
    building: THREE.Group | null;
    type: BlueprintId | null;
    grow: number; // 0→1 khi đang mọc lên
  };
  const slabMat = new THREE.MeshStandardMaterial({ map: pavingTexture('#E3DDD2'), roughness: 0.9 });
  const padMat = new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0, depthWrite: false });
  const markerMat = new THREE.MeshBasicMaterial({ color: '#4A7FE8', transparent: true, opacity: 0.9 });
  const views = new Map<string, LotView>();
  const pads: THREE.Mesh[] = [];
  for (const l of LOTS) {
    const group = new THREE.Group();
    group.position.set(l.x, 0, l.z);
    const slab = new THREE.Mesh(new THREE.BoxGeometry(LOT, 0.3, LOT), slabMat);
    slab.position.y = 0.15;
    slab.receiveShadow = true;
    group.add(slab);
    const pad = new THREE.Mesh(new THREE.PlaneGeometry(LOT - 0.6, LOT - 0.6), padMat.clone());
    pad.rotation.x = -Math.PI / 2;
    pad.position.y = 0.36;
    pad.userData.lotId = l.id;
    group.add(pad);
    pads.push(pad);
    // khung sáng + mũi tên khi chọn
    const marker = new THREE.Group();
    const e = LOT / 2 - 0.3;
    for (const [w, d, x, z] of [[LOT - 0.6, 0.35, 0, e], [LOT - 0.6, 0.35, 0, -e], [0.35, LOT - 0.6, e, 0], [0.35, LOT - 0.6, -e, 0]] as const) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(w, 0.25, d), markerMat);
      bar.position.set(x, 0.45, z);
      marker.add(bar);
    }
    const arrow = new THREE.Mesh(new THREE.ConeGeometry(1.1, 2.4, 4), markerMat);
    arrow.rotation.x = Math.PI;
    arrow.name = 'arrow';
    marker.add(arrow);
    marker.visible = false;
    group.add(marker);
    scene.add(group);
    views.set(l.id, { id: l.id, group, pad, marker, building: null, type: null, grow: 1 });
  }

  // ------------------------------------------------------------ xe chạy
  type Car = { mesh: THREE.Group; axis: 'x' | 'z'; line: number; dir: 1 | -1; speed: number; t: number };
  const cars: Car[] = [];
  {
    const cr = rng(31);
    const colors = ['#EF4444', '#F59E0B', '#3B82F6', '#10B981', '#F8FAFC', '#111827', '#8B5CF6', '#EC4899'];
    for (let i = 0; i < 18; i++) {
      const g = new THREE.Group();
      const col = colors[Math.floor(cr() * colors.length)]!;
      const body = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.9, 1.6), new THREE.MeshStandardMaterial({ color: col, roughness: 0.3, metalness: 0.5 }));
      body.position.y = 0.75;
      body.castShadow = true;
      g.add(body);
      const cab = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.7, 1.45), new THREE.MeshStandardMaterial({ color: '#1F2937', roughness: 0.15, metalness: 0.6 }));
      cab.position.set(-0.2, 1.5, 0);
      cab.castShadow = true;
      g.add(cab);
      const hl = new THREE.MeshStandardMaterial({ color: '#FFFBEB', emissive: new THREE.Color('#FFF1B8'), emissiveIntensity: 0 });
      lit(hl, 3);
      for (const z of [-0.5, 0.5]) {
        const h = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.25, 0.35), hl);
        h.position.set(1.62, 0.85, z);
        g.add(h);
      }
      const axis = cr() < 0.5 ? 'x' : 'z';
      const dir = cr() < 0.5 ? 1 : -1;
      const line = lines[Math.floor(cr() * lines.length)]!;
      const car: Car = { mesh: g, axis, line, dir, speed: 9 + cr() * 7, t: (cr() - 0.5) * roadLen };
      scene.add(g);
      cars.push(car);
    }
  }

  // ------------------------------------------------------------ mây
  const clouds: THREE.Group[] = [];
  {
    const r = rng(17);
    const mat = new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 1, transparent: true, opacity: 0.92, flatShading: true });
    for (let i = 0; i < 9; i++) {
      const c = new THREE.Group();
      const n = 4 + Math.floor(r() * 4);
      for (let k = 0; k < n; k++) {
        const s = 8 + r() * 10;
        const p = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 1), mat);
        p.position.set(k * 9 - n * 4.5, r() * 5, (r() - 0.5) * 10);
        p.scale.y = 0.6;
        c.add(p);
      }
      c.position.set((r() - 0.5) * 1100, 300 + r() * 110, -250 - r() * 500);
      scene.add(c);
      clouds.push(c);
    }
  }

  // ------------------------------------------------------------ bụi xây dựng
  type Puff = { mesh: THREE.Mesh; life: number; vel: THREE.Vector3 };
  const puffs: Puff[] = [];
  const puffMat = new THREE.MeshStandardMaterial({ color: '#E7DCC8', transparent: true, opacity: 0.8, roughness: 1 });
  const puffGeo = new THREE.IcosahedronGeometry(1, 0);
  function dust(x: number, z: number) {
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * Math.PI * 2;
      const m = new THREE.Mesh(puffGeo, puffMat.clone());
      m.position.set(x + Math.cos(a) * 6, 1, z + Math.sin(a) * 6);
      scene.add(m);
      puffs.push({ mesh: m, life: 1, vel: new THREE.Vector3(Math.cos(a) * 6, 3 + Math.random() * 3, Math.sin(a) * 6) });
    }
  }

  // ------------------------------------------------------------ nhà
  let editable = init.editable;
  let selected: string | null = null;
  let hovered: string | null = null;

  function disposeGroup(g: THREE.Object3D) {
    g.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
      const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
      for (const mat of mats) {
        const i = litMats.findIndex((x) => x.mat === mat);
        if (i >= 0) litMats.splice(i, 1);
        mat.dispose();
      }
    });
  }

  const beacons: THREE.Mesh[] = [];
  function setPlots(plots: Plots, animateNew: boolean) {
    for (const v of views.values()) {
      const want = plots[v.id]?.type ?? null;
      if (want === v.type) continue;
      if (v.building) {
        v.group.remove(v.building);
        disposeGroup(v.building);
        v.building = null;
      }
      v.type = want;
      if (want) {
        const b = buildBlueprint(want, hash(v.id + want), lit);
        mergeStatic(b);
        b.position.y = 0.3;
        b.traverse((o) => {
          o.userData.lotId = v.id;
        });
        v.group.add(b);
        v.building = b;
        v.grow = animateNew ? 0 : 1;
        if (animateNew) {
          b.scale.set(1, 0.001, 1);
          dust(v.group.position.x, v.group.position.z);
        }
      }
    }
    applyNight(currentNight);
    beacons.length = 0;
    for (const v of views.values()) v.building?.traverse((o) => {
      if (o.name === 'beacon') beacons.push(o as THREE.Mesh);
    });
    refreshPads();
  }

  function refreshPads() {
    for (const v of views.values()) {
      const m = v.pad.material as THREE.MeshBasicMaterial;
      const empty = !v.type;
      const isSel = v.id === selected;
      const isHov = v.id === hovered;
      m.color.set(isSel ? '#4A7FE8' : '#FFFFFF');
      m.opacity = !editable ? 0 : isSel ? 0.28 : isHov ? 0.32 : empty ? 0.14 : 0;
      v.marker.visible = isSel;
      const arrow = v.marker.getObjectByName('arrow');
      if (arrow) arrow.position.y = (v.building ? boxTop(v.building) : 0) + 8;
    }
  }

  const tmpBox = new THREE.Box3();
  function boxTop(g: THREE.Object3D): number {
    tmpBox.setFromObject(g);
    return Math.max(0, tmpBox.max.y);
  }

  // ------------------------------------------------------------ giờ trong ngày
  const cur = {
    top: new THREE.Color(), bottom: new THREE.Color(), fog: new THREE.Color(), hs: new THREE.Color(), hg: new THREE.Color(), sun: new THREE.Color(),
    hemi: 0, sunI: 0, night: 0, exposure: 1, stars: 0, sunPos: new THREE.Vector3(),
  };
  let target = PRESETS[init.time];
  let currentNight = 0;
  function snapTo(p: Preset) {
    cur.top.set(p.skyTop);
    cur.bottom.set(p.skyBottom);
    cur.fog.set(p.fog);
    cur.hs.set(p.hemiSky);
    cur.hg.set(p.hemiGround);
    cur.sun.set(p.sun);
    cur.hemi = p.hemi;
    cur.sunI = p.sunI;
    cur.night = p.night;
    cur.exposure = p.exposure;
    cur.stars = p.stars;
    cur.sunPos.set(...p.sunPos);
  }
  function applyNight(n: number) {
    currentNight = n;
    for (const { mat, base } of litMats) mat.emissiveIntensity = base * n;
  }
  function applyLook() {
    skyUniforms.top.value.copy(cur.top);
    skyUniforms.bottom.value.copy(cur.bottom);
    (scene.fog as THREE.Fog).color.copy(cur.fog);
    hemi.color.copy(cur.hs);
    hemi.groundColor.copy(cur.hg);
    hemi.intensity = cur.hemi;
    sun.color.copy(cur.sun);
    sun.intensity = cur.sunI;
    sun.position.copy(cur.sunPos);
    renderer.toneMappingExposure = cur.exposure;
    starMat.opacity = cur.stars;
    // Ánh sáng môi trường (phản chiếu) phải tắt gần hẳn ban đêm, không thì cỏ vẫn sáng xanh như ban ngày.
    scene.environmentIntensity = 0.55 - cur.night * 0.5;
    riverMat.color.copy(RIVER_DAY).lerp(RIVER_NIGHT, cur.night);
    groundMat.color.copy(WHITE).lerp(GROUND_NIGHT, cur.night);
    applyNight(cur.night);
  }
  snapTo(target);
  applyLook();

  function stepLook(k: number) {
    const tgtCol = (hex: string) => new THREE.Color(hex);
    cur.top.lerp(tgtCol(target.skyTop), k);
    cur.bottom.lerp(tgtCol(target.skyBottom), k);
    cur.fog.lerp(tgtCol(target.fog), k);
    cur.hs.lerp(tgtCol(target.hemiSky), k);
    cur.hg.lerp(tgtCol(target.hemiGround), k);
    cur.sun.lerp(tgtCol(target.sun), k);
    cur.hemi += (target.hemi - cur.hemi) * k;
    cur.sunI += (target.sunI - cur.sunI) * k;
    cur.night += (target.night - cur.night) * k;
    cur.exposure += (target.exposure - cur.exposure) * k;
    cur.stars += (target.stars - cur.stars) * k;
    cur.sunPos.lerp(new THREE.Vector3(...target.sunPos), k);
    applyLook();
  }

  // ------------------------------------------------------------ chọn khu đất
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let downAt: { x: number; y: number } | null = null;
  function lotAt(ev: PointerEvent): string | null {
    const rect = canvas.getBoundingClientRect();
    ndc.set(((ev.clientX - rect.left) / rect.width) * 2 - 1, -((ev.clientY - rect.top) / rect.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const targets: THREE.Object3D[] = [...pads];
    for (const v of views.values()) if (v.building) targets.push(v.building);
    const hit = ray.intersectObjects(targets, true)[0];
    return (hit?.object.userData.lotId as string | undefined) ?? null;
  }
  const onDown = (ev: PointerEvent) => {
    downAt = { x: ev.clientX, y: ev.clientY };
    canvas.style.cursor = 'grabbing';
  };
  const onUp = (ev: PointerEvent) => {
    canvas.style.cursor = 'grab';
    if (!downAt) return;
    const moved = Math.hypot(ev.clientX - downAt.x, ev.clientY - downAt.y);
    downAt = null;
    if (moved > 6) return;
    init.onPick(lotAt(ev));
  };
  const onMove = (ev: PointerEvent) => {
    if (downAt || !editable) return;
    const id = lotAt(ev);
    if (id !== hovered) {
      hovered = id;
      canvas.style.cursor = id ? 'pointer' : 'grab';
      refreshPads();
    }
  };
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointermove', onMove);

  // ------------------------------------------------------------ bay camera
  let fly: { from: THREE.Vector3; to: THREE.Vector3; camFrom: THREE.Vector3; camTo: THREE.Vector3; t: number } | null = null;
  function focus(lotId: string) {
    const v = views.get(lotId);
    if (!v) return;
    const h = v.building ? boxTop(v.building) : 10;
    const to = new THREE.Vector3(v.group.position.x, Math.min(40, h * 0.45), v.group.position.z);
    const dir = camera.position.clone().sub(controls.target).normalize();
    const dist = Math.max(70, h * 2.2);
    fly = { from: controls.target.clone(), to, camFrom: camera.position.clone(), camTo: to.clone().add(dir.multiplyScalar(dist)), t: 0 };
    controls.autoRotate = false;
  }

  // ------------------------------------------------------------ vòng vẽ
  const resize = () => {
    const w = host.clientWidth || 1;
    const h = host.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();

  const clock = new THREE.Clock();
  let frame = 0;
  let running = true;
  const easeOutBack = (x: number) => 1 + 2.2 * Math.pow(x - 1, 3) + 1.2 * Math.pow(x - 1, 2);
  const tick = () => {
    frame = requestAnimationFrame(tick);
    const dt = Math.min(0.05, clock.getDelta());
    const t = clock.elapsedTime;
    stepLook(Math.min(1, dt * 2.2));
    // nhà mọc lên
    for (const v of views.values()) {
      if (v.building && v.grow < 1) {
        v.grow = Math.min(1, v.grow + dt / 1.5);
        v.building.scale.y = Math.max(0.001, easeOutBack(v.grow));
        if (v.grow >= 1) refreshPads();
      }
      if (v.marker.visible) {
        const a = v.marker.getObjectByName('arrow');
        if (a) a.position.y += Math.sin(t * 3) * 0.03;
      }
    }
    for (let i = puffs.length - 1; i >= 0; i--) {
      const p = puffs[i]!;
      p.life -= dt * 0.9;
      p.mesh.position.addScaledVector(p.vel, dt);
      p.vel.multiplyScalar(0.96);
      p.mesh.scale.setScalar(1 + (1 - p.life) * 2.6);
      (p.mesh.material as THREE.MeshStandardMaterial).opacity = Math.max(0, p.life * 0.8);
      if (p.life <= 0) {
        scene.remove(p.mesh);
        (p.mesh.material as THREE.Material).dispose();
        puffs.splice(i, 1);
      }
    }
    // tia nước phun nhịp nhàng
    plazaParts.jets.forEach((j, i) => {
      j.scale.y = 0.8 + 0.25 * Math.sin(t * 4 + i);
    });
    // xe chạy vòng
    const half = roadLen / 2;
    for (const c of cars) {
      c.t += c.dir * c.speed * dt;
      if (c.t > half) c.t = -half;
      if (c.t < -half) c.t = half;
      const lane = c.dir * 1.3;
      if (c.axis === 'x') {
        c.mesh.position.set(c.t, 0, c.line + lane);
        c.mesh.rotation.y = c.dir > 0 ? 0 : Math.PI;
      } else {
        c.mesh.position.set(c.line - lane, 0, c.t);
        c.mesh.rotation.y = c.dir > 0 ? -Math.PI / 2 : Math.PI / 2;
      }
    }
    for (const c of clouds) {
      c.position.x += dt * 4;
      if (c.position.x > 520) c.position.x = -520;
    }
    // chóp tháp nhấp nháy
    for (const b of beacons) {
      const m = b.material as THREE.MeshStandardMaterial;
      m.emissiveIntensity = (1.5 + Math.sin(t * 2.5) * 1.5) * Math.max(0.15, cur.night) * 2;
    }
    if (fly) {
      fly.t = Math.min(1, fly.t + dt / 1.3);
      const k = 1 - Math.pow(1 - fly.t, 3);
      controls.target.lerpVectors(fly.from, fly.to, k);
      camera.position.lerpVectors(fly.camFrom, fly.camTo, k);
      if (fly.t >= 1) fly = null;
    }
    // giữ tâm nhìn trong thành phố
    controls.target.x = THREE.MathUtils.clamp(controls.target.x, -CITY_HALF, CITY_HALF);
    controls.target.z = THREE.MathUtils.clamp(controls.target.z, -CITY_HALF, CITY_HALF);
    controls.target.y = THREE.MathUtils.clamp(controls.target.y, 0, 60);
    controls.update();
    renderer.render(scene, camera);
  };

  const ro = new ResizeObserver(resize);
  ro.observe(host);
  const pause = () => {
    if (running) {
      cancelAnimationFrame(frame);
      running = false;
    }
  };
  const resume = () => {
    if (!running) {
      running = true;
      clock.getDelta();
      frame = requestAnimationFrame(tick);
    }
  };
  const onVis = () => (document.hidden ? pause() : resume());
  document.addEventListener('visibilitychange', onVis);
  const io = new IntersectionObserver((entries) => (entries[0]?.isIntersecting ? resume() : pause()));
  io.observe(host);

  setPlots(init.plots, false);
  controls.autoRotate = !editable;
  frame = requestAnimationFrame(tick);

  return {
    setPlots,
    select: (id) => {
      selected = id;
      refreshPads();
    },
    setTime: (tod) => {
      target = PRESETS[tod];
    },
    setEditable: (e) => {
      editable = e;
      controls.autoRotate = !e;
      if (!e) selected = null;
      refreshPads();
    },
    focus,
    dispose: () => {
      pause();
      running = false;
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointermove', onMove);
      controls.dispose();
      disposeGroup(scene);
      envTex.dispose();
      pmrem.dispose();
      disposeTextures();
      renderer.dispose();
      canvas.remove();
    },
  };
}
