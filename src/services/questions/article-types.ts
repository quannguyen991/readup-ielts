import type { ArticleMeta } from '@/data/article-repository';
import type { QuestionType } from '@/types/database';
import { blueprintFor, typesOf } from './blueprint';
import { IELTS_TYPES_ALL, canGenerate } from './ielts-types';
import type { QuestionSet } from './types';

/**
 * Bài này làm được những dạng nào — thứ thẻ bài ở thư viện hiển thị và bộ lọc dùng.
 *
 * BA TRẠNG THÁI, nói thật với người học:
 *   - `saved`   : đã có bộ đề lưu (đề người học tự tạo) — chip là dạng trong bộ ấy;
 *   - `default` : chưa tạo gì, nhưng mở lên là có đề mặc định dựng bằng luật ngay trên
 *                 máy — chip là dạng trong bản thiết kế passage (xem `blueprint.ts`);
 *   - `none`    : bài chỉ có link (đề chính thức) — không có đề để làm.
 *
 * Không nạp toàn văn: thẻ chỉ dùng metadata, nên dạng "có sẵn" suy từ bản thiết kế
 * tất định theo id bài chứ không dựng đề thật cho từng thẻ.
 */

export type TypeInfo = {
  types: QuestionType[];
  source: 'saved' | 'default' | 'none';
  /** Bộ đã lưu do AI tạo hay lùi về luật — để hiện nhãn đúng. */
  generatedBy?: 'ai' | 'offline';
};

/** Hai dạng bộ sinh SAT trong thư viện thật sự dựng được. */
export const SAT_DEFAULT_TYPES: QuestionType[] = ['sat_words_in_context', 'sat_inference'];

function positionOf(tier: string | null | undefined): 1 | 2 | 3 {
  return tier === 'p3' ? 3 : tier === 'p2' ? 2 : 1;
}

function uniq(types: QuestionType[]): QuestionType[] {
  return [...new Set(types)];
}

export function typeInfoFor(
  meta: Pick<ArticleMeta, 'id' | 'exam' | 'passageTier' | 'licenseType'>,
  set?: QuestionSet,
): TypeInfo {
  if (meta.licenseType === 'headline_only') return { types: [], source: 'none' };
  if (set && set.questions.length > 0) {
    return { types: uniq(set.questions.map((q) => q.type)), source: 'saved', generatedBy: set.generatedBy };
  }
  if (meta.exam === 'sat') return { types: SAT_DEFAULT_TYPES, source: 'default' };
  return { types: uniq(typesOf(blueprintFor(positionOf(meta.passageTier), meta.id))), source: 'default' };
}

export type TypeMatch = {
  match: boolean;
  /** Dạng đã chọn mà bài CÓ SẴN. */
  ready: QuestionType[];
  /** Dạng đã chọn mà bài chưa có nhưng TẠO ĐƯỢC. */
  makeable: QuestionType[];
};

/**
 * Bài có khớp bộ lọc dạng bài không. Chọn nhiều dạng = khớp BẤT KỲ dạng nào.
 * `includeMakeable` bật thì bài chưa có dạng đó nhưng tạo được (đủ chất liệu) cũng khớp —
 * mặc định bật, vì phần lớn dạng mới chỉ có sau khi tạo.
 */
export function matchTypes(
  meta: Pick<ArticleMeta, 'exam' | 'wordCount' | 'licenseType'>,
  info: TypeInfo,
  selected: readonly QuestionType[],
  includeMakeable: boolean,
): TypeMatch {
  if (selected.length === 0) return { match: true, ready: [], makeable: [] };
  const ready = selected.filter((t) => info.types.includes(t));
  const makeable =
    meta.exam === 'ielts' && meta.licenseType !== 'headline_only'
      ? selected.filter(
          (t) =>
            !info.types.includes(t) &&
            (IELTS_TYPES_ALL as readonly string[]).includes(t) &&
            canGenerate(t, { words: meta.wordCount }),
        )
      : [];
  return { match: ready.length > 0 || (includeMakeable && makeable.length > 0), ready, makeable };
}

/** Tối đa `max` chip, phần dư gộp thành "+n". */
export function chipSlice<T>(items: readonly T[], max = 3): { shown: T[]; more: number } {
  return { shown: items.slice(0, max), more: Math.max(0, items.length - max) };
}
