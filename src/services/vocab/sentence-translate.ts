import { pickBestTranslation, type MyMemoryResponse } from '@/services/dictionary/lookup';

/**
 * DỊCH CÂU VÍ DỤ bằng MyMemory (dịch máy, miễn phí, không cần khoá), cùng nguồn với tra từ ở `lookup.ts`.
 *
 * HẠN MỨC: gói miễn phí tính theo IP, khoảng 5.000 ký tự một ngày. Hết hạn mức, MyMemory vẫn trả HTTP 200 với
 * `quotaFinished: true` và chữ cảnh báo trong `responseDetails`, nên phải kiểm hai trường đó trước khi tin
 * `translatedText`. Hết hạn mức thì tạm ngừng gọi một giờ để không hỏi lại vô ích.
 *
 * Bản dịch được nhớ theo câu gốc (bộ nhớ + localStorage), nên một câu chỉ tốn lượt một lần.
 */

const CACHE_KEY = 'readup:ex-vi-v1';
const CACHE_CAP = 1500;
const TIMEOUT_MS = 6000;
const QUOTA_COOLDOWN_MS = 60 * 60 * 1000;

export type ExampleVi = { vi: string } | { error: 'quota' | 'failed' };

type FullResponse = MyMemoryResponse & {
  quotaFinished?: boolean;
  responseDetails?: string;
  responseStatus?: number | string;
};

const mem = new Map<string, string>();
const inflight = new Map<string, Promise<ExampleVi>>();
let loaded = false;
let quotaUntil = 0;

const keyOf = (text: string) => text.trim().replace(/\s+/g, ' ');

function load(): void {
  if (loaded) return;
  loaded = true;
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(CACHE_KEY) : null;
    if (!raw) return;
    for (const [k, v] of Object.entries(JSON.parse(raw) as Record<string, unknown>)) {
      if (typeof v === 'string' && v) mem.set(k, v);
    }
  } catch {
    /* hỏng thì coi như chưa có */
  }
}

function save(): void {
  try {
    let entries = [...mem.entries()];
    if (entries.length > CACHE_CAP) entries = entries.slice(entries.length - CACHE_CAP);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(entries)));
    }
  } catch {
    /* đầy bộ nhớ hoặc chế độ riêng tư */
  }
}

/** Bản dịch đã nhớ, không gọi mạng. */
export function peekExampleVi(text: string): string | undefined {
  load();
  return mem.get(keyOf(text));
}

/**
 * Dịch một câu ví dụ sang tiếng Việt. Câu đã dịch thì trả ngay từ bộ nhớ; câu đang dịch thì dùng chung
 * một lần gọi, không gửi hai lần.
 */
export function translateExample(text: string): Promise<ExampleVi> {
  load();
  const k = keyOf(text);
  const hit = mem.get(k);
  if (hit) return Promise.resolve({ vi: hit });
  if (Date.now() < quotaUntil) return Promise.resolve({ error: 'quota' });
  const running = inflight.get(k);
  if (running) return running;
  const p = fetchVi(k).then((r) => {
    inflight.delete(k);
    if ('vi' in r) {
      mem.set(k, r.vi);
      save();
    } else if (r.error === 'quota') {
      quotaUntil = Date.now() + QUOTA_COOLDOWN_MS;
    }
    return r;
  });
  inflight.set(k, p);
  return p;
}

const ENTITIES: Record<string, string> = { '&#39;': "'", '&quot;': '"', '&amp;': '&', '&lt;': '<', '&gt;': '>' };
const decode = (s: string) => s.replace(/&(#39|quot|amp|lt|gt);/g, (m) => ENTITIES[m] ?? m).trim();

async function fetchVi(text: string): Promise<ExampleVi> {
  if (typeof fetch !== 'function') return { error: 'failed' };
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const res = await Promise.race([
      fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|vi`, {
        signal: ctrl?.signal,
      }),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          ctrl?.abort();
          reject(new Error('timeout'));
        }, TIMEOUT_MS);
      }),
    ]);
    if (!res.ok) return { error: 'failed' };
    const data = (await res.json()) as FullResponse;
    if (data.quotaFinished || /MYMEMORY WARNING|ALL AVAILABLE FREE TRANSLATIONS/i.test(data.responseDetails ?? '')) {
      return { error: 'quota' };
    }
    const vi = pickBestTranslation(text, data);
    return vi ? { vi: decode(vi) } : { error: 'failed' };
  } catch {
    return { error: 'failed' };
  } finally {
    clearTimeout(timer);
  }
}
