import { useEffect } from 'react';

import { useTopicStudyStore } from '@/store/useTopicStudyStore';

/** Mở một màn luyện là ghi mốc "Học lần cuối" cho bộ đó (thẻ bộ từ ở trang Quiz từ vựng). */
export function useDeckVisit(slug: string): void {
  useEffect(() => {
    if (slug) useTopicStudyStore.getState().touch(slug);
  }, [slug]);
}
