/**
 * GIỜ NGHỈ KHI HỌC — ba phần, gắn một lần ở `app/_layout.tsx`:
 *
 *   BreakRunner   — đồng hồ chạy nền mỗi giây, đẩy tick vào store.
 *   BreakTimerPill — dòng "Học 12:34 · nghỉ sau 12:26" góc phải dưới, chỉ hiện trên màn học.
 *   BreakOverlay  — lớp phủ giờ nghỉ: mèo nằm trườn ra, đếm ngược, chặn cả phím tắt.
 *
 * Luật đếm và giờ nghỉ ở `services/break/break-clock.ts`. Chỉ chạy trên web; bản cài
 * điện thoại chưa có đồng hồ này.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Platform, Text, View, useWindowDimensions } from 'react-native';
import { usePathname } from 'expo-router';

import { CatMascot } from '@/components/mascot/CatMascot';
import { CatSticker } from '@/components/mascot/CatSticker';
import { useRewardStore } from '@/store/useRewardStore';
import { formatClock } from '@/services/break/break-clock';
import { isBreakExemptRoute, isStudyRoute } from '@/services/break/study-routes';
import { todayKey } from '@/store/persist';
import { useBreakStore } from '@/store/useBreakStore';
import { useL } from '@/i18n/useL';

/** Các sự kiện được coi là có người đang dùng máy. */
const ACTIVITY_EVENTS = ['pointerdown', 'pointermove', 'keydown', 'scroll', 'touchstart'] as const;

export function BreakLayer() {
  if (Platform.OS !== 'web') return null;
  return (
    <>
      <BreakRunner />
      <BreakTimerPill />
      <BreakOverlay />
    </>
  );
}

function BreakRunner() {
  const enabled = useBreakStore((s) => s.enabled);
  const pathname = usePathname();
  // Ref để vòng đếm đọc đường dẫn hiện tại mà không phải khởi động lại mỗi lần đổi trang.
  const pathRef = useRef(pathname);
  pathRef.current = pathname;

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;
    let lastActivity = Date.now();
    let last = Date.now();
    const touch = () => {
      lastActivity = Date.now();
    };
    // Khi đang nghỉ, chặn phím tắt của màn học (H, N, T…) và các phím khác để không học lén.
    const blockDuringBreak = (e: KeyboardEvent) => {
      if (useBreakStore.getState().clock.phase !== 'break') return;
      e.stopPropagation();
      e.preventDefault();
    };
    ACTIVITY_EVENTS.forEach((ev) => window.addEventListener(ev, touch, { passive: true, capture: true }));
    window.addEventListener('keydown', blockDuringBreak, true);

    const id = setInterval(() => {
      const now = Date.now();
      const gapMs = now - last;
      last = now;
      const path = pathRef.current;
      useBreakStore.getState().tick({
        now,
        today: todayKey(new Date(now)),
        gapMs,
        visible: document.visibilityState === 'visible',
        studyRoute: isStudyRoute(path),
        exempt: isBreakExemptRoute(path),
        lastActivityAt: lastActivity,
      });
    }, 1000);

    return () => {
      clearInterval(id);
      ACTIVITY_EVENTS.forEach((ev) => window.removeEventListener(ev, touch, true));
      window.removeEventListener('keydown', blockDuringBreak, true);
    };
  }, [enabled]);

  return null;
}

function BreakTimerPill() {
  const enabled = useBreakStore((s) => s.enabled);
  const phase = useBreakStore((s) => s.clock.phase);
  const studiedMs = useBreakStore((s) => s.clock.studiedMs);
  const studyMinutes = useBreakStore((s) => s.studyMinutes);
  const pathname = usePathname();
  const { L } = useL();
  const width = useWindowDimensions().width;

  if (!enabled || phase !== 'study' || !isStudyRoute(pathname)) return null;
  const studyMs = studyMinutes * 60_000;

  return (
    <View
      pointerEvents="none"
      style={
        {
          position: 'fixed' as 'absolute',
          right: 16,
          // Trên điện thoại phải nhường chỗ cho thanh tab dưới.
          bottom: width >= 1024 ? 16 : 84,
          zIndex: 70,
          borderRadius: 999,
          paddingHorizontal: 12,
          paddingVertical: 6,
          backgroundColor: '#1B1540',
          boxShadow: '0 6px 18px rgba(27,21,64,0.3)',
        } as object
      }
    >
      <Text className="font-heavy" style={{ fontSize: 12, color: '#FDE68A', fontVariantNumeric: 'tabular-nums' } as object}>
        {L('Học', 'Study')} {formatClock(studiedMs)} · {L('nghỉ sau', 'break in')} {formatClock(studyMs - studiedMs)}
      </Text>
    </View>
  );
}

function BreakOverlay() {
  const enabled = useBreakStore((s) => s.enabled);
  const phase = useBreakStore((s) => s.clock.phase);
  const breakEndsAt = useBreakStore((s) => s.clock.breakEndsAt);
  const { L } = useL();
  const chiikawa = useRewardStore((s) => s.theme === 'theme-chiikawa');
  const active = enabled && phase === 'break' && breakEndsAt !== null;

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [active]);

  if (!active || breakEndsAt === null) return null;
  const left = breakEndsAt - now;

  return (
    <View
      accessibilityLabel={L('Đang nghỉ', 'On a break')}
      style={
        {
          position: 'fixed' as 'absolute',
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 95,
          backgroundColor: '#FBF6EE',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        } as object
      }
    >
      {chiikawa ? <CatSticker pose="lie" size={220} /> : <CatMascot size={220} pose="lie" />}
      <Text className="font-heavy" style={{ marginTop: 8, fontSize: 28, color: '#1F2430', textAlign: 'center' }}>
        {L('Nghỉ một chút nhé', 'Time for a break')}
      </Text>
      <Text className="font-semi" style={{ marginTop: 8, fontSize: 15, color: '#4B5563', textAlign: 'center', maxWidth: 360 }}>
        {L(
          'Mèo ngủ rồi. Bạn đứng dậy, uống nước, nhìn xa khoảng 20 giây.',
          'The cat is asleep. Get up, drink some water, look at something far away for 20 seconds.',
        )}
      </Text>
      <Text className="font-heavy" style={{ marginTop: 20, fontSize: 56, color: '#1F2430', fontVariantNumeric: 'tabular-nums' } as object}>
        {formatClock(left)}
      </Text>
      <Text className="font-sans" style={{ marginTop: 4, fontSize: 13, color: '#6B7280' }}>
        {L('Hết giờ là tự học tiếp.', 'It resumes automatically when the time is up.')}
      </Text>
    </View>
  );
}
