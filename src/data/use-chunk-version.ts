import { useEffect, useState, useSyncExternalStore } from 'react';

import { bodiesReady, chunkVersion, loadBodiesFor, subscribeChunks, type ArticleMeta } from './article-repository';

/**
 * Vẽ lại màn hình khi có chunk toàn văn vừa tải xong. Dùng ở component gọi
 * getArticleWithBody / getArticleBody trong lúc vẽ, và đưa giá trị trả về vào deps
 * của useMemo tương ứng.
 */
export function useChunkVersion(): number {
  return useSyncExternalStore(subscribeChunks, chunkVersion, chunkVersion);
}

/**
 * Chờ mọi chunk chứa các bài đã cho tải xong, rồi mới cho phép dựng màn hình.
 * Dùng cho các pipeline quét cả kho (sinh câu, bộ đề): quét giữa chừng sẽ ra
 * bộ câu khác với bộ đầy đủ, nên phải đợi.
 */
export function useBodiesReady(metas: ReadonlyArray<Pick<ArticleMeta, 'chunk'>>): boolean {
  const [ready, setReady] = useState(() => bodiesReady(metas));
  useEffect(() => {
    if (ready) return;
    let alive = true;
    void loadBodiesFor(metas).then(() => {
      if (alive) setReady(true);
    });
    return () => {
      alive = false;
    };
    // Kho bài là hằng số của app, nên chỉ chạy một lần khi màn mở.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return ready;
}
