/**
 * LÕI NGÔI SAO PHÁT SÁNG — ngôi sao ở phần đầu trang (`hero-star.ts`) dựng từ đây.
 * CHỈ CHẠY TRÊN WEB.
 *
 * Trước đây phần đầu trang là một viên kim cương; người dùng bảo thử đổi thành
 * NGÔI SAO PHÁT SÁNG, cùng dáng với chùm sao `GlowStars` ở góc thẻ — sao bốn cánh
 * cạnh cong — nên cả app nói cùng một thứ ngôn ngữ hình ảnh.
 *
 * VÌ SAO NGÔI SAO TRÔNG "PHÁT SÁNG" MÀ KHÔNG CẦN HẬU KỲ (bloom):
 *
 * 1. Thân sao PHỒNG như gối: viền sao ở mặt phẳng giữa, các vòng trong nâng dần
 *    lên thành vòm ở cả hai mặt, pháp tuyến nội suy mượt — ánh sáng trượt trên
 *    thân sao chứ không gãy theo mặt phẳng.
 * 2. Shader tự sáng: lõi sáng trắng ở giữa lan ra màu sao ở đầu cánh, viền sáng
 *    theo Fresnel (càng nghiêng càng sáng), thêm phản chiếu căn phòng studio cho
 *    có điểm loé. Độ sáng thở theo nhịp `pulse`.
 * 3. Phía sau là quầng màu và một vành TIA SÁNG xoay chậm, trộn cộng (additive).
 */
import * as THREE from 'three';

// ---------------------------------------------------------------- studio

const envCache = new WeakMap<THREE.WebGLRenderer, THREE.WebGLCubeRenderTarget>();

/**
 * Căn phòng chụp trang sức, vẽ MỘT LẦN vào một cube map dải động cao (HDR): nền
 * tối có chuyển sắc, hộp đèn trắng rất sáng (giá trị > 1), vài tấm phản quang
 * màu cho ánh lửa, và vài chấm sáng nhỏ để mặt đá loé lên khi xoay.
 */
export function studioEnvironment(renderer: THREE.WebGLRenderer): THREE.CubeTexture {
  const hit = envCache.get(renderer);
  if (hit) return hit.texture;
  const scene = new THREE.Scene();
  const room = new THREE.Mesh(
    new THREE.SphereGeometry(40, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      toneMapped: false,
      vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader:
        'varying vec3 vP; void main(){ float h = normalize(vP).y; vec3 low = vec3(0.05,0.05,0.10); vec3 mid = vec3(0.20,0.19,0.34); vec3 high = vec3(0.62,0.64,0.84); vec3 c = h < 0.0 ? mix(mid, low, -h) : mix(mid, high, h); gl_FragColor = vec4(c, 1.0); }',
    }),
  );
  scene.add(room);
  const panel = (w: number, h: number, rgb: [number, number, number], p: [number, number, number]) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(...rgb), side: THREE.DoubleSide, toneMapped: false }),
    );
    m.position.set(...p);
    m.lookAt(0, 0, 0);
    scene.add(m);
  };
  panel(9, 2.6, [9, 9, 9.4], [0, 13, 7]); // hộp đèn chính phía trên trước
  panel(2.2, 14, [6, 6, 6.3], [-14, 2, 3]); // dải đèn trái
  panel(2.2, 14, [6, 6.1, 6.5], [14, 1, 4]); // dải đèn phải
  panel(7, 2, [5, 5, 5.3], [0, 3, -15]); // đèn ngược phía sau
  panel(5, 5, [0.3, 2.6, 5.2], [-11, -6, -8]); // phản quang lam
  panel(5, 5, [5.4, 0.5, 3.0], [11, -5, -8]); // phản quang hồng
  panel(6, 3, [5.6, 3.6, 0.6], [0, -13, 6]); // phản quang vàng dưới
  panel(4, 4, [0.7, 4.8, 2.2], [-7, 9, -10]); // phản quang ngọc
  // Ô đèn nhỏ rải khắp phòng: mỗi mặt đá dội tia theo một hướng riêng, trúng ô
  // đèn thì loé trắng hoặc loé màu, trượt thì tối — đó là mảng sáng tối lấp lánh.
  const rand = rng(7);
  const tints: [number, number, number][] = [
    [10, 10, 10],
    [10, 10, 10],
    [10, 10, 10],
    [2, 6, 11],
    [11, 3, 7],
    [11, 8, 2],
    [3, 10, 6],
  ];
  for (let i = 0; i < 64; i += 1) {
    const s = 1.4 + rand() * 2.6;
    const u = rand() * Math.PI * 2;
    const v = Math.acos(rand() * 2 - 1);
    const p = new THREE.Vector3().setFromSphericalCoords(17, v, u);
    panel(s, s * (0.4 + rand()), tints[i % tints.length]!, [p.x, p.y, p.z]);
  }
  const target = new THREE.WebGLCubeRenderTarget(256, { type: THREE.HalfFloatType, generateMipmaps: false });
  const cam = new THREE.CubeCamera(0.1, 100, target);
  cam.update(renderer, scene);
  scene.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry.dispose();
    (mesh.material as THREE.Material).dispose();
  });
  envCache.set(renderer, target);
  return target.texture;
}

