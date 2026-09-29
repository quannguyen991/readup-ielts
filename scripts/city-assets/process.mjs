/**
 * Chuẩn hoá model thô (assets/city/_raw) thành GLB nhẹ cho web:
 *
 *   node scripts/city-assets/process.mjs
 *
 * Từng model: CHUYỂN SANG BẢNG MÀU (lấy màu ảnh tại từng đỉnh → màu đỉnh, lượng
 * tử hoá về ít bậc màu, bỏ ảnh / UV / pháp tuyến — lúc chạy vẽ toon đổ bóng
 * phẳng, cùng phong cách với công trình sinh bằng code), gộp cây node, hàn
 * đỉnh, giảm tam giác xuống ngân sách, gốc ở TÂM ĐÁY, trục Y lên, co về kích
 * thước ô lưới (1 ô = 1 đơn vị), nén hình học meshopt → `public/city/models/<id>.glb`.
 *
 * Từ chối model không có dòng trong LICENSES.json. Tổng dung lượng phải ≤ 25 MB.
 * In bảng trước / sau (tam giác, KB) để soát.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NodeIO, getBounds } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { center, dedup, flatten, join, meshopt, prune, simplify, weld } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const RAW_DIR = path.join(ROOT, 'assets/city/_raw');
const OUT_DIR = path.join(ROOT, 'public/city/models');
const LICENSES = path.join(ROOT, 'assets/city/LICENSES.json');
const MAX_TOTAL = 25 * 1024 * 1024;

/**
 * Kích thước đích (đơn vị ô) và ngân sách tam giác. Model hiện rất nhỏ trên màn
 * (đèn đường cao ~1 ô ≈ 40 px) nên vài trăm tam giác là đủ — mỗi model có thể lặp
 * hàng chục lần trong thành phố (vẽ bằng instancing).
 */
const CONFIG = {
  barrel_03: { span: 0.3, tris: 400 },
  // Cụm nhiều thùng rời: giảm thêm là vỡ hình từng thùng → ngân sách riêng.
  wooden_barrels_01: { span: 0.62, tris: 1600 },
  stone_fire_pit: { span: 0.55, tris: 600 },
  vintage_oil_lamp: { height: 0.2, tris: 300 },
  handsaw_wood: { span: 0.3, tris: 300 },
  WoodenChair_01: { height: 0.3, tris: 400 },
  WoodenTable_01: { span: 0.42, tris: 400 },
  stone_01: { span: 0.45, tris: 400 },
  painted_wooden_bench: { span: 0.55, tris: 500 },
  planter_pot_clay: { span: 0.28, tris: 400 },
  street_lamp_01: { height: 0.95, tris: 600 },
  street_lamp_02: { height: 1.05, tris: 700 },
  tool_cart: { span: 0.5, tris: 800 },
};

/** Số bậc mỗi kênh màu (sRGB) sau lượng tử hoá — ít bậc = đậm chất toon. */
const LEVELS = 12;

const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toSrgb = (c) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);

/**
 * Ảnh màu → màu đỉnh (COLOR_0), rồi bỏ ảnh, UV, pháp tuyến. Mẫu màu lấy tại UV
 * của đỉnh (ảnh baseColor là sRGB; COLOR_0 là tuyến tính theo chuẩn glTF).
 */
async function bakePalette(doc) {
  const decoded = new Map();
  const buffer = doc.getRoot().listBuffers()[0] ?? doc.createBuffer();
  for (const mesh of doc.getRoot().listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      const mat = prim.getMaterial();
      const f = mat ? mat.getBaseColorFactor() : [1, 1, 1, 1];
      const tex = mat?.getBaseColorTexture() ?? null;
      const uv = prim.getAttribute('TEXCOORD_0');
      const pos = prim.getAttribute('POSITION');
      if (!pos) continue;
      let img = null;
      if (tex && uv) {
        img = decoded.get(tex);
        if (!img) {
          const { data, info } = await sharp(Buffer.from(tex.getImage())).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
          img = { data, w: info.width, h: info.height };
          decoded.set(tex, img);
        }
      }
      const n = pos.getCount();
      const out = new Float32Array(n * 3);
      const t = [0, 0];
      for (let i = 0; i < n; i++) {
        let rgb = [1, 1, 1];
        if (img) {
          uv.getElement(i, t);
          const u = ((t[0] % 1) + 1) % 1;
          const v = ((t[1] % 1) + 1) % 1;
          const px = Math.min(img.w - 1, Math.floor(u * img.w));
          const py = Math.min(img.h - 1, Math.floor(v * img.h));
          const k = (py * img.w + px) * 4;
          rgb = [toLinear(img.data[k] / 255), toLinear(img.data[k + 1] / 255), toLinear(img.data[k + 2] / 255)];
        }
        for (let c = 0; c < 3; c++) {
          // Nhân hệ số màu, tăng bão hoà nhẹ, lượng tử hoá trong không gian sRGB.
          const lin = rgb[c] * f[c];
          const q = Math.round(Math.min(1, toSrgb(lin)) * (LEVELS - 1)) / (LEVELS - 1);
          out[i * 3 + c] = toLinear(q);
        }
      }
      prim.setAttribute('COLOR_0', doc.createAccessor().setType('VEC3').setArray(out).setBuffer(buffer));
      for (const name of ['TEXCOORD_0', 'TEXCOORD_1', 'NORMAL', 'TANGENT']) if (prim.getAttribute(name)) prim.setAttribute(name, null);
    }
  }
  for (const mat of doc.getRoot().listMaterials()) {
    const a = mat.getBaseColorFactor()[3];
    mat.setBaseColorTexture(null).setNormalTexture(null).setOcclusionTexture(null).setMetallicRoughnessTexture(null).setEmissiveTexture(null);
    mat.setBaseColorFactor([1, 1, 1, a]).setMetallicFactor(0).setRoughnessFactor(1);
    if (mat.getAlphaMode() === 'MASK') mat.setAlphaMode('OPAQUE');
  }
}

