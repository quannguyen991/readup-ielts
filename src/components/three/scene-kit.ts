/**
 * Cảnh 3D trang trí cho phần đầu các trang — CHỈ CHẠY TRÊN WEB, tải lúc cần.
 *
 * Mọi vật thể dựng bằng code từ khối cơ bản (hộp bo góc, trụ, cầu, xuyến…), tô
 * vật liệu kiểu "đất sét" mờ theo đúng bảng màu của app. Không tải mô hình hay
 * ảnh ngoài nào: nhẹ, không phụ thuộc mạng, và đổi màu là đổi một hằng số.
 *
 * TIẾT KIỆM MÁY:
 * - Ngừng vẽ khi khung ra khỏi màn hình (IntersectionObserver) hoặc tab bị ẩn.
 * - Người đặt "giảm chuyển động" chỉ được vẽ một khung tĩnh.
 * - Độ phân giải tối đa 2x; hết dùng thì huỷ sạch hình, vật liệu, texture.
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export type SceneKind = 'home' | 'math' | 'verbal' | 'vocab' | 'progress';

const C = {
  indigo: 0x6366f1,
  indigoDeep: 0x312e81,
  violet: 0x8b5cf6,
  blue: 0x3b82f6,
  sky: 0x60a5fa,
  pink: 0xf472b6,
  amber: 0xfbbf24,
  teal: 0x2dd4bf,
  green: 0x34d399,
  white: 0xf8fafc,
  wood: 0xf5d0a9,
  graphite: 0x334155,
  silver: 0xcbd5e1,
};

type Floater = {
  obj: THREE.Object3D;
  base: THREE.Vector3;
  amp: number;
  speed: number;
  phase: number;
  spin: THREE.Vector3;
};

/** RNG gieo hạt — cảnh giống nhau ở mọi lần mở, không nhảy lung tung. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clay = (color: number, roughness = 0.45) => new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.04 });
const gloss = (color: number) =>
  new THREE.MeshPhysicalMaterial({ color, roughness: 0.28, metalness: 0.05, clearcoat: 0.9, clearcoatRoughness: 0.18 });
const gem = (color: number) => new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.1, flatShading: true });
const rbox = (w: number, h: number, d: number, r = 0.08) => new RoundedBoxGeometry(w, h, d, 4, r);

/** Texture chữ vẽ bằng canvas (phông của app nếu đã tải, không thì phông hệ thống). */
function textTexture(lines: { text: string; size: number; color: string; weight?: number }[], w = 512, h = 320, bg = '#ffffff') {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext('2d')!;
  g.fillStyle = bg;
  g.fillRect(0, 0, w, h);
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const total = lines.reduce((s, l) => s + l.size * 1.25, 0);
  let y = h / 2 - total / 2;
  for (const l of lines) {
    y += (l.size * 1.25) / 2;
    g.fillStyle = l.color;
    g.font = `${l.weight ?? 800} ${l.size}px "Plus Jakarta Sans", system-ui, sans-serif`;
    g.fillText(l.text, w / 2, y);
    y += (l.size * 1.25) / 2;
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Hộp bo góc có một mặt trước in chữ (mặt +z là nhóm vật liệu thứ 5). */
function labelledBox(w: number, h: number, d: number, face: THREE.Texture, side: number, r = 0.1) {
  const geo = rbox(w, h, d, r);
  const sideMat = clay(side);
  const faceMat = new THREE.MeshStandardMaterial({ map: face, roughness: 0.55 });
  return new THREE.Mesh(geo, [sideMat, sideMat, sideMat, sideMat, faceMat, sideMat]);
}

function sparkles(group: THREE.Group, floaters: Floater[], rand: () => number, count: number) {
  const colors = [C.pink, C.amber, C.violet, C.teal, C.sky];
  for (let i = 0; i < count; i += 1) {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.11 + rand() * 0.1, 0), gem(colors[i % colors.length]!));
    const p = new THREE.Vector3((rand() - 0.5) * 7, (rand() - 0.5) * 4.6, (rand() - 0.5) * 2 - 0.5);
    add(group, floaters, m, p, rand, 0.3);
  }
}

