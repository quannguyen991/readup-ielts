import { useQuery } from '@tanstack/react-query';

/**
 * Tra từ khi chạm vào từ trong bài đọc.
 *
 * - Nghĩa tiếng Anh + IPA + ví dụ: dictionaryapi.dev (miễn phí, không cần key)
 * - Nghĩa tiếng Việt: MyMemory (miễn phí, không cần key)
 * - Nghĩa theo đúng ngữ cảnh câu: cần Claude — sẽ dùng khi có ANTHROPIC_API_KEY,
 *   trước đó hiển thị nghĩa tổng quát và đánh dấu rõ.
 */

export type WordLookup = {
  word: string;
  lemma: string;
  phonetic: string | null;
  partOfSpeech: string | null;
  definitionGeneral: string | null;
  definitionVi: string | null;
  definitionContext: string | null;
  examples: string[];
  audioUrl: string | null;
};

type DictionaryApiEntry = {
  word?: string;
  phonetic?: string;
  phonetics?: Array<{ text?: string; audio?: string }>;
  meanings?: Array<{
    partOfSpeech?: string;
    definitions?: Array<{ definition?: string; example?: string }>;
  }>;
};

/** Rút gọn về dạng gốc đơn giản — đủ dùng để gom từ trong sổ từ. */
export function lemmatize(word: string): string {
  const w = word.toLowerCase().replace(/[^a-z'-]/g, '');
  if (w.length <= 3) return w;

  if (w.endsWith('ies') && w.length > 4) return `${w.slice(0, -3)}y`;
  if (w.endsWith('ing') && w.length > 5) return normalizeStem(w.slice(0, -3));
  if (w.endsWith('ed') && w.length > 4) return normalizeStem(w.slice(0, -2));
  if (w.endsWith('es') && w.length > 4) return w.slice(0, -2);
  if (w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);

  return w;
}

function normalizeStem(stem: string): string {
  // "running" → "runn" → "run"; "moved" → "mov" → "move"
  if (/([bdfglmnprt])\1$/.test(stem)) return stem.slice(0, -1);
  if (/[^aeiou][aeiou][^aeiouwxy]$/.test(stem)) return `${stem}e`;
  return stem;
}

async function fetchEnglish(word: string): Promise<Partial<WordLookup>> {
  const res = await fetch(
    `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
  );
  if (!res.ok) return {};

  const data = (await res.json()) as DictionaryApiEntry[];
  const entry = data[0];
  if (!entry) return {};

  const meaning = entry.meanings?.[0];
  const definition = meaning?.definitions?.[0];
  const audio = entry.phonetics?.find((p) => p.audio)?.audio ?? null;

  const examples = (entry.meanings ?? [])
    .flatMap((m) => m.definitions ?? [])
    .map((d) => d.example)
    .filter((e): e is string => Boolean(e))
    .slice(0, 2);

  return {
    phonetic: entry.phonetic ?? entry.phonetics?.find((p) => p.text)?.text ?? null,
    partOfSpeech: meaning?.partOfSpeech ?? null,
    definitionGeneral: definition?.definition ?? null,
    examples,
    audioUrl: audio,
  };
}

async function fetchVietnamese(text: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|vi`,
    );
    if (!res.ok) return null;

    const data = (await res.json()) as { responseData?: { translatedText?: string } };
    const translated = data.responseData?.translatedText?.trim();
    if (!translated || translated.toLowerCase() === text.toLowerCase()) return null;
    return translated;
  } catch {
    return null;
  }
}

/** Nghĩa theo đúng ngữ cảnh câu — cần Claude, chạy qua API route. */
async function fetchContextual(
  word: string,
  sentence: string,
): Promise<{ definitionContext: string | null; definitionVi: string | null } | null> {
  try {
    const res = await fetch('/api/define', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ word, sentence }),
    });
    if (!res.ok) return null;

    return (await res.json()) as { definitionContext: string | null; definitionVi: string | null };
  } catch {
    return null;
  }
}

export async function lookupWord(word: string, sentence: string): Promise<WordLookup> {
  const clean = word.replace(/[^A-Za-z'-]/g, '');
  const lemma = lemmatize(clean);
  const isPhrase = clean !== word.trim() ? false : word.trim().includes(' ');

  const [english, vietnamese, contextual] = await Promise.all([
    isPhrase
      ? Promise.resolve({} as Partial<WordLookup>)
      : fetchEnglish(lemma).catch(() => ({}) as Partial<WordLookup>),
    fetchVietnamese(word),
    fetchContextual(word, sentence),
  ]);

  return {
    word,
    lemma: isPhrase ? word.toLowerCase() : lemma,
    phonetic: english.phonetic ?? null,
    partOfSpeech: english.partOfSpeech ?? null,
    definitionGeneral: english.definitionGeneral ?? null,
    definitionVi: contextual?.definitionVi ?? vietnamese,
    definitionContext: contextual?.definitionContext ?? null,
    examples: english.examples ?? [],
    audioUrl: english.audioUrl ?? null,
  };
}

export function useWordLookup(word: string | null, sentence: string) {
  return useQuery<WordLookup>({
    queryKey: ['word', word, sentence.slice(0, 60)],
    enabled: Boolean(word),
    staleTime: 24 * 60 * 60 * 1000,
    retry: 1,
    queryFn: () => lookupWord(word as string, sentence),
  });
}