/** Trả lại bộ nhớ của căn phòng studio khi bộ vẽ sắp bị huỷ. */
export function releaseEnvironment(renderer: THREE.WebGLRenderer) {
  envCache.get(renderer)?.dispose();
  envCache.delete(renderer);
}


// ---------------------------------------------------------------- hình ngôi sao

/**
 * Đường viền sao bốn cánh cạnh cong (cánh dọc dài hơn cánh ngang một chút cho
 * thanh), lấy mẫu đều `samples` điểm. Cùng dáng với biểu tượng "sparkle" của app,
 * chỉ cánh đầy hơn một chút để khi phồng lên còn thân.
 */
export function sparkleOutline(samples: number, stretchY = 1.18): THREE.Vector2[] {
  const shape = new THREE.Shape();
  shape.moveTo(0, 1);
  shape.bezierCurveTo(0.12, 0.4, 0.4, 0.12, 1, 0);
  shape.bezierCurveTo(0.4, -0.12, 0.12, -0.4, 0, -1);
  shape.bezierCurveTo(-0.12, -0.4, -0.4, -0.12, -1, 0);
  shape.bezierCurveTo(-0.4, 0.12, -0.12, 0.4, 0, 1);
  return shape
    .getSpacedPoints(samples)
    .slice(0, samples)
    .map((p) => new THREE.Vector2(p.x, p.y * stretchY));
}

/** Các vòng co dần về tâm: `s` là tỉ lệ co của đường viền, `z` là độ phồng (0 ở viền, 1 ở đỉnh vòm). */
const DOME = [
  { s: 0.84, z: 0.46 },
  { s: 0.62, z: 0.76 },
  { s: 0.38, z: 0.93 },
  { s: 0.15, z: 1 },
];

/**
 * Thân sao phồng hai mặt. Viền dùng chung cho mặt trước và mặt sau nên mép sao
 * tròn mượt, không có đường gãy.
 */
