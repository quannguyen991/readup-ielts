import { useMemo } from 'react';

import { useHydrated } from '@/components/layout/useHydrated';
import type { PathData } from '@/services/learning-path/progress';
import { useLearningPathStore } from '@/store/useLearningPathStore';
import { useLessonStore } from '@/store/useLessonStore';
import { useMathStore } from '@/store/useMathStore';
import { useSatQuizStore } from '@/store/useSatQuizStore';
import { useSatRoadmapStore } from '@/store/useSatRoadmapStore';
import { useSatRwStore } from '@/store/useSatRwStore';
import { useSentenceStore } from '@/store/useSentenceStore';
import { useSpeakingStore } from '@/store/useSpeakingStore';
import { useStudyStore } from '@/store/useStudyStore';
import { useTopicStudyStore } from '@/store/useTopicStudyStore';
import { useWritingStore } from '@/store/useWritingStore';

const EMPTY: PathData = { synced: true };

/**
 * Dữ liệu học TRÊN MÁY NÀY cho màn Lộ trình học — đọc thẳng các kho zustand
 * (đã gộp với bản đồng bộ). Lượt vẽ đầu (trước hydrate) trả rỗng để khớp bản
 * dựng phía máy chủ.
 */
export function usePathData(): PathData {
  const hydrated = useHydrated();
  const sessions = useStudyStore((s) => s.sessions);
  const progress = useStudyStore((s) => s.progress);
  const stages = useTopicStudyStore((s) => s.stages);
  const lastAt = useTopicStudyStore((s) => s.lastAt);
  const roadmap = useSatRoadmapStore((s) => s.progress);
  const mathSessions = useMathStore((s) => s.sessions);
  const attempts = useSpeakingStore((s) => s.attempts);
  const sentenceSessions = useSentenceStore((s) => s.sessions);
  const submissions = useWritingStore((s) => s.submissions);
  const lessons = useLessonStore((s) => s.done);
  const satRw = useSatRwStore((s) => s.attempts);
  const satQuiz = useSatQuizStore((s) => s.best);
  const manual = useLearningPathStore((s) => s.manual);

  return useMemo<PathData>(() => {
    if (!hydrated) return EMPTY;
    return {
      synced: true,
      study: { sessions, progress },
      topicStudy: { stages, lastAt },
      satRoadmap: { progress: roadmap },
      math: { sessions: mathSessions },
      speaking: { attempts },
      sentence: { sessions: sentenceSessions },
      writing: { submissions },
      lessons,
      satRw,
      satQuiz,
      manual,
    };
  }, [hydrated, sessions, progress, stages, lastAt, roadmap, mathSessions, attempts, sentenceSessions, submissions, lessons, satRw, satQuiz, manual]);
}
