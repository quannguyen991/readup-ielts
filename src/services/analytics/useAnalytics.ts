import { useEffect } from 'react';
import { Platform } from 'react-native';

import type { PlanId } from '@/lib/billing/plans';
import type { BillingCycle } from '@/services/payment/order';
import { useAuthStore } from '@/store/useAuthStore';

import { hasTrackers } from './config';
import { useConsentStore } from './consent';
import { applyConsent, track, trackOnce } from './track';

/** Tài khoản tạo trong ngần này thì lần đăng nhập đầu tính là một lượt đăng ký. */
const SIGNUP_WINDOW_MS = 30 * 60_000;

/** Đơn xác nhận cũ hơn ngần này thì không gửi nữa — gửi muộn là gán nhầm doanh thu cho hôm nay. */
const PURCHASE_LOOKBACK_MS = 7 * 86_400_000;

export type OrderForTracking = {
  id: string;
  plan: PlanId;
  billing_cycle: BillingCycle;
  amount_vnd: number;
  status: string;
  confirmed_at?: string | null;
};

export function trackPaidOrder(order: OrderForTracking): void {
  if (order.status !== 'paid' || order.amount_vnd <= 0) return;
  const confirmed = Date.parse(order.confirmed_at ?? '');
  if (Number.isFinite(confirmed) && Date.now() - confirmed > PURCHASE_LOOKBACK_MS) return;
  trackOnce(`purchase:${order.id}`, {
    name: 'purchase',
    plan: order.plan,
    cycle: order.billing_cycle,
    valueVnd: order.amount_vnd,
    orderId: order.id,
  });
}

/**
 * Nối đo lường vào vòng đời của app. Gọi một lần ở layout gốc.
 *
 * VÌ SAO ĐƠN ĐÃ TRẢ ĐƯỢC KIỂM LẠI Ở ĐÂY, không chỉ ở trang thanh toán: gói được
 * bật bằng tay, có khi vài giờ sau. Người mua hiếm khi để nguyên tab thanh toán
 * chờ tới lúc ấy — họ đóng tab, hôm sau mở app. Chỉ đếm ở trang thanh toán thì
 * phần lớn đơn thật không bao giờ tới được Meta, và chiến dịch tối ưu theo một
 * con số sai.
 */
export function useAnalyticsBootstrap(pathname: string): void {
  const enabled = Platform.OS === 'web' && hasTrackers();
  const hydrate = useConsentStore((s) => s.hydrate);
  const consent = useConsentStore((s) => s.consent);
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const createdAt = useAuthStore((s) => s.user?.created_at ?? null);

  useEffect(() => {
    if (enabled) hydrate();
  }, [enabled, hydrate]);

  useEffect(() => {
    if (enabled) applyConsent(consent);
  }, [enabled, consent]);

  useEffect(() => {
    if (!enabled || consent === 'denied') return;
    track({ name: 'page_view', path: pathname, url: `${window.location.origin}${pathname}` });
  }, [enabled, consent, pathname]);

  useEffect(() => {
    if (!enabled || consent === 'denied' || !userId || !createdAt) return;
    if (Date.now() - Date.parse(createdAt) > SIGNUP_WINDOW_MS) return;
    trackOnce(`signup:${userId}`, { name: 'sign_up' });
  }, [enabled, consent, userId, createdAt]);

  useEffect(() => {
    if (!enabled || consent === 'denied' || !userId) return;
    const token = useAuthStore.getState().session?.access_token;
    if (!token) return;

    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/payments/order', { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const body = (await res.json()) as { orders?: OrderForTracking[] };
        if (!cancelled) (body.orders ?? []).forEach(trackPaidOrder);
      } catch {
        // Đo lường hỏng thì im lặng: đây không phải lỗi của người dùng.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled, consent, userId]);
}