export function starGeometry(samples = 160, depth = 0.34): THREE.BufferGeometry {
  const outline = sparkleOutline(samples);
  const pos: number[] = [];
  const idx: number[] = [];
  const ring = (s: number, z: number) => {
    const start = pos.length / 3;
    for (const p of outline) pos.push(p.x * s, p.y * s, z);
    return start;
  };
  const rim = ring(1, 0);
  for (const side of [1, -1]) {
    let prev = rim;
    for (const r of DOME) {
      const cur = ring(r.s, side * depth * r.z);
      for (let i = 0; i < samples; i += 1) {
        const a = prev + i;
        const b = prev + ((i + 1) % samples);
        const c = cur + i;
        const d = cur + ((i + 1) % samples);
        if (side > 0) idx.push(a, b, d, a, d, c);
        else idx.push(a, d, b, a, c, d);
      }
      prev = cur;
    }
    const tip = pos.length / 3;
    pos.push(0, 0, side * depth * 1.02);
    for (let i = 0; i < samples; i += 1) {
      const a = prev + i;
      const b = prev + ((i + 1) % samples);
      if (side > 0) idx.push(a, b, tip);
      else idx.push(a, tip, b);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Chất liệu sao tự phát sáng: lõi trắng nóng ở giữa, màu sao ở đầu cánh, viền
 * sáng Fresnel, một phần phản chiếu căn phòng studio. `uniforms.pulse` (0–1) cho
 * sao "thở".
 */
export function starMaterial(env: THREE.CubeTexture, color: string): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    // Không qua tone mapping: ACES kéo màu trắng về xám nhạt, sao trắng thành sao bạc.
    toneMapped: false,
    uniforms: {
      env: { value: env },
      tint: { value: new THREE.Color(color) },
      pulse: { value: 0.5 },
    },
    vertexShader: `
      varying vec3 vWorldN;
      varying vec3 vWorldView;
      varying vec3 vLocal;
      void main() {
        vLocal = position;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldN = normalize(mat3(modelMatrix) * normal);
        vWorldView = cameraPosition - wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: `
      uniform samplerCube env;
      uniform vec3 tint;
      uniform float pulse;
      varying vec3 vWorldN;
      varying vec3 vWorldView;
      varying vec3 vLocal;
      void main() {
        vec3 n = normalize(vWorldN);
        vec3 v = normalize(vWorldView);
        float facing = max(dot(n, v), 0.0);
        float rim = pow(1.0 - facing, 2.4);
        float r = length(vLocal.xy);
        // Mặt khuất ngả xanh lạnh nhạt: sao trắng vẫn thấy khối trên nền sáng.
        float core = smoothstep(0.55, 0.0, r);
        vec3 refl = textureCube(env, reflect(-v, n)).rgb;
        vec3 shade = mix(vec3(0.62, 0.67, 0.84), vec3(1.0), pow(facing, 0.8));
        vec3 body = tint * shade * 0.9;
        vec3 glow = mix(tint, vec3(1.0), 0.45) * core * (0.25 + 0.2 * pulse);
        vec3 col = body + glow + refl * 0.1 + mix(tint, vec3(1.0), 0.5) * rim * (0.25 + 0.2 * pulse);
        col = min(col, vec3(1.0));
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}

/** Vành tia sáng sau ngôi sao: tia dài tia ngắn xen nhau, mờ dần ra ngoài. */
export function raysSprite(color: string, size: number, opacity = 0.5): THREE.Sprite {
  const S = 256;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const g = c.getContext('2d')!;
  const col = new THREE.Color(color);
  const rgb = `${Math.round(col.r * 255)},${Math.round(col.g * 255)},${Math.round(col.b * 255)}`;
  g.translate(S / 2, S / 2);
  const count = 16;
  for (let i = 0; i < count; i += 1) {
    const a = (i / count) * Math.PI * 2;
    const long = i % 2 === 0;
    const len = (long ? 0.98 : 0.6) * (S / 2);
    const w = long ? 0.07 : 0.05;
    const grad = g.createRadialGradient(0, 0, 0, 0, 0, len);
    grad.addColorStop(0, `rgba(255,255,255,0.95)`);
    grad.addColorStop(0.25, `rgba(${rgb},0.75)`);
    grad.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = grad;
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(Math.cos(a - w) * len, Math.sin(a - w) * len);
    g.lineTo(Math.cos(a + w) * len, Math.sin(a + w) * len);
    g.closePath();
    g.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending }));
  s.scale.setScalar(size);
  return s;
}

// ---------------------------------------------------------------- tia lấp lánh

let glintTex: THREE.CanvasTexture | null = null;

/** Ngôi sao bốn cánh mảnh + lõi sáng — vẽ bằng canvas một lần. */
export function glintTexture(): THREE.CanvasTexture {
  if (glintTex) return glintTex;
  const S = 128;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const g = c.getContext('2d')!;
  const core = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  core.addColorStop(0, 'rgba(255,255,255,1)');
  core.addColorStop(0.12, 'rgba(255,255,255,0.9)');
  core.addColorStop(0.3, 'rgba(200,220,255,0.25)');
  core.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = core;
  g.fillRect(0, 0, S, S);
  g.globalCompositeOperation = 'lighter';
  for (const [w, h] of [
    [S, 5],
    [5, S],
  ] as const) {
    const grad = w > h ? g.createLinearGradient(0, 0, S, 0) : g.createLinearGradient(0, 0, 0, S);
    grad.addColorStop(0, 'rgba(255,255,255,0)');
    grad.addColorStop(0.5, 'rgba(255,255,255,1)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect((S - w) / 2, (S - h) / 2, w, h);
  }
  glintTex = new THREE.CanvasTexture(c);
  glintTex.colorSpace = THREE.SRGBColorSpace;
  return glintTex;
}

/**
 * Gắn `count` tia lấp lánh lên một vật thể (là con của vật thể, nên xoay theo nó).
 * Mỗi tia loé lên rất nhanh rồi tắt, lệch nhịp nhau — không bao giờ sáng cùng lúc.
 */
export function glints(gem: THREE.Object3D, count: number, radius: number, seed: number) {
  const rand = rng(seed);
  const mat = new THREE.SpriteMaterial({ map: glintTexture(), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
  const items = Array.from({ length: count }, () => {
    const s = new THREE.Sprite(mat);
    const a = rand() * Math.PI * 2;
    const up = rand() < 0.7;
    s.position.set(Math.cos(a) * radius * (up ? 0.55 + rand() * 0.35 : 0.95), up ? 0.3 + rand() * 0.08 : 0.07, Math.sin(a) * radius * (up ? 0.55 + rand() * 0.35 : 0.95));
    s.scale.setScalar(0);
    gem.add(s);
    return { s, speed: 0.35 + rand() * 0.5, phase: rand() * 10, size: 0.35 + rand() * 0.4 };
  });
  return (t: number) => {
    for (const it of items) {
      // Nhọn và ngắn: phần lớn thời gian tắt, loé trong chốc lát.
      const k = Math.pow(Math.max(0, Math.sin(t * it.speed * Math.PI + it.phase)), 24);
      it.s.scale.setScalar(k * it.size);
      it.s.material.rotation = t * 0.8 + it.phase;
    }
  };
}

/** Quầng sáng mềm phía sau, cùng màu ngôi sao. */
export function halo(color: string, size: number, opacity = 0.55): THREE.Sprite {
  const S = 128;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const g = c.getContext('2d')!;
  const col = new THREE.Color(color);
  const rgb = `${Math.round(col.r * 255)},${Math.round(col.g * 255)},${Math.round(col.b * 255)}`;
  const grad = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  grad.addColorStop(0, `rgba(${rgb},0.9)`);
  grad.addColorStop(0.35, `rgba(${rgb},0.35)`);
  grad.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, S, S);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending }));
  s.scale.setScalar(size);
  return s;
}

export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Huỷ sạch hình, vật liệu, texture riêng của một cảnh (không huỷ cube map dùng chung). */
export function disposeScene(scene: THREE.Object3D) {
  scene.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh && !(obj as THREE.Sprite).isSprite) return;
    mesh.geometry?.dispose();
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of mats) {
      const mm = m as THREE.SpriteMaterial;
      if (mm.map && mm.map !== glintTex) mm.map.dispose();
      m.dispose();
    }
  });
}

