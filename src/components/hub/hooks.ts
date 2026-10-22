import { playSfx } from '@/services/hub/sfx';
import { emitReward, taskLabel } from '@/services/hub/reward-bus';
import { XP_PER_TASK } from '@/services/hub/achievements';
import { useGameStore } from '@/store/useGameStore';
import { useHubStore } from '@/store/useHubStore';

/**
 * Đánh dấu một nhiệm vụ hằng ngày đã làm xong. Lần đầu trong ngày thì cộng vào bộ
 * đếm nhiệm vụ chung (để tiến độ mở sách đếm được). Làm lại trong ngày không cộng thêm.
 */
export function markTaskDone(day: string, taskId: string): boolean {
  const first = useHubStore.getState().completeTask(day, taskId);
  if (first) {
    useGameStore.setState((s) => ({ questsClaimed: (s.questsClaimed ?? 0) + 1 }));
    emitReward({ kind: 'task', title: taskLabel(taskId), xp: XP_PER_TASK });
    playSfx('complete');
  }
  return first;
}