function add(group: THREE.Group, floaters: Floater[], obj: THREE.Object3D, pos: THREE.Vector3, rand: () => number, spinScale = 0.12) {
  obj.position.copy(pos);
  group.add(obj);
  floaters.push({
    obj,
    base: pos.clone(),
    amp: 0.1 + rand() * 0.16,
    speed: 0.55 + rand() * 0.5,
    phase: rand() * Math.PI * 2,
    spin: new THREE.Vector3((rand() - 0.5) * spinScale, (rand() - 0.5) * spinScale * 2, (rand() - 0.5) * spinScale),
  });
}

// --------------------------------------------------------------- vật thể

function openBook() {
  const g = new THREE.Group();
  const cover = new THREE.Mesh(rbox(2.5, 0.1, 1.75, 0.05), clay(C.indigo));
  g.add(cover);
  for (const side of [-1, 1]) {
    const page = new THREE.Mesh(rbox(1.17, 0.12, 1.62, 0.05), clay(C.white, 0.6));
    page.position.set(side * 0.6, 0.1, 0);
    page.rotation.z = -side * 0.1;
    g.add(page);
    // Vài dòng chữ giả trên trang.
    for (let i = 0; i < 4; i += 1) {
      const line = new THREE.Mesh(rbox(0.8 - (i % 2) * 0.2, 0.02, 0.07, 0.01), clay(C.silver));
      line.position.set(side * 0.62, 0.17 + side * 0.0, -0.5 + i * 0.3);
      line.rotation.z = -side * 0.1;
      g.add(line);
    }
  }
  g.rotation.set(1.05, 0.35, -0.12);
  return g;
}

function pencil() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 2.1, 6), clay(C.amber));
  g.add(body);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.46, 6), clay(C.wood));
  tip.position.y = -1.28;
  tip.rotation.z = Math.PI;
  g.add(tip);
  const lead = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.16, 12), clay(C.graphite));
  lead.position.y = -1.46;
  lead.rotation.z = Math.PI;
  g.add(lead);
  const ferrule = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.2, 24), gloss(C.silver));
  ferrule.position.y = 1.15;
  g.add(ferrule);
  const eraser = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.26, 24), clay(C.pink));
  eraser.position.y = 1.38;
  g.add(eraser);
  g.rotation.set(0.3, 0, -0.85);
  return g;
}

function globe() {
  const g = new THREE.Group();
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.82, 48, 32), gloss(C.sky));
  g.add(sphere);
  // "Lục địa": vài chỏm cầu xanh lá dán lên mặt cầu.
  const land = clay(C.green, 0.6);
  const spots: [number, number, number][] = [
    [0.4, 0.5, 0.26],
    [-0.5, -0.1, 0.22],
    [0.1, -0.55, 0.2],
    [-0.2, 0.62, 0.16],
  ];
  for (const [lat, lon, r] of spots) {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.84, 24, 16, 0, Math.PI * 2, 0, r * 1.3), land);
    cap.rotation.set(lat * 2, lon * 3, 0);
    g.add(cap);
  }
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.045, 12, 64), gloss(C.amber));
  ring.rotation.set(1.2, 0.3, 0.4);
  g.add(ring);
  return g;
}

function gradCap() {
  const g = new THREE.Group();
  const board = new THREE.Mesh(rbox(1.7, 0.09, 1.7, 0.03), clay(C.indigoDeep));
  g.add(board);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.62, 0.45, 32), clay(C.indigoDeep));
  cap.position.y = -0.26;
  g.add(cap);
  const button = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 12), gloss(C.amber));
  button.position.y = 0.08;
  g.add(button);
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.8, 8), clay(C.amber));
  cord.position.set(0.55, -0.3, 0.55);
  cord.rotation.z = 0.15;
  g.add(cord);
  const tassel = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.28, 12), clay(C.amber));
  tassel.position.set(0.6, -0.75, 0.55);
  g.add(tassel);
  g.rotation.set(0.45, 0.6, 0.12);
  return g;
}

