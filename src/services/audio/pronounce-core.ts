/**
 * Lõi tra bản ghi âm người thật cho một từ tiếng Anh — thuần logic, không đụng
 * React Native, để chạy được trong test. Phần phát âm thanh nằm ở `pronounce.ts`.
 *
 * Nguồn: api.dictionaryapi.dev trả `phonetics[].audio` là mp3 do người đọc
 * (đuôi `-us.mp3`, `-uk.mp3`). Kết quả được nhớ trong bộ nhớ + localStorage,
 * kể cả kết quả "không có" (để khỏi hỏi lại); lỗi mạng/quá giờ thì KHÔNG nhớ
 * vì chỉ là tạm thời.
 */

export type Accent = 'us' | 'uk';

export const DICT_API = 'https://api.dictionaryapi.dev/api/v2/entries/en/';
export const LOOKUP_TIMEOUT_MS = 1500;
export const DOWN_COOLDOWN_MS = 5 * 60 * 1000;
const CACHE_KEY = 'readup:pron-v1';
const CACHE_CAP = 1500;

/** Chỉ từ đơn mới tra từ điển; cụm từ / câu đi thẳng giọng máy. */
export function isSingleWord(text: string): boolean {
  return /^[A-Za-z][A-Za-z'’-]*$/.test(text.trim());
}

export function normalizeWord(text: string): string {
  return text.trim().toLowerCase().replace(/’/g, "'");
}

function fixUrl(u: string): string {
  const s = u.trim();
  if (s.startsWith('//')) return `https:${s}`;
  return s.replace(/^http:\/\//, 'https://');
}

/** Mọi đường dẫn mp3 không rỗng trong phản hồi của API, theo thứ tự xuất hiện, không trùng. */
export function audioUrlsOf(json: unknown): string[] {
  const out: string[] = [];
  if (!Array.isArray(json)) return out;
  for (const entry of json) {
    const ph = (entry as { phonetics?: unknown })?.phonetics;
    if (!Array.isArray(ph)) continue;
    for (const p of ph) {
      const a = (p as { audio?: unknown })?.audio;
      if (typeof a === 'string' && a.trim()) {
        const u = fixUrl(a);
        if (!out.includes(u)) out.push(u);
      }
    }
  }
  return out;
}

/** Chọn bản đúng giọng: ưu tiên `-us`/`-uk` theo yêu cầu, rồi giọng Anh kia, rồi bất kỳ. */
export function pickAudioUrl(urls: readonly string[], accent: Accent): string | null {
  const has = (suffix: string) => urls.find((u) => u.toLowerCase().includes(`-${suffix}.mp3`));
  const other: Accent = accent === 'us' ? 'uk' : 'us';
  return has(accent) ?? has(other) ?? urls[0] ?? null;
}

type KV = { getItem(k: string): string | null; setItem(k: string, v: string): void };

function defaultKV(): KV | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

export type FetchLike = (
  url: string,
  init?: { signal?: AbortSignal },
) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

export type Lookup = {
  /** Danh sách mp3 đã biết cho từ (mảng rỗng = đã hỏi, không có). null = lỗi tạm, chưa biết. */
  urls(word: string): Promise<string[] | null>;
  /** Đọc bộ nhớ, không gọi mạng. undefined = chưa biết. */
  peek(word: string): string[] | undefined;
};

export function createLookup(
  deps: { fetch?: FetchLike; kv?: KV | null; timeoutMs?: number; cooldownMs?: number; now?: () => number } = {},
): Lookup {
  const mem = new Map<string, string[]>();
  const inflight = new Map<string, Promise<string[] | null>>();
  const kv = deps.kv === undefined ? defaultKV() : deps.kv;
  const timeoutMs = deps.timeoutMs ?? LOOKUP_TIMEOUT_MS;
  let loaded = false;
  const now = deps.now ?? Date.now;
  const cooldownMs = deps.cooldownMs ?? DOWN_COOLDOWN_MS;
  /** Từ điển vừa lỗi/quá giờ: tạm không hỏi nữa để từ nào cũng không phải chờ thêm 1,5 giây. */
  let downUntil = 0;

  const load = () => {
    if (loaded) return;
    loaded = true;
    try {
      const raw = kv?.getItem(CACHE_KEY);
      if (!raw) return;
      const o = JSON.parse(raw) as Record<string, unknown>;
      for (const [k, v] of Object.entries(o)) {
        if (Array.isArray(v) && v.every((x) => typeof x === 'string')) mem.set(k, v as string[]);
      }
    } catch {
      /* hỏng thì coi như chưa có */
    }
  };
  const save = () => {
    try {
      let entries = [...mem.entries()];
      if (entries.length > CACHE_CAP) entries = entries.slice(entries.length - CACHE_CAP);
      kv?.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(entries)));
    } catch {
      /* đầy bộ nhớ / chế độ riêng tư */
    }
  };

  const doFetch = async (key: string): Promise<string[] | null> => {
    const f = deps.fetch ?? (typeof fetch === 'function' ? (fetch as unknown as FetchLike) : null);
    if (!f) return null;
    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const res = await Promise.race([
        f(DICT_API + encodeURIComponent(key), { signal: ctrl?.signal }),
        new Promise<never>((_, rej) => {
          timer = setTimeout(() => {
            ctrl?.abort();
            rej(new Error('timeout'));
          }, timeoutMs);
        }),
      ]);
      if (res.status === 404) return []; // từ không có trong từ điển: nhớ là "không có"
      if (!res.ok) return null;
      return audioUrlsOf(await res.json());
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  };

  return {
    peek(word) {
      load();
      return mem.get(normalizeWord(word));
    },
    urls(word) {
      load();
      const key = normalizeWord(word);
      const hit = mem.get(key);
      if (hit) return Promise.resolve(hit);
      const running = inflight.get(key);
      if (running) return running;
      if (now() < downUntil) return Promise.resolve(null);
      const p = doFetch(key).then((r) => {
        inflight.delete(key);
        if (!r) downUntil = now() + cooldownMs;
        if (r) {
          mem.set(key, r);
          save();
        }
        return r;
      });
      inflight.set(key, p);
      return p;
    },
  };
}

