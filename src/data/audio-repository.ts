import { AUDIO_CHUNKS } from './seed/audio-library/transcripts/registry';

/**
 * Đọc lời đọc của một bài nghe theo yêu cầu.
 *
 * Cùng cách làm với `article-repository.ts`, và vì cùng một lý do: `require()`
 * trong Metro là ĐỒNG BỘ — nó hoãn phần parse JSON tới lần gọi đầu chứ không
 * trả Promise. Nên hàm này đồng bộ được và màn luyện không cần trạng thái
 * loading cho phần lời.
 *
 * Chia chunk là bắt buộc chứ không phải tối ưu sớm: toàn văn của cả thư viện
 * lên tới hàng trăm nghìn từ, nhét chung vào một tệp thì mở app lần đầu phải
 * parse hết, kể cả khi người học chỉ định nghe một bài.
 */
export type AudioGlossaryEntry = { term: string; definition: string };

export type AudioTranscript = {
  paragraphs: string[];
  glossary: AudioGlossaryEntry[];
};

const loaded = new Map<number, Record<string, AudioTranscript> | null>();

export function audioChunkOf(chunkIndex: number | null): Record<string, AudioTranscript> | null {
  if (chunkIndex === null) return null;
  if (loaded.has(chunkIndex)) return loaded.get(chunkIndex) ?? null;

  const loader = AUDIO_CHUNKS[chunkIndex];
  let value: Record<string, AudioTranscript> | null = null;

  if (loader) {
    try {
      value = loader() as Record<string, AudioTranscript>;
    } catch {
      // Chunk thiếu hoặc hỏng: không làm sập app, màn luyện sẽ báo không đọc được.
      value = null;
    }
  }

  loaded.set(chunkIndex, value);
  return value;
}

export function pickTranscript(
  chunk: Record<string, AudioTranscript> | null,
  id: string,
): AudioTranscript | null {
  if (!chunk || typeof chunk !== 'object') return null;
  const t = chunk[id];
  if (!t || !Array.isArray(t.paragraphs) || t.paragraphs.length === 0) return null;
  return { paragraphs: t.paragraphs, glossary: Array.isArray(t.glossary) ? t.glossary : [] };
}

export function getAudioTranscript(meta: { id: string; chunk: number }): AudioTranscript | null {
  return pickTranscript(audioChunkOf(meta.chunk), meta.id);
}

/**
 * Tách lời đọc thành CÂU, kèm mốc thời gian ƯỚC LƯỢNG.
 *
 * VOA công bố toàn văn nhưng KHÔNG công bố mốc thời gian từng câu. Ước lượng
 * bằng cách chia đều theo số từ: câu thứ i bắt đầu ở (số từ đứng trước i / tổng
 * số từ) × thời lượng.
 *
 * Ước lượng này chỉ dùng để BẤM VÀO DẪN CHỨNG RỒI TUA TỚI GẦN ĐÚNG CHỖ. Nó
 * không đủ chính xác cho bài chép chính tả từng câu — lệch vài giây thì người
 * học nghe phải nửa câu trước, và sẽ tưởng app hỏng chứ không nghĩ là mốc lệch.
 * Vì thế thư viện âm thanh chỉ mở phần NGHE HIỂU; phần chép chính tả vẫn nằm ở
 * thư viện video, nơi phụ đề có mốc thật.
 *
 * Giả định của phép chia: tốc độ đọc đều. Đúng một cách bất thường với VOA
 * Learning English vì họ đọc chậm và đều theo chủ ý sư phạm; đừng đem cách này
 * áp cho podcast nói tự nhiên.
 */
export function estimateSentences(
  paragraphs: string[],
  durationSeconds: number,
): { start: number; end: number; text: string; paragraph: number }[] {
  const cau: { text: string; paragraph: number; words: number }[] = [];

  paragraphs.forEach((doan, i) => {
    for (const raw of doan.split(/(?<=[.!?])\s+/)) {
      const text = raw.trim();
      if (!text) continue;
      cau.push({ text, paragraph: i, words: text.split(/\s+/).length });
    }
  });

  const tong = cau.reduce((s, c) => s + c.words, 0);
  if (tong === 0) return [];

  const thoiLuong = durationSeconds > 0 ? durationSeconds : 0;
  let daQua = 0;

  return cau.map((c) => {
    const start = (daQua / tong) * thoiLuong;
    daQua += c.words;
    return { start, end: (daQua / tong) * thoiLuong, text: c.text, paragraph: c.paragraph };
  });
}
