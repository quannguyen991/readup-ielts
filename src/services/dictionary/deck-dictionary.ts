import { lemmaCandidates } from './lemma-candidates';

/**
 * Tra ngay trong máy những từ đã có trong các bộ từ của app (50 chủ đề IELTS và
 * từ vựng SAT): có sẵn phiên âm, từ loại, nghĩa Việt, nghĩa Anh và câu ví dụ —
 * không phải chờ mạng. Từ điển trên mạng (dictionaryapi.dev) có lúc không trả lời
 * mười mấy giây, thẻ tra khi đó chỉ quay "Đang tra…".
 *
 * Dữ liệu các bộ nặng (vài MB JSON) KHÔNG nằm trong bundle khởi động: chỉ tải khi
 * có người thật sự tra từ lần đầu, rồi giữ lại cho các lần sau.
 */
export type DeckEntry = { word: string; ipa: string; pos: string; meaningVi: string; definitionEn: string; example: string };

let index: Map<string, DeckEntry> | null = null;
let loading: Promise<Map<string, DeckEntry>> | null = null;

async function build(): Promise<Map<string, DeckEntry>> {
  const [topics, destinations, vfi, vfia, listening, sat] = await Promise.all([
    import('@/data/vocab-topics'),
    import('@/data/destination-vocab'),
    import('@/data/vocab-for-ielts'),
    import('@/data/vocab-for-ielts-advanced'),
    import('@/data/vocab-listening'),
    import('@/data/lessons/vocab-lessons'),
  ]);
  const map = new Map<string, DeckEntry>();
  const add = (w: DeckEntry) => {
    const key = w.word.trim().toLowerCase();
    if (key && !map.has(key)) map.set(key, w);
  };
  for (const t of topics.VOCAB_TOPICS) for (const w of t.words) add(w);
  for (const t of topics.BOOK_VOCAB_DECKS) for (const w of t.words) add(w);
  for (const t of destinations.DESTINATION_DECKS) for (const w of t.words) add(w);
  for (const t of vfi.VFI_DECKS) for (const w of t.words) add(w);
  for (const t of vfia.VFIA_DECKS) for (const w of t.words) add(w);
  for (const t of listening.LISTENING_DECKS) for (const w of t.words) add(w);
  for (const l of sat.SAT_VOCAB_LESSONS) for (const w of l.words) add(w);
  return map;
}

/** Nạp chỉ mục lần đầu; các lần sau trả ngay bản đã dựng. */
export function loadDeckIndex(): Promise<Map<string, DeckEntry>> {
  if (index) return Promise.resolve(index);
  loading ??= build().then(
    (map) => {
      index = map;
      return map;
    },
    (err) => {
      loading = null; // lần sau thử nạp lại
      throw err;
    },
  );
  return loading;
}

/**
 * Mục từ trong các bộ của app, khớp nguyên dạng hoặc dạng gốc ("habitats" → "habitat").
 * Nạp hỏng (mạng chập chờn khi tải đoạn mã) thì coi như không có: rơi xuống tra mạng.
 */
export async function findDeckWord(text: string): Promise<DeckEntry | null> {
  let map: Map<string, DeckEntry>;
  try {
    map = await loadDeckIndex();
  } catch {
    return null;
  }
  const key = text.trim().toLowerCase();
  const exact = map.get(key);
  if (exact || key.includes(' ')) return exact ?? null;
  for (const c of lemmaCandidates(key)) {
    const hit = map.get(c);
    if (hit) return hit;
  }
  return null;
}
