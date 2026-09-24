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
  const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`, {
    signal: AbortSignal.timeout(5000),
  });
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

export type MyMemoryResponse = {
  responseData?: { translatedText?: string };
  matches?: Array<{ translation?: string; match?: number; 'created-by'?: string }>;
};

/** Nguồn dịch MÁY của MyMemory. Phần còn lại là kho do người dùng đóng góp. */
const MACHINE_SOURCES = /matecat|^mt!?$/i;

/**
 * Chọn bản dịch dùng được từ phản hồi MyMemory.
 *
 * Không lấy thẳng `responseData.translatedText`: trường đó là bản có điểm khớp
 * cao nhất bất kể nguồn, mà kho cộng đồng có cả rác. Tra "coral" trên bản public
 * đã ra "tóc ngôcolor" đúng theo đường đó, trong khi bản dịch máy ngay dưới ghi
 * đúng "san hô". Nên ưu tiên nguồn máy, hết mới quay về trường chính.
 */
export function pickBestTranslation(source: string, data: MyMemoryResponse): string | null {
  const machine = (data.matches ?? [])
    .filter((m) => MACHINE_SOURCES.test(m['created-by'] ?? ''))
    .filter((m) => Boolean(m.translation?.trim()))
    .sort((a, b) => (b.match ?? 0) - (a.match ?? 0))[0];

  const candidate = machine?.translation ?? data.responseData?.translatedText;
  const translated = candidate?.trim();

  if (!translated) return null;
  // Trả về đúng chữ tiếng Anh ban đầu nghĩa là không dịch được.
  if (translated.toLowerCase() === source.trim().toLowerCase()) return null;

  return translated;
}

async function fetchVietnamese(text: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|vi`,
    );
    if (!res.ok) return null;

    return pickBestTranslation(text, (await res.json()) as MyMemoryResponse);
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

/**
 * Tầng nghĩa nền: ưu tiên route `/api/dictionary` của chính app.
 *
 * Gọi thẳng từ trình duyệt thì dictionaryapi.dev bị Cloudflare chặn (fetch ném
 * "Failed to fetch"), mất sạch phiên âm và nghĩa tiếng Anh. Nhưng trên iOS và
 * Android không có route nào để gọi, nên hỏng thì quay về gọi trực tiếp.
 */
async function fetchBase(
  word: string,
  lemma: string,
  isPhrase: boolean,
): Promise<Partial<WordLookup>> {
  try {
    const res = await fetch('/api/dictionary', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ word, lemma }),
      // Route tự cắt mỗi dịch vụ ở 4 giây; quá 9 giây là route có chuyện — rơi xuống đường gọi thẳng.
      signal: AbortSignal.timeout(9000),
    });

    if (res.ok) {
      const data = (await res.json()) as Partial<WordLookup> & { error?: string };
      if (!data.error) return data;
    }
  } catch {
    // Rơi xuống đường gọi trực tiếp bên dưới.
  }

  const [english, vietnamese] = await Promise.all([
    isPhrase
      ? Promise.resolve({} as Partial<WordLookup>)
      : fetchEnglish(lemma).catch(() => ({}) as Partial<WordLookup>),
    fetchVietnamese(word),
  ]);

  return { ...english, definitionVi: vietnamese };
}

export async function lookupWord(word: string, sentence: string): Promise<WordLookup> {
  const clean = word.replace(/[^A-Za-z'-]/g, '');
  const lemma = lemmatize(clean);
  // Bôi đen thường ra cả cụm, nên phải nhận đúng cụm: tra "coral reef system"
  // trong từ điển đơn từ thì không có mục nào, chỉ dịch mới ra nghĩa.
  const isPhrase = word.trim().includes(' ');

  const [base, contextual] = await Promise.all([
    fetchBase(word, lemma, isPhrase),
    fetchContextual(word, sentence),
  ]);

  return {
    word,
    lemma: isPhrase ? word.toLowerCase() : lemma,
    phonetic: base.phonetic ?? null,
    partOfSpeech: base.partOfSpeech ?? null,
    definitionGeneral: base.definitionGeneral ?? null,
    definitionVi: contextual?.definitionVi ?? base.definitionVi ?? null,
    definitionContext: contextual?.definitionContext ?? null,
    examples: base.examples ?? [],
    audioUrl: base.audioUrl ?? null,
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
