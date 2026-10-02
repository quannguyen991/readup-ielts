import type { QuestionType } from '@/types/database';
import { IELTS_TYPES_ALL, specOf, type MixBlock } from './ielts-types';

/** Trần tổng số câu một bộ trộn — chặn request ép model ra hàng trăm câu. */
export const MAX_MIX_TOTAL = 20;
export const MAX_MIX_BLOCKS = 4;

/**
 * Kiểm bộ trộn dạng bài nhận từ client. Trả `null` nếu hình dạng sai; trả danh sách
 * đã siết (số câu kẹp trong [min, max] của dạng, dạng không lặp) nếu dùng được.
 * `undefined` / mảng rỗng → `undefined` (không đặt bộ trộn nào).
 */
export function sanitizeBlocks(raw: unknown): MixBlock[] | undefined | null {
  if (raw === undefined || raw === null) return undefined;
  if (!Array.isArray(raw)) return null;
  if (raw.length === 0) return undefined;
  if (raw.length > MAX_MIX_BLOCKS) return null;

  const seen = new Set<QuestionType>();
  const out: MixBlock[] = [];
  let total = 0;
  for (const item of raw) {
    if (!item || typeof item !== 'object') return null;
    const { type, count } = item as { type?: unknown; count?: unknown };
    if (typeof type !== 'string' || !(IELTS_TYPES_ALL as readonly string[]).includes(type)) return null;
    const t = type as QuestionType;
    if (seen.has(t)) return null;
    seen.add(t);
    const spec = specOf(t);
    if (!spec) return null;
    const n = typeof count === 'number' ? Math.round(count) : spec.defaultCount;
    const clamped = Math.min(spec.maxCount, Math.max(spec.minCount, n));
    total += clamped;
    out.push({ type: t, count: clamped });
  }
  if (total > MAX_MIX_TOTAL) return null;
  return out;
}

/** Khoá cache của một bộ trộn — cùng khuôn ở máy chủ (cache chung) và ở máy học viên. */
export function blocksKey(blocks: { type: QuestionType; count: number }[]): string {
  return `mix:${blocks.map((b) => `${b.type}x${b.count}`).join(',')}`;
}
