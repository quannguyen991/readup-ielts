import type { Assignment } from '@/services/classes/assignments';
import { findCatalogItem, KIND_LABEL } from '@/services/classes/catalog';

/**
 * Tên bài giao theo ngôn ngữ đang chọn. Máy chủ lưu tên tiếng Việt của nội dung
 * làm tiêu đề mặc định; trùng tên đó thì hiện bản song ngữ của danh mục, còn
 * tiêu đề giáo viên tự đặt thì giữ nguyên.
 */
export function assignmentTitle(a: Pick<Assignment, 'kind' | 'ref' | 'title'>, en: boolean): string {
  const item = findCatalogItem(a.kind, a.ref);
  if (item && a.title === item.title.vi) return en ? item.title.en : item.title.vi;
  return a.title;
}

export function kindLabel(kind: Assignment['kind'], en: boolean): string {
  return en ? KIND_LABEL[kind].en : KIND_LABEL[kind].vi;
}