const GSTATIC = 'https://ssl.gstatic.com/dictionary/static/sounds/20200429/';

/** Bản ghi âm của từ điển Google theo tên tệp cố định (cùng nguồn với nhiều mp3 của dictionaryapi). Từ không có thì 404. */
export function guessAudioUrls(word: string, accent: Accent): string[] {
  const w = normalizeWord(word);
  if (!/^[a-z]+$/.test(w)) return [];
  const order: Accent[] = accent === 'us' ? ['us', 'uk'] : ['uk', 'us'];
  return order.map((a) => `${GSTATIC}${w}--_${a === 'us' ? 'us' : 'gb'}_1.mp3`);
}

export type Plan = { kind: 'audio'; url: string; alts: string[] } | { kind: 'tts' };

/**
 * Quyết định phát gì: bản ghi âm người thật nếu có (dictionaryapi trước, rồi tên tệp
 * đoán sẵn; người phát thử lần lượt, hỏng thì sang cái sau), không thì giọng máy
 * (cụm từ, không có bản).
 */
export async function planPlayback(text: string, accent: Accent, lookup: Lookup): Promise<Plan> {
  if (!isSingleWord(text)) return { kind: 'tts' };
  const urls = await lookup.urls(text);
  const first = urls ? pickAudioUrl(urls, accent) : null;
  const cands = [...(first ? [first] : []), ...guessAudioUrls(text, accent)];
  return cands.length ? { kind: 'audio', url: cands[0]!, alts: cands.slice(1) } : { kind: 'tts' };
}

/* ------------------------------------------------------------------ *
 * KHO CLIP GIỌNG GEMINI (một giọng cho cả app: Aoede)
 *
 * Mỗi bộ clip là một thư mục tĩnh có `index.json` ánh xạ NGUYÊN VĂN chuỗi
 * (từ / cụm từ / câu) → tên tệp mp3 cùng thư mục. Tải index MỘT lần (lười),
 * tra không phân biệt hoa thường. Thư mục / index chưa có thì bỏ qua, im lặng —
 * app lùi về bản ghi âm người thật rồi giọng máy như cũ.
 * ------------------------------------------------------------------ */

export type ClipVoice = 'kore' | 'fenrir' | 'aoede' | 'alice';
/** Một giọng cho mọi người: Aoede, không đổi theo giới. */
export function clipVoiceFor(_gender: 'f' | 'm'): ClipVoice {
  return 'aoede';
}

