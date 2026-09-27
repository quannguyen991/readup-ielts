import { useEffect, useRef } from 'react';
import { create } from 'zustand';

import { forgetMerged, markMerged, pushAll, syncAll } from '@/services/sync/engine';
import { registerAllSyncedStores } from '@/services/sync/stores';
import { useAuthStore } from './useAuthStore';
import { useMathStore } from './useMathStore';
import { useStudyStore } from './useStudyStore';
import { useVocabStore } from './useVocabStore';
import { useTopicStudyStore } from './useTopicStudyStore';
import { useGameStore } from './useGameStore';
import { useRewardStore } from './useRewardStore';
import { useBillingStore } from './useBillingStore';
import { useWeeklyStore } from './useWeeklyStore';
import { useSatRwStore } from './useSatRwStore';
import { useRoadmapStore } from './useRoadmapStore';

/**
 * Điều phối đồng bộ.
 *
 * BA THỜI ĐIỂM ĐỒNG BỘ, và chỉ ba:
 *
 *   1. Ngay sau khi đăng nhập — gộp hai chiều. Đây là lần quan trọng nhất: nó
 *      mang dữ liệu đang có trên máy vào tài khoản và kéo dữ liệu cũ về.
 *   2. Sau mỗi thay đổi, hoãn 8 giây — chỉ đẩy lên. Hoãn vì làm xong một bài là
 *      hàng loạt thay đổi liên tiếp; đẩy từng cái là hàng chục lượt ghi cho một
 *      việc.
 *   3. Khi người dùng tự bấm nút trong Cài đặt.
 *
 * KHÔNG đồng bộ theo chu kỳ. Một app học bài không có gì đổi khi người dùng
 * đang đọc, nên đánh thức mạng mỗi phút chỉ tốn pin.
 */

export type SyncStatus = 'idle' | 'syncing' | 'ok' | 'error';

type SyncState = {
  status: SyncStatus;
  lastSyncedAt: string | null;
  message: string | null;
  syncNow: (userId: string, mode?: 'merge' | 'push') => Promise<void>;
  reset: () => void;
};

export const useSyncStore = create<SyncState>()((set) => ({
  status: 'idle',
  lastSyncedAt: null,
  message: null,

  syncNow: async (userId, mode = 'merge') => {
    if (!userId) return;
    set({ status: 'syncing', message: null });

    const result = mode === 'merge' ? await syncAll(userId) : await pushAll(userId);

    if (result.ok) {
      if (mode === 'merge') markMerged(userId);
      set({ status: 'ok', lastSyncedAt: new Date().toISOString(), message: null });
      return;
    }

    // Chưa cấu hình máy chủ không phải lỗi — đó là trạng thái bình thường của
    // bản chạy cục bộ. Hiện chữ đỏ ở đây chỉ làm người dùng tưởng app hỏng.
    set({
      status: result.reason === 'not_configured' ? 'idle' : 'error',
      message: result.reason === 'not_configured' ? null : result.message,
    });
  },

  reset: () => set({ status: 'idle', lastSyncedAt: null, message: null }),
}));

/** Hoãn 8 giây sau thay đổi cuối cùng rồi mới đẩy lên. */
const PUSH_DEBOUNCE_MS = 8_000;

/**
 * Gắn một lần ở layout gốc.
 *
 * Đăng ký store trước khi lắng nghe, vì lần gộp đầu tiên có thể xảy ra ngay lập
 * tức nếu phiên đăng nhập đã được khôi phục từ ổ đĩa.
 */
registerAllSyncedStores();

export function useSyncBootstrap() {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const status = useAuthStore((s) => s.status);
  const syncNow = useSyncStore((s) => s.syncNow);
  const reset = useSyncStore((s) => s.reset);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousUser = useRef<string | null>(null);

  // Gộp hai chiều ngay khi có phiên đăng nhập.
  useEffect(() => {
    if (status !== 'signed_in' || !userId) {
      if (previousUser.current) {
        forgetMerged(previousUser.current);
        previousUser.current = null;
        reset();
      }
      return;
    }
    if (previousUser.current === userId) return;
    previousUser.current = userId;
    void syncNow(userId, 'merge');
  }, [reset, status, syncNow, userId]);

  // Đẩy lên sau khi ngừng thao tác.
  useEffect(() => {
    if (status !== 'signed_in' || !userId) return;

    const schedule = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void syncNow(userId, 'push'), PUSH_DEBOUNCE_MS);
    };

    const unsubscribers = [
      useMathStore.subscribe(schedule),
      useStudyStore.subscribe(schedule),
      useVocabStore.subscribe(schedule),
      useTopicStudyStore.subscribe(schedule),
      // Đổi quà, vé gói, XP trận đấu, đề tuần… cũng phải được đẩy lên, không chờ lần học kế tiếp.
      useGameStore.subscribe(schedule),
      useRewardStore.subscribe(schedule),
      useBillingStore.subscribe(schedule),
      useWeeklyStore.subscribe(schedule),
      useSatRwStore.subscribe(schedule),
      useRoadmapStore.subscribe(schedule),
    ];

    return () => {
      if (timer.current) clearTimeout(timer.current);
      for (const off of unsubscribers) off();
    };
  }, [status, syncNow, userId]);
}

export function useSyncLabel(): string {
  const status = useSyncStore((s) => s.status);
  const lastSyncedAt = useSyncStore((s) => s.lastSyncedAt);
  const message = useSyncStore((s) => s.message);

  if (status === 'syncing') return 'Đang đồng bộ…';
  if (status === 'error') return message ?? 'Đồng bộ lỗi';
  if (lastSyncedAt) {
    return `Đã đồng bộ lúc ${new Date(lastSyncedAt).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  }
  return 'Chưa đồng bộ';
}
