// Bật Metro web NHẸ, và chỉ MỘT cái: node scripts/dev/web-lite.mjs [port=8083]
//  - Cổng đã có server thì dùng lại, không bật thêm cái thứ hai (mỗi Metro ăn 2–6 GB RAM).
//  - Giới hạn heap Node (mặc định 4096 MB, đổi bằng WEB_HEAP_MB) để Metro dọn rác thay vì phình mãi.
//  - Giới hạn số worker biên dịch (mặc định 4, đổi bằng WEB_WORKERS) thay vì mỗi nhân CPU một cái.
import net from 'node:net';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const port = Number(process.argv[2] ?? process.env.WEB_PORT ?? 8083);
const heap = process.env.WEB_HEAP_MB ?? '4096';
const workers = process.env.WEB_WORKERS ?? '4';

const inUse = await new Promise((resolve) => {
  const s = net.connect({ port, host: '127.0.0.1' });
  s.once('connect', () => { s.destroy(); resolve(true); });
  s.once('error', () => resolve(false));
});
if (inUse) {
  console.log(`Cổng ${port} đã có server — dùng lại: http://127.0.0.1:${port}`);
  process.exit(0);
}

const cli = path.join(root, 'node_modules', 'expo', 'bin', 'cli');
const child = spawn(process.execPath, [cli, 'start', '--web', '--port', String(port), '--max-workers', workers], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, NODE_OPTIONS: `--max-old-space-size=${heap} ${process.env.NODE_OPTIONS ?? ''}`.trim() },
});
child.on('exit', (code) => process.exit(code ?? 0));