function book(color: number) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(rbox(1.9, 0.34, 1.35, 0.06), clay(color)));
  const pages = new THREE.Mesh(rbox(1.78, 0.26, 1.3, 0.03), clay(C.white, 0.7));
  pages.position.set(0.07, 0, 0.03);
  g.add(pages);
  return g;
}

function speechBubble() {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(rbox(1.9, 1.15, 0.36, 0.3), gloss(C.white)));
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.45, 4), gloss(C.white));
  tail.position.set(-0.5, -0.7, 0);
  tail.rotation.z = 0.5;
  g.add(tail);
  for (let i = -1; i <= 1; i += 1) {
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.13, 20, 14), clay([C.indigo, C.violet, C.pink][i + 1]!));
    dot.position.set(i * 0.42, 0, 0.22);
    g.add(dot);
  }
  return g;
}

function symbol(kind: 'plus' | 'times' | 'equals', color: number) {
  const g = new THREE.Group();
  const bar = () => new THREE.Mesh(rbox(0.9, 0.22, 0.22, 0.1), clay(color));
  if (kind === 'equals') {
    const a = bar();
    a.position.y = 0.18;
    const b = bar();
    b.position.y = -0.18;
    g.add(a, b);
  } else {
    const a = bar();
    const b = bar();
    b.rotation.z = Math.PI / 2;
    g.add(a, b);
    if (kind === 'times') g.rotation.z = Math.PI / 4;
  }
  return g;
}

function flashcard(word: string, meaning: string, edge: number) {
  const face = textTexture(
    [
      { text: word, size: 78, color: '#312e81' },
      { text: meaning, size: 38, color: '#64748b', weight: 600 },
    ],
    512,
    320,
  );
  return labelledBox(2.1, 1.3, 0.09, face, edge, 0.08);
}

function letterTile(letter: string, bgHex: string, edge: number) {
  const face = textTexture([{ text: letter, size: 190, color: '#ffffff' }], 256, 256, bgHex);
  return labelledBox(0.85, 0.85, 0.28, face, edge, 0.12);
}

function trophy() {
  const g = new THREE.Group();
  const gold = new THREE.MeshPhysicalMaterial({ color: C.amber, roughness: 0.25, metalness: 0.45, clearcoat: 0.6 });
  const profile = [
    [0.0, 0.0],
    [0.55, 0.0],
    [0.62, 0.35],
    [0.6, 0.8],
    [0.5, 1.05],
    [0.0, 1.05],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const cup = new THREE.Mesh(new THREE.LatheGeometry(profile, 40), gold);
  cup.position.y = 0.35;
  g.add(cup);
  for (const side of [-1, 1]) {
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.06, 12, 32, Math.PI * 1.2), gold);
    handle.position.set(side * 0.66, 0.95, 0);
    handle.rotation.z = side === 1 ? -Math.PI * 0.6 : Math.PI * 1.6;
    g.add(handle);
  }
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.45, 20), gold);
  stem.position.y = 0.12;
  g.add(stem);
  const base = new THREE.Mesh(rbox(0.9, 0.28, 0.9, 0.06), clay(C.indigoDeep));
  base.position.y = -0.22;
  g.add(base);
  return g;
}

function star(color: number) {
  const shape = new THREE.Shape();
  for (let i = 0; i < 10; i += 1) {
    const r = i % 2 === 0 ? 0.5 : 0.22;
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
    if (i === 0) shape.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else shape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.14, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 3 });
  geo.center();
  return new THREE.Mesh(geo, gloss(color));
}

// --------------------------------------------------------------- các cảnh

