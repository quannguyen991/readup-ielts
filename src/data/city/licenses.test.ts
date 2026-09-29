import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { CREDITS } from './credits';
import { DECOR, DECOR_MODELS, SITE_TOOLS } from './decor-map';

/**
 * Giấy phép tài nguyên 3D — kiểm HAI CHIỀU: mỗi GLB trong public/city/models
 * có đúng một dòng giấy phép, và mỗi dòng giấy phép có GLB tương ứng. Model
 * dùng trong decor-map phải có giấy phép. File thô không được commit.
 */
const ROOT = path.resolve(__dirname, '../../..');
const MODELS = path.join(ROOT, 'public/city/models');
const ALLOWED = [/^CC0 1\.0/, /Royalty Free.*commercial/i, /Commercial Use/i];

test('mỗi GLB có dòng giấy phép và ngược lại', () => {
  const glbs = fs
    .readdirSync(MODELS)
    .filter((f) => f.endsWith('.glb'))
    .map((f) => f.replace(/\.glb$/, ''))
    .sort();
  const ids = CREDITS.map((c) => c.id).sort();
  assert.deepEqual(glbs, ids);
  assert.equal(new Set(ids).size, ids.length, 'mã model trùng trong LICENSES.json');
});

test('dòng giấy phép đủ trường và cho phép thương mại', () => {
  for (const c of CREDITS) {
    for (const k of ['id', 'ten', 'tenEn', 'nguon', 'url', 'giayPhep', 'tacGia', 'ghiCong', 'ghiCongEn', 'ngayTai'] as const) {
      assert.ok(String(c[k] ?? '').trim(), `${c.id}: thiếu ${k}`);
    }
    assert.ok(ALLOWED.some((re) => re.test(c.giayPhep)), `${c.id}: giấy phép không rõ cho phép thương mại: ${c.giayPhep}`);
    assert.match(c.url, /^https:\/\//);
    assert.match(c.ngayTai, /^\d{4}-\d{2}-\d{2}$/);
  }
});

test('model dùng trong decor-map đều có giấy phép', () => {
  const ids = new Set(CREDITS.map((c) => c.id));
  for (const m of DECOR_MODELS) assert.ok(ids.has(m), `${m} chưa có giấy phép`);
  for (const list of [...Object.values(DECOR), SITE_TOOLS]) for (const d of list) assert.ok(ids.has(d.model), `${d.model} chưa có giấy phép`);
});

test('tổng dung lượng model ≤ 25 MB, file thô bị gitignore', () => {
  const total = fs.readdirSync(MODELS).reduce((s, f) => s + fs.statSync(path.join(MODELS, f)).size, 0);
  assert.ok(total <= 25 * 1024 * 1024, `tổng ${total} byte`);
  const gi = fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf8');
  assert.match(gi, /^assets\/city\/_raw\/$/m);
});
