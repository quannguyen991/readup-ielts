import { useMemo } from 'react';

import { buildIslands, type Island } from '@/services/world/islands';
import { useLessonStore } from '@/store/useLessonStore';
import { useGameStore } from '@/store/useGameStore';
import { useSentenceStore } from '@/store/useSentenceStore';
import { useTopicStudyStore } from '@/store/useTopicStudyStore';

/** Sáu đảo của bản đồ ReadUp, tính từ tiến độ thật trong các kho (tự cập nhật khi học xong bài). */
export function useWorldIslands(): Island[] {
  const lessonDone = useLessonStore((s) => s.done);
  const stages = useTopicStudyStore((s) => s.stages);
  const sessions = useSentenceStore((s) => s.sessions);
  const enemiesDefeated = useGameStore((s) => s.enemyIndex);
  return useMemo(() => {
    const dictationSets = new Set<string>();
    const translationSets = new Set<string>();
    for (const s of sessions) {
      if (!s.setId) continue;
      (s.mode === 'dictation' ? dictationSets : translationSets).add(s.setId);
    }
    return buildIslands({ lessonDone, stages, dictationSets, translationSets, enemiesDefeated });
  }, [lessonDone, stages, sessions, enemiesDefeated]);
}