type Builder = (group: THREE.Group, floaters: Floater[], rand: () => number) => void;

const BUILDERS: Record<SceneKind, Builder> = {
  home: (g, f, r) => {
    add(g, f, openBook(), new THREE.Vector3(-1.9, 0.5, 0), r);
    add(g, f, pencil(), new THREE.Vector3(2.3, 1.15, -0.4), r);
    add(g, f, globe(), new THREE.Vector3(1.6, -1.1, 0.3), r, 0.3);
    add(g, f, gradCap(), new THREE.Vector3(-1.3, -1.45, 0.6), r);
    sparkles(g, f, r, 7);
  },
  math: (g, f, r) => {
    add(g, f, new THREE.Mesh(new THREE.IcosahedronGeometry(0.85, 0), gem(C.indigo)), new THREE.Vector3(-1.8, 0.8, 0), r, 0.4);
    add(g, f, new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.24, 32, 64), gloss(C.pink)), new THREE.Vector3(1.9, 1.1, -0.3), r, 0.4);
    add(g, f, new THREE.Mesh(rbox(1.05, 1.05, 1.05, 0.16), gloss(C.blue)), new THREE.Vector3(0.3, -0.2, 0.4), r, 0.4);
    add(g, f, new THREE.Mesh(new THREE.ConeGeometry(0.62, 1.2, 48), clay(C.amber)), new THREE.Vector3(-1.6, -1.35, 0.3), r, 0.3);
    add(g, f, new THREE.Mesh(new THREE.OctahedronGeometry(0.62, 0), gem(C.teal)), new THREE.Vector3(2.2, -1.2, 0.2), r, 0.4);
    add(g, f, new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.85, 4), gem(C.violet)), new THREE.Vector3(0.5, 1.7, -0.6), r, 0.3);
    add(g, f, symbol('plus', C.violet), new THREE.Vector3(-0.2, 1.3, 0.6), r, 0.2);
    add(g, f, symbol('times', C.pink), new THREE.Vector3(1.1, -1.8, 0.6), r, 0.2);
    add(g, f, symbol('equals', C.teal), new THREE.Vector3(-2.7, -0.1, -0.2), r, 0.2);
    sparkles(g, f, r, 5);
  },
  verbal: (g, f, r) => {
    const stack = new THREE.Group();
    [C.pink, C.indigo, C.amber].forEach((color, i) => {
      const b = book(color);
      b.position.y = i * 0.36;
      b.rotation.y = (i - 1) * 0.18;
      stack.add(b);
    });
    stack.rotation.set(0.35, 0.5, 0);
    add(g, f, stack, new THREE.Vector3(-1.8, -0.9, 0), r);
    add(g, f, speechBubble(), new THREE.Vector3(1.6, 1.0, 0), r);
    add(g, f, letterTile('A', '#8b5cf6', C.violet), new THREE.Vector3(-1.4, 1.35, 0.3), r, 0.3);
    add(g, f, letterTile('W', '#14b8a6', C.teal), new THREE.Vector3(0.2, 0.3, 0.8), r, 0.3);
    add(g, f, letterTile('R', '#f472b6', C.pink), new THREE.Vector3(1.9, -1.2, 0.4), r, 0.3);
    sparkles(g, f, r, 6);
  },
  vocab: (g, f, r) => {
    const cards: [string, string, number, THREE.Vector3, number][] = [
      ['habitat', 'môi trường sống', C.indigo, new THREE.Vector3(-1.5, 0.9, 0), 0.18],
      ['resilient', 'kiên cường', C.pink, new THREE.Vector3(1.5, 1.1, -0.4), -0.14],
      ['candid', 'thẳng thắn', C.amber, new THREE.Vector3(-1.1, -1.1, 0.5), -0.1],
      ['provisional', 'tạm thời', C.teal, new THREE.Vector3(1.7, -0.9, 0.2), 0.12],
    ];
    for (const [word, meaning, edge, pos, rot] of cards) {
      const card = flashcard(word, meaning, edge);
      card.rotation.set(-0.15, rot * 2, rot);
      add(g, f, card, pos, r, 0.08);
    }
    sparkles(g, f, r, 7);
  },
  progress: (g, f, r) => {
    const t = trophy();
    t.scale.setScalar(1.25);
    add(g, f, t, new THREE.Vector3(0.9, -0.1, 0.3), r, 0.25);
    const bars = new THREE.Group();
    [
      [0.7, C.sky],
      [1.25, C.violet],
      [1.85, C.pink],
    ].forEach(([h, color], i) => {
      const bar = new THREE.Mesh(rbox(0.5, h as number, 0.5, 0.1), gloss(color as number));
      bar.position.set(i * 0.62, (h as number) / 2, 0);
      bars.add(bar);
    });
    bars.rotation.set(0.25, 0.5, 0);
    add(g, f, bars, new THREE.Vector3(-2.2, -1.2, 0), r, 0.05);
    add(g, f, star(C.amber), new THREE.Vector3(-1.2, 1.4, 0.4), r, 0.5);
    add(g, f, star(C.pink), new THREE.Vector3(2.4, 1.5, -0.3), r, 0.5);
    sparkles(g, f, r, 6);
  },
};

