/**
 * Phía trình duyệt của thông báo đẩy: kiểm hỗ trợ, đăng ký `/sw.js`, xin quyền,
 * `pushManager.subscribe` bằng khoá VAPID công khai. Không có gì chạy ở native.
 */
import { Platform } from 'react-native';

export const VAPID_PUBLIC_KEY = process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY ?? '';

export type PushSupport = 'ok' | 'unsupported' | 'ios-install';

function isIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  // iPadOS 13+ tự xưng là Mac; phân biệt bằng màn cảm ứng.
  return /iPad|iPhone|iPod/u.test(ua) || (navigator.platform === 'MacIntel' && (navigator.maxTouchPoints ?? 0) > 1);
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true || !!window.matchMedia?.('(display-mode: standalone)').matches;
}

export function pushSupport(): PushSupport {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || typeof navigator === 'undefined') return 'unsupported';
  // iPhone/iPad (iOS 16.4+) chỉ có Web Push khi mở từ biểu tượng ngoài màn hình chính.
  if (isIos() && !isStandalone()) return 'ios-install';
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return 'unsupported';
  return 'ok';
}

export function notificationPermission(): NotificationPermission | 'unsupported' {
  return typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported';
}

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(padded);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

async function registration(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration('/');
  if (existing) return existing;
  await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  return navigator.serviceWorker.ready;
}

/** Đăng ký đẩy của máy này nếu đã có (không xin quyền, không tạo mới). */
export async function currentSubscription(): Promise<PushSubscription | null> {
  if (pushSupport() !== 'ok') return null;
  const reg = await navigator.serviceWorker.getRegistration('/');
  return reg ? reg.pushManager.getSubscription() : null;
}

export type SubscribeOutcome = { ok: true; subscription: PushSubscriptionJSON } | { ok: false; reason: 'denied' | 'dismissed' | 'unsupported' | 'error'; message?: string };

/** Xin quyền rồi đăng ký. Phải gọi trong một thao tác bấm của người dùng (Safari bắt buộc). */
export async function subscribePush(): Promise<SubscribeOutcome> {
  if (pushSupport() !== 'ok' || !VAPID_PUBLIC_KEY) return { ok: false, reason: 'unsupported' };
  try {
    const permission = Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission;
    if (permission === 'denied') return { ok: false, reason: 'denied' };
    if (permission !== 'granted') return { ok: false, reason: 'dismissed' };
    const reg = await registration();
    const sub =
      (await reg.pushManager.getSubscription()) ??
      (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) }));
    return { ok: true, subscription: sub.toJSON() };
  } catch (err) {
    return { ok: false, reason: 'error', message: err instanceof Error ? err.message : String(err) };
  }
}

/** Huỷ đăng ký trên máy này; trả endpoint vừa huỷ để báo máy chủ xoá. */
export async function unsubscribePush(): Promise<string | null> {
  const sub = await currentSubscription();
  if (!sub) return null;
  const endpoint = sub.endpoint;
  await sub.unsubscribe().catch(() => false);
  return endpoint;
}
