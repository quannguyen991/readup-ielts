import { useMemo } from 'react';

import type { StudentData } from '@/services/classes/assignments';
import { useMathStore } from '@/store/useMathStore';
import { useSatRoadmapStore } from '@/store/useSatRoadmapStore';
import { useSpeakingStore } from '@/store/useSpeakingStore';
import { useStudyStore } from '@/store/useStudyStore';
import { useTopicStudyStore } from '@/store/useTopicStudyStore';

/**
 * Dữ liệu học TRÊN MÁY NÀY, cùng hình dạng máy chủ đọc cho giáo viên — để học
 * sinh thấy bài giao đã xong ngay khi vừa làm, không phải chờ đồng bộ. Luật tính
 * "xong" là một (`services/classes/assignments.ts`).
 */
export function useLocalStudentData(): StudentData {
  const daily = useStudyStore((s) => s.daily);
  const stages = useTopicStudyStore((s) => s.stages);
  const lastAt = useTopicStudyStore((s) => s.lastAt);
  const progress = useSatRoadmapStore((s) => s.progress);
  const sessions = useMathStore((s) => s.sessions);
  const attempts = useSpeakingStore((s) => s.attempts);
  return useMemo(
    () => ({
      synced: true,
      study: { daily },
      topicStudy: { stages, lastAt },
      satRoadmap: { progress },
      math: { sessions },
      speaking: { attempts },
    }),
    [daily, stages, lastAt, progress, sessions, attempts],
  );
}