/** Chuẩn hoá khoá tra clip: bỏ khoảng trắng thừa, thường hoá, dấu nháy cong → thẳng. */
export function clipKey(text: string): string {
  return text.trim().replace(/\s+/g, ' ').replace(/[’‘]/g, "'").toLowerCase();
}

export type ClipFetch = (url: string, init?: { signal?: AbortSignal }) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

export type ClipLibrary = {
  /** URL clip của `text` ở giọng `voice` trong các bộ đã đăng ký (theo thứ tự), hoặc null. */
  find(voice: ClipVoice, text: string): Promise<string | null>;
  /** Tra bộ nhớ, không gọi mạng. undefined = chưa nạp index. */
  peek(voice: ClipVoice, text: string): string | null | undefined;
  /** Nạp sẵn index của một giọng (gọi sớm cho đỡ trễ lần phát đầu). */
  warm(voice: ClipVoice): Promise<void>;
};

/** `sets`: thư mục gốc theo thứ tự ưu tiên, ví dụ `/audio/words/{voice}/` rồi `/audio/lines/{voice}/`. */
export function createClipLibrary(
  deps: { sets: readonly string[]; fetch?: ClipFetch; retryMs?: number; timeoutMs?: number; now?: () => number },
): ClipLibrary {
  const retryMs = deps.retryMs ?? 60_000;
  const now = deps.now ?? Date.now;
  type Idx = { map: Map<string, string> | null; retryAt: number; p?: Promise<void> };
  const idx = new Map<string, Idx>();
  const dirOf = (tpl: string, voice: ClipVoice) => tpl.replace('{voice}', voice).replace(/\/?$/, '/');

  const load = (tpl: string, voice: ClipVoice): Promise<void> => {
    const key = `${tpl}|${voice}`;
    let e = idx.get(key);
    if (!e) {
      e = { map: null, retryAt: 0 };
      idx.set(key, e);
    }
    const entry = e;
    if (entry.map) return Promise.resolve();
    if (entry.p) return entry.p;
    if (now() < entry.retryAt) return Promise.resolve();
    const f = deps.fetch ?? (typeof fetch === 'function' ? (fetch as unknown as ClipFetch) : null);
    if (!f) return Promise.resolve();
    entry.p = (async () => {
      const controller = new AbortController();
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        const json = await Promise.race([
          (async () => {
            const res = await f(`${dirOf(tpl, voice)}index.json`, { signal: controller.signal });
            return res.ok ? await res.json() : null;
          })(),
          new Promise<never>((_, reject) => {
            timer = setTimeout(() => {
              controller.abort();
              reject(new Error('clip index timeout'));
            }, deps.timeoutMs ?? 1500);
          }),
        ]);
        if (json === null) {
          // 404: chưa có thư mục — thử lại sau, không chặn phát.
          entry.retryAt = now() + retryMs;
          return;
        }
        const map = new Map<string, string>();
        if (json && typeof json === 'object' && !Array.isArray(json)) {
          for (const [k, v] of Object.entries(json as Record<string, unknown>)) {
            if (typeof v === 'string' && v) map.set(clipKey(k), v);
          }
        }
        entry.map = map;
      } catch {
        entry.retryAt = now() + retryMs;
      } finally {
        clearTimeout(timer);
        entry.p = undefined;
      }
    })();
    return entry.p;
  };

  const lookup = (tpl: string, voice: ClipVoice, text: string): string | null => {
    const file = idx.get(`${tpl}|${voice}`)?.map?.get(clipKey(text));
    return file ? `${dirOf(tpl, voice)}${file}` : null;
  };

  return {
    async find(voice, text) {
      for (const s of deps.sets) {
        // Do not delay a known word clip behind an unrelated sentence index.
        await load(s, voice);
        const u = lookup(s, voice, text);
        if (u) return u;
      }
      return null;
    },
    peek(voice, text) {
      let loadedAll = true;
      for (const s of deps.sets) {
        const e = idx.get(`${s}|${voice}`);
        if (!e?.map) {
          loadedAll = loadedAll && !!e && now() < e.retryAt;
          continue;
        }
        const u = lookup(s, voice, text);
        if (u) return u;
      }
      return loadedAll ? null : undefined;
    },
    warm: (voice) => Promise.all(deps.sets.map((s) => load(s, voice))).then(() => undefined),
  };
}
