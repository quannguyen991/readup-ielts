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
  }
  return first;
}
