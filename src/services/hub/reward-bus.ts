/**
 * Kênh phát sự kiện phần thưởng của khu Hub: khi một việc học vừa hoàn thành (nhiệm vụ mới trong
 * ngày) hoặc chuỗi ngày tăng, nơi phát gọi `emitReward`; thành phần hiển thị (RewardWatcher) nhận
 * và bật thông báo. Tách riêng để màn học không phụ thuộc vào giao diện.
 */

export type Reward =
  | { id: number; kind: 'task'; title: string; xp: number }
  | { id: number; kind: 'streak'; title: string; streak: number };

type Listener = (r: Reward) => void;

const listeners = new Set<Listener>();
let counter = 0;

export function emitReward(r: { kind: 'task'; title: string; xp: number } | { kind: 'streak'; title: string; streak: number }): void {
  const full = { ...r, id: ++counter } as Reward;
  listeners.forEach((l) => l(full));
}

export function onReward(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Nhãn tiếng Việt cho một mã nhiệm vụ (ví dụ "grammar:a1-can" → "Bài ngữ pháp"). */
export function taskLabel(taskId: string): string {
  if (taskId.startsWith('grammar:')) return 'Hoàn thành bài ngữ pháp';
  if (taskId.startsWith('roleplay:')) return 'Hoàn thành tình huống nói';
  if (taskId.startsWith('dialogue:')) return 'Hoàn thành hội thoại';
  if (taskId.startsWith('phoneme:')) return 'Luyện âm đạt yêu cầu';
  return 'Hoàn thành nhiệm vụ';
}
