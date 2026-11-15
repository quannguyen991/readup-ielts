import { buildDeepIndex, entryFromGloss, entryFromRemote, lookupDeep, nearbyWords, normalizeQuery, type DeepEntry, type DeepIndex, type DeepSuggestion, type RawWord } from './deep-entry';
import { offlineGloss } from './offline-glossary';
import { lemmaCandidates } from './lemma-candidates';

/**
 * Nạp dữ liệu cho Từ điển chuyên sâu. Chỉ mục dựng từ chính các bộ từ của app
 * (cùng nguồn với `deck-dictionary.ts`) nhưng giữ NGUYÊN dòng — để còn đồng/trái nghĩa,
 * cụm từ kết hợp, CEFR. Dữ liệu nặng nên chỉ `import()` khi có người mở trang tra từ.
 */

let index: DeepIndex | null = null;
let loading: Promise<DeepIndex> | null = null;

type Deck = { words: RawWord[] };

async function build(): Promise<DeepIndex> {
  const [topics, destinations, vfi, vfia, listening, sat, oxford] = await Promise.all([
    import('@/data/vocab-topics'),
    import('@/data/destination-vocab'),
    import('@/data/vocab-for-ielts'),
    import('@/data/vocab-for-ielts-advanced'),
    import('@/data/vocab-listening'),
    import('@/data/lessons/vocab-lessons'),
    import('@/data/oxford'),
  ]);
  const all: RawWord[] = [];
  const take = (decks: readonly unknown[]) => {
    for (const d of decks as Deck[]) for (const w of d.words) all.push({ ...w, src: 'deck' });
  };
  // Thứ tự = độ ưu tiên: bộ chủ đề IELTS (có CEFR, đồng/trái nghĩa) đứng đầu.
  take(topics.VOCAB_TOPICS);
  take(topics.BOOK_VOCAB_DECKS);
  take(destinations.DESTINATION_DECKS);
  take(vfi.VFI_DECKS);
  take(vfia.VFIA_DECKS);
  take(listening.LISTENING_DECKS);
  take(sat.SAT_VOCAB_LESSONS);
  for (const o of [...oxford.OXFORD_3000, ...oxford.OXFORD_ADVANCED, ...oxford.OXFORD_EXTRA]) {
    all.push({ word: o.word, pos: o.pos, meaningVi: o.meaningVi, example: o.example, cefr: o.level, src: 'oxford' });
  }
  return buildDeepIndex(all);
}

export function loadDeepIndex(): Promise<DeepIndex> {
  if (index) return Promise.resolve(index);
  loading ??= build().then(
    (i) => {
      index = i;
      return i;
    },
    (err) => {
      loading = null;
      throw err;
    },
  );
  return loading;
}

export function deepIndexIfReady(): DeepIndex | null {
  return index;
}

export type DeepResult =
  | { status: 'found'; entry: DeepEntry }
  | { status: 'notfound'; query: string; suggestions: DeepSuggestion[] }
  | { status: 'error'; query: string; suggestions: DeepSuggestion[] };

type RemotePayload = {
  phonetic?: string | null;
  partOfSpeech?: string | null;
  definitionGeneral?: string | null;
  definitionVi?: string | null;
  examples?: string[] | null;
  error?: string;
};

const remoteCache = new Map<string, DeepEntry>();

/** Hỏi route `/api/dictionary` của app (dictionaryapi.dev + MyMemory). */
async function fetchRemote(word: string): Promise<RemotePayload | null> {
  const res = await fetch('/api/dictionary', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ word }),
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`dictionary ${res.status}`);
  const data = (await res.json()) as RemotePayload;
  return data.error ? null : data;
}

/**
 * Tra một từ: kho cục bộ trước (tức thì), rồi mạng. Mạng hỏng/không có thì lùi về
 * từ điển song ngữ dựng sẵn; hết đường thì báo rõ "không tìm thấy" hoặc "lỗi mạng"
 * kèm gợi ý từ gần giống.
 */
export async function resolveDeep(input: string): Promise<DeepResult> {
  const q = normalizeQuery(input);
  let idx: DeepIndex | null = null;
  try {
    idx = await loadDeepIndex();
  } catch {
    idx = null;
  }
  if (idx) {
    const local = lookupDeep(idx, q);
    if (local) return { status: 'found', entry: local };
  }
  const suggestions = idx ? nearbyWords(idx, q) : [];
  if (!q) return { status: 'notfound', query: input, suggestions };

  const cached = remoteCache.get(q);
  if (cached) return { status: 'found', entry: cached };

  let failed = false;
  try {
    const r = await fetchRemote(q);
    const isPhrase = q.includes(' ');
    // Từ đơn không có định nghĩa tiếng Anh thì coi là không phải từ thật (MyMemory dịch được cả chuỗi vô nghĩa).
    if (r && (r.definitionGeneral || (isPhrase && r.definitionVi))) {
      const entry = entryFromRemote(idx, q, r);
      remoteCache.set(q, entry);
      return { status: 'found', entry };
    }
  } catch {
    failed = true;
  }

  if (!q.includes(' ')) {
    for (const c of lemmaCandidates(q)) {
      const g = offlineGloss(c);
      if (g) return { status: 'found', entry: entryFromGloss(idx, c, g) };
    }
  }
  return failed ? { status: 'error', query: q, suggestions } : { status: 'notfound', query: q, suggestions };
}

/* ------------------------------------------------------- dịch câu ví dụ */

const EX_KEY = 'band9.deepExampleVi.v1';
const EX_MAX = 300;
const exMemory = new Map<string, string>();

function store(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

function readExStore(): Record<string, string> {
  try {
    return JSON.parse(store()?.getItem(EX_KEY) ?? '{}') as Record<string, string>;
  } catch {
    return {};
  }
}

/** Bản dịch Việt của một câu ví dụ (dịch máy qua `/api/dictionary`, nhớ lại trong máy). null = chưa dịch được. */
export async function translateExample(sentence: string): Promise<string | null> {
  const key = sentence.trim();
  if (!key) return null;
  const mem = exMemory.get(key);
  if (mem) return mem;
  const saved = readExStore()[key];
  if (saved) {
    exMemory.set(key, saved);
    return saved;
  }
  try {
    const res = await fetch('/api/dictionary', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ word: key }),
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { definitionVi?: string | null };
    const vi = data.definitionVi?.trim();
    if (!vi) return null;
    exMemory.set(key, vi);
    try {
      const table = readExStore();
      table[key] = vi;
      const keys = Object.keys(table);
      for (const k of keys.slice(0, Math.max(0, keys.length - EX_MAX))) delete table[k];
      store()?.setItem(EX_KEY, JSON.stringify(table));
    } catch {
      /* đầy bộ nhớ: bỏ qua */
    }
    return vi;
  } catch {
    return null;
  }
}
