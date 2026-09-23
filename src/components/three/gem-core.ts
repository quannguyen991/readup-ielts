/**
 * LÕI ĐÁ QUÝ — dùng chung cho viên lớn ở đầu trang (`hero-gem.ts`) và viên nhỏ ở
 * góc thẻ (`gem-kit.ts`). CHỈ CHẠY TRÊN WEB.
 *
 * VÌ SAO ĐÁ QUÝ TRÔNG THẬT ĐƯỢC MÀ KHÔNG CẦN MÔ HÌNH HAY ẢNH:
 *
 * 1. Hình học GIÁC CẮT: dựng từ các vòng đỉnh xếp tầng (mặt bàn → vương miện →
 *    đai → đáy → chóp), vòng kề nhau lệch nửa bước để ra các mặt TAM GIÁC như
 *    giác cắt thật. Mỗi tam giác một pháp tuyến riêng (không nội suy) nên mặt nào
 *    ra mặt nấy, sắc cạnh.
 *
 * 2. Ánh sáng là một "STUDIO CHỤP TRANG SỨC": nền tối, vài hộp đèn rất sáng, vài
 *    tấm phản quang màu. Kim cương sáng lấp lánh là vì mỗi mặt phản chiếu một chỗ
 *    khác nhau của phòng — mặt thì trúng hộp đèn (trắng loá), mặt thì trúng nền
 *    tối (đen sâu). Độ tương phản giữa hai mặt kề nhau chính là "độ lửa".
 *
 * 3. Shader tính đường đi của tia: một phần PHẢN XẠ ở mặt ngoài (Fresnel), phần
 *    còn lại KHÚC XẠ vào trong (chiết suất kim cương 2,42), dội lại ở đáy rồi ra
 *    ngoài. Ba màu đỏ–lục–lam khúc xạ với ba chiết suất hơi khác nhau → viền cầu
 *    vồng (tán sắc) — thứ làm kim cương khác thuỷ tinh.
 *
 * 4. Tia lấp lánh: vài ngôi sao bốn cánh loé lên rồi tắt trên mặt đá.
 */
import * as THREE from 'three';

export type Cut = 'brilliant' | 'princess' | 'emerald' | 'oval';

/** Màu thân đá. "clear" là kim cương trắng hơi ánh lam, như đá thật dưới đèn studio. */
export const GEM_COLORS = {
  clear: '#EEF4FF',
  sapphire: '#1D5BFF',
  ruby: '#F0124F',
  emerald: '#10C07A',
  amethyst: '#9A4DFF',
  topaz: '#FF9F1A',
  pink: '#FF5CB0',
} as const;

export type GemColor = keyof typeof GEM_COLORS;

type Ring = { y: number; r: number; offset: boolean };

/** Bán kính theo góc của đường viền đai: tròn, vuông (princess), bát giác (emerald), bầu dục. */
function outline(cut: Cut, theta: number): [number, number] {
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  if (cut === 'princess') {
    const k = 1 / Math.max(Math.abs(c), Math.abs(s));
    return [c * k * 0.82, s * k * 0.82];
  }
  if (cut === 'emerald') {
    // Chữ nhật vát góc: giao của hình chữ nhật 1,0 × 0,72 với hình thoi cắt góc.
    const w = 1;
    const h = 0.72;
    const cutc = 1.38;
    const k = Math.min(w / Math.max(Math.abs(c), 1e-6), h / Math.max(Math.abs(s), 1e-6), cutc / (Math.abs(c) + Math.abs(s)));
    return [c * k, s * k];
  }
  if (cut === 'oval') return [c * 1.22, s * 0.86];
  return [c, s];
}

