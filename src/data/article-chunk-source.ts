/**
 * Nguồn toàn văn bài đọc cho web và máy chủ (bản native nằm ở article-chunk-source.native.ts).
 *
 * Toàn văn KHÔNG nằm trong bundle JS: `scripts/sync-bodies.mjs` chép chunk sang
 * public/data/bodies/.
 *  - Trình duyệt: tải HTTP đúng chunk khi người học mở bài (async).
 *  - Node (máy chủ, test, script): đọc thẳng từ đĩa, đồng bộ. Thư mục lấy từ
 *    BAND9_DATA_DIR, nếu không có thì dùng <cwd>/public/data/bodies.
 *
 * `process.getBuiltinModule` được dùng thay cho import 'fs' để không kéo fs vào bundle web.
 */

type Chunk = Record<string, unknown>;

function nodeFs(): { readFileSync(p: string, enc: 'utf8'): string; existsSync(p: string): boolean } | null {
  if (typeof window !== 'undefined') return null;
  const proc = (globalThis as { process?: { getBuiltinModule?: (name: string) => unknown } }).process;
  const getBuiltin = proc?.getBuiltinModule;
  if (typeof getBuiltin !== 'function') return null;
  return (getBuiltin('fs') as ReturnType<typeof nodeFs>) ?? null;
}

function nodePath(): { join(...parts: string[]): string } | null {
  const proc = (globalThis as { process?: { getBuiltinModule?: (name: string) => unknown } }).process;
  const getBuiltin = proc?.getBuiltinModule;
  if (typeof getBuiltin !== 'function') return null;
  return (getBuiltin('path') as { join(...parts: string[]): string }) ?? null;
}

function dataDir(): string | null {
  const fs = nodeFs();
  const path = nodePath();
  if (!fs || !path) return null;
  const env = (globalThis as { process?: { env?: Record<string, string | undefined>; cwd?: () => string } }).process;
  const fromEnv = env?.env?.BAND9_DATA_DIR;
  if (fromEnv) return fromEnv;
  const cwd = env?.cwd?.();
  if (!cwd) return null;
  const dir = path.join(cwd, 'public', 'data', 'bodies');
  return fs.existsSync(dir) ? dir : null;
}

/**
 * Đọc chunk đồng bộ từ đĩa (chỉ có trên Node). Trả undefined khi không đọc được
 * đồng bộ (trình duyệt), để bên gọi biết phải tải bất đồng bộ.
 */
export function tryReadChunkSync(index: number): Chunk | null | undefined {
  const dir = dataDir();
  const fs = nodeFs();
  const path = nodePath();
  if (!dir || !fs || !path) return undefined;
  const name = `chunk-${String(index).padStart(2, '0')}.json`;
  try {
    return JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8')) as Chunk;
  } catch {
    return null;
  }
}

function baseUrl(): string {
  if (typeof window !== 'undefined') return '';
  const proc = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
  return proc?.env?.BAND9_INTERNAL_URL ?? 'http://127.0.0.1:3400';
}

/** Tải chunk bất đồng bộ: trình duyệt qua HTTP; Node không có thư mục thì qua HTTP tới chính máy chủ. */
export async function fetchChunk(index: number): Promise<Chunk | null> {
  const name = `chunk-${String(index).padStart(2, '0')}.json`;
  const res = await fetch(`${baseUrl()}/data/bodies/${name}`);
  if (!res.ok) throw new Error(`chunk ${name}: HTTP ${res.status}`);
  return (await res.json()) as Chunk;
}
