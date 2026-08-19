import { pickBestTranslation, type MyMemoryResponse } from '@/services/dictionary/lookup';

/**
 * POST /api/dictionary  { word }
 *
 * Gọi hộ hai từ điển miễn phí rồi gộp kết quả. KHÔNG cần API key — đây là tầng
 * nghĩa nền, luôn có; `/api/define` (Claude) chỉ thêm nghĩa theo ngữ cảnh câu.
 *
 * Vì sao phải vòng qua server thay vì gọi thẳng từ trình duyệt: dictionaryapi.dev
 * nằm sau Cloudflare và đã bị chặn thật khi gọi từ client (fetch ném luôn
 * "Failed to fetch" dù response header vẫn ghi Access-Control-Allow-Origin: *),
 * làm thẻ tra từ mất sạch phiên âm, từ loại và nghĩa tiếng Anh. Gọi từ server
 * thì không đụng CORS lẫn bộ lọc trình duyệt.
 */

type DictionaryApiEntry = {
  phonetic?: string;
  phonetics?: Array<{ text?: string; audio?: string }>;
  meanings?: Array<{
    partOfSpeech?: string;
    definitions?: Array<{ definition?: string; example?: string }>;
  }>;
};

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as { word?: string; lemma?: string };
    const word = body.word?.trim();
    const lemma = body.lemma?.trim() || word;

    if (!word) {
      return Response.json({ error: 'Thiếu từ cần tra.' }, { status: 400 });
    }

    // Cụm nhiều từ thì từ điển đơn từ không có mục nào, chỉ dịch thôi.
    const isPhrase = word.includes(' ');

    const [english, vietnamese] = await Promise.all([
      isPhrase ? Promise.resolve({}) : fetchEnglish(lemma ?? word),
      fetchVietnamese(word),
    ]);

    return Response.json({ ...english, definitionVi: vietnamese });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi không xác định';
    return Response.json({ error: message }, { status: 500 });
  }
}

async function fetchEnglish(word: string): Promise<Record<string, unknown>> {
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
    );
    if (!res.ok) return {};

    const data = (await res.json()) as DictionaryApiEntry[];
    const entry = data[0];
    if (!entry) return {};

    const meaning = entry.meanings?.[0];

    return {
      phonetic: entry.phonetic ?? entry.phonetics?.find((p) => p.text)?.text ?? null,
      partOfSpeech: meaning?.partOfSpeech ?? null,
      definitionGeneral: meaning?.definitions?.[0]?.definition ?? null,
      examples: (entry.meanings ?? [])
        .flatMap((m) => m.definitions ?? [])
        .map((d) => d.example)
        .filter((e): e is string => Boolean(e))
        .slice(0, 2),
      audioUrl: entry.phonetics?.find((p) => p.audio)?.audio ?? null,
    };
  } catch {
    return {};
  }
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
