// Xem bản web đã đóng gói (RẤT NHẸ, vài chục MB, không Metro): node scripts/dev/web-static.mjs [port=8083] [--skip-export]
// Dùng khi chỉ cần xem/chụp giao diện. Sửa code thì chạy lại (xuất mất vài phút) hoặc dùng web-lite.mjs để có làm mới tức thì.
// Xuất ra thư mục `dist` (đã nằm trong danh sách Metro bỏ qua), rồi `expo serve` — phục vụ cả các route app/api.
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
const skipExport = args.includes('--skip-export');
const port = args.find((a) => /^\d+$/.test(a)) ?? process.env.WEB_PORT ?? '8083';
const heap = process.env.WEB_HEAP_MB ?? '6144'; // chỉ chạy một lần rồi thoát, nên cho rộng
const cli = path.join(root, 'node_modules', 'expo', 'bin', 'cli');
const env = { ...process.env, NODE_OPTIONS: `--max-old-space-size=${heap} ${process.env.NODE_OPTIONS ?? ''}`.trim() };

if (!skipExport) {
  console.log('Đang xuất bản web (một lần, rồi thoát để nhả RAM)…');
  const r = spawnSync(process.execPath, [cli, 'export', '-p', 'web', '--max-workers', process.env.WEB_WORKERS ?? '4'], { cwd: root, stdio: 'inherit', env });
  if (r.status !== 0) process.exit(r.status ?? 1);
}
console.log(`Phục vụ bản đã xuất tại http://127.0.0.1:${port}`);
const srv = spawn(process.execPath, [cli, 'serve', root, '--port', port], { cwd: root, stdio: 'inherit' });
srv.on('exit', (code) => process.exit(code ?? 0));
