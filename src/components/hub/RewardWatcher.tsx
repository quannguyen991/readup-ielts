import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Text, View } from 'react-native';

import { BadgeUnlockOverlay, Flame, Pop } from './effects';
import { COSMIC } from './theme';
import { ALL_LESSONS } from '@/services/hub/grammar-course';
import { evaluateAchievements, type HubStats } from '@/services/hub/achievements';
import { emitReward, onReward, type Reward } from '@/services/hub/reward-bus';
import { playSfx } from '@/services/hub/sfx';
import { useBadgeSeenStore } from '@/store/useBadgeSeenStore';
import { useHubStore } from '@/store/useHubStore';
import { useStreak } from '@/store/useStudyStore';

/**
 * Theo dõi tiến độ học trong toàn khu Hub (đặt ở layout của Hub nên mọi màn học đều được bắt):
 * - mở khoá huy hiệu mới → màn chúc mừng có pháo giấy, pháo hoa, âm thanh;
 * - làm xong một nhiệm vụ → thông báo "+XP" ở dưới;
 * - chuỗi ngày tăng → thông báo chuỗi với ngọn lửa và âm thanh.
 */
export function RewardWatcher() {
  const doneByDay = useHubStore((s) => s.doneByDay);
  const lessonsDoneMap = useHubStore((s) => s.lessonsDone);
  const roleplayDone = useHubStore((s) => s.roleplayDone);
  const phonemeBest = useHubStore((s) => s.phonemeBest);
  const streak = useStreak().current;

  const totalDone = useMemo(() => Object.values(doneByDay).reduce((n, list) => n + list.length, 0), [doneByDay]);
  const stats: HubStats = useMemo(
    () => ({
      lessonsDone: Object.values(lessonsDoneMap).filter(Boolean).length,
      lessonsTotal: ALL_LESSONS.length,
      scenariosDone: Object.values(roleplayDone).filter((n) => n > 0).length,
      tasksDone: totalDone,
      streak,
      phonemeBest,
    }),
    [lessonsDoneMap, roleplayDone, totalDone, streak, phonemeBest],
  );
  const badges = useMemo(() => evaluateAchievements(stats), [stats]);

  // Khởi tạo: huy hiệu đã có sẵn từ trước được coi là đã xem (đợi dữ liệu máy đọc xong).
  const seenInit = useBadgeSeenStore((s) => s.initialized);
  const seen = useBadgeSeenStore((s) => s.seen);
  const initSeen = useBadgeSeenStore((s) => s.init);
  const markSeen = useBadgeSeenStore((s) => s.markSeen);
  const hydrated = useRef(false);
  useEffect(() => {
    if (seenInit) return;
    const run = () => {
      if (hydrated.current) return;
      hydrated.current = true;
      initSeen(evaluateAchievements(stats).filter((b) => b.unlocked).map((b) => b.id));
    };
    const persist = (useHubStore as unknown as { persist?: { hasHydrated: () => boolean; onFinishHydration: (f: () => void) => () => void } }).persist;
    if (!persist || persist.hasHydrated()) run();
    else persist.onFinishHydration(run);
  }, [seenInit, initSeen, stats]);

  const pendingBadge = seenInit ? badges.find((b) => b.unlocked && !seen[b.id]) ?? null : null;

  // Chuỗi ngày tăng: phát thông báo chuỗi (bỏ qua lần đầu vào màn).
  const prevStreak = useRef<number | null>(null);
  useEffect(() => {
    if (prevStreak.current !== null && streak > prevStreak.current && streak > 0) {
      emitReward({ kind: 'streak', title: `Chuỗi ${streak} ngày!`, streak });
      playSfx('streak');
    }
    prevStreak.current = streak;
  }, [streak]);

  // Thông báo phần thưởng nhỏ.
  const [toast, setToast] = useState<Reward | null>(null);
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    return onReward((r) => {
      setToast(r);
      fade.setValue(0);
      Animated.sequence([
        Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: false }),
        Animated.delay(2200),
        Animated.timing(fade, { toValue: 0, duration: 400, useNativeDriver: false }),
      ]).start(({ finished }) => {
        if (finished) setToast((cur) => (cur?.id === r.id ? null : cur));
      });
    });
  }, [fade]);

  return (
    <>
      <BadgeUnlockOverlay badge={pendingBadge} onClose={() => pendingBadge && markSeen(pendingBadge.id)} />
      {toast ? (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 28,
            alignItems: 'center',
            opacity: fade,
            transform: [{ translateY: fade.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
          }}
        >
          <Pop trigger={toast.id}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: COSMIC.line, shadowColor: '#2B2350', shadowOpacity: 0.18, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } }}>
              {toast.kind === 'streak' ? <Flame streak={toast.streak} /> : null}
              <View style={{ gap: 1 }}>
                <Text style={{ color: COSMIC.ink, fontSize: 14, fontWeight: '700' }}>{toast.title}</Text>
                {toast.kind === 'task' ? (
                  <Text style={{ color: COSMIC.primary, fontSize: 12, fontWeight: '700' }}>{`+${toast.xp} XP`}</Text>
                ) : null}
              </View>
            </View>
          </Pop>
        </Animated.View>
      ) : null}
    </>
  );
}
