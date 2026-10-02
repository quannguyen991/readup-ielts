import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useNavigation } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { draftKey, hasContent, parseDraft, serializeDraft, type ExamDraft } from './exam-draft';
import { keyboardInset } from './exam-layout';

const isWeb = Platform.OS === 'web' && typeof document !== 'undefined';

/**
 * Chỉnh trình duyệt cho màn làm bài trên điện thoại, chỉ trong lúc màn đang mở:
 *  - chặn kéo-xuống-để-tải-lại và hiệu ứng nảy cuối trang (mất bài vì lỡ tay vuốt),
 *  - chặn chạm đúp phóng to, bỏ khung xám khi chạm.
 * Gỡ sạch khi rời màn nên không ảnh hưởng các trang khác.
 */
export function useExamWebTweaks(): void {
  useEffect(() => {
    if (!isWeb) return;
    const style = document.createElement('style');
    style.setAttribute('data-exam-tweaks', '1');
    style.textContent =
      'html,body{overscroll-behavior:none;}' +
      'body *{-webkit-tap-highlight-color:transparent;}' +
      'button,[role=button],[role=tab],input,select,textarea{touch-action:manipulation;}';
    document.head.appendChild(style);
    return () => style.remove();
  }, []);
}

/** Rung nhẹ khi chọn đáp án. Tắt được bằng localStorage `band9.haptics = off`. */
export function haptic(ms = 8): void {
  if (!isWeb || typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  try {
    if (window.localStorage.getItem('band9.haptics') === 'off') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    navigator.vibrate(ms);
  } catch {
    /* trình duyệt chặn: bỏ qua */
  }
}

type WakeLockSentinelLike = { release: () => Promise<void> };

/** Giữ màn hình sáng khi `active` (Wake Lock API), xin lại khi quay lại tab. */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!isWeb || !active) return;
    const nav = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<WakeLockSentinelLike> } };
    if (!nav.wakeLock) return;
    let lock: WakeLockSentinelLike | null = null;
    let cancelled = false;
    const acquire = async () => {
      try {
        const l = await nav.wakeLock!.request('screen');
        if (cancelled) void l.release();
        else lock = l;
      } catch {
        /* pin yếu / bị từ chối: không sao */
      }
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') void acquire();
    };
    void acquire();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      void lock?.release().catch(() => undefined);
    };
  }, [active]);
}

/** Chiều cao bàn phím đang che màn hình (web, qua visualViewport). */
export function useKeyboardInset(): number {
  const [inset, setInset] = useState(0);
  useEffect(() => {
    if (!isWeb || !window.visualViewport) return;
    const vv = window.visualViewport;
    const update = () => setInset((prev) => {
      const next = keyboardInset(window.innerHeight, vv);
      return prev === next ? prev : next;
    });
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    update();
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);
  return inset;
}

/**
 * Tự lưu bản nháp (gỡ rung 500ms, ghi ngay khi ẩn tab / đóng trang) và nạp lại
 * một lần khi mở: bản nháp tìm được được đưa cho `onRestore` để màn cha áp vào state.
 */
export function useExamDraft(
  scope: string,
  id: string | undefined,
  state: { answers: Record<string, string>; marked: Record<string, boolean>; secondsLeft?: number },
  enabled: boolean,
  onRestore: (draft: ExamDraft) => void,
): { ready: boolean; clear: () => void } {
  const [ready, setReady] = useState(false);
  const restoreRef = useRef(onRestore);
  useEffect(() => {
    restoreRef.current = onRestore;
  }, [onRestore]);
  const latest = useRef(state);
  const dirty = useRef(false);
  const key = id ? draftKey(scope, id) : null;

  useEffect(() => {
    latest.current = state;
  }, [state]);

  useEffect(() => {
    if (!key) return;
    let alive = true;
    AsyncStorage.getItem(key)
      .then((raw) => {
        if (!alive) return;
        const d = parseDraft(raw);
        if (d) restoreRef.current(d);
        setReady(true);
      })
      .catch(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, [key]);

  const flush = useCallback(() => {
    if (!key || !dirty.current) return;
    dirty.current = false;
    const s = latest.current;
    if (!hasContent(s)) {
      void AsyncStorage.removeItem(key).catch(() => undefined);
      return;
    }
    void AsyncStorage.setItem(key, serializeDraft(s)).catch(() => undefined);
  }, [key]);

  useEffect(() => {
    if (!enabled || !ready || !key) return;
    dirty.current = true;
    const t = setTimeout(flush, 500);
    return () => clearTimeout(t);
  }, [state.answers, state.marked, enabled, ready, key, flush]);

  useEffect(() => {
    if (!isWeb) return;
    const onHide = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', flush);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, [flush]);

  const clear = useCallback(() => {
    dirty.current = false;
    if (key) void AsyncStorage.removeItem(key).catch(() => undefined);
  }, [key]);

  return { ready, clear };
}

/**
 * Hỏi lại trước khi rời màn đang làm dở (nút Thoát, vuốt/nhấn Back, đóng tab).
 * `confirm` trả true = cho đi. Bản nháp vẫn được giữ nên chữ "Thoát" không đáng sợ.
 */
let leaveAllowed = false;
/** Gọi ngay trước khi chủ động thoát (đã có hộp thoại xác nhận riêng) để lớp chặn Back không hỏi lần hai. */
export function allowLeave(): void {
  leaveAllowed = true;
}

export function useLeaveGuard(active: boolean, ask: () => boolean): void {
  const navigation = useNavigation();
  const askRef = useRef(ask);
  useEffect(() => {
    askRef.current = ask;
  }, [ask]);

  useEffect(() => {
    if (!active) return;
    leaveAllowed = false;
    const unsub = navigation.addListener('beforeRemove', (e) => {
      if (leaveAllowed) return;
      if (!askRef.current()) e.preventDefault();
    });
    let onUnload: ((e: BeforeUnloadEvent) => void) | null = null;
    if (isWeb) {
      onUnload = (e) => {
        if (leaveAllowed) return;
        e.preventDefault();
        e.returnValue = '';
      };
      window.addEventListener('beforeunload', onUnload);
    }
    return () => {
      unsub();
      if (onUnload) window.removeEventListener('beforeunload', onUnload);
    };
  }, [active, navigation]);
}