const SEEDS: Record<SceneKind, number> = { home: 11, math: 23, verbal: 37, vocab: 41, progress: 53 };

/** Gắn cảnh vào `host`; trả về hàm huỷ. */
export function mountScene(host: HTMLElement, kind: SceneKind): () => void {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const canvas = renderer.domElement;
  Object.assign(canvas.style, { width: '100%', height: '100%', display: 'block' });
  host.appendChild(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xc7d2fe, 1.3));
  const key = new THREE.DirectionalLight(0xffffff, 2.0);
  key.position.set(4, 6, 6);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xa5b4fc, 1.0);
  rim.position.set(-6, 2, -4);
  scene.add(rim);

  const group = new THREE.Group();
  scene.add(group);
  const floaters: Floater[] = [];
  BUILDERS[kind](group, floaters, rng(SEEDS[kind]));

  const resize = () => {
    const w = Math.max(1, host.clientWidth);
    const h = Math.max(1, host.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Khung hẹp thì lùi camera ra để cả cụm vật thể vẫn nằm trọn trong khung.
    camera.position.set(0, 0, 9.4 * Math.max(1, 1.2 / camera.aspect));
    camera.updateProjectionMatrix();
  };
  resize();

  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const pointer = { x: 0, y: 0 };
  const onPointer = (e: PointerEvent) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
  };

  let visible = true;
  let frame = 0;
  const clock = new THREE.Clock();
  const tick = () => {
    frame = requestAnimationFrame(tick);
    if (!visible || document.hidden) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    for (const f of floaters) {
      f.obj.position.y = f.base.y + Math.sin(t * f.speed + f.phase) * f.amp;
      f.obj.rotation.x += f.spin.x * dt;
      f.obj.rotation.y += f.spin.y * dt;
      f.obj.rotation.z += f.spin.z * dt;
    }
    // Cả cụm nghiêng nhẹ theo con trỏ + lắc chậm tự nhiên.
    group.rotation.y += (pointer.x * 0.28 + Math.sin(t * 0.3) * 0.08 - group.rotation.y) * 0.05;
    group.rotation.x += (pointer.y * 0.14 - group.rotation.x) * 0.05;
    renderer.render(scene, camera);
  };

  const ro = new ResizeObserver(resize);
  ro.observe(host);
  const io = new IntersectionObserver((entries) => {
    visible = entries.some((e) => e.isIntersecting);
  });
  io.observe(host);

  if (reduced) {
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
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.geometry.dispose();
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const m of mats) {
        (m as THREE.MeshStandardMaterial).map?.dispose();
        m.dispose();
      }
    });
    renderer.dispose();
    canvas.remove();
  };
}
