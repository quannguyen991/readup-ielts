/**
 * BỘ TỪ ĐỂ HỌC KHI DU NGOẠN — người học tự chọn nhiều bộ, hoặc bấm "Theo lộ trình".
 *
 * Thứ tự ưu tiên khi chọn từ cho câu hỏi (hàm thuần, xem `pick.ts`):
 *   1. bộ người học TỰ CHỌN;
 *   2. nếu chưa chọn: bộ từ vựng của trình độ trong Lộ trình học (bài chưa xong trước);
 *   3. nếu cả hai trống: bộ mặc định của từng địa điểm.
 * Không biết trình độ của người học thì KHÔNG đoán — không có mục 2.
 */
// Chỉ dùng chỉ mục mã bộ (không kéo kho từ vào bundle): module này được nạp ngay lúc mở app.
// Danh sách đầy đủ để chọn bộ nằm ở `deck-catalog.ts`.
import { DECK_SLUGS } from '@/data/vocab-index';
import type { Bi } from '@/i18n/useL';
import type { PathLevel } from '@/data/learning-path/types';

export const MAX_CHOSEN_DECKS = 12;
/** Số bộ tối đa của "Theo lộ trình". */
export const PATH_PRESET_SIZE = 6;

export type DeckOption = { slug: string; name: Bi; group: 'topic' | 'listening'; words: number };

const isRealDeck = (slug: string): boolean => DECK_SLUGS.has(slug);

/** Giữ mã còn tồn tại, bỏ trùng, cắt tối đa `MAX_CHOSEN_DECKS`. */
export function cleanDecks(list: unknown): string[] {
  if (!Array.isArray(list)) return [];
  const out: string[] = [];
  for (const x of list) {
    if (typeof x === 'string' && !out.includes(x) && isRealDeck(x)) out.push(x);
    if (out.length >= MAX_CHOSEN_DECKS) break;
  }
  return out;
}

/** Bộ từ vựng của một trình độ lộ trình: bài CHƯA xong trước, cùng thứ tự lộ trình. */
export function pathVocabDecks(level: PathLevel | null | undefined, isDone: (nodeId: string) => boolean, max = PATH_PRESET_SIZE): string[] {
  if (!level) return [];
  const nodes = level.parts.flatMap((p) => p.nodes).filter((n) => n.target.kind === 'vocab');
  const todo = nodes.filter((n) => !isDone(n.id));
  const rest = nodes.filter((n) => isDone(n.id));
  const out: string[] = [];
  for (const n of [...todo, ...rest]) {
    const slug = (n.target as { slug: string }).slug;
    if (!out.includes(slug) && isRealDeck(slug)) out.push(slug);
    if (out.length >= max) break;
  }
  return out;
}

export type FocusSource = 'chosen' | 'path' | 'none';

/** Bộ ưu tiên cho câu hỏi: tự chọn → theo lộ trình → không có (dùng bộ mặc định của địa điểm). */
export function resolveFocusDecks(input: { chosen?: readonly string[] | null; path?: readonly string[] | null }): { decks: string[]; source: FocusSource } {
  const chosen = cleanDecks(input.chosen ?? []);
  if (chosen.length) return { decks: chosen, source: 'chosen' };
  const path = cleanDecks(input.path ?? []);
  if (path.length) return { decks: path, source: 'path' };
  return { decks: [], source: 'none' };
}

/** Bật / tắt một bộ trong danh sách chọn (giữ thứ tự bấm, trần `MAX_CHOSEN_DECKS`). */
export function toggleDeck(list: readonly string[], slug: string): string[] {
  if (list.includes(slug)) return list.filter((x) => x !== slug);
  if (list.length >= MAX_CHOSEN_DECKS) return [...list];
  return [...list, slug];
}
