/**
 * Nguồn toàn văn bài đọc cho web và máy chủ (bản native nằm ở article-chunk-source.native.ts).
 *
 * Toàn văn KHÔNG nằm trong bundle JS: `scripts/sync-bodies.mjs` chép chunk sang
 * public/data/bodies/.
 *  - Trình duyệt: tải HTTP đúng chunk khi người học mở bài (async).
 *  - Máy chủ (SSR và API): đọc từ đĩa bất đồng bộ. Luôn bất đồng bộ để HTML máy chủ
 *    khớp với lần vẽ đầu của trình duyệt (không lệch khi hydrate).
 *  - Test và script chạy trên Node đặt BAND9_SYNC_READ=1 để đọc đồng bộ từ đĩa.
 *
 * `process.getBuiltinModule` được dùng thay cho import 'fs' để không kéo fs vào bundle web.
 */

type Chunk = Record<string, unknown>;
type Proc = { env?: Record<string, string | undefined>; cwd?: () => string; getBuiltinModule?: (name: string) => unknown };

function proc(): Proc | undefined {
  return (globalThis as { process?: Proc }).process;
}

type NodeFs = {
  readFileSync(p: string, enc: 'utf8'): string;
  existsSync(p: string): boolean;
  promises: { readFile(p: string, enc: 'utf8'): Promise<string> };
};

function nodeFs(): NodeFs | null {
  if (typeof window !== 'undefined') return null;
  const getBuiltin = proc()?.getBuiltinModule;
  if (typeof getBuiltin !== 'function') return null;
  return (getBuiltin('fs') as NodeFs | undefined) ?? null;
}

function nodePath(): { join(...parts: string[]): string } | null {
  const getBuiltin = proc()?.getBuiltinModule;
  if (typeof getBuiltin !== 'function') return null;
  return (getBuiltin('path') as { join(...parts: string[]): string }) ?? null;
}

function dataDir(): string | null {
  const fs = nodeFs();
  const path = nodePath();
  if (!fs || !path) return null;
  const fromEnv = proc()?.env?.BAND9_DATA_DIR;
  if (fromEnv) return fromEnv;
  const cwd = proc()?.cwd?.();
  if (!cwd) return null;
  const dir = path.join(cwd, 'public', 'data', 'bodies');
  return fs.existsSync(dir) ? dir : null;
}

function chunkName(index: number): string {
  return `chunk-${String(index).padStart(2, '0')}.json`;
}

/**
 * Đọc chunk đồng bộ từ đĩa (chỉ có trên Node). Trả undefined khi không đọc được
 * đồng bộ (trình duyệt), để bên gọi biết phải tải bất đồng bộ.
 */
export function tryReadChunkSync(index: number): Chunk | null | undefined {
  if (proc()?.env?.BAND9_SYNC_READ !== '1') return undefined;
  const dir = dataDir();
  const fs = nodeFs();
  const path = nodePath();
  if (!dir || !fs || !path) return undefined;
  try {
    return JSON.parse(fs.readFileSync(path.join(dir, chunkName(index)), 'utf8')) as Chunk;
  } catch {
    return null;
  }
}

function baseUrl(): string {
  if (typeof window !== 'undefined') return '';
  return proc()?.env?.BAND9_INTERNAL_URL ?? 'http://127.0.0.1:3400';
}

/**
 * Tải chunk bất đồng bộ. Node đọc đĩa (không tự gọi HTTP tới chính mình); trình duyệt
 * tải qua HTTP.
 */
export async function fetchChunk(index: number): Promise<Chunk | null> {
  const dir = dataDir();
  const fs = nodeFs();
  const path = nodePath();
  if (dir && fs && path) {
    return JSON.parse(await fs.promises.readFile(path.join(dir, chunkName(index)), 'utf8')) as Chunk;
  }
  const res = await fetch(`${baseUrl()}/data/bodies/${chunkName(index)}`);
  if (!res.ok) throw new Error(`chunk ${chunkName(index)}: HTTP ${res.status}`);
  return (await res.json()) as Chunk;
}
