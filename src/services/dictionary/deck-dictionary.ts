import { SAT_VOCAB_LESSONS } from '@/data/lessons/vocab-lessons';
import { VFI_DECKS } from '@/data/vocab-for-ielts';
import { VFIA_DECKS } from '@/data/vocab-for-ielts-advanced';
import { LISTENING_DECKS } from '@/data/vocab-listening';
import { VOCAB_TOPICS } from '@/data/vocab-topics';
import { DESTINATION_DECKS } from '@/data/destination-vocab';
import { lemmaCandidates } from './lemma-candidates';

/**
 * Tra ngay trong máy những từ đã có trong các bộ từ của app (50 chủ đề IELTS và
 * từ vựng SAT): có sẵn phiên âm, từ loại, nghĩa Việt, nghĩa Anh và câu ví dụ —
 * không phải chờ mạng. Từ điển trên mạng (dictionaryapi.dev) có lúc không trả lời
 * mười mấy giây, thẻ tra khi đó chỉ quay "Đang tra…".
 */
export type DeckEntry = { word: string; ipa: string; pos: string; meaningVi: string; definitionEn: string; example: string };

let index: Map<string, DeckEntry> | null = null;

function build(): Map<string, DeckEntry> {
  const map = new Map<string, DeckEntry>();
  const add = (w: DeckEntry) => {
    const key = w.word.trim().toLowerCase();
    if (key && !map.has(key)) map.set(key, w);
  };
  for (const t of VOCAB_TOPICS) for (const w of t.words) add(w);
  for (const t of DESTINATION_DECKS) for (const w of t.words) add(w);
  for (const t of VFI_DECKS) for (const w of t.words) add(w);
  for (const t of VFIA_DECKS) for (const w of t.words) add(w);
  for (const t of LISTENING_DECKS) for (const w of t.words) add(w);
  for (const l of SAT_VOCAB_LESSONS) for (const w of l.words) add(w);
  return map;
}

/** Mục từ trong các bộ của app, khớp nguyên dạng hoặc dạng gốc ("habitats" → "habitat"). */
export function findDeckWord(text: string): DeckEntry | null {
  index ??= build();
  const key = text.trim().toLowerCase();
  const exact = index.get(key);
  if (exact || key.includes(' ')) return exact ?? null;
  for (const c of lemmaCandidates(key)) {
    const hit = index.get(c);
    if (hit) return hit;
  }
  return null;
}