function triCount(doc) {
  let n = 0;
  for (const mesh of doc.getRoot().listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      const idx = prim.getIndices();
      const pos = prim.getAttribute('POSITION');
      n += idx ? idx.getCount() / 3 : pos ? pos.getCount() / 3 : 0;
    }
  }
  return Math.round(n);
}

export async function processAll() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const rows = JSON.parse(fs.readFileSync(LICENSES, 'utf8'));
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
  await MeshoptDecoder.ready;
  await MeshoptEncoder.ready;
  await MeshoptSimplifier.ready;

  const report = [];
  let total = 0;
  for (const row of rows) {
    const cfg = CONFIG[row.id];
    const src = path.join(RAW_DIR, row.id, `${row.id}_1k.gltf`);
    if (!cfg) throw new Error(`${row.id}: chưa có cấu hình kích thước trong process.mjs`);
    if (!fs.existsSync(src)) {
      console.warn(`! ${row.id}: thiếu file thô, chạy fetch.mjs trước`);
      continue;
    }
    const doc = await io.read(src);
    const before = triCount(doc);
    const rawKb = fs.readdirSync(path.join(RAW_DIR, row.id), { recursive: true }).reduce((s, f) => {
      const p = path.join(RAW_DIR, row.id, String(f));
      return fs.statSync(p).isFile() ? s + fs.statSync(p).size : s;
    }, 0) / 1024;

    await bakePalette(doc);
    await doc.transform(prune(), dedup(), flatten(), join(), weld());
    const tris = triCount(doc);
    if (tris > cfg.tris) await doc.transform(simplify({ simplifier: MeshoptSimplifier, ratio: cfg.tris / tris, error: cfg.err ?? 0.06 }), weld());

    // Gốc ở tâm đáy, rồi co về kích thước ô.
    await doc.transform(center({ pivot: 'below' }));
    const scene = doc.getRoot().getDefaultScene() ?? doc.getRoot().listScenes()[0];
    const b = getBounds(scene);
    const size = [b.max[0] - b.min[0], b.max[1] - b.min[1], b.max[2] - b.min[2]];
    const s = cfg.height ? cfg.height / (size[1] || 1) : cfg.span / (Math.max(size[0], size[2]) || 1);
    for (const node of scene.listChildren()) {
      const t = node.getTranslation();
      const sc = node.getScale();
      node.setTranslation([t[0] * s, t[1] * s, t[2] * s]);
      node.setScale([sc[0] * s, sc[1] * s, sc[2] * s]);
    }

    await doc.transform(prune(), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
    const out = path.join(OUT_DIR, `${row.id}.glb`);
    const buf = await io.writeBinary(doc);
    fs.writeFileSync(out, Buffer.from(buf));
    total += buf.byteLength;
    report.push({ id: row.id, trisBefore: before, trisAfter: triCount(doc), rawKb: Math.round(rawKb), glbKb: Math.round(buf.byteLength / 1024), size: size.map((v) => +(v * s).toFixed(2)) });
  }
  console.table(report);
  console.log(`Tổng: ${(total / 1024 / 1024).toFixed(2)} MB (trần 25 MB)`);
  if (total > MAX_TOTAL) throw new Error('Vượt ngân sách 25 MB');
  // Không để GLB mồ côi (không có dòng giấy phép).
  const ids = new Set(rows.map((r) => r.id));
  for (const f of fs.readdirSync(OUT_DIR)) if (f.endsWith('.glb') && !ids.has(f.replace(/\.glb$/, ''))) throw new Error(`GLB không có giấy phép: ${f}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  processAll().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
