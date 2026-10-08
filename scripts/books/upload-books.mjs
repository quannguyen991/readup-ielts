// Đưa 11 cuốn PDF gốc lên kho riêng tư `books` (masters/<file>, bố cục ở src/services/books/storage.ts).
//
//   node scripts/books/upload-books.mjs [thư-mục-sách]
//
// Chỉ đẩy file có tên trong src/services/books/catalog.ts (thư mục gốc còn lộ trình cá nhân, lịch tuần,
// script — không được quét cả thư mục). Kho để private: không ai đọc thẳng được, chỉ API
// /api/books/pdf dùng khoá service lấy bản gốc ra in email + mã đơn rồi trả link ký có hạn.
// Chạy lại an toàn: upsert đè bản cũ, và cập nhật cấu hình kho (riêng tư, nhận PDF + JSON).
import { readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = process.argv[2] ?? 'D:/Claude/tong-hop-sach';
const BUCKET = 'books'; // trùng BOOKS_BUCKET trong src/services/books/storage.ts

function loadEnv() {
  const env = {};
  for (const line of readFileSync(join(ROOT, '.env.local'), 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
  return env;
}

function catalogFiles() {
  const text = readFileSync(join(ROOT, 'src/services/books/catalog.ts'), 'utf8');
  return [...text.matchAll(/file: '([^']+\.pdf)'/g)].map((m) => m[1]);
}

const env = loadEnv();
const url = env.EXPO_PUBLIC_SUPABASE_URL ?? env.SUPABASE_URL;
const key = env.SUPABASE_SERVICE_KEY;
if (!url || !key) throw new Error('Thiếu EXPO_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_KEY trong .env.local');
const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const files = catalogFiles();
if (files.length !== 11) throw new Error(`catalog có ${files.length} file, cần 11`);

const { data: buckets, error: listErr } = await admin.storage.listBuckets();
if (listErr) throw listErr;
if (!buckets.some((b) => b.name === BUCKET)) {
  const { error } = await admin.storage.createBucket(BUCKET, { public: false, fileSizeLimit: '20MB', allowedMimeTypes: ['application/pdf', 'application/json'] });
  if (error) throw error;
  console.log(`đã tạo kho riêng tư "${BUCKET}"`);
} else if (buckets.find((b) => b.name === BUCKET)?.public) {
  throw new Error(`kho "${BUCKET}" đang để công khai — tắt public trên Supabase trước khi đẩy sách`);
} else {
  // sổ tải log/<user>.json cũng nằm trong kho này (xem storage.ts)
  const { error } = await admin.storage.updateBucket(BUCKET, { public: false, fileSizeLimit: '20MB', allowedMimeTypes: ['application/pdf', 'application/json'] });
  if (error) throw error;
}

for (const file of files) {
  const path = join(SRC, file);
  const bytes = readFileSync(path);
  const { error } = await admin.storage.from(BUCKET).upload(`masters/${file}`, bytes, { contentType: 'application/pdf', upsert: true });
  if (error) throw new Error(`${file}: ${error.message}`);
  console.log(`masters/${file}  ${(statSync(path).size / 1048576).toFixed(1)} MB`);
}
console.log('xong');
