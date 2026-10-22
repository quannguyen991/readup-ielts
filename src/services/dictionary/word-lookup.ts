import { findDeckWord } from './deck-dictionary';
import { lemmaCandidates } from './lemma-candidates';
import { lookupWord, type WordLookup } from './lookup';
import { offlineGloss } from './offline-glossary';

/**
 * Tra MỘT từ để hiện trong thẻ chạm-vào-từ. Luôn có đường ra, kể cả khi AI sập.
 *
 * Thứ tự (rẻ và chắc trước, mạng sau):
 *   1. bộ từ của app (IPA, từ loại, nghĩa Việt, nghĩa Anh) — có sẵn trong máy;
 *   2. từ điển song ngữ dựng sẵn (nghĩa Việt + từ loại);
 *   3. bộ nhớ localStorage của những lần tra mạng thành công trước;
 *   4. mạng: `/api/dictionary` (dictionaryapi.dev + MyMemory, không cần AI) và
 *      `/api/define` (AI, chỉ thêm nghĩa theo câu — hỏng thì lặng lẽ bỏ qua).
 *
 * Chỉ nhớ kết quả DƯƠNG: nhớ cả lần hỏng là biến một cú trượt mạng thành "không
 * tra được" vĩnh viễn.
 */

export type ResolvedWord = WordLookup & {
  source: 'deck' | 'glossary' | 'cache' | 'network';
  /** Chỉ có nghĩa tiếng Anh, chưa có tiếng Việt — thẻ gắn nhãn "EN". */
  englishOnly: boolean;
};

const CACHE_KEY = 'band9.wordLookup.v1';
const CACHE_MAX = 300;

export type KeyValueStore = { getItem(k: string): string | null; setItem(k: string, v: string): void };

function defaultStore(): KeyValueStore | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

function finish(word: string, w: WordLookup, source: ResolvedWord['source']): ResolvedWord {
  return { ...w, word, source, englishOnly: !w.definitionVi && Boolean(w.definitionGeneral) };
}

/** Bước 1–2: không mạng. Lần đầu có thể chờ một lúc để nạp bộ từ của app. */
export async function lookupOffline(text: string): Promise<ResolvedWord | null> {
  const clean = text.trim();
  if (!clean) return null;

  const deck = await findDeckWord(clean);
  if (deck) {
    return finish(
      clean,
      {
        word: deck.word,
        lemma: deck.word.toLowerCase(),
        phonetic: deck.ipa || null,
        partOfSpeech: deck.pos || null,
        definitionGeneral: deck.definitionEn || null,
        definitionVi: deck.meaningVi || null,
        definitionContext: null,
        examples: deck.example ? [deck.example] : [],
        audioUrl: null,
      },
      'deck',
    );
  }

  if (!clean.includes(' ')) {
    for (const c of lemmaCandidates(clean)) {
      const g = offlineGloss(c);
      if (g) {
        return finish(
          clean,
          {
            word: clean,
            lemma: c,
            phonetic: null,
            partOfSpeech: g.pos || null,
            definitionGeneral: null,
            definitionVi: g.meaningVi,
            definitionContext: null,
            examples: [],
            audioUrl: null,
          },
          'glossary',
        );
      }
    }
  }
  return null;
}

function readCache(store: KeyValueStore | null): Record<string, WordLookup> {
  if (!store) return {};
  try {
    return JSON.parse(store.getItem(CACHE_KEY) ?? '{}') as Record<string, WordLookup>;
  } catch {
    return {};
  }
}

export function cachedLookup(text: string, store: KeyValueStore | null = defaultStore()): ResolvedWord | null {
  const table = readCache(store);
  for (const c of [text.trim().toLowerCase(), ...lemmaCandidates(text)]) {
    const hit = table[c];
    if (hit) return finish(text.trim(), hit, 'cache');
  }
  return null;
}

function writeCache(key: string, value: WordLookup, store: KeyValueStore | null) {
  if (!store) return;
  try {
    const table = readCache(store);
    delete table[key];
    table[key] = value; // khoá mới nhất xếp cuối
    const keys = Object.keys(table);
    for (const k of keys.slice(0, Math.max(0, keys.length - CACHE_MAX))) delete table[k];
    store.setItem(CACHE_KEY, JSON.stringify(table));
  } catch {
    /* đầy bộ nhớ hay chế độ riêng tư: bỏ qua, chỉ mất cache */
  }
}

export async function resolveWord(
  text: string,
  sentence: string,
  deps: { fetchRemote?: (w: string, s: string) => Promise<WordLookup>; store?: KeyValueStore | null } = {},
): Promise<ResolvedWord | null> {
  const clean = text.trim();
  if (!clean) return null;

  const offline = await lookupOffline(clean);
  if (offline) return offline;

  const store = deps.store === undefined ? defaultStore() : deps.store;
  const cached = cachedLookup(clean, store);
  if (cached) return cached;

  try {
    const remote = await (deps.fetchRemote ?? lookupWord)(clean, sentence);
    if (!remote.definitionVi && !remote.definitionGeneral && !remote.definitionContext) return null;
    writeCache(clean.toLowerCase(), remote, store);
    return finish(clean, remote, 'network');
  } catch {
    return null;
  }
}