/** Các vòng từ trên xuống: mặt bàn, vương miện, đai, đáy. Chóp đáy thêm riêng. */
function ringsFor(cut: Cut): { rings: Ring[]; culet: number; segments: number } {
  if (cut === 'emerald') {
    // Giác cắt bậc thang: các bậc song song, không lệch nửa bước.
    return {
      segments: 24,
      culet: -0.62,
      rings: [
        { y: 0.34, r: 0.6, offset: false },
        { y: 0.27, r: 0.78, offset: false },
        { y: 0.17, r: 0.92, offset: false },
        { y: 0.08, r: 1, offset: false },
        { y: 0.03, r: 1, offset: false },
        { y: -0.22, r: 0.74, offset: false },
        { y: -0.44, r: 0.44, offset: false },
      ],
    };
  }
  return {
    segments: cut === 'princess' ? 16 : 16,
    culet: cut === 'princess' ? -0.78 : -0.9,
    rings: [
      { y: 0.36, r: 0.55, offset: false }, // mép mặt bàn
      { y: 0.25, r: 0.8, offset: true }, // mặt sao / mặt diều của vương miện
      { y: 0.09, r: 1, offset: false }, // đai trên
      { y: 0.04, r: 1, offset: false }, // đai dưới
      { y: -0.38, r: 0.6, offset: true }, // giữa đáy
    ],
  };
}

/**
 * Dựng hình học giác cắt (không chỉ mục: mỗi tam giác có đỉnh riêng để pháp
 * tuyến là pháp tuyến MẶT, không bị làm mềm).
 */
