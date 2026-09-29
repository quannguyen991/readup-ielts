/**
 * Tải model trang trí cho Thành Phố Tri Thức từ Poly Haven (giấy phép CC0 —
 * https://polyhaven.com/license — dùng thương mại được, không cần ghi công
 * nhưng ReadUp vẫn ghi).
 *
 *   node scripts/city-assets/fetch.mjs
 *
 * QUY TẮC:
 * - Ghi dòng giấy phép vào `assets/city/LICENSES.json` TRƯỚC khi tải file.
 * - File thô vào `assets/city/_raw/<id>/` (đã gitignore, không commit).
 * - Chỉ nguồn có giấy phép thương mại rõ ràng. Nguồn cần đăng nhập / captcha
 *   (Free3D...) KHÔNG tải tự động — ghi vào `assets/city/_can-tai-tay.md`.
 * - Đã có file thô thì bỏ qua (chạy lại không tải lại).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const RAW_DIR = path.join(ROOT, 'assets/city/_raw');
const LICENSES = path.join(ROOT, 'assets/city/LICENSES.json');

/** Danh sách model. `era`: kỷ đầu tiên dùng tới (để nạp lười theo kỷ). */
export const TARGETS = [
  { id: 'stone_fire_pit', ten: 'Bếp lửa dã ngoại', tenEn: 'Stone fire pit', era: 1 },
  { id: 'vintage_oil_lamp', ten: 'Đèn bão dầu', tenEn: 'Oil lantern', era: 1 },
  { id: 'stone_01', ten: 'Khối đá tự nhiên', tenEn: 'Boulder', era: 1 },
  { id: 'barrel_03', ten: 'Thùng gỗ đơn', tenEn: 'Single wooden barrel', era: 1 },
  { id: 'wooden_barrels_01', ten: 'Cụm thùng bến cảng', tenEn: 'Harbour barrel stack', era: 2 },
  { id: 'handsaw_wood', ten: 'Dụng cụ cưa mộc', tenEn: 'Carpenter hand saw', era: 2 },
  { id: 'WoodenChair_01', ten: 'Ghế gỗ mộc', tenEn: 'Wooden chair', era: 2 },
  { id: 'WoodenTable_01', ten: 'Bàn gỗ mộc', tenEn: 'Wooden table', era: 2 },
  { id: 'painted_wooden_bench', ten: 'Ghế băng công viên', tenEn: 'Painted wooden bench', era: 3 },
  { id: 'planter_pot_clay', ten: 'Chậu đất nung', tenEn: 'Clay planter', era: 3 },
  { id: 'street_lamp_01', ten: 'Đèn đường cổ', tenEn: 'Street lamp', era: 3 },
  { id: 'street_lamp_02', ten: 'Đèn đường hiện đại', tenEn: 'Modern street lamp', era: 4 },
  { id: 'tool_cart', ten: 'Xe đẩy dụng cụ', tenEn: 'Tool cart', era: 1 },
];

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} khi tải ${url}`);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
}

function readLicenses() {
  if (!fs.existsSync(LICENSES)) return [];
  return JSON.parse(fs.readFileSync(LICENSES, 'utf8'));
}

function writeLicenses(rows) {
  fs.mkdirSync(path.dirname(LICENSES), { recursive: true });
  fs.writeFileSync(LICENSES, JSON.stringify(rows, null, 2) + '\n', 'utf8');
}

export async function fetchAll() {
  fs.mkdirSync(RAW_DIR, { recursive: true });
  const rows = readLicenses();
  let meta = null;
  for (const t of TARGETS) {
    // 1) Ghi giấy phép trước.
    if (!rows.some((r) => r.id === t.id)) {
      meta ??= await (await fetch('https://api.polyhaven.com/assets?type=models')).json();
      const m = meta[t.id];
      if (!m) throw new Error(`Poly Haven không có model ${t.id}`);
      const author = Object.keys(m.authors ?? {}).join(', ') || 'Poly Haven';
      rows.push({
        id: t.id,
        ten: t.ten,
        tenEn: t.tenEn,
        nguon: 'Poly Haven',
        url: `https://polyhaven.com/a/${t.id}`,
        giayPhep: 'CC0 1.0 Universal (Public Domain)',
        tacGia: author,
        ghiCong: `${t.ten} - 3D model by ${author} via Poly Haven (CC0)`,
        ghiCongEn: `${t.tenEn} — 3D model by ${author} via Poly Haven (CC0)`,
        ngayTai: new Date().toISOString().slice(0, 10),
      });
      writeLicenses(rows);
      console.log(`+ giấy phép ${t.id}`);
    }
    // 2) Rồi mới tải file thô.
    const dir = path.join(RAW_DIR, t.id);
    const gltf = path.join(dir, `${t.id}_1k.gltf`);
    if (fs.existsSync(gltf)) {
      console.log(`= ${t.id}: đã có file thô`);
      continue;
    }
    const files = await (await fetch(`https://api.polyhaven.com/files/${t.id}`)).json();
    const pack = files.gltf?.['1k']?.gltf;
    if (!pack) throw new Error(`${t.id}: không có bản glTF 1k`);
    await download(pack.url, gltf);
    for (const [rel, inc] of Object.entries(pack.include ?? {})) await download(inc.url, path.join(dir, rel));
    console.log(`↓ ${t.id}`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  fetchAll().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