export function gemGeometry(cut: Cut): THREE.BufferGeometry {
  const { rings, culet, segments: n } = ringsFor(cut);
  const pos: number[] = [];
  const at = (ring: Ring, j: number): [number, number, number] => {
    const theta = ((j + (ring.offset ? 0.5 : 0)) / n) * Math.PI * 2;
    const [x, z] = outline(cut, theta);
    return [x * ring.r, ring.y, z * ring.r];
  };
  const tri = (a: number[], b: number[], c: number[]) => pos.push(...a, ...b, ...c);

  // Mặt bàn: một mặt phẳng duy nhất.
  const top = rings[0]!;
  for (let j = 0; j < n; j += 1) tri([0, top.y, 0], at(top, j + 1), at(top, j));

  // Các dải giữa hai vòng liền nhau.
  for (let k = 0; k < rings.length - 1; k += 1) {
    const A = rings[k]!;
    const B = rings[k + 1]!;
    for (let j = 0; j < n; j += 1) {
      const a0 = at(A, j);
      const a1 = at(A, j + 1);
      if (A.offset === B.offset) {
        // Hai vòng thẳng hàng: mặt hình thang (hai tam giác cùng mặt phẳng) — giác bậc thang.
        const b0 = at(B, j);
        const b1 = at(B, j + 1);
        tri(a0, a1, b1);
        tri(a0, b1, b0);
      } else if (B.offset) {
        // Vòng dưới lệch nửa bước: tam giác chĩa xuống (đỉnh ở giữa cạnh trên) xen
        // tam giác chĩa lên — đúng dáng mặt sao, mặt diều của giác cắt tròn.
        tri(a0, a1, at(B, j));
        tri(a1, at(B, j + 1), at(B, j));
      } else {
        // Vòng trên lệch nửa bước.
        tri(at(A, j - 1), a0, at(B, j));
        tri(a0, at(B, j + 1), at(B, j));
      }
    }
  }

  // Chóp đáy.
  const last = rings[rings.length - 1]!;
  for (let j = 0; j < n; j += 1) tri(at(last, j), at(last, j + 1), [0, culet, 0]);

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

// ---------------------------------------------------------------- studio

const envCache = new WeakMap<THREE.WebGLRenderer, THREE.WebGLCubeRenderTarget>();

/**
 * Căn phòng chụp trang sức, vẽ MỘT LẦN vào một cube map dải động cao (HDR): nền
 * tối có chuyển sắc, hộp đèn trắng rất sáng (giá trị > 1), vài tấm phản quang
 * màu cho ánh lửa, và vài chấm sáng nhỏ để mặt đá loé lên khi xoay.
 */
export function gemEnvironment(renderer: THREE.WebGLRenderer): THREE.CubeTexture {
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

// ---------------------------------------------------------------- vật liệu

/**
 * Shader đá quý. `fire` = độ mạnh của tán sắc cầu vồng; `body` = độ đậm màu thân
 * đá (0 là kim cương trắng, 1 là đá màu đậm như ruby).
 */
export function gemMaterial(env: THREE.CubeTexture, color: string, opts: { fire?: number; body?: number } = {}): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      envMap: { value: env },
      tint: { value: new THREE.Color(color) },
      fire: { value: opts.fire ?? 1 },
      body: { value: opts.body ?? 0.55 },
    },
    vertexShader: `
      varying vec3 vWorldPos;
      varying vec3 vNormal;
      varying vec3 vJitter;
      vec3 hash3(vec3 p) {
        p = fract(p * vec3(443.897, 441.423, 437.195));
        p += dot(p, p.yxz + 19.19);
        return fract((p.xxy + p.yxx) * p.zyx);
      }
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        vNormal = normalize(mat3(modelMatrix) * normal);
        // "Căn cước" của từng mặt lấy từ pháp tuyến trong hệ toạ độ của chính viên
        // đá (ba đỉnh một mặt chung pháp tuyến → cả mặt chung một giá trị), rồi xoay
        // theo đá: độ lệch của mặt đáy đón tia gắn chặt vào viên đá.
        vJitter = mat3(modelMatrix) * ((hash3(normal * 3.7 + 1.3) - 0.5) * 2.2);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: `
      uniform samplerCube envMap;
      uniform vec3 tint;
      uniform float fire;
      uniform float body;
      varying vec3 vWorldPos;
      varying vec3 vNormal;
      varying vec3 vJitter;

      vec3 env(vec3 d) { return textureCube(envMap, d).rgb; }

      // Tia vào trong đá: khúc xạ ở mặt trên, dội ở các mặt đáy (phản xạ toàn phần)
      // rồi ló ra. Mặt đáy nào đón tia thì tuỳ từng mặt trên — nên mỗi mặt có một
      // pháp tuyến dội riêng, gắn chặt vào viên đá (xoay theo đá): khi đá xoay, từng
      // mặt lần lượt quét qua các ô đèn và loé lên, đúng kiểu kim cương thật.
      vec3 trace(vec3 I, vec3 N, vec3 jitter, float eta) {
        vec3 t = refract(I, N, eta);
        if (dot(t, t) < 1e-4) t = reflect(I, N);
        vec3 back = normalize(-N + vec3(0.0, -1.1, 0.0) + jitter);
        t = reflect(t, back);
        return normalize(t);
      }

      void main() {
        vec3 N = normalize(vNormal);
        vec3 V = normalize(cameraPosition - vWorldPos);
        if (dot(N, V) < 0.0) N = -N;
        vec3 I = -V;
        float cosT = clamp(dot(N, V), 0.0, 1.0);
        // Fresnel Schlick với F0 ≈ 0,17 của kim cương.
        float F = 0.17 + 0.83 * pow(1.0 - cosT, 5.0);

        vec3 jitter = vJitter;
        vec3 surface = env(reflect(I, N));
        float spread = 0.1 * fire;
        vec3 inside = vec3(
          env(trace(I, N, jitter, 1.0 / (2.42 - spread))).r,
          env(trace(I, N, jitter, 1.0 / 2.42)).g,
          env(trace(I, N, jitter, 1.0 / (2.42 + spread))).b
        );
        // Thân đá hấp thụ ánh sáng theo màu của nó. Bình phương màu (trong không gian
        // tuyến tính) cho màu đậm hơn — ánh qua thân ruby là đỏ thẫm chứ không hồng phấn.
        vec3 bodyTint = mix(vec3(1.0), tint * tint * 1.25, body);
        vec3 col = inside * bodyTint * mix(1.05, 0.8, body) + surface * F * mix(vec3(1.0), tint, 0.25);
        // Không để mặt nào đen kịt: đá thật luôn còn ánh màu của chính nó — đá màu
        // (ruby, sapphire) sáng rực từ bên trong hơn kim cương trắng.
        col += tint * (0.05 + body * 0.22);
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
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
 * Gắn `count` tia lấp lánh lên một viên đá (con của viên đá, nên xoay theo đá).
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

/** Quầng sáng mềm sau viên đá, cùng màu đá. */
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
